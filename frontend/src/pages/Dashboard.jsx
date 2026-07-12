import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Trophy, Calendar, Users, ArrowRight, Loader, User, Lock, Globe, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Dashboard = ({ showToast }) => {
  const { apiFetch, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [championships, setChampionships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('my-championships'); // 'my-championships', 'available-championships'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Helper to obtain tomorrow's date string YYYY-MM-DD
  const getTomorrowStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Creation States
  const [name, setName] = useState('');
  const [season, setSeason] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(getTomorrowStr());
  const [isPublic, setIsPublic] = useState(true);
  const [pin, setPin] = useState('');
  const [maxCircuits, setMaxCircuits] = useState(15);
  const [maxTeams, setMaxTeams] = useState(10);
  const [timeRestricted, setTimeRestricted] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchChampionships = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/championships');
      setChampionships(data);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChampionships();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !season || !startDate) {
      showToast(t('dashboard.validation.fill_fields', 'Please fill in all fields'), 'error');
      return;
    }

    // Client-side date check
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    if (start <= today) {
      showToast(t('dashboard.validation.future_date', 'Start date must be in the future.'), 'error');
      return;
    }

    if (!isPublic) {
      if (!pin) {
        showToast(t('dashboard.validation.pin_required', 'Please enter an Access PIN for private championships'), 'error');
        return;
      }
      const alphanumericRegex = /^[a-zA-Z0-9]{4,8}$/;
      if (!alphanumericRegex.test(pin)) {
        showToast(t('dashboard.validation.pin_format', 'PIN must be 4 to 8 characters long and contain only letters and numbers.'), 'error');
        return;
      }
    }

    setCreating(true);
    try {
      await apiFetch('/api/championships', {
        method: 'POST',
        body: JSON.stringify({ 
          name, 
          season: parseInt(season),
          start_date: startDate,
          is_public: isPublic,
          pin: isPublic ? null : pin,
          max_circuits: maxCircuits,
          max_teams: maxTeams,
          time_restricted: timeRestricted,
        }),
      });
      showToast(t('dashboard.success.created', 'Championship created successfully!'), 'success');
      setName('');
      setPin('');
      setIsPublic(true);
      setMaxCircuits(15);
      setMaxTeams(10);
      setTimeRestricted(true);
      setStartDate(getTomorrowStr());
      setShowCreateForm(false);
      fetchChampionships();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="text-red-500 w-8 h-8" />
            {t('dashboard.title', 'Championships')}
          </h1>
          <p className="text-gray-400 mt-1">{t('dashboard.subtitle', 'Manage active leagues or create a new MotoGP championship')}</p>
        </div>
        {user.role !== 'player' && (
          <button
            onClick={() => {
              setIsPublic(true); // default to public
              setPin('');
              setShowCreateForm(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/10 active:scale-[0.98] transition-all self-start sm:self-center"
          >
            <Plus className="w-5 h-5" />
            {t('dashboard.btn.new_championship', 'NEW CHAMPIONSHIP')}
          </button>
        )}
      </div>

      {/* Create Championship Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn !mt-0">
          <div className="w-full max-w-md glass rounded-2xl border border-gray-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-red-600/20 to-transparent p-6 border-b border-gray-800 shrink-0">
              <h2 className="text-xl font-bold text-white">{t('dashboard.create.title', 'Create Championship')}</h2>
              <p className="text-xs text-gray-400 mt-1">{t('dashboard.create.subtitle', 'Initialize a new motorsport league calendar')}</p>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-gray-400">Championship Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. World GP Series"
                  className="w-full px-4 py-3 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-red-500 focus:outline-none text-white text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-gray-400">Season (Year)</label>
                  <input
                    type="number"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="2026"
                    className="w-full px-4 py-3 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-red-500 focus:outline-none text-white text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-gray-400">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    min={getTomorrowStr()} // Physically blocks past/today selection in datepicker
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-red-500 focus:outline-none text-white text-sm"
                    required
                  />
                </div>
              </div>

              {/* Privacy settings */}
              {user.role === 'manager' ? (
                <div className="p-3.5 bg-emerald-650/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-450 leading-relaxed">
                  <span className="font-extrabold block mb-0.5 uppercase tracking-wide">Privacidad: Público</span>
                  Como Manager, tu campeonato será obligatoriamente público y accesible para todos los jugadores.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-gray-400 block">Privacy Setting</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPublic(true)}
                        className={`py-2.5 rounded-xl border font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all ${
                          isPublic 
                            ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-[#0F0F12] border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                        Public
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPublic(false)}
                        className={`py-2.5 rounded-xl border font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all ${
                          !isPublic 
                            ? 'bg-amber-600/10 border-amber-500/30 text-amber-400' 
                            : 'bg-[#0F0F12] border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Lock className="w-4 h-4" />
                        Private
                      </button>
                    </div>
                  </div>

                  {/* PIN input for private leagues */}
                  {!isPublic && (
                    <div className="space-y-1 animate-fadeIn">
                      <label className="text-xs font-semibold uppercase text-gray-400">Championship PIN (4-8 alphanumeric characters)</label>
                      <input
                        type="text"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="e.g. GP2026"
                        className="w-full px-4 py-3 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-amber-500 focus:outline-none text-white text-sm font-mono tracking-widest"
                        maxLength={8}
                        required
                      />
                    </div>
                  )}
                </>
              )}

              {/* Race & team limits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-gray-400">Máx. Carreras</label>
                  <input
                    type="number"
                    min="2"
                    max="15"
                    value={maxCircuits}
                    onChange={(e) => setMaxCircuits(Math.min(15, Math.max(2, parseInt(e.target.value) || 2)))}
                    className="w-full px-4 py-3 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-red-500 focus:outline-none text-white text-sm"
                    required
                  />
                  <p className="text-[10px] text-gray-500">Entre 2 y 15 GPs</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-gray-400">Máx. Participantes</label>
                  <input
                    type="number"
                    min="2"
                    max="12"
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(Math.min(12, Math.max(2, parseInt(e.target.value) || 2)))}
                    className="w-full px-4 py-3 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-red-500 focus:outline-none text-white text-sm"
                    required
                  />
                  <p className="text-[10px] text-gray-500">Entre 2 y 12 equipos</p>
                </div>
              </div>

              {/* Time restriction toggle */}
              <div className="flex items-center justify-between p-4 bg-[#0F0F12] border border-gray-800 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-gray-300">Limitación Horaria (12h–15h)</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Si está activo, los entrenamientos y clasificación solo se pueden simular entre las 12:00h y las 15:00h.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={timeRestricted}
                    onChange={(e) => setTimeRestricted(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-all"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'CREATE'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs and Search Bar row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        {/* Tabs navigation */}
        <div className="flex bg-[#101017] p-1 rounded-xl border border-gray-800 self-start">
          <button
            onClick={() => {
              setActiveTab('my-championships');
              setSearchQuery('');
            }}
            className={`py-2 px-4 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'my-championships'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('dashboard.tabs.my_championships', 'Mis Campeonatos')} ({championships.filter(c => c.is_member && !c.is_kicked).length})
          </button>
          <button
            onClick={() => {
              setActiveTab('available-championships');
              setSearchQuery('');
            }}
            className={`py-2 px-4 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'available-championships'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('dashboard.tabs.available', 'Campeonatos Disponibles')} ({championships.filter(c => !c.is_member && !c.is_kicked).length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-xs animate-fadeIn">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('dashboard.search', 'Buscar por nombre o creador...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-red-500 focus:outline-none text-white text-xs"
          />
        </div>
      </div>

      {/* Championships Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader className="w-10 h-10 text-red-500 animate-spin" />
          <p className="text-gray-400">{t('dashboard.loading', 'Cargando campeonatos...')}</p>
        </div>
      ) : (
        (() => {
          const myChampionships = championships.filter(c => c.is_member && !c.is_kicked);
          const availableChampionships = championships.filter(c => !c.is_member && !c.is_kicked);
          const listToFilter = activeTab === 'my-championships' ? myChampionships : availableChampionships;
          
          const filtered = listToFilter.filter(champ => {
            const query = searchQuery.toLowerCase().trim();
            if (!query) return true;
            const nameMatch = champ.name.toLowerCase().includes(query);
            const creatorMatch = (champ.creator_name || '').toLowerCase().includes(query);
            return nameMatch || creatorMatch;
          });

          if (filtered.length === 0) {
            return (
              <div className="glass rounded-2xl p-16 text-center border border-gray-800 space-y-4 animate-fadeIn">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto" />
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white">
                    {searchQuery ? t('dashboard.empty.search', 'No se encontraron resultados') : activeTab === 'my-championships' ? t('dashboard.empty.my_champs', 'No estás inscrito en ningún campeonato') : t('dashboard.empty.available', 'No hay campeonatos disponibles')}
                  </h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    {searchQuery 
                      ? t('dashboard.empty.search_desc', 'Prueba a cambiar los términos de búsqueda.') 
                      : activeTab === 'my-championships' 
                        ? t('dashboard.empty.my_champs_desc', 'Ve a la pestaña de "Campeonatos Disponibles" para inscribirte y competir en alguna liga activa.') 
                        : t('dashboard.empty.available_desc', 'Crea un campeonato nuevo utilizando el botón superior para empezar.')
                    }
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((champ) => {
                const isCreator = champ.created_by?.toLowerCase() === user.email.toLowerCase();
                return (
                  <div 
                    key={champ.id}
                    className="glass rounded-2xl border border-gray-800/80 overflow-hidden flex flex-col justify-between hover:border-red-500/40 hover:shadow-red-950/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  >
                    {/* Card Top */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-full uppercase tracking-wider">
                            Season {champ.season}
                          </span>
                          {champ.is_public === false ? (
                            <span className="px-2 py-1 bg-amber-600/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Private
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              Public
                            </span>
                          )}
                        </div>
                        <Trophy className="w-5 h-5 text-gray-550 group-hover:text-red-500 transition-colors" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <h3 className="text-xl font-bold text-white leading-tight group-hover:text-red-400 transition-colors">
                          {champ.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <User className="w-3.5 h-3.5 text-gray-550" />
                          <span>Creador: <strong className="text-gray-300">{isCreator ? 'Tú' : champ.creator_name || 'System'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Card Stats */}
                    {/* Card Stats */}
                    <div className="px-6 py-4 bg-[#0F0F12]/40 border-t border-gray-800/50 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-550" />
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Equipos</p>
                          <p className="text-sm font-semibold text-gray-200">{champ.team_count} / {champ.max_teams ?? 10}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-555" />
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Circuitos</p>
                          <p className="text-sm font-semibold text-gray-200">{champ.circuit_count} / {champ.max_circuits ?? 15}</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Action */}
                    <button
                      onClick={() => navigate('/championship/' + champ.id)}
                      className="w-full py-4 bg-[#16161C] hover:bg-red-600 text-gray-400 hover:text-white text-xs font-bold tracking-wider uppercase border-t border-gray-800/80 flex items-center justify-center gap-2 group-hover:border-red-500/20 transition-all font-mono"
                    >
                      Ver Detalles del Campeonato
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })()
      )}
    </div>
  );
};

export default Dashboard;
