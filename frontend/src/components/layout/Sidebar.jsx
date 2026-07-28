import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Upload, History, FileText,
  Users, ShieldCheck, LogOut, Menu, X, Home,
  TrendingUp, ChevronRight
} from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `sidebar-link ${isActive ? 'active' : 'opacity-70 hover:opacity-100'}`
    }
  >
    <Icon size={18} className="shrink-0" />
    <span>{label}</span>
  </NavLink>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/upload', icon: Upload, label: 'Upload Receipt' },
    { to: '/history', icon: History, label: 'Receipt History' },
  ];

  const adminLinks = [
    { to: '/admin', icon: ShieldCheck, label: 'Admin Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Manage Users' },
    { to: '/admin/receipts', icon: FileText, label: 'All Receipts' },
  ];

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-50 flex flex-col
          glass-dark border-r border-white/10
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <span className="font-bold text-base">RentReceipts</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* User profile */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-xs opacity-50 truncate">{user?.email}</p>
            </div>
            {isAdmin && (
              <span className="badge badge-purple text-xs">Admin</span>
            )}
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* User section */}
          <p className="text-[10px] font-semibold uppercase tracking-widest opacity-40 px-3 mb-2 mt-1">Main</p>
          {userLinks.map(link => (
            <NavItem key={link.to} {...link} onClick={onClose} />
          ))}

          {/* Admin section */}
          {isAdmin && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-40 px-3 mb-2 mt-4">Admin</p>
              {adminLinks.map(link => (
                <NavItem key={link.to} {...link} onClick={onClose} />
              ))}
            </>
          )}
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:bg-red-500/10 opacity-90 hover:opacity-100"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
