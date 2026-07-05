import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for ChampionshipDetail data management.
 * Centralizes all API calls, state, and business-logic handlers so that
 * ChampionshipDetail.jsx can remain a pure orchestration component.
 */
const useChampionshipData = ({ championshipId, apiFetch, showToast }) => {
  const navigate = useNavigate();

  // ── Data states ──────────────────────────────────────────────────────────
  const [championship, setChampionship] = useState(null);
  const [teams, setTeams] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Form states ───────────────────────────────────────────────────────────
  const [teamName, setTeamName] = useState('');
  const [pin, setPin] = useState('');
  const [registeringTeam, setRegisteringTeam] = useState(false);
  const [selectedCircuitId, setSelectedCircuitId] = useState('');
  const [addingCircuit, setAddingCircuit] = useState(false);

  // ── Kick/expulsion states ─────────────────────────────────────────────────
  const [showKickModal, setShowKickModal] = useState(false);
  const [kickTargetTeam, setKickTargetTeam] = useState(null);
  const [kickReason, setKickReason] = useState('');
  const [kicking, setKicking] = useState(false);

  // ── Data fetching (parallel) ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all three resources in parallel for faster load times
      const [champData, teamsData, circuitsData] = await Promise.all([
        apiFetch(`/api/championships/${championshipId}`),
        apiFetch(`/api/championships/${championshipId}/teams`),
        apiFetch('/api/circuits'),
      ]);
      setChampionship(champData);
      setTeams(teamsData);
      setCircuits(circuitsData);
    } catch (error) {
      showToast(error.message, 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [championshipId, apiFetch, showToast, navigate]);

  useEffect(() => {
    if (championshipId) {
      fetchData();
    }
  }, [championshipId, fetchData]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRegisterTeam = useCallback(async (e) => {
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
          pin: pin,
        }),
      });
      showToast(
        `Team registered! Hired pilot: ${data.assigned_pilot_name}. Motorcycle: ${data.assigned_motorcycle_name}.`,
        'success'
      );
      setTeamName('');
      setPin('');
      fetchData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setRegisteringTeam(false);
    }
  }, [teamName, pin, championship, championshipId, apiFetch, showToast, fetchData]);

  const handleAddCircuit = useCallback(async (e) => {
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
          order: nextOrder,
        }),
      });
      showToast('Circuit added to calendar!', 'success');
      setSelectedCircuitId('');
      fetchData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setAddingCircuit(false);
    }
  }, [selectedCircuitId, championship, championshipId, apiFetch, showToast, fetchData]);

  const handleKick = useCallback(async (e) => {
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
          team_id: kickTargetTeam.id,
          reason: kickReason,
        }),
      });
      showToast(`Mánager ${kickTargetTeam.owner_name} expulsado correctamente.`, 'success');
      setShowKickModal(false);
      setKickReason('');
      setKickTargetTeam(null);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setKicking(false);
    }
  }, [kickReason, kickTargetTeam, championshipId, apiFetch, showToast, fetchData]);

  const openKickModal = useCallback((team) => {
    setKickTargetTeam(team);
    setKickReason('');
    setShowKickModal(true);
  }, []);

  const closeKickModal = useCallback(() => {
    setShowKickModal(false);
    setKickTargetTeam(null);
    setKickReason('');
  }, []);

  return {
    // State
    championship,
    teams,
    circuits,
    loading,
    // Form state
    teamName, setTeamName,
    pin, setPin,
    registeringTeam,
    selectedCircuitId, setSelectedCircuitId,
    addingCircuit,
    // Kick state
    showKickModal,
    kickTargetTeam,
    kickReason, setKickReason,
    kicking,
    // Handlers
    handleRegisterTeam,
    handleAddCircuit,
    handleKick,
    openKickModal,
    closeKickModal,
    fetchData,
  };
};

export default useChampionshipData;
