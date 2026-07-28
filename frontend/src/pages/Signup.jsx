import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Home, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/signup', {
        name: form.name,
        email: form.email,
        password: form.password
      });
      login(data.user, data.token);
      toast.success(`Welcome, ${data.user.name}! 🎉 Account created successfully`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '30%' };
    if (p.length < 10) return { label: 'Fair', color: 'bg-yellow-500', width: '60%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };
  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex auth-bg">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-primary-800/50 to-primary-900/60" />
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-6">
            <Home size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Join Rent Receipt Manager</h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Create your free account and start managing your rent receipts securely today.
          </p>
        </div>
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-primary-500/10 blur-3xl" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-enter">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Home size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl">RentReceipts</span>
          </div>

          <div className="glass-card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-1">Create Account</h2>
              <p className="opacity-60 text-sm">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="input-label">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="input-label">Email Address</label>
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="input-field pr-12"
                    placeholder="Min. 6 characters"
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
                {strength && (
                  <div className="mt-2">
                    <div className="progress-track">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                    </div>
                    <p className="text-xs mt-1 opacity-60">{strength.label} password</p>
                  </div>
                )}
              </div>

              <div>
                <label className="input-label">Confirm Password</label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Repeat your password"
                  required
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">Passwords don't match</p>
                )}
              </div>

              <button
                id="signup-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus size={18} /> Create Account
                  </span>
                )}
              </button>
            </form>

            <p className="text-center text-sm opacity-60 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
