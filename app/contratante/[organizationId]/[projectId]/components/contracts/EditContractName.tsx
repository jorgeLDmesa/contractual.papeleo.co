import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateContractName } from "../../actions/actionServer";
import { Contract } from "../../types";

interface EditContractNameProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  onSuccess: (updatedContract: Contract) => void;
}

export function EditContractName({ isOpen, onClose, contract, onSuccess }: EditContractNameProps) {
  const [name, setName] = useState(contract.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || name === contract.name) return;

    setIsLoading(true);
    try {
      const updatedContract = await updateContractName(contract.id, name);
      
      toast.success("El nombre del contrato ha sido actualizado exitosamente.");
      
      onSuccess(updatedContract);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el contrato';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar nombre del contrato</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                className="col-span-3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del contrato"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !name.trim() || name === contract.name}
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 