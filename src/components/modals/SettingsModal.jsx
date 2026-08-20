import { useState } from 'react';
import { useApp } from '../../App.jsx';
import Modal from './Modal.jsx';
import { dateToMonth, H } from '../../model.js';

export default function SettingsModal() {
  const { state, t, mutate, closeModal } = useApp();
  const [start, setStart] = useState(state.startMonth);
  const [num, setNum] = useState(state.numMonths);
  const [reg, setReg] = useState(state.regDuration);
  const [fx, setFx] = useState(state.fxRate);
  const [invest, setInvest] = useState(state.investRate);

  const save = () => {
    mutate(s => {
      s.startMonth = start || s.startMonth;
      s.numMonths = Math.min(60, Math.max(3, +num || 18));
      s.regDuration = Math.max(1, +reg || 2);
      s.fxRate = Math.max(1, +fx || 16800);
      s.investRate = Math.max(0, +invest || 0);
      s.batches.forEach(b => { b.importMonth = dateToMonth(s, b.importDate); });
      s.cards.forEach(c => { c.from = Math.min(c.from, H(s)); c.to = Math.min(Math.max(c.to, c.from), H(s)); });
      s.locations.forEach(l => { l.leaseStart = Math.min(l.leaseStart, H(s)); });
    });
    closeModal();
  };

  return (
    <Modal title={t('m_set')} okLabel={t('save')} onOk={save}>
      <div className="row2">
        <div className="field"><label>{t('s_start')}</label><input type="month" value={start} onChange={e => setStart(e.target.value)} /></div>
        <div className="field"><label>{t('s_num')}</label><input type="number" min="3" max="60" value={num} onChange={e => setNum(e.target.value)} /></div>
      </div>
      <div className="field"><label>{t('s_reg')}</label><input type="number" min="1" max="12" value={reg} onChange={e => setReg(e.target.value)} /></div>
      <div className="row2">
        <div className="field"><label>{t('s_fx')}</label><input type="number" min="1" value={fx} onChange={e => setFx(e.target.value)} /></div>
        <div className="field"><label>{t('s_invest')}</label><input type="number" min="0" value={invest} onChange={e => setInvest(e.target.value)} /></div>
      </div>
    </Modal>
  );
}
