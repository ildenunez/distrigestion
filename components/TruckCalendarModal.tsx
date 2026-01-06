
import React, { useState, useMemo } from 'react';
import { Truck, Order, OrderStatus } from '../types';

interface TruckCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  truck: Truck | null;
  orders: Order[];
  onDateDoubleClick?: (date: string) => void;
}

const TruckCalendarModal: React.FC<TruckCalendarModalProps> = ({ isOpen, onClose, truck, orders, onDateDoubleClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentDate]);

  const firstDayOfMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    // 0 = Domingo, 1 = Lunes... ajustar para que Lunes sea el primer día
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  }, [currentDate]);

  const busyDays = useMemo(() => {
    if (!truck) return {};
    const scheduled = orders.filter(o => o.truckId === truck.id && o.status === OrderStatus.SCHEDULED);
    
    const map: Record<string, number> = {};
    scheduled.forEach(o => {
      if (o.serviceDate) {
        map[o.serviceDate] = (map[o.serviceDate] || 0) + 1;
      }
    });
    return map;
  }, [truck, orders]);

  if (!isOpen || !truck) return null;

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDayDoubleClick = (dateStr: string, hasOrders: boolean) => {
    if (hasOrders && onDateDoubleClick) {
      onDateDoubleClick(dateStr);
    }
  };

  const calendarDays = [];
  // Días vacíos al inicio
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/30"></div>);
  }

  // Días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const orderCount = busyDays[dateStr] || 0;
    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

    calendarDays.push(
      <div 
        key={day} 
        onDoubleClick={() => handleDayDoubleClick(dateStr, orderCount > 0)}
        className={`h-24 border border-slate-100 p-2 transition-all relative group/day ${isToday ? 'bg-indigo-50/20' : ''} ${orderCount > 0 ? 'hover:bg-indigo-50/40 cursor-pointer active:scale-95' : 'hover:bg-slate-50/50'}`}
        title={orderCount > 0 ? "Doble clic para ver carga" : ""}
      >
        <span className={`text-xs font-black ${isToday ? 'text-[#5851FF]' : 'text-slate-400'}`}>
          {day} {isToday && '•'}
        </span>
        
        {orderCount > 0 && (
          <div className="mt-2">
            <div className="bg-[#5851FF] text-white rounded-lg p-1.5 flex flex-col items-center justify-center shadow-sm group-hover/day:shadow-md transition-all">
              <span className="text-[10px] font-black leading-none">{orderCount}</span>
              <span className="text-[8px] font-bold uppercase tracking-tighter mt-0.5">Pedidos</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-10">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-scaleIn flex flex-col h-[85vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-[#5851FF] font-black text-xl">
              {truck.number}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Ocupación del Camión</h2>
              <p className="text-sm text-slate-500 font-medium">Planificación para {truck.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tip</span>
              <span className="text-[10px] text-slate-400 font-bold">Doble clic en un día para ver carga</span>
            </div>

            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm font-black uppercase tracking-widest text-slate-700 min-w-[140px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <div className="flex-1 overflow-auto bg-white p-6">
          <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            {dayLabels.map(label => (
              <div key={label} className="bg-slate-50 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                {label}
              </div>
            ))}
            {calendarDays}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-6 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-50 border border-indigo-200 rounded-sm"></div>
            <span>Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#5851FF] rounded-sm"></div>
            <span>Día con Pedidos (Doble clic)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TruckCalendarModal;
