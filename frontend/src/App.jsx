import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import UploadReceipt from './pages/UploadReceipt';
import ReceiptHistory from './pages/ReceiptHistory';
import ReceiptDetail from './pages/ReceiptDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReceipts from './pages/admin/AdminReceipts';

// Protected route wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
          <p className="opacity-50 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

// Public route (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

    {/* Protected */}
    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/upload" element={<UploadReceipt />} />
      <Route path="/history" element={<ReceiptHistory />} />
      <Route path="/receipt/:id" element={<ReceiptDetail />} />

      {/* Admin only */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/receipts" element={<ProtectedRoute adminOnly><AdminReceipts /></ProtectedRoute>} />
    </Route>

    {/* Default redirect */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15, 15, 30, 0.95)',
              color: '#e2e8f0',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '12px',
              backdropFilter: 'blur(12px)',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0f0f1e' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0f0f1e' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
