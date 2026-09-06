import React from 'react';
import { useAppContext } from '../context/AppContext';
import { ShieldIcon, LogOutIcon } from './icons';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { adminLoggedIn, logoutAdmin, navigate } = useAppContext();

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Admin Top Bar */}
      <header className="bg-stone-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <ShieldIcon size={20} className="text-amber-400" />
          <span className="font-semibold text-sm sm:text-base">Huma Admin</span>
        </div>
        <div className="flex items-center gap-3">
          {adminLoggedIn && (
            <>
              <button
                onClick={() => navigate('home')}
                className="text-xs text-stone-400 hover:text-white transition-colors hidden sm:block"
              >
                View Site
              </button>
              <button
                onClick={logoutAdmin}
                className="flex items-center gap-1.5 text-xs bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <LogOutIcon size={14} />
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {/* Admin Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
