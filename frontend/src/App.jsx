import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Landing from './pages/Landing';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Dashboard from './pages/Dashboard';
import ChampionshipDetail from './pages/ChampionshipDetail';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import Toast from './components/Toast';
import { LogOut, User, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Route Guard: redirects to /login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Route Guard: redirects to /dashboard if already authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Route Guard: redirects to /dashboard if not admin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const NavigationHeader = ({ showToast }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  if (!isAuthenticated || !user) return null;

  const isProfileActive = location.pathname === '/profile';

  return (
    <header className="border-b border-gray-800 bg-[#16161C]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center text-white font-extrabold shadow-lg shadow-red-600/10 group-hover:scale-105 transition-all">
            GP
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-wider group-hover:text-red-400 transition-colors">
              MASTERS
            </span>
            <span className="font-light text-gray-400 text-xs block -mt-1 uppercase tracking-widest">
              Manager MVP
            </span>
          </div>
        </div>

        {/* Right Profile / Auth actions */}
        <div className="flex items-center gap-4">
          {/* Admin panel link */}
          {user.role === 'admin' && (
            <button
              onClick={() => {
                if (location.pathname === '/admin') {
                  navigate('/dashboard');
                } else {
                  navigate('/admin');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-xl transition-all select-none ${location.pathname === '/admin'
                  ? 'bg-red-600/15 border-red-500/35 text-red-400 font-bold shadow-lg shadow-red-600/5'
                  : 'bg-gray-800/40 hover:bg-gray-850 border-gray-800 text-gray-250'
                }`}
              title={t('app.admin_panel_title', 'Panel de Administración')}
            >
              <Shield className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold">{t('app.admin_panel', 'Admin Panel')}</span>
            </button>
          )}

          {/* Profile page toggle link */}
          <button
            onClick={() => {
              if (isProfileActive) {
                navigate('/dashboard');
              } else {
                navigate('/profile');
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-xl transition-all select-none ${isProfileActive
                ? 'bg-red-600/10 border-red-500/30 text-red-400 font-bold'
                : 'bg-gray-800/40 hover:bg-gray-850 border-gray-800 text-gray-250'
              }`}
            title={t('app.manage_profile', 'Manage Profile Settings')}
          >
            <User className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold">{user.username}</span>
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/login');
              showToast(t('app.logged_out_success', 'Logged out successfully.'), 'success');
            }}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 hover:bg-red-600/10 hover:text-red-500 text-gray-300 font-bold text-xs tracking-wider uppercase border border-gray-855 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t('app.logout', 'Logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

const MainApp = ({ showToast }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0F0F12] grid-bg">
      <NavigationHeader showToast={showToast} />

      {/* Main Container routes */}
      <main className="flex-1 pb-16">
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Auth showToast={showToast} />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <PublicRoute>
                <Landing />
              </PublicRoute>
            }
          />
          <Route
            path="/privacy"
            element={<Privacy />}
          />
          <Route
            path="/terms"
            element={<Terms />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard showToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/championship/:id"
            element={
              <ProtectedRoute>
                <ChampionshipDetail showToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile showToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminUsers showToast={showToast} />
              </AdminRoute>
            }
          />
          {/* Catch-all redirects to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <MainApp showToast={showToast} />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
