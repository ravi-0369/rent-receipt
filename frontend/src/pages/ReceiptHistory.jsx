import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, FileDown, ChevronDown, X, Upload, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import API from '../api/axios';
import ReceiptTable from '../components/ui/ReceiptTable';
import EditReceiptModal from '../components/ui/EditReceiptModal';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

const ReceiptHistory = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [editReceipt, setEditReceipt] = useState(null);

  const [filters, setFilters] = useState({
    search: '', month: '', year: '', paymentMethod: '',
    minAmount: '', maxAmount: '', startDate: '', endDate: ''
  });

  const fetchReceipts = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = { page: pageNum, limit: 10, ...filters };
      // Remove empty filters
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await API.get('/receipts', { params });
      setReceipts(data.receipts);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setPage(1);
    fetchReceipts(1);
  }, [filters]);

  const handlePageChange = (p) => {
    setPage(p);
    fetchReceipts(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this receipt? This cannot be undone.')) return;
    try {
      await API.delete(`/receipts/${id}`);
      toast.success('Receipt deleted');
      fetchReceipts(page);
    } catch {
      toast.error('Failed to delete receipt');
    }
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', month: '', year: '', paymentMethod: '', minAmount: '', maxAmount: '', startDate: '', endDate: '' });
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  // Export to Excel
  const exportExcel = () => {
    const data = receipts.map(r => ({
      'Month': r.month,
      'Year': r.year,
      'Tenant Name': r.tenantName,
      'Landlord Name': r.landlordName,
      'Flat No': r.flatNumber,
      'Amount (₹)': r.amount,
      'Payment Method': r.paymentMethod,
      'Payment Date': r.paymentDate ? new Date(r.paymentDate).toLocaleDateString('en-IN') : '',
      'Status': r.status,
      'Notes': r.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Receipts');
    XLSX.writeFile(wb, `rent-receipts-export-${Date.now()}.xlsx`);
    toast.success('Exported to Excel!');
  };

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Rent Receipt History', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Month/Year', 'Tenant', 'Amount', 'Method', 'Date', 'Status']],
      body: receipts.map(r => [
        `${r.month} ${r.year}`,
        r.tenantName,
        `₹${r.amount?.toLocaleString('en-IN')}`,
        r.paymentMethod,
        r.paymentDate ? new Date(r.paymentDate).toLocaleDateString('en-IN') : '-',
        r.status
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save(`rent-receipts-${Date.now()}.pdf`);
    toast.success('Exported to PDF!');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Receipt History</h1>
          <p className="opacity-60 text-sm mt-1">{total} receipt{total !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportExcel} className="btn-secondary text-sm py-2">
            <FileDown size={15} /> Excel
          </button>
          <button onClick={exportPDF} className="btn-secondary text-sm py-2">
            <Download size={15} /> PDF
          </button>
          <Link to="/upload" className="btn-primary text-sm py-2">
            <Upload size={15} /> Upload
          </Link>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              id="search-receipts"
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="input-field pl-9"
              placeholder="Search by tenant, landlord, flat..."
            />
          </div>
          <button
            id="toggle-filters"
            onClick={() => setShowFilters(p => !p)}
            className={`btn-secondary relative ${hasActiveFilters ? 'border-primary-500/50' : ''}`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary-500" />
            )}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary text-red-400">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 border-t border-white/10 animate-enter">
            <div>
              <label className="input-label">Month</label>
              <select name="month" value={filters.month} onChange={handleFilterChange} className="input-field">
                <option value="">All months</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Year</label>
              <select name="year" value={filters.year} onChange={handleFilterChange} className="input-field">
                <option value="">All years</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Payment Method</label>
              <select name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange} className="input-field">
                <option value="">All methods</option>
                {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Min Amount (₹)</label>
              <input type="number" name="minAmount" value={filters.minAmount} onChange={handleFilterChange} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="input-label">Max Amount (₹)</label>
              <input type="number" name="maxAmount" value={filters.maxAmount} onChange={handleFilterChange} className="input-field" placeholder="100000" />
            </div>
            <div>
              <label className="input-label">From Date</label>
              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="input-field" />
            </div>
            <div>
              <label className="input-label">To Date</label>
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="input-field" />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card p-4">
        <ReceiptTable
          receipts={receipts}
          loading={loading}
          onDelete={handleDelete}
          onEdit={setEditReceipt}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Edit Modal */}
      {editReceipt && (
        <EditReceiptModal
          receipt={editReceipt}
          onClose={() => setEditReceipt(null)}
          onSuccess={() => { setEditReceipt(null); fetchReceipts(page); }}
        />
      )}
    </div>
  );
};

export default ReceiptHistory;
