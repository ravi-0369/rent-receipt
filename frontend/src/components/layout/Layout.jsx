import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/upload': 'Upload Receipt',
  '/history': 'Receipt History',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'Manage Users',
  '/admin/receipts': 'All Receipts',
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  const title = pageTitles[pathname] || pageTitles[Object.keys(pageTitles).find(k => pathname.startsWith(k))] || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
