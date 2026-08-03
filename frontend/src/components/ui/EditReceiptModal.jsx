import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../api/axios';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

const EditReceiptModal = ({ receipt, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    month: receipt.month || '',
    year: receipt.year || CURRENT_YEAR,
    amount: receipt.amount || '',
    paymentMethod: receipt.paymentMethod || 'UPI',
    paymentDate: receipt.paymentDate ? new Date(receipt.paymentDate).toISOString().split('T')[0] : '',
    notes: receipt.notes || ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put(`/receipts/${receipt._id}`, form);
      toast.success('Receipt updated!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg p-6 animate-enter">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">Edit Receipt</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="input-label">Month</label>
              <select name="month" value={form.month} onChange={handleChange} className="input-field">
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Year</label>
              <select name="year" value={form.year} onChange={handleChange} className="input-field">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Amount (₹)</label>
              <input type="number" name="amount" value={form.amount} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Payment Method</label>
              <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="input-field">
                {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="input-label">Payment Date</label>
              <input type="date" name="paymentDate" value={form.paymentDate} onChange={handleChange} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="input-label">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="input-field resize-none" rows={2} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReceiptModal;
