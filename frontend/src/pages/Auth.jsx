import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, Mail, Lock, User, Sparkles, Wand2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const Auth = ({ showToast }) => {
  const { login } = useAuth();
  const location = useLocation();
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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err) {
      showToast(err.message, 'error');
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      showToast('Please enter your email first', 'error');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      if (error) throw error;
      showToast('Magic link sent! Check your email.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !username)) {
      showToast('Please fill in all fields', 'error');
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
        showToast('Welcome back to MotoGP Manager!', 'success');
      } else {
        showToast('Registration successful! Please log in.', 'success');
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden my-8">
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
            MOTOGP MANAGER
          </h1>
          <p className="text-sm text-gray-400 mt-2 font-light">
            Build your team, hire pilots, and rule the championship
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-800 bg-[#0F0F12]/50">
          <button
            onClick={() => { setIsLogin(true); setEmail(''); setUsername(''); setPassword(''); }}
            className={`flex-1 py-4 text-sm font-semibold tracking-wider transition-colors ${
              isLogin 
                ? 'text-red-500 border-b-2 border-red-500 bg-[#16161C]/50' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            SIGN IN
          </button>
          <button
            onClick={() => { setIsLogin(false); setEmail(''); setUsername(''); setPassword(''); }}
            className={`flex-1 py-4 text-sm font-semibold tracking-wider transition-colors ${
              !isLogin 
                ? 'text-red-500 border-b-2 border-red-500 bg-[#16161C]/50' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          
          {/* Supabase Social Auth */}
          {supabase && (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-800"></div>
                <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-semibold tracking-wider">OR</span>
                <div className="flex-grow border-t border-gray-800"></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Username</label>
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
              <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0F0F12]/80 border border-gray-800 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none text-white text-sm transition-all"
                  placeholder="manager@motogp.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Password {supabase && <span className="text-gray-600 font-normal normal-case ml-2">(Optional for Magic Link)</span>}
              </label>
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
                  required={!supabase} // Require password only if no supabase
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || (!password && !isLogin)}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-red-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {isLogin ? 'SIGN IN WITH PASSWORD' : 'CREATE ACCOUNT'}
                  </>
                )}
              </button>

              {supabase && isLogin && (
                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={loading || !email}
                  className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 border border-gray-700"
                >
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  SEND MAGIC LINK
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
