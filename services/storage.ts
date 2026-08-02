
import { Order, Product, SpecialReminder, Theme, SupplierKey } from '../types';
import { DEFAULT_AXION_ITEMS, LOCAL_STORAGE_AXION_ITEMS_KEY, LOCAL_STORAGE_SPECIAL_REMINDERS_KEY, SUPPLIER_CONFIG, LOCAL_STORAGE_THEME_KEY } from '../constants';

// Generic getter
function getStoredData<T,>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
}

// Generic setter
function setStoredData<T,>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
}

// Theme
export const getStoredTheme = (): Theme => {
  const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as Theme | null;
  return storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
};
export const setStoredTheme = (theme: Theme): void => localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);

// Orders
export const getOrderHistory = (supplierKey: SupplierKey): Order[] => {
  const config = SUPPLIER_CONFIG[supplierKey];
  if (!config) return [];
  return getStoredData<Order[]>(config.localStorageKey, []);
};

export const saveOrderHistory = (supplierKey: SupplierKey, orders: Order[]): void => {
  const config = SUPPLIER_CONFIG[supplierKey];
  if (config) {
    setStoredData<Order[]>(config.localStorageKey, orders);
  }
};

// Axion Items
export const getAxionItems = (): Product[] => {
    const storedItems = getStoredData<Product[]>(LOCAL_STORAGE_AXION_ITEMS_KEY, DEFAULT_AXION_ITEMS);
    // Ensure default structure if items are loaded without it (e.g. from old data)
    return storedItems.map(item => ({
        unitsPerBag: 1,
        bagsPerCase: 1,
        unitName: 'Uds',
        packageOrderUnit: 'Paq.',
        caseOrderUnit: 'Paq.',
        ...item
    }));
};
export const saveAxionItems = (items: Product[]): void => setStoredData<Product[]>(LOCAL_STORAGE_AXION_ITEMS_KEY, items);

// Special Reminders
export const getSpecialReminders = (): SpecialReminder[] => getStoredData<SpecialReminder[]>(LOCAL_STORAGE_SPECIAL_REMINDERS_KEY, []);
export const saveSpecialReminders = (reminders: SpecialReminder[]): void => setStoredData<SpecialReminder[]>(LOCAL_STORAGE_SPECIAL_REMINDERS_KEY, reminders);

// Utility to get all orders for "All Orders" view
export const getAllOrders = (): Order[] => {
  let allOrders: Order[] = [];
  Object.values(SupplierKey).forEach(key => {
    const supplierKeyStr = key as SupplierKey;
    const supplierOrders = getOrderHistory(supplierKeyStr);
    const supplierName = SUPPLIER_CONFIG[supplierKeyStr]?.name || 'Desconocido';
    allOrders = allOrders.concat(supplierOrders.map(order => ({ ...order, supplierKey: supplierKeyStr, supplierName })));
  });
  allOrders.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
  return allOrders;
};
