import React, { useState, useEffect } from 'react';
import { 
  Wrench, Shield, Zap, Sun, CloudRain, Thermometer, Flag, AlertTriangle, Play,
  CheckCircle2, HelpCircle, History, MessageSquare, Award, Coins, CalendarDays, Timer, Activity, Unlock
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { formatLapTime } from '../../utils/timeFormat';
import LiveTimingTable from './LiveTimingTable';
import RaceResultsTable from './RaceResultsTable';
import QualifyingResultsTable from './QualifyingResultsTable';
import SessionLapsHistory from './SessionLapsHistory';
import DetailedLapsHistory from './DetailedLapsHistory';
import CircuitHeader from './CircuitHeader';
import StrategyForm from './StrategyForm';
import { useTranslation } from 'react-i18next';

const RaceCenter = ({ championship, circuit, apiFetch, showToast, userRole, todayStr }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  
  const determineInitialTab = () => {
    if (circuit?.status === 'completed') return 'race';
    if (!todayStr) return 'practice';
    
    if (todayStr >= circuit.race_date) return 'race';
    if (todayStr === circuit.qualifying_date) return 'qualifying';
    return 'practice';
  };

  const [activeTab, setActiveTab] = useState(determineInitialTab); // 'practice', 'qualifying', 'race'
  
  // WebSockets Context
  const { socket } = useSocket();
  const [liveRace, setLiveRace] = useState({
    isActive: false,
    currentLap: 0,
    totalLaps: 0,
    standings: []
  });
  
  // GP State from backend
  const [gpData, setGpData] = useState(null);
  
  // Form State
  const [tireType, setTireType] = useState('medium');
  const [pilotFocus, setPilotFocus] = useState('balanced');
  const [setup, setSetup] = useState({
    engine: 0,
    gearbox: 0,
    suspension: 0,
    chassis: 0,
    wings: 0
  });
  
  const [practiceLapsInput, setPracticeLapsInput] = useState(5);
  const [qualifyingLapsInput, setQualifyingLapsInput] = useState(1);
  const [isGlobalBypass, setIsGlobalBypass] = useState(circuit.bypass_restrictions);

  useEffect(() => {
    setIsGlobalBypass(circuit.bypass_restrictions);
  }, [circuit.bypass_restrictions]);
  const [simulating, setSimulating] = useState(false);

  const handleToggleGlobalBypass = async () => {
    try {
      setSimulating(true);
      const res = await apiFetch(`/api/championships/${championship.id}/circuits/${circuit.id}/bypass`, {
        method: 'PUT',
        body: JSON.stringify({ status: !isGlobalBypass })
      });
      setIsGlobalBypass(res.bypass_restrictions);
      showToast(res.bypass_restrictions ? 'Bypass activado: Sesiones abiertas.' : 'Bypass desactivado.', 'success');
      fetchGPStatus(); // Refresh to update dates/permissions locally if needed
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSimulating(false);
    }
  };

  // Fetch GP simulation status
  const fetchGPStatus = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/simulation/status/${championship.id}/${circuit.id}`);
      setGpData(data);
      
      // Pre-fill strategy form if exists
      if (data.teamStatus) {
        setTireType(data.teamStatus.race_tire_type || 'medium');
        setPilotFocus(data.teamStatus.race_pilot_focus || 'balanced');
        setSetup({
          engine: data.teamStatus.race_setup_engine || 0,
          gearbox: data.teamStatus.race_setup_gearbox || 0,
          suspension: data.teamStatus.race_setup_suspension || 0,
          chassis: data.teamStatus.race_setup_chassis || 0,
          wings: data.teamStatus.race_setup_wings || 0
        });
      }
      // Detectar si la carrera está en curso (mid-race join)
      if (data.weather?.race?.status === 'in_progress' || (data.currentRaceLap > 0 && data.weather?.race?.status !== 'completed')) {
        setLiveRace(prev => ({
          ...prev,
          isActive: true,
          currentLap: data.currentRaceLap || 0,
          totalLaps: 12
        }));
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (championship?.id && circuit?.id) {
      fetchGPStatus();
    }
  }, [championship?.id, circuit?.id]);

  // Socket.IO Listeners
  useEffect(() => {
    if (!socket || !championship?.id || !circuit?.id) return;

    const roomId = { championshipId: championship.id, circuitId: circuit.id };
    socket.emit('join-gp-room', roomId);

    socket.on('qualifying-updated', () => {
      fetchGPStatus();
    });

    socket.on('race-started', (data) => {
      setLiveRace({ isActive: true, currentLap: 0, totalLaps: data.totalLaps, standings: [] });
      showToast('¡La carrera ha comenzado en vivo!', 'info');
    });

    socket.on('race-lap', (data) => {
      setLiveRace(prev => ({
        ...prev,
        currentLap: data.lap,
        standings: data.standings
      }));
    });

    socket.on('race-finished', () => {
      setLiveRace(prev => ({ ...prev, isActive: false }));
      fetchGPStatus();
      showToast('¡La carrera ha finalizado!', 'success');
    });

    return () => {
      socket.emit('leave-gp-room', roomId);
      socket.off('qualifying-updated');
      socket.off('race-started');
      socket.off('race-lap');
      socket.off('race-finished');
    };
  }, [socket, championship?.id, circuit?.id]);

  // Calculate sum of offsets
  const setupSum = setup.engine + setup.gearbox + setup.suspension + setup.chassis + setup.wings;
  const isSetupBalanced = setupSum === 0;

  const handleSliderChange = (param, val) => {
    setSetup(prev => ({
      ...prev,
      [param]: parseInt(val)
    }));
  };

  // 1. Simular Tanda de Entrenamientos
  const handlePracticeStint = async () => {
    if (!isSetupBalanced) {
      showToast('La suma de ajustes de setup debe ser 0', 'error');
      return;
    }
    try {
      setSimulating(true);
      const res = await apiFetch('/api/simulation/practice-stint', {
        method: 'POST',
        body: JSON.stringify({
          championship_id: championship.id,
          circuit_id: circuit.id,
          laps: practiceLapsInput,
          tire_type: tireType,
          pilot_focus: pilotFocus,
          setup_engine: setup.engine,
          setup_gearbox: setup.gearbox,
          setup_suspension: setup.suspension,
          setup_chassis: setup.chassis,
          setup_wings: setup.wings
        })
      });
      showToast(`¡Tanda de libres completada! Mejor tiempo: ${res.bestTime ? formatLapTime(res.bestTime) : 'Caída'}`, 'success');
      fetchGPStatus();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSimulating(false);
    }
  };

  // 2. Simular Clasificación
  const handleQualifyingStint = async () => {
    if (!isSetupBalanced) {
      showToast('La suma de ajustes de setup debe ser 0', 'error');
      return;
    }
    try {
      setSimulating(true);
      const res = await apiFetch('/api/simulation/qualifying-stint', {
        method: 'POST',
        body: JSON.stringify({
          championship_id: championship.id,
          circuit_id: circuit.id,
          laps: qualifyingLapsInput,
          tire_type: tireType,
          pilot_focus: pilotFocus,
          setup_engine: setup.engine,
          setup_gearbox: setup.gearbox,
          setup_suspension: setup.suspension,
          setup_chassis: setup.chassis,
          setup_wings: setup.wings
        })
      });
      showToast(`¡Clasificación completada! Mejor tiempo: ${res.bestTime ? formatLapTime(res.bestTime) : 'Caída'}`, 'success');
      fetchGPStatus();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSimulating(false);
    }
  };

  // 3. Guardar Estrategia de Carrera
  const handleSaveStrategy = async () => {
    if (!isSetupBalanced) {
      showToast('La suma de ajustes de setup debe ser 0', 'error');
      return;
    }
    try {
      setSimulating(true);
      await apiFetch('/api/simulation/save-strategy', {
        method: 'POST',
        body: JSON.stringify({
          championship_id: championship.id,
          circuit_id: circuit.id,
          tire_type: tireType,
          pilot_focus: pilotFocus,
          setup_engine: setup.engine,
          setup_gearbox: setup.gearbox,
          setup_suspension: setup.suspension,
          setup_chassis: setup.chassis,
          setup_wings: setup.wings
        })
      });
      showToast('Estrategia guardada para la carrera.', 'success');
      fetchGPStatus();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSimulating(false);
    }
  };

  // 4. Simular Carrera Completa
  const handleSimulateRace = async () => {
    try {
      setSimulating(true);
      await apiFetch('/api/simulation/race', {
        method: 'POST',
        body: JSON.stringify({
          championshipId: championship.id,
          circuitId: circuit.id,
          bypassTime: true // El admin siempre puede forzar la simulación de carrera
        })
      });
      showToast('Simulación en progreso. Cambiando a Live Timing...', 'success');
      setLiveRace(prev => ({ ...prev, isActive: true }));
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSimulating(false);
    }
  };

  if (loading || !gpData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 glass border border-gray-800 rounded-2xl">
        <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm">Cargando Race Center...</p>
      </div>
    );
  }

  const { weather, teamStatus, practiceLaps, qualifyingLaps, raceLaps, gridStatus, teamId } = gpData;
  const isRaceFinished = weather.race?.status === 'completed';

  // Clima correspondiente a la sesión activa
  const sessionWeatherMap = { practice: weather.practice, qualifying: weather.qualifying, race: weather.race };
  const currentWeather = sessionWeatherMap[activeTab];
  const sessionLabel = activeTab === 'practice' ? t('championship.strategy.practice', 'Entrenamientos') : activeTab === 'qualifying' ? t('championship.strategy.qualifying', 'Clasificación') : t('championship.strategy.race', 'Carrera');

  const isPracticeFinished = circuit.status === 'completed' || (todayStr && todayStr > circuit.practice_date);
  const isQualifyingFinished = circuit.status === 'completed' || (todayStr && todayStr > circuit.qualifying_date);

  return (
    <div className="glass border border-gray-850 rounded-3xl overflow-hidden shadow-2xl space-y-6 bg-gradient-to-b from-[#13131A] to-[#0D0D12] text-white">
      {/* GP Header & Climatología */}
      <CircuitHeader circuit={circuit} sessionLabel={sessionLabel} currentWeather={currentWeather} isGlobalBypass={isGlobalBypass} />

      {/* Bypass Horario para Admin */}
      {userRole === 'admin' && (
        <div className="px-6 flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl mx-6">
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-400">
              <strong>Bypass Global del Gran Premio:</strong> Abre los entrenamientos y clasificación para todos los usuarios sin importar la fecha.
            </span>
          </div>
          <button
            onClick={handleToggleGlobalBypass}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${isGlobalBypass ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {isGlobalBypass ? '🔓 Abierto (Bypass ON)' : '🔒 Cerrado (Normal)'}
          </button>
        </div>
      )}

      {/* Main Grid: Left strategy form, Right session logs & leaderboard */}
      <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COL 1: Strategy Formulation */}
        <div className="lg:col-span-1 space-y-6">
          <StrategyForm 
            teamId={teamId}
            tireType={tireType}
            setTireType={setTireType}
            pilotFocus={pilotFocus}
            setPilotFocus={setPilotFocus}
            setup={setup}
            handleSliderChange={handleSliderChange}
            isSetupBalanced={isSetupBalanced}
            setupSum={setupSum}
          />
        </div>

        {/* COL 2 & 3: Sessions Navigation & Telemetry/Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          {(() => {
            const isPracticeFuture = !isGlobalBypass && (todayStr && todayStr < circuit.practice_date);
            const isQualifyingFuture = !isGlobalBypass && (todayStr && todayStr < circuit.qualifying_date);
            const isRaceFuture = todayStr && todayStr < circuit.race_date;

            return (
              <>
          {/* Navigation tabs */}
          <div className="flex bg-[#101017] p-1.5 rounded-2xl border border-gray-850">
            {[
              { id: 'practice', label: `1. ${t('championship.race_center.free_practice', 'Entrenamientos Libres')}`, info: teamStatus ? `${15 - teamStatus.practice_laps_used} / 15 laps` : '15 / 15 laps' },
              { id: 'qualifying', label: `2. ${t('championship.strategy.qualifying', 'Clasificación')}`, info: teamStatus ? `${3 - teamStatus.qualifying_laps_used} / 3 laps` : '3 / 3 laps' },
              { id: 'race', label: `3. ${t('championship.strategy.race', 'Carrera')}`, info: isRaceFinished ? t('championship.calendar.completed', 'Completado') : t('championship.strategy.pending', 'Pendiente') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  activeTab === tab.id 
                    ? 'bg-red-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[9px] font-normal ${activeTab === tab.id ? 'text-red-200' : 'text-gray-500'}`}>
                  {tab.info}
                </span>
              </button>
            ))}
          </div>

          {/* TAB 1: Entrenamientos Libres */}
          {activeTab === 'practice' && (
            <div className="space-y-6">
              {teamId ? (
                isPracticeFuture ? (
                  <div className="bg-[#101017]/40 border border-gray-850 p-5 rounded-2xl text-center text-sm font-bold text-gray-300 italic tracking-wider flex flex-col items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-blue-400 mb-1" />
                    <span>Los entrenamientos libres aún no han comenzado.</span>
                    <span className="text-xs text-gray-500 font-normal">Programados para el {circuit.practice_date}</span>
                  </div>
                ) : isPracticeFinished ? (
                  <div className="bg-[#101017]/40 border border-gray-850 p-5 rounded-2xl text-center text-sm font-bold text-gray-300 italic uppercase tracking-wider">
                    {t('championship.race_center.practice_finished', 'Sesión de entrenamientos libres finalizada')}
                  </div>
                ) : (
                  <div className="bg-[#101017] border border-gray-850 p-5 rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Play className="w-4 h-4 text-red-500" />
                      Simular Tanda de Entrenamientos
                    </h4>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('championship.race_center.laps_to_do', 'Vueltas a realizar')} (Máx: {15 - teamStatus.practice_laps_used})</label>
                        <input 
                          type="number" 
                          min="1" 
                          max={15 - teamStatus.practice_laps_used}
                          value={practiceLapsInput}
                          onChange={(e) => setPracticeLapsInput(Math.min(15 - teamStatus.practice_laps_used, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-full bg-[#161622] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold"
                        />
                      </div>
                      <button
                        disabled={simulating || (15 - teamStatus.practice_laps_used) <= 0 || !isSetupBalanced}
                        onClick={handlePracticeStint}
                        className="h-[46px] self-end px-6 bg-red-600 hover:bg-red-500 text-xs font-bold rounded-xl transition-all disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-center gap-1.5"
                      >
                        {simulating ? 'Simulando...' : 'Rodar Tanda'}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="bg-[#101017]/40 border border-gray-850 p-5 rounded-2xl text-center text-xs text-gray-450 italic">
                  Los entrenamientos libres solo están disponibles para los participantes del campeonato.
                </div>
              )}

              {/* Radio del piloto (Feedback) */}
              {practiceLaps.length > 0 && (
                <div className="bg-gradient-to-r from-red-950/20 to-[#101017] border border-red-500/20 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4.5 h-4.5 text-red-400" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">{t('championship.race_center.pilot_radio', 'Mensaje de Radio del Piloto')}</span>
                  </div>
                  <blockquote className="text-sm italic text-gray-200">
                    "{practiceLaps[practiceLaps.length - 1].feedback_received || 'El piloto no tiene comentarios todavía.'}"
                  </blockquote>
                </div>
              )}

              {/* Historial de Vueltas */}
              {practiceLaps.length === 0 ? (
                <div className="bg-[#101017] border border-gray-850 rounded-2xl p-8 text-center text-gray-500 text-xs">
                  {teamId 
                    ? t('championship.race_center.no_practice_laps', 'No has rodado ninguna vuelta de entrenamientos todavía hoy.') 
                    : "No hay telemetría propia disponible para administradores sin equipo."}
                </div>
              ) : (
                <DetailedLapsHistory laps={practiceLaps} title="Telemetría del Día" bestTime={teamStatus?.best_practice_time} />
              )}
            </div>
          )}

          {/* TAB 2: Clasificación */}
          {activeTab === 'qualifying' && (
            <div className="space-y-6">
              {teamId ? (
                isQualifyingFuture ? (
                  <div className="bg-[#101017]/40 border border-gray-850 p-5 rounded-2xl text-center text-sm font-bold text-gray-300 italic tracking-wider flex flex-col items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-blue-400 mb-1" />
                    <span>La sesión de clasificación aún no ha comenzado.</span>
                    <span className="text-xs text-gray-500 font-normal">Programada para el {circuit.qualifying_date}</span>
                  </div>
                ) : isQualifyingFinished ? (
                  <div className="bg-[#101017]/40 border border-gray-850 p-5 rounded-2xl text-center text-sm font-bold text-gray-300 italic uppercase tracking-wider">
                    {t('championship.race_center.qualifying_finished', 'Sesión de clasificación finalizada')}
                  </div>
                ) : (
                  <div className="bg-[#101017] border border-gray-850 p-5 rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Play className="w-4 h-4 text-red-500" />
                      {t('championship.race_center.simulate_qualifying', 'Simular Clasificación')}
                    </h4>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('championship.race_center.laps_to_do', 'Vueltas a realizar')} (Máx: {3 - teamStatus.qualifying_laps_used})</label>
                        <input 
                          type="number" 
                          min="1" 
                          max={3 - teamStatus.qualifying_laps_used}
                          value={qualifyingLapsInput}
                          onChange={(e) => setQualifyingLapsInput(Math.min(3 - teamStatus.qualifying_laps_used, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-full bg-[#161622] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold"
                        />
                      </div>
                      <button
                        disabled={simulating || (3 - teamStatus.qualifying_laps_used) <= 0 || !isSetupBalanced}
                        onClick={handleQualifyingStint}
                        className="h-[46px] self-end px-6 bg-red-600 hover:bg-red-500 text-xs font-bold rounded-xl transition-all disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-center gap-1.5"
                      >
                        {simulating ? 'Simulando...' : t('championship.race_center.ride_qualifying', 'Rodar Clasificación')}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="bg-[#101017]/40 border border-gray-850 p-5 rounded-2xl text-center text-xs text-gray-450 italic">
                  La clasificación solo está disponible para los participantes del campeonato.
                </div>
              )}

              {/* Radio del piloto (Feedback) */}
              {qualifyingLaps.length > 0 && (
                <div className="bg-gradient-to-r from-red-950/20 to-[#101017] border border-red-500/20 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4.5 h-4.5 text-red-400" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">{t('championship.race_center.pilot_radio', 'Mensaje de Radio del Piloto')}</span>
                  </div>
                  <blockquote className="text-sm italic text-gray-200">
                    "{qualifyingLaps[qualifyingLaps.length - 1].feedback_received || 'El piloto no tiene comentarios todavía.'}"
                  </blockquote>
                </div>
              )}

              {/* Tu Telemetría de Clasificación */}
              {teamId && qualifyingLaps.length > 0 && (
                <DetailedLapsHistory laps={qualifyingLaps} title={t('championship.race_center.your_qualifying_telemetry', 'Tu Telemetría de Clasificación')} bestTime={teamStatus?.best_qualifying_time} />
              )}

              {/* Parrilla de Clasificación Actualizada */}
              <QualifyingResultsTable gridStatus={gridStatus} teamId={teamId} teamStatus={teamStatus} />
            </div>
          )}

          {/* TAB 3: Carrera */}
          {activeTab === 'race' && (
            <div className="space-y-6">
              {/* Formulario de Guardado de Estrategia */}
              {teamId && !isRaceFinished && (
                <div className="bg-[#101017] border border-gray-850 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">{t('championship.strategy.save_race_strategy', 'Guardar Estrategia de Carrera')}</h4>
                    <p className="text-xs text-gray-500">{t('championship.strategy.secure_setup_warning', 'Asegura tu setup, neumáticos y enfoque antes de que empiece la carrera (14:00h).')}</p>
                  </div>
                  <button
                    onClick={handleSaveStrategy}
                    disabled={simulating || !isSetupBalanced}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-xl transition-all disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-center gap-1.5"
                  >
                    {t('championship.strategy.save_strategy', 'Guardar Estrategia')}
                  </button>
                </div>
              )}

              {/* Botón de Simulación de Carrera (Admin) */}
              {!isRaceFinished && !liveRace.isActive && userRole === 'admin' && (
                <div className="bg-gradient-to-r from-yellow-600/10 to-[#101017] border border-yellow-500/20 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-yellow-500" />
                    <h4 className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Simulación de la Carrera</h4>
                  </div>
                  <p className="text-xs text-gray-400">
                    La carrera se simula de forma progresiva (vuelta a vuelta) para ofrecer Live Timing a todos los usuarios conectados.
                  </p>
                  
                  <button
                    disabled={simulating}
                    onClick={handleSimulateRace}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-extrabold text-sm rounded-xl transition-all disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    {simulating ? 'Iniciando Transmisión...' : '¡INICIAR CARRERA (LIVE)!'}
                  </button>
                </div>
              )}

              {/* Live Timing / Broadcasting en progreso */}
              {liveRace.isActive && (
                <LiveTimingTable liveRace={liveRace} />
              )}

              {/* Resultados Finales de la Carrera */}
              {isRaceFinished && (
                <RaceResultsTable gridStatus={gridStatus} teamId={teamId} />
              )}

              {/* Historial de Vueltas de la Carrera (si ya finalizó) */}
              {teamId && isRaceFinished && raceLaps.length > 0 && (
                <SessionLapsHistory laps={raceLaps} title={t('championship.race_center.your_lap_by_lap', 'Tu Vuelta a Vuelta en Carrera')} />
              )}
            </div>
          )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default RaceCenter;
