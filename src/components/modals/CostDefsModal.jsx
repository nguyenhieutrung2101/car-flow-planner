import { useState } from 'react';
import { useApp } from '../../App.jsx';
import Modal from './Modal.jsx';
import { uid } from '../../model.js';

export default function CostDefsModal() {
  const { state, t, mutate, closeModal } = useApp();
  const [defs, setDefs] = useState(() => state.costDefs.map(d => ({
    ...d,
    name: typeof d.name === 'object' ? { ...d.name } : { vi: d.name, en: d.name },
  })));

  const patch = (i, fn) => setDefs(ds => ds.map((d, j) => (j === i ? fn({ ...d }) : d)));
  const removeAt = i => setDefs(ds => ds.filter((_, j) => j !== i));
  const addRow = () => setDefs(ds => [...ds, {
    id: uid(), name: { vi: '', en: '' }, scope: 'tp', basis: 'once', amount: 0, currency: 'IDR', timing: 'prepaid',
  }]);

  const save = () => {
    const clean = defs.map(d => ({ ...d, amount: +d.amount || 0 }));
    mutate(s => { s.costDefs = clean; });
    closeModal();
  };

  return (
    <Modal wide title={t('m_defs')} okLabel={t('save')} onOk={save}>
      <table className="deft">
        <tbody>
          <tr>
            <th>{t('df_name_vi')}</th><th>{t('df_name_en')}</th><th>{t('df_scope')}</th><th>{t('df_basis')}</th>
            <th>{t('df_amount')}</th><th>{t('df_cur')}</th><th>{t('df_timing')}</th><th />
          </tr>
          {defs.map((d, i) => (
            <tr key={d.id}>
              <td><input value={d.name.vi} onChange={e => patch(i, x => ({ ...x, name: { ...x.name, vi: e.target.value } }))} /></td>
              <td><input value={d.name.en} onChange={e => patch(i, x => ({ ...x, name: { ...x.name, en: e.target.value } }))} /></td>
              <td>
                <select value={d.scope} onChange={e => patch(i, x => ({ ...x, scope: e.target.value }))}>
                  <option value="tp">{t('scope_tp')}</option>
                  <option value="dp">{t('scope_dp')}</option>
                  <option value="both">{t('scope_both')}</option>
                </select>
              </td>
              <td>
                <select value={d.basis} onChange={e => patch(i, x => ({ ...x, basis: e.target.value }))}>
                  <option value="once">{t('basis_once')}</option>
                  <option value="monthly">{t('basis_monthly')}</option>
                  <option value="per_m2_month">{t('basis_m2')}</option>
                </select>
              </td>
              <td><input type="number" value={d.amount} onChange={e => patch(i, x => ({ ...x, amount: e.target.value }))} /></td>
              <td>
                <select value={d.currency} onChange={e => patch(i, x => ({ ...x, currency: e.target.value }))}>
                  <option>IDR</option><option>USD</option>
                </select>
              </td>
              <td>
                <select value={d.timing || 'prepaid'} onChange={e => patch(i, x => ({ ...x, timing: e.target.value }))}>
                  <option value="prepaid">{t('timing_pre')}</option>
                  <option value="monthly">{t('timing_mo')}</option>
                </select>
              </td>
              <td><button className="sbtn danger" onClick={() => removeAt(i)}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8 }}>
        <button className="sbtn" onClick={addRow}>{t('df_add')}</button>
      </div>
      <div className="mini" style={{ marginTop: 8 }}>{t('basis_m2')}: {t('basis_note')}.</div>
    </Modal>
  );
}
