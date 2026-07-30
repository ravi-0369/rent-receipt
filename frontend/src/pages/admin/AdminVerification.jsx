import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight,
  ClipboardList, Clock, ShieldCheck, AlertTriangle, RefreshCw,
  CheckSquare, Square, Zap, Eye, X, ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../../api/axios';
import ReviewModal from '../../components/ui/ReviewModal';

/* ─── small helpers ─────────────────────────────────── */
const STATUS_TABS = [
  { key: 'All',      label: 'All',      color: 'text-slate-400'  },
  { key: 'Pending',  label: 'Pending',  color: 'text-yellow-400' },
  { key: 'Verified', label: 'Verified', color: 'text-green-400'  },
  { key: 'Rejected', label: 'Rejected', color: 'text-red-400'    },
];

const STATUS_STYLES = {
  Pending:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Verified: 'bg-green-500/15  text-green-400  border-green-500/30',
  Rejected: 'bg-red-500/15    text-red-400    border-red-500/30',
};

const StatCard = ({ icon: Icon, label, value, color, sub }) => {
  const colorMap = {
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-400',
    green:  'from-green-500/20  to-green-600/10  border-green-500/20  text-green-400',
    red:    'from-red-500/20    to-red-600/10    border-red-500/20    text-red-400',
    blue:   'from-blue-500/20   to-blue-600/10   border-blue-500/20   text-blue-400',
  };
  return (
    <div className={`glass-card p-5 bg-gradient-to-br ${colorMap[color]} border`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
          {sub && <p className="text-xs opacity-50 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

/* ─── Bulk reject modal ──────────────────────────────── */
const BulkRejectModal = ({ count, onCancel, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <div className="glass-dark border border-red-500/30 rounded-2xl w-full max-w-md p-6 animate-enter">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <XCircle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-bold">Bulk Reject {count} Document{count !== 1 ? 's' : ''}</h3>
            <p className="text-xs opacity-50">All selected will be marked as Rejected</p>
          </div>
        </div>
        <label className="input-label">Reason for rejection *</label>
        <textarea
          id="bulk-reject-reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Documents are unclear or do not meet verification requirements."
          className="input-field resize-none text-sm mt-1"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm transition-colors disabled:opacity-40">
            Cancel
          </button>
          <button
            id="confirm-bulk-reject"
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all disabled:opacity-40"
          >
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <XCircle size={15} />}
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main component ─────────────────────────────────── */
const AdminVerification = () => {
  const [receipts, setReceipts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [counts, setCounts]           = useState({ All: 0, Pending: 0, Verified: 0, Rejected: 0 });
  const [verifiedToday, setVerifiedToday] = useState(0);
  const [activeTab, setActiveTab]     = useState('Pending');
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState(new Set());
  const [reviewReceipt, setReviewReceipt] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkReject, setShowBulkReject] = useState(false);
  const searchTimer = useRef(null);

  const fetchQueue = useCallback(async (p = 1, tab = activeTab, q = search) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (tab !== 'All') params.status = tab;
      if (q.trim()) params.search = q.trim();
      const { data } = await API.get('/admin/verify', { params });
      setReceipts(data.receipts);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setCounts(data.counts);
      setVerifiedToday(data.verifiedToday);
      setSelected(new Set());
    } catch {
      toast.error('Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    setPage(1);
    fetchQueue(1, activeTab, search);
  }, [activeTab]);

  // debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchQueue(1, activeTab, search);
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelected(new Set());
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchQueue(newPage, activeTab, search);
  };

  /* ── selection helpers ── */
  const pendingIds = receipts.filter(r => r.status === 'Pending').map(r => r._id);
  const allPendingSelected = pendingIds.length > 0 && pendingIds.every(id => selected.has(id));

  const toggleAll = () => {
    if (allPendingSelected) {
      setSelected(prev => { const s = new Set(prev); pendingIds.forEach(id => s.delete(id)); return s; });
    } else {
      setSelected(prev => { const s = new Set(prev); pendingIds.forEach(id => s.add(id)); return s; });
    }
  };

  const toggleOne = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  /* ── bulk approve ── */
  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const { data } = await API.put('/admin/verify/bulk', {
        ids: [...selected],
        status: 'Verified',
      });
      toast.success(data.message);
      fetchQueue(page, activeTab, search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk approve failed');
    } finally {
      setBulkLoading(false);
    }
  };

  /* ── bulk reject ── */
  const handleBulkReject = async (reason) => {
    setBulkLoading(true);
    try {
      const { data } = await API.put('/admin/verify/bulk', {
        ids: [...selected],
        status: 'Rejected',
        adminReply: reason,
      });
      toast.success(data.message);
      setShowBulkReject(false);
      fetchQueue(page, activeTab, search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk reject failed');
    } finally {
      setBulkLoading(false);
    }
  };

  /* ── after individual review modal ── */
  const handleReviewed = (updated) => {
    setReceipts(prev => prev.map(r => r._id === updated._id ? updated : r));
    setCounts(prev => {
      const old = receipts.find(r => r._id === updated._id);
      if (!old || old.status === updated.status) return prev;
      const next = { ...prev };
      next[old.status] = Math.max(0, next[old.status] - 1);
      next[updated.status] = (next[updated.status] || 0) + 1;
      return next;
    });
  };

  const selectedArr = [...selected];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck size={24} className="text-primary-400" />
            Document Verification
          </h1>
          <p className="opacity-60 text-sm mt-1">Review, approve, or reject uploaded rent documents</p>
        </div>
        <button
          id="refresh-queue-btn"
          onClick={() => fetchQueue(page, activeTab, search)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors border border-white/10 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock}        label="Pending Review"  value={counts.Pending}   color="yellow" sub="awaiting action" />
        <StatCard icon={CheckCircle}  label="Verified Today"  value={verifiedToday}    color="green"  sub="approved today" />
        <StatCard icon={XCircle}      label="Total Rejected"  value={counts.Rejected}  color="red"    sub="all time" />
        <StatCard icon={ClipboardList} label="Total Docs"     value={counts.All}       color="blue"   sub="across all users" />
      </div>

      {/* Tab filter + search */}
      <div className="glass-card p-4 space-y-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              id={`tab-${tab.key.toLowerCase()}`}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${activeTab === tab.key
                  ? 'bg-primary-600/30 text-primary-300 shadow-sm'
                  : 'hover:bg-white/5 opacity-60 hover:opacity-100'
                }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                ${activeTab === tab.key ? 'bg-primary-600/40 text-primary-200' : 'bg-white/10'}`}>
                {tab.key === 'All' ? counts.All : counts[tab.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            id="verify-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tenant, landlord, flat number..."
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Floating batch action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-enter">
          <div className="glass-dark border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Zap size={16} className="text-primary-400" />
              <span>{selected.size} selected</span>
            </div>
            <div className="w-px h-5 bg-white/20" />
            <div className="flex items-center gap-2">
              <button
                id="bulk-approve-btn"
                onClick={handleBulkApprove}
                disabled={bulkLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-all disabled:opacity-40"
              >
                {bulkLoading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Approve All
              </button>
              <button
                id="bulk-reject-btn"
                onClick={() => setShowBulkReject(true)}
                disabled={bulkLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-40"
              >
                <XCircle size={14} />
                Reject All
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors text-sm"
                title="Clear selection"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-20 opacity-40 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <FileText size={32} />
            </div>
            <p className="font-medium">No documents found</p>
            <p className="text-sm">Try a different status tab or search term</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      {/* Select-all (only for pending) */}
                      {activeTab === 'Pending' || activeTab === 'All' ? (
                        <button
                          id="select-all-pending"
                          onClick={toggleAll}
                          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                          title={allPendingSelected ? 'Deselect all' : 'Select all pending'}
                        >
                          {allPendingSelected
                            ? <CheckSquare size={16} className="text-primary-400" />
                            : <Square size={16} className="opacity-40" />
                          }
                        </button>
                      ) : null}
                    </th>
                    <th>Document</th>
                    <th>User</th>
                    <th>Period</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r, i) => {
                    const isPending = r.status === 'Pending';
                    const isSelected = selected.has(r._id);
                    return (
                      <tr
                        key={r._id}
                        className={`animate-enter transition-colors ${isSelected ? 'bg-primary-600/10' : ''}`}
                        style={{ animationDelay: `${i * 20}ms` }}
                      >
                        {/* Checkbox */}
                        <td>
                          {isPending && (
                            <button
                              id={`select-${r._id}`}
                              onClick={() => toggleOne(r._id)}
                              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                              {isSelected
                                ? <CheckSquare size={16} className="text-primary-400" />
                                : <Square size={16} className="opacity-40" />
                              }
                            </button>
                          )}
                        </td>
                        {/* Document info */}
                        <td>
                          <p className="font-semibold text-sm">{r.tenantName}</p>
                          <p className="text-xs opacity-50">{r.flatNumber} · {r.landlordName}</p>
                        </td>
                        {/* User */}
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {r.userId?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium leading-tight">{r.userId?.name || '—'}</p>
                              <p className="text-xs opacity-40 truncate max-w-28">{r.userId?.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Period */}
                        <td className="font-medium text-sm">{r.month} {r.year}</td>
                        {/* Amount */}
                        <td><span className="text-green-400 font-bold">₹{r.amount?.toLocaleString('en-IN')}</span></td>
                        {/* Payment */}
                        <td>
                          <span className={`badge ${
                            r.paymentMethod === 'UPI' ? 'badge-info'
                            : r.paymentMethod === 'Cash' ? 'badge-success'
                            : r.paymentMethod === 'Card' ? 'badge-warning'
                            : 'badge-purple'
                          }`}>{r.paymentMethod}</span>
                        </td>
                        {/* Date */}
                        <td className="text-xs opacity-50">{format(new Date(r.createdAt), 'dd MMM yyyy')}</td>
                        {/* Status */}
                        <td>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[r.status]}`}>
                            {r.status === 'Pending' && <Clock size={10} />}
                            {r.status === 'Verified' && <CheckCircle size={10} />}
                            {r.status === 'Rejected' && <XCircle size={10} />}
                            {r.status}
                          </span>
                          {r.status === 'Pending' && (
                            <span className="ml-1 inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                          )}
                        </td>
                        {/* Actions */}
                        <td>
                          <button
                            id={`review-btn-${r._id}`}
                            onClick={() => setReviewReceipt(r)}
                            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600/15 hover:bg-primary-600/30 text-primary-400 transition-all text-xs font-semibold group"
                          >
                            <Eye size={13} />
                            Review
                            {isPending && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-sm">
                <p className="opacity-50 text-xs">{total} document{total !== 1 ? 's' : ''} total</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="pagination-btn disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="opacity-60 px-2">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="pagination-btn disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review modal */}
      {reviewReceipt && (
        <ReviewModal
          receipt={reviewReceipt}
          onClose={() => setReviewReceipt(null)}
          onReviewed={(updated) => {
            handleReviewed(updated);
            setReviewReceipt(null);
          }}
        />
      )}

      {/* Bulk reject modal */}
      {showBulkReject && (
        <BulkRejectModal
          count={selected.size}
          loading={bulkLoading}
          onCancel={() => setShowBulkReject(false)}
          onConfirm={handleBulkReject}
        />
      )}
    </div>
  );
};

export default AdminVerification;
