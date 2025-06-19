import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/service-role';

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

interface KeyboardButton {
  text: string;
  request_contact?: boolean;
}

interface TelegramMessageOptions {
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: {
    inline_keyboard?: TelegramKeyboard[][];
    keyboard?: KeyboardButton[][];
    one_time_keyboard?: boolean;
    resize_keyboard?: boolean;
  };
  disable_web_page_preview?: boolean;
}

// Environment variables validation
if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('Missing TELEGRAM_BOT_TOKEN');

// Constants
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId: number | string, text: string, extra: TelegramMessageOptions = {}) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    console.log('Sending message to Telegram:', { chatId, text, extra });
    
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
      const errorData = await response.text();
      throw new Error(`Telegram API error: ${response.statusText}. Details: ${errorData}`);
    }

    const responseData = await response.json();
    console.log('Telegram API response:', responseData);
    return responseData;
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
      const errorData = await response.text();
      throw new Error(`Telegram API error: ${response.statusText}. Details: ${errorData}`);
    }
  } catch (error) {
    console.error('Error answering callback query:', error);
    throw error;
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Webhook is active' });
}

export async function POST(req: NextRequest) {
  try {
    console.log('Received webhook request');
    const body = await req.json();
    console.log('Webhook body:', JSON.stringify(body, null, 2));

    // Simple echo message for testing
    if (body.message?.text === '/test') {
      const chatId = body.message.chat.id;
      await sendTelegramMessage(chatId, '✅ Bot is working correctly!');
      return NextResponse.json({ ok: true });
    }

    // Handle regular message
    if (body.message) {
      console.log('Processing message:', body.message);
      return await handleMessage(body.message);
    }

    // Handle callback query
    if (body.callback_query) {
      console.log('Processing callback query:', body.callback_query);
      return await handleCallbackQuery(body.callback_query);
    }

    console.log('No message or callback query found in request');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

async function handleMessage(message: {
  chat: { id: number | string };
  text?: string;
  contact?: { phone_number: string };
}) {
  const chatId = message.chat.id;
  console.log('Handling message for chat ID:', chatId);

  if (message.contact) {
    const phoneNumber = message.contact.phone_number.replace(/\D/g, '');

    try {
      const { data, error } = await supabaseAdmin.rpc('get_pending_documents_by_phone', {
        user_phone: phoneNumber,
      });

      if (error) {
        console.error('Error calling RPC:', error);
        throw error;
      }

      console.log('RPC result:', JSON.stringify(data, null, 2));

      if (!data || data.length === 0) {
        await sendTelegramMessage(chatId, 'No tienes documentos pendientes.');
        return NextResponse.json({ ok: true });
      }

      if (data[0] && data[0].error) {
        await sendTelegramMessage(chatId, `Error: ${data[0].error}`);
        return NextResponse.json({ ok: true });
      }

      const documents = data as { id: string; name: string; month?: string }[];
      const keyboard = documents.map((doc) => {
        const text = doc.month ? `${doc.name} (Mes: ${doc.month})` : doc.name;
        return [{ text, callback_data: `GET_DOC_${doc.id}` }];
      });

      await sendTelegramMessage(chatId, 'Selecciona el documento pendiente que deseas consultar:', {
        reply_markup: { inline_keyboard: keyboard },
      });

      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error('Error handling message:', error);
      await sendTelegramMessage(chatId, '❌ Error consultando tus documentos pendientes.');
      return NextResponse.json({ ok: false, error: 'Error processing message' }, { status: 500 });
    }
  } else {
    await sendTelegramMessage(
      chatId,
      'Hola 👋, para consultar tus documentos pendientes por favor comparte tu número de teléfono.',
      {
        reply_markup: {
          keyboard: [
            [
              {
                text: 'Compartir mi número de teléfono',
                request_contact: true,
              },
            ],
          ],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      }
    );
    return NextResponse.json({ ok: true });
  }
}

async function handleCallbackQuery(callbackQuery: { 
  message: { chat: { id: number | string } }, 
  data: string,
  id: string 
}) {
  const chatId = callbackQuery.message.chat.id;
  const docId = callbackQuery.data.replace('GET_DOC_', '');
  console.log('Handling callback query:', { chatId, docId });

  try {
    const { data, error } = await supabaseAdmin
      .from('contractual_documents')
      .select('url, required_documents:required_documents(name)')
      .eq('id', docId)
      .single();

    console.log('Supabase query result:', { data, error });

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
