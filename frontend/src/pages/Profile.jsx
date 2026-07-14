import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { User, Mail, Calendar, Lock, ArrowLeft, KeyRound, Eye, EyeOff, Globe } from 'lucide-react';

const Profile = ({ showToast }) => {
  const { apiFetch, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/users/profile');
      setProfile(data);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      showToast(t('profile.validation.empty_password', 'Please enter a new password'), 'error');
      return;
    }
    if (newPassword.length < 4) {
      showToast(t('profile.validation.short_password', 'Password must be at least 4 characters long'), 'error');
      return;
    }

    // Confirmation warning dialog before sending request
    const confirmLogout = window.confirm(
      t('profile.confirm_logout', "Por seguridad, al cambiar la contraseña se cerrará tu sesión actual. ¿Deseas continuar?")
    );
    if (!confirmLogout) {
      return; // Abort
    }

    setUpdating(true);
    try {
      await apiFetch('/api/users/profile/password', {
        method: 'PUT',
        body: JSON.stringify({ new_password: newPassword })
      });
      
      showToast(t('profile.success.password_updated', 'Password updated successfully! Logging out...'), 'success');
      
      // Forced Logout to trigger login redirect
      setTimeout(() => {
        logout();
      }, 1500);

    } catch (error) {
      showToast(error.message, 'error');
      setUpdating(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3 max-w-6xl mx-auto">
        <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
        <p className="text-gray-400">{t('profile.loading', 'Loading profile data...')}</p>
      </div>
    );
  }

  const changeLanguage = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('motogp_language', newLang);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 animate-fadeIn">
      {/* Navigation */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('profile.back_dashboard', 'BACK TO DASHBOARD')}
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
          <KeyRound className="text-red-500 w-8 h-8" />
          {t('profile.title', 'Manager Profile')}
        </h1>
        <p className="text-gray-400 mt-1">{t('profile.subtitle', 'Review account details and update credentials')}</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Preferences Card (New) */}
        <div className="glass rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="p-6 bg-gradient-to-r from-blue-600/10 to-transparent border-b border-gray-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              {t('profile.preferences', 'Preferencias de la Aplicación')}
            </h2>
            <p className="text-xs text-gray-400 mt-1">{t('profile.preferences_subtitle', 'Ajustes locales del navegador')}</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400">{t('profile.language', 'Idioma de la interfaz')}</span>
              </div>
              <select
                value={i18n.language}
                onChange={changeLanguage}
                className="bg-[#0F0F12] border border-gray-800 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block px-3 py-2"
              >
                <option value="es">Castellano (ES)</option>
                <option value="en">English (EN)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="glass rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="p-6 bg-gradient-to-r from-red-600/10 to-transparent border-b border-gray-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-red-500" />
              {t('profile.account_specifications', 'Account Specifications')}
            </h2>
            <p className="text-xs text-gray-400 mt-1">{t('profile.account_metadata', 'Profile metadata (read-only)')}</p>
          </div>

          <div className="p-6 space-y-4">
            
            {/* Nickname display */}
            <div className="flex items-center justify-between py-3 border-b border-gray-800/65">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400">{t('profile.nickname', 'Nickname')}</span>
              </div>
              <strong className="text-sm text-white font-semibold">{profile.username}</strong>
            </div>

            {/* Email display */}
            <div className="flex items-center justify-between py-3 border-b border-gray-800/65">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400">{t('profile.email', 'Email Address')}</span>
              </div>
              <strong className="text-sm text-white font-semibold">{profile.email}</strong>
            </div>

            {/* Last Login display */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400">{t('profile.last_login', 'Last Login Date')}</span>
              </div>
              <strong className="text-sm text-white font-semibold">
                {profile.last_login ? new Date(profile.last_login).toLocaleString() : t('profile.na', 'N/A')}
              </strong>
            </div>

          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="p-6 bg-gradient-to-r from-orange-600/10 to-transparent border-b border-gray-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" />
              {t('profile.change_password', 'Change Security Password')}
            </h2>
            <p className="text-xs text-gray-400 mt-1">{t('profile.change_password_subtitle', 'Updating password terminates all other active sessions')}</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-400">{t('profile.new_password', 'New Password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('profile.enter_new_password', 'Enter new manager password')}
                  className="w-full pl-10 pr-10 py-3 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-red-500 focus:outline-none text-white text-sm"
                  required
                  disabled={updating}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={updating || !newPassword}
              className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                t('profile.update_password', 'UPDATE PASSWORD')
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Profile;
