import { useState } from 'react';
import { useApp } from '../App.jsx';
import {
  bat, loc, tpAllocated, dpAllocated, readyMonth, mLabel, fmtN, H, esc,
} from '../model.js';

function MonthSelect({ value, onChange }) {
  const { state } = useApp();
  return (
    <select value={value} onChange={e => onChange(+e.target.value)}>
      {Array.from({ length: state.numMonths }, (_, i) => (
        <option key={i} value={i}>{mLabel(state, i)}</option>
      ))}
    </select>
  );
}

/* Sửa card đang chọn — state cục bộ, chỉ áp khi bấm Lưu (giống bản gốc). */
function CardEditor({ card }) {
  const { state, t, saveCardEdit, splitCard, delCard } = useApp();
  const [locationId, setLocationId] = useState(card.locationId);
  const [from, setFrom] = useState(card.from);
  const [to, setTo] = useState(card.to);
  const [qty, setQty] = useState(card.qty);
  return (
    <>
      <h2 className="sub">{t('edit_card')}</h2>
      <div className="field">
        <label>{t('locn')}</label>
        <select value={locationId} onChange={e => setLocationId(e.target.value)}>
          {state.locations.map(x => (
            <option key={x.id} value={x.id}>[{x.type === 'tp' ? 'TP' : 'DP'}] {x.name}</option>
          ))}
        </select>
      </div>
      <div className="row2">
        <div className="field"><label>{t('from_m')}</label><MonthSelect value={from} onChange={setFrom} /></div>
        <div className="field"><label>{t('to_m')}</label><MonthSelect value={to} onChange={setTo} /></div>
      </div>
      <div className="field">
        <label>{t('n_cars')}</label>
        <input type="number" min="1" value={qty} onChange={e => setQty(+e.target.value)} />
      </div>
      <div className="btnrow">
        <button className="sbtn primary" onClick={() => saveCardEdit(card.id, { locationId, from, to, qty })}>{t('save_card')}</button>
        <button className="sbtn" onClick={() => splitCard(card.id)}>{t('split')}</button>
        <button className="sbtn danger" onClick={() => delCard(card.id)}>{t('del_card')}</button>
      </div>
    </>
  );
}

function ImportInfo() {
  const { state, t, closePanel, openBatchModal } = useApp();
  return (
    <>
      <h2>{t('imp_batches')} <button className="x" onClick={closePanel}>✕</button></h2>
      <table>
        <tbody>
          <tr><th>{t('batch')}</th><th>{t('vtype')}</th><th>{t('qty')}</th><th>{t('import_lbl')}</th><th>{t('not_yet')}</th></tr>
          {state.batches.map(b => {
            const rem = b.qty - tpAllocated(state, b.id);
            return (
              <tr key={b.id}>
                <td style={{ borderLeft: `4px solid ${b.color}` }}>{b.name}</td>
                <td>{b.vehicleType}</td>
                <td style={{ textAlign: 'right' }}>{fmtN(state, b.qty)}</td>
                <td>{mLabel(state, b.importMonth)}</td>
                <td style={{ textAlign: 'right' }} className={rem > 0 ? 'warnNum' : ''}>{fmtN(state, rem)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="btnrow">
        <button className="sbtn primary" onClick={() => openBatchModal()}>{t('new_batch')}</button>
      </div>
    </>
  );
}

function BatchPanel() {
  const { state, t, selBatch, selCard, clearSel, openBatchModal } = useApp();
  const b = bat(state, selBatch);
  if (!b) return null;
  const tp = tpAllocated(state, selBatch), dp = dpAllocated(state, selBatch), rem = b.qty - tp;
  const expDepot = b.importMonth + state.regDuration;
  const myCards = state.cards.filter(c => c.batchId === selBatch).sort((a, c) => a.from - c.from);
  const card = selCard ? state.cards.find(x => x.id === selCard) : null;

  const warns = [];
  if (rem > 0) warns.push({ cls: 'notebox', html: t('w_remain')(fmtN(state, rem)) });
  if (rem < 0) warns.push({ cls: 'warnbox', html: t('w_over')(fmtN(state, -rem)) });
  if (dp > b.qty) warns.push({ cls: 'warnbox', html: t('w_dp_over')(fmtN(state, dp), fmtN(state, b.qty)) });
  myCards.forEach(c => {
    const l = loc(state, c.locationId);
    if (l && c.from < readyMonth(l)) warns.push({ cls: 'warnbox', html: t('w_early')(esc(l.name), mLabel(state, c.from), mLabel(state, readyMonth(l))) });
    if (l && l.type === 'tp' && (c.to - c.from + 1) > state.regDuration) warns.push({ cls: 'notebox', html: t('w_dwell')(esc(l.name), c.to - c.from + 1, state.regDuration) });
  });

  return (
    <>
      <h2>{t('track')} <button className="x" onClick={clearSel}>✕</button></h2>
      <div className="kv"><span>{t('batch')}</span><b style={{ color: b.color }}>{b.name}</b></div>
      <div className="kv"><span>{t('vtype')}</span><b>{b.vehicleType}</b></div>
      <div className="kv"><span>{t('qty_import')}</span><b>{fmtN(state, b.qty)} · {b.importDate || mLabel(state, b.importMonth)}</b></div>
      <div className="kv"><span>{t('exp_reg')}</span><b>{mLabel(state, Math.min(expDepot, H(state)))}</b></div>
      <div className="kv"><span>{t('alloc_tp')}</span><b>{fmtN(state, tp)}</b></div>
      <div className="kv"><span>{t('alloc_dp')}</span><b>{fmtN(state, dp)}</b></div>
      {warns.map((w, i) => (
        <div key={i} className={w.cls} dangerouslySetInnerHTML={{ __html: w.html }} />
      ))}
      <table>
        <tbody>
          <tr><th>{t('layer')}</th><th>{t('locn')}</th><th>{t('qty')}</th><th>{t('time')}</th></tr>
          {myCards.length === 0 ? (
            <tr><td colSpan={4} className="mut">{t('not_alloc')}</td></tr>
          ) : myCards.map(c => {
            const l = loc(state, c.locationId);
            return (
              <tr key={c.id}>
                <td>{l ? (l.type === 'tp' ? t('tp') : t('dp')) : '?'}</td>
                <td>{l ? l.name : '?'}</td>
                <td style={{ textAlign: 'right' }}>{fmtN(state, c.qty)}</td>
                <td>{mLabel(state, c.from)}→{mLabel(state, c.to)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="btnrow">
        <button className="sbtn" onClick={() => openBatchModal(b.id)}>{t('edit_batch')}</button>
      </div>
      {card && (
        <CardEditor
          key={`${card.id}-${card.locationId}-${card.from}-${card.to}-${card.qty}`}
          card={card}
        />
      )}
    </>
  );
}

export default function Panel() {
  const { panel } = useApp();
  return (
    <aside id="panel" className="open">
      {panel === 'import' ? <ImportInfo /> : <BatchPanel />}
    </aside>
  );
}
