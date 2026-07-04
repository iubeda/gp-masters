import React from 'react';

/**
 * Tab navigation bar for the championship detail page.
 * Renders: Dashboard | Calendario | GP Activo (conditional)
 */
const ChampionshipTabs = ({ activeTab, onTabChange, activeGP, isMember, userRole, todayStr }) => {
  const tabClass = (tab) =>
    `pb-4 px-1 border-b-2 transition-all duration-200 ${
      activeTab === tab
        ? 'border-red-500 text-white font-bold'
        : 'border-transparent text-gray-400 hover:text-white'
    }`;

  const showGPTab =
    activeGP && (isMember || userRole === 'admin') && todayStr >= activeGP.practice_date;

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
        Calendario
      </button>

      {showGPTab && (
        <button
          onClick={() => onTabChange('gp')}
          className={`${tabClass('gp')} flex items-center gap-1.5`}
        >
          {isMember && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
          )}
          GP Activo: {activeGP.name}
        </button>
      )}
    </div>
  );
};

export default ChampionshipTabs;
