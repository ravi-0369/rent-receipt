import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Download, Edit, Trash2, FileText, Image, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const statusBadge = (status) => {
  const map = {
    Verified: 'badge-success',
    Pending: 'badge-warning',
    Rejected: 'badge-danger',
  };
  return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
};

const methodBadge = (method) => {
  const map = {
    Cash: 'badge-success',
    UPI: 'badge-info',
    'Bank Transfer': 'badge-purple',
    Card: 'badge-warning',
  };
  return <span className={`badge ${map[method] || 'badge-info'}`}>{method}</span>;
};

const ReceiptTable = ({ receipts, onDelete, onEdit, currentPage, totalPages, onPageChange, loading }) => {
  const handleDownload = async (receipt) => {
    if (!receipt.fileUrl) return;
    const link = document.createElement('a');
    link.href = receipt.fileUrl;
    link.download = `receipt-${receipt.month}-${receipt.year}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!receipts?.length) {
    return (
      <div className="text-center py-16 opacity-50">
        <FileText size={48} className="mx-auto mb-3 opacity-40" />
        <p className="font-medium">No receipts found</p>
        <p className="text-sm mt-1">Try adjusting your filters or upload a new receipt</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl">
        <table className="data-table">
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Month / Year</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Uploaded</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((r, i) => (
              <tr key={r._id} className="animate-enter" style={{ animationDelay: `${i * 30}ms` }}>
                {/* Receipt Preview */}
                <td>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                    {r.fileUrl ? (
                      r.receiptFile?.mimetype === 'application/pdf'
                        ? <FileText size={18} className="text-red-400" />
                        : <img src={r.fileUrl} alt="receipt" className="w-full h-full object-cover" />
                    ) : (
                      <FileText size={18} className="opacity-40" />
                    )}
                  </div>
                </td>
                <td>
                  <span className="font-medium">{r.month}</span>
                  <span className="opacity-50 ml-1">{r.year}</span>
                </td>
                <td>
                  <span className="font-semibold text-green-400">₹{r.amount?.toLocaleString('en-IN')}</span>
                </td>
                <td>{methodBadge(r.paymentMethod)}</td>
                <td className="opacity-70 text-xs">{r.paymentDate ? format(new Date(r.paymentDate), 'dd MMM yyyy') : '-'}</td>
                <td className="opacity-70 text-xs">{r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy') : '-'}</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    {statusBadge(r.status)}
                    {r.adminReply && (
                      <Link
                        to={`/receipt/${r._id}`}
                        title={`Admin reply: ${r.adminReply}`}
                        className="text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        <MessageSquare size={13} />
                      </Link>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/receipt/${r._id}`}
                      className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                      title="View"
                    >
                      <Eye size={15} />
                    </Link>
                    <button
                      onClick={() => handleDownload(r)}
                      disabled={!r.fileUrl}
                      className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors disabled:opacity-30"
                      title="Download"
                    >
                      <Download size={15} />
                    </button>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(r)}
                        className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-yellow-400 transition-colors"
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(r._id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Delete"
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {receipts.map((r, i) => (
          <div key={r._id} className="glass-card p-4 animate-enter" style={{ animationDelay: `${i * 30}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{r.month} {r.year}</p>
                <p className="text-green-400 font-bold">₹{r.amount?.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {statusBadge(r.status)}
                {methodBadge(r.paymentMethod)}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Link to={`/receipt/${r._id}`} className="btn btn-secondary text-xs py-1.5 flex-1 justify-center">
                <Eye size={13} /> View
              </Link>
              <button onClick={() => handleDownload(r)} disabled={!r.fileUrl} className="btn btn-secondary text-xs py-1.5 flex-1 justify-center disabled:opacity-30">
                <Download size={13} /> Download
              </button>
              {onDelete && (
                <button onClick={() => onDelete(r._id)} className="btn btn-danger text-xs py-1.5">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="pagination-btn disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          {[...Array(Math.min(totalPages, 7))].map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="pagination-btn disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReceiptTable;
