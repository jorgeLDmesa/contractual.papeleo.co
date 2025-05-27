# Dialog de Documentos Precontractuales 🎨

Este componente proporciona un Dialog modal **moderno y elegante** para gestionar documentos precontractuales sin necesidad de redirigir a otra página.

## ✨ Características

- **🎨 Diseño Moderno**: UI completamente rediseñado con gradientes y animaciones
- **📱 Totalmente Responsive**: Adaptado para móvil, tablet y desktop
- **🔍 Búsqueda Avanzada**: Filtrado en tiempo real con indicadores de resultados
- **📊 Estadísticas en Tiempo Real**: Progreso visual y contadores
- **⚡ Estados de Loading**: Skeletons y spinners elegantes
- **🎯 UX Mejorada**: Mejor jerarquía visual y spacing
- **🌈 Indicadores Visuales**: Colores y badges para estados
- **📄 Preview Detallado**: Sheet de detalles completamente rediseñado

## 🎯 Mejoras de UI/UX Implementadas

### 🌟 Header Rediseñado
- Gradiente azul profesional con overlay
- Iconos y badges informativos
- Estadísticas en tiempo real (Total, Subidos, Pendientes)
- Diseño visual atractivo y profesional

### 🔍 Búsqueda Mejorada
- Input integrado con iconos
- Feedback inmediato de resultados
- Botón de limpiar búsqueda
- Mensajes contextuales

### 📊 Grid Responsivo
- Layout adaptativo: 1 col (móvil) → 2 cols (tablet) → 3-4 cols (desktop)
- Cards rediseñadas con gradientes y animaciones
- Indicadores de estado visuales
- Mejor spacing y jerarquía

### 🎨 Cards Modernos
- Línea de estado superior colorizada
- Iconos y badges informativos
- Animaciones hover suaves
- Gradientes para documentos completados
- Botones de acción mejorados

### 📈 Barra de Progreso
- Footer con indicador visual de progreso
- Porcentaje de completitud
- Información contextual

## 🚀 Uso Básico

```tsx
import { PrecontractualDialog } from './etapa-precontractual';

function MyComponent() {
  return (
    <PrecontractualDialog
      contractMemberId="contract-member-id"
      contractName="Nombre del Contrato"
    >
      <Button>Ver Documentos Precontractuales</Button>
    </PrecontractualDialog>
  );
}
```

## 📐 Props

### PrecontractualDialog

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `contractMemberId` | `string` | ✅ | ID del miembro del contrato |
| `contractName` | `string` | ❌ | Nombre del contrato (opcional) |
| `children` | `React.ReactNode` | ✅ | Elemento que activa el dialog |

## 🗂️ Estructura de Archivos

```
etapa-precontractual/
├── PrecontractualDialog.tsx      # 🎨 Componente principal rediseñado
├── PrecontractualCard.tsx        # 💎 Card con nuevo diseño moderno
├── PrecontractualSkeleton.tsx    # ⏳ Skeleton actualizado
├── ActionMenu.tsx               # 🎯 Menú mejorado con iconos
├── MemberDocumentDetails.tsx    # 📋 Sheet de detalles rediseñado
├── actions/
│   ├── actionServer.ts          # 🔧 Funciones del servidor
│   └── actionsClient.ts         # 💻 Funciones del cliente
├── README.md                    # 📚 Documentación actualizada
└── index.ts                     # 📦 Exports centralizados
```

## 🎨 Características Visuales

### 🌈 Colores y Estados
- **Verde**: Documentos completados con gradiente emerald
- **Naranja/Rojo**: Documentos pendientes con gradiente warm
- **Azul**: Elementos interactivos y plantillas
- **Gris**: Estados neutros y skeleton

### 📱 Responsive Design
```css
/* Breakpoints optimizados */
mobile:    1 columna  (< 640px)
tablet:    2 columnas (640px - 1024px)
desktop:   3 columnas (1024px - 1280px)
large:     4 columnas (> 1280px)
```

### ⚡ Animaciones
- Hover effects suaves en cards
- Transiciones de colores y sombras
- Loading spinners elegantes
- Animación de barra de progreso

## 🔧 Funcionalidades Técnicas

### 1. 📄 Gestión de Documentos
- Lista documentos requeridos con estado visual
- Upload con validación de tipos
- Replace con confirmación
- Preview con URLs firmadas

### 2. 🔍 Búsqueda Inteligente
- Filtrado case-insensitive en tiempo real
- Contador de resultados
- Estados vacíos contextuales
- Botón de limpiar integrado

### 3. 📊 Estadísticas Dinámicas
- Contadores en tiempo real
- Barra de progreso animada
- Porcentaje de completitud
- Feedback visual inmediato

### 4. 🎯 Estados de UI
- Loading states elegantes
- Empty states informativos
- Error handling visual
- Success feedback

## 🎮 Eventos y Comunicación

```javascript
// Evento para actualizaciones en tiempo real
window.dispatchEvent(new Event('precontractual-document-change'));
```

## 📱 Ejemplo de Integración

```tsx
// En DocumentCards.tsx
<PrecontractualDialog
  contractMemberId={selectedContract}
  contractName={currentContract?.name}
>
  <DocumentCard
    title="Documentos Pre-Contrato"
    description="Documentos necesarios para la firma del contrato"
    icon={<FileSignature className="h-8 w-8" />}
    color="text-blue-600"
    link="#"
    status={
      contractStatus.precontractual
        ? { text: "Completado", color: "default" }
        : { text: "Pendiente", color: "destructive" }
    }
  />
</PrecontractualDialog>
```

## 🎨 Personalización de Estilos

### Colores Principales
```css
--primary-blue: rgb(37 99 235)      /* bg-blue-600 */
--success-green: rgb(34 197 94)     /* bg-green-500 */
--warning-orange: rgb(249 115 22)   /* bg-orange-500 */
--neutral-gray: rgb(107 114 128)    /* bg-gray-500 */
```

### Gradientes
```css
--header-gradient: linear-gradient(to right, #2563eb, #1d4ed8, #1e40af)
--success-gradient: linear-gradient(to bottom right, #ecfdf5, #d1fae5)
--pending-gradient: linear-gradient(to right, #f97316, #dc2626)
```

## 🔍 Detalles de Implementación

### 📏 Dimensiones del Dialog
- **Ancho**: 95vw (máximo 7xl = 80rem)
- **Alto**: 95vh para máximo aprovechamiento
- **Responsive**: Se adapta automáticamente

### 📋 Scroll y Layout
- Header fijo con información
- Área de contenido scrolleable
- Footer fijo con progreso
- Grid responsive automático

### 🎯 Accesibilidad
- Navegación por teclado
- Contraste de colores adecuado
- Labels descriptivos
- Estados focus visibles

## 🚀 Ejemplo Completo con Nuevo Diseño

```tsx
import { PrecontractualDialog } from '@/app/landing/contratista/_components/etapa-precontractual';

export default function ModernContractPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Gestión de Contratos
        </h1>
        
        <PrecontractualDialog
          contractMemberId="cm_123456"
          contractName="Contrato de Servicios Profesionales 2024"
        >
          <button className="group relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <span className="relative z-10 font-semibold">
              🚀 Gestionar Documentos Precontractuales
            </span>
            <div className="absolute inset-0 bg-black/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </PrecontractualDialog>
      </div>
    </div>
  );
}
```

¡Ahora el Dialog tiene un diseño moderno, profesional y una experiencia de usuario excepcional! 🎉 