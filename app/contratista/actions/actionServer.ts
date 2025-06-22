'use server'

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserDocument, ContractSigningResponse } from './actionClient';
import { updateContractWithUserData } from './actionClient';
import { google } from 'googleapis';
import { Resend } from 'resend'

export interface ContractInvite {
  id: string;
  user_id: string;
  contract_id: string;
  status: string;
  ending?: { url: string; status: string };
  contracts?: {
    name: string;
    contract_draft_url?: string;
  };
}

export interface ContractStatus {
  precontractual: boolean;
  signed: boolean;
  contractual: boolean;
}

export interface ContractData {
  id: string;
  name: string;
  contractDraftUrl?: string;
  contractUrl?: string | null;
  contratanteSigned: boolean;
}

export interface UserContractData {
  user: SupabaseUser;
  contracts: ContractInvite[];
  signature: string | null;
}

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Obtiene todos los datos iniciales del usuario de forma paralela
 */
export async function getUserContractData(): Promise<{
  success: boolean;
  data?: UserContractData;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const user = await getUser(supabase);

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Ejecutar consultas en paralelo para mejor rendimiento
    const [contractsResult, signatureResult] = await Promise.all([
      // Obtener contratos del usuario
      supabase
        .from('contract_members')
        .select(`
          *,
          contracts:contract_id (
            name, 
            contract_draft_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending'),
      
      // Obtener firma del usuario
      supabase
        .from('users')
        .select('signature')
        .eq('id', user.id)
        .maybeSingle()
    ]);

    if (contractsResult.error) {
      console.error('Error al obtener contratos:', contractsResult.error);
      return { success: false, error: 'Error al obtener contratos' };
    }

    if (signatureResult.error) {
      console.error('Error al obtener firma:', signatureResult.error);
      return { success: false, error: 'Error al obtener firma' };
    }

    return {
      success: true,
      data: {
        user,
        contracts: contractsResult.data || [],
        signature: signatureResult.data?.signature || null
      }
    };
  } catch (error) {
    console.error('Error en getUserContractData:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtiene los datos completos de un contrato incluyendo su estado
 */
export async function getContractFullData(contractMemberId: string): Promise<{
  success: boolean;
  data?: {
    contractId: string;
    contractData: ContractData | null;
    status: ContractStatus | null;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Ejecutar consultas en paralelo
    const [memberResult, statusResult] = await Promise.all([
      // Obtener contract_id y datos del contrato
      supabase
        .from('contract_members')
        .select(`
          contract_id,
          contract_url,
          contratante_signed,
          contracts:contract_id (
            id,
            name,
            contract_draft_url
          )
        `)
        .eq('id', contractMemberId)
        .single(),
      
      // Obtener status del contrato
      supabase.rpc('get_contract_status', {
        p_contract_member_id: contractMemberId
      })
    ]);

    if (memberResult.error) {
      console.error('Error al obtener datos del contrato:', memberResult.error);
      return { success: false, error: 'Error al obtener datos del contrato' };
    }

    if (statusResult.error) {
      console.error('Error al obtener status del contrato:', statusResult.error);
      return { success: false, error: 'Error al obtener status del contrato' };
    }

    const contractData = memberResult.data?.contracts ? {
      id: (memberResult.data.contracts as unknown as { id: string; name: string; contract_draft_url?: string }).id,
      name: (memberResult.data.contracts as unknown as { id: string; name: string; contract_draft_url?: string }).name,
      contractDraftUrl: (memberResult.data.contracts as unknown as { id: string; name: string; contract_draft_url?: string }).contract_draft_url,
      contractUrl: memberResult.data.contract_url || null,
      contratanteSigned: memberResult.data.contratante_signed ?? false
    } : null;

    return {
      success: true,
      data: {
        contractId: memberResult.data.contract_id,
        contractData,
        status: statusResult.data
      }
    };
  } catch (error) {
    console.error('Error en getContractFullData:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Refresca el status de un contrato específico
 */
export async function refreshContractStatus(contractMemberId: string): Promise<{
  success: boolean;
  data?: ContractStatus;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('get_contract_status', {
      p_contract_member_id: contractMemberId
    });
    
    if (error) {
      console.error('Error al actualizar status:', error);
      return { success: false, error: 'Error al actualizar status' };
    }
    
    // Revalidar la página para actualizar cache
    revalidatePath('/landing/contratista');
    
    return { success: true, data };
  } catch (error) {
    console.error('Error en refreshContractStatus:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Inserta la firma del contratista en el Google Doc del contrato
 * @param contractUrl URL del Google Doc (de contract_members.contract_url)
 * @param signatureUrl URL pública de la imagen de la firma
 */
export async function signGoogleDocWithSignature(contractUrl: string, signatureUrl: string) {
  try {
    // Solo si es un Google Doc
    const match = contractUrl.match(/\/d\/([\w-]+)/);
    const documentId = match ? match[1] : null;
    if (!documentId) {
      console.error('[signGoogleDocWithSignature] No se pudo extraer documentId de contractUrl:', contractUrl);
      return;
    }
    console.log('[signGoogleDocWithSignature] documentId extraído:', documentId);
    console.log('[signGoogleDocWithSignature] signatureUrl:', signatureUrl);

    // Autenticación Google
    const serviceAccountAuth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive',
      ],
    });
    const docs = google.docs({ version: 'v1', auth: serviceAccountAuth });

    // Obtener el documento para saber el endIndex
    const docRes = await docs.documents.get({ documentId });
    const doc = docRes.data;
    const endIndex = doc.body?.content?.[doc.body.content.length - 1]?.endIndex || 1;
    console.log('[signGoogleDocWithSignature] endIndex antes de insertar texto:', endIndex);

    // 1. Insertar la imagen de la firma al final
    const insertImageReq = {
      documentId,
      requestBody: {
        requests: [
          {
            insertInlineImage: {
              uri: signatureUrl,
              location: { index: endIndex - 1 },
              objectSize: {
                height: { magnitude: 60, unit: 'PT' },
                width: { magnitude: 150, unit: 'PT' },
              },
            },
          },
        ],
      },
    };
    console.log('[signGoogleDocWithSignature] Enviando request insertInlineImage:', JSON.stringify(insertImageReq));
    await docs.documents.batchUpdate(insertImageReq);

    // 2. Obtener el nuevo endIndex después de la imagen
    const docAfterImageRes = await docs.documents.get({ documentId });
    const docAfterImage = docAfterImageRes.data;
    const lineIndex = docAfterImage.body?.content?.[docAfterImage.body.content.length - 1]?.endIndex || 1;

    // 3. Insertar la línea debajo de la imagen
    const insertLineReq = {
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: lineIndex - 1 },
              text: '\n________________________\n',
            },
          },
        ],
      },
    };
    console.log('[signGoogleDocWithSignature] Enviando request insertLine:', JSON.stringify(insertLineReq));
    await docs.documents.batchUpdate(insertLineReq);

    // 4. Obtener el nuevo endIndex después de la línea
    const docAfterLineRes = await docs.documents.get({ documentId });
    const docAfterLine = docAfterLineRes.data;
    const textIndex = docAfterLine.body?.content?.[docAfterLine.body.content.length - 1]?.endIndex || 1;

    // 5. Insertar el texto 'Firma contratista' debajo de la línea
    const insertTextReq = {
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: textIndex - 1 },
              text: '\nFirma contratista\n',
            },
          },
        ],
      },
    };
    console.log('[signGoogleDocWithSignature] Enviando request insertText (debajo de línea):', JSON.stringify(insertTextReq));
    await docs.documents.batchUpdate(insertTextReq);
    console.log('[signGoogleDocWithSignature] Firma, línea y texto insertados correctamente en el documento.');
  } catch (err) {
    console.error('[signGoogleDocWithSignature] Error insertando firma en Google Doc:', err);
  }
}

/**
 * Firma un contrato después de la verificación
 * @param contractMemberId El ID único de la relación contract_member
 * @param user_id El ID del usuario
 * @returns Respuesta con estado de éxito y mensaje
 */
export const signContract = async (
  contractMemberId: string,
  user_id: string
): Promise<ContractSigningResponse> => {
  const supabase = await createClient();
  try {
    // Verifica si el usuario tiene firma
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('signature')
      .eq('id', user_id)
      .single();
    if (userError) {
      throw userError;
    }
    if (!userData?.signature) {
      return {
        success: false,
        message: 'Debe crear primero su firma en la sección contractual de papeleo.co'
      };
    }
    // Actualiza el estado de firma en contract_members
    const { error } = await supabase
      .from('contract_members')
      .update({ signed: true, created_at: new Date() })
      .eq('id', contractMemberId);
    if (error) {
      console.error('Error al firmar el contrato:', error);
      return {
        success: false,
        message: 'Error al firmar el contrato'
      };
    }
    return {
      success: true,
      message: 'Contrato firmado exitosamente'
    };
  } catch (error) {
    console.error('Error signing contract:', error);
    return {
      success: false,
      message: 'Ocurrió un error inesperado durante el proceso de firma'
    };
  }
};

export const handleContractSigning = async (
  contractMemberId: string,
  user_id: string,
  contract_draft_url: string,
  userData: UserDocument,
  userSignature: string | null
): Promise<ContractSigningResponse> => {
  try {
    // If the URL matches docgen pattern, update contract with user data
    const regex = /^https:\/\/papeleo\.co\/docgen\//;
    if (regex.test(contract_draft_url)) {
      await updateContractWithUserData(contractMemberId, userData, userSignature);
    }

    // Mensaje de verificación (solo log en backend)
    console.log("Verificando antecedentes, por favor espere...");
    
    // Simulated verification delay
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Sign the contract after verification
    const signingResult = await signContract(contractMemberId, user_id);

    // Si existe contractUrl (Google Doc) en contract_members, inserta la firma en el documento
    if (signingResult.success) {
      // Obtener el contract_url y la firma del usuario
      const supabase = await createClient();
      const { data: memberData } = await supabase
        .from('contract_members')
        .select('contract_url, user_id, contract_id')
        .eq('id', contractMemberId)
        .single();
      if (memberData?.contract_url && memberData.contract_url.includes('docs.google.com/document/d/')) {
        // Obtener la firma del usuario
        const { data: userData } = await supabase
          .from('users')
          .select('signature, username, email')
          .eq('id', memberData.user_id)
          .single();
        if (userData?.signature) {
          await signGoogleDocWithSignature(memberData.contract_url, userData.signature);
        }
        // Obtener datos del contrato y proyecto para el email
        const { data: contractData } = await supabase
          .from('contracts')
          .select('id, name, project_id')
          .eq('id', memberData.contract_id)
          .single();
        if (contractData?.project_id) {
          const { data: projectData } = await supabase
            .from('contractual_projects')
            .select('id, organization_id')
            .eq('id', contractData.project_id)
            .single();
          if (projectData?.organization_id) {
            // Buscar el email del contratante en organizations
            const { data: orgData } = await supabase
              .from('organizations')
              .select('id, user_id, email')
              .eq('id', projectData.organization_id)
              .single();
            let contratanteEmail = orgData?.email;
            // Si no hay email en organizations, buscar en users
            if (!contratanteEmail && orgData?.user_id) {
              const { data: orgUser } = await supabase
                .from('users')
                .select('email')
                .eq('id', orgData.user_id)
                .single();
              contratanteEmail = orgUser?.email;
            }
            if (contratanteEmail) {
              // Construir la URL para el contratante
              const url = `https://contractual.papeleo.co/contratante/${projectData.organization_id}/${projectData.id}`;
              // Enviar el correo
              try {
                await resend.emails.send({
                  from: process.env.RESEND_FROM_EMAIL as string,
                  to: contratanteEmail,
                  subject: `El contrato ${contractData.name} ha sido firmado por el contratista`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <div style="background: linear-gradient(to right, #2563eb, #4f46e5); padding: 2px; border-radius: 12px;">
                        <div style="background-color: white; padding: 30px; border-radius: 10px;">
                          <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-top: 0; text-align: center;">
                            ¡Contrato firmado por el contratista!
                          </h2>
                          <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                            El contratista <strong>${userData?.username || userData?.email || 'un usuario'}</strong> ha firmado el contrato <strong>${contractData.name}</strong>.
                          </p>
                          <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                            Ahora puedes revisar sus antecedentes y proceder a firmar el contrato como contratante.
                          </p>
                          <div style="text-align: center; margin: 30px 0;">
                            <a href="${url}" 
                               style="display: inline-block; background-color: #2563eb; color: white; padding: 16px 32px; 
                                      text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 16px;
                                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                                      transition: all 300ms;">
                              Revisar y firmar contrato
                            </a>
                          </div>
                          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                            <p style="color: #64748b; font-size: 14px; margin: 0;">
                              Si tienes alguna pregunta, no dudes en contactar al equipo de soporte de Papeleo.
                            </p>
                          </div>
                        </div>
                      </div>
                      <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 20px;">
                        Si no puedes acceder al botón, copia y pega este enlace en tu navegador:<br>
                        <span style="color: #2563eb;">${url}</span>
                      </p>
                    </div>
                  `
                });
              } catch (err) {
                console.error('[handleContractSigning] Error enviando correo al contratante:', err);
              }
            }
          }
        }
      }
    }

    return signingResult;
  } catch (error) {
    console.error("Error in contract signing process:", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado durante el proceso de firma"
    };
  }
}; 