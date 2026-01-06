
import React from 'react';
import { Order, OrderStatus, Store } from '../types';

interface OrderTableProps {
  orders: Order[];
  stores: Store[];
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onDeleteOrder: (id: string) => void;
  onSelectOrder: (order: Order) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, stores, onUpdateStatus, onDeleteOrder, onSelectOrder }) => {
  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.UNREVIEWED: return "bg-slate-50 text-slate-500 border-slate-200";
      case OrderStatus.RTC: return "bg-purple-50 text-purple-600 border-purple-200";
      case OrderStatus.CLIENT_NOTICE: return "bg-rose-50 text-rose-600 border-rose-200";
      case OrderStatus.PREPARING: return "bg-blue-50 text-blue-600 border-blue-200";
      case OrderStatus.SCHEDULED: return "bg-amber-50 text-amber-600 border-amber-200";
      default: return "bg-slate-50 text-slate-400";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "---";
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getStoreDisplayName = (codeOrName: string) => {
    if (!codeOrName) return '---';
    // Buscamos si el dato del pedido coincide con algún código manual de tienda
    const store = stores.find(s => s.code === codeOrName || s.name === codeOrName);
    return store ? store.name : codeOrName;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed lg:table-auto">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest min-w-[120px]">Pedido</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest min-w-[150px]">Tienda</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest min-w-[200px]">Dirección Completa</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest min-w-[250px]">Notas</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest text-center">Provincia</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest w-[110px]">Importe</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest w-[110px]">Pte. Cobro</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right w-[160px]">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-slate-400 italic">
                  No hay pedidos que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr 
                  key={order.id} 
                  onClick={() => onSelectOrder(order)}
                  className="hover:bg-slate-50/50 transition-all group cursor-pointer"
                >
                  <td className="px-6 py-5 align-top">
                    <div className="text-[13px] font-black text-[#5851FF] uppercase tracking-wide group-hover:underline">
                      {order.id}
                    </div>
                    <div className="text-[12px] text-slate-400 font-medium mt-0.5">
                      {formatDate(order.serviceDate)}
                    </div>
                  </td>

                  <td className="px-6 py-5 align-top">
                    <div className="text-[11px] font-black text-slate-800 uppercase bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-block tracking-tight">
                      {getStoreDisplayName(order.store || '')}
                    </div>
                  </td>

                  <td className="px-6 py-5 align-top">
                    <div className="text-[14px] font-bold text-slate-700">
                      {order.city} <span className="text-slate-400 font-medium text-[11px] ml-1">{order.zipCode}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 whitespace-normal break-words leading-relaxed">
                      {order.address}
                    </div>
                  </td>

                  <td className="px-6 py-5 align-top">
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 min-h-[40px] whitespace-normal break-words italic">
                      {order.notes || <span className="text-slate-300">Sin notas adicionales</span>}
                    </div>
                  </td>

                  <td className="px-6 py-5 text-center align-top">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-md border border-indigo-100">
                      {order.province || '---'}
                    </span>
                  </td>

                  <td className="px-6 py-5 align-top">
                    <div className="text-[14px] font-bold text-slate-500">
                      {order.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                    </div>
                  </td>

                  <td className="px-6 py-5 align-top">
                    <div className={`text-[15px] font-black ${order.pendingPayment > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {order.pendingPayment.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                    </div>
                  </td>

                  <td className="px-6 py-5 text-right align-top">
                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                        className={`pl-3 pr-8 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer outline-none transition-all ${getStatusStyle(order.status)}`}
                      >
                        {Object.values(OrderStatus).map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
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

export default OrderTable;
