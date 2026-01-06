
import React, { useMemo } from 'react';
import { Order, OrderStatus } from '../types';

interface RecentEditsViewProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

const RecentEditsView: React.FC<RecentEditsViewProps> = ({ orders, onSelectOrder }) => {
  const recentOrders = useMemo(() => {
    return [...orders]
      .filter(o => !!o.updatedAt && !!o.updatedBy) // Solo mostramos los que tienen un editor asignado (cambios manuales)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
      .slice(0, 20);
  }, [orders]);

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.UNREVIEWED: return "bg-slate-100 text-slate-500";
      case OrderStatus.RTC: return "bg-purple-100 text-purple-700";
      case OrderStatus.CLIENT_NOTICE: return "bg-rose-100 text-rose-700";
      case OrderStatus.PREPARING: return "bg-blue-100 text-blue-700";
      case OrderStatus.SCHEDULED: return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-400";
    }
  };

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Hace un momento";
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          Registro de Cambios Manuales
        </h2>
        <p className="text-slate-500 mt-2 font-bold italic text-sm">Listado de pedidos modificados manualmente tras la última importación masiva.</p>
      </div>

      {recentOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-24 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">No se han registrado ediciones manuales todavía</p>
          <p className="text-slate-300 text-xs mt-1 font-bold">Los pedidos recién importados no aparecen aquí hasta que alguien los modifique.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recentOrders.map(order => (
            <div 
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-2xl hover:border-indigo-200 transition-all cursor-pointer group hover:-translate-y-1 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-5">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">{order.id}</span>
                  <h3 className="text-sm font-black text-slate-800 truncate uppercase mt-1 leading-tight">{order.city}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter shrink-0 ml-2 ${getStatusStyle(order.status)}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-6 flex-1">
                <p className="text-[11px] text-slate-500 line-clamp-2 italic leading-relaxed">{order.address}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Pte. Cobro</span>
                  <span className={`text-[13px] font-black ${order.pendingPayment > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {order.pendingPayment.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                  </span>
                </div>
              </div>

              {/* Sección del Editor */}
              <div className="mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black text-indigo-600">
                    {order.updatedBy?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-0.5">Editado por:</span>
                    <span className="block text-[10px] font-black text-slate-700 leading-none uppercase">{order.updatedBy}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[10px] font-black uppercase">{formatRelativeTime(order.updatedAt)}</span>
                </div>
                <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-12">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentEditsView;
