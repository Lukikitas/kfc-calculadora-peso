
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Product, SpecialReminder, Order, SupplierKey } from '../types';
import * as StorageManager from '../services/storage';
import { SUPPLIER_CONFIG } from '../constants';

interface AppStateContextType {
  axionItems: Product[];
  setAxionItems: React.Dispatch<React.SetStateAction<Product[]>>;
  specialReminders: SpecialReminder[];
  setSpecialReminders: React.Dispatch<React.SetStateAction<SpecialReminder[]>>;
  getOrderHistory: (supplierKey: SupplierKey) => Order[];
  saveOrderHistory: (supplierKey: SupplierKey, orders: Order[]) => void;
  getRemindersForDate: (date: Date) => string[];
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if(!context) throw new Error('useAppState must be used within an AppStateProvider');
  return context;
}

export const AppStateProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [axionItems, setAxionItems] = useState<Product[]>(StorageManager.getAxionItems());
  const [specialReminders, setSpecialReminders] = useState<SpecialReminder[]>(StorageManager.getSpecialReminders());

  useEffect(() => {
    StorageManager.saveAxionItems(axionItems);
  }, [axionItems]);

  useEffect(() => {
    StorageManager.saveSpecialReminders(specialReminders);
  }, [specialReminders]);

  const getOrderHistory = useCallback((supplierKey: SupplierKey) => {
    return StorageManager.getOrderHistory(supplierKey);
  }, []);

  const saveOrderHistory = useCallback((supplierKey: SupplierKey, orders: Order[]) => {
    StorageManager.saveOrderHistory(supplierKey, orders);
  }, []);

  const getRemindersForDate = useCallback((forDate: Date) => {
    const dayOfWeek = forDate.getDay(); 
    let remindersText: string[] = [];
    // Sunday - Saturday : 0 - 6
    switch (dayOfWeek) { 
        case 1: remindersText = ["Reginald Lee", "Fargo", "Planta"]; break; // Monday
        case 3: remindersText = ["Fargo", "Planta"]; break; // Wednesday
        case 4: remindersText = ["AXION", "Reginald Lee"]; break; // Thursday
        case 5: remindersText = ["Axion"]; break; // Friday
        case 6: remindersText = ["Planta"]; break; // Saturday
        default: remindersText = [];
    }
    
    const formattedDate = forDate.toISOString().split('T')[0];
    specialReminders.forEach(sr => {
        if (sr.date === formattedDate) {
            remindersText.push(`(AVISO ESPECIAL) ${SUPPLIER_CONFIG[sr.supplier as SupplierKey]?.name || sr.supplier}: ${sr.description}`);
        }
    });
    return remindersText;
  }, [specialReminders]);


  return (
    <AppStateContext.Provider value={{ axionItems, setAxionItems, specialReminders, setSpecialReminders, getOrderHistory, saveOrderHistory, getRemindersForDate }}>
      {children}
    </AppStateContext.Provider>
  )
}
