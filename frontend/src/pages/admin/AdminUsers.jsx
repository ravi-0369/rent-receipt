import { useState, useEffect, useCallback } from 'react';
import { Search, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../../api/axios';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <p className="opacity-60 text-sm mt-1">{total} registered user{total !== 1 ? 's' : ''}</p>
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
                      <td className="font-medium">{u.receiptCount}</td>
                      <td className="text-green-400 font-semibold">₹{u.totalAmount?.toLocaleString('en-IN')}</td>
                      <td className="opacity-60 text-xs">{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => toggleStatus(u._id, u.isActive, u.name)}
                            className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-green-500/20 text-green-400'}`}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                        )}
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
                  </div>
                  <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Off'}</span>
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
