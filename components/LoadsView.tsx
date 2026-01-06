
import React, { useMemo, useState } from 'react';
import { Order, OrderStatus, Truck } from '../types';

interface LoadsViewProps {
  orders: Order[];
  trucks: Truck[];
  onSelectOrder: (order: Order) => void;
  selectedTruckId: string;
  selectedDate: string;
  onFilterChange: (truckId: string, date: string) => void;
  onTransferLoads: (sourceTruckId: string, destTruckId: string, sourceDate: string, targetDate: string) => void;
}

const LoadsView: React.FC<LoadsViewProps> = ({ 
  orders, 
  trucks, 
  onSelectOrder, 
  selectedTruckId, 
  selectedDate, 
  onFilterChange,
  onTransferLoads
}) => {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDestTruckId, setTransferDestTruckId] = useState('');
  const [transferTargetDate, setTransferTargetDate] = useState(selectedDate);

  const sortedTrucks = useMemo(() => {
    return [...trucks].sort((a, b) => 
      a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [trucks]);

  const truckLoads = useMemo(() => {
    const map: Record<string, Order[]> = {};
    const scheduledOrders = orders.filter(o => o.status === OrderStatus.SCHEDULED && o.serviceDate === selectedDate);
    
    scheduledOrders.forEach(o => {
      if (o.truckId) {
        if (!map[o.truckId]) map[o.truckId] = [];
        map[o.truckId].push(o);
      }
    });
    return map;
  }, [orders, selectedDate]);

  const selectedTruck = useMemo(() => trucks.find(t => t.id === selectedTruckId), [trucks, selectedTruckId]);
  const currentLoad = truckLoads[selectedTruckId] || [];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "---";
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleConfirmTransfer = () => {
    if (!transferDestTruckId || !transferTargetDate) return;
    onTransferLoads(selectedTruckId, transferDestTruckId, selectedDate, transferTargetDate);
    setIsTransferModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Selector de Fecha */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-[#5851FF]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">Hoja de Cargas Diaria</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Planificación para el {formatDate(selectedDate)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase text-slate-400">Cambiar Fecha:</span>
          <input 
            type="date"
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#5851FF] transition-all cursor-pointer"
            value={selectedDate}
            onChange={e => onFilterChange(selectedTruckId, e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Tarjetas de Camiones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedTrucks.map(truck => {
          const load = truckLoads[truck.id] || [];
          const totalLoadValue = load.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
          const totalPending = load.reduce((sum, o) => sum + (o.pendingPayment || 0), 0);
          const isSelected = selectedTruckId === truck.id;

          return (
            <div 
              key={truck.id}
              onClick={() => onFilterChange(truck.id, selectedDate)}
              className={`bg-white rounded-2xl border-2 transition-all cursor-pointer flex flex-col h-full group ${
                isSelected ? 'border-[#5851FF] shadow-xl shadow-indigo-100' : 'border-slate-100 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Cabecera Tarjeta */}
              <div className={`p-5 border-b flex justify-between items-start ${isSelected ? 'bg-indigo-50/30 border-indigo-100' : 'border-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm ${isSelected ? 'bg-[#5851FF] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {truck.number}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{truck.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">{truck.phone || 'Sin contacto'}</p>
                  </div>
                </div>
                {load.length > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {load.length}
                  </span>
                )}
              </div>

              {/* Lista de Pedidos en Tarjeta */}
              <div className="flex-1 p-4 space-y-2.5 overflow-hidden">
                {load.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 opacity-40">
                    <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    <p className="text-[10px] font-black uppercase text-slate-400">Sin Carga</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {load.slice(0, 8).map(order => (
                      <div 
                        key={order.id}
                        onClick={(e) => { e.stopPropagation(); onSelectOrder(order); }}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-[#5851FF]/30 transition-all group/item"
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[9px] font-black text-[#5851FF] leading-none uppercase tracking-tighter">{order.id}</span>
                          <span className="text-[10px] text-slate-700 font-black truncate uppercase mt-0.5">{order.city}</span>
                        </div>
                        <div className="flex flex-col items-end ml-3 shrink-0">
                          <span className="text-[10px] font-black text-slate-600 group-hover/item:text-[#5851FF] transition-colors leading-none">
                            {order.phone1 || '---'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {load.length > 8 && (
                      <p className="text-center text-[9px] font-black text-slate-300 uppercase py-1">+{load.length - 8} pedidos adicionales</p>
                    )}
                  </div>
                )}
              </div>

              {/* Pie Tarjeta */}
              <div className={`p-4 mt-auto border-t flex flex-col gap-1 ${isSelected ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50/50 border-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Carga:</span>
                  <span className={`text-sm font-black ${totalLoadValue > 0 ? 'text-[#5851FF]' : 'text-slate-400'}`}>
                    {totalLoadValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalle del Camión Seleccionado (Tabla) */}
      {selectedTruckId && currentLoad.length > 0 && (
        <div className="animate-slideIn mt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Detalle de Hoja de Ruta ({selectedTruck?.number})</h3>
              <div className="h-[1px] flex-1 bg-slate-200"></div>
            </div>
            
            <button 
              onClick={() => {
                setTransferDestTruckId('');
                setTransferTargetDate(selectedDate);
                setIsTransferModalOpen(true);
              }}
              className="ml-6 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              Traspasar Pedidos
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest">Pedido</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest">Destino</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest">Dirección</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest">Teléfonos</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest min-w-[300px]">Notas</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentLoad.map(order => (
                  <tr 
                    key={order.id} 
                    onClick={() => onSelectOrder(order)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-black text-[#5851FF] group-hover:underline uppercase">{order.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700 uppercase tracking-tight">{order.city}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] text-slate-500 line-clamp-2">{order.address}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-700">{order.phone1 || '---'}</span>
                        {order.phone2 && <span className="text-[10px] text-slate-400">{order.phone2}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="whitespace-normal break-words italic text-[11px] text-slate-600 leading-relaxed">
                        {order.notes || <span className="text-slate-300 italic">Sin notas</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <p className="text-sm font-bold text-slate-700">
                        {order.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Traspaso */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsTransferModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-scaleIn">
            <div className="p-8">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              </div>
              
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Traspasar Cargas Masivas</h3>
              <p className="text-sm text-slate-500 font-bold mb-8">Vas a mover {currentLoad.length} pedidos del camión <span className="text-indigo-600">[{selectedTruck?.number}]</span></p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Camión Destino</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all"
                    value={transferDestTruckId}
                    onChange={e => setTransferDestTruckId(e.target.value)}
                  >
                    <option value="">Seleccionar Camión...</option>
                    {sortedTrucks.filter(t => t.id !== selectedTruckId).map(t => (
                      <option key={t.id} value={t.id}>[{t.number}] {t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha de Destino</label>
                  <input 
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all cursor-pointer"
                    value={transferTargetDate}
                    onChange={e => setTransferTargetDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-8 py-6 flex gap-3">
              <button 
                onClick={() => setIsTransferModalOpen(false)}
                className="flex-1 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmTransfer}
                disabled={!transferDestTruckId || !transferTargetDate}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadsView;
