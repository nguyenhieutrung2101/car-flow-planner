import { useState } from 'react';
import { useApp } from '../../App.jsx';
import Modal from './Modal.jsx';
import { VEHICLES, PALETTE, uid, bat, monthToDate, dateToMonth } from '../../model.js';

export default function BatchModal() {
  const { state, t, modal, mutate, closeModal, clearSel, selBatch } = useApp();
  const b = modal.id ? bat(state, modal.id) : null;
  const [name, setName] = useState(b ? b.name : 'Batch ' + String(state.batches.length + 1).padStart(2, '0'));
  const [vt, setVt] = useState(b ? b.vehicleType : VEHICLES[0]);
  const [qty, setQty] = useState(b ? b.qty : 1000);
  const [date, setDate] = useState(b ? b.importDate : monthToDate(state, 0));

  const save = () => {
    const nm = name.trim() || 'Batch';
    const q = Math.max(1, +qty || 1);
    const dt = date || monthToDate(state, 0);
    mutate(s => {
      const im = dateToMonth(s, dt);
      if (b) {
        const b2 = bat(s, b.id);
        if (b2) Object.assign(b2, { name: nm, vehicleType: vt, qty: q, importDate: dt, importMonth: im });
      } else {
        s.batches.push({
          id: uid(), name: nm, vehicleType: vt, qty: q, importDate: dt, importMonth: im,
          color: PALETTE[s.batches.length % PALETTE.length],
          steps: { quota: 0, tera: 0, kir: 0, kp: 0, stnk: 0 },
        });
      }
    });
    closeModal();
  };

  const del = () => {
    if (!window.confirm(t('confirm_del_batch'))) return;
    mutate(s => {
      s.batches = s.batches.filter(x => x.id !== b.id);
      s.cards = s.cards.filter(c => c.batchId !== b.id);
    });
    if (selBatch === b.id) clearSel();
    closeModal();
  };

  return (
    <Modal
      title={b ? t('m_batch_edit') : t('m_batch_new')}
      okLabel={b ? t('save') : t('create')}
      onOk={save}
      extraFooter={b && <button className="sbtn danger pushLeft" onClick={del}>{t('del_batch')}</button>}
    >
      <div className="field">
        <label>{t('b_name')}</label>
        <input value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="row2">
        <div className="field">
          <label>{t('b_vt')}</label>
          <select value={vt} onChange={e => setVt(e.target.value)}>
            {VEHICLES.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div className="field">
          <label>{t('b_qty')}</label>
          <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>{t('b_date')}</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>
    </Modal>
  );
}
