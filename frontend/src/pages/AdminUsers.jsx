import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Search, Loader, User, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';

const AdminUsers = ({ showToast }) => {
  const { apiFetch, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingEmails, setUpdatingEmails] = useState({}); // email -> boolean (saving state)

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/admin/users');
      setUsers(data);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (email, newRole) => {
    setUpdatingEmails(prev => ({ ...prev, [email]: true }));
    try {
      await apiFetch(`/api/admin/users/${email}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      showToast(`Rol de ${email} actualizado a ${newRole.toUpperCase()} correctamente.`, 'success');
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => u.email === email ? { ...u, role: newRole } : u)
      );
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setUpdatingEmails(prev => ({ ...prev, [email]: false }));
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-650/15 border-red-500/30 text-red-400';
      case 'master':
        return 'bg-purple-600/15 border-purple-500/30 text-purple-400';
      case 'manager':
        return 'bg-blue-600/15 border-blue-500/30 text-blue-400';
      default:
        return 'bg-gray-800/60 border-gray-700/60 text-gray-400';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Nunca';
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Shield className="text-red-505 w-8 h-8" />
            Panel de Administración
          </h1>
          <p className="text-gray-400 text-sm">Gestiona los usuarios de la plataforma MotoGP Manager y asigna roles globales.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-red-500 focus:outline-none text-white text-xs transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader className="w-10 h-10 text-red-500 animate-spin" />
          <p className="text-gray-400">Cargando usuarios de la plataforma...</p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-gray-800 bg-gradient-to-r from-red-600/10 via-transparent to-transparent flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-505" />
              <h3 className="font-bold text-white text-base">Usuarios Registrados ({users.length})</h3>
            </div>
            <span className="text-xs text-gray-400 font-medium">Auto-guardado habilitado</span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-16 text-center text-gray-500 space-y-3">
              <User className="w-12 h-12 text-gray-700 mx-auto" />
              <h4 className="text-white font-bold">No se encontraron usuarios</h4>
              <p className="text-xs max-w-xs mx-auto">Prueba a refinar tu búsqueda o verifica los filtros introducidos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#161622]/60 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="p-4 pl-6">Usuario</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Creado el</th>
                    <th className="p-4">Última Conexión</th>
                    <th className="p-4 text-center">Rol Global</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-855/60">
                  {filteredUsers.map((userItem) => {
                    const isSelf = userItem.email.toLowerCase() === currentUser.email.toLowerCase();
                    const isSaving = updatingEmails[userItem.email];

                    return (
                      <tr 
                        key={userItem.email} 
                        className={`transition-colors hover:bg-[#16161C]/30 ${
                          isSelf ? 'bg-red-955/5' : ''
                        }`}
                      >
                        {/* Usuario */}
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-750 flex items-center justify-center text-xs font-extrabold text-gray-300 select-none">
                              {userItem.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {userItem.username}
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 bg-red-650/15 border border-red-500/20 text-[9px] rounded text-red-500 font-bold uppercase tracking-wider">
                                    Tú
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="p-4 font-mono text-gray-400 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-gray-600" />
                            {userItem.email}
                          </div>
                        </td>

                        {/* Creado el */}
                        <td className="p-4 text-gray-400 text-xs">
                          {formatDate(userItem.created_at)}
                        </td>

                        {/* Última Conexión */}
                        <td className="p-4 text-gray-400 text-xs">
                          {formatDate(userItem.last_login)}
                        </td>

                        {/* Rol Global */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isSaving ? (
                              <Loader className="w-4 h-4 text-red-500 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                            
                            <select
                              value={userItem.role}
                              disabled={isSelf || isSaving}
                              onChange={(e) => handleRoleChange(userItem.email, e.target.value)}
                              className={`px-3 py-1.5 border rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none bg-[#0F0F12] select-none cursor-pointer transition-all ${getRoleBadgeClass(userItem.role)} ${
                                isSelf ? 'opacity-70 cursor-not-allowed border-dashed' : ''
                              }`}
                            >
                              <option value="player" className="bg-[#0F0F12] text-gray-300">Player</option>
                              <option value="manager" className="bg-[#0F0F12] text-blue-400 font-bold">Manager</option>
                              <option value="master" className="bg-[#0F0F12] text-purple-400 font-bold">Master</option>
                              <option value="admin" className="bg-[#0F0F12] text-red-400 font-bold">Admin</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
