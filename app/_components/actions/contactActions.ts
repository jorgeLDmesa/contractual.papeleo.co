"use server"

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Sends a contact form email to jorge@papeleo.co
 * @param formData The form data containing contact information
 */
export async function sendContactEmail(formData: FormData): Promise<void> {
  try {
    const company = formData.get('company') as string
    const email = formData.get('email') as string
    const contracts = formData.get('contracts') as string
    const message = formData.get('message') as string
    const demo = formData.get('demo') === 'on'

    // Validate required fields
    if (!company || !email) {
      throw new Error('Nombre de empresa y correo electrónico son obligatorios')
    }

    const contractsText = contracts || 'No especificado'
    const demoText = demo ? 'Sí' : 'No'

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      to: 'jorge@papeleo.co',
      subject: `Nueva consulta de ${company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #2563eb, #4f46e5); padding: 2px; border-radius: 12px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px;">
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-top: 0; text-align: center;">
                Nueva Consulta de Contacto
              </h2>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin-top: 0;">
                  Información de la Empresa
                </h3>
                <p style="color: #475569; line-height: 1.6; margin: 8px 0;">
                  <strong>Empresa:</strong> ${company}
                </p>
                <p style="color: #475569; line-height: 1.6; margin: 8px 0;">
                  <strong>Correo:</strong> ${email}
                </p>
                <p style="color: #475569; line-height: 1.6; margin: 8px 0;">
                  <strong>Contratos mensuales:</strong> ${contractsText}
                </p>
                <p style="color: #475569; line-height: 1.6; margin: 8px 0;">
                  <strong>Solicita demostración:</strong> ${demoText}
                </p>
              </div>
              
              ${message ? `
                <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin-top: 0;">
                    Mensaje Adicional
                  </h3>
                  <p style="color: #475569; line-height: 1.6; margin: 0;">
                    ${message}
                  </p>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:${email}" 
                   style="display: inline-block; background-color: #2563eb; color: white; padding: 16px 32px; 
                          text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 16px;
                          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                          transition: all 300ms;">
                  Responder a ${email}
                </a>
              </div>
              
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">
                  Este mensaje fue enviado desde el formulario de contacto de contractual.papeleo.co
                </p>
              </div>
            </div>
          </div>
        </div>
      `
    })

  } catch (error) {
    console.error('Error sending contact email:', error)
    throw new Error('Error al enviar el correo de contacto')
  }
} 