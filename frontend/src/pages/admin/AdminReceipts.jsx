import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Trash2, FileText, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../../api/axios';
import ReviewModal from '../../components/ui/ReviewModal';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card'];
const STATUSES = ['Pending', 'Verified', 'Rejected'];

const STATUS_STYLES = {
  Verified: 'badge-success',
  Rejected: 'badge-danger',
  Pending: 'badge-warning'
};

const exportCSV = (receipts) => {
  const headers = ['User', 'Month', 'Year', 'Amount (₹)', 'Method', 'Status', 'Upload Date'];
  const rows = receipts.map(r => [
    r.userId?.name || '', r.month, r.year,
    r.amount, r.paymentMethod, r.status,
    format(new Date(r.createdAt), 'dd MMM yyyy')
  ]);
  const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipts_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminReceipts = () => {
  const [searchParams] = useSearchParams();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [reviewReceipt, setReviewReceipt] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    month: '',
    paymentMethod: '',
    userId: searchParams.get('userId') || ''
  });

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

  const handleStatusChange = async (receiptId, newStatus) => {
    setUpdatingStatus(receiptId);
    try {
      await API.put(`/admin/receipts/${receiptId}/status`, { status: newStatus });
      toast.success(`Status → ${newStatus}`);
      setReceipts(prev => prev.map(r => r._id === receiptId ? { ...r, status: newStatus } : r));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleReviewed = (updatedReceipt) => {
    setReceipts(prev => prev.map(r => r._id === updatedReceipt._id ? updatedReceipt : r));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">All Receipts</h1>
          <p className="opacity-60 text-sm mt-1">
            {total} total receipt{total !== 1 ? 's' : ''} across all users
            {filters.userId && <span className="ml-2 text-primary-400 font-medium">(filtered by user)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filters.userId && (
            <button
              onClick={() => setFilters(p => ({ ...p, userId: '' }))}
              className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-colors"
            >
              Clear Filter
            </button>
          )}
          <button
            id="export-receipts-csv"
            onClick={() => exportCSV(receipts)}
            disabled={receipts.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 transition-colors text-sm font-medium disabled:opacity-30"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
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
            placeholder="Search by user name or email..."
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
                        <p className="font-medium text-sm">{r.userId?.name || '—'}</p>
                        <p className="text-xs opacity-50">Receipt #{r._id?.slice(-6).toUpperCase()}</p>
                      </td>
                      <td>
                        <p className="text-sm">{r.userId?.name || '—'}</p>
                        <p className="text-xs opacity-40 truncate max-w-32">{r.userId?.email}</p>
                      </td>
                      <td><span className="font-medium">{r.month} {r.year}</span></td>
                      <td><span className="text-green-400 font-semibold">₹{r.amount?.toLocaleString('en-IN')}</span></td>
                      <td><span className={`badge ${r.paymentMethod === 'UPI' ? 'badge-info' : r.paymentMethod === 'Cash' ? 'badge-success' : 'badge-purple'}`}>{r.paymentMethod}</span></td>
                      <td className="opacity-60 text-xs">{format(new Date(r.createdAt), 'dd MMM yyyy')}</td>
                      <td>
                        {/* Inline status dropdown */}
                        <div className="relative">
                          <select
                            id={`status-select-${r._id}`}
                            value={r.status}
                            disabled={updatingStatus === r._id}
                            onChange={e => handleStatusChange(r._id, e.target.value)}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer transition-all
                              ${r.status === 'Verified' ? 'bg-green-500/20 text-green-400' : r.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}
                              ${updatingStatus === r._id ? 'opacity-50' : 'hover:opacity-80'}`}
                          >
                            {STATUSES.map(s => <option key={s} value={s} className="bg-gray-900 text-white">{s}</option>)}
                          </select>
                          {updatingStatus === r._id && (
                            <span className="absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {/* Review button */}
                          <button
                            id={`review-btn-${r._id}`}
                            onClick={() => setReviewReceipt(r)}
                            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary-600/15 hover:bg-primary-600/30 text-primary-400 transition-colors text-xs font-medium"
                            title="Review document"
                          >
                            <Eye size={13} />
                            Review
                            {r.status === 'Pending' && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                            )}
                          </button>
                          {/* Delete */}
                          <button
                            id={`delete-receipt-${r._id}`}
                            onClick={() => handleDelete(r._id, r.tenantName)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete receipt"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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

      {/* Review Modal */}
      {reviewReceipt && (
        <ReviewModal
          receipt={reviewReceipt}
          onClose={() => setReviewReceipt(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
};

export default AdminReceipts;
