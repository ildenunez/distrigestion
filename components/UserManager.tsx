
import React, { useState } from 'react';
import { AppUser, UserRole } from '../types';

interface UserManagerProps {
  users: AppUser[];
  onAddUser: (user: Omit<AppUser, 'id'>) => void;
  onDeleteUser: (id: string) => void;
}

const UserManager: React.FC<UserManagerProps> = ({ users, onAddUser, onDeleteUser }) => {
  const [newUser, setNewUser] = useState({ username: '', name: '', role: UserRole.OPERADOR, password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.name || !newUser.password) return;
    onAddUser(newUser);
    setNewUser({ username: '', name: '', role: UserRole.OPERADOR, password: '' });
  };

  const getRoleStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return "bg-slate-900 text-white";
      case UserRole.SUPERVISOR: return "bg-indigo-100 text-indigo-700";
      case UserRole.OPERADOR: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-[#5851FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          Nuevo Usuario del Sistema
        </h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nombre Completo</label>
            <input 
              type="text" 
              placeholder="John Smith" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#5851FF]"
              value={newUser.name}
              onChange={e => setNewUser({...newUser, name: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Usuario (Login)</label>
            <input 
              type="text" 
              placeholder="jsmith" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#5851FF]"
              value={newUser.username}
              onChange={e => setNewUser({...newUser, username: e.target.value.toLowerCase()})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#5851FF]"
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rol</label>
            <select 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#5851FF]"
              value={newUser.role}
              onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
            >
              <option value={UserRole.OPERADOR}>Operador</option>
              <option value={UserRole.SUPERVISOR}>Supervisor</option>
              <option value={UserRole.ADMIN}>Administrador</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full py-3 bg-[#5851FF] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4a44d4] transition-all shadow-lg shadow-indigo-100">
              Crear Usuario
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-8 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest">Nombre</th>
              <th className="px-8 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest">ID Acceso</th>
              <th className="px-8 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest text-center">Rol</th>
              <th className="px-8 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="font-bold text-slate-800">{user.name}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="font-mono text-xs text-indigo-500 font-bold">@{user.username}</div>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getRoleStyle(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  {user.role !== UserRole.ADMIN && (
                    <button 
                      onClick={() => onDeleteUser(user.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManager;
