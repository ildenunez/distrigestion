
import React, { useState } from 'react';
import { Store } from '../types';

interface StoreManagerProps {
  stores: Store[];
  onAddStore: (name: string, code: string) => void;
  onDeleteStore: (id: string) => void;
}

const StoreManager: React.FC<StoreManagerProps> = ({ stores, onAddStore, onDeleteStore }) => {
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCode, setNewStoreCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newStoreCode.trim()) return;
    onAddStore(newStoreName.trim().toUpperCase(), newStoreCode.trim().toUpperCase());
    setNewStoreName('');
    setNewStoreCode('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-[#5851FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          Gestión de Tiendas
        </h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Código / Número</label>
            <input 
              type="text" 
              placeholder="Ej: 101" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#5851FF]"
              value={newStoreCode}
              onChange={e => setNewStoreCode(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Nombre de la Tienda</label>
            <input 
              type="text" 
              placeholder="Ej: MADRID CENTRAL" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#5851FF]"
              value={newStoreName}
              onChange={e => setNewStoreName(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full px-8 py-3 bg-[#5851FF] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4a44d4] transition-all shadow-lg shadow-indigo-100 h-[46px]">
              Añadir Tienda
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-8 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest w-32">Código</th>
              <th className="px-8 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest">Nombre de Tienda</th>
              <th className="px-8 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stores.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-8 py-10 text-center text-slate-400 italic">No hay tiendas registradas.</td>
              </tr>
            ) : (
              stores.map(store => (
                <tr key={store.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-black text-[#5851FF] uppercase">{store.code}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-800 uppercase">{store.name}</div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => onDeleteStore(store.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreManager;
