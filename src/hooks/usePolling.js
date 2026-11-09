import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ejecuta `task` apenas se monta el componente y luego cada `intervalMs` (5 s por defecto),
 * hasta que el usuario lo pausa. Para que los eventos nuevos aparezcan sin recargar la página.
 *
 * - No lanza una consulta nueva si la anterior todavía no termina (evita acumular llamadas).
 * - No consulta mientras la pestaña está oculta; al volver, refresca de inmediato.
 * - `task` puede cambiar en cada render: siempre se usa la última versión.
 * - Si cambia `resetKey` (por ejemplo los filtros aplicados) se consulta de inmediato.
 */
export function usePolling(task, intervalMs = 5000, resetKey = null) {
  const [paused, setPaused] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const taskRef = useRef(task);
  const inFlight = useRef(false);

  useEffect(() => {
    taskRef.current = task;
  });

  const run = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await taskRef.current();
      setLastUpdated(new Date());
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (paused) return undefined;

    run();
    const timer = setInterval(() => {
      if (!document.hidden) run();
    }, intervalMs);

    function onVisible() {
      if (!document.hidden) run();
    }
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [paused, intervalMs, run, resetKey]);

  return { paused, setPaused, lastUpdated };
}
