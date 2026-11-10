import { useState } from 'react';
import { PILL_BAD, PILL_NEUTRAL, PILL_OK, PILL_WARN } from './kafkaUtils';

/** Fila de un consumer group y, si está abierto, su detalle: miembros, lag por partición y reseteo. */
function stateStyle(state) {
  if (state === 'STABLE') return PILL_OK;
  if (state === 'EMPTY') return PILL_NEUTRAL;
  if (state === 'DEAD') return PILL_BAD;
  return PILL_WARN; // rebalanceando, desconocido...
}

function LagBadge({ lag, threshold }) {
  if (lag === null || lag === undefined) return <span style={PILL_NEUTRAL}>sin offset</span>;
  return lag > threshold ? <span style={PILL_BAD}>Alto</span> : <span style={PILL_OK}>OK</span>;
}

export default function GroupRows({ group, state, total, threshold, open, detail, onToggle, onDelete, onReset }) {
  const [strategy, setStrategy] = useState('EARLIEST');
  const [topic, setTopic] = useState('');

  const partitions = group.lag?.partitions ?? [];
  const topicsOfGroup = [...new Set(partitions.map((p) => p.topic))];
  const inactive = state === 'EMPTY';
  // El grupo está "Alto" si al menos una partición supera el umbral configurado.
  const anyHigh = partitions.some((p) => p.lag !== null && p.lag !== undefined && p.lag > threshold);

  return (
    <>
      <tr>
        <td>
          {group.groupId}
          {group.protectedGroup && <span style={PILL_NEUTRAL}>protegido</span>}
        </td>
        <td>
          <span style={{ ...stateStyle(state), marginLeft: 0 }}>{state ?? '—'}</span>
        </td>
        <td>
          {total ?? '—'}
          {total !== undefined && total !== null && (
            <span style={anyHigh ? PILL_BAD : PILL_OK}>{anyHigh ? 'Alto' : 'OK'}</span>
          )}
        </td>
        <td>
          <div className="row-actions">
            <button onClick={onToggle}>{open ? 'Ocultar' : 'Ver detalle'}</button>
            <button
              onClick={onDelete}
              disabled={group.protectedGroup || !inactive}
              title={
                group.protectedGroup
                  ? 'Grupo de un microservicio: no se puede eliminar'
                  : !inactive
                    ? 'Solo se puede eliminar con el grupo inactivo (EMPTY)'
                    : ''
              }
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={4}>
            <h4 style={{ margin: '4px 0' }}>Miembros</h4>
            {detail ? (
              detail.members?.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Client ID</th>
                      <th>Host</th>
                      <th>Particiones asignadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.members.map((m) => (
                      <tr key={m.memberId} title={m.memberId}>
                        <td>{m.clientId}</td>
                        <td>{m.host}</td>
                        <td>{m.assignments?.map((a) => `${a.topic}-${a.partition}`).join(', ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="hint">Sin miembros conectados (grupo inactivo).</p>
              )
            ) : (
              <p className="hint">Cargando…</p>
            )}

            <h4 style={{ margin: '12px 0 4px' }}>Lag por partición</h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tópico</th>
                  <th>Partición</th>
                  <th>Offset confirmado</th>
                  <th>Offset final</th>
                  <th>Lag</th>
                  <th>Consumidor</th>
                </tr>
              </thead>
              <tbody>
                {partitions.map((p) => (
                  <tr key={`${p.topic}-${p.partition}`}>
                    <td>{p.topic}</td>
                    <td>{p.partition}</td>
                    <td>{p.committedOffset ?? '—'}</td>
                    <td>{p.endOffset}</td>
                    <td>
                      {p.lag ?? '—'}
                      <LagBadge lag={p.lag} threshold={threshold} />
                    </td>
                    <td>{p.clientId ?? '—'}</td>
                  </tr>
                ))}
                {partitions.length === 0 && (
                  <tr>
                    <td colSpan={6}>Sin offsets confirmados todavía.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <h4 style={{ margin: '12px 0 4px' }}>Resetear offsets</h4>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                <option value="EARLIEST">EARLIEST (volver al inicio)</option>
                <option value="LATEST">LATEST (saltar al final)</option>
              </select>
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">Todos los tópicos del grupo</option>
                {topicsOfGroup.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button onClick={() => onReset(strategy, topic)} disabled={!inactive}>
                Resetear
              </button>
            </div>
            {!inactive && (
              <p className="hint">
                El grupo está en estado {state}: para resetear hay que detener primero el servicio consumidor
                (el estado debe ser EMPTY).
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
