
import React from 'react';
import { OrderStats } from '../types';

interface DashboardStatsProps {
  stats: OrderStats;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Tarjeta: Valor Total de la Cartera */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md group">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Valor Total Cartera</p>
        <p className="text-2xl font-black text-[#5851FF] group-hover:scale-105 transition-transform origin-left">
          {stats.totalPortfolioValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
        </p>
        <div className="mt-2 text-[9px] text-slate-400 font-bold italic">Sumatoria columna Importe</div>
      </div>

      {/* Tarjeta: Número de Pedidos */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Número de Pedidos</p>
        <div className="flex items-center gap-3">
          <p className="text-3xl font-black text-slate-900">{stats.totalOrders}</p>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase">Unidades</span>
        </div>
      </div>

      {/* Tarjeta: Pte. Cobro Total */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Pte. Cobro Total</p>
        <p className="text-2xl font-black text-rose-600">
          {stats.totalPendingAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
        </p>
      </div>

      {/* Tarjeta: Pedidos Pendientes Revisar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Por Revisar</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-black text-orange-600">{stats.pendingCount}</p>
          <span className="px-2 py-1 text-[9px] bg-orange-100 text-orange-600 rounded-lg font-black uppercase tracking-tighter animate-pulse">
            Pendiente
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
