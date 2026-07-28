import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../../api/axios';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card'];

const AdminReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: '', month: '', paymentMethod: '' });

  const fetchReceipts = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await API.get('/admin/receipts', { params });
      setReceipts(data.receipts);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { setPage(1); fetchReceipts(1); }, [filters]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete receipt for ${name}? This cannot be undone.`)) return;
    try {
      await API.delete(`/admin/receipts/${id}`);
      toast.success('Receipt deleted');
      fetchReceipts(page);
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">All Receipts</h1>
        <p className="opacity-60 text-sm mt-1">{total} total receipt{total !== 1 ? 's' : ''} across all users</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            id="search-admin-receipts"
            type="text"
            value={filters.search}
            onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
            className="input-field pl-9"
            placeholder="Search tenant, landlord, flat..."
          />
        </div>
        <select value={filters.month} onChange={e => setFilters(p => ({ ...p, month: e.target.value }))} className="input-field w-auto">
          <option value="">All months</option>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filters.paymentMethod} onChange={e => setFilters(p => ({ ...p, paymentMethod: e.target.value }))} className="input-field w-auto">
          <option value="">All methods</option>
          {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-16 opacity-40">
            <FileText size={40} className="mx-auto mb-2" />
            <p>No receipts found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>User</th>
                    <th>Month/Year</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Upload Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r, i) => (
                    <tr key={r._id} className="animate-enter" style={{ animationDelay: `${i * 25}ms` }}>
                      <td>
                        <p className="font-medium text-sm">{r.tenantName}</p>
                        <p className="text-xs opacity-50">{r.flatNumber}</p>
                      </td>
                      <td>
                        <p className="text-sm">{r.userId?.name || '—'}</p>
                        <p className="text-xs opacity-40 truncate max-w-32">{r.userId?.email}</p>
                      </td>
                      <td><span className="font-medium">{r.month} {r.year}</span></td>
                      <td><span className="text-green-400 font-semibold">₹{r.amount?.toLocaleString('en-IN')}</span></td>
                      <td><span className={`badge ${r.paymentMethod === 'UPI' ? 'badge-info' : r.paymentMethod === 'Cash' ? 'badge-success' : 'badge-purple'}`}>{r.paymentMethod}</span></td>
                      <td className="opacity-60 text-xs">{format(new Date(r.createdAt), 'dd MMM yyyy')}</td>
                      <td><span className={`badge ${r.status === 'Verified' ? 'badge-success' : r.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{r.status}</span></td>
                      <td>
                        <button
                          onClick={() => handleDelete(r._id, r.tenantName)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Delete receipt"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
                <button onClick={() => { setPage(p => p-1); fetchReceipts(page-1); }} disabled={page <= 1} className="pagination-btn disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="text-sm opacity-60">Page {page} of {totalPages}</span>
                <button onClick={() => { setPage(p => p+1); fetchReceipts(page+1); }} disabled={page >= totalPages} className="pagination-btn disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReceipts;
