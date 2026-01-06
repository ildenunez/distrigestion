
import React, { useMemo, useState } from 'react';
import { Order, OrderStatus, Truck } from '../types';
import { getProvinceFromZip } from '../utils/provinceHelper';

interface LoadsViewProps {
  orders: Order[];
  trucks: Truck[];
  onSelectOrder: (order: Order) => void;
  selectedTruckId: string;
  selectedDate: string;
  onFilterChange: (truckId: string, date: string) => void;
  onTransferLoads: (sourceTruckId: string, destTruckId: string, sourceDate: string, targetDate: string) => void;
  onAddOrder?: (newOrder: Order) => void;
}

const LoadsView: React.FC<LoadsViewProps> = ({ 
  orders, 
  trucks, 
  onSelectOrder, 
  selectedTruckId, 
  selectedDate, 
  onFilterChange,
  onTransferLoads,
  onAddOrder
}) => {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDestTruckId, setTransferDestTruckId] = useState('');
  const [transferTargetDate, setTransferTargetDate] = useState(selectedDate);
  
  const [incidentModal, setIncidentModal] = useState<{ isOpen: boolean, truckId: string }>({ isOpen: false, truckId: '' });
  const [newIncidentData, setNewIncidentData] = useState({ number: '', zipCode: '', city: '', notes: '' });

  const sortedTrucks = useMemo(() => {
    return [...trucks].sort((a, b) => 
      a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [trucks]);

  // Mapa de pedidos asignados por ID de camión
  const truckLoadsMap = useMemo(() => {
    const map: Record<string, Order[]> = {};
    const scheduledOrders = orders.filter(o => 
      o.status === OrderStatus.SCHEDULED && 
      (o.serviceDate === selectedDate || o.serviceDate?.split('T')[0] === selectedDate)
    );
    
    scheduledOrders.forEach(o => {
      const tId = o.truckId || 'unassigned';
      if (!map[tId]) map[tId] = [];
      map[tId].push(o);
    });
    return map;
  }, [orders, selectedDate]);

  // Pedidos que están agendados para este día pero NO tienen camión
  const unassignedOrders = useMemo(() => truckLoadsMap['unassigned'] || [], [truckLoadsMap]);

  const stats = useMemo(() => {
    const allScheduled = orders.filter(o => 
      o.status === OrderStatus.SCHEDULED && 
      (o.serviceDate === selectedDate || o.serviceDate?.split('T')[0] === selectedDate)
    );
    const regularCount = allScheduled.filter(o => !o.notes.includes('[INCIDENCIA]')).length;
    const incidentCount = allScheduled.filter(o => o.notes.includes('[INCIDENCIA]')).length;
    const totalDeliveries = allScheduled.length;
    const totalAmount = allScheduled.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const trucksWithLoad = trucks.filter(t => (truckLoadsMap[t.id]?.length || 0) > 0).length;
    const freeTrucks = trucks.length - trucksWithLoad;

    return {
      used: trucksWithLoad,
      free: freeTrucks,
      regular: regularCount,
      incidents: incidentCount,
      total: totalDeliveries,
      amount: totalAmount
    };
  }, [orders, trucks, truckLoadsMap, selectedDate]);

  const selectedTruck = useMemo(() => {
    if (selectedTruckId === 'unassigned') return { id: 'unassigned', number: 'SIN CAMIÓN', name: 'Pendientes de Asignar' } as Truck;
    return trucks.find(t => t.id === selectedTruckId);
  }, [trucks, selectedTruckId]);

  const currentLoad = useMemo(() => {
    return truckLoadsMap[selectedTruckId] || [];
  }, [truckLoadsMap, selectedTruckId]);

  const handleConfirmTransfer = () => {
    if (!transferDestTruckId || !transferTargetDate) return;
    onTransferLoads(selectedTruckId, transferDestTruckId, selectedDate, transferTargetDate);
    setIsTransferModalOpen(false);
  };

  const openIncidentModal = (truckId: string) => {
    setIncidentModal({ isOpen: true, truckId });
    setNewIncidentData({ number: '', zipCode: '', city: '', notes: '' });
  };

  const handleZipChange = async (zip: string) => {
    setNewIncidentData(prev => ({ ...prev, zipCode: zip }));
    if (zip.length === 5) {
      try {
        const response = await fetch(`https://api.zippopotam.us/es/${zip}`);
        if (response.ok) {
          const data = await response.json();
          if (data.places && data.places.length > 0) {
            setNewIncidentData(prev => ({ ...prev, city: data.places[0]['place name'] }));
          }
        }
      } catch (error) {
        const province = getProvinceFromZip(zip);
        setNewIncidentData(prev => ({ ...prev, city: province }));
      }
    }
  };

  const handleSaveIncident = () => {
    if (!newIncidentData.city || !newIncidentData.number || !onAddOrder) return;
    const incidentOrder: Order = {
      id: `INC-${newIncidentData.number}`,
      status: OrderStatus.SCHEDULED,
      serviceDate: selectedDate,
      totalAmount: 0,
      pendingPayment: 0,
      zipCode: newIncidentData.zipCode,
      city: newIncidentData.city,
      province: getProvinceFromZip(newIncidentData.zipCode),
      address: `INCIDENCIA: ${newIncidentData.city}`,
      notes: newIncidentData.notes ? `[INCIDENCIA] ${newIncidentData.notes}` : `[INCIDENCIA] ${newIncidentData.number}`,
      phone1: '---',
      phone2: '',
      truckId: incidentModal.truckId === 'unassigned' ? undefined : incidentModal.truckId
    };
    onAddOrder(incidentOrder);
    setIncidentModal({ isOpen: false, truckId: '' });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-[#5851FF] rounded-[1.2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hoja de Cargas Diaria</h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Planificación del día:</p>
                <input 
                  type="date"
                  className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                  value={selectedDate}
                  onChange={e => onFilterChange(selectedTruckId, e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl">
              <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Camiones Usados</span>
              <span className="text-xl font-black text-indigo-600 leading-none">{stats.used} <span className="text-[10px] text-slate-400">/ {trucks.length}</span></span>
            </div>
            <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl">
              <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Libres</span>
              <span className="text-xl font-black text-emerald-600 leading-none">{stats.free}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl">
              <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Pedidos</span>
              <span className="text-xl font-black text-slate-700 leading-none">{stats.regular}</span>
            </div>
            <div className="bg-rose-50 border border-rose-100 px-5 py-3 rounded-2xl">
              <span className="block text-[9px] font-black uppercase text-rose-400 tracking-widest leading-none mb-1.5">Incidencias</span>
              <span className="text-xl font-black text-rose-600 leading-none">{stats.incidents}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl shadow-lg">
              <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Total Envíos</span>
              <span className="text-xl font-black text-white leading-none">{stats.total}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Alerta de pedidos agendados sin camión */}
        {unassignedOrders.length > 0 && (
          <div 
            onClick={() => onFilterChange('unassigned', selectedDate)}
            className={`bg-rose-50 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col h-full animate-pulse group ${
              selectedTruckId === 'unassigned' ? 'border-rose-500 shadow-xl' : 'border-rose-200 hover:border-rose-400'
            }`}
          >
            <div className="p-6 border-b border-rose-100 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-rose-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-800 uppercase tracking-tight leading-none mb-1.5">SIN ASIGNAR</h3>
                  <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Requieren camión</p>
                </div>
              </div>
              <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{unassignedOrders.length}</span>
            </div>
            <div className="flex-1 p-6 space-y-2">
              {unassignedOrders.slice(0, 5).map(o => (
                <div key={o.id} className="bg-white/60 p-2.5 rounded-xl border border-rose-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-rose-700">{o.id}</span>
                  <span className="text-[10px] font-black text-slate-700 truncate max-w-[100px]">{o.city}</span>
                </div>
              ))}
              {unassignedOrders.length > 5 && <p className="text-center text-[9px] font-black text-rose-400 uppercase mt-2">+ {unassignedOrders.length - 5} más</p>}
            </div>
            <div className="p-5 mt-auto bg-rose-100/50 rounded-b-[2rem] text-center">
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Resolver Urgente</span>
            </div>
          </div>
        )}

        {sortedTrucks.map(truck => {
          const load = truckLoadsMap[truck.id] || [];
          const totalLoadValue = load.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
          const isSelected = selectedTruckId === truck.id;
          const regularOrders = load.filter(o => !o.notes.includes('[INCIDENCIA]'));
          const truckIncidents = load.filter(o => o.notes.includes('[INCIDENCIA]'));

          return (
            <div 
              key={truck.id}
              onClick={() => onFilterChange(truck.id, selectedDate)}
              className={`bg-white rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col h-full group ${
                isSelected ? 'border-[#5851FF] shadow-2xl shadow-indigo-100' : 'border-slate-100 hover:border-slate-300 hover:shadow-lg'
              }`}
            >
              <div className={`p-6 border-b flex justify-between items-start ${isSelected ? 'bg-indigo-50/30 border-indigo-100' : 'border-slate-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-sm ${isSelected ? 'bg-[#5851FF] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {truck.number}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{truck.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{truck.phone || 'Sin contacto'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {load.length > 0 && <span className="bg-[#5851FF] text-white text-[10px] font-black px-2.5 py-1 rounded-full">{load.length}</span>}
                  <button onClick={(e) => { e.stopPropagation(); openIncidentModal(truck.id); }} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></button>
                </div>
              </div>
              <div className="flex-1 p-6 space-y-3">
                {truckIncidents.map(inc => (
                  <div key={inc.id} className="bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[10px] font-black text-rose-700 uppercase leading-none">{inc.id.replace('INC-', '')} - {inc.city}</span>
                  </div>
                ))}
                {load.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Libre</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {regularOrders.slice(0, 8).map(order => (
                      <div key={order.id} onClick={(e) => { e.stopPropagation(); onSelectOrder(order); }} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white shadow-sm">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[10px] font-black text-[#5851FF] leading-none uppercase tracking-tighter">{order.id}</span>
                          <span className="text-[11px] text-slate-700 font-black truncate uppercase mt-1">{order.city}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={`p-6 mt-auto border-t flex items-center justify-between rounded-b-[2rem] ${isSelected ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50/50'}`}>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total:</span>
                <span className="text-sm font-black text-slate-800">{totalLoadValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
            </div>
          );
        })}
      </div>

      {incidentModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIncidentModal({ isOpen: false, truckId: '' })} />
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 p-8 animate-scaleIn">
            <h3 className="text-xl font-black text-center text-slate-800 mb-6 uppercase">Registrar Incidencia</h3>
            <div className="space-y-4">
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold outline-none" placeholder="Nº Pedido/Incidencia" value={newIncidentData.number} onChange={e => setNewIncidentData({...newIncidentData, number: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold outline-none" placeholder="CP" value={newIncidentData.zipCode} onChange={e => handleZipChange(e.target.value)} />
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold outline-none" placeholder="Ciudad" value={newIncidentData.city} onChange={e => setNewIncidentData({...newIncidentData, city: e.target.value})} />
              </div>
              <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold outline-none resize-none" rows={3} placeholder="Notas..." value={newIncidentData.notes} onChange={e => setNewIncidentData({...newIncidentData, notes: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIncidentModal({ isOpen: false, truckId: '' })} className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">Cancelar</button>
              <button onClick={handleSaveIncident} disabled={!newIncidentData.city || !newIncidentData.number} className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30">Grabar</button>
            </div>
          </div>
        </div>
      )}

      {selectedTruckId && (
        <div className="animate-slideIn mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className={`w-10 h-10 ${selectedTruckId === 'unassigned' ? 'bg-rose-500' : 'bg-slate-900'} rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg`}>
                {selectedTruck?.number || '---'}
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Detalle de Hoja de Ruta</h3>
              <div className="h-[2px] flex-1 bg-slate-100 rounded-full"></div>
            </div>
            {selectedTruckId !== 'unassigned' && (
              <button onClick={() => { setTransferDestTruckId(''); setTransferTargetDate(selectedDate); setIsTransferModalOpen(true); }} className="ml-8 px-6 py-3 bg-slate-900 text-white rounded-[1rem] text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                Traspasar Carga
              </button>
            )}
          </div>
          
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[11px] font-black uppercase text-slate-400 tracking-widest">Nº Pedido</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase text-slate-400 tracking-widest">Población</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase text-slate-400 tracking-widest">Dirección</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase text-slate-400 tracking-widest">Contacto</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase text-slate-400 tracking-widest min-w-[200px]">Notas</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentLoad.length === 0 ? (
                    <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 uppercase font-black text-[10px]">No hay pedidos en este camión</td></tr>
                  ) : (
                    currentLoad.map(order => (
                      <tr key={order.id} onClick={() => onSelectOrder(order)} className={`hover:bg-slate-50 cursor-pointer group ${order.notes.includes('[INCIDENCIA]') ? 'bg-rose-50/30' : ''}`}>
                        <td className="px-8 py-5 font-black text-[#5851FF] group-hover:underline">{order.id}</td>
                        <td className="px-8 py-5 font-black text-slate-800 uppercase text-[12px]">{order.city}</td>
                        <td className="px-8 py-5 text-slate-500 text-[11px]">{order.address}</td>
                        <td className="px-8 py-5 font-black text-slate-700 text-[11px]">{order.phone1 || '---'}</td>
                        <td className="px-8 py-5">
                          <div className={`p-2 rounded-lg text-[10px] italic ${order.notes.includes('[INCIDENCIA]') ? 'bg-rose-100/50 text-rose-800' : 'bg-slate-50 text-slate-500'}`}>
                            {order.notes || '---'}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right font-black">{order.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isTransferModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsTransferModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 p-10 animate-scaleIn">
            <h3 className="text-2xl font-black text-slate-800 mb-8">Traspasar Carga</h3>
            <div className="space-y-6">
              <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black outline-none" value={transferDestTruckId} onChange={e => setTransferDestTruckId(e.target.value)}>
                <option value="">Destino camión...</option>
                {sortedTrucks.filter(t => t.id !== selectedTruckId).map(t => <option key={t.id} value={t.id}>[{t.number}] - {t.name}</option>)}
              </select>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black outline-none" value={transferTargetDate} onChange={e => setTransferTargetDate(e.target.value)} />
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsTransferModalOpen(false)} className="flex-1 py-4 text-slate-400 uppercase font-black text-[10px]">Cancelar</button>
              <button onClick={handleConfirmTransfer} disabled={!transferDestTruckId || !transferTargetDate} className="flex-2 py-4 bg-[#5851FF] text-white rounded-2xl font-black uppercase text-[10px] disabled:opacity-50">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadsView;
