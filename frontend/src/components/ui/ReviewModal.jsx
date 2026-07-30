import { useState, useEffect } from 'react';
import {
  X, CheckCircle, XCircle, FileText, User, Home, Calendar,
  IndianRupee, CreditCard, Loader, ExternalLink, ZoomIn, ZoomOut,
  Clock, ShieldCheck, AlertTriangle, RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../../api/axios';

/* ── Tiny detail row ──────────────────────────────── */
const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5 py-2 border-b border-white/5 last:border-0">
    <div className="w-7 h-7 rounded-lg bg-primary-600/15 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={13} className="text-primary-400" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider opacity-40 mb-0.5">{label}</p>
      <p className="font-semibold text-sm">{value || '—'}</p>
    </div>
  </div>
);

/* ── Status colours ───────────────────────────────── */
const STATUS_STYLE = {
  Pending:  { badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: Clock },
  Verified: { badge: 'text-green-400  bg-green-500/10  border-green-500/30',  icon: CheckCircle },
  Rejected: { badge: 'text-red-400    bg-red-500/10    border-red-500/30',    icon: XCircle },
};

/* ── Review timeline entry ────────────────────────── */
const TimelineEntry = ({ receipt }) => {
  if (!receipt.reviewedAt) return null;
  const style = STATUS_STYLE[receipt.status];
  const Icon  = style?.icon || ShieldCheck;
  return (
    <div className="flex items-start gap-3 pt-3 border-t border-white/5">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${style?.badge}`}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold">
          {receipt.status === 'Verified' ? 'Document Accepted' : 'Document Rejected'}
          {receipt.reviewedBy?.name && (
            <span className="opacity-50 font-normal"> · by {receipt.reviewedBy.name}</span>
          )}
        </p>
        {receipt.adminReply && (
          <p className="text-xs opacity-60 mt-0.5 italic">"{receipt.adminReply}"</p>
        )}
        <p className="text-[10px] opacity-40 mt-1">
          {format(new Date(receipt.reviewedAt), 'dd MMM yyyy, hh:mm a')}
        </p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────── */
/*  Main ReviewModal                                    */
/* ─────────────────────────────────────────────────── */
const ReviewModal = ({ receipt: initialReceipt, onClose, onReviewed }) => {
  const [receipt, setReceipt]     = useState(initialReceipt);
  const [action, setAction]       = useState(null);   // 'accept' | 'reject'
  const [reply, setReply]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const [zoomed, setZoomed]       = useState(false);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Reset action when receipt changes
  useEffect(() => {
    setReceipt(initialReceipt);
    setAction(null);
    setReply('');
    setImgError(false);
    setZoomed(false);
  }, [initialReceipt]);

  const isPDF = receipt.receiptFile?.mimetype === 'application/pdf';
  const style = STATUS_STYLE[receipt.status] || STATUS_STYLE.Pending;

  const handleSubmit = async () => {
    if (action === 'reject' && !reply.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setSubmitting(true);
    try {
      const status = action === 'accept' ? 'Verified' : 'Rejected';
      const { data } = await API.put(`/admin/receipts/${receipt._id}/status`, {
        status,
        adminReply: reply.trim() || (action === 'accept' ? 'Your document has been verified and accepted.' : ''),
      });
      toast.success(data.message);
      onReviewed(data.receipt);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-dark border border-white/10 rounded-2xl w-full max-w-4xl max-h-[94vh] overflow-y-auto animate-enter">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 glass-dark z-10">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary-400" />
              Review Document
            </h2>
            <p className="text-xs opacity-50 mt-0.5">
              {receipt.tenantName} · {receipt.month} {receipt.year}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Status badge */}
            <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${style.badge}`}>
              <style.icon size={11} />
              {receipt.status}
            </span>
            {/* Close */}
            <button
              id="review-modal-close"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/10">

          {/* ── LEFT: Document preview ── */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wider">Uploaded Document</h3>
              {receipt.fileUrl && !isPDF && !imgError && (
                <button
                  id="zoom-toggle-btn"
                  onClick={() => setZoomed(z => !z)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {zoomed ? <ZoomOut size={13} /> : <ZoomIn size={13} />}
                  {zoomed ? 'Zoom out' : 'Zoom in'}
                </button>
              )}
            </div>

            {/* Preview box */}
            <div className={`rounded-xl overflow-hidden bg-white/5 flex items-center justify-center transition-all duration-300 ${zoomed ? 'min-h-[500px]' : 'min-h-48'}`}>
              {receipt.fileUrl ? (
                isPDF ? (
                  <div className="flex flex-col items-center gap-3 py-10">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
                      <FileText size={32} className="text-red-400" />
                    </div>
                    <p className="font-medium text-sm">{receipt.receiptFile?.originalName || 'Document.pdf'}</p>
                    <a
                      href={receipt.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 transition-colors text-sm"
                    >
                      <ExternalLink size={14} /> Open PDF
                    </a>
                  </div>
                ) : !imgError ? (
                  <img
                    src={receipt.fileUrl}
                    alt="Receipt document"
                    className={`rounded-xl object-contain transition-all duration-300 ${zoomed ? 'w-full h-auto' : 'w-full h-auto max-h-80'}`}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-10 opacity-40">
                    <AlertTriangle size={32} />
                    <p className="text-sm">Could not load image</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-2 py-10 opacity-30">
                  <FileText size={32} />
                  <p className="text-sm">No file attached</p>
                </div>
              )}
            </div>

            {/* Submitter */}
            <div className="glass rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {receipt.userId?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{receipt.userId?.name || 'Unknown'}</p>
                <p className="text-xs opacity-50 truncate">{receipt.userId?.email}</p>
              </div>
              <p className="text-xs opacity-40">Submitted {receipt.createdAt ? format(new Date(receipt.createdAt), 'dd MMM yyyy') : '—'}</p>
            </div>

            {/* Review history timeline */}
            {receipt.reviewedAt && (
              <div className="glass rounded-xl p-3 space-y-0">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-40 mb-2">Review History</p>
                <TimelineEntry receipt={receipt} />
              </div>
            )}
          </div>

          {/* ── RIGHT: Details + action ── */}
          <div className="p-5 space-y-5">
            {/* Receipt details */}
            <div>
              <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wider mb-3">Receipt Details</h3>
              <div className="glass rounded-xl p-3">
                <DetailRow icon={User}        label="Tenant"         value={receipt.tenantName} />
                <DetailRow icon={Home}        label="Flat / House No." value={receipt.flatNumber} />
                <DetailRow icon={User}        label="Landlord"       value={receipt.landlordName} />
                <DetailRow icon={Calendar}    label="Rent Period"    value={`${receipt.month} ${receipt.year}`} />
                <DetailRow icon={IndianRupee} label="Amount"         value={`₹${receipt.amount?.toLocaleString('en-IN')}`} />
                <DetailRow icon={CreditCard}  label="Payment Method" value={receipt.paymentMethod} />
                <DetailRow icon={Calendar}    label="Payment Date"   value={receipt.paymentDate ? format(new Date(receipt.paymentDate), 'dd MMM yyyy') : null} />
              </div>
            </div>

            {/* ── Decision area ── */}
            {!action ? (
              <div className="space-y-3">
                {/* Previously reviewed notice */}
                {receipt.status !== 'Pending' && (
                  <div className={`rounded-xl p-3 border text-sm ${style.badge}`}>
                    <p className="font-semibold flex items-center gap-1.5 mb-1">
                      <style.icon size={13} />
                      {receipt.status === 'Verified' ? 'Previously Accepted' : 'Previously Rejected'}
                    </p>
                    {receipt.adminReply && (
                      <p className="opacity-70 text-xs">"{receipt.adminReply}"</p>
                    )}
                  </div>
                )}

                <p className="text-sm font-semibold opacity-70">
                  {receipt.status === 'Pending' ? 'Make a Decision' : 'Change Decision'}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="btn-accept-receipt"
                    onClick={() => { setAction('accept'); setReply(''); }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 transition-all font-semibold text-sm"
                  >
                    <CheckCircle size={17} /> Accept
                  </button>
                  <button
                    id="btn-reject-receipt"
                    onClick={() => { setAction('reject'); setReply(''); }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-all font-semibold text-sm"
                  >
                    <XCircle size={17} /> Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-enter">
                <div className={`rounded-xl p-4 border ${action === 'accept' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                  <p className={`text-sm font-bold mb-3 flex items-center gap-2 ${action === 'accept' ? 'text-green-400' : 'text-red-400'}`}>
                    {action === 'accept'
                      ? <><CheckCircle size={16} /> Accepting Document</>
                      : <><XCircle size={16} /> Rejecting Document</>
                    }
                  </p>
                  <label className="input-label">
                    {action === 'reject' ? 'Reason for rejection *' : 'Message to user (optional)'}
                  </label>
                  <textarea
                    id="admin-reply-input"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    rows={3}
                    placeholder={
                      action === 'accept'
                        ? 'e.g. Your rent receipt has been verified successfully.'
                        : 'e.g. The uploaded document is blurry and unreadable. Please re-upload a clear copy.'
                    }
                    className="input-field resize-none mt-1 text-sm"
                  />
                  {action === 'accept' && !reply.trim() && (
                    <p className="text-xs opacity-40 mt-1">Leave blank to send a default acceptance message.</p>
                  )}
                </div>

                {/* Submit / Back */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setAction(null)}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm disabled:opacity-40"
                  >
                    <RotateCcw size={13} /> Back
                  </button>
                  <button
                    id="submit-review-btn"
                    onClick={handleSubmit}
                    disabled={submitting || (action === 'reject' && !reply.trim())}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40
                      ${action === 'accept' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                  >
                    {submitting
                      ? <><Loader size={15} className="animate-spin" /> Submitting...</>
                      : action === 'accept'
                        ? <><CheckCircle size={15} /> Confirm Accept</>
                        : <><XCircle size={15} /> Confirm Reject</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
