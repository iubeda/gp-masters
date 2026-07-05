const db = require('../config/database');
const { runRaceInternal } = require('../services/simulation.service');

const startScheduler = () => {
  // Check every 60 seconds
  setInterval(async () => {
    try {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const localDateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
      const currentHour = now.getHours();

      // Query all pending races from active championships
      const queryText = `
        SELECT cc.championship_id, cc.circuit_id, c.name AS circuit_name, ch.name AS champ_name,
               cc.order, ch.start_date
        FROM championship_circuits cc
        JOIN dictionary_circuits c ON cc.circuit_id = c.id
        JOIN championships ch ON cc.championship_id = ch.id
        WHERE EXISTS (
            SELECT 1 FROM teams t WHERE t.championship_id = cc.championship_id
          )
          AND NOT EXISTS (
            SELECT 1 FROM gp_team_status gts
            WHERE gts.championship_id = cc.championship_id
              AND gts.circuit_id = cc.circuit_id
              AND gts.finishing_position IS NOT NULL
          )
      `;
      const scheduledRes = await db.query(queryText);
      const scheduledRaces = scheduledRes.rows;

      for (const race of scheduledRaces) {
        // Calculate race date based on championship start_date and circuit order
        // Order index starts at 0, offset = orderIndex * 4 + 2 (since race is day 2 offset)
        const orderIndex = race.order - 1;
        const startDayOffset = orderIndex * 4 + 2;
        
        const startDate = new Date(race.start_date);
        startDate.setDate(startDate.getDate() + startDayOffset);
        const raceDateStr = startDate.toISOString().split('T')[0];

        // Conditions to trigger simulation automatically:
        // A) The race date is in the past: raceDateStr < localDateStr
        // B) The race date is today, and current hour is >= 15 (1 hour after 14:00h): raceDateStr === localDateStr && currentHour >= 15
        const isPast = raceDateStr < localDateStr;
        const isTodayAndPastTime = (raceDateStr === localDateStr && currentHour >= 15);

        if (isPast || isTodayAndPastTime) {
          console.log(`[Auto-Scheduler] Starting automatic race simulation for Championship: "${race.champ_name}" (ID: ${race.championship_id}), Circuit: "${race.circuit_name}" (ID: ${race.circuit_id}), scheduled for ${raceDateStr}`);
          
          try {
            const results = await runRaceInternal(race.championship_id, race.circuit_id);
            console.log(`[Auto-Scheduler] Automatic simulation completed successfully. Results calculated for ${results.length} teams.`);
          } catch (simError) {
            console.error(`[Auto-Scheduler] Error simulating race automatically for champ_id ${race.championship_id}, circuit_id ${race.circuit_id}:`, simError.message);
          }
        }
      }
    } catch (err) {
      console.error('[Auto-Scheduler] Error in scheduler loop:', err.message);
    }
  }, 60000); // run check every minute
  
  console.log('[Auto-Scheduler] Background automatic race scheduler initialized.');
};

module.exports = { startScheduler };
