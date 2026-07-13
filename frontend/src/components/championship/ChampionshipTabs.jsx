import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Tab navigation bar for the championship detail page.
 * Renders: Dashboard | Calendario | GP Activo (conditional)
 */
const ChampionshipTabs = ({ activeTab, onTabChange, activeGP, isMember, userRole, todayStr }) => {
  const { t } = useTranslation();
  const tabClass = (tab) =>
    `pb-4 px-1 border-b-2 transition-all duration-200 ${
      activeTab === tab
        ? 'border-red-500 text-white font-bold'
        : 'border-transparent text-gray-400 hover:text-white'
    }`;

  return (
    <div className="flex border-b border-gray-800 gap-6 text-sm font-semibold select-none">
      <button
        onClick={() => onTabChange('dashboard')}
        className={tabClass('dashboard')}
      >
        Dashboard
      </button>

      <button
        onClick={() => onTabChange('calendar')}
        className={tabClass('calendar')}
      >
        {t('championship.tabs.calendar', 'Calendario')}
      </button>

      {(isMember || userRole === 'admin') && activeGP && (
        <button
          onClick={() => onTabChange('gp')}
          className={`${tabClass('gp')} flex items-center gap-1.5`}
        >
          {isMember && (todayStr >= activeGP.practice_date || activeGP.status === 'in_progress' || activeGP.bypass_restrictions) && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
          )}
          {(todayStr >= activeGP.practice_date || activeGP.status === 'in_progress' || activeGP.bypass_restrictions) ? t('championship.tabs.active_gp', 'GP Activo: ') : 'Próximo GP: '} {activeGP.name}
        </button>
      )}
    </div>
  );
};

export default ChampionshipTabs;
