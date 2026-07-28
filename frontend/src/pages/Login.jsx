import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Home, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}! 👋`);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex auth-bg ${isDark ? 'dark' : ''}`}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-primary-800/50 to-purple-900/60" />
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-6">
            <Home size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Rent Receipt Manager</h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Securely manage all your rent receipts in one place. Upload, track, and download with ease.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-white/60 text-sm">
            {['Secure Upload', 'Analytics', 'Easy Export'].map(f => (
              <div key={f} className="glass rounded-xl p-3 text-center">
                <span className="font-medium text-white/90">{f}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-enter">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Home size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl">RentReceipts</span>
          </div>

          <div className="glass-card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
              <p className="opacity-60 text-sm">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="input-label">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="input-field pr-12"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Demo credentials hint */}
              <div className="rounded-xl p-3 bg-primary-500/10 border border-primary-500/20 text-xs opacity-80">
                <p className="font-semibold mb-1">Demo Credentials (after seeding):</p>
                <p>User: rahul@example.com / user123</p>
                <p>Admin: admin@rentreceipts.com / admin123</p>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn size={18} /> Sign In
                  </span>
                )}
              </button>
            </form>

            <p className="text-center text-sm opacity-60 mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>

          {/* Theme toggle */}
          <div className="text-center mt-4">
            <button onClick={toggleTheme} className="text-xs opacity-40 hover:opacity-70 transition-opacity">
              {isDark ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
