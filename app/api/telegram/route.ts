import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Types
type RequiredDocuments = {
  name: string;
};

interface ContractualDocument {
  id: string;
  url: string | null;
  required_document_id: string;
  required_documents: RequiredDocuments;
}

// Telegram types
interface TelegramKeyboard {
  text: string;
  callback_data: string;
}

interface TelegramMessageOptions {
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: {
    inline_keyboard: TelegramKeyboard[][];
  };
  disable_web_page_preview?: boolean;
}

// Environment variables validation
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('Missing TELEGRAM_BOT_TOKEN');
if (!process.env.CONTRACT_MEMBER_ID) throw new Error('Missing CONTRACT_MEMBER_ID');

// Constants
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CONTRACT_MEMBER_ID = process.env.CONTRACT_MEMBER_ID;

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function sendTelegramMessage(chatId: number | string, text: string, extra: TelegramMessageOptions = {}) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...extra,
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}

async function answerCallbackQuery(callback_query_id: string) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error answering callback query:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle regular message
    if (body.message) {
      return await handleMessage(body.message);
    }

    // Handle callback query
    if (body.callback_query) {
      return await handleCallbackQuery(body.callback_query);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

async function handleMessage(message: { chat: { id: number | string } }) {
  const chatId = message.chat.id;

  try {
    const { data, error } = await supabase
      .from('contractual_documents')
      .select('id, url, required_document_id, required_documents:required_documents(name)')
      .eq('contract_member_id', CONTRACT_MEMBER_ID)
      .is('deleted_at', null);

    if (error) throw error;
    if (!data || data.length === 0) {
      await sendTelegramMessage(chatId, "No tienes documentos requeridos aún.");
      return NextResponse.json({ ok: true });
    }

    const documents = data as unknown as ContractualDocument[];
    const keyboard = documents.map(doc => [{
      text: doc.required_documents?.name || 'Documento',
      callback_data: `GET_DOC_${doc.id}`
    }]);

    await sendTelegramMessage(chatId, "Selecciona el documento que deseas consultar:", {
      reply_markup: { inline_keyboard: keyboard }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error handling message:', error);
    await sendTelegramMessage(chatId, "❌ Error consultando documentos.");
    return NextResponse.json({ ok: false, error: 'Error processing message' }, { status: 500 });
  }
}

async function handleCallbackQuery(callbackQuery: { 
  message: { chat: { id: number | string } }, 
  data: string,
  id: string 
}) {
  const chatId = callbackQuery.message.chat.id;
  const docId = callbackQuery.data.replace('GET_DOC_', '');

  try {
    const { data, error } = await supabase
      .from('contractual_documents')
      .select('url, required_documents:required_documents(name)')
      .eq('id', docId)
      .single();

    if (error) throw error;

    const document = data as unknown as ContractualDocument;
    const documentName = document?.required_documents?.name ?? 'Documento';
    const text = !document || !document.url
      ? `❗️El documento *${documentName}* aún no ha sido subido.`
      : `✅ *${documentName}*\n[Ver documento](${document.url})`;

    await sendTelegramMessage(chatId, text, { 
      parse_mode: "Markdown", 
      disable_web_page_preview: true 
    });
    await answerCallbackQuery(callbackQuery.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error handling callback query:', error);
    await sendTelegramMessage(chatId, "❌ Error al obtener el documento.");
    return NextResponse.json({ ok: false, error: 'Error processing callback query' }, { status: 500 });
  }
}
