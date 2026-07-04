import React, { useState, useEffect } from 'react';
import { 
  Wrench, Shield, Zap, Sun, CloudRain, Thermometer, Flag, AlertTriangle, Play,
  CheckCircle2, HelpCircle, History, MessageSquare, Award, Coins, CalendarDays, Timer
} from 'lucide-react';

const formatLapTime = (timeInSeconds) => {
  if (timeInSeconds === null || timeInSeconds === undefined || isNaN(timeInSeconds) || timeInSeconds === 0) {
    return '--';
  }
  const totalMs = Math.round(parseFloat(timeInSeconds) * 1000);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};

const SetupCell = ({ value }) => {
  const v = parseInt(value) || 0;
  const color = v > 0 ? 'text-emerald-400' : v < 0 ? 'text-rose-400' : 'text-gray-500';
  return <span className={`font-mono font-bold ${color}`}>{v > 0 ? `+${v}` : v}</span>;
};

const RaceCenter = ({ championship, circuit, apiFetch, showToast }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('practice'); // 'practice', 'qualifying', 'race'
  
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
  const [bypassTime, setBypassTime] = useState(false);
  const [simulating, setSimulating] = useState(false);

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
          setup_wings: setup.wings,
          bypassTime
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
          setup_wings: setup.wings,
          bypassTime
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
          bypassTime
        })
      });
      showToast('¡Carrera simulada! Consulta los resultados.', 'success');
      fetchGPStatus();
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

  const { weekend, teamStatus, practiceLaps, qualifyingLaps, raceLaps, gridStatus, teamId } = gpData;
  const isRaceFinished = weekend.status === 'completed';

  return (
    <div className="glass border border-gray-850 rounded-3xl overflow-hidden shadow-2xl space-y-6 bg-gradient-to-b from-[#13131A] to-[#0D0D12] text-white">
      {/* GP Header & Climatología */}
      <div className="p-6 bg-gradient-to-r from-red-950/20 via-transparent to-transparent border-b border-gray-850 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Race Center
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-1">{circuit.name}</h2>
          <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
            <Timer className="w-3.5 h-3.5 text-gray-500" />
            Distancia: <strong>{circuit.distance}m</strong> • Curvas: <strong>{circuit.curves_right} Der / {circuit.curves_left} Izq</strong>
          </p>
        </div>

        {/* Climatología Widget */}
        <div className="flex items-center gap-4 bg-[#161622]/60 border border-gray-800 px-4 py-3 rounded-2xl">
          {weekend.weather_condition === 'rainy' ? (
            <CloudRain className="w-10 h-10 text-blue-400 animate-pulse" />
          ) : (
            <Sun className="w-10 h-10 text-amber-500 animate-spin-slow" />
          )}
          <div className="text-xs space-y-0.5">
            <div className="font-bold uppercase tracking-wider text-gray-300">
              Clima: <span className={weekend.weather_condition === 'rainy' ? 'text-blue-400' : 'text-amber-500'}>
                {weekend.weather_condition === 'rainy' ? `Lluvia (${weekend.rain_percentage}%)` : weekend.weather_condition === 'cloudy' ? 'Nublado' : 'Soleado'}
              </span>
            </div>
            <div className="flex gap-3 text-gray-400">
              <span className="flex items-center gap-0.5"><Thermometer className="w-3.5 h-3.5 text-red-400" /> Aire: <strong>{weekend.temp_ambient}ºC</strong></span>
              <span className="flex items-center gap-0.5"><Thermometer className="w-3.5 h-3.5 text-orange-400" /> Asfalto: <strong>{weekend.temp_asphalt}ºC</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Bypass Horario para Dev testing */}
      <div className="px-6 flex items-center justify-between bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-2xl mx-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="text-xs text-gray-400">
            <strong>Bypass de restricciones horarias:</strong> Actívalo para simular en cualquier momento sin esperar la ventana horaria (12h-15h).
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={bypassTime} 
            onChange={(e) => setBypassTime(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
        </label>
      </div>

      {/* Main Grid: Left strategy form, Right session logs & leaderboard */}
      <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COL 1: Strategy Formulation */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#101017] border border-gray-850 p-5 rounded-2xl space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
              <Wrench className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Ajustes del Mánager</h3>
            </div>

            {/* Tire Compound selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Compuesto de Neumático</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'soft', label: 'Soft (Blando)', color: 'border-red-500 text-red-400 bg-red-950/10' },
                  { id: 'medium', label: 'Medium (Medio)', color: 'border-yellow-500 text-yellow-400 bg-yellow-950/10' },
                  { id: 'hard', label: 'Hard (Duro)', color: 'border-gray-400 text-gray-300 bg-gray-800/10' },
                  { id: 'rain', label: 'Rain (Agua)', color: 'border-blue-500 text-blue-400 bg-blue-950/10' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTireType(t.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      tireType === t.id ? `${t.color} ring-2 ring-offset-2 ring-offset-[#101017] ring-red-500` : 'border-gray-800 bg-[#161622] hover:border-gray-700 text-gray-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pilot Focus selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Enfoque del Piloto</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'conservative', label: 'Conservador', desc: 'Ahorro / Seguro' },
                  { id: 'balanced', label: 'Equilibrado', desc: 'Standard' },
                  { id: 'aggressive', label: 'Agresivo', desc: 'Rápido / Caídas' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setPilotFocus(f.id)}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all ${
                      pilotFocus === f.id ? 'border-red-500 text-red-500 bg-red-950/10' : 'border-gray-800 bg-[#161622] hover:border-gray-700 text-gray-400'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="text-[9px] font-normal text-gray-500">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Motorcycle sliders */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Puesta a Punto (Setup)</label>
                <div className={`flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  isSetupBalanced ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/20' : 'bg-rose-950/30 text-rose-400 border border-rose-500/20'
                }`}>
                  {isSetupBalanced ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Balanceado
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                      Suma: {setupSum > 0 ? `+${setupSum}` : setupSum} (Debe ser 0)
                    </>
                  )}
                </div>
              </div>

              {[
                { id: 'engine', label: 'Motor (Engine)', color: 'accent-red-500' },
                { id: 'gearbox', label: 'Caja Cambios (Gearbox)', color: 'accent-orange-500' },
                { id: 'suspension', label: 'Suspensión (Suspension)', color: 'accent-blue-500' },
                { id: 'chassis', label: 'Chasis (Chassis)', color: 'accent-teal-500' },
                { id: 'wings', label: 'Alerones (Wings)', color: 'accent-indigo-500' }
              ].map((s) => (
                <div key={s.id} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{s.label}</span>
                    <span className={`font-mono font-bold ${setup[s.id] > 0 ? 'text-emerald-400' : setup[s.id] < 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                      {setup[s.id] > 0 ? `+${setup[s.id]}` : setup[s.id]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={setup[s.id]}
                    onChange={(e) => handleSliderChange(s.id, e.target.value)}
                    className={`w-full bg-gray-800 rounded-lg appearance-none h-1.5 cursor-pointer ${s.color}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COL 2 & 3: Sessions Navigation & Telemetry/Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation tabs */}
          <div className="flex bg-[#101017] p-1.5 rounded-2xl border border-gray-850">
            {[
              { id: 'practice', label: '1. Entrenamientos Libres', info: `${15 - teamStatus.practice_laps_used} / 15 laps` },
              { id: 'qualifying', label: '2. Clasificación', info: `${3 - teamStatus.qualifying_laps_used} / 3 laps` },
              { id: 'race', label: '3. Carrera', info: isRaceFinished ? 'Completado' : 'Pendiente' }
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
              <div className="bg-[#101017] border border-gray-850 p-5 rounded-2xl space-y-4">
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-red-500" />
                  Simular Tanda de Entrenamientos
                </h4>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vueltas a realizar (Máx: {15 - teamStatus.practice_laps_used})</label>
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

              {/* Radio del piloto (Feedback) */}
              {practiceLaps.length > 0 && (
                <div className="bg-gradient-to-r from-red-950/20 to-[#101017] border border-red-500/20 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4.5 h-4.5 text-red-400" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Mensaje de Radio del Piloto</span>
                  </div>
                  <blockquote className="text-sm italic text-gray-200">
                    "{practiceLaps[practiceLaps.length - 1].feedback_received || 'El piloto no tiene comentarios todavía.'}"
                  </blockquote>
                </div>
              )}

              {/* Historial de Vueltas */}
              <div className="bg-[#101017] border border-gray-850 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-850 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-gray-500" />
                    Telemetría del Día
                  </span>
                  <span className="text-xs text-gray-400">
                    Mejor tiempo: <strong className="text-red-400">{formatLapTime(teamStatus.best_practice_time)}</strong>
                  </span>
                </div>
                {practiceLaps.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs">
                    No has rodado ninguna vuelta de entrenamientos todavía hoy.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#161622] text-gray-400 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="p-3" rowSpan={2}>Vuelta</th>
                          <th className="p-3" rowSpan={2}>Tanda</th>
                          <th className="p-3" rowSpan={2}>Tiempo de Vuelta</th>
                          <th className="p-3" rowSpan={2}>Desgaste Neumático</th>
                          <th className="p-3" rowSpan={2}>Neumático</th>
                          <th className="p-3" rowSpan={2}>Enfoque</th>
                          <th className="p-3 text-center border-l border-gray-800" colSpan={5}>
                            <span className="flex items-center justify-center gap-1">
                              <Wrench className="w-3 h-3 text-red-500" />
                              Setup de Moto
                            </span>
                          </th>
                        </tr>
                        <tr>
                          <th className="p-2 text-center text-[9px] border-l border-gray-800">Motor</th>
                          <th className="p-2 text-center text-[9px]">Caja</th>
                          <th className="p-2 text-center text-[9px]">Susp.</th>
                          <th className="p-2 text-center text-[9px]">Chasis</th>
                          <th className="p-2 text-center text-[9px]">Alerón</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {practiceLaps.map((lap) => (
                          <tr key={lap.id} className={lap.has_crashed ? 'bg-red-950/10 text-red-400' : ''}>
                            <td className="p-3 font-mono">#{lap.lap_number}</td>
                            <td className="p-3">Tanda {lap.stint_number}</td>
                            <td className="p-3 font-mono font-bold">
                              {lap.has_crashed ? 'CAÍDA' : formatLapTime(lap.lap_time)}
                            </td>
                            <td className="p-3 font-mono">{lap.tire_wear_pct}%</td>
                            <td className="p-3 font-bold uppercase">{lap.tire_type}</td>
                            <td className="p-3 text-gray-400">{lap.pilot_focus}</td>
                            <td className="p-2 text-center border-l border-gray-800/50"><SetupCell value={lap.setup_engine} /></td>
                            <td className="p-2 text-center"><SetupCell value={lap.setup_gearbox} /></td>
                            <td className="p-2 text-center"><SetupCell value={lap.setup_suspension} /></td>
                            <td className="p-2 text-center"><SetupCell value={lap.setup_chassis} /></td>
                            <td className="p-2 text-center"><SetupCell value={lap.setup_wings} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Clasificación */}
          {activeTab === 'qualifying' && (
            <div className="space-y-6">
              <div className="bg-[#101017] border border-gray-850 p-5 rounded-2xl space-y-4">
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-red-500" />
                  Simular Clasificación (Time Attack)
                </h4>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vueltas a realizar (Máx: {3 - teamStatus.qualifying_laps_used})</label>
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
                    {simulating ? 'Simulando...' : 'Rodar Clasificación'}
                  </button>
                </div>
              </div>

              {/* Radio del piloto (Feedback) */}
              {qualifyingLaps.length > 0 && (
                <div className="bg-gradient-to-r from-red-950/20 to-[#101017] border border-red-500/20 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4.5 h-4.5 text-red-400" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Mensaje de Radio del Piloto</span>
                  </div>
                  <blockquote className="text-sm italic text-gray-200">
                    "{qualifyingLaps[qualifyingLaps.length - 1].feedback_received || 'El piloto no tiene comentarios todavía.'}"
                  </blockquote>
                </div>
              )}

              {/* Tu Telemetría de Clasificación */}
              {qualifyingLaps.length > 0 && (
                <div className="bg-[#101017] border border-gray-850 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-gray-850 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-4 h-4 text-gray-500" />
                      Tu Telemetría de Clasificación
                    </span>
                    <span className="text-xs text-gray-400">
                      Mejor tiempo: <strong className="text-red-400">{formatLapTime(teamStatus.best_qualifying_time)}</strong>
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#161622] text-gray-400 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="p-3" rowSpan={2}>Vuelta</th>
                          <th className="p-3" rowSpan={2}>Tanda</th>
                          <th className="p-3" rowSpan={2}>Tiempo de Vuelta</th>
                          <th className="p-3" rowSpan={2}>Desgaste Neumático</th>
                          <th className="p-3" rowSpan={2}>Neumático</th>
                          <th className="p-3" rowSpan={2}>Enfoque</th>
                          <th className="p-3 text-center border-l border-gray-800" colSpan={5}>
                            <span className="flex items-center justify-center gap-1">
                              <Wrench className="w-3 h-3 text-red-500" />
                              Setup de Moto
                            </span>
                          </th>
                        </tr>
                        <tr>
                          <th className="p-2 text-center text-[9px] border-l border-gray-800">Motor</th>
                          <th className="p-2 text-center text-[9px]">Caja</th>
                          <th className="p-2 text-center text-[9px]">Susp.</th>
                          <th className="p-2 text-center text-[9px]">Chasis</th>
                          <th className="p-2 text-center text-[9px]">Alerón</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {qualifyingLaps.map((lap) => (
                          <tr key={lap.id} className={lap.has_crashed ? 'bg-red-950/10 text-red-400' : ''}>
                            <td className="p-3 font-mono">#{lap.lap_number}</td>
                            <td className="p-3">Tanda {lap.stint_number}</td>
                            <td className="p-3 font-mono font-bold">
                              {lap.has_crashed ? 'CAÍDA' : formatLapTime(lap.lap_time)}
                            </td>
                            <td className="p-3 font-mono">{lap.tire_wear_pct}%</td>
                            <td className="p-3 font-bold uppercase">{lap.tire_type}</td>
                            <td className="p-3 text-gray-400">{lap.pilot_focus}</td>
                            <td className="p-2 text-center border-l border-gray-800/50"><SetupCell value={lap.setup_engine} /></td>
                            <td className="p-2 text-center"><SetupCell value={lap.setup_gearbox} /></td>
                            <td className="p-2 text-center"><SetupCell value={lap.setup_suspension} /></td>
                            <td className="p-2 text-center"><SetupCell value={lap.setup_chassis} /></td>
                            <td className="p-2 text-center"><SetupCell value={lap.setup_wings} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Parrilla de Clasificación Actualizada */}
              <div className="bg-[#101017] border border-gray-850 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-850 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-yellow-500" />
                    Tiempos de Clasificación Oficiales
                  </span>
                  <span className="text-xs text-gray-400">
                    Tu tiempo: <strong className="text-red-400">{formatLapTime(teamStatus.best_qualifying_time)}</strong>
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#161622] text-gray-400 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-3">Posición</th>
                        <th className="p-3">Piloto</th>
                        <th className="p-3">Equipo</th>
                        <th className="p-3">Mejor Vuelta</th>
                        <th className="p-3">Vueltas Usadas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850">
                      {gridStatus.map((t, idx) => (
                        <tr key={t.team_id} className={t.team_id === teamId ? 'bg-red-600/10 font-semibold' : ''}>
                          <td className="p-3 font-mono font-bold">#{idx + 1}</td>
                          <td className="p-3">{t.pilot_name}</td>
                          <td className="p-3 text-gray-350">{t.team_name} ({t.owner_name})</td>
                          <td className="p-3 font-mono font-bold text-yellow-500">
                            {formatLapTime(t.best_qualifying_time)}
                          </td>
                          <td className="p-3 text-gray-400">{t.qualifying_laps_used || 0} / 3</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Carrera */}
          {activeTab === 'race' && (
            <div className="space-y-6">
              {/* Formulario de Guardado de Estrategia */}
              {!isRaceFinished && (
                <div className="bg-[#101017] border border-gray-850 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Guardar Estrategia de Carrera</h4>
                    <p className="text-xs text-gray-500">Asegura tu setup, neumáticos y enfoque antes de que empiece la carrera (14:00h).</p>
                  </div>
                  <button
                    onClick={handleSaveStrategy}
                    disabled={simulating || !isSetupBalanced}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-xl transition-all disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-center gap-1.5"
                  >
                    Guardar Estrategia
                  </button>
                </div>
              )}

              {/* Botón de Simulación de Carrera */}
              {!isRaceFinished && (
                <div className="bg-gradient-to-r from-yellow-600/10 to-[#101017] border border-yellow-500/20 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-yellow-500" />
                    <h4 className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Simulación de la Carrera</h4>
                  </div>
                  <p className="text-xs text-gray-400">
                    La carrera es de **12 vueltas**. Se simula de una sola vez a partir de las **14:00h** del día de la carrera.
                  </p>
                  
                  <button
                    disabled={simulating}
                    onClick={handleSimulateRace}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-extrabold text-sm rounded-xl transition-all disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    {simulating ? 'Simulando Carrera...' : '¡SIMULAR CARRERA AHORA!'}
                  </button>
                </div>
              )}

              {/* Resultados Finales de la Carrera */}
              {isRaceFinished && (
                <div className="bg-[#101017] border border-gray-850 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-gray-850 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Flag className="w-4 h-4 text-red-500" />
                      Resultados Oficiales de la Carrera (12 Vueltas)
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#161622] text-gray-400 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="p-3">Pos</th>
                          <th className="p-3">Parrilla</th>
                          <th className="p-3">Piloto</th>
                          <th className="p-3">Equipo</th>
                          <th className="p-3">Tiempo Total</th>
                          <th className="p-3">Puntos</th>
                          <th className="p-3">Ingresos (€)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {gridStatus.map((t) => (
                          <tr key={t.team_id} className={t.team_id === teamId ? 'bg-red-600/10 font-semibold' : ''}>
                            <td className="p-3 font-mono font-extrabold text-white text-sm">
                              {t.finishing_position === null ? '--' : `${t.finishing_position}º`}
                            </td>
                            <td className="p-3 text-gray-400 font-mono">P{t.grid_position}</td>
                            <td className="p-3">{t.pilot_name}</td>
                            <td className="p-3 text-gray-350">{t.team_name} ({t.owner_name})</td>
                            <td className="p-3 font-mono">
                              {t.status === 'DNF_crash' ? (
                                <span className="text-rose-500 font-bold">DNF (Caída)</span>
                              ) : (
                                formatLapTime(t.race_time)
                              )}
                            </td>
                            <td className="p-3 text-emerald-400 font-extrabold text-sm flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" />
                              +{t.points_earned} pts
                            </td>
                            <td className="p-3 font-mono font-bold text-yellow-500">
                              +{t.earnings?.toLocaleString()} €
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Historial de Vueltas de la Carrera (si ya finalizó) */}
              {isRaceFinished && raceLaps.length > 0 && (
                <div className="bg-[#101017] border border-gray-850 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-gray-850 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-4 h-4 text-gray-500" />
                      Tu Vuelta a Vuelta en Carrera
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#161622] text-gray-400 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="p-3">Vuelta</th>
                          <th className="p-3">Tiempo</th>
                          <th className="p-3">Desgaste Acumulado</th>
                          <th className="p-3">Detalles / Incidentes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {raceLaps.map((lap) => (
                          <tr key={lap.id} className={lap.has_crashed ? 'bg-red-950/10 text-red-400' : ''}>
                            <td className="p-3 font-mono">#{lap.lap_number}</td>
                            <td className="p-3 font-mono font-bold">
                              {lap.has_crashed ? 'CAÍDA' : formatLapTime(lap.lap_time)}
                            </td>
                            <td className="p-3 font-mono">{lap.tire_wear_pct}%</td>
                            <td className="p-3 text-xs text-gray-300 italic">
                              {lap.feedback_received || '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RaceCenter;
