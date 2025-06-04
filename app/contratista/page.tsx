'use client'

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import ContratistaNavbar from './navbar';
import LoadingSpinner from './_components/LoadingSpinner';
import MainContent from './_components/MainContent';
import { 
  getUserContractData, 
  getContractFullData, 
  refreshContractStatus,
  type ContractInvite,
  type ContractStatus,
  type ContractData
} from './actions/actionServer';
import { 
  useDocumentPreview, 
  debounce,
  contractCache
} from './actions/actionClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface PageState {
  user: SupabaseUser | null;
  contracts: ContractInvite[];
  signatureData: string | null;
  selectedContract: string;
  selectedContractData: ContractInvite | null;
  currentContract: ContractData | null;
  contractStatus: ContractStatus | null;
  loading: boolean;
  contractLoading: boolean;
}

export default function ContratistaPage() {
  const router = useRouter();

  const [state, setState] = useState<PageState>({
    user: null,
    contracts: [],
    signatureData: null,
    selectedContract: '',
    selectedContractData: null,
    currentContract: null,
    contractStatus: null,
    loading: true,
    contractLoading: false
  });

  // Función optimizada para cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const result = await getUserContractData();
      
      if (!result.success) {
        if (result.error === 'Usuario no autenticado') {
          router.push('/login');
          return;
        }
        toast.error(result.error);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const { user, contracts, signature } = result.data!;
      
      // Auto-seleccionar el primer contrato si existe
      const firstContract = contracts.length > 0 ? contracts[0] : null;
      
      setState(prev => ({
        ...prev,
        user,
        contracts,
        signatureData: signature,
        selectedContract: firstContract?.id || '',
        selectedContractData: firstContract,
        loading: false
      }));

      // Si hay un contrato seleccionado, cargar sus datos
      if (firstContract) {
        loadContractData(firstContract.id);
      }
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      setState(prev => ({ ...prev, loading: false }));
      toast.error("Error al cargar la página");
    }
  }, [router]);

  // Función optimizada para cargar datos de un contrato específico
  const loadContractData = useCallback(async (contractMemberId: string) => {
    if (!contractMemberId) return;

    try {
      setState(prev => ({ ...prev, contractLoading: true }));

      // Verificar cache primero
      const cacheKey = `contract_${contractMemberId}`;
      const cachedData = contractCache.get(cacheKey);
      
      if (cachedData) {
        setState(prev => ({
          ...prev,
          currentContract: cachedData.contractData,
          contractStatus: cachedData.status,
          contractLoading: false
        }));
        return;
      }

      const result = await getContractFullData(contractMemberId);
      
      if (!result.success) {
        toast.error(result.error);
        setState(prev => ({ ...prev, contractLoading: false }));
        return;
      }

      const { contractData, status } = result.data!;
      
      // Guardar en cache
      contractCache.set(cacheKey, { contractData, status });
      
      setState(prev => ({
        ...prev,
        currentContract: contractData,
        contractStatus: status,
        contractLoading: false
      }));
    } catch (error) {
      console.error('Error al cargar datos del contrato:', error);
      setState(prev => ({ ...prev, contractLoading: false }));
      toast.error("Error al cargar datos del contrato");
    }
  }, [toast]);

  // Función debounceada para cambio de contrato
  const debouncedContractChange = useMemo(
    () => debounce((contractId: string) => {
      loadContractData(contractId);
    }, 300),
    [loadContractData]
  );

  // Handler optimizado para cambio de contrato
  const handleContractChange = useCallback((contractId: string) => {
    const contractData = state.contracts.find(contract => contract.id === contractId);
    
    setState(prev => ({
      ...prev,
      selectedContract: contractId,
      selectedContractData: contractData || null,
      currentContract: null,
      contractStatus: null
    }));

    if (contractId) {
      debouncedContractChange(contractId);
    }
  }, [state.contracts, debouncedContractChange]);

  // Handler optimizado para ver firma
  const handleViewSignature = useCallback(() => {
    if (state.signatureData) {
      window.open(state.signatureData, '_blank');
    } else {
      toast.error("Necesitas subir tu firma primero.");
    }
  }, [state.signatureData, toast]);

  // Handler optimizado para refrescar status
  const handleRefreshContractStatus = useCallback(async () => {
    if (!state.selectedContract) return;
    
    try {
      const result = await refreshContractStatus(state.selectedContract);
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          contractStatus: result.data!
        }));
        
        // Actualizar cache
        const cacheKey = `contract_${state.selectedContract}`;
        const cachedData = contractCache.get(cacheKey);
        if (cachedData) {
          contractCache.set(cacheKey, {
            ...cachedData,
            status: result.data
          });
        }
      }
    } catch (error) {
      console.error('Error al refrescar status:', error);
    }
  }, [state.selectedContract]);

  // Handler para completación de fases (nuevo)
  const handlePhaseComplete = useCallback(async () => {
    // Invalidar cache para forzar actualización
    if (state.selectedContract) {
      const cacheKey = `contract_${state.selectedContract}`;
      contractCache.delete(cacheKey);
      
      // Recargar datos del contrato
      await loadContractData(state.selectedContract);
    }
  }, [state.selectedContract, loadContractData]);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Loading optimizado
  if (state.loading) {
    return <LoadingSpinner message="Cargando panel..." />;
  }

  return (
    <div>
      {/* Navbar optimizado */}
      <ContratistaNavbar 
        user={state.user}
        contracts={state.contracts}
        selectedContract={state.selectedContract}
        onContractChange={handleContractChange}
        signatureData={state.signatureData}
        onViewSignature={handleViewSignature}
        selectedContractData={state.selectedContractData}
      />

      {/* Contenido principal */}
      <MainContent
        selectedContract={state.selectedContract}
        contracts={state.contracts}
        currentContract={state.currentContract}
        contractStatus={state.contractStatus}
        contractLoading={state.contractLoading}
        user={state.user}
        onSignSuccess={handleRefreshContractStatus}
        onPhaseComplete={handlePhaseComplete}
      />
    </div>
  );
}
