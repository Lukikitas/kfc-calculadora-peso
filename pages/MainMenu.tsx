
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { SUPPLIER_CONFIG, DATE_OPTIONS } from '../constants';
import { SupplierKey } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/ui/Icons';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const { getRemindersForDate } = useAppState();
  
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [remindersForSelectedDate, setRemindersForSelectedDate] = useState<string[]>([]);

  useEffect(() => {
    setRemindersForSelectedDate(getRemindersForDate(selectedCalendarDate));
  }, [selectedCalendarDate, getRemindersForDate]);
  
  const kfcButtonClass = "p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md text-center text-white transition-all duration-200 ease-in-out transform hover:scale-105";
  const kfcPrimary = `bg-[#D92200] hover:bg-[#B91C00] dark:bg-[#FF4136] dark:hover:bg-[#FF6259]`;

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  
  const generateCalendarDays = (year: number, month: number): (Date | null)[] => {
    const days: (Date | null)[] = [];
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let startDayOfWeek = firstDayOfMonth.getDay(); 
    startDayOfWeek = (startDayOfWeek === 0) ? 6 : startDayOfWeek - 1;

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const calendarDays = generateCalendarDays(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth());

  const handlePrevMonth = () => {
    setCurrentDisplayMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDisplayMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date | null) => {
    if (date) {
      setSelectedCalendarDate(date);
    }
  };
  
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };
  
  const isToday = (date: Date): boolean => {
    return isSameDay(date, new Date());
  }

  return (
    <div className="text-center">
      <img src="https://upload.wikimedia.org/wikipedia/sco/thumb/b/bf/KFC_logo.svg/200px-KFC_logo.svg.png" alt="Logo KFC" className="w-32 h-32 mx-auto mb-4 rounded-full shadow-lg bg-white p-2" />
      <h1 className={`text-3xl sm:text-4xl font-bold text-[#D92200] dark:text-[#FF4136]`}>KFC La Plata</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mt-2 mb-6">{new Date().toLocaleDateString('es-AR', DATE_OPTIONS)}</p>

      <div className="my-6 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-md max-w-sm mx-auto">
        <div className="flex justify-between items-center mb-3">
          <button onClick={handlePrevMonth} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300" aria-label="Mes anterior">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {currentDisplayMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={handleNextMonth} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300" aria-label="Mes siguiente">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 dark:text-slate-400">
          {daysOfWeek.map(day => <div key={day} className="font-medium p-1">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 mt-1">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              disabled={!day}
              className={`p-1 rounded-md text-xs h-8 w-8 flex items-center justify-center
                ${!day ? 'bg-transparent' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}
                ${day && isSameDay(day, selectedCalendarDate) ? `bg-[#D92200] text-white hover:bg-[#B91C00] dark:bg-[#FF4136] dark:hover:bg-[#FF6259]` : 'text-slate-700 dark:text-slate-200'}
                ${day && isToday(day) && !isSameDay(day, selectedCalendarDate) ? 'border-2 border-blue-500 dark:border-blue-400' : ''}
              `}
            >
              {day ? day.getDate() : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="my-6 p-4 bg-yellow-100 dark:bg-yellow-800 border-l-4 border-yellow-500 dark:border-yellow-600 rounded-md shadow text-left">
        <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Avisos de Pedidos para {selectedCalendarDate.toLocaleDateString('es-AR', DATE_OPTIONS)}:
        </h2>
        {remindersForSelectedDate.length > 0 ? (
            <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 text-sm">
            {remindersForSelectedDate.map((reminder, index) => <li key={index}>{reminder}</li>)}
            </ul>
        ) : (
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">No hay pedidos programados para esta fecha.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Object.keys(SUPPLIER_CONFIG) as SupplierKey[]).map(key => (
          <button key={key} onClick={() => navigate(`/calculator/${key}`)} className={`${kfcButtonClass} ${kfcPrimary}`}>
            <h2 className="text-xl font-semibold mb-2">Pedidos {SUPPLIER_CONFIG[key].name.toUpperCase()}</h2>
            <p className="text-sm opacity-90">
              {key === SupplierKey.Planta ? "Pollo y productos principales." :
               key === SupplierKey.Fargo ? "Panadería (pan regular, brioche)." :
               key === SupplierKey.ReginaldLee ? "Bebidas (botellas, jarabes, jugos)." :
               "Insumos varios y consumibles."}
            </p>
          </button>
        ))}
        <button onClick={() => navigate('/weight-calculator')} className={`${kfcButtonClass} bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600`}>
          <h2 className="text-xl font-semibold mb-2">Calculadora por Peso</h2>
          <p className="text-sm opacity-90">Calculá unidades según el peso total.</p>
        </button>
        <button onClick={() => navigate('/all-orders')} className={`${kfcButtonClass} bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700`}>
          <h2 className="text-xl font-semibold mb-2">Ver Todos los Pedidos</h2>
          <p className="text-sm opacity-90">Consolidado con filtros.</p>
        </button>
        <button onClick={() => navigate('/special-reminders')} className={`${kfcButtonClass} bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700`}>
          <h2 className="text-xl font-semibold mb-2">Avisos Especiales</h2>
          <p className="text-sm opacity-90">Gestionar recordatorios de pedidos únicos.</p>
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
