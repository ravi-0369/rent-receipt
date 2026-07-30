import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Calendar, IndianRupee, User, Home, CreditCard, FileCheck, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../api/axios';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-primary-600/15 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={15} className="text-primary-400" />
    </div>
    <div>
      <p className="text-xs opacity-50 mb-0.5">{label}</p>
      <p className="font-semibold text-sm">{value || '—'}</p>
    </div>
  </div>
);

const ReceiptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get(`/receipts/${id}`);
        setReceipt(data.receipt);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Receipt not found');
        navigate('/history');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleDownload = () => {
    if (!receipt?.fileUrl) { toast.error('No file attached'); return; }
    const link = document.createElement('a');
    link.href = receipt.fileUrl;
    link.download = `receipt-${receipt.month}-${receipt.year}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started!');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="skeleton h-10 rounded-xl w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="skeleton h-80 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!receipt) return null;

  const isPDF = receipt.receiptFile?.mimetype === 'application/pdf';

  return (
    <div className="max-w-4xl mx-auto animate-enter space-y-5">
      {/* Back + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          <button onClick={handleDownload} disabled={!receipt.fileUrl} className="btn-primary disabled:opacity-40">
            <Download size={16} /> Download
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">Receipt — {receipt.month} {receipt.year}</h1>
        <p className="opacity-60 text-sm mt-1">Uploaded {format(new Date(receipt.createdAt), 'dd MMMM yyyy, hh:mm a')}</p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* File Preview — left */}
        <div className="lg:col-span-3 glass-card p-4">
          <h3 className="font-semibold mb-3 text-sm opacity-70">Receipt File</h3>
          {receipt.fileUrl ? (
            isPDF ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <FileText size={40} className="text-red-400" />
                </div>
                <p className="font-medium">{receipt.receiptFile?.originalName || 'Receipt.pdf'}</p>
                <p className="text-sm opacity-50">{receipt.receiptFile?.size ? `${(receipt.receiptFile.size / 1024).toFixed(1)} KB` : 'PDF Document'}</p>
                <a href={receipt.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  <Download size={16} /> Open PDF
                </a>
              </div>
            ) : !imgError ? (
              <img
                src={receipt.fileUrl}
                alt={`Receipt ${receipt.month} ${receipt.year}`}
                className="file-preview-img w-full rounded-xl"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 opacity-50">
                <FileText size={40} />
                <p className="text-sm">Could not load image</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 opacity-40">
              <FileText size={40} />
              <p className="text-sm">No file attached to this receipt</p>
            </div>
          )}
        </div>

        {/* Details — right */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="font-semibold mb-1">Receipt Details</h3>
          <div className="mb-3">
            <span className={`badge ${receipt.status === 'Verified' ? 'badge-success' : receipt.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
              {receipt.status}
            </span>
          </div>

          <InfoRow icon={User} label="Tenant Name" value={receipt.tenantName} />

          <InfoRow icon={Calendar} label="Rent Period" value={`${receipt.month} ${receipt.year}`} />
          <InfoRow icon={IndianRupee} label="Rent Amount" value={`₹${receipt.amount?.toLocaleString('en-IN')}`} />
          <InfoRow icon={CreditCard} label="Payment Method" value={receipt.paymentMethod} />
          <InfoRow icon={Calendar} label="Payment Date" value={receipt.paymentDate ? format(new Date(receipt.paymentDate), 'dd MMMM yyyy') : '—'} />
          {receipt.notes && (
            <InfoRow icon={FileCheck} label="Notes" value={receipt.notes} />
          )}
        </div>
      </div>

      {/* Admin Decision Card */}
      {receipt.adminReply && receipt.status !== 'Pending' && (
        <div className={`glass-card p-5 border ${
          receipt.status === 'Verified'
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-red-500/30 bg-red-500/5'
        } animate-enter`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              receipt.status === 'Verified' ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {receipt.status === 'Verified'
                ? <CheckCircle size={22} className="text-green-400" />
                : <XCircle size={22} className="text-red-400" />
              }
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <p className={`font-bold text-base ${
                  receipt.status === 'Verified' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {receipt.status === 'Verified' ? 'Document Accepted ✅' : 'Document Rejected ❌'}
                </p>
                <span className={`badge ${
                  receipt.status === 'Verified' ? 'badge-success' : 'badge-danger'
                }`}>
                  {receipt.status}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MessageSquare size={14} className="opacity-40 mt-0.5 flex-shrink-0" />
                <p className="text-sm opacity-80 leading-relaxed">{receipt.adminReply}</p>
              </div>
              {receipt.reviewedAt && (
                <p className="text-xs opacity-30 mt-3">
                  Reviewed on {format(new Date(receipt.reviewedAt), 'dd MMMM yyyy, hh:mm a')}
                  {receipt.reviewedBy?.name && ` by ${receipt.reviewedBy.name}`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptDetail;
