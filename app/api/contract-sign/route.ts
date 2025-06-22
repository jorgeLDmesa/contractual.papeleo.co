import { NextRequest, NextResponse } from 'next/server';
import { handleContractSigning } from '@/app/contratista/actions/actionServer';
import { handleContratanteSigning } from '@/app/contratante/[organizationId]/[projectId]/actions/actionServer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.role === 'contratante') {
      const { contractMemberId, user_id } = body;
      const result = await handleContratanteSigning(contractMemberId, user_id);
      return NextResponse.json(result);
    }
    const { contractMemberId, user_id, contract_draft_url, userData, userSignature } = body;
    const result = await handleContractSigning(contractMemberId, user_id, contract_draft_url, userData, userSignature);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error en contract-sign:', error);
    return NextResponse.json({ success: false, message: 'Error en el servidor de firma', error: error?.toString() });
  }
} 