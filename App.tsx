
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
type DateCondition = 'eq' | 'gt' | 'lt';

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
  const [dateCondition, setDateCondition] = useState<DateCondition>('eq');
  const [sortBy, setSortBy] = useState<SortField>('serviceDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [loadsTruckId, setLoadsTruckId] = useState<string>('');
  const [loadsDate, setLoadsDate] = useState<string>(getTomorrowDate());
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  
  // Estado para notificaciones
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'chat', sender?: string, isGroup?: boolean} | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  const usersRef = useRef<AppUser[]>([]);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { usersRef.current = users; }, [users]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mapFromDBFixed = (data: any): Order => ({
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

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('app_users').select('*');
      if (error) throw error;
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
        if (ordersData) setOrders(ordersData.map(mapFromDBFixed));

        await fetchUsers();
      } catch (err: any) {
        console.error("Error al sincronizar con Supabase:", err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddOrder = async (newOrder: Order) => {
    try {
      const { error } = await supabase.from('orders').insert([{
        id: newOrder.id,
        status: newOrder.status,
        service_date: newOrder.serviceDate,
        total_amount: newOrder.totalAmount,
        pending_payment: newOrder.pendingPayment,
        zip_code: newOrder.zipCode,
        city: newOrder.city,
        address: newOrder.address,
        notes: newOrder.notes,
        phone1: newOrder.phone1,
        phone2: newOrder.phone2,
        truck_id: newOrder.truckId,
        updated_at: new Date().toISOString()
      }]);

      if (error) throw error;

      setOrders(prev => [...prev, { ...newOrder, updatedAt: new Date().toISOString() }]);
      setNotification({ message: 'Incidencia/Pedido guardado correctamente', type: 'success' });
    } catch (err: any) {
      console.error("Error al guardar pedido:", err.message);
      setNotification({ message: 'Error al guardar en base de datos', type: 'error' });
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') setHasUnreadMessages(false);
  }, [activeTab]);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('notificaciones-globales')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.receiver_id === currentUser.id && newMsg.sender_id !== currentUser.id) {
            const sender = usersRef.current.find(u => u.id === newMsg.sender_id);
            setHasUnreadMessages(true);
            triggerNotification(newMsg.content, sender?.name || 'Compañero', false);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages' },
        (payload) => {
          const newMsg = payload.new as GroupMessage;
          if (newMsg.sender_id !== currentUser.id) {
            const sender = usersRef.current.find(u => u.id === newMsg.sender_id);
            setHasUnreadMessages(true);
            triggerNotification(newMsg.content, sender?.name || 'Compañero', true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const triggerNotification = (message: string, sender: string, isGroup: boolean) => {
    if (activeTab === 'chat') return;
    setNotification(null);
    setTimeout(() => {
      setNotification({ message, type: 'chat', sender, isGroup });
    }, 100);
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLogin = (username: string, password: string) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      setLoginError(null);
      setNotification({ message: `Bienvenido, ${user.name}`, type: 'success' });
    } else {
      setLoginError("Usuario o contraseña incorrectos.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('orders');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProvinceFilter('all');
    setCityFilter('all');
    setPaymentFilter('all');
    setServiceDateFilter('');
    setDateCondition('eq');
  };

  const handleCleanupChat = async () => {
    const confirmed = window.confirm("¿Borrar mensajes de chat con más de 20 días de antigüedad?");
    if (!confirmed) return;

    setIsAdminMenuOpen(false);
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
    const dateString = twentyDaysAgo.toISOString();

    try {
      const { error: privateError } = await supabase.from('chat_messages').delete().lt('created_at', dateString);
      const { error: groupError } = await supabase.from('group_messages').delete().lt('created_at', dateString);
      if (privateError || groupError) throw new Error("Error al limpiar mensajes");
      setNotification({ message: 'Chat optimizado: Mensajes antiguos eliminados', type: 'success' });
    } catch (err: any) {
      setNotification({ message: 'Error al limpiar chat', type: 'error' });
    }
  };

  const handleTransferLoads = async (sourceTruckId: string, destTruckId: string, sourceDate: string, targetDate: string) => {
    const ordersToTransfer = orders.filter(o => o.truckId === sourceTruckId && o.serviceDate === sourceDate && o.status === OrderStatus.SCHEDULED);
    if (ordersToTransfer.length === 0) return;

    setIsLoading(true);
    try {
      const ids = ordersToTransfer.map(o => o.id);
      const { error } = await supabase.from('orders').update({
        truck_id: destTruckId,
        service_date: targetDate,
        updated_at: new Date().toISOString()
      }).in('id', ids);

      if (error) throw error;

      setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, truckId: destTruckId, serviceDate: targetDate, updatedAt: new Date().toISOString() } : o));
      setNotification({ message: `Carga traspasada (${ids.length} pedidos)`, type: 'success' });
      setLoadsTruckId(destTruckId);
      setLoadsDate(targetDate);
    } catch (err: any) {
      setNotification({ message: 'Error al traspasar carga', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const availableProvinces = useMemo(() => {
    const provinces = orders.map(o => o.province).filter((p): p is string => !!p);
    return Array.from(new Set(provinces)).sort();
  }, [orders]);

  const availableCities = useMemo(() => {
    const filteredByProvince = provinceFilter === 'all' ? orders : orders.filter(o => o.province === provinceFilter);
    const cities = filteredByProvince.map(o => o.city).filter((c): c is string => !!c);
    return Array.from(new Set(cities)).sort();
  }, [orders, provinceFilter]);

  const filteredAndSortedOrders = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let result = orders.filter(o => {
      const matchesSearch = (o.id || '').toLowerCase().includes(term) || (o.city || '').toLowerCase().includes(term) || (o.address || '').toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesProvince = provinceFilter === 'all' || o.province === provinceFilter;
      const matchesCity = cityFilter === 'all' || o.city === cityFilter;
      
      const matchesServiceDate = !serviceDateFilter || (() => {
        if (dateCondition === 'eq') return o.serviceDate === serviceDateFilter;
        if (dateCondition === 'gt') return o.serviceDate > serviceDateFilter;
        if (dateCondition === 'lt') return o.serviceDate < serviceDateFilter;
        return true;
      })();

      let matchesPayment = paymentFilter === 'all' || (paymentFilter === 'zero' ? o.pendingPayment === 0 : o.pendingPayment > 0);
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
  }, [orders, searchTerm, statusFilter, provinceFilter, cityFilter, paymentFilter, serviceDateFilter, dateCondition, sortBy, sortDirection]);

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

  const handleUpdateStatus = async (id: string, newStatus: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o));
    }
  };

  const handleSaveOrder = async (updatedOrder: Order) => {
    const { error } = await supabase.from('orders').update({
      status: updatedOrder.status,
      service_date: updatedOrder.serviceDate,
      total_amount: updatedOrder.totalAmount,
      pending_payment: updatedOrder.pendingPayment,
      zip_code: updatedOrder.zipCode,
      city: updatedOrder.city,
      address: updatedOrder.address,
      notes: updatedOrder.notes,
      phone1: updatedOrder.phone1,
      phone2: updatedOrder.phone2,
      truck_id: updatedOrder.truckId,
      updated_at: new Date().toISOString()
    }).eq('id', updatedOrder.id);

    if (!error) {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...updatedOrder, updatedAt: new Date().toISOString() } : o));
      setIsModalOpen(false);
      setNotification({ message: 'Pedido actualizado correctamente', type: 'success' });
    }
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} error={loginError} />;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#5851FF] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter">DistriGestión <span className="text-[#5851FF]">v1.0</span></h1>
            </div>
            
            <div className="hidden md:flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl items-center">
              {[
                { id: 'orders', label: 'Pedidos' },
                { id: 'trucks', label: 'Flota' },
                { id: 'loads', label: 'Cargas' },
                { id: 'recent', label: 'Recientes' },
                { id: 'chat', label: 'Chat', hasBadge: hasUnreadMessages }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AppTab)}
                  className={`px-6 py-2 rounded-xl text-sm font-black transition-all relative ${activeTab === tab.id ? 'bg-white text-[#5851FF] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {tab.label}
                  {tab.hasBadge && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-slate-100 rounded-full animate-pulse" />
                  )}
                </button>
              ))}

              {isAdmin && (
                <div className="relative" ref={adminMenuRef}>
                  <button onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)} className={`px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'users' || isAdminMenuOpen ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}>
                    Administración
                    <svg className={`w-4 h-4 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isAdminMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-[110] animate-scaleIn origin-top-right">
                      <button onClick={() => { setActiveTab('users'); setIsAdminMenuOpen(false); }} className="w-full px-5 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        Gestión Usuarios
                      </button>
                      <div className="h-px bg-slate-100 my-1 mx-4" />
                      <button onClick={handleCleanupChat} className="w-full px-5 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Limpiar Chat (>20d)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[9px] font-black uppercase text-[#5851FF] tracking-[0.2em] mb-1">{currentUser.role}</span>
              <span className="text-sm font-black text-slate-700">{currentUser.name}</span>
            </div>
            <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all ml-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-8 py-10">
        {isLoading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
             <div className="w-12 h-12 border-4 border-slate-200 border-t-[#5851FF] rounded-full animate-spin"></div>
             <p className="font-black uppercase tracking-widest text-[10px]">Iniciando Sistema...</p>
          </div>
        ) : (
          <>
            {activeTab === 'orders' && (
              <>
                <DashboardStats stats={stats} />
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-8 animate-fadeIn">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
                    <div className="xl:col-span-3 relative group">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300 group-focus-within:text-[#5851FF] transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </span>
                      <input type="text" placeholder="Pedido, ciudad, calle..." className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-[#5851FF] transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="xl:col-span-3 flex gap-1">
                      <select value={dateCondition} onChange={(e) => setDateCondition(e.target.value as DateCondition)} className="w-[110px] px-2 py-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-[11px] font-black text-indigo-700 outline-none">
                        <option value="eq">Igual a</option>
                        <option value="gt">Mayor que</option>
                        <option value="lt">Menor que</option>
                      </select>
                      <input type="date" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none" value={serviceDateFilter} onChange={(e) => setServiceDateFilter(e.target.value)} />
                    </div>
                    <div className="xl:col-span-6 flex flex-wrap gap-2 justify-end">
                      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-[10px] font-black text-slate-600 outline-none min-w-[110px]">
                        <option value="all">ESTADOS</option>
                        {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                      </select>
                      <select value={provinceFilter} onChange={(e) => setProvinceFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-[10px] font-black text-slate-600 outline-none min-w-[110px]">
                        <option value="all">PROVINCIAS</option>
                        {availableProvinces.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                      </select>
                      <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)} className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3.5 text-[10px] font-black text-indigo-700 outline-none min-w-[110px]">
                        <option value="all">COBRO</option>
                        <option value="zero">PAGADOS</option>
                        <option value="debt">DEUDA</option>
                      </select>
                      <button onClick={clearFilters} className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Limpiar</button>
                    </div>
                  </div>
                </div>
                <OrderTable orders={filteredAndSortedOrders} onUpdateStatus={handleUpdateStatus} onDeleteOrder={() => {}} onSelectOrder={(o) => { setSelectedOrder(o); setIsModalOpen(true); }} />
              </>
            )}

            {activeTab === 'trucks' && (
              <TruckManager trucks={trucks} orders={orders} onAddTruck={() => {}} onDeleteTruck={() => {}} onNavigateToLoads={(tid, d) => { setLoadsTruckId(tid); setLoadsDate(d); setActiveTab('loads'); }} />
            )}

            {activeTab === 'loads' && (
              <LoadsView 
                orders={orders} 
                trucks={trucks} 
                onSelectOrder={(o) => { setSelectedOrder(o); setIsModalOpen(true); }} 
                selectedTruckId={loadsTruckId} 
                selectedDate={loadsDate} 
                onFilterChange={(tId, d) => { setLoadsTruckId(tId); setLoadsDate(d); }} 
                onTransferLoads={handleTransferLoads} 
                onAddOrder={handleAddOrder}
              />
            )}

            {activeTab === 'recent' && (
              <RecentEditsView orders={orders} onSelectOrder={(o) => { setSelectedOrder(o); setIsModalOpen(true); }} />
            )}

            {activeTab === 'chat' && <ChatInterface currentUser={currentUser} users={users} />}

            {activeTab === 'users' && isAdmin && (
              <UserManager users={users} onAddUser={() => {}} onDeleteUser={() => {}} />
            )}
          </>
        )}
      </main>

      <OrderEditModal isOpen={isModalOpen} order={selectedOrder} trucks={trucks} onClose={() => setIsModalOpen(false)} onSave={handleSaveOrder} />

      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.8rem] shadow-2xl border flex flex-col gap-1 animate-slideDown z-[999] w-full max-w-[420px] backdrop-blur-md ${
          notification.type === 'error' ? 'bg-rose-600/95 border-rose-400 text-white' : 'bg-slate-900/95 border-slate-700 text-white shadow-indigo-500/20'
        }`}>
          {notification.type === 'chat' ? (
            <>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 shrink-0 ${notification.isGroup ? 'bg-emerald-500' : 'bg-[#5851FF]'} rounded-xl flex items-center justify-center text-xs font-black uppercase shadow-lg shadow-black/20`}>
                  {notification.sender?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${notification.isGroup ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {notification.isGroup ? 'Sala General' : 'Mensaje Privado'}
                  </p>
                  <p className="text-[16px] font-black leading-none truncate">{notification.isGroup ? `Nuevo en ${notification.sender}` : `Mensaje de ${notification.sender}`}</p>
                </div>
                <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors ml-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <p className="text-sm text-slate-300 font-medium line-clamp-2 mt-2.5 leading-relaxed px-1 italic bg-white/5 p-2 rounded-xl border border-white/5">"{notification.message}"</p>
              <div className="flex gap-2 mt-3.5">
                <button onClick={() => { setActiveTab('chat'); setNotification(null); }} className="flex-1 py-3 bg-[#5851FF] hover:bg-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-center transition-all shadow-lg active:scale-95">Responder Ahora</button>
                <button onClick={() => setNotification(null)} className="px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-center transition-all">Cerrar</button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4 py-1">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${notification.type === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-white'}`} />
              <span className="text-xs font-black uppercase tracking-widest flex-1">{notification.message}</span>
              <button onClick={() => setNotification(null)} className="opacity-50 hover:opacity-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
