import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../App.jsx';
import Modal from './Modal.jsx';

export default function QtyDialog() {
  const { t, modal, closeModal } = useApp();
  const [val, setVal] = useState(Math.max(1, modal.def));
  const ref = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => { ref.current?.focus(); ref.current?.select(); }, 50);
    return () => clearTimeout(id);
  }, []);

  const ok = () => {
    const q = Math.max(1, +val || 1);
    closeModal();
    modal.onOk(q);
  };

  return (
    <Modal title={modal.title} okLabel={t('m_qty_confirm')} onOk={ok}>
      <div className="mini" style={{ marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: modal.subHTML }} />
      <div className="field">
        <label>{t('n_cars')}</label>
        <input
          ref={ref} type="number" min="1" value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') ok(); }}
        />
      </div>
    </Modal>
  );
}
