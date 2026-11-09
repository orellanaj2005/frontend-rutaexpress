/**
 * Barra con el estado del refresco automático: cada cuántos segundos se actualiza,
 * a qué hora fue la última vez y un botón para pausar / reanudar.
 * Se usa junto con el hook usePolling.
 */
export default function AutoRefreshBar({ paused, setPaused, lastUpdated, intervalMs = 5000 }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        margin: '0.5rem 0 1rem',
        fontSize: '0.9rem',
      }}
    >
      <span>
        {paused
          ? 'Actualización automática en pausa'
          : `Se actualiza solo cada ${intervalMs / 1000} s`}
        {lastUpdated && ` · última vez: ${lastUpdated.toLocaleTimeString('es-CL')}`}
      </span>
      <button type="button" onClick={() => setPaused(!paused)}>
        {paused ? 'Reanudar' : 'Pausar'}
      </button>
    </div>
  );
}
