import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Users, Play } from 'lucide-react';

// Data hook
import useChampionshipData from '../hooks/useChampionshipData';

// Sub-components
import KickedBanner from '../components/championship/KickedBanner';
import ChampionshipHeader from '../components/championship/ChampionshipHeader';
import ChampionshipTabs from '../components/championship/ChampionshipTabs';
import MyTeamCard from '../components/championship/MyTeamCard';
import StandingsTable from '../components/championship/StandingsTable';
import NextRaceCard from '../components/championship/NextRaceCard';
import KickManagerModal from '../components/championship/KickManagerModal';
import CalendarList from '../components/championship/CalendarList';
import RegisteredTeamsGrid from '../components/championship/RegisteredTeamsGrid';
import RegisterTeamForm from '../components/championship/RegisterTeamForm';
import AddCircuitForm from '../components/championship/AddCircuitForm';
import RaceCenter from '../components/championship/RaceCenter';
import { Check } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns today's date as a YYYY-MM-DD string in the local timezone. */
const getTodayStr = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// ── Component ─────────────────────────────────────────────────────────────────

const ChampionshipDetail = ({ showToast }) => {
  const { apiFetch, user } = useAuth();
  const navigate = useNavigate();
  const { id: championshipId } = useParams();

  // UI state (tab + completed circuit selector) — stays in the page component
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCompletedCircuit, setSelectedCompletedCircuit] = useState(null);

  const todayStr = useMemo(getTodayStr, []);

  // All data / handlers delegated to the custom hook
  const {
    championship, teams, circuits, loading,
    teamName, setTeamName, pin, setPin, registeringTeam,
    selectedCircuitId, setSelectedCircuitId, addingCircuit,
    showKickModal, kickTargetTeam, kickReason, setKickReason, kicking,
    handleRegisterTeam, handleAddCircuit, handleKick,
    openKickModal, closeKickModal,
  } = useChampionshipData({ championshipId, apiFetch, showToast });

  // ── Derived values ──────────────────────────────────────────────────────────

  const userTeam = useMemo(
    () => teams.find((t) => t.user_email?.toLowerCase() === user.email.toLowerCase()),
    [teams, user.email]
  );
  const isMember = Boolean(userTeam);
  const isCreator = useMemo(
    () => championship?.created_by?.toLowerCase() === user.email.toLowerCase(),
    [championship, user.email]
  );
  const activeGP = useMemo(
    () => championship?.circuits?.find((c) => c.status === 'scheduled'),
    [championship]
  );

  // ── Tab change helper (resets completed circuit selection) ──────────────────

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedCompletedCircuit(null);
  };

  // ── Early returns ───────────────────────────────────────────────────────────

  if (loading || !championship) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3 max-w-6xl mx-auto">
        <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
        <p className="text-gray-400">Loading championship details...</p>
      </div>
    );
  }

  if (championship.kicked) {
    return <KickedBanner championship={championship} />;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 animate-fadeIn">

      {/* Back navigation */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO DASHBOARD
      </button>

      {/* Title + metadata */}
      <ChampionshipHeader championship={championship} isCreator={isCreator} />

      {/* Tab bar */}
      <ChampionshipTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        activeGP={activeGP}
        isMember={isMember}
        userRole={user.role}
        todayStr={todayStr}
      />

      {/* ── TAB: Dashboard ─────────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: My team card OR registration form */}
          <div className="lg:col-span-1 space-y-6">
            {isMember && userTeam ? (
              <MyTeamCard userTeam={userTeam} />
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

          {/* Right columns: Standings + Next race */}
          <div className="lg:col-span-2 space-y-8">
            <StandingsTable
              teams={teams}
              user={user}
              isCreator={isCreator}
              championship={championship}
              onKick={openKickModal}
            />
            <NextRaceCard
              activeGP={activeGP}
              hasCircuits={Boolean(championship.circuits?.length)}
              isMember={isMember}
              userRole={user.role}
              todayStr={todayStr}
              isCreator={isCreator}
              onSimulate={() => setActiveTab('gp')}
            />
          </div>
        </div>
      )}

      {/* ── TAB: Calendario ────────────────────────────────────────────────── */}
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
              {/* Race calendar */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-yellow-600/10 via-transparent to-transparent border-b border-gray-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Calendario de Carreras</h2>
                    <span className="px-3 py-1 bg-[#0F0F12] border border-gray-805 text-xs font-semibold rounded-full text-gray-300">
                      {championship.circuits?.length || 0} / 15 Grandes Premios
                    </span>
                  </div>
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

              {/* Add circuit form (creator only) */}
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

      {/* ── TAB: GP Activo ─────────────────────────────────────────────────── */}
      {activeTab === 'gp' && activeGP && (
        <div className="space-y-6">
          {isMember || user.role === 'admin' ? (
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

      {/* ── MODAL: Kick manager ─────────────────────────────────────────────── */}
      {showKickModal && kickTargetTeam && (
        <KickManagerModal
          team={kickTargetTeam}
          kickReason={kickReason}
          setKickReason={setKickReason}
          kicking={kicking}
          onSubmit={handleKick}
          onClose={closeKickModal}
        />
      )}
    </div>
  );
};

export default ChampionshipDetail;
