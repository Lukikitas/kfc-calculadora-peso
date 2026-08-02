
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, SupplierKey } from '../types';
import { SUPPLIER_CONFIG } from '../constants';
import * as StorageManager from '../services/storage';
import { useAppState } from '../contexts/AppStateContext';
import Modal from '../components/ui/Modal';
import { formatDate } from '../utils';

const AllOrdersView: React.FC = () => {
    const navigate = useNavigate();
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [filterSupplier, setFilterSupplier] = useState<string>('all');
    const [filterDeliveryDate, setFilterDeliveryDate] = useState<string>('');
    
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
    const { axionItems } = useAppState(); 

    useEffect(() => {
        const orders = StorageManager.getAllOrders();
        setAllOrders(orders);
        setFilteredOrders(orders);
    }, []);

    const applyFilters = () => {
        let tempOrders = [...allOrders];
        if (filterSupplier !== 'all') {
            tempOrders = tempOrders.filter(order => order.supplierKey === filterSupplier);
        }
        if (filterDeliveryDate) {
            tempOrders = tempOrders.filter(order => order.specificDeliveryDate === filterDeliveryDate);
        }
        setFilteredOrders(tempOrders);
    };

    const clearFilters = () => {
        setFilterSupplier('all'); setFilterDeliveryDate(''); setFilteredOrders([...allOrders]);
    };

    const viewOrderDetails = (order: Order) => { setSelectedOrderForDetail(order); setIsDetailModalOpen(true); };
    
    const printOrderFromAllOrders = (orderToPrint: Order) => {
        if (!orderToPrint) return;
        const supplierConfigForOrder = SUPPLIER_CONFIG[orderToPrint.supplierKey];
        if(!supplierConfigForOrder) return;
        const isOrderAxion = orderToPrint.supplierKey === SupplierKey.Axion;
        const productsForOrder = isOrderAxion ? axionItems : supplierConfigForOrder.products;
        let printHTML = `<div style="font-family: Arial, sans-serif; margin: 20px; font-size: 11pt; line-height: 1.3;"><h1 style="font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 10px; color: #D00000;">Pedido KFC La Plata</h1><h2 style="font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 20px;">${orderToPrint.supplierName}</h2><div style="margin-bottom: 5px;"><p><strong>Pedido Creado:</strong> ${orderToPrint.timestamp}</p><p><strong>Fecha de Entrega:</strong> ${formatDate(orderToPrint.specificDeliveryDate)}</p></div><table style="width: 100%; border-collapse: collapse; margin-top: 15px;"><thead><tr><th style="border: 1px solid #888; padding: 6px 8px; text-align: left; background-color: #eee; font-weight: bold;">Producto</th><th style="border: 1px solid #888; padding: 6px 8px; text-align: center; background-color: #eee; font-weight: bold;">Cantidad Pedida</th>${isOrderAxion ? '' : '<th style="border: 1px solid #888; padding: 6px 8px; text-align: left; background-color: #eee; font-weight: bold;">Unidad</th> <th style="border: 1px solid #888; padding: 6px 8px; text-align: center; background-color: #eee; font-weight: bold;">Total Cajas/Paq.</th>'}</tr></thead><tbody>`;
        orderToPrint.items.forEach(item => {
            if (item.bolsasAPedir > 0) {
                const productDetails = productsForOrder.find(p => p.id === item.productId);
                const packageUnit = productDetails ? productDetails.packageOrderUnit : 'Paq./Bolsas';
                printHTML += `<tr><td style="border: 1px solid #888; padding: 6px 8px;">${item.productName}</td><td style="border: 1px solid #888; padding: 6px 8px; text-align: center;">${item.bolsasAPedir}</td>${isOrderAxion ? '' : `<td style="border: 1px solid #888; padding: 6px 8px;">${packageUnit}</td> <td style="border: 1px solid #888; padding: 6px 8px; text-align: center;">${item.cajonesAPedir}</td>`}</tr>`;
            }
        });
        printHTML += `</tbody><tfoot style="font-weight: bold;"><tr><td colspan="${isOrderAxion ? '1' : '1'}" style="border: 1px solid #888; padding: 6px 8px; text-align: right;"><strong>TOTAL${isOrderAxion ? ' UNIDADES' : 'ES'}:</strong></td><td style="border: 1px solid #888; padding: 6px 8px; text-align: center;"><strong>${isOrderAxion ? orderToPrint.totals.totalCasesToOrder : orderToPrint.totals.totalBagsToOrder}</strong></td>${isOrderAxion ? '' : '<td style="border: 1px solid #888; padding: 6px 8px;"></td> <td style="border: 1px solid #888; padding: 6px 8px; text-align: center;"><strong>' + Math.round(orderToPrint.totals.totalCasesToOrder) + '</strong></td>'}</tr></tfoot></table></div>`;
        const printWindow = window.open('', '_blank', 'height=800,width=1000');
        if (printWindow) { printWindow.document.write('<html><head><title>Imprimir Pedido KFC</title></head><body>' + printHTML + '</body></html>'); printWindow.document.close(); printWindow.focus(); setTimeout(() => printWindow.print(), 250); } 
        else { alert("No se pudo abrir la ventana de impresión. Por favor, deshabilita el bloqueador de ventanas emergentes."); }
    };

    const inputClasses = "mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";

    return (
        <div>
            <button onClick={() => navigate('/')} className="mb-6 bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg shadow">&larr; Volver al Menú Principal</button>
            <h1 className={`text-xl sm:text-2xl font-bold mb-6 text-center text-[#D92200] dark:text-[#FF4136]`}>Todos los Pedidos Guardados</h1>
            <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Filtrar Pedidos:</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                    <div><label htmlFor="filterSupplier" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Proveedor:</label><select id="filterSupplier" value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} className={inputClasses}><option value="all">Todos</option>{Object.values(SupplierKey).map(key => (<option key={key} value={key}>{SUPPLIER_CONFIG[key].name}</option>))}</select></div>
                    <div><label htmlFor="filterDeliveryDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fecha de Entrega:</label><input type="date" id="filterDeliveryDate" value={filterDeliveryDate} onChange={e => setFilterDeliveryDate(e.target.value)} className={inputClasses} /></div>
                    <div className="flex gap-2 sm:col-span-2 md:col-span-1"><button onClick={applyFilters} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow">Aplicar Filtros</button><button onClick={clearFilters} className="w-full bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold py-2 px-4 rounded-lg shadow dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-100">Limpiar</button></div>
                </div>
            </div>
            <div className="space-y-4">
                {filteredOrders.length === 0 ? (<p className="text-slate-500 dark:text-slate-400 text-center py-4">No hay pedidos que coincidan con los filtros o no hay pedidos guardados.</p>) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="p-4 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800">
                             <div className="flex justify-between items-start mb-2"><div><h4 className={`text-md font-semibold text-[#D92200] dark:text-[#FF4136]`}>{order.supplierName} - Pedido del {order.timestamp}</h4><p className="text-sm text-slate-700 dark:text-slate-300">Entrega: {formatDate(order.specificDeliveryDate)}</p>{order.lastEditedTimestamp && <p className="text-xs text-sky-600 dark:text-sky-400">Editado: {order.lastEditedTimestamp}</p>}</div><div className="flex space-x-2"><button onClick={() => printOrderFromAllOrders(order)} className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md shadow-sm">Imprimir</button><button onClick={() => viewOrderDetails(order)} className="text-xs bg-sky-500 hover:bg-sky-600 text-white py-1 px-3 rounded-md shadow-sm">Ver Detalles</button></div></div>
                            <div className="grid grid-cols-2 gap-x-4 text-sm text-slate-600 dark:text-slate-400"><p>Total Paq./Bolsas: <strong className="font-medium text-slate-800 dark:text-slate-200">{order.supplierKey === SupplierKey.Axion ? 0 : order.totals.totalBagsToOrder}</strong></p><p>Total {order.supplierKey === SupplierKey.Axion ? 'Unidades' : 'Cajas/Paq.'}: <strong className="font-medium text-slate-800 dark:text-slate-200">{Math.round(order.totals.totalCasesToOrder)}</strong></p></div>
                        </div>)))}
            </div>
            <Modal isOpen={isDetailModalOpen && selectedOrderForDetail !== null} onClose={() => setIsDetailModalOpen(false)} title={`Detalles del Pedido - ${selectedOrderForDetail?.supplierName}`} size="max-w-2xl">
                {selectedOrderForDetail && (<div className="text-sm"><p><strong>Pedido Creado:</strong> {selectedOrderForDetail.timestamp}</p><p><strong>Fecha de Entrega:</strong> {formatDate(selectedOrderForDetail.specificDeliveryDate)}</p>{selectedOrderForDetail.lastEditedTimestamp && <p><strong>Última Edición:</strong> {selectedOrderForDetail.lastEditedTimestamp}</p>}<h5 className="font-semibold mt-3 mb-1">Items:</h5><table className="min-w-full text-xs divide-y divide-slate-200 dark:divide-slate-600"><thead className="bg-slate-100 dark:bg-slate-600"><tr><th>Producto</th><th>Stock</th><th>Uso Proy.</th>{selectedOrderForDetail.supplierKey !== SupplierKey.Axion && <><th>Ajuste</th><th>Paq./Bolsas</th><th>Cajas/Paq.</th></>}{selectedOrderForDetail.supplierKey === SupplierKey.Axion && <th>Pido</th>}</tr></thead><tbody className="bg-white dark:bg-slate-700 divide-y divide-slate-200 dark:divide-slate-600 text-slate-800 dark:text-slate-200">{selectedOrderForDetail.items.map(item => (<tr key={item.productId}><td>{item.productName}</td><td className="text-center">{item.stockActual}</td><td className="text-center">{item.usoProyectado}</td>{selectedOrderForDetail.supplierKey !== SupplierKey.Axion && <><td className="text-center">{item.ajuste}%</td><td className="text-center font-bold">{item.bolsasAPedir}</td><td className="text-center">{item.cajonesAPedir}</td></>}{selectedOrderForDetail.supplierKey === SupplierKey.Axion && <td className="text-center font-bold">{item.bolsasAPedir}</td>}</tr>))}</tbody></table></div>)}
            </Modal>
        </div>
    );
};

export default AllOrdersView;
