import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { FileText, IndianRupee, TrendingUp, Upload, ArrowRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [yearlyData, setYearlyData] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, yearRes, methodRes] = await Promise.all([
          API.get('/analytics/dashboard'),
          API.get('/analytics/yearly'),
          API.get('/analytics/payment-methods')
        ]);
        setStats(dashRes.data.data);
        setYearlyData(yearRes.data.data.map(d => ({ year: String(d._id), amount: d.totalAmount, count: d.count })));
        setPaymentMethods(methodRes.data.data.map(d => ({ name: d._id, value: d.count, amount: d.totalAmount })));
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-14 rounded-2xl w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="opacity-60 text-sm mt-1">Here's your rent receipt overview</p>
        </div>
        <Link to="/upload" className="btn-primary">
          <Upload size={16} /> Upload Receipt
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Receipts" value={stats?.totalReceipts || 0} color="primary" delay={0} />
        <StatCard icon={IndianRupee} label="Total Rent Paid" value={`₹${(stats?.totalAmount || 0).toLocaleString('en-IN')}`} color="green" delay={60} />
        <StatCard icon={Calendar} label="This Month" value={`₹${(stats?.thisMonthAmount || 0).toLocaleString('en-IN')}`} color="purple" delay={120} />
        <StatCard icon={TrendingUp} label="Years Tracked" value={yearlyData.length || 0} color="orange" delay={180} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-400" />
            Monthly Rent — {new Date().getFullYear()}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.monthlyChartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,15,30,0.9)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Rent']}
              />
              <Bar dataKey="amount" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Pie */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <IndianRupee size={18} className="text-green-400" />
            Payment Methods
          </h3>
          {paymentMethods.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%" cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentMethods.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgba(15,15,30,0.9)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', color: '#e2e8f0' }}
                  formatter={(v, n, p) => [v, p.payload.name]}
                />
                <Legend formatter={(v) => <span style={{ color: 'currentcolor', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 opacity-40 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Yearly Totals + Recent Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Yearly */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Yearly Summary</h3>
          <div className="space-y-3">
            {yearlyData.length === 0 ? (
              <p className="opacity-40 text-sm text-center py-4">No data yet</p>
            ) : (
              yearlyData.map(y => (
                <div key={y.year} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div>
                    <p className="font-semibold">{y.year}</p>
                    <p className="text-xs opacity-50">{y.count} receipts</p>
                  </div>
                  <p className="font-bold text-green-400">₹{y.amount.toLocaleString('en-IN')}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Receipts */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Uploads</h3>
            <Link to="/history" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1 transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {!stats?.recentReceipts?.length ? (
              <div className="text-center py-8 opacity-40">
                <FileText size={32} className="mx-auto mb-2" />
                <p className="text-sm">No receipts yet. <Link to="/upload" className="text-primary-400">Upload your first one!</Link></p>
              </div>
            ) : (
              stats.recentReceipts.map(r => (
                <Link
                  key={r._id}
                  to={`/receipt/${r._id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-600/20 flex items-center justify-center">
                      <FileText size={16} className="text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{r.month} {r.year}</p>
                      <p className="text-xs opacity-50">{r.paymentMethod} · {format(new Date(r.createdAt), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400 text-sm">₹{r.amount?.toLocaleString('en-IN')}</p>
                    <ArrowRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
