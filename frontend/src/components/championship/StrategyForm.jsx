import React from 'react';
import { Wrench, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';

export default function StrategyForm({ 
  teamId, 
  tireType, 
  setTireType, 
  pilotFocus, 
  setPilotFocus, 
  setup, 
  handleSliderChange, 
  isSetupBalanced, 
  setupSum 
}) {
  if (!teamId) {
    return (
      <div className="bg-[#101017] border border-gray-850 p-6 rounded-2xl space-y-4 text-center">
        <Shield className="w-12 h-12 text-yellow-500 mx-auto" />
        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Modo Administrador</h3>
        <p className="text-xs text-gray-455 leading-relaxed">
          No estás participando en este campeonato. Como administrador puedes ver el estado general de los demás equipos y forzar la simulación de la carrera.
        </p>
      </div>
    );
  }

  return (
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
  );
}
