import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function TableDocumentsSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre del Contratista</TableHead>
          <TableHead>Contrato</TableHead>
          <TableHead>Estado de Documentos</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
            <TableCell><Skeleton className="h-5 w-[80px] rounded-full" /></TableCell>
            <TableCell>
              <Skeleton className="h-9 w-[120px]" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

