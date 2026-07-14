import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, Mail, Lock, User, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Auth = ({ showToast }) => {
  const { login } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.isRegister) {
      setIsLogin(false);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !username)) {
      showToast(t('auth.validation.fill_fields', 'Please fill in all fields'), 'error');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { email, username, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isLogin) {
        login(data.user);
        showToast(t('auth.success.login', 'Welcome back to GP Masters Manager!'), 'success');
      } else {
        showToast(t('auth.success.register', 'Registration successful! Please log in.'), 'success');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass rounded-2xl overflow-hidden shadow-2xl border border-gray-800 transition-all duration-300">
        {/* Top Branding Section */}
        <div className="relative bg-gradient-to-br from-red-600/20 via-[#16161C] to-[#0F0F12] p-8 text-center border-b border-gray-800">
          <div className="inline-flex items-center justify-center p-3 bg-red-600/10 rounded-xl mb-4 border border-red-500/20">
            <Trophy className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            GP MASTERS MANAGER
          </h1>
          <p className="text-sm text-gray-400 mt-2 font-light">
            {t('auth.subtitle', 'Build your team, hire pilots, and rule the championship')}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-800 bg-[#0F0F12]/50">
          <button
            onClick={() => { setIsLogin(true); setEmail(''); setUsername(''); setPassword(''); }}
            className={`flex-1 py-4 text-sm font-semibold tracking-wider transition-colors ${isLogin
              ? 'text-red-500 border-b-2 border-red-500 bg-[#16161C]/50'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            {t('auth.tab.sign_in', 'SIGN IN')}
          </button>
          <button
            onClick={() => { setIsLogin(false); setEmail(''); setUsername(''); setPassword(''); }}
            className={`flex-1 py-4 text-sm font-semibold tracking-wider transition-colors ${!isLogin
              ? 'text-red-500 border-b-2 border-red-500 bg-[#16161C]/50'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            {t('auth.tab.register', 'REGISTER')}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">{t('auth.form.username', 'Username')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0F0F12]/80 border border-gray-800 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none text-white text-sm transition-all"
                  placeholder="ManagerName"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">{t('auth.form.email', 'Email Address')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0F0F12]/80 border border-gray-800 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none text-white text-sm transition-all"
                placeholder="player@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">{t('auth.form.password', 'Password')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0F0F12]/80 border border-gray-800 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none text-white text-sm transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-red-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {isLogin ? t('auth.btn.sign_in', 'SIGN IN MANAGER') : t('auth.btn.create_account', 'CREATE ACCOUNT')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
