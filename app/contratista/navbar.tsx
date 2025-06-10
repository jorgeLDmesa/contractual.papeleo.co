"use client"

import { useState } from "react"
import { FileText, PenTool, UserX, User as UserIcon, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { uploadResignationLetter } from './actions/actionClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import Link from 'next/link';

interface ContractInvite {
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

interface NavbarProps {
  user: SupabaseUser | null;
  contracts: ContractInvite[];
  selectedContract: string;
  onContractChange: (contractId: string) => void;
  signatureData: string | null;
  onViewSignature: () => void;
  selectedContractData: ContractInvite | null;
}

export default function ContratistaNavbar({ 
  user,
  contracts, 
  selectedContract, 
  onContractChange, 
  signatureData, 
  onViewSignature,
  selectedContractData 
}: NavbarProps) {
  const [showResignationDialog, setShowResignationDialog] = useState(false);
  const [resignationFile, setResignationFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Check if user already has a resignation letter
  const hasResignationLetter = selectedContractData?.ending?.url && selectedContractData.ending.url !== '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResignationFile(e.target.files[0]);
    }
  };

  const handleResignationSubmit = async () => {
    if (!resignationFile || !selectedContract || !user) {
      toast.error('Por favor seleccione un archivo');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', resignationFile);
      formData.append('memberId', selectedContract);
      formData.append('userId', user.id);

      const response = await uploadResignationLetter(formData);
      
      if (response.success) {
        toast.success('Carta de renuncia subida correctamente');
        setShowResignationDialog(false);
        setResignationFile(null);
        // Force reload to update the UI
        window.location.reload();
      } else {
        toast.error(response.error || 'Error al subir la carta de renuncia');
      }
    } catch {
      toast.error('Error al procesar la solicitud');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="text-xl md:text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              contractual.papeleo.co
            </Link>
            {user && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground ml-4 pl-4 border-l border-border/40">
                <UserIcon className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{user.email}</span>
              </div>
            )}
          </div>

          {/* Center - Contract Select - Hidden on mobile, shown on larger screens */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <Select value={selectedContract} onValueChange={onContractChange}>
              <SelectTrigger className="w-full h-10 border-border/50 bg-background/50 hover:bg-accent/50 transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                <div className="flex items-center space-x-2">
                  <SelectValue placeholder="Seleccionar contrato..." />
                </div>
              </SelectTrigger>
              <SelectContent className="w-full min-w-[400px]">
                {contracts.length === 0 ? (
                  <SelectItem value="no-contracts" disabled>
                    📋 No tienes contratos disponibles
                  </SelectItem>
                ) : (
                  contracts.map((contract) => (
                    <SelectItem
                      key={contract.id}
                      value={contract.id}
                      className="cursor-pointer hover:bg-accent transition-colors duration-150"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate font-medium">{contract.contracts?.name || 'Contrato sin nombre'}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Right - Action Buttons */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Mobile Contract Select */}
            <div className="block md:hidden">
              <Select value={selectedContract} onValueChange={onContractChange}>
                <SelectTrigger className="w-10 h-10 p-0 border-border/50 bg-background/50 hover:bg-accent/50 transition-all duration-200">
                  <FileText className="h-4 w-4 text-muted-foreground mx-auto" />
                </SelectTrigger>
                <SelectContent className="w-80">
                  {contracts.length === 0 ? (
                    <SelectItem value="no-contracts" disabled>
                      📋 No tienes contratos disponibles
                    </SelectItem>
                  ) : (
                    contracts.map((contract) => (
                      <SelectItem
                        key={contract.id}
                        value={contract.id}
                        className="cursor-pointer hover:bg-accent transition-colors duration-150"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate font-medium">{contract.contracts?.name || 'Contrato sin nombre'}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Botón de renuncia */}
            {selectedContract && !hasResignationLetter ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="group relative overflow-hidden border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-300"
                      onClick={() => setShowResignationDialog(true)}
                    >
                      <div className="absolute inset-0 bg-red-100 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                      <UserX className="h-4 w-4 md:mr-2 relative z-10 transition-transform duration-200 group-hover:scale-110" />
                      <span className="relative z-10 font-medium hidden md:inline">Renuncia</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Solicitar renuncia del contrato</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : hasResignationLetter ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-orange-200 text-orange-600 bg-orange-50"
                      disabled
                    >
                      <AlertTriangle className="h-4 w-4 md:mr-2" />
                      <span className="font-medium hidden md:inline">En proceso</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Renuncia en proceso de revisión</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}

            {/* Botón de firma */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className={`group relative overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl ${
                      signatureData 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                    onClick={onViewSignature}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r transition-transform duration-300 ease-out translate-x-[-100%] group-hover:translate-x-0 ${
                      signatureData 
                        ? 'from-green-600 to-green-500' 
                        : 'from-orange-500 to-orange-400'
                    }`} />
                    <PenTool className="h-4 w-4 md:mr-2 relative z-10 transition-transform duration-200 group-hover:scale-110" />
                    <span className="relative z-10 font-medium hidden md:inline">
                      {signatureData ? 'Ver Firma' : 'Config. Firma'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{signatureData ? 'Ver mi firma digital' : 'Configurar firma digital'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Mobile user info */}
        {user && (
          <div className="block sm:hidden px-4 pb-2 border-t border-border/40 bg-background/80">
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <UserIcon className="h-3 w-3" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        )}

        {/* Subtle bottom border animation */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </nav>

      {/* Dialog de renuncia */}
      <Dialog open={showResignationDialog} onOpenChange={setShowResignationDialog}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              Solicitar Renuncia de Contrato
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 mb-2">
                <strong>⚠️ Advertencia:</strong> Esta acción iniciará el proceso de terminación del contrato.
              </p>
              <p className="text-xs text-red-600">
                Una vez enviada la carta de renuncia, no podrás revertir esta acción.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resignation-letter" className="text-sm font-medium">
                Carta de renuncia (PDF, DOC, DOCX)
              </Label>
              <Input 
                id="resignation-letter" 
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowResignationDialog(false);
                setResignationFile(null);
              }}
              disabled={isUploading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleResignationSubmit}
              disabled={!resignationFile || isUploading}
              className="gap-2 w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4" />
                  Enviar Renuncia
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
