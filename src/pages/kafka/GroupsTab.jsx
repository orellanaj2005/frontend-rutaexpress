import { useState } from 'react';
import AutoRefreshBar from '../../components/AutoRefreshBar';
import { usePolling } from '../../hooks/usePolling';
import GroupRows from './GroupRows';
import { DEFAULT_LAG_THRESHOLD, enc, kafkaError } from './kafkaUtils';

/** Pestaña Consumer groups: lista con estado y lag, refresco cada 5 s, reseteo y eliminación. */
export default function GroupsTab({ api }) {
  const [groups, setGroups] = useState([]);
  const [threshold, setThreshold] = useState(DEFAULT_LAG_THRESHOLD);
  const [expanded, setExpanded] = useState(null); // groupId abierto
  const [detail, setDetail] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Una consulta por grupo con su lag (incluye estado) y, si hay uno abierto, su detalle con miembros.
  async function loadGroups() {
    try {
      const list = (await api.get('/api/kafka/consumer-groups')).data ?? [];
      const lags = await Promise.all(
        list.map((g) =>
          api
            .get(`/api/kafka/consumer-groups/${enc(g.groupId)}/lag`)
            .then((r) => r.data)
            .catch(() => null)
        )
      );
      setGroups(list.map((g, i) => ({ ...g, lag: lags[i] })));

      if (expanded && list.some((g) => g.groupId === expanded)) {
        const d = await api.get(`/api/kafka/consumer-groups/${enc(expanded)}`);
        setDetail(d.data);
      } else {
        setDetail(null);
      }
      setLoadError(null);
    } catch (err) {
      setLoadError(kafkaError(err));
    }
  }

  const { paused, setPaused, lastUpdated } = usePolling(loadGroups, 5000, expanded);

  function toggle(groupId) {
    setDetail(null);
    setActionError(null);
    setNotice(null);
    setExpanded(expanded === groupId ? null : groupId);
  }

  function handleDelete(g) {
    if (!window.confirm(`¿Eliminar el consumer group "${g.groupId}"? Se pierden sus offsets confirmados.`)) return;
    setNotice(null);
    api
      .delete(`/api/kafka/consumer-groups/${enc(g.groupId)}`)
      .then(() => {
        setNotice(`Grupo "${g.groupId}" eliminado.`);
        setActionError(null);
        setExpanded(null);
        return loadGroups();
      })
      .catch((err) => setActionError(kafkaError(err)));
  }

  function handleReset(group, strategy, topic) {
    const what = strategy === 'EARLIEST'
      ? 'volverá a leer desde el primer mensaje que conserve el tópico (reprocesa todo; los duplicados se descartan por eventId)'
      : 'saltará al final del tópico (descarta lo pendiente y solo procesa lo nuevo)';
    if (!window.confirm(`Resetear offsets de "${group.groupId}" a ${strategy}${topic ? ` en ${topic}` : ''}.\nEl grupo ${what}.\n¿Continuar?`)) return;

    setNotice(null);
    api
      .post(`/api/kafka/consumer-groups/${enc(group.groupId)}/reset`, {
        strategy,
        ...(topic ? { topic } : {}),
      })
      .then((res) => {
        const n = res.data?.partitions?.length ?? 0;
        setNotice(`Offsets de "${group.groupId}" reseteados a ${strategy} (${n} particiones).`);
        setActionError(null);
        return loadGroups();
      })
      .catch((err) => setActionError(kafkaError(err)));
  }

  return (
    <div>
      {loadError && <p className="error-banner">{loadError}</p>}
      {actionError && <p className="error-banner">{actionError}</p>}
      {notice && <p className="hint">{notice}</p>}

      <AutoRefreshBar paused={paused} setPaused={setPaused} lastUpdated={lastUpdated} />

      <label style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
        Umbral de lag (mensajes pendientes por partición){' '}
        <input
          type="number"
          min="0"
          style={{ width: 90, padding: '4px 6px' }}
          value={threshold}
          onChange={(e) => setThreshold(Math.max(0, Number(e.target.value) || 0))}
        />
      </label>

      <table className="data-table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Grupo</th>
            <th>Estado</th>
            <th>Lag total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const state = g.lag?.state ?? g.state;
            const total = g.lag?.totalLag;
            return (
              <GroupRows
                key={g.groupId}
                group={g}
                state={state}
                total={total}
                threshold={threshold}
                open={expanded === g.groupId}
                detail={expanded === g.groupId ? detail : null}
                onToggle={() => toggle(g.groupId)}
                onDelete={() => handleDelete(g)}
                onReset={(strategy, topic) => handleReset(g, strategy, topic)}
              />
            );
          })}
          {groups.length === 0 && !loadError && (
            <tr>
              <td colSpan={4}>No hay consumer groups para mostrar.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
