import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);
const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card'];

const UploadReceipt = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tenantName: '', landlordName: '', flatNumber: '',
    month: MONTHS[new Date().getMonth()],
    year: CURRENT_YEAR,
    amount: '', paymentMethod: 'UPI',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error('File rejected. Only PDF, JPG, PNG allowed (max 10MB)');
      return;
    }
    const f = accepted[0];
    setFile(f);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tenantName || !form.landlordName || !form.flatNumber || !form.amount || !form.paymentDate) {
      toast.error('Please fill all required fields');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (file) formData.append('receiptFile', file);

    try {
      await API.post('/receipts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / e.total));
        }
      });
      setSuccess(true);
      toast.success('Receipt uploaded successfully! 🎉');
      setTimeout(() => navigate('/history'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-enter">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Receipt Uploaded!</h2>
        <p className="opacity-60 text-sm">Redirecting to receipt history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Upload Rent Receipt</h1>
        <p className="opacity-60 text-sm mt-1">Fill in your payment details and attach your receipt</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Tenant Info */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-base border-b border-white/10 pb-3">Tenant Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Tenant Name *</label>
              <input id="tenant-name" type="text" name="tenantName" value={form.tenantName}
                onChange={handleChange} className="input-field" placeholder="Your full name" required />
            </div>
            <div>
              <label className="input-label">House / Flat Number *</label>
              <input id="flat-number" type="text" name="flatNumber" value={form.flatNumber}
                onChange={handleChange} className="input-field" placeholder="e.g. A-101" required />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Landlord Name *</label>
              <input id="landlord-name" type="text" name="landlordName" value={form.landlordName}
                onChange={handleChange} className="input-field" placeholder="Your landlord's name" required />
            </div>
          </div>
        </div>

        {/* Section: Payment Details */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-base border-b border-white/10 pb-3">Payment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Month *</label>
              <select id="month" name="month" value={form.month} onChange={handleChange} className="input-field">
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Year *</label>
              <select id="year" name="year" value={form.year} onChange={handleChange} className="input-field">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Rent Amount (₹) *</label>
              <input id="amount" type="number" name="amount" value={form.amount}
                onChange={handleChange} className="input-field" placeholder="e.g. 12000" min="0" required />
            </div>
            <div>
              <label className="input-label">Payment Method *</label>
              <select id="payment-method" name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="input-field">
                {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Payment Date *</label>
              <input id="payment-date" type="date" name="paymentDate" value={form.paymentDate}
                onChange={handleChange} className="input-field" required />
            </div>
          </div>
        </div>

        {/* Section: File Upload */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-base border-b border-white/10 pb-3">Receipt File</h3>
          {!file ? (
            <div {...getRootProps()} className={`drop-zone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} id="file-upload" />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary-600/20 flex items-center justify-center">
                  <Upload size={24} className="text-primary-400" />
                </div>
                <div>
                  <p className="font-medium">{isDragActive ? 'Drop the file here' : 'Drag & drop your receipt'}</p>
                  <p className="text-sm opacity-50 mt-1">or <span className="text-primary-400">browse to upload</span></p>
                  <p className="text-xs opacity-40 mt-2">PDF, JPG, PNG — Max 10MB</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 p-4">
              {preview ? (
                <img src={preview} alt="Receipt preview" className="w-full max-h-64 object-contain rounded-xl mb-3" />
              ) : (
                <div className="flex items-center gap-3 py-4">
                  <FileText size={32} className="text-red-400" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs opacity-50">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
                  </div>
                </div>
              )}
              {!uploading && (
                <button type="button" onClick={removeFile} className="btn-secondary text-xs mt-2">
                  <X size={14} /> Remove file
                </button>
              )}
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs opacity-60">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Section: Notes */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-base border-b border-white/10 pb-3 mb-4">Additional Notes</h3>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="input-field resize-none"
            rows={3}
            placeholder="Optional: any additional notes about this payment..."
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/history')} className="btn-secondary flex-1 justify-center py-3">
            Cancel
          </button>
          <button id="upload-submit" type="submit" disabled={uploading} className="btn-primary flex-2 flex-grow justify-center py-3">
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading ({progress}%)
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload size={18} /> Upload Receipt
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadReceipt;
