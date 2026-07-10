export const formatLapTime = (timeInSeconds) => {
  if (timeInSeconds === null || timeInSeconds === undefined || isNaN(timeInSeconds) || timeInSeconds === 0) {
    return '--';
  }
  const totalMs = Math.round(parseFloat(timeInSeconds) * 1000);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};
