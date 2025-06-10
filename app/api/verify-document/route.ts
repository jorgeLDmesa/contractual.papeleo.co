import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentName = formData.get('documentName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!documentName) {
      return NextResponse.json({ error: 'No document name provided' }, { status: 400 });
    }

    // Convert file to buffer and then to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const contents = [
        { 
          text: `Analyze this document and determine if it corresponds to: "${documentName}". 
          
          Look at the content, title, headers, and overall structure of the document. 
          
          If this document appears to be related to "${documentName}" or contains information that would be expected in such a document, respond with "true".
          If this document is clearly something else or unrelated to "${documentName}", respond with "false".
          
          Only respond with the word "true" or "false", nothing else.` 
        },
        {
            inlineData: {
                mimeType: file.type,
                data: base64Data
            }
        }
    ];


    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents
    });

    const responseText = response.text?.trim().toLowerCase() || '';
    const isValid = responseText === 'true';


    return NextResponse.json({ 
      success: true, 
      isValid,
      message: isValid ? 'Document verified successfully' : 'Document does not match the expected type',
      debug: {
        fileName: file.name,
        expectedType: documentName,
        geminiResponse: responseText
      }
    });

  } catch (error) {
    console.error('Error verifying document:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error verifying document',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
