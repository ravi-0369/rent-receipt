import { Menu, Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onMenuClick, title }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="glass-dark border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          id="sidebar-toggle"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="hidden lg:block">
          <h1 className="font-semibold text-base">{title || 'Dashboard'}</h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          id="theme-toggle"
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200"
          aria-label="Toggle theme"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark
            ? <Sun size={18} className="text-yellow-400" />
            : <Moon size={18} className="text-primary-400" />
          }
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 ml-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
