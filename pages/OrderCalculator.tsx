
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product, SupplierKey, Order, OrderItem, OrderTotals, CalculatorRowData } from '../types';
import { SUPPLIER_CONFIG, DEFAULT_AXION_ITEMS } from '../constants';
import { useAppState } from '../contexts/AppStateContext';
import Modal from '../components/ui/Modal';
import { UploadIcon } from '../components/ui/Icons';
import { formatDate, getTodayDateString, createMatchKey } from '../utils';

interface PdfPreviewItem {
  pdfName: string;
  pdfQuantity: number;
  matchKey: string;
  matchedProduct?: Product;
  matchedProductName?: string;
  status: 'Se actualizará' | 'Se ignorará (No encontrado)' | 'Se ignorará (Cantidad cero)';
}

const OrderCalculator: React.FC = () => {
  const { supplierKey } = useParams<{ supplierKey: SupplierKey }>();
  const navigate = useNavigate();
  const { axionItems, setAxionItems: globalSetAxionItems, getOrderHistory, saveOrderHistory: globalSaveOrderHistory } = useAppState();

  const [currentProducts, setCurrentProducts] = useState<Product[]>([]);
  const [calculatorData, setCalculatorData] = useState<CalculatorRowData[]>([]);
  const [specificDeliveryDate, setSpecificDeliveryDate] = useState<string>(getTodayDateString());
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAxionItemsModalOpen, setIsAxionItemsModalOpen] = useState(false);
  const [saveButtonText, setSaveButtonText] = useState('Guardar Pedido Actual');
  const [saveButtonClass, setSaveButtonClass] = useState(`bg-[#D92200] hover:bg-[#B91C00] dark:bg-[#FF4136] dark:hover:bg-[#FF6259] text-white font-bold py-2 px-4 rounded-lg shadow focus:outline-none focus:shadow-outline w-full sm:w-auto transition-colors duration-150`);

  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfImportStatus, setPdfImportStatus] = useState<string>('');
  const [isPdfPreviewModalOpen, setIsPdfPreviewModalOpen] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState<PdfPreviewItem[]>([]);

  const supplierConfig = useMemo(() => supplierKey ? SUPPLIER_CONFIG[supplierKey] : null, [supplierKey]);
  const isAxion = supplierKey === SupplierKey.Axion;
  const isReginaldLee = supplierKey === SupplierKey.ReginaldLee;

  useEffect(() => {
    if (supplierConfig) {
      const productsToUse = isAxion ? axionItems : supplierConfig.products;
      setCurrentProducts(productsToUse.sort((a,b) => a.name.localeCompare(b.name)));
    }
  }, [supplierConfig, axionItems, isAxion]);

  useEffect(() => {
    setCalculatorData(currentProducts.map(p => ({
      productId: p.id, productName: p.name, stockActual: 0, usoProyectado: 0, ajuste: 0,
      usoTotalAjustado: 0, unidadesNecesarias: 0, bolsasNecesariasIdeal: 0,
      bolsasAPedir: 0, diffBags: 0, cajonesAPedir: 0,
    })));
    if (editingOrderId) {
        const history = supplierKey ? getOrderHistory(supplierKey) : [];
        const orderToEdit = history.find(o => o.id === editingOrderId);
        if(orderToEdit) loadOrderForEditing(orderToEdit);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProducts]);

  const calculateRowInternal = (product: Product, data: CalculatorRowData, isAxionSupplier: boolean) : CalculatorRowData => {
    let { stockActual, usoProyectado, ajuste } = data;
    if (isAxionSupplier) {
        return { ...data, cajonesAPedir: data.bolsasAPedir };
    }
    const usoTotalAjustado = usoProyectado * (1 + ajuste / 100);
    const unidadesNecesarias = Math.max(0, usoTotalAjustado - stockActual);
    const bolsasNecesariasIdeal = product.unitsPerBag > 0 ? unidadesNecesarias / product.unitsPerBag : 0;
    let bolsasAPedir = data.bolsasAPedir; 
     if (bolsasAPedir === 0 && unidadesNecesarias > 0) { 
        if (product.bagsPerCase === 1) { 
            bolsasAPedir = Math.ceil(bolsasNecesariasIdeal); 
        } else { 
            if (bolsasNecesariasIdeal > 0 && product.bagsPerCase > 0) {
                bolsasAPedir = Math.ceil(bolsasNecesariasIdeal / product.bagsPerCase) * product.bagsPerCase;
            }
        }
        if (bolsasNecesariasIdeal <= 0) { bolsasAPedir = 0; }
     }
    const diffBags = bolsasAPedir - bolsasNecesariasIdeal;
    const cajonesAPedir = product.bagsPerCase > 0 ? bolsasAPedir / product.bagsPerCase : 0;
    return {
      ...data, bolsasAPedir,
      usoTotalAjustado: Math.round(usoTotalAjustado),
      unidadesNecesarias: Math.round(unidadesNecesarias),
      bolsasNecesariasIdeal: parseFloat(bolsasNecesariasIdeal.toFixed(2)),
      diffBags: parseFloat(diffBags.toFixed(2)),
      cajonesAPedir: Math.round(cajonesAPedir),
    };
  };

  const calculateRow = useCallback((productId: string, updatedData: Partial<CalculatorRowData>): CalculatorRowData | undefined => {
    const product = currentProducts.find(p => p.id === productId);
    const currentItemData = calculatorData.find(item => item.productId === productId);
    
    if (!product && !currentItemData && !updatedData.productName) { 
      const tempProduct = currentProducts.find(p => p.name === updatedData.productName);
      if (!tempProduct) return undefined;
      const baseData = {
        productId: tempProduct.id, productName: tempProduct.name, stockActual: 0, usoProyectado: 0, ajuste: 0,
        usoTotalAjustado: 0, unidadesNecesarias: 0, bolsasNecesariasIdeal: 0,
        bolsasAPedir: 0, diffBags: 0, cajonesAPedir: 0,
      };
      const dataForCalc = { ...baseData, ...updatedData, productId: tempProduct.id };
      return calculateRowInternal(tempProduct, dataForCalc, isAxion);
    } else if (!product || !currentItemData) {
        if (product && !currentItemData) {
            const baseData = {
                productId: product.id, productName: product.name, stockActual: 0, usoProyectado: 0, ajuste: 0,
                usoTotalAjustado: 0, unidadesNecesarias: 0, bolsasNecesariasIdeal: 0,
                bolsasAPedir: 0, diffBags: 0, cajonesAPedir: 0,
            };
            const dataForCalc = { ...baseData, ...updatedData};
            return calculateRowInternal(product, dataForCalc, isAxion);
        }
        return undefined;
    }
    const data = { ...currentItemData, ...updatedData };
    return calculateRowInternal(product, data, isAxion);
  }, [currentProducts, calculatorData, isAxion]);

  const handleInputChange = <K extends keyof CalculatorRowData,>(productId: string, field: K, value: CalculatorRowData[K]) => {
    setCalculatorData(prevData =>
      prevData.map(item => {
        if (item.productId === productId) {
          const updatedItemPartial = { ...item, [field]: value };
          const fullyCalculatedItem = calculateRow(productId, updatedItemPartial);
          return fullyCalculatedItem || updatedItemPartial; 
        }
        return item;
      })
    );
  };

  const totals = useMemo(() => {
    let totalPrimaryPackages = 0; let totalSecondaryPackages = 0;
    calculatorData.forEach(item => {
      if (isAxion) { totalSecondaryPackages += item.bolsasAPedir; } 
      else { totalPrimaryPackages += item.bolsasAPedir; totalSecondaryPackages += item.cajonesAPedir; }
    });
    return { totalBagsToOrder: totalPrimaryPackages, totalCasesToOrder: totalSecondaryPackages };
  }, [calculatorData, isAxion]);

  const saveOrder = () => {
    if (!supplierKey || !supplierConfig) return;
    if (!specificDeliveryDate) { alert("Por favor, selecciona una fecha de entrega para el pedido."); return; }
    const orderItems: OrderItem[] = calculatorData.map(item => ({ ...item }));
    const currentOrderTotals: OrderTotals = { ...totals };
    let history = getOrderHistory(supplierKey);
    const nowTimestamp = new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (editingOrderId) {
        const orderIndex = history.findIndex(o => o.id === editingOrderId);
        if (orderIndex > -1) {
            history[orderIndex] = { ...history[orderIndex], items: orderItems, totals: currentOrderTotals, specificDeliveryDate, lastEditedTimestamp: nowTimestamp, };
        }
    } else {
        const newOrder: Order = {
            id: new Date().toISOString(), timestamp: nowTimestamp, specificDeliveryDate, items: orderItems, totals: currentOrderTotals, lastEditedTimestamp: null, supplierKey: supplierKey, supplierName: supplierConfig.name,
        };
        history.unshift(newOrder);
    }
    globalSaveOrderHistory(supplierKey, history);
    const originalText = editingOrderId ? "Actualizar Pedido" : "Guardar Pedido Actual";
    const originalClasses = `bg-[#D92200] hover:bg-[#B91C00] dark:bg-[#FF4136] dark:hover:bg-[#FF6259] text-white font-bold py-2 px-4 rounded-lg shadow focus:outline-none focus:shadow-outline w-full sm:w-auto transition-colors duration-150`;
    setSaveButtonText(editingOrderId ? '¡Pedido Actualizado!' : '¡Pedido Guardado!');
    setSaveButtonClass('bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow focus:outline-none focus:shadow-outline w-full sm:w-auto transition-colors duration-150');
    setTimeout(() => {
        setSaveButtonText(originalText); setSaveButtonClass(originalClasses);
        if (editingOrderId) cancelEdit();
    }, 2500);
  };
  
  const loadOrderForEditing = (order: Order) => {
    setEditingOrderId(order.id); setSpecificDeliveryDate(order.specificDeliveryDate);
    const newCalcData = currentProducts.map(p => {
        const itemFromOrder = order.items.find(oi => oi.productId === p.id);
        if (itemFromOrder) {
            const baseItem = {
                productId: p.id, productName: p.name, stockActual: itemFromOrder.stockActual || 0,
                usoProyectado: itemFromOrder.usoProyectado || 0, ajuste: itemFromOrder.ajuste || 0,
                bolsasAPedir: itemFromOrder.bolsasAPedir || 0, usoTotalAjustado: 0, unidadesNecesarias: 0,
                bolsasNecesariasIdeal: 0, diffBags: 0, cajonesAPedir: 0,
            };
            return calculateRow(p.id, baseItem) || baseItem;
        }
        return calculateRow(p.id, { 
            productId: p.id, productName: p.name, stockActual: 0, usoProyectado: 0, ajuste: 0,
            usoTotalAjustado: 0, unidadesNecesarias: 0, bolsasNecesariasIdeal: 0,
            bolsasAPedir: 0, diffBags: 0, cajonesAPedir: 0,
        })!;
    });
    setCalculatorData(newCalcData); setSaveButtonText('Actualizar Pedido'); setIsHistoryModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingOrderId(null); setSpecificDeliveryDate(getTodayDateString());
    setCalculatorData(currentProducts.map(p => ({
        productId: p.id, productName: p.name, stockActual: 0, usoProyectado: 0, ajuste: 0,
        usoTotalAjustado: 0, unidadesNecesarias: 0, bolsasNecesariasIdeal: 0,
        bolsasAPedir: 0, diffBags: 0, cajonesAPedir: 0,
    })));
    setSaveButtonText('Guardar Pedido Actual');
    setSaveButtonClass(`bg-[#D92200] hover:bg-[#B91C00] dark:bg-[#FF4136] dark:hover:bg-[#FF6259] text-white font-bold py-2 px-4 rounded-lg shadow focus:outline-none focus:shadow-outline w-full sm:w-auto transition-colors duration-150`);
  };

  const deleteOrder = (orderId: string) => {
    if (!supplierKey) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar este pedido del historial?')) {
        const updatedHistory = getOrderHistory(supplierKey).filter(o => o.id !== orderId);
        globalSaveOrderHistory(supplierKey, updatedHistory);
    }
  };

  const [axionItemName, setAxionItemName] = useState('');
  const [editingAxionItemId, setEditingAxionItemId] = useState<string | null>(null);

  const handleAddOrUpdateAxionItem = () => {
    const name = axionItemName.trim().toUpperCase(); if (!name) { alert("El nombre del item no puede estar vacío."); return; }
    let updatedAxionItems;
    if (editingAxionItemId) { 
        if (axionItems.some(i => i.name === name && i.id !== editingAxionItemId)) { alert("Ya existe un item con ese nombre."); return; }
        updatedAxionItems = axionItems.map(item => item.id === editingAxionItemId ? { ...item, name } : item);
    } else { 
        if (axionItems.some(i => i.name === name)) { alert("Ya existe un item con ese nombre."); return; }
        const newItemId = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '') + '_' + Date.now();
        const newItem: Product = { id: newItemId, name, unitsPerBag: 1, bagsPerCase: 1, unitName: 'Uds', packageOrderUnit: 'Paq.', caseOrderUnit: 'Paq.' };
        updatedAxionItems = [...axionItems, newItem];
    }
    globalSetAxionItems(updatedAxionItems.sort((a,b) => a.name.localeCompare(b.name)));
    setAxionItemName(''); setEditingAxionItemId(null);
  };

  const handleEditAxionItem = (item: Product) => { setAxionItemName(item.name); setEditingAxionItemId(item.id); };
  const handleDeleteAxionItem = (itemId: string) => {
    if (window.confirm("¿Seguro que quieres eliminar este item?")) { globalSetAxionItems(axionItems.filter(item => item.id !== itemId)); }
  };
  
  const confirmPdfImport = () => {
    let updatedCalculatorData = JSON.parse(JSON.stringify(calculatorData)); let foundItemsCount = 0;
    pdfPreviewData.forEach(previewItem => {
        if (previewItem.matchedProduct && previewItem.status === 'Se actualizará') {
            const productIndex = updatedCalculatorData.findIndex((p: CalculatorRowData) => p.productId === previewItem.matchedProduct!.id);
            if (productIndex !== -1) {
                const itemToUpdate = { ...updatedCalculatorData[productIndex] }; itemToUpdate.bolsasAPedir = previewItem.pdfQuantity;
                const fullyCalculatedItem = calculateRow(itemToUpdate.productId, itemToUpdate);
                updatedCalculatorData[productIndex] = fullyCalculatedItem || itemToUpdate;
                foundItemsCount++;
            }
        }
    });
    setCalculatorData(updatedCalculatorData);
    setPdfImportStatus(`Importación confirmada. ${foundItemsCount} ítems actualizados desde el PDF.`);
    setIsPdfPreviewModalOpen(false); setPdfPreviewData([]);
  };

  const handlePdfFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file || !isReginaldLee) return;
    setIsProcessingPdf(true); setPdfImportStatus('Procesando PDF...'); setPdfPreviewData([]);
    console.log("DEBUG: PDF processing started.");
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        // @ts-ignore pdfjsLib is loaded from CDN
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        
        console.log("DEBUG: fullText length:", fullText.length);
        if (fullText.length < 50) { // Arbitrary small number to check if text extraction was minimal
            console.warn("DEBUG: Extracted PDF text is very short. Potential issue with PDF content or extraction.");
        }
        console.log("DEBUG: Full PDF Text (first 1000 chars):", fullText.substring(0, 1000));
        
        const lines = fullText.split('\n'); let tableStarted = false; const extractedItemsForPreview: PdfPreviewItem[] = [];
        
        console.log("DEBUG: Configured Reginald Lee products and their match keys:");
        currentProducts.forEach(p => console.log(`  - Config: "${p.name}" -> Key: "${createMatchKey(p.name)}"`));

        for (const line of lines) {
          const trimmedLine = line.trim();
          // console.log(`DEBUG: [PROCESS_LINE] Raw line: "${line}" -> Trimmed: "${trimmedLine}"`); // Can be very verbose

          if (!tableStarted && trimmedLine.match(/art(i|í)culo/i) && trimmedLine.match(/cantidad/i) && trimmedLine.match(/c(o|ó)digo/i) && trimmedLine.match(/unidad/i)) {
            tableStarted = true; 
            console.log("DEBUG: [TABLE_STATE] Table started based on header line:", `"${trimmedLine}"`); 
            continue;
          }
          if (tableStarted && (trimmedLine.toLowerCase().startsWith('total:') || trimmedLine.toLowerCase().startsWith('pg.'))) { // Added "pg." for page footers
            tableStarted = false; 
            console.log("DEBUG: [TABLE_STATE] Table ended based on footer line:", `"${trimmedLine}"`); 
            break; 
          }

          if (tableStarted) {
            // Try to match lines starting with a number (item number), then spaces, then a non-space char (item code)
            if (/^\d+\s+\S+/.test(trimmedLine)) { 
              const parts = trimmedLine.split(/\s+/); 
              console.log(`DEBUG: [ITEM_LINE_SPLIT] Original Line: "${trimmedLine}" -> Parts (${parts.length}): ${JSON.stringify(parts)}`);

              if (parts.length < 7) { // #, Code, Article(min 1), Unit, Qty, Cost, Total
                console.warn(`DEBUG: [SKIP_ITEM] Reason: Insufficient parts (${parts.length}). Expected >= 7. Line: "${trimmedLine}"`); 
                continue; 
              }
              
              // Quantity is expected to be 3rd from end, Cost 2nd from end, Total last.
              const potentialQtyStr = parts[parts.length - 3]; 
              const qty = parseFloat(potentialQtyStr?.replace(/\./g, '').replace(',', '.'));

              if (isNaN(qty)) { 
                console.warn(`DEBUG: [SKIP_ITEM] Reason: NaN quantity. QtyStr: "${potentialQtyStr}". Line: "${trimmedLine}"`); 
                continue; 
              }
              
              // Article name is between Code (parts[1]) and Unit (parts[parts.length - 4])
              // Index for article start: 2. Index for article end (exclusive): parts.length - 4
              const articleName = parts.slice(2, parts.length - 4).join(' ').trim();
              if (!articleName) { 
                console.warn(`DEBUG: [SKIP_ITEM] Reason: Empty article name. Line: "${trimmedLine}"`); 
                continue; 
              }
              
              console.log(`DEBUG: [EXTRACT_SUCCESS] Name: "${articleName}", QtyStr: "${potentialQtyStr}", ParsedQty: ${qty}`);
              const pdfItemKey = createMatchKey(articleName);
              console.log(`DEBUG: [MATCH_ATTEMPT] PDF Item: Name="${articleName}", GeneratedKey="${pdfItemKey}"`);
              
              const matchedConfigProduct = currentProducts.find(p => createMatchKey(p.name) === pdfItemKey && pdfItemKey !== '');
              let status: PdfPreviewItem['status'] = 'Se ignorará (No encontrado)';
              if (matchedConfigProduct) {
                  status = qty > 0 ? 'Se actualizará' : 'Se ignorará (Cantidad cero)';
                  console.log(`DEBUG: [MATCH_RESULT] Matched! PDF Key "${pdfItemKey}" to Config Product "${matchedConfigProduct.name}" (Key: "${createMatchKey(matchedConfigProduct.name)}")`);
              } else { 
                  console.warn(`DEBUG: [MATCH_RESULT] No match for PDF Key "${pdfItemKey}" (Original PDF Name: "${articleName}")`); 
              }
              extractedItemsForPreview.push({ pdfName: articleName, pdfQuantity: qty, matchKey: pdfItemKey, matchedProduct: matchedConfigProduct, matchedProductName: matchedConfigProduct?.name, status: status });
            } else if (trimmedLine.length > 0) { // Log non-empty lines within table that didn't match item pattern
              console.log(`DEBUG: [TABLE_CONTENT_SKIP] Line in table, but not an item (no /^\\d+\\s+\\S+/ match): "${trimmedLine}"`);
            }
          }
        }
        
        console.log("DEBUG: Final extracted items for preview:", JSON.stringify(extractedItemsForPreview, null, 2));
        setPdfPreviewData(extractedItemsForPreview);

        if (extractedItemsForPreview.length > 0) {
            setIsPdfPreviewModalOpen(true); 
            const updateCount = extractedItemsForPreview.filter(i => i.status === 'Se actualizará').length;
            setPdfImportStatus(`Vista previa de importación lista. ${updateCount} artículos para actualizar de ${extractedItemsForPreview.length} extraídos.`);
        } else { 
            setPdfImportStatus('No se encontraron artículos válidos en la tabla del PDF.'); 
            console.warn("DEBUG: extractedItemsForPreview is empty. Check previous DEBUG logs for parsing issues."); 
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) { 
        console.error("DEBUG: Error processing PDF:", error); 
        setPdfImportStatus(`Error al procesar PDF: ${error.message || 'Desconocido'}`); 
    } 
    finally { 
        setIsProcessingPdf(false); 
        if (pdfFileInputRef.current) pdfFileInputRef.current.value = ''; 
        console.log("DEBUG: PDF processing finished.");
    }
  };

  if (!supplierKey || !supplierConfig) return <p>Proveedor no válido.</p>;
  const inputClasses = "w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:placeholder-slate-400";
  const productForHeaders = currentProducts[0] || DEFAULT_AXION_ITEMS[0]; 
  const stockUnitName = productForHeaders.unitName || 'Uds';
  const idealPackageUnitName = productForHeaders.packageOrderUnit || 'Bolsas';
  const casePackageUnitName = productForHeaders.caseOrderUnit || 'Cajones/Paq.';

  const printOrder = (orderToPrint: Order) => {
    if (!supplierConfig) return;
    const isOrderAxion = orderToPrint.supplierKey === SupplierKey.Axion;
    const productsForOrder = isOrderAxion ? axionItems : SUPPLIER_CONFIG[orderToPrint.supplierKey]?.products || [];
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
    if (printWindow) { printWindow.document.write('<html><head><title>Imprimir Pedido KFC</title></head><body>' + printHTML + '</body></html>'); printWindow.document.close(); printWindow.focus(); setTimeout(() => { printWindow.print(); }, 250); } 
    else { alert("No se pudo abrir la ventana de impresión. Por favor, deshabilita el bloqueador de ventanas emergentes."); }
  };

  return (
    <div>
      <button onClick={() => navigate('/')} className="mb-6 bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg shadow focus:outline-none focus:shadow-outline">&larr; Volver al Menú Principal</button>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h1 className={`text-xl sm:text-2xl font-bold text-center text-[#D92200] dark:text-[#FF4136] flex-grow`}>🍗 Calculadora Pedidos {supplierConfig.name.toUpperCase()}</h1>
        <div className="flex gap-2">
            {isReginaldLee && (<><input type="file" ref={pdfFileInputRef} onChange={handlePdfFileChange} style={{ display: 'none' }} accept=".pdf" /><button onClick={() => pdfFileInputRef.current?.click()} className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow flex items-center justify-center" disabled={isProcessingPdf} aria-label="Importar pedido desde PDF"><UploadIcon /> {isProcessingPdf ? 'Leyendo PDF...' : 'Importar PDF'}</button></>)}
            {isAxion && (<button onClick={() => setIsAxionItemsModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg shadow">Gestionar Items AXION</button>)}
        </div>
      </div>
      {editingOrderId && <p className="text-center text-amber-600 dark:text-amber-400 font-semibold mb-2">Modo Edición Activo</p>}
      {pdfImportStatus && <p className={`text-center text-sm mb-2 ${pdfImportStatus.includes('Error') || pdfImportStatus.includes('No se encontraron') ? 'text-red-600 dark:text-red-400' : pdfImportStatus.includes('Vista previa') ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-500'}`}>{pdfImportStatus}</p>}
      <div className="mb-6 p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200">Información del Pedido</h2>
        <div className="flex flex-col sm:flex-row justify-center items-end gap-4">
          <div><label htmlFor="specificDeliveryDateInput" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fecha de Entrega del Pedido:</label><input type="date" id="specificDeliveryDateInput" value={specificDeliveryDate} onChange={(e) => setSpecificDeliveryDate(e.target.value)} className={`mt-1 block w-full ${inputClasses}`} /></div>
        </div>
      </div>
      <div className={`overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow-md ${editingOrderId ? 'outline-2 outline-amber-500 ring-2 ring-amber-500' : ''}`}>
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border border-slate-300 dark:border-slate-700">
          <thead className="bg-slate-200 dark:bg-slate-700">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Producto</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Stock Actual ({stockUnitName})</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Uso Proyectado ({stockUnitName})</th>
              {!isAxion && (<><th className="px-2 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Ajuste (%)</th><th className="px-2 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Uso Total Ajust.</th><th className="px-2 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">{stockUnitName} Necesarias (Pedido)</th><th className="px-2 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">{idealPackageUnitName} Nec. (Ideal)</th><th className="px-2 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">{idealPackageUnitName} a Pedir</th><th className="px-2 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Dif. {idealPackageUnitName} (+/-)</th></>)}
              {isAxion && <th className="px-2 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Pido ({stockUnitName})</th>}
              <th className="px-2 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">{casePackageUnitName} a Pedir</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 text-slate-900 dark:text-slate-100">
            {calculatorData.map((item) => (
              <tr key={item.productId}>
                <td className="px-2 py-2 font-medium">{item.productName}</td>
                <td><input type="number" value={item.stockActual} onChange={(e) => handleInputChange(item.productId, 'stockActual', parseFloat(e.target.value) || 0)} className={inputClasses} min="0" /></td>
                <td><input type="number" value={item.usoProyectado} onChange={(e) => handleInputChange(item.productId, 'usoProyectado', parseFloat(e.target.value) || 0)} className={inputClasses} min="0" /></td>
                {!isAxion && (<><td className="w-20"><input type="number" value={item.ajuste} onChange={(e) => handleInputChange(item.productId, 'ajuste', parseFloat(e.target.value) || 0)} className={inputClasses} /></td><td className="text-center">{item.usoTotalAjustado}</td><td className="text-center">{item.unidadesNecesarias}</td><td className="text-center">{item.bolsasNecesariasIdeal}</td><td><input type="number" value={item.bolsasAPedir} onChange={(e) => handleInputChange(item.productId, 'bolsasAPedir', parseFloat(e.target.value) || 0)} className={inputClasses} min="0" /></td><td className={`text-center ${item.diffBags >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>{item.diffBags}</td></>)}
                {isAxion && <td><input type="number" value={item.bolsasAPedir} onChange={(e) => handleInputChange(item.productId, 'bolsasAPedir', parseFloat(e.target.value) || 0)} className={inputClasses} min="0" /></td>}
                 <td className="text-center">{item.cajonesAPedir}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-200 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200">
            <tr><td colSpan={isAxion ? 2 : 7} className="px-2 py-2 text-right text-sm sm:text-base">Totales:</td>{!isAxion && <td className="px-2 py-2 text-sm sm:text-base text-center">{totals.totalBagsToOrder}</td>}{!isAxion && <td className="px-2 py-2"></td>} {isAxion && <td className="px-2 py-2"></td>}<td className="px-2 py-2 text-sm sm:text-base text-center">{totals.totalCasesToOrder}</td></tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-6 mb-6 p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={saveOrder} className={saveButtonClass}>{saveButtonText}</button>
          {editingOrderId && (<button onClick={cancelEdit} className="bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg shadow w-full sm:w-auto">Cancelar Edición</button>)}
          {!editingOrderId && (<button onClick={() => setIsHistoryModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow w-full sm:w-auto">Ver Historial de Pedidos</button>)}
      </div>
        <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Historial de Pedidos - ${supplierConfig.name}`} size="max-w-4xl">
            {(getOrderHistory(supplierKey!) || []).length === 0 ? (<p className="text-slate-500 dark:text-slate-400 text-center py-4">No hay pedidos guardados para este proveedor.</p>) : (
                <ul className="space-y-4">{(getOrderHistory(supplierKey!) || []).map(order => (
                        <li key={order.id} className="p-4 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2"><h4 className={`text-base font-semibold text-[#D92200] dark:text-[#FF4136]`}>Pedido Creado: {order.timestamp}</h4><div className="flex gap-2 flex-shrink-0"><button onClick={() => printOrder(order)} className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md shadow-sm">Imprimir</button><button onClick={() => loadOrderForEditing(order)} className="text-xs bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white py-1 px-3 rounded-md shadow-sm">Editar</button><button onClick={() => deleteOrder(order.id)} className="text-xs bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white py-1 px-3 rounded-md shadow-sm">Eliminar</button></div></div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">ID: {order.id}</p>{order.lastEditedTimestamp && <p className="text-xs text-sky-600 dark:text-sky-400 mt-1">Última edición: {order.lastEditedTimestamp}</p>}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2 text-slate-700 dark:text-slate-300"><p><strong className="font-medium">Fecha Entrega:</strong> {formatDate(order.specificDeliveryDate)}</p><p><strong className="font-medium">{isAxion ? "Total Unidades Pedidas:" : "Total Paq./Bolsas:"}</strong> {isAxion ? order.totals.totalCasesToOrder : order.totals.totalBagsToOrder}</p>{!isAxion && <p><strong className="font-medium">Total Cajas/Paq.:</strong> {Math.round(order.totals.totalCasesToOrder)}</p>}</div>
                            <details className="mt-2 text-sm"><summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium py-1">Ver Detalles</summary><div className="mt-2 p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-700 overflow-x-auto"><table className="min-w-full text-xs divide-y divide-slate-200 dark:divide-slate-600"><thead className="bg-slate-100 dark:bg-slate-600"><tr><th>Producto</th><th>Stock</th><th>Uso Proy.</th>{!isAxion && <><th>Ajuste</th><th>Paq./Bolsas Pedidas</th><th>Cajas/Paq. Pedidos</th></>}{isAxion && <th>Pido</th>}</tr></thead><tbody className="bg-white dark:bg-slate-700 divide-y divide-slate-200 dark:divide-slate-600 text-slate-800 dark:text-slate-200">{order.items.map(item => (<tr key={item.productId}><td>{item.productName}</td><td className="text-center">{item.stockActual}</td><td className="text-center">{item.usoProyectado}</td>{!isAxion && <><td className="text-center">{item.ajuste}%</td><td className="text-center font-bold">{item.bolsasAPedir}</td><td className="text-center">{item.cajonesAPedir}</td></>}{isAxion && <td className="text-center font-bold">{item.bolsasAPedir}</td>}</tr>))}</tbody></table></div></details>
                        </li>))}</ul>)}</Modal>
        <Modal isOpen={isAxionItemsModalOpen} onClose={() => { setIsAxionItemsModalOpen(false); setAxionItemName(''); setEditingAxionItemId(null); }} title="Gestionar Items de AXION" size="max-w-lg">
            <div className="mb-4"><label htmlFor="axionItemNameInput" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Item:</label><input type="text" id="axionItemNameInput" value={axionItemName} onChange={(e) => setAxionItemName(e.target.value)} className={`mt-1 block w-full ${inputClasses}`} /><button onClick={handleAddOrUpdateAxionItem} className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow">{editingAxionItemId ? 'Actualizar Item' : 'Añadir Item'}</button>{editingAxionItemId && <button onClick={() => {setAxionItemName(''); setEditingAxionItemId(null);}} className="mt-2 w-full bg-slate-400 hover:bg-slate-500 text-white font-bold py-1 px-3 rounded-lg shadow text-sm">Cancelar Edición</button>}</div>
            <h4 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">Items Actuales:</h4><ul className="max-h-60 overflow-y-auto space-y-2 p-2 border dark:border-slate-700 rounded-md">{axionItems.length === 0 && <li className="text-slate-500 dark:text-slate-400 text-center">No hay items de Axion.</li>}{axionItems.map(item => (<li key={item.id} className="flex justify-between items-center p-2 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><span className="flex-grow cursor-pointer" title={`Editar ${item.name}`} onClick={() => handleEditAxionItem(item)}>{item.name}</span><div><button onClick={() => handleEditAxionItem(item)} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded-md shadow-sm">Editar</button><button onClick={() => handleDeleteAxionItem(item.id)} className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded-md shadow-sm ml-1">Borrar</button></div></li>))}</ul></Modal>
        <Modal isOpen={isPdfPreviewModalOpen} onClose={() => { setIsPdfPreviewModalOpen(false); setPdfImportStatus('Importación cancelada por el usuario.'); }} title="Confirmar Importación de Pedido PDF" size="max-w-4xl"
            footerContent={<><button onClick={confirmPdfImport} className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400">Importar y Actualizar Calculadora</button><button onClick={() => { setIsPdfPreviewModalOpen(false); setPdfImportStatus('Importación cancelada por el usuario.');}} className="px-4 py-2 bg-slate-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancelar</button></>}>
            {pdfPreviewData.length === 0 ? (<p className="text-slate-500 dark:text-slate-400">No se extrajeron artículos del PDF o no hay coincidencias.</p>) : (
                <div className="text-sm"><p className="mb-3 text-slate-700 dark:text-slate-300">Se encontraron {pdfPreviewData.length} artículos en el PDF. Revisa los detalles a continuación y confirma para actualizar la calculadora. Los artículos marcados como "Se ignorará" no afectarán la calculadora.</p><div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-md"><table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700"><thead className="bg-slate-100 dark:bg-slate-700"><tr><th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Artículo en PDF</th><th className="px-3 py-2 text-center text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Cant. PDF</th><th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Producto Coincidente (Config.)</th><th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Estado</th></tr></thead><tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">{pdfPreviewData.map((item, index) => (<tr key={index} className={`${item.status === 'Se actualizará' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/20'}`}><td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-200">{item.pdfName}</td><td className="px-3 py-2 text-center text-slate-700 dark:text-slate-200">{item.pdfQuantity}</td><td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-200">{item.matchedProductName || <span className="italic text-slate-500 dark:text-slate-400">N/A</span>}</td><td className={`px-3 py-2 whitespace-nowrap font-medium ${item.status === 'Se actualizará' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{item.status}</td></tr>))}</tbody></table></div><p className="mt-3 text-slate-700 dark:text-slate-300">Total a actualizar: {pdfPreviewData.filter(item => item.status === 'Se actualizará').length} artículo(s).</p></div>)}</Modal>
    </div>
  );
};

export default OrderCalculator;
