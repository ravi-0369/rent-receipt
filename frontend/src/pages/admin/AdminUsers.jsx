import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCheck, UserX, ChevronLeft, ChevronRight, Clock, ShieldCheck, ShieldOff, Download, FileText, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../../api/axios';

const formatLastLogin = (lastLogin) => {
  if (!lastLogin) return null;
  const date = new Date(lastLogin);
  const distance = formatDistanceToNow(date, { addSuffix: true });
  return { label: distance, full: format(date, 'dd MMM yyyy, hh:mm a') };
};

const exportCSV = (users) => {
  const headers = ['Name', 'Email', 'Role', 'Status', 'Receipts', 'Total Paid (₹)', 'Joined', 'Last Login'];
  const rows = users.map(u => [
    u.name,
    u.email,
    u.role,
    u.isActive ? 'Active' : 'Inactive',
    u.receiptCount,
    u.totalAmount,
    format(new Date(u.createdAt), 'dd MMM yyyy'),
    u.lastLogin ? format(new Date(u.lastLogin), 'dd MMM yyyy hh:mm a') : 'Never'
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleChanging, setRoleChanging] = useState(null);
  const navigate = useNavigate();

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (search) params.search = search;
      const { data } = await API.get('/admin/users', { params });
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const toggleStatus = async (userId, currentStatus, name) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${name}?`)) return;
    try {
      await API.put(`/admin/users/${userId}/toggle-status`);
      toast.success(`User ${action}d`);
      fetchUsers(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const changeRole = async (userId, currentRole, name) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'promote to Admin' : 'demote to User';
    if (!window.confirm(`Are you sure you want to ${action} ${name}?`)) return;
    setRoleChanging(userId);
    try {
      await API.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`${name} is now a ${newRole}`);
      fetchUsers(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Role change failed');
    } finally {
      setRoleChanging(null);
    }
  };

  const deleteUser = async (userId, name) => {
    if (!window.confirm(`⚠️ Permanently delete "${name}" and ALL their receipts? This cannot be undone.`)) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      toast.success(`${name} has been deleted`);
      fetchUsers(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const viewUserReceipts = (userId) => {
    navigate(`/admin/receipts?userId=${userId}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <p className="opacity-60 text-sm mt-1">{total} registered user{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          id="export-users-csv"
          onClick={() => exportCSV(users)}
          disabled={users.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 transition-colors text-sm font-medium disabled:opacity-30"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            id="search-users"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
            placeholder="Search by name or email..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 opacity-40">
            <p>No users found</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Receipts</th>
                    <th>Total Paid</th>
                    <th>Joined</th>
                    <th>Last Login</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id} className="animate-enter" style={{ animationDelay: `${i * 30}ms` }}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.name}</p>
                            <p className="text-xs opacity-50">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-info'}`}>{u.role}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => viewUserReceipts(u._id)}
                          className="flex items-center gap-1 font-medium text-primary-400 hover:text-primary-300 transition-colors"
                          title="View this user's receipts"
                        >
                          <FileText size={13} />
                          {u.receiptCount}
                        </button>
                      </td>
                      <td className="text-green-400 font-semibold">₹{u.totalAmount?.toLocaleString('en-IN')}</td>
                      <td className="opacity-60 text-xs">{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                      <td>
                        {(() => {
                          const ll = formatLastLogin(u.lastLogin);
                          return ll ? (
                            <div className="flex items-center gap-1.5" title={ll.full}>
                              <Clock size={12} className="text-green-400 flex-shrink-0" />
                              <span className="text-xs text-green-400">{ll.label}</span>
                            </div>
                          ) : (
                            <span className="text-xs opacity-30 italic">Never</span>
                          );
                        })()}
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {/* Change role button */}
                          {u._id !== u.selfId && (
                            <button
                              id={`role-btn-${u._id}`}
                              onClick={() => changeRole(u._id, u.role, u.name)}
                              disabled={roleChanging === u._id}
                              className={`p-1.5 rounded-lg transition-colors ${u.role === 'admin' ? 'hover:bg-orange-500/20 text-orange-400' : 'hover:bg-purple-500/20 text-purple-400'}`}
                              title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                            >
                              {roleChanging === u._id
                                ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                                : u.role === 'admin' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />
                              }
                            </button>
                          )}
                          {/* Toggle active */}
                          {u.role !== 'admin' && (
                            <button
                              id={`status-btn-${u._id}`}
                              onClick={() => toggleStatus(u._id, u.isActive, u.name)}
                              className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-orange-500/20 text-orange-400' : 'hover:bg-green-500/20 text-green-400'}`}
                              title={u.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                            </button>
                          )}
                          {/* Delete user */}
                          {u.role !== 'admin' && (
                            <button
                              id={`delete-user-${u._id}`}
                              onClick={() => deleteUser(u._id, u.name)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors"
                              title="Delete user permanently"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden p-3 space-y-3">
              {users.map(u => (
                <div key={u._id} className="glass rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {u.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    <p className="text-xs opacity-50">{u.receiptCount} receipts · ₹{u.totalAmount?.toLocaleString('en-IN')}</p>
                    <p className="text-xs mt-0.5">
                      {u.lastLogin ? (
                        <span className="text-green-400">Last login: {formatDistanceToNow(new Date(u.lastLogin), { addSuffix: true })}</span>
                      ) : (
                        <span className="opacity-30 italic">Never logged in</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Off'}</span>
                    <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-info'}`}>{u.role}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
                <button onClick={() => { setPage(p => p-1); fetchUsers(page-1); }} disabled={page <= 1} className="pagination-btn disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="text-sm opacity-60">Page {page} of {totalPages}</span>
                <button onClick={() => { setPage(p => p+1); fetchUsers(page+1); }} disabled={page >= totalPages} className="pagination-btn disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
