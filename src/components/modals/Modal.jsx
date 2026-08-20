import { useApp } from '../../App.jsx';

/* Khung modal chung: mask + header + body + footer (nút phụ / Hủy / OK). */
export default function Modal({ title, wide, onOk, okLabel, extraFooter, children }) {
  const { t, closeModal } = useApp();
  return (
    <div id="mask" className="open" onClick={e => { if (e.target.id === 'mask') closeModal(); }}>
      <div id="modal" className={wide ? 'wide' : ''}>
        <header>{title}</header>
        <div className="body">{children}</div>
        <footer>
          {extraFooter}
          <button className="sbtn" onClick={closeModal}>{t('cancel')}</button>
          <button className="sbtn primary" onClick={onOk}>{okLabel}</button>
        </footer>
      </div>
    </div>
  );
}
