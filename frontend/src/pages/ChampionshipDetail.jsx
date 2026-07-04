import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Users, Calendar, Trophy, Zap, Compass, Star, ChevronDown, 
  Check, Shield, MapPin, Gauge, Lock, Settings, Coins, Award, CalendarDays, Play, CheckCircle2 
} from 'lucide-react';

// Sub-components Imports
import CalendarList from '../components/championship/CalendarList';
import RegisteredTeamsGrid from '../components/championship/RegisteredTeamsGrid';
import RegisterTeamForm from '../components/championship/RegisterTeamForm';
import AddCircuitForm from '../components/championship/AddCircuitForm';
import RaceCenter from '../components/championship/RaceCenter';

const ChampionshipDetail = ({ showToast }) => {
  const { apiFetch, user } = useAuth();
  const navigate = useNavigate();
  const { id: championshipId } = useParams();
  
  // Today's date string in YYYY-MM-DD format for local timezone comparison
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  
  // Data States
  const [championship, setChampionship] = useState(null);
  const [teams, setTeams] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCircuit, setSelectedCircuit] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCompletedCircuit, setSelectedCompletedCircuit] = useState(null);

  useEffect(() => {
    if (championship?.circuits?.length > 0 && !selectedCircuit) {
      setSelectedCircuit(championship.circuits[0]);
    }
  }, [championship]);

  // Form States
  const [teamName, setTeamName] = useState('');
  const [pin, setPin] = useState('');
  const [registeringTeam, setRegisteringTeam] = useState(false);
  const [selectedCircuitId, setSelectedCircuitId] = useState('');
  const [addingCircuit, setAddingCircuit] = useState(false);

  // Expulsion States
  const [showKickModal, setShowKickModal] = useState(false);
  const [kickTargetTeam, setKickTargetTeam] = useState(null);
  const [kickReason, setKickReason] = useState('');
  const [kicking, setKicking] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Championship details (includes calendar & team count)
      const champData = await apiFetch(`/api/championships/${championshipId}`);
      setChampionship(champData);

      // Fetch teams in championship (API returns [] if user is not a member)
      const teamsData = await apiFetch(`/api/championships/${championshipId}/teams`);
      setTeams(teamsData);

      // Fetch all available circuits in db
      const circuitsData = await apiFetch('/api/circuits');
      setCircuits(circuitsData);

    } catch (error) {
      showToast(error.message, 'error');
      // If error occurs, go back to dashboard
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (championshipId) {
      fetchData();
    }
  }, [championshipId]);

  // Handle Team Registration
  const handleRegisterTeam = async (e) => {
    e.preventDefault();
    if (!teamName) {
      showToast('Please enter a team name', 'error');
      return;
    }
    if (championship && !championship.is_public && !pin) {
      showToast('Championship PIN is required', 'error');
      return;
    }

    setRegisteringTeam(true);
    try {
      const data = await apiFetch('/api/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: teamName,
          championship_id: parseInt(championshipId),
          pin: pin
        })
      });
      showToast(`Team registered! Hired pilot: ${data.assigned_pilot_name}. Motorcycle: ${data.assigned_motorcycle_name}.`, 'success');
      setTeamName('');
      setPin('');
      fetchData(); // reload
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setRegisteringTeam(false);
    }
  };

  // Handle Circuit Calendar Addition
  const handleAddCircuit = async (e) => {
    e.preventDefault();
    if (!selectedCircuitId) {
      showToast('Please select a circuit', 'error');
      return;
    }

    setAddingCircuit(true);
    const nextOrder = (championship?.circuits?.length || 0) + 1;

    try {
      await apiFetch('/api/calendar', {
        method: 'POST',
        body: JSON.stringify({
          championship_id: parseInt(championshipId),
          circuit_id: parseInt(selectedCircuitId),
          order: nextOrder
        })
      });
      showToast('Circuit added to calendar!', 'success');
      setSelectedCircuitId('');
      fetchData(); // reload
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setAddingCircuit(false);
    }
  };

  // Handle User Expulsion
  const handleKick = async (e) => {
    e.preventDefault();
    if (!kickReason.trim()) {
      showToast('El motivo de expulsión es obligatorio.', 'error');
      return;
    }
    setKicking(true);
    try {
      await apiFetch(`/api/championships/${championshipId}/kick`, {
        method: 'POST',
        body: JSON.stringify({
          user_email: kickTargetTeam.user_email,
          reason: kickReason
        })
      });
      showToast(`Mánager ${kickTargetTeam.owner_name} expulsado correctamente.`, 'success');
      setShowKickModal(false);
      setKickReason('');
      setKickTargetTeam(null);
      fetchData(); // reload
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setKicking(false);
    }
  };

  if (loading || !championship) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3 max-w-6xl mx-auto">
        <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
        <p className="text-gray-400">Loading championship details...</p>
      </div>
    );
  }

  // If user is kicked
  if (championship.kicked) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-fadeIn">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO DASHBOARD
        </button>
        
        <div className="glass rounded-2xl border border-red-500/20 p-8 text-center space-y-6 bg-gradient-to-br from-red-950/20 to-transparent">
          <div className="inline-flex items-center justify-center p-4 bg-red-600/10 border border-red-500/25 rounded-2xl">
            <Shield className="w-12 h-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Has sido expulsado de este campeonato</h2>
            <p className="text-gray-450 text-sm max-w-md mx-auto leading-relaxed">
              Un organizador (Master o Admin) te ha retirado la participación activa de este torneo.
            </p>
          </div>
          {championship.kick_reason && (
            <div className="bg-[#0F0F12]/80 border border-red-500/10 p-5 rounded-2xl max-w-lg mx-auto text-left space-y-1">
              <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider block">Motivo especificado:</span>
              <p className="text-gray-300 text-sm leading-relaxed italic">"{championship.kick_reason}"</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check if current logged-in user already has a team in this championship
  const userTeam = teams.find(t => t.user_email && t.user_email.toLowerCase() === user.email.toLowerCase());
  
  // A user is a member if they have registered a team (teams array will contain their team)
  const isMember = teams.some(t => t.user_email && t.user_email.toLowerCase() === user.email.toLowerCase());

  // Check if current logged-in user created this championship
  const isCreator = championship.created_by?.toLowerCase() === user.email.toLowerCase();

  // Find the active GP (first scheduled circuit in calendar)
  const activeGP = championship.circuits?.find(c => c.status === 'scheduled');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 animate-fadeIn">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO DASHBOARD
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-white">{championship.name}</h1>
              <span className="px-3 py-1 bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-full uppercase tracking-wider">
                Season {championship.season}
              </span>
              {championship.is_public === false && (
                <span className="px-2 py-1 bg-amber-600/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 self-center">
                  <Lock className="w-3.5 h-3.5" />
                  Private
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              Start Date: <strong className="text-gray-200">{championship.start_date.split('T')[0]}</strong> • 
              Creator: <strong className="text-gray-250">{isCreator ? 'You (Creator)' : championship.creator_name || 'System'}</strong>
              {isCreator && !championship.is_public && (
                <>
                  {' '}• Access PIN: <strong className="text-amber-500 font-mono select-all bg-amber-600/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs font-bold tracking-wider">{championship.pin}</strong>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-800 gap-6 text-sm font-semibold select-none">
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setSelectedCompletedCircuit(null);
          }}
          className={`pb-4 px-1 border-b-2 transition-all duration-200 ${
            activeTab === 'dashboard'
              ? 'border-red-500 text-white font-bold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => {
            setActiveTab('calendar');
            setSelectedCompletedCircuit(null);
          }}
          className={`pb-4 px-1 border-b-2 transition-all duration-200 ${
            activeTab === 'calendar'
              ? 'border-red-500 text-white font-bold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Calendario
        </button>
        {activeGP && (isMember || user.role === 'admin') && todayStr >= activeGP.practice_date && (
          <button
            onClick={() => {
              setActiveTab('gp');
              setSelectedCompletedCircuit(null);
            }}
            className={`pb-4 px-1 border-b-2 transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'gp'
                ? 'border-red-500 text-white font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {isMember && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0"></span>}
            GP Activo: {activeGP.name}
          </button>
        )}
      </div>

      {/* TAB: Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Información de mi equipo o formulario de inscripción */}
          <div className="lg:col-span-1 space-y-6">
            {isMember && userTeam ? (
              <div className="glass rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                <div className="p-5 bg-gradient-to-r from-red-600/10 via-transparent to-transparent border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-5 h-5 text-red-500" />
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{userTeam.team_name}</h3>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-light">Mi Escudería</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-bold text-yellow-500">
                    <Coins className="w-3.5 h-3.5" />
                    {userTeam.balance?.toLocaleString()} €
                  </div>
                </div>
                <div className="p-5 space-y-6">
                  {/* Piloto */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Piloto</span>
                      <span className="text-sm font-bold text-white">{userTeam.pilot_name}</span>
                    </div>
                    <div className="space-y-2 bg-[#0F0F12]/60 p-3 rounded-xl border border-gray-850">
                      <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-gray-400">Talento</span>
                          <span className="text-red-400 font-bold">{userTeam.talent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                          <div style={{ width: `${userTeam.talent}%` }} className="h-full bg-red-655 rounded-full"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-gray-400">Consistencia</span>
                          <span className="text-red-400 font-bold">{userTeam.consistency}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                          <div style={{ width: `${userTeam.consistency}%` }} className="h-full bg-red-655 rounded-full"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-gray-400">Agresividad</span>
                          <span className="text-red-400 font-bold">{userTeam.aggressiveness}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                          <div style={{ width: `${userTeam.aggressiveness}%` }} className="h-full bg-red-655 rounded-full"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/40 text-center mt-2">
                        <div>
                          <p className="text-[9px] text-gray-505 uppercase font-bold">Experiencia</p>
                          <p className="text-xs font-semibold text-gray-300">{userTeam.experience}%</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-505 uppercase font-bold">Estado Físico</p>
                          <p className="text-xs font-semibold text-gray-300">{userTeam.fitness}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Moto */}
                  <div className="space-y-3 pt-4 border-t border-gray-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Moto</span>
                      <span className="text-sm font-bold text-white">{userTeam.motorcycle_name}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { label: 'Motor', val: userTeam.engine },
                        { label: 'Cambio', val: userTeam.gearbox },
                        { label: 'Susp.', val: userTeam.suspension },
                        { label: 'Chasis', val: userTeam.chassis },
                        { label: 'Alerón', val: userTeam.wings }
                      ].map((part, i) => (
                        <div key={i} className="bg-[#0F0F12]/60 border border-gray-850 p-2 rounded-xl text-center">
                          <p className="text-[8px] text-gray-500 block uppercase tracking-tight">{part.label}</p>
                          <p className="text-xs font-bold text-orange-400 mt-0.5">{part.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="glass rounded-2xl border border-gray-800 p-6 flex flex-col gap-3 bg-gradient-to-r from-red-600/10 via-transparent to-transparent">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-red-500" />
                    <div>
                      <h2 className="text-lg font-bold text-white">Inscripción al Campeonato</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Crea tu equipo para competir y ver la telemetría.</p>
                    </div>
                  </div>
                </div>

                {championship.team_count < 10 ? (
                  <RegisterTeamForm 
                    onSubmit={handleRegisterTeam} 
                    teamName={teamName} 
                    setTeamName={setTeamName} 
                    pin={pin}
                    setPin={setPin}
                    registeringTeam={registeringTeam} 
                    championship={championship}
                  />
                ) : (
                  <div className="p-4 bg-gray-950/20 border border-gray-800 rounded-2xl text-center text-sm text-gray-455">
                    La parrilla está completa (10/10 equipos registrados).
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Columna Derecha & Centro: Clasificación General y Próxima Carrera */}
          <div className="lg:col-span-2 space-y-8">
            {/* Clasificación General */}
            <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-yellow-600/10 via-transparent to-transparent border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-bold text-white text-base">Clasificación General</h3>
                </div>
                <span className="px-3 py-1 bg-[#0F0F12] border border-gray-800 text-xs font-semibold rounded-full text-gray-300">
                  {championship.team_count} Equipos Registrados
                </span>
              </div>
              
              {teams.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Aún no hay puntuaciones registradas en el campeonato.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-[#161622]/60 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800">
                      <tr>
                        <th className="p-4">Pos</th>
                        <th className="p-4">Equipo</th>
                        <th className="p-4">Piloto</th>
                        <th className="p-4">Moto</th>
                        <th className="p-4 text-right">Puntos</th>
                        {(user.role === 'admin' || (isCreator && !championship.is_public && !championship.circuits?.some(c => c.status === 'completed'))) && (
                          <th className="p-4 text-right">Acciones</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-855/60">
                      {teams.map((team, idx) => {
                        const isOwner = team.user_email && team.user_email.toLowerCase() === user.email.toLowerCase();
                        const hasStarted = championship.circuits?.some(c => c.status === 'completed');
                        const canKick = (user.role === 'admin' || (isCreator && !championship.is_public && !hasStarted)) && !isOwner;
                        return (
                          <tr 
                            key={team.id} 
                            className={`transition-colors ${
                              isOwner ? 'bg-red-955/15 text-white font-semibold' : 'hover:bg-[#16161C]/30'
                            }`}
                          >
                            <td className="p-4 font-mono font-bold text-gray-500">#{idx + 1}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${team.is_kicked ? 'text-gray-500 line-through' : 'text-white'}`}>{team.team_name}</span>
                                {isOwner && (
                                  <span className="px-1.5 py-0.5 bg-red-600/20 border border-red-500/20 rounded text-[9px] text-red-505 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Shield className="w-2.5 h-2.5" />
                                    Tú
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-gray-400 block mt-0.5">
                                Mánager: {team.owner_name} {team.is_kicked && '(Expulsado)'}
                              </span>
                            </td>
                            <td className="p-4 text-gray-350">{team.is_kicked ? <span className="text-gray-500 italic">N/A</span> : team.pilot_name}</td>
                            <td className="p-4 text-gray-400">{team.is_kicked ? <span className="text-gray-500 italic">N/A</span> : (team.motorcycle_name || 'GP Bike')}</td>
                            <td className="p-4 text-right font-mono font-extrabold text-red-400 text-base">
                              {team.total_points || 0} pts
                            </td>
                            {(user.role === 'admin' || (isCreator && !championship.is_public && !hasStarted)) && (
                              <td className="p-4 text-right">
                                {canKick && !team.is_kicked && (
                                  <button
                                    onClick={() => {
                                      setKickTargetTeam(team);
                                      setKickReason('');
                                      setShowKickModal(true);
                                    }}
                                    className="px-2.5 py-1.5 bg-red-600/10 hover:bg-red-650 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-all"
                                  >
                                    Expulsar
                                  </button>
                                )}
                                {team.is_kicked && (
                                  <span 
                                    className="text-[10px] text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1 rounded select-none cursor-help font-mono font-bold"
                                    title={`Motivo: ${team.kick_reason || 'No especificado'}`}
                                  >
                                    Expulsado
                                  </span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Próxima Carrera */}
            <div>
              {activeGP ? (
                <div className="glass rounded-2xl border border-gray-800 overflow-hidden shadow-xl bg-gradient-to-br from-[#161622]/20 to-transparent">
                  <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-yellow-500" />
                      <h3 className="font-bold text-white text-base">Siguiente Carrera</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold rounded-full uppercase tracking-wider">
                      GP #{activeGP.order}
                    </span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="text-xl font-extrabold text-white">{activeGP.name}</h4>
                      <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                        Longitud: <strong className="text-white font-semibold">{activeGP.distance}m</strong> • Curvas R/L: <strong className="text-white font-semibold">{activeGP.curves_right}/{activeGP.curves_left}</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-gray-800/40 pt-4 text-[10px] text-center">
                      <div className="bg-[#0F0F12] p-2.5 rounded-xl border border-gray-850">
                        <span className="text-gray-500 font-bold uppercase tracking-wider block">Entrenamientos</span>
                        <span className="text-gray-300 font-semibold mt-0.5 block">{activeGP.practice_date}</span>
                      </div>
                      <div className="bg-[#0F0F12] p-2.5 rounded-xl border border-gray-850">
                        <span className="text-gray-500 font-bold uppercase tracking-wider block">Clasificación</span>
                        <span className="text-gray-300 font-semibold mt-0.5 block">{activeGP.qualifying_date}</span>
                      </div>
                      <div className="bg-[#0F0F12] p-2.5 rounded-xl border border-gray-850">
                        <span className="text-red-500 font-bold uppercase tracking-wider block">Carrera</span>
                        <span className="text-red-400 font-bold mt-0.5 block">{activeGP.race_date}</span>
                      </div>
                    </div>
                    
                    {(isMember || user.role === 'admin') && todayStr >= activeGP.practice_date && (
                      <button
                        onClick={() => {
                          setActiveTab('gp');
                        }}
                        className="w-full mt-2 py-3 bg-red-650 hover:bg-red-550 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-4 h-4" />
                        Simular este circuito
                      </button>
                    )}
                  </div>
                </div>
              ) : !championship.circuits || championship.circuits.length === 0 ? (
                <div className="glass rounded-2xl border border-gray-800 p-8 text-center space-y-3 bg-gradient-to-r from-gray-600/10 via-transparent to-transparent">
                  <Calendar className="w-10 h-10 text-gray-500 mx-auto" />
                  <h4 className="text-base font-bold text-white">Sin Circuitos Programados</h4>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
                    {isCreator 
                      ? "Aún no has añadido ningún circuito a este campeonato. Dirígete a la pestaña de Calendario para programar las carreras."
                      : "Aún no se han programado circuitos en el calendario de este campeonato. Por favor, espera a que el organizador añada las carreras."
                    }
                  </p>
                </div>
              ) : (
                <div className="glass rounded-2xl border border-gray-800 p-8 text-center space-y-3 bg-gradient-to-r from-yellow-600/10 via-transparent to-transparent">
                  <Trophy className="w-10 h-10 text-yellow-500 mx-auto animate-bounce animate-pulse" />
                  <h4 className="text-base font-bold text-white">¡Campeonato Finalizado!</h4>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
                    Todas las carreras del campeonato han sido simuladas. Consulta la Clasificación General para ver el podio final.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Calendario */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {selectedCompletedCircuit ? (
            <div className="space-y-4 animate-fadeIn">
              <button
                onClick={() => setSelectedCompletedCircuit(null)}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors self-start bg-gray-800/40 px-3.5 py-2 border border-gray-800 rounded-xl"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                VOLVER AL CALENDARIO
              </button>
              
              <RaceCenter 
                championship={championship}
                circuit={selectedCompletedCircuit}
                apiFetch={apiFetch}
                showToast={showToast}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendario de Carreras */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-yellow-600/10 via-transparent to-transparent border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-yellow-555" />
                      <h2 className="text-xl font-bold text-white">Calendario de Carreras</h2>
                    </div>
                    <span className="px-3 py-1 bg-[#0F0F12] border border-gray-805 text-xs font-semibold rounded-full text-gray-300">
                      {championship.circuits?.length || 0} / 15 Grandes Premios
                    </span>
                  </div>

                  {/* CalendarList */}
                  <CalendarList 
                    circuits={championship.circuits} 
                    selectedCircuit={null}
                    onSelectCircuit={(circ) => {
                      if (circ.status === 'completed') {
                        setSelectedCompletedCircuit(circ);
                      } else {
                        showToast(`El GP de ${circ.name} está programado pero aún no se ha disputado.`, 'info');
                      }
                    }}
                  />
                  <div className="p-4 bg-[#161622]/40 border-t border-gray-850 text-[11px] text-gray-450 italic text-center">
                    Haz click sobre una carrera realizada (verde) para ver su clasificación y telemetría.
                  </div>
                </div>
              </div>

              {/* Formulario de Añadir circuito (para el creador) */}
              <div className="lg:col-span-1 space-y-6">
                {isCreator && (!championship.circuits || championship.circuits.length < 15) && (
                  <AddCircuitForm 
                    onSubmit={handleAddCircuit}
                    circuits={circuits}
                    championshipCircuits={championship.circuits}
                    selectedCircuitId={selectedCircuitId}
                    setSelectedCircuitId={setSelectedCircuitId}
                    addingCircuit={addingCircuit}
                  />
                )}

                {championship.circuits?.length >= 15 && (
                  <div className="p-4 bg-yellow-950/20 border border-yellow-900/30 rounded-2xl flex items-center gap-3">
                    <Check className="w-5 h-5 text-yellow-500 shrink-0" />
                    <p className="text-xs text-yellow-350 leading-relaxed">
                      Este campeonato ha alcanzado el límite máximo de 15 circuitos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: GP Activo */}
      {activeTab === 'gp' && activeGP && (
        <div className="space-y-6">
          {(isMember || user.role === 'admin') ? (
            <RaceCenter 
              championship={championship}
              circuit={activeGP}
              apiFetch={apiFetch}
              showToast={showToast}
            />
          ) : (
            <div className="glass rounded-2xl border border-gray-800 p-8 text-center space-y-4 max-w-2xl mx-auto bg-gradient-to-r from-red-600/10 via-transparent to-transparent">
              <Users className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="text-xl font-bold text-white">¡No registrado en el campeonato!</h3>
              <p className="text-sm text-gray-450 leading-relaxed">
                Debes inscribir tu escudería en la pestaña de Dashboard antes de poder simular el fin de semana del Gran Premio de {activeGP.name}.
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Ir a Inscribirme
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Expulsar Usuario */}
      {showKickModal && kickTargetTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md glass rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600/20 to-transparent p-6 border-b border-gray-800 flex items-center gap-3">
              <Shield className="w-6 h-6 text-red-500" />
              <div>
                <h2 className="text-lg font-extrabold text-white">Expulsar Mánager</h2>
                <p className="text-xs text-gray-400 mt-0.5">Retirar al usuario del campeonato</p>
              </div>
            </div>
            
            <form onSubmit={handleKick} className="p-6 space-y-4">
              <div className="bg-red-600/5 border border-red-500/10 p-3.5 rounded-xl text-xs text-red-400">
                Estás a punto de expulsar a <strong className="text-white">{kickTargetTeam.owner_name}</strong> (Equipo: {kickTargetTeam.team_name}). Su coche y piloto quedarán inactivos pero mantendrá su puntuación histórica.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400">Motivo de la expulsión (Obligatorio)</label>
                <textarea
                  value={kickReason}
                  onChange={(e) => setKickReason(e.target.value)}
                  placeholder="Ej. Inactividad prolongada o comportamiento antideportivo..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-red-500 focus:outline-none text-white text-sm"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowKickModal(false);
                    setKickTargetTeam(null);
                    setKickReason('');
                  }}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={kicking}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {kicking ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'EXPULSAR'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChampionshipDetail;
