import { useApp } from '../App.jsx';
import {
  mLabel, laneAssign, bat, effCap, readyMonth, occupancy, tpAllocated, fmtN, H,
} from '../model.js';

const LANE_H = 46;

/* Ô lưới nhận drop — thêm/bỏ class dropok trực tiếp để không re-render khi kéo. */
function Cell({ rowId, month, height, extraClass, children }) {
  const { handleDrop } = useApp();
  const droppable = rowId !== '__import__';
  return (
    <div
      className={`cell ${extraClass || ''}`}
      data-row={rowId} data-month={month}
      style={{ height }}
      onDragOver={droppable ? e => { e.preventDefault(); e.currentTarget.classList.add('dropok'); } : undefined}
      onDragLeave={droppable ? e => e.currentTarget.classList.remove('dropok') : undefined}
      onDrop={droppable ? e => {
        e.preventDefault();
        e.currentTarget.classList.remove('dropok');
        let p;
        try { p = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { return; }
        handleDrop(p, rowId, month);
      } : undefined}
    >
      {children}
    </div>
  );
}

function Card({ card, lane, imp }) {
  const { state, t, selBatch, selCard, selectCard } = useApp();
  const b = bat(state, card.batchId);
  if (!b) return null;
  const cls = ['card'];
  if (imp) cls.push('imp');
  if (selBatch) cls.push(card.batchId === selBatch ? 'hl' : 'dim');
  const style = {
    left: `calc(${card.from} * var(--colw) + 3px)`,
    width: imp ? 'calc(var(--colw) - 7px)' : `calc(${card.to - card.from + 1} * var(--colw) - 7px)`,
    top: lane * LANE_H + 3,
    borderLeftColor: b.color,
  };
  const payload = imp ? { kind: 'imp', batchId: b.id } : { kind: 'card', cardId: card.id };

  let body;
  if (imp) {
    const rem = b.qty - tpAllocated(state, b.id);
    body = (
      <>
        <div className="t1">
          {b.name} · {fmtN(state, b.qty)}
          {rem > 0 && <span className="rem">{t('remain')} {fmtN(state, rem)}</span>}
          {rem < 0 && <span className="rem over">{t('over_alloc')} {fmtN(state, -rem)}</span>}
        </div>
        <div className="t2">{b.vehicleType} · {t('import_lbl')} {mLabel(state, card.from)}</div>
      </>
    );
  } else {
    const l = card.locationId ? state.locations.find(x => x.id === card.locationId) : null;
    const warn = l && card.from < readyMonth(l);
    body = (
      <>
        <div className="t1">{b.name} · {fmtN(state, card.qty)} {t('cars')}{warn && <span className="wico">⚠</span>}</div>
        <div className="t2">{b.vehicleType} · {mLabel(state, card.from)}→{mLabel(state, card.to)}</div>
      </>
    );
  }

  return (
    <div
      className={cls.join(' ')}
      style={style}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={e => { e.stopPropagation(); selectCard(card.batchId, imp ? null : card.id); }}
    >
      {body}
    </div>
  );
}

function SecTitle({ label, addType }) {
  const { t, openLocModal } = useApp();
  return (
    <div className="secrow">
      <div className="sectitle">
        <span>{label}</span>
        {addType && <button className="addloc press" onClick={() => openLocModal(null, addType)}>{t('add')}</button>}
      </div>
      <div className="secfill" />
    </div>
  );
}

function ImportRow() {
  const { state, t, setPanel } = useApp();
  const NM = state.numMonths;
  const imp = state.batches.map(b => ({ batchId: b.id, from: b.importMonth, to: b.importMonth }));
  const { laneOf, count } = laneAssign(imp, c => c.batchId);
  const bodyH = count * LANE_H + 6;
  return (
    <div className="lrow">
      <div className="rowhead" onClick={() => setPanel('import')}>
        <div className="nm">{t('imp_row')}</div>
        <div className="meta">
          {t('imp_meta1')}<br />
          {t('imp_meta2')} <b>{state.regDuration} {t('month_s')}</b> {t('to_depot')}
        </div>
      </div>
      <div className="rowbody" style={{ height: bodyH }}>
        {Array.from({ length: NM }, (_, m) => (
          <Cell key={m} rowId="__import__" month={m} height={bodyH} />
        ))}
        {imp.map(c => (
          <Card key={c.batchId} card={c} lane={laneOf.get(c.batchId)} imp />
        ))}
      </div>
    </div>
  );
}

function LocRow({ l }) {
  const { state, t, openLocModal } = useApp();
  const NM = state.numMonths;
  const myCards = state.cards.filter(c => c.locationId === l.id);
  const { laneOf, count } = laneAssign(myCards, c => c.id);
  const bodyH = count * LANE_H + 6 + 18;
  const cap = effCap(l);
  const capLine = l.type === 'tp'
    ? <>{t('cap')} <b>{fmtN(state, cap)}</b> {t('cars')} · {fmtN(state, l.area)} m²</>
    : <><b>{fmtN(state, l.slots)}</b> {t('slot')} ×(1−{l.homeRate}%)→ <b>{fmtN(state, cap)}</b> {t('cars')} · {fmtN(state, l.area)} m²</>;
  return (
    <div className="lrow">
      <div className="rowhead" onClick={() => openLocModal(l.id)}>
        <div className="nm">
          <span className={`badge ${l.type}`}>{(l.type === 'tp' ? t('tp') : t('dp')).toUpperCase()}</span>
          {l.name}
        </div>
        <div className="meta">
          {l.region || ''}<br />
          {capLine}<br />
          {t('lease_from')} <b>{mLabel(state, l.leaseStart)}</b> · {t('prep_short')} {l.prep} {t('mo')} → {t('use_from')} <b>{mLabel(state, Math.min(readyMonth(l), H(state)))}</b>
        </div>
      </div>
      <div className="rowbody" style={{ height: bodyH }}>
        {Array.from({ length: NM }, (_, m) => {
          const cls = m < (l.leaseStart ?? 0) ? 'nolease' : (m < readyMonth(l) ? 'prep' : '');
          const o = occupancy(state, l.id, m);
          const ocls = o > 0 ? (o > cap ? 'o3' : (o >= cap * 0.8 ? 'o2' : 'o1')) : '';
          return (
            <Cell key={m} rowId={l.id} month={m} height={bodyH} extraClass={cls}>
              <div className={`occ ${ocls}`} title={`${fmtN(state, o)} / ${fmtN(state, cap)}`}>
                {o > 0 ? fmtN(state, o) : ''}
              </div>
            </Cell>
          );
        })}
        {myCards.map(c => (
          <Card key={c.id} card={c} lane={laneOf.get(c.id)} />
        ))}
      </div>
    </div>
  );
}

export default function BoardTab() {
  const { state, t } = useApp();
  const NM = state.numMonths;
  return (
    <div id="board" style={{ width: `calc(var(--leftw) + ${NM} * var(--colw))` }}>
      <div className="mrow">
        <div className="mcorner">{t('loc_month')}</div>
        {Array.from({ length: NM }, (_, i) => {
          const yy = mLabel(state, i).split('/')[1];
          return (
            <div key={i} className="mcell">
              {mLabel(state, i, false)}
              <span className="yy">20{yy}</span>
            </div>
          );
        })}
      </div>
      <SecTitle label={t('lay1')} />
      <ImportRow />
      <SecTitle label={t('lay2')} addType="tp" />
      {state.locations.filter(l => l.type === 'tp').map(l => <LocRow key={l.id} l={l} />)}
      <SecTitle label={t('lay3')} addType="dp" />
      {state.locations.filter(l => l.type === 'dp').map(l => <LocRow key={l.id} l={l} />)}
    </div>
  );
}
