import React, { useEffect, useRef, useState } from 'react';
import { UploadIcon } from '../components/ui/Icons';

interface WeightItem {
  id: string;
  name: string;
  gramsPerUnit: number;
}

const STORAGE_KEY = 'kfc_weight_calculator_items';
const HIDDEN_DEFAULT_ITEMS_KEY = 'kfc_weight_calculator_hidden_default_items';
const defaultItemNames = [
  'Barbacoa individual',
  'BOLSA DE LLEVAR GRANDE KFC2',
  'BOLSA LLEVAR GRANDE MUNDIAL KFC',
  'BOLSA LLEVAR MEDIANA KFC CAJA X 600',
  'CUCHARITA X 1000 UND',
  'CUCHILLO X 1000 UND',
  'KETCHUP INDIVIDUAL',
  'MAYONESA INDIVIDUAL',
  'MOSTAZA INDIVIDUAL',
  'PORTAVASOS KFC X 200 UND',
  'SERVILLETAS 30X30',
  'TAPA VASO GASEOSA 16OZ',
  'TAPA VASO GASEOSA 12OZ',
  'TENEDOR',
  'TENEDOR X 1000 UND',
  'VASO GASEOSA 12OZ MUNDIAL KFC',
  'VASO GASEOSA 16OZ MUNDIAL KFC',
  'VASO GASEOSA 21OZ MUNDIAL KFC',
  'BANDEJA CANOA KFC',
  'BOLSA SIN MANIJA GRANDE KFC X 250 UND',
  'BOWL 4.1OZ X 2000 UND',
  'BUCKET 50OZ X 420 UND',
  'BUCKET 85OZ X 330 UND',
  'BUCKET MUNDIAL 85OZ X 330 UND',
  'BUCKETS 130OZ MUNDIAL',
  'CAJA BIG BOX KFC',
  'CAJA SNACK CON TAPA KFC X 800 UND',
  'CAJA SNACK KFC X 400 UND',
  'ESTUCHE PAPAS GRANDES KFC',
  'ESTUCHE PAPAS MEDIANAS KFC',
  'ESTUCHE POPCORN GRANDE',
  'ESTUCHE POPCORN MEDIANO',
  'ETIQUETA VENCIMIENTO X 22500 UND',
  'LAMINA ANTIGRASA SANDWICH KFC X1500',
  'MANTELITO MUNDIAL KFC X 2000 UND',
  'PAPEL ANTIGRASA BLANCO',
  'PAPEL ANTIGRASA SANDWICH KFC 2',
  'POTE 4 OZ KFC X 1500 UND',
  'POTE 4 OZ PROMO X 1500 UND',
  'SOBRE KFC X 1000 UND',
  'TAPA BOWL 4.1OZ X 2000 UND',
  'TAPA BUCKET KFC X 2150 UND',
  'TAPA CAJA BIG BOX',
  'TAPA CAJA SNACK KFC X 250 UND',
  'TAPA POTE 4 OZ X 1500 UND',
  'TAPA SALSA BUCKET MUNDIAL KFC X 400',
  'VASO 14OZ KFC',
  'VASO CAFE 8 OZ KFC',
  'VASO GASEOSA 12OZ KFC A',
  'VASO GASEOSA 16OZ KFC A',
  'VASO GASEOSA 21OZ KFC',
  'VASO CAFE 12 OZ KFC X 1000',
  'ETC TEMPERO',
  'SEASONING OR',
  'SERVILLETAS 30X30 X 5000 UND',
  'ALIOLI A GRANEL X 6 KG',
  'BARBACOA INDIVIDUAL KFC X 144 UND',
  'MAYONESA A GRANEL',
  'MOSTAZA CON MIEL INDIVIDUAL KFC X 144U',
  'SALSA ALIOLI KFC X 144 UND',
  'SALSA BARBACOA A GRANEL',
  'SALSA BARBACOA INDIVIDUAL',
  'SALSA PICANTE KFC X 144 UND',
  'SALSA SECRETA GRANEL KFC X 5.25 KG',
  'SALSA TERIYAKI KFC X 144 UND',
];

const defaultItems: WeightItem[] = defaultItemNames.map((name, index) => ({
  id: `default-${index}`,
  name,
  gramsPerUnit: name === 'Barbacoa individual' ? 25 : 0,
}));

const normalizeName = (name: string) => name.trim().toLowerCase();

const getHiddenDefaultNames = (): string[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(HIDDEN_DEFAULT_ITEMS_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((name): name is string => typeof name === 'string') : [];
  } catch {
    return [];
  }
};

const getItems = (): WeightItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const hiddenNames = new Set(getHiddenDefaultNames());
    const availableDefaults = defaultItems.filter(item => !hiddenNames.has(normalizeName(item.name)));
    if (!saved) return availableDefaults;
    const parsed = JSON.parse(saved) as WeightItem[];
    if (!Array.isArray(parsed)) return availableDefaults;
    const validSaved = parsed.filter(item => item.name && Number.isFinite(item.gramsPerUnit) && item.gramsPerUnit >= 0);
    const byName = new Map(availableDefaults.map(item => [normalizeName(item.name), item]));
    validSaved.forEach(item => byName.set(normalizeName(item.name), item));
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  } catch {
    return defaultItems;
  }
};

const parseNumber = (value: string): number => Number(value.trim().replace(',', '.'));

const parseCsvLine = (line: string, separator: string): string[] => {
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const character = line[i];
    if (character === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i++; } else quoted = !quoted;
    } else if (character === separator && !quoted) {
      values.push(current.trim());
      current = '';
    } else current += character;
  }
  values.push(current.trim());
  return values;
};

const WeightCalculator: React.FC = () => {
  const [items, setItems] = useState<WeightItem[]>(getItems);
  const [totalWeights, setTotalWeights] = useState<Record<string, string>>({});
  const [hiddenDefaultNames, setHiddenDefaultNames] = useState<string[]>(getHiddenDefaultNames);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [unitWeightDraft, setUnitWeightDraft] = useState('');
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem(HIDDEN_DEFAULT_ITEMS_KEY, JSON.stringify(hiddenDefaultNames)); }, [hiddenDefaultNames]);

  const startEditing = (item: WeightItem) => {
    setEditingId(item.id);
    setUnitWeightDraft(String(item.gramsPerUnit));
    setMessage('');
  };

  const saveUnitWeight = (id: string) => {
    const gramsPerUnit = parseNumber(unitWeightDraft);
    if (!Number.isFinite(gramsPerUnit) || gramsPerUnit <= 0) {
      setMessage('Ingresá un peso unitario válido mayor a cero.');
      return;
    }
    setItems(previous => previous.map(item => item.id === id ? { ...item, gramsPerUnit } : item));
    setEditingId(null);
    setMessage('Peso unitario actualizado.');
  };

  const addItem = () => {
    const name = newName.trim();
    const gramsPerUnit = newWeight.trim() ? parseNumber(newWeight) : 0;
    if (!name || !Number.isFinite(gramsPerUnit) || gramsPerUnit < 0) {
      setMessage('Completá el nombre y, si indicás un peso unitario, usá un valor válido.');
      return;
    }
    const item: WeightItem = {
      id: `${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      gramsPerUnit,
    };
    setItems(previous => [...previous, item].sort((a, b) => a.name.localeCompare(b.name, 'es')));
    setHiddenDefaultNames(previous => previous.filter(hiddenName => hiddenName !== normalizeName(name)));
    setNewName('');
    setNewWeight('');
    setMessage('Ítem agregado.');
  };

  const deleteItem = (id: string) => {
    const item = items.find(current => current.id === id);
    if (item && defaultItems.some(defaultItem => normalizeName(defaultItem.name) === normalizeName(item.name))) {
      setHiddenDefaultNames(previous => [...new Set([...previous, normalizeName(item.name)])]);
    }
    setItems(previous => previous.filter(item => item.id !== id));
    setTotalWeights(previous => {
      const { [id]: _, ...rest } = previous;
      return rest;
    });
    setMessage('Ítem eliminado.');
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(row => row.trim());
    if (!rows.length) { setMessage('El archivo está vacío.'); return; }
    const separator = (rows[0].match(/;/g)?.length || 0) >= (rows[0].match(/,/g)?.length || 0) ? ';' : ',';
    const header = parseCsvLine(rows[0], separator).map(value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
    const nameColumn = header.findIndex(value => ['item', 'producto', 'nombre', 'articulo'].includes(value));
    const weightColumn = header.findIndex(value => ['gramos por unidad', 'peso por unidad', 'peso_unitario_g', 'gramos', 'peso', 'gramos/unidad'].includes(value));
    const hasHeader = nameColumn >= 0;
    const imported: WeightItem[] = [];
    rows.slice(hasHeader ? 1 : 0).forEach((row, index) => {
      const columns = parseCsvLine(row, separator);
      const name = columns[hasHeader ? nameColumn : 0]?.trim();
      const rawWeight = weightColumn >= 0 ? columns[weightColumn] : columns[hasHeader ? -1 : 1];
      const gramsPerUnit = rawWeight?.trim() ? parseNumber(rawWeight) : 0;
      if (name && Number.isFinite(gramsPerUnit) && gramsPerUnit >= 0) {
        imported.push({ id: `import-${Date.now()}-${index}`, name, gramsPerUnit });
      }
    });
    if (!imported.length) {
      setMessage('No encontré ítems válidos. Usá una columna “Producto”; “Gramos por unidad” es opcional.');
      return;
    }
    setItems(previous => {
      const byName = new Map(previous.map(item => [item.name.trim().toLowerCase(), item]));
      imported.forEach(item => byName.set(item.name.trim().toLowerCase(), item));
      return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    });
    setHiddenDefaultNames(previous => previous.filter(hiddenName => !imported.some(item => normalizeName(item.name) === hiddenName)));
    setMessage(`${imported.length} ítem(s) importado(s). Los existentes se actualizaron.`);
  };

  const inputClasses = 'mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-violet-500 focus:ring-violet-500 p-3';
  const visibleItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  return (
    <main className="max-w-4xl mx-auto pb-8 sm:pb-12">
      <header className="text-center pt-4 sm:pt-8 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-violet-700 dark:text-violet-400 leading-tight">Calculadora por Peso</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">Cargá el peso total de cada producto para saber cuántas unidades tenés.</p>
      </header>

      <section className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Buscar ítem</span>
          <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className={inputClasses} placeholder="Escribí el nombre del producto" />
        </label>
        {visibleItems.map(item => {
          const grams = parseNumber(totalWeights[item.id] || '0');
          const hasWeight = Number.isFinite(grams) && grams > 0;
          const canCalculate = hasWeight && item.gramsPerUnit > 0;
          const units = canCalculate ? grams / item.gramsPerUnit : 0;
          const completeUnits = Math.floor(units);
          const remainder = hasWeight ? grams - completeUnits * item.gramsPerUnit : 0;
          const isEditing = editingId === item.id;
          return (
            <article key={item.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{item.name}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Peso unitario: <strong>{item.gramsPerUnit > 0 ? `${item.gramsPerUnit} g` : 'sin definir'}</strong></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEditing(item)} className="flex-1 sm:flex-none bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold py-1.5 px-2 rounded-md touch-manipulation">
                    {item.gramsPerUnit > 0 ? 'Modificar peso unitario' : 'Definir peso unitario'}
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 font-medium py-2 px-2">Eliminar</button>
                </div>
              </div>

              {isEditing && (
                <div className="mt-4 p-3 bg-violet-50 dark:bg-violet-950/40 rounded-lg">
                  <label className="block text-sm font-medium">Gramos por unidad</label>
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <input type="number" inputMode="decimal" min="0" step="0.01" value={unitWeightDraft} onChange={event => setUnitWeightDraft(event.target.value)} className="block w-full rounded-md border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-3" autoFocus />
                    <button onClick={() => saveUnitWeight(item.id)} className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg">Guardar</button>
                    <button onClick={() => setEditingId(null)} className="text-slate-600 dark:text-slate-300 font-medium py-3 px-3">Cancelar</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 items-end">
                <div>
                  <label className="block text-sm font-medium">Peso total medido (gramos)</label>
                  <input type="number" inputMode="decimal" min="0" step="0.01" value={totalWeights[item.id] || ''} onChange={event => setTotalWeights(previous => ({ ...previous, [item.id]: event.target.value }))} className={inputClasses} placeholder="Ej.: 250" />
                </div>
                <div className="rounded-lg bg-violet-50 dark:bg-violet-950/40 p-3 sm:p-4 min-h-[92px] flex flex-col justify-center">
                  {canCalculate ? <>
                    <p className="text-2xl font-bold text-violet-800 dark:text-violet-200">{completeUnits} unidades</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Sobrante: {remainder.toFixed(2).replace('.', ',')} g</p>
                  </> : <p className="text-sm text-slate-600 dark:text-slate-300">{hasWeight ? 'Definí el peso unitario para calcular.' : 'Ingresá el peso total para calcular.'}</p>}
                </div>
              </div>
            </article>
          );
        })}
        {visibleItems.length === 0 && <p className="text-center py-6 text-slate-600 dark:text-slate-300">No se encontraron ítems con esa búsqueda.</p>}
      </section>

      <section className="mt-6 p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold">Agregar o importar ítems</h2>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) importCsv(file); event.currentTarget.value = ''; }} />
          <button onClick={() => inputRef.current?.click()} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg shadow flex items-center justify-center touch-manipulation"><UploadIcon />Importar lista CSV</button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Desde Excel guardá la hoja como <strong>CSV UTF-8</strong>, con la columna <strong>Producto</strong>. <strong>Gramos por unidad</strong> es opcional y se puede completar después.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input value={newName} onChange={event => setNewName(event.target.value)} className={inputClasses} placeholder="Nombre del ítem" />
          <input type="number" inputMode="decimal" min="0" step="0.01" value={newWeight} onChange={event => setNewWeight(event.target.value)} className={inputClasses} placeholder="Gramos por unidad (opcional)" />
          <button onClick={addItem} className="mt-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg shadow touch-manipulation">Agregar ítem</button>
        </div>
        {message && <p className="mt-3 text-sm text-violet-700 dark:text-violet-300">{message}</p>}
      </section>
    </main>
  );
};

export default WeightCalculator;
