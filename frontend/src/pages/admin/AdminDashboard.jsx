import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, FileText, IndianRupee, TrendingUp, ArrowRight, LogIn, UserX, ClipboardList, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../../api/axios';
import StatCard from '../../components/ui/StatCard';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get('/admin/stats');
        setStats(data.stats);
      } catch {
        toast.error('Failed to load admin stats');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chartData = stats?.monthlyStats?.map(m => ({
    month: `${m._id.month?.substring(0,3)} ${m._id.year}`,
    amount: m.totalAmount,
    count: m.count
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="opacity-60 text-sm mt-1">Overview of all users and receipts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} color="blue" />
        <StatCard icon={FileText} label="Total Receipts" value={stats?.totalReceipts || 0} color="purple" delay={60} />
        <StatCard icon={IndianRupee} label="Total Amount" value={`₹${(stats?.totalAmount || 0).toLocaleString('en-IN')}`} color="green" delay={120} />
        <StatCard icon={LogIn} label="Logged In Today" value={stats?.loggedInToday ?? 0} color="green" delay={180} />
        <StatCard icon={UserX} label="Never Logged In" value={stats?.neverLoggedIn ?? 0} color="red" delay={240} />
      </div>

      {/* Verification quick-action banner */}
      {(stats?.pendingVerification ?? 0) > 0 && (
        <Link
          to="/admin/verify"
          className="flex items-center justify-between p-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/15 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <ShieldAlert size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="font-semibold text-yellow-400">{stats.pendingVerification} document{stats.pendingVerification !== 1 ? 's' : ''} awaiting verification</p>
              <p className="text-xs opacity-60">Click to open the verification queue</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-yellow-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-400" />
            Recent Monthly Activity
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,30,0.9)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', color: '#e2e8f0' }} formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Total']} />
              <Bar dataKey="amount" fill="url(#adminGrad)" radius={[6,6,0,0]} />
              <defs>
                <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent activity grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Receipts */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Receipts</h3>
            <Link to="/admin/receipts" className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300 transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {stats?.recentReceipts?.map(r => (
              <div key={r._id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                <div>
                  <p className="text-sm font-medium">{r.tenantName}</p>
                  <p className="text-xs opacity-50">{r.month} {r.year} · {r.userId?.name}</p>
                </div>
                <p className="text-green-400 font-semibold text-sm">₹{r.amount?.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Users</h3>
            <Link to="/admin/users" className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300 transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {stats?.recentUsers?.map(u => (
              <div key={u._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {u.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs opacity-50 truncate">{u.email}</p>
                </div>
                <p className="text-xs opacity-40">{format(new Date(u.createdAt), 'dd MMM')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
