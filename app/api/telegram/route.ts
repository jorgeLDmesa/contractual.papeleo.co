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
if (!process.env.NEXT_PUBLIC_SITE_URL) throw new Error('Missing NEXT_PUBLIC_SITE_URL');

// Constants
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function sanitizeFileName(fileName: string) {
  // Replace spaces with underscores
  let sanitized = fileName.replace(/\s+/g, '_');
  // Remove special characters except for underscore, hyphen, and period
  sanitized = sanitized.replace(/[^a-zA-Z0-9-_\.]/g, '');
  return sanitized;
}

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
    
    // Handle document upload
    if (body.message && body.message.document) {
      console.log('Processing document upload:', body.message);
      return await handleDocumentUpload(body.message);
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

async function verifyDocumentWithAI(file: ArrayBuffer, fileName: string, documentName: string, mimeType: string): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new FormData();
    const blob = new Blob([file], { type: mimeType });
    formData.append('file', blob, fileName);
    formData.append('documentName', documentName);

    // We need the full URL since we're calling this from a serverless function
    const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/verify-document`;
    
    const response = await fetch(verifyUrl, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error verifying document');
    }

    if (!result.isValid) {
      return { success: false, error: '❌ La IA detectó que este documento no es el correcto' };
    }

    return { success: true };
  } catch (error) {
    console.error('AI Verification Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

async function handleDocumentUpload(message: {
  chat: { id: number | string };
  document: { file_id: string; file_name: string; mime_type: string; };
}) {
  const chatId = message.chat.id;

  const { data: state, error: stateError } = await supabaseAdmin
    .from('telegram_upload_state')
    .select('*')
    .eq('chat_id', chatId)
    .single();

  if (stateError || !state) {
    await sendTelegramMessage(chatId, 'Por favor, primero selecciona el documento que deseas subir.');
    return NextResponse.json({ ok: true });
  }

  const { doc_id: docId, doc_name: docName, month } = state;

  try {
    await sendTelegramMessage(chatId, `Subiendo ${docName}...`);

    // Fetch memberId from the contractual document
    const { data: docData, error: docError } = await supabaseAdmin
      .from('contractual_documents')
      .select('contract_member_id')
      .eq('id', docId)
      .single();

    if (docError || !docData) {
      console.error('Error fetching member ID:', docError);
      throw new Error('No se pudo verificar la información del documento.');
    }
    const memberId = docData.contract_member_id;

    // 1. Get file path from Telegram
    const fileResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${message.document.file_id}`);
    const fileData = await fileResponse.json();
    if (!fileData.ok) {
      throw new Error('Failed to get file info from Telegram.');
    }
    const filePath = fileData.result.file_path;

    // 2. Download file
    const fileContentResponse = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`);
    const fileContent = await fileContentResponse.arrayBuffer();

    // AI verification for pre-contractual documents
    if (!month) {
      const verification = await verifyDocumentWithAI(fileContent, message.document.file_name, docName, message.document.mime_type);
      if (!verification.success) {
        await sendTelegramMessage(chatId, verification.error || 'Error de verificación.');
        // Clean up state
        await supabaseAdmin.from('telegram_upload_state').delete().eq('chat_id', chatId);
        return NextResponse.json({ ok: true });
      }
    }

    // 3. Upload to Supabase Storage
    const sanitizedFileName = sanitizeFileName(message.document.file_name);
    const folder = month ? 'contractualdocuments' : 'precontractualdocuments';
    const path = `${folder}/${memberId}/${sanitizedFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('contractual')
      .upload(path, fileContent, {
        contentType: message.document.mime_type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      throw new Error('Error al subir el archivo.');
    }

    // 4. Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('contractual')
      .getPublicUrl(path);
      
    const publicUrl = urlData.publicUrl;

    // 5. Update contractual_documents table
    // If there's no month, it's a pre-contractual document and we just update the URL.
    // If there is a month, we also set it.
    const updatePayload: { url: string; month?: string } = { url: publicUrl };
    if (month) {
      updatePayload.month = month;
    }

    const { error: dbError } = await supabaseAdmin
      .from('contractual_documents')
      .update(updatePayload)
      .eq('id', docId);

    if (dbError) {
      console.error('Error updating database:', dbError);
      throw new Error('Error al actualizar la base de datos.');
    }
    
    if (!month) {
       await sendTelegramMessage(chatId, `✅ El documento "${docName}" ha sido subido y verificado.`);
    } else {
       await sendTelegramMessage(chatId, `✅ El documento "${docName}" ha sido subido.`);
    }


    // Clean up state
    await supabaseAdmin.from('telegram_upload_state').delete().eq('chat_id', chatId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error handling document upload:', error);
    await sendTelegramMessage(chatId, '❌ Hubo un error al subir tu documento.');
    await supabaseAdmin.from('telegram_upload_state').delete().eq('chat_id', chatId);
    return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 500 });
  }
}

async function handleMessage(message: {
  chat: { id: number | string };
  text?: string;
  contact?: { phone_number: string };
}) {
  const chatId = message.chat.id; // This is the telegram_id
  console.log('Handling message for chat ID (telegram_id):', chatId);

  // If user shares contact info, handle it.
  if (message.contact) {
    const phoneNumber = message.contact.phone_number.replace(/\D/g, '');

    // Update the user's record with their telegram_id for future use.
    // We don't block on this failing, just log it. The RPC is the source of truth for user existence.
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ telegram_id: chatId })
      .eq('telefono', phoneNumber);

    if (updateError) {
      console.error(`Could not update telegram_id for phone ${phoneNumber}:`, updateError.message);
    } else {
      console.log(`Updated telegram_id for user with phone ${phoneNumber}.`);
    }

    return await getDocumentsByPhone(chatId, phoneNumber);
  }

  // If no contact info is provided, check if we already know the user by telegram_id.
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('telefono')
    .eq('telegram_id', chatId)
    .single();

  if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching user by telegram_id:', userError);
    await sendTelegramMessage(chatId, '❌ Ocurrió un error al verificar tu cuenta.');
    return NextResponse.json({ ok: false, error: 'Error fetching user' }, { status: 500 });
  }

  // If user is found, get documents directly.
  if (user && user.telefono) {
    return await getDocumentsByPhone(chatId, user.telefono.toString());
  }

  // If user is not found and no contact was shared, ask for phone number.
  await sendTelegramMessage(
    chatId,
    'Hola 👋, para consultar tus documentos pendientes por favor comparte tu número de teléfono.',
    {
      reply_markup: {
        keyboard: [[{ text: 'Compartir mi número de teléfono', request_contact: true }]],
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    }
  );
  return NextResponse.json({ ok: true });
}

async function getDocumentsByPhone(chatId: number | string, phoneNumber: string) {
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
      const callback_data = `UPLOAD_DOC|${doc.id}|${doc.name}${doc.month ? `|${doc.month}` : ''}`;
      return [{ text, callback_data }];
    });

    await sendTelegramMessage(chatId, 'Selecciona el documento pendiente que deseas subir:', {
      reply_markup: { inline_keyboard: keyboard },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error handling getDocumentsByPhone:', error);
    await sendTelegramMessage(chatId, '❌ Error consultando tus documentos pendientes.');
    return NextResponse.json({ ok: false, error: 'Error processing message' }, { status: 500 });
  }
}

async function handleCallbackQuery(callbackQuery: { 
  message: { chat: { id: number | string } }, 
  data: string,
  id: string 
}) {
  const chatId = callbackQuery.message.chat.id;
  const callbackData = callbackQuery.data;

  await answerCallbackQuery(callbackQuery.id);
  
  if (callbackData.startsWith('UPLOAD_DOC|')) {
    const [, docId, docName, month] = callbackData.split('|');
    
    // Store user's intent to upload a specific document in the database
    const { error } = await supabaseAdmin.from('telegram_upload_state').upsert({
      chat_id: chatId,
      doc_id: docId,
      doc_name: docName,
      month: month || null,
    });

    if (error) {
      console.error('Error saving upload state:', error);
      await sendTelegramMessage(chatId, 'Hubo un error al preparar la subida. Por favor, inténtalo de nuevo.');
      return NextResponse.json({ ok: false, error: 'State save failed' });
    }

    await sendTelegramMessage(chatId, `Por favor, sube el archivo para "${docName}${month ? ` (${month})` : ''}".`);
    return NextResponse.json({ ok: true });
  }
  
  if (callbackData.startsWith('GET_DOC_')) {
      const docId = callbackData.replace('GET_DOC_', '');
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
        
        return NextResponse.json({ ok: true });
      } catch (error) {
        console.error('Error handling callback query:', error);
        await sendTelegramMessage(chatId, "❌ Error al obtener el documento.");
        return NextResponse.json({ ok: false, error: 'Error processing callback query' }, { status: 500 });
      }
  }

  return NextResponse.json({ ok: true });
}
