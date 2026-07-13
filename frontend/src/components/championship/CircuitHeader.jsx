import React from 'react';
import { Timer, CloudRain, Sun, Thermometer, HelpCircle, Unlock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CircuitHeader({ circuit, sessionLabel, currentWeather, isGlobalBypass }) {
  const { t } = useTranslation();
  if (!circuit) return null;

  return (
    <div className="p-6 bg-gradient-to-r from-red-950/20 via-transparent to-transparent border-b border-gray-850 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Race Center
          </span>
          {isGlobalBypass && (
            <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
              <Unlock className="w-3 h-3" />
              {t('championship.circuit.open_schedules', 'Horarios Abiertos')}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-extrabold text-white mt-1">{circuit.name}</h2>
        <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
          <Timer className="w-3.5 h-3.5 text-gray-500" />
          {t('championship.circuit.distance', 'Distancia:')} <strong>{circuit.distance}m</strong> • {t('championship.circuit.curves', 'Curvas:')} <strong>{circuit.curves_right} Der / {circuit.curves_left} Izq</strong>
        </p>
      </div>

      {/* Climatología Widget — por sesión */}
      <div className="flex flex-col gap-1.5 bg-[#161622]/60 border border-gray-800 px-4 py-3 rounded-2xl min-w-[200px]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
          {t('championship.circuit.weather', 'Clima')} &mdash; {sessionLabel}
        </div>
        {currentWeather ? (
          <div className="flex items-center gap-3">
            {currentWeather.weather_condition === 'rainy' ? (
              <CloudRain className="w-8 h-8 text-blue-400 animate-pulse flex-shrink-0" />
            ) : currentWeather.weather_condition === 'cloudy' ? (
              <Sun className="w-8 h-8 text-gray-400 flex-shrink-0" />
            ) : (
              <Sun className="w-8 h-8 text-amber-500 animate-spin-slow flex-shrink-0" />
            )}
            <div className="text-xs space-y-0.5">
              <div className="font-bold uppercase tracking-wider text-gray-300">
                <span className={currentWeather.weather_condition === 'rainy' ? 'text-blue-400' : currentWeather.weather_condition === 'cloudy' ? 'text-gray-300' : 'text-amber-500'}>
                  {currentWeather.weather_condition === 'rainy'
                    ? `${t('championship.circuit.rainy', 'Lluvia')} (${currentWeather.rain_percentage}%)`
                    : currentWeather.weather_condition === 'cloudy'
                    ? t('championship.circuit.cloudy', 'Nublado')
                    : t('championship.circuit.sunny', 'Soleado')}
                </span>
              </div>
              <div className="flex gap-3 text-gray-400">
                <span className="flex items-center gap-0.5"><Thermometer className="w-3.5 h-3.5 text-red-400" /> {t('championship.circuit.air', 'Aire')}: <strong>{currentWeather.temp_ambient}ºC</strong></span>
                <span className="flex items-center gap-0.5"><Thermometer className="w-3.5 h-3.5 text-orange-400" /> {t('championship.circuit.asphalt', 'Asfalto')}: <strong>{currentWeather.temp_asphalt}ºC</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <HelpCircle className="w-4 h-4" />
            <span>{t('championship.circuit.pending_reveal', 'Pendiente de revelarse')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
