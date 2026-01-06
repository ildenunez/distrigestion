
import React, { useState, useMemo, useEffect } from 'react';
import { Order, OrderStatus, OrderStats, Truck, AppUser, UserRole, ChatMessage, GroupMessage } from './types.ts';
import { parseCSV } from './utils/csvParser.ts';
import { supabase } from './lib/supabase.ts';
import DashboardStats from './components/DashboardStats.tsx';
import OrderTable from './components/OrderTable.tsx';
import OrderEditModal from './components/OrderEditModal.tsx';
import TruckManager from './components/TruckManager.tsx';
import LoadsView from './components/LoadsView.tsx';
import RecentEditsView from './components/RecentEditsView.tsx';
import LoginPage from './components/LoginPage.tsx';
import UserManager from './components/UserManager.tsx';
import ChatInterface from './components/ChatInterface.tsx';

type AppTab = 'orders' | 'trucks' | 'loads' | 'recent' | 'users' | 'chat';
type SortField = 'serviceDate' | 'totalAmount' | 'pendingPayment' | 'id';
type SortDirection = 'asc' | 'desc';
type PaymentFilter = 'all' | 'zero' | 'debt';

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [serviceDateFilter, setServiceDateFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortField>('serviceDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [loadsTruckId, setLoadsTruckId] = useState<string>('');
  const [loadsDate, setLoadsDate] = useState<string>(getTomorrowDate());
  
  const [lastImportAt, setLastImportAt] = useState<string | null>(localStorage.getItem('lastImportTimestamp'));
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'chat', sender?: string, isGroup?: boolean} | null>(null);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mapFromDB = (data: any): Order => ({
    id: data.id,
    status: data.status as OrderStatus,
    serviceDate: data.service_date || '',
    totalAmount: Number(data.total_amount) || 0,
    pendingPayment: Number(data.pending_payment) || 0,
    zipCode: data.zip_code || '',
    city: data.city || '',
    province: data.province || '',
    address: data.address || '',
    notes: data.notes || '',
    phone1: data.phone1 || '',
    phone2: data.phone2 || '',
    truckId: data.truck_id || undefined,
    updatedAt: data.updated_at
  });

  const mapToDB = (o: Order) => ({
    id: o.id,
    status: o.status,
    service_date: o.serviceDate || null,
    total_amount: o.totalAmount,
    pending_payment: o.pendingPayment,
    zip_code: o.zipCode,
    city: o.city,
    province: o.province,
    address: o.address,
    notes: o.notes,
    phone1: o.phone1,
    phone2: o.phone2,
    truck_id: o.truckId || null,
    updated_at: o.updatedAt || null
  });

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('app_users').select('*');
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('schema cache')) {
          console.error("La tabla 'app_users' no existe. Ejecuta el SQL en Supabase.");
          showNotification("Error: Tabla 'app_users' no encontrada. Ejecute el SQL.", "error");
        } else {
          throw error;
        }
      }
      setUsers(data || []);
    } catch (err: any) {
      console.error("Error al cargar usuarios:", err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: trucksData } = await supabase.from('trucks').select('*');
        if (trucksData) setTrucks(trucksData);

        const { data: ordersData } = await supabase.from('orders').select('*');
        if (ordersData) setOrders(ordersData.map(mapFromDB));

        await fetchUsers();
      } catch (err: any) {
        console.error("Error al sincronizar con Supabase:", err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const chatChannel = supabase
      .channel('global_chat_notifs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.receiver_id === currentUser.id) {
            const sender = users.find(u => u.id === newMsg.sender_id);
            setNotification({
              message: newMsg.content,
              type: 'chat',
              sender: sender ? sender.name : 'Compañero',
              isGroup: false
            });
            setTimeout(() => setNotification(null), 6000);
          }
        }
      )
      .subscribe();

    const groupChannel = supabase
      .channel('global_group_notifs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages' },
        (payload) => {
          const newMsg = payload.new as GroupMessage;
          if (newMsg.sender_id !== currentUser.id) {
            const sender = users.find(u => u.id === newMsg.sender_id);
            setNotification({
              message: newMsg.content,
              type: 'chat',
              sender: sender ? sender.name : 'Alguien',
              isGroup: true
            });
            setTimeout(() => setNotification(null), 6000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(groupChannel);
    };
  }, [currentUser, users]);

  const handleLogin = (username: string, password: string) => {
    if (users.length === 0) {
      setLoginError("No hay usuarios cargados. Verifique que la tabla exista en Supabase.");
      return;
    }

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      setLoginError(null);
      showNotification(`Bienvenido, ${user.name}`, "success");
    } else {
      setLoginError("Acceso denegado: Usuario o contraseña incorrectos.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('orders');
  };

  const handleAddUser = async (u: Omit<AppUser, 'id'>) => {
    try {
      const { error } = await supabase.from('app_users').insert([u]);
      if (error) throw error;
      await fetchUsers();
      showNotification("Usuario registrado correctamente", "success");
    } catch (err: any) {
      showNotification("Error al crear usuario en BD", "error");
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from('app_users').delete().eq('id', id);
      if (error) throw error;
      await fetchUsers();
      showNotification("Usuario eliminado", "success");
    } catch (err: any) {
      showNotification("Error al eliminar de BD", "error");
    }
  };

  const availableProvinces = useMemo(() => {
    const provinces = orders
      .map(o => o.province)
      .filter((p): p is string => !!p);
    return Array.from(new Set(provinces)).sort();
  }, [orders]);

  const availableCities = useMemo(() => {
    const filteredByProvince = provinceFilter === 'all' 
      ? orders 
      : orders.filter(o => o.province === provinceFilter);
      
    const cities = filteredByProvince
      .map(o => o.city)
      .filter((c): c is string => !!c);
    return Array.from(new Set(cities)).sort();
  }, [orders, provinceFilter]);

  useEffect(() => {
    if (cityFilter !== 'all' && !availableCities.includes(cityFilter)) {
      setCityFilter('all');
    }
  }, [provinceFilter, availableCities, cityFilter]);

  const filteredAndSortedOrders = useMemo(() => {
    const term = searchTerm.toLowerCase();
    
    let result = orders.filter(o => {
      const matchesSearch = 
        (o.id || '').toLowerCase().includes(term) || 
        (o.city || '').toLowerCase().includes(term) ||
        (o.address || '').toLowerCase().includes(term) ||
        (o.notes || '').toLowerCase().includes(term) ||
        (o.phone1 || '').includes(term) ||
        (o.zipCode || '').includes(term);
      
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesProvince = provinceFilter === 'all' || o.province === provinceFilter;
      const matchesCity = cityFilter === 'all' || o.city === cityFilter;
      const matchesServiceDate = !serviceDateFilter || o.serviceDate === serviceDateFilter;
      
      let matchesPayment = true;
      if (paymentFilter === 'zero') matchesPayment = o.pendingPayment === 0;
      else if (paymentFilter === 'debt') matchesPayment = o.pendingPayment > 0;
      
      return matchesSearch && matchesStatus && matchesProvince && matchesCity && matchesPayment && matchesServiceDate;
    });

    result.sort((a, b) => {
      let valA: any = a[sortBy] ?? '';
      let valB: any = b[sortBy] ?? '';

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [orders, searchTerm, statusFilter, provinceFilter, cityFilter, paymentFilter, serviceDateFilter, sortBy, sortDirection]);

  const stats = useMemo((): OrderStats => {
    const totalPendingAmount = filteredAndSortedOrders.reduce((sum, o) => sum + (o.pendingPayment || 0), 0);
    const totalPortfolioValue = filteredAndSortedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    return {
      totalOrders: filteredAndSortedOrders.length,
      totalPendingAmount,
      totalPortfolioValue,
      averageAmount: filteredAndSortedOrders.length ? totalPortfolioValue / filteredAndSortedOrders.length : 0,
      pendingCount: filteredAndSortedOrders.filter(o => o.status === OrderStatus.UNREVIEWED).length
    };
  }, [filteredAndSortedOrders]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProvinceFilter('all');
    setCityFilter('all');
    setPaymentFilter('all');
    setServiceDateFilter('');
    setSortBy('serviceDate');
    setSortDirection('desc');
  };

  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || statusFilter !== 'all' || provinceFilter !== 'all' || cityFilter !== 'all' || paymentFilter !== 'all' || serviceDateFilter !== '' || sortBy !== 'serviceDate' || sortDirection !== 'desc';
  }, [searchTerm, statusFilter, provinceFilter, cityFilter, paymentFilter, serviceDateFilter, sortBy, sortDirection]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const parsedOrdersFromCSV = parseCSV(text);
        if (parsedOrdersFromCSV.length === 0) {
          showNotification('Error: No se detectaron datos válidos.', 'error');
          return;
        }

        const ordersToUpsert = parsedOrdersFromCSV.map(newOrder => {
          const existing = orders.find(o => o.id === newOrder.id);
          return existing && existing.status === OrderStatus.SCHEDULED 
            ? { ...newOrder, truckId: existing.truckId, status: existing.status, updatedAt: existing.updatedAt } 
            : { ...newOrder, updatedAt: existing?.updatedAt || null };
        });

        const { error } = await supabase.from('orders').upsert(ordersToUpsert.map(mapToDB));
        if (error) throw error;

        const { data: freshOrders } = await supabase.from('orders').select('*');
        if (freshOrders) setOrders(freshOrders.map(mapFromDB));
        
        const timestamp = new Date().toLocaleString('es-ES', { 
          day: '2-digit', month: '2-digit', year: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        });
        setLastImportAt(timestamp);
        localStorage.setItem('lastImportTimestamp', timestamp);
        
        showNotification('Importación exitosa', 'success');
      } catch (err) {
        showNotification('Error al procesar el CSV', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'chat') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const updateOrderStatus = async (id: string, newStatus: OrderStatus) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from('orders').update({ 
      status: newStatus,
      updated_at: now 
    }).eq('id', id);

    if (!error) {
      const { data } = await supabase.from('orders').select('*').eq('id', id).single();
      if (data) {
        setOrders(prev => prev.map(o => o.id === id ? mapFromDB(data) : o));
      }
    } else {
      showNotification('Error al actualizar estado', 'error');
    }
  };

  const saveEditedOrder = async (updatedOrder: Order) => {
    const orderToSave = { ...updatedOrder, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('orders').update(mapToDB(orderToSave)).eq('id', orderToSave.id);
    
    if (!error) {
      const { data } = await supabase.from('orders').select('*').eq('id', orderToSave.id).single();
      if (data) {
        setOrders(prev => prev.map(o => o.id === orderToSave.id ? mapFromDB(data) : o));
        setIsModalOpen(false);
        showNotification('Pedido actualizado', 'success');
      }
    } else {
      showNotification('Error al guardar', 'error');
    }
  };

  const handleTransferLoads = async (sourceTruckId: string, destTruckId: string, sourceDate: string, targetDate: string) => {
    const ordersToMove = orders.filter(o => o.truckId === sourceTruckId && o.serviceDate === sourceDate && o.status === OrderStatus.SCHEDULED);
    if (ordersToMove.length === 0) return;

    const ids = ordersToMove.map(o => o.id);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('orders')
      .update({ 
        truck_id: destTruckId, 
        service_date: targetDate,
        updated_at: now
      })
      .in('id', ids);

    if (!error) {
      const { data: freshOrders } = await supabase.from('orders').select('*');
      if (freshOrders) setOrders(freshOrders.map(mapFromDB));
      showNotification(`Traspaso completado: ${ids.length} pedidos movidos.`, 'success');
      setLoadsTruckId(destTruckId);
      setLoadsDate(targetDate);
    } else {
      showNotification('Error al traspasar cargas', 'error');
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCalendarNavigate = (truckId: string, date: string) => {
    setLoadsTruckId(truckId);
    setLoadsDate(date);
    setActiveTab('loads');
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const canImport = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPERVISOR;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#5851FF] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter">DistriGestión <span className="text-[#5851FF]">v1.0</span></h1>
            </div>
            
            <div className="hidden md:flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
              {[
                { id: 'orders', label: 'Pedidos' },
                { id: 'trucks', label: 'Flota' },
                { id: 'loads', label: 'Cargas' },
                { id: 'recent', label: 'Recientes' },
                { id: 'chat', label: 'Chat' },
                ...(isAdmin ? [{ id: 'users', label: 'Usuarios' }] : [])
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AppTab)}
                  className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === tab.id ? 'bg-white text-[#5851FF] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end leading-none mr-4">
              <span className="text-[10px] font-black uppercase text-[#5851FF] tracking-widest mb-1">{currentUser.role}</span>
              <span className="text-sm font-black text-slate-700">{currentUser.name}</span>
            </div>

            <div className="h-10 w-[1px] bg-slate-100 mx-2" />

            {canImport && (
              <div className="flex items-center gap-6">
                {lastImportAt && (
                  <div className="hidden lg:flex flex-col items-end leading-none">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Última Importación</span>
                    <span className="text-[11px] font-bold text-slate-600">{lastImportAt}</span>
                  </div>
                )}
                <label className="cursor-pointer bg-[#5851FF] hover:bg-[#4a44d4] text-white px-7 py-3 rounded-2xl text-sm font-black transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 transform active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  Importar CSV
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}

            <button 
              onClick={handleLogout}
              className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
              title="Cerrar Sesión"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-8 py-10">
        {isLoading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
             <div className="w-12 h-12 border-4 border-slate-200 border-t-[#5851FF] rounded-full animate-spin"></div>
             <p className="font-black uppercase tracking-widest text-[10px]">Cargando Sistema...</p>
          </div>
        ) : (
          <>
            {activeTab === 'orders' && (
              <>
                <DashboardStats stats={stats} />
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="relative w-full max-w-[280px]">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                          type="text"
                          placeholder="Buscar pedido, ciudad..."
                          className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-50 focus:border-[#5851FF] transition-all"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-3 flex-1 justify-end">
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-600 outline-none hover:border-slate-300 transition-colors">
                          <option value="all">Estado: Todos</option>
                          {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={provinceFilter} onChange={(e) => setProvinceFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-600 outline-none hover:border-slate-300 transition-colors">
                          <option value="all">Provincia: Todas</option>
                          {availableProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-600 outline-none hover:border-slate-300 transition-colors">
                          <option value="all">Ciudad: Todas</option>
                          {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-600 outline-none hover:border-slate-300 transition-colors">
                          <option value="all">Cobro: Todos</option>
                          <option value="zero">Pagado (0€)</option>
                          <option value="debt">Con Deuda (&gt;0€)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-50">
                      <div className="flex flex-wrap gap-3 items-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2">Ordenar por:</span>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortField)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-600 outline-none hover:border-slate-300 transition-colors">
                          <option value="serviceDate">Fecha Servicio</option>
                          <option value="totalAmount">Importe Total</option>
                          <option value="pendingPayment">Pte. Cobro</option>
                          <option value="id">ID Pedido</option>
                        </select>
                        
                        <button 
                          onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-2"
                        >
                          {sortDirection === 'asc' ? 'Ascendente' : 'Descendente'}
                          <svg className={`w-3.5 h-3.5 transform transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                        </button>

                        {sortBy === 'serviceDate' && (
                          <div className="flex items-center gap-2 animate-fadeIn bg-indigo-50/50 border border-indigo-100 rounded-xl px-3 py-1">
                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Ver Fecha:</span>
                            <input 
                              type="date"
                              className="bg-transparent border-none text-xs font-black text-indigo-600 outline-none cursor-pointer"
                              value={serviceDateFilter}
                              onChange={(e) => setServiceDateFilter(e.target.value)}
                            />
                            {serviceDateFilter && (
                              <button 
                                onClick={() => setServiceDateFilter('')}
                                className="p-1 text-indigo-400 hover:text-rose-500 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <button onClick={clearFilters} disabled={!hasActiveFilters} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all border ${hasActiveFilters ? 'bg-white border-slate-200 text-[#5851FF] hover:bg-indigo-50 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        Limpiar Filtros
                      </button>
                    </div>
                  </div>
                </div>
                <OrderTable orders={filteredAndSortedOrders} onUpdateStatus={updateOrderStatus} onDeleteOrder={() => {}} onSelectOrder={handleSelectOrder} />
              </>
            )}

            {activeTab === 'trucks' && (
              <TruckManager trucks={trucks} orders={orders} onAddTruck={async (t) => {
                const { data, error } = await supabase.from('trucks').insert([t]).select();
                if (!error && data) setTrucks(prev => [...prev, data[0]]);
              }} onDeleteTruck={async (id) => {
                const { error } = await supabase.from('trucks').delete().eq('id', id);
                if (!error) setTrucks(prev => prev.filter(t => t.id !== id));
              }} onNavigateToLoads={handleCalendarNavigate} />
            )}

            {activeTab === 'loads' && (
              <LoadsView orders={orders} trucks={trucks} onSelectOrder={handleSelectOrder} selectedTruckId={loadsTruckId} selectedDate={loadsDate} onFilterChange={(tId, d) => { setLoadsTruckId(tId); setLoadsDate(d); }} onTransferLoads={handleTransferLoads} />
            )}

            {activeTab === 'recent' && (
              <RecentEditsView orders={orders} onSelectOrder={handleSelectOrder} />
            )}

            {activeTab === 'chat' && (
              <ChatInterface currentUser={currentUser} users={users} />
            )}

            {activeTab === 'users' && isAdmin && (
              <UserManager users={users} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} />
            )}
          </>
        )}
      </main>

      <OrderEditModal isOpen={isModalOpen} order={selectedOrder} trucks={trucks} onClose={() => setIsModalOpen(false)} onSave={saveEditedOrder} />

      {/* Popups de Notificación Mejorados para Chat */}
      {notification && (
        <div className={`fixed bottom-10 right-8 px-8 py-5 rounded-[2rem] shadow-2xl border flex flex-col gap-1 animate-slideIn z-[100] max-w-sm ${
          notification.type === 'error' ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          {notification.type === 'chat' ? (
            <>
              <div className="flex items-center gap-3 mb-1">
                <div className={`w-8 h-8 ${notification.isGroup ? 'bg-emerald-500' : 'bg-indigo-500'} rounded-xl flex items-center justify-center text-[10px] font-black`}>
                  {notification.sender?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${notification.isGroup ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {notification.isGroup ? 'Mensaje Grupal' : 'Nuevo Mensaje'}
                  </p>
                  <p className="text-[13px] font-black leading-none">{notification.sender}</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 font-medium line-clamp-2 mt-1">{notification.message}</p>
              <button 
                onClick={() => { setActiveTab('chat'); setNotification(null); }}
                className="mt-3 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors flex items-center gap-1"
              >
                Ver Conversación
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4 py-1">
              <div className={`w-2.5 h-2.5 rounded-full ${notification.type === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-white'}`} />
              <span className="text-sm font-black uppercase tracking-tight">{notification.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
