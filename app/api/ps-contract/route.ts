import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    console.log('Intentando crear tabla en Google Docs...');
    
    // Obtener el input del usuario
    const body = await request.json();
    const { objetoParafraseado } = body;

    if (!objetoParafraseado) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Se requiere el objeto parafraseado para generar el contrato'
        },
        { status: 400 }
      );
    }
    
    // Usar la misma estructura de autenticación que add-to-sheet
    const serviceAccountAuth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/documents'],
    });

    // Crear cliente de Google Docs
    const docs = google.docs({ version: 'v1', auth: serviceAccountAuth });

    const documentId = '1_OiSHZxNf1LdiAQOj-GLWVQe7svbktD9CSJkSkk8g2M';

    // Obtener el documento para saber dónde insertar la tabla
    const doc = await docs.documents.get({
      documentId,
    });

    const endIndex = doc.data.body?.content?.[doc.data.body.content.length - 1]?.endIndex || 1;

    // Datos para la tabla (13 filas x 2 columnas)
    const tablaDatos = [
      ["NOMBRE DEL CONTRATANTE", "NOMBRE ORGANIZACIÓN"],
      ["NIT DEL CONTRATANTE", "NIT"],
      ["DIRECCIÓN DEL CONTRATANTE", "DIRECCIÓN CONTRATANTE"],
      ["NOMBRE REPRESENTANTE LEGAL", "REPRESENTANTE LEGAL"],
      ["IDENTIFICACIÓN REPRESENTANTE LEGAL", "IDENTIFICACIÓN"],
      ["NOMBRE DEL CONTRATISTA", "NOMBRE DEL CONTRATISTA"],
      ["IDENTIFICACIÓN CONTRATISTA", "IDENTIFICACIÓN"],
      ["DIRECCIÓN DEL CONTRATISTA", "DIRECCIÓN DEL CONTRATISTA"],
      ["TELÉFONO CONTRATISTA", "TELÉFONO CONTRATISTA"],
      ["VALOR TOTAL DEL CONTRATO", "$"],
      ["VALOR MENSUAL DEL CONTRATO", "VALOR MENSUAL DEL CONTRATO"],
      ["FORMA DE PAGO", "AL FINALIZAR EL CONTRATO"],
      ["PLAZO", "PLAZO"]
    ];

    // Paso 1: Insertar la tabla vacía con 13 filas y 2 columnas
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertTable: {
              rows: 13,
              columns: 2,
              location: {
                index: endIndex - 1,
              },
            },
          },
        ],
      },
    });

    // Paso 2: Obtener el documento actualizado para encontrar los índices de las celdas
    const updatedDoc = await docs.documents.get({
      documentId,
    });

    // Encontrar la tabla recién creada
    let tableElement = null;
    for (const element of updatedDoc.data.body?.content || []) {
      if (element.table) {
        tableElement = element;
        break;
      }
    }

    if (!tableElement?.table) {
      throw new Error('No se pudo encontrar la tabla creada');
    }

    // Paso 3: Insertar contenido y aplicar formato
    const table = tableElement.table;
    
    // Primero: Recopilar solo las inserciones de texto
    const textInserts = [];
    
    for (let row = 0; row < 13; row++) {
      for (let col = 0; col < 2; col++) {
        const cell = table.tableRows?.[row]?.tableCells?.[col];
        const paragraph = cell?.content?.[0]?.paragraph;
        const startIndex = cell?.content?.[0]?.startIndex;
        
        if (paragraph && startIndex !== undefined && startIndex !== null) {
          const cellStartIndex = startIndex;
          const text = tablaDatos[row][col];
          
          // Solo insertar texto
          textInserts.push({
            insertText: {
              location: {
                index: cellStartIndex,
              },
              text: text,
            },
          });
        }
      }
    }

    // Insertar todo el texto primero (en orden inverso)
    textInserts.reverse();
    
    if (textInserts.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: textInserts,
        },
      });
    }

    // Paso 4: Obtener el documento actualizado para calcular los nuevos índices
    const finalDoc = await docs.documents.get({
      documentId,
    });

    // Encontrar la tabla actualizada
    let updatedTableElement = null;
    for (const element of finalDoc.data.body?.content || []) {
      if (element.table) {
        updatedTableElement = element;
        break;
      }
    }

    if (updatedTableElement?.table) {
      const updatedTable = updatedTableElement.table;
      const formatRequests = [];

      // Aplicar formato a cada celda con los índices correctos
      for (let row = 0; row < 13; row++) {
        for (let col = 0; col < 2; col++) {
          const cell = updatedTable.tableRows?.[row]?.tableCells?.[col];
          if (cell?.content?.[0]?.paragraph) {
            const cellStartIndex = cell.content[0].startIndex;
            const cellEndIndex = cell.content[0].endIndex;
            
            if (cellStartIndex !== undefined && cellStartIndex !== null && 
                cellEndIndex !== undefined && cellEndIndex !== null) {
              // Aplicar formato a todo el contenido de la celda
              formatRequests.push({
                updateTextStyle: {
                  range: {
                    startIndex: cellStartIndex,
                    endIndex: cellEndIndex - 1, // -1 para no incluir el carácter de fin de párrafo
                  },
                  textStyle: {
                    weightedFontFamily: {
                      fontFamily: 'Times New Roman',
                    },
                    fontSize: {
                      magnitude: 12,
                      unit: 'PT',
                    },
                    // Aplicar negrilla solo a la primera columna
                    bold: col === 0,
                  },
                  fields: 'weightedFontFamily,fontSize,bold',
                },
              });
            }
          }
        }
      }

      // Aplicar todo el formato
      if (formatRequests.length > 0) {
        await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: formatRequests,
          },
        });
      }
    }

    // Paso 5: Generar texto con IA para el objeto contractual
    console.log('Generando objeto contractual con IA...');
    
    // Initialize Google Generative AI
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    const prompt = `Eres un agente de inteligencia artificial especializado en la redacción del Objeto Contractual para contratos en Colombia. Tu redacción debe ser clara, precisa y legalmente estructurada, evitando ambigüedades. El objeto contractual debe definir con exactitud la acción, el alcance y la finalidad del contrato.

Objeto parafraseado: ${objetoParafraseado}

Redacta un objeto contractual profesional y completo basado en la información proporcionada.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const objetoContractual = response.text;

    // Paso 6: Insertar el texto generado después de la tabla
    console.log('Insertando objeto contractual en el documento...');
    
    // Obtener el documento final para encontrar dónde insertar el texto
    const docForText = await docs.documents.get({
      documentId,
    });

    const endIndexForText = docForText.data.body?.content?.[docForText.data.body.content.length - 1]?.endIndex || 1;

    // Insertar salto de línea y el texto del objeto contractual
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: endIndexForText - 1,
              },
              text: `\n\nOBJETO CONTRACTUAL:\n\n${objetoContractual}`,
            },
          },
        ],
      },
    });

    // Paso 7: Aplicar formato Times New Roman 12 al texto insertado
    const docAfterText = await docs.documents.get({
      documentId,
    });

    const finalEndIndex = docAfterText.data.body?.content?.[docAfterText.data.body.content.length - 1]?.endIndex || 1;
    const textLength = `\n\nOBJETO CONTRACTUAL:\n\n${objetoContractual}`.length;
    const textStartIndex = finalEndIndex - textLength - 1;

    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            updateTextStyle: {
              range: {
                startIndex: textStartIndex,
                endIndex: finalEndIndex - 1,
              },
              textStyle: {
                weightedFontFamily: {
                  fontFamily: 'Times New Roman',
                },
                fontSize: {
                  magnitude: 12,
                  unit: 'PT',
                },
                bold: false,
              },
              fields: 'weightedFontFamily,fontSize,bold',
            },
          },
          // Hacer el título "OBJETO CONTRACTUAL:" en negrilla
          {
            updateTextStyle: {
              range: {
                startIndex: textStartIndex + 2, // +2 para saltar los \n\n iniciales
                endIndex: textStartIndex + 2 + "OBJETO CONTRACTUAL:".length,
              },
              textStyle: {
                bold: true,
              },
              fields: 'bold',
            },
          },
        ],
      },
    });

    console.log('Tabla y objeto contractual creados exitosamente en Google Docs');

    return NextResponse.json({ 
      success: true, 
      message: 'Tabla de contrato y objeto contractual creados exitosamente en Google Docs',
      documentId,
      rowsCreated: 13,
      objetoContractual: objetoContractual
    });

  } catch (error: unknown) {
    console.error('Error creando tabla en Google Docs:', error);
    
    // Extraer más detalles del error similar a add-to-sheet
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    let errorDetails = '';
    
    if (error && typeof error === 'object' && 'response' in error) {
      const errorWithResponse = error as { response?: { data?: { error?: unknown; [key: string]: unknown } } };
      errorDetails = JSON.stringify(errorWithResponse.response?.data?.error || errorWithResponse.response?.data || {});
      console.error('Detalles del error de Google API:', errorDetails);
    }
    
    // Verificar si es un error de autenticación o permisos
    if (errorMessage.includes('authentication') || 
        errorMessage.includes('permission') ||
        errorMessage.includes('access')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Error de autenticación o permisos. Verifica que la cuenta de servicio tenga acceso al documento.',
          details: errorMessage,
          errorDetails: errorDetails || undefined,
          instructions: [
            '1. Asegúrate de que las variables de entorno GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY estén configuradas correctamente',
            '2. Verifica que hayas compartido el documento con la cuenta de servicio: ' + process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            '3. Asegúrate de que la cuenta de servicio tenga permisos de "Editor" en el documento'
          ]
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear la tabla en Google Docs',
        details: errorMessage,
        errorDetails: errorDetails || undefined,
        instructions: 'Verifica que el documento esté compartido con la cuenta de servicio: ' + 
                      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      },
      { status: 500 }
    );
  }
} 