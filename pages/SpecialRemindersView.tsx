
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpecialReminder, SupplierKey } from '../types';
import { SUPPLIER_CONFIG, SUPPLIER_OPTIONS } from '../constants';
import { useAppState } from '../contexts/AppStateContext';
import { formatDate, getTodayDateString } from '../utils';

const SpecialRemindersView: React.FC = () => {
    const navigate = useNavigate();
    const { specialReminders, setSpecialReminders } = useAppState();
    const [newReminderDate, setNewReminderDate] = useState<string>(getTodayDateString());
    const [newReminderSupplier, setNewReminderSupplier] = useState<string>(SupplierKey.Planta);
    const [newReminderDescription, setNewReminderDescription] = useState<string>('');

    const addSpecialReminder = () => {
        if (!newReminderDate || !newReminderSupplier || !newReminderDescription.trim()) {
            alert("Por favor, completa todos los campos para el aviso especial.");
            return;
        }
        const newReminder: SpecialReminder = {
            id: new Date().toISOString(), date: newReminderDate,
            supplier: newReminderSupplier, description: newReminderDescription.trim()
        };
        setSpecialReminders(prev => [...prev, newReminder].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setNewReminderDate(getTodayDateString()); setNewReminderSupplier(SupplierKey.Planta); setNewReminderDescription('');
    };

    const deleteSpecialReminder = (id: string) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar este aviso especial?")) {
            setSpecialReminders(prev => prev.filter(r => r.id !== id));
        }
    };
    
    const inputClasses = "mt-1 block w-full p-2 border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";

    return (
        <div>
            <button onClick={() => navigate('/')} className="mb-6 bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg shadow">&larr; Volver al Menú Principal</button>
            <h1 className={`text-xl sm:text-2xl font-bold mb-6 text-center text-[#D92200] dark:text-[#FF4136]`}>Gestionar Avisos Especiales de Pedido</h1>
            <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Añadir Nuevo Aviso Especial</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div><label htmlFor="specialReminderDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fecha del Aviso:</label><input type="date" id="specialReminderDate" value={newReminderDate} onChange={e => setNewReminderDate(e.target.value)} className={inputClasses} /></div>
                    <div><label htmlFor="specialReminderSupplier" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Proveedor:</label><select id="specialReminderSupplier" value={newReminderSupplier} onChange={e => setNewReminderSupplier(e.target.value)} className={inputClasses}>{SUPPLIER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                    <div><label htmlFor="specialReminderDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción / Motivo:</label><input type="text" id="specialReminderDescription" value={newReminderDescription} onChange={e => setNewReminderDescription(e.target.value)} placeholder="Ej: Pedido adelantado por feriado" className={inputClasses} /></div>
                </div>
                <button onClick={addSpecialReminder} className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow">Añadir Aviso</button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Avisos Especiales Guardados</h2>
                <ul className="space-y-3">
                    {specialReminders.length === 0 ? (<li className="text-slate-500 dark:text-slate-400 text-center">No hay avisos especiales guardados.</li>) : (
                        specialReminders.map(reminder => (
                            <li key={reminder.id} className="p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 dark:text-slate-200">
                                <div><p className="font-semibold">{formatDate(reminder.date)} - {SUPPLIER_CONFIG[reminder.supplier as SupplierKey]?.name || reminder.supplier}</p><p className="text-sm text-slate-600 dark:text-slate-400">{reminder.description}</p></div>
                                <button onClick={() => deleteSpecialReminder(reminder.id)} className="text-xs bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded-md shadow-sm">Eliminar</button>
                            </li>)))}
                </ul>
            </div>
        </div>
    );
};

export default SpecialRemindersView;
