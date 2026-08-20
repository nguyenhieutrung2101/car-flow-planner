import { useApp } from '../App.jsx';

export default function Legend() {
  const { t, activeTab } = useApp();
  if (activeTab !== 'board') {
    return <div id="legend"><span>{t('c_note_click')}</span></div>;
  }
  return (
    <div id="legend">
      <span><span className="sw sw-prep" />{t('lg_prep')}</span>
      <span><span className="sw sw-nolease" />{t('lg_nolease')}</span>
      <span><span className="sw sw-o1" />{t('lg_o1')}</span>
      <span><span className="sw sw-o2" />{t('lg_o2')}</span>
      <span><span className="sw sw-o3" />{t('lg_o3')}</span>
      <span>{t('lg_warn')}</span>
    </div>
  );
}
