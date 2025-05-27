// Componente principal del Dialog
export { default as PrecontractualDialog } from './PrecontractualDialog';

// Componentes internos (por si se necesitan individualmente)
export { PrecontractualCard } from './PrecontractualCard';
export { SearchPrecontractual } from './SearchPrecontractual';
export { default as PrecontractualSkeleton } from './PrecontractualSkeleton';
export { default as ActionMenu } from './ActionMenu';
export { default as MemberDocumentDetails, useDocumentDetails } from './MemberDocumentDetails';

// Acciones (por si se necesitan en otros lugares)
export * from './actions/actionServer';
export * from './actions/actionsClient'; 