# Etapa Contractual Dialog

Este componente proporciona una interfaz de diálogo modal para gestionar documentos contractuales, replicando la funcionalidad de la página original pero en formato dialog.

## Componentes

### ContractualDialog
Componente principal que renderiza el diálogo modal con todas las funcionalidades de gestión de documentos contractuales.

**Props:**
- `contractMemberId: string` - ID del miembro del contrato
- `contractName?: string` - Nombre del contrato (opcional)
- `children: React.ReactNode` - Elemento que activa el diálogo

**Características:**
- Visualización de documentos agrupados por mes
- Búsqueda en tiempo real
- Estadísticas de progreso (Total, Subidos, Pendientes)
- Soporte para documentos regulares y extra
- Interfaz responsive con scroll organizado
- Eventos para refrescar automáticamente

### ContractualCard
Componente para mostrar documentos contractuales individuales.

**Características:**
- Estados visuales (subido/pendiente)
- Upload de archivos
- Menú de acciones (ver, reemplazar, detalles)
- Integración con sistema de notificaciones

### ExtraDocumentCard
Componente para documentos extra con funcionalidades adicionales.

**Características:**
- Diseño diferenciado con bordes punteados
- Funcionalidad de eliminación
- Badge identificativo "Extra"
- Gestión independiente de archivos

### SearchContractual
Componente de búsqueda con funcionalidades:
- Búsqueda en tiempo real
- Botón de limpiar búsqueda
- Icono de búsqueda integrado

### ContractualSkeleton
Componente de carga con skeletons para mejor UX durante la carga de datos.

### MemberDocumentDetails
Sheet lateral para mostrar detalles de documentos con contexto global.

## Estructura de Archivos

```
etapa-contractual/
├── ContractualDialog.tsx          # Componente principal
├── ContractualCard.tsx            # Card para documentos regulares
├── ExtraDocumentCard.tsx          # Card para documentos extra
├── SearchContractual.tsx          # Componente de búsqueda
├── ContractualSkeleton.tsx        # Componente de carga
├── MemberDocumentDetails.tsx      # Sheet de detalles
├── actions/
│   └── actionServer.ts           # Funciones del servidor
├── index.ts                      # Exports centralizados
└── README.md                     # Este archivo
```

## Uso

```tsx
import { ContractualDialog } from './etapa-contractual'

<ContractualDialog
  contractMemberId="contract-member-id"
  contractName="Nombre del Contrato"
>
  <DocumentCard
    title="Documentos de Seguimiento"
    description="Documentos requeridos durante el curso del contrato"
    icon={<ClipboardList className="h-8 w-8" />}
    color="text-purple-600"
    link="#"
    status={{ text: "Pendiente", color: "destructive" }}
  />
</ContractualDialog>
```

## Eventos

El componente escucha y dispara los siguientes eventos:

- `contractual-document-change`: Disparado cuando hay cambios en documentos para refrescar la lista

## Funcionalidades Principales

1. **Gestión de Documentos por Mes**: Los documentos se organizan automáticamente por mes
2. **Búsqueda Avanzada**: Filtrado en tiempo real por nombre de documento
3. **Estadísticas en Vivo**: Contador de documentos totales, subidos y pendientes
4. **Responsive Design**: Adaptable a diferentes tamaños de pantalla
5. **Upload de Archivos**: Soporte para PDF, DOC, DOCX
6. **Estados Visuales**: Indicadores claros de estado de cada documento
7. **Scroll Organizado**: Header fijo, área de documentos scrolleable, footer con progreso

## Integración

Este componente se integra perfectamente con:
- Sistema de toast notifications
- Context de detalles de documentos
- Gestión de estados global de contratos
- Sistema de cache optimizado

## Estilo y UX

- **Tema Púrpura**: Diferenciado del azul de precontractuales
- **Animaciones Suaves**: Transiciones en hover y cambios de estado
- **Feedback Visual**: Indicadores de progreso y estados claros
- **Accesibilidad**: Navegación por teclado y screen readers 