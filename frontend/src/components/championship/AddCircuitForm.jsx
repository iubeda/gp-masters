import React from 'react';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AddCircuitForm = ({ 
  onSubmit, 
  circuits, 
  championshipCircuits, 
  selectedCircuitId, 
  setSelectedCircuitId, 
  addingCircuit 
}) => {
  const { t } = useTranslation();
  return (
    <div className="glass rounded-2xl border border-gray-800 overflow-hidden shadow-xl animate-fadeIn">
      <div className="p-6 bg-gradient-to-r from-yellow-600/10 to-transparent border-b border-gray-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-yellow-500" />
          {t('championship.add_circuit.title', 'Add Circuit to Calendar')}
        </h2>
        <p className="text-xs text-gray-400 mt-1">{t('championship.add_circuit.subtitle', 'Include a race circuit in the championship calendar')}</p>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-gray-400">{t('championship.add_circuit.select_circuit', 'Select Circuit')}</label>
          <select
            value={selectedCircuitId}
            onChange={(e) => setSelectedCircuitId(e.target.value)}
            className="w-full px-4 py-3 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-yellow-500 focus:outline-none text-white text-sm"
            required
          >
            <option value="">-- {t('championship.add_circuit.choose_circuit', 'Choose a Circuit')} --</option>
            {circuits.map((circuit) => {
              const onCalendar = championshipCircuits?.some(c => c.id === circuit.id);
              return (
                <option key={circuit.id} value={circuit.id} disabled={onCalendar}>
                  {circuit.name} ({circuit.distance}m) {onCalendar ? '[ADDED]' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <button
          type="submit"
          disabled={addingCircuit}
          className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {addingCircuit ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            t('championship.add_circuit.submit_btn', 'ADD CIRCUIT')
          )}
        </button>
      </form>
    </div>
  );
};

export default AddCircuitForm;
