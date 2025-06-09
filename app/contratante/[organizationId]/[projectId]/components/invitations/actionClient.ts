import { createClient } from '@/lib/supabase/client';

// Define the structure for the document_id JSON data
interface DocumentIdData {
  altura?: string;
  genero?: string;
  nombres?: string;
  apellidos?: string;
  nacionalidad?: string;
  "tipo de sangre"?: string;
  "fecha de nacimiento"?: string;
  "lugar de nacimiento"?: string;
  "fecha de expedición"?: string;
  "numero de identificación"?: string;
  [key: string]: unknown; // Allow other fields
}

/**
 * Process contract document and replace specific values in the document
 * 
 * @param userId The ID of the user being invited
 * @param contractId The ID of the contract
 * @param value The value entered in the invitation modal
 * @param endDate The end date selected in the modal
 * @param projectId The ID of the project
 * @returns 
 */
export async function processContractDocument(
  userId: string,
  contractId: string,
  value: string,
  endDate?: Date,
  projectId?: string
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // Fetch the contract to get the contract_draft_url
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('contract_draft_url')
      .eq('id', contractId)
      .single();
    
    if (contractError || !contract?.contract_draft_url) {
      console.error('Error fetching contract or no draft URL:', contractError);
      return false;
    }
    
    // Check if the contract_draft_url starts with "https://papeleo.co/docgen"
    if (!contract.contract_draft_url.startsWith('https://papeleo.co/docgen')) {
      // No processing needed for non-matching URLs
      return true;
    }
    
    // Extract the document ID from the URL
    const documentId = contract.contract_draft_url.split('/').pop();
    if (!documentId) {
      console.error('Failed to extract document ID from URL:', contract.contract_draft_url);
      return false;
    }
    
    // Fetch the document from the documents table
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('sections')
      .eq('id', documentId)
      .single();
    
    if (documentError || !document?.sections) {
      console.error('Error fetching document or no sections:', documentError);
      return false;
    }
    
    // Fetch the user's information
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('document_id, email')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return false;
    }
    
    console.log('User document_id:', user?.document_id);
    
    // Process the sections
    let sections = document.sections;
    
    // Check if "0. GENERALIDADES" section exists
    if (sections["0. GENERALIDADES"]) {
      let content = sections["0. GENERALIDADES"].content;
      
      // Replace value in "VALOR TOTAL DEL CONTRATO"
      content = content.replace(
        /<tr>\s*<td><b>VALOR TOTAL DEL CONTRATO<\/b><\/td>\s*<td><span style='color:red;'>\$<\/span><\/td>\s*<\/tr>/,
        `<tr><td><b>VALOR TOTAL DEL CONTRATO</b></td><td><span style='color:red;'>$${value}</span></td></tr>`
      );
      
      // Parse document_id safely
      let docIdData: DocumentIdData = {};
      if (user?.document_id) {
        try {
          if (typeof user.document_id === 'string') {
            docIdData = JSON.parse(user.document_id);
          } else if (typeof user.document_id === 'object') {
            docIdData = user.document_id as DocumentIdData;
          }
        } catch (e) {
          console.error('Error parsing document_id:', e);
        }
      }
      
      // Extract user name from document_id
      const nombres = docIdData.nombres || '';
      const apellidos = docIdData.apellidos || '';
      const userName = `${nombres} ${apellidos}`.trim();
      
      // Replace name in "NOMBRE DEL CONTRATISTA"
      content = content.replace(
        /<tr>\s*<td><b>NOMBRE DEL CONTRATISTA<\/b><\/td>\s*<td><span style='color:red;'>NOMBRE DEL CONTRATISTA<\/span><\/td>\s*<\/tr>/,
        `<tr><td><b>NOMBRE DEL CONTRATISTA</b></td><td><span style='color:red;'>${userName}</span></td></tr>`
      );
      
      // Extract identification from document_id
      const userIdentification = docIdData["numero de identificación"] || '';
      
      // Replace identification in "IDENTIFICACIÓN"
      content = content.replace(
        /<tr>\s*<td><b>IDENTIFICACIÓN CONTRATISTA<\/b><\/td>\s*<td><span style='color:red;'>IDENTIFICACIÓN<\/span><\/td>\s*<\/tr>/,
        `<tr><td><b>IDENTIFICACIÓN CONTRATISTA</b></td><td><span style='color:red;'>${userIdentification}</span></td></tr>`
      );
      
      // Format end date in "dd/mm/aa" format for PLAZO field
      let formattedDate = '';
      if (endDate) {
        const day = endDate.getDate().toString().padStart(2, '0');
        const month = (endDate.getMonth() + 1).toString().padStart(2, '0'); // +1 because months are 0-indexed
        const year = endDate.getFullYear().toString().slice(-2); // Last 2 digits
        formattedDate = `${day}/${month}/${year}`;
      }
      
      // Replace PLAZO with formatted end date
      content = content.replace(
        /<tr>\s*<td><b>PLAZO<\/b><\/td>\s*<td><span style='color:red;'>PLAZO<\/span><\/td>\s*<\/tr>/,
        `<tr><td><b>PLAZO</b></td><td><span style='color:red;'>${formattedDate}</span></td></tr>`
      );
      
      // Update the sections object
      sections = {
        ...sections,
        "0. GENERALIDADES": {
          ...sections["0. GENERALIDADES"],
          content
        }
      };
    }
    
    console.log('firmasContent', sections["2. FIRMAS"].content);
    // Process signatures section if project ID is provided
    if (projectId && sections["2. FIRMAS"]) {
      // Fetch project signature from contractual_projects table
      const { data: project, error: projectError } = await supabase
        .from('contractual_projects')
        .select('signature')
        .eq('id', projectId)
        .single();
      
      if (!projectError && project?.signature) {
        // Replace the last <hr> tag with the signature image
        let firmasContent = sections["2. FIRMAS"].content;
        
        // Only proceed if firmasContent exists and is a string
        if (firmasContent && typeof firmasContent === 'string') {
          // Find the last occurrence of the hr tag
          const lastHrIndex = firmasContent.lastIndexOf("<hr style='width: 150px;'>");
          
          if (lastHrIndex !== -1) {
            // Replace only the last occurrence
            const beforeHr = firmasContent.substring(0, lastHrIndex);
            const afterHr = firmasContent.substring(lastHrIndex + "<hr style='width: 150px;'>".length);
            
            firmasContent = beforeHr + 
              `<img src='${project.signature}' style='max-width:150px'><br>` + 
              afterHr;
            
            // Update the sections object
            sections = {
              ...sections,
              "2. FIRMAS": {
                ...sections["2. FIRMAS"],
                content: firmasContent
              }
            };
          }
        } else {
          console.warn("Cannot process signature - firmasContent is not available in the document");
        }
      }
    }
    
    // Fetch the contract member entry
    const { data: contractMember, error: memberError } = await supabase
      .from('contract_members')
      .select('id')
      .eq('user_id', userId)
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (memberError || !contractMember) {
      console.error('Error fetching contract member:', memberError);
      return false;
    }
    
    // Update the contract member with the processed sections
    const { error: updateError } = await supabase
      .from('contract_members')
      .update({
        contract: sections
      })
      .eq('id', contractMember.id);
    
    if (updateError) {
      console.error('Error updating contract member:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error processing contract document:', error);
    return false;
  }
} 