
export interface Product {
  id: string;
  name: string;
  unitsPerBag: number;
  bagsPerCase: number;
  unitName: string;
  packageOrderUnit: string;
  caseOrderUnit: string;
}

export interface Supplier {
  name: string;
  localStorageKey: string;
  products: Product[];
  localStorageItemsKey?: string; // For Axion
}

export enum SupplierKey {
  Planta = 'planta',
  Fargo = 'fargo',
  ReginaldLee = 'reginald_lee',
  Axion = 'axion',
}

export interface Suppliers {
  [key: string]: Supplier; // Using string key for SupplierKey enum values
}

export interface OrderItem {
  productId: string;
  productName: string;
  stockActual: number;
  usoProyectado: number;
  ajuste: number;
  usoTotalAjustado: number;
  unidadesNecesarias: number;
  bolsasNecesariasIdeal: number;
  bolsasAPedir: number; // For Axion, this is 'Pido'
  diffBags: number;
  cajonesAPedir: number; // For Axion, this is same as bolsasAPedir (effectively 'Pido')
}

export interface OrderTotals {
  totalBagsToOrder: number;
  totalCasesToOrder: number;
}

export interface Order {
  id: string; // ISO string timestamp of creation
  timestamp: string; // Formatted creation timestamp
  specificDeliveryDate: string; // YYYY-MM-DD
  items: OrderItem[];
  totals: OrderTotals;
  lastEditedTimestamp: string | null;
  supplierKey: SupplierKey; // Added for AllOrders view
  supplierName: string; // Added for AllOrders view
}

export interface SpecialReminder {
  id: string;
  date: string; // YYYY-MM-DD
  supplier: string; // Could be SupplierKey or "Otro"
  description: string;
}

export type Theme = 'light' | 'dark';

export interface CalculatorRowData extends OrderItem {
  // Combines OrderItem with potentially other UI-specific states if needed
}

// Props for Modal component
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl' | 'max-w-5xl';
  footerContent?: React.ReactNode; // Optional custom footer content
}
