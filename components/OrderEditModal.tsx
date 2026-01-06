
import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderStatus, Truck, Store } from '../types';
import { getProvinceFromZip } from '../utils/provinceHelper';

interface OrderEditModalProps {
  order: Order | null;
  trucks: Truck[];
  stores: Store[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOrder: Order) => void;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({ order, trucks, stores, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Order | null>(null);

  useEffect(() => {
    if (order) {
      setFormData({ 
        ...order,
        province: getProvinceFromZip(order.zipCode)
      });
    }
  }, [order]);

  const sortedTrucks = useMemo(() => {
    return [...trucks].sort((a, b) => 
      a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [trucks]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      if (!prev) return null;
      
      const updated = { 
        ...prev, 
        [name]: (name === 'pendingPayment' || name === 'totalAmount') ? parseFloat(value) || 0 : value 
      };
      
      if (name === 'zipCode') {
        updated.province = getProvinceFromZip(value);
      }
      
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-scaleIn">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Detalles del Pedido</h2>
            <p className="text-sm text-[#5851FF] font-bold uppercase tracking-wider">{formData.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Fecha de Servicio</label>
              <input
                type="date"
                name="serviceDate"
                value={formData.serviceDate}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Estado del Pedido</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
              >
                {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Tienda</label>
              <select
                name="store"
                value={formData.store || ""}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
              >
                <option value="">Sin Tienda Definida</option>
                {stores.map(s => <option key={s.id} value={s.code}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Camión Asignado</label>
              <select
                name="truckId"
                value={formData.truckId || ""}
                onChange={handleChange}
                className="w-full bg-indigo-50/50 border border-indigo-100 text-indigo-700 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              >
                <option value="">Sin Camión Asignado</option>
                {sortedTrucks.map(t => (
                  <option key={t.id} value={t.id}>[{t.number}] {t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Importe Total (€)</label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Pte. Cobro (€)</label>
              <input
                type="number"
                name="pendingPayment"
                value={formData.pendingPayment}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black text-rose-600 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Teléfono 1</label>
              <input
                type="text"
                name="phone1"
                value={formData.phone1}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Código Postal</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Dirección</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Notas del Pedido</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-8 py-2.5 rounded-xl text-sm font-bold bg-[#5851FF] text-white hover:bg-[#4a44d4] shadow-lg shadow-indigo-100 transition-all"
          >
            Actualizar Pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;
