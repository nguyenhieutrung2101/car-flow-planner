import { useApp } from '../App.jsx';
import {
  STEPS, STEP_LBL, tpAllocated, dpAllocated, batchAutoDone, mLabel, fmtN,
} from '../model.js';

function StepChip({ b, st }) {
  const { state, t, cycleStep } = useApp();
  const auto = batchAutoDone(state, b);
  const v = auto ? 2 : (b.steps?.[st] ?? 0);
  const cls = v === 2 ? 's2' : (v === 1 ? 's1' : '');
  return (
    <button
      className={`chip ${cls} ${auto ? 'auto' : ''}`}
      onClick={e => { e.stopPropagation(); if (!auto) cycleStep(b.id, st); }}
    >
      {auto ? t('bt_auto') : t('st' + v)}
    </button>
  );
}

export default function BatchTab() {
  const { state, t, openBatchModal } = useApp();
  return (
    <div className="dtwrap">
      <div className="dtbar">
        <h2>{t('bt_title')}</h2>
        <button className="sbtn primary" onClick={() => openBatchModal()}>{t('new_batch')}</button>
        <span className="note">{t('bt_click')} {t('bt_auto_note')}</span>
      </div>
      <table className="dt">
        <thead>
          <tr>
            <th>{t('batch')}</th><th>{t('vtype')}</th><th>{t('qty')}</th><th>{t('bt_date')}</th>
            <th>{t('alloc_tp')}</th><th>{t('alloc_dp')}</th>
            {STEPS.map(s => <th key={s}>{STEP_LBL[s]}</th>)}
            <th>{t('bt_prog')}</th>
          </tr>
        </thead>
        <tbody>
          {state.batches.map(b => {
            const auto = batchAutoDone(state, b);
            const done = auto ? STEPS.length : STEPS.filter(s => (b.steps?.[s] ?? 0) === 2).length;
            return (
              <tr key={b.id} className="batrow" onClick={() => openBatchModal(b.id)}>
                <td><span className="colorbar" style={{ background: b.color }} /><b>{b.name}</b></td>
                <td>{b.vehicleType}</td>
                <td className="num">{fmtN(state, b.qty)}</td>
                <td>{b.importDate || ''} ({mLabel(state, b.importMonth)})</td>
                <td className="num">{fmtN(state, tpAllocated(state, b.id))}</td>
                <td className="num">{fmtN(state, dpAllocated(state, b.id))}</td>
                {STEPS.map(s => <td key={s}><StepChip b={b} st={s} /></td>)}
                <td>{done}/{STEPS.length}{auto ? ' · auto' : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="steplegend">
        {['step_quota', 'step_tera', 'step_kir', 'step_kp', 'step_stnk'].map(k => (
          <div key={k} dangerouslySetInnerHTML={{ __html: t(k) }} />
        ))}
      </div>
    </div>
  );
}
