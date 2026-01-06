
import React, { useState } from 'react';
import { Truck, Order, OrderStatus } from '../types';
import TruckCalendarModal from './TruckCalendarModal';

interface TruckManagerProps {
  trucks: Truck[];
  orders: Order[];
  onAddTruck: (truck: Omit<Truck, 'id'>) => void;
  onUpdateTruck: (truck: Truck) => void;
  onDeleteTruck: (id: string) => void;
  onNavigateToLoads: (truckId: string, date: string) => void;
}

const TruckManager: React.FC<TruckManagerProps> = ({ trucks, orders, onAddTruck, onUpdateTruck, onDeleteTruck, onNavigateToLoads }) => {
  const [newTruck, setNewTruck] = useState({ number: '', name: '', phone: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTruckForCalendar, setSelectedTruckForCalendar] = useState<Truck | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTruck.number || !newTruck.name) return;
    
    if (editingId) {
      onUpdateTruck({
        id: editingId,
        number: newTruck.number,
        name: newTruck.name,
        phone: newTruck.phone
      });
      setEditingId(null);
    } else {
      onAddTruck({
        number: newTruck.number,
        name: newTruck.name,
        phone: newTruck.phone
      });
    }
    
    setNewTruck({ number: '', name: '', phone: '' });
  };

  const handleEditClick = (truck: Truck) => {
    setNewTruck({
      number: truck.number,
      name: truck.name,
      phone: truck.phone || ''
    });
    setEditingId(truck.id);
    // Hacer scroll al formulario para que el usuario sepa que está editando
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewTruck({ number: '', name: '', phone: '' });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`bg-white rounded-2xl shadow-sm border p-8 transition-all ${editingId ? 'border-[#5851FF] ring-4 ring-indigo-50' : 'border-slate-200'}`}>
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <svg className={`w-6 h-6 ${editingId ? 'text-indigo-600' : 'text-[#5851FF]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
          {editingId ? 'Editar Unidad de Transporte' : 'Nueva Unidad de Transporte'}
        </h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Número de Camión</label>
            <input 
              type="text" 
              placeholder="Ej: C-01" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#5851FF]"
              value={newTruck.number}
              onChange={e => setNewTruck({...newTruck, number: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nombre Conductor</label>
            <input 
              type="text" 
              placeholder="Juan Pérez" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#5851FF]"
              value={newTruck.name}
              onChange={e => setNewTruck({...newTruck, name: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Teléfono (Opcional)</label>
            <input 
              type="text" 
              placeholder="600000000" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#5851FF]"
              value={newTruck.phone}
              onChange={e => setNewTruck({...newTruck, phone: e.target.value})}
            />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className={`flex-1 py-2.5 text-white rounded-xl text-sm font-bold transition-all shadow-lg ${editingId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-[#5851FF] hover:bg-[#4a44d4] shadow-indigo-100'}`}>
              {editingId ? 'Guardar Cambios' : 'Registrar Camión'}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={handleCancelEdit}
                className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest">Número</th>
              <th className="px-8 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest">Conductor y Contacto</th>
              <th className="px-8 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trucks.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-8 py-10 text-center text-slate-400 italic">No hay camiones registrados.</td>
              </tr>
            ) : (
              trucks.map(truck => {
                return (
                  <tr 
                    key={truck.id} 
                    className={`hover:bg-slate-50 transition-colors cursor-pointer group ${editingId === truck.id ? 'bg-indigo-50/30' : ''}`}
                    onClick={() => setSelectedTruckForCalendar(truck)}
                  >
                    <td className="px-8 py-4">
                      <div className="font-black text-[#5851FF] text-lg group-hover:underline">{truck.number}</div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="font-bold text-slate-700 uppercase tracking-tight">{truck.name}</div>
                      <div className="text-xs text-slate-400 font-bold">{truck.phone || 'Sin teléfono registrado'}</div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => setSelectedTruckForCalendar(truck)}
                          className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-[#5851FF] transition-all rounded-xl hover:bg-indigo-50 border border-transparent"
                          title="Ver Calendario"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="hidden lg:inline text-[10px] font-black uppercase">Calendario</span>
                        </button>
                        <button 
                          onClick={() => handleEditClick(truck)}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-xl hover:bg-indigo-50"
                          title="Editar Camión"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button 
                          onClick={() => onDeleteTruck(truck.id)} 
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TruckCalendarModal 
        isOpen={!!selectedTruckForCalendar}
        onClose={() => setSelectedTruckForCalendar(null)}
        truck={selectedTruckForCalendar}
        orders={orders}
        onDateDoubleClick={(date) => {
          if (selectedTruckForCalendar) {
            onNavigateToLoads(selectedTruckForCalendar.id, date);
            setSelectedTruckForCalendar(null);
          }
        }}
      />
    </div>
  );
};

export default TruckManager;
