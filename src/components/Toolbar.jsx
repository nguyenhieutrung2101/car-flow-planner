import { useRef } from 'react';
import { useApp } from '../App.jsx';

export default function Toolbar() {
  const { state, t, toggleLang, openBatchModal, openLocModal, openCostDefs, openSettings, saveJSON, exportExcel, loadJSON } = useApp();
  const fileRef = useRef(null);
  return (
    <div id="toolbar">
      <h1>CAR FLOW PLANNER</h1>
      <div className="grp">
        <button className="tbtn primary" onClick={() => openBatchModal()}>{t('add_batch')}</button>
        <button className="tbtn" onClick={() => openLocModal(null, 'tp')}>{t('add_tp')}</button>
        <button className="tbtn" onClick={() => openLocModal(null, 'dp')}>{t('add_dp')}</button>
      </div>
      <div className="grp">
        <button className="tbtn" onClick={openCostDefs}>{t('cost_defs')}</button>
        <button className="tbtn" onClick={openSettings}>{t('settings')}</button>
      </div>
      <div className="grp">
        <button className="tbtn" onClick={saveJSON}>{t('save_json')}</button>
        <button className="tbtn" onClick={() => fileRef.current?.click()}>{t('open_json')}</button>
        <button className="tbtn" onClick={exportExcel}>{t('export_xl')}</button>
      </div>
      <button className="tbtn" id="langBtn" onClick={toggleLang}>{state.lang === 'vi' ? 'EN' : 'VI'}</button>
      <input
        type="file" accept=".json" hidden ref={fileRef}
        onChange={e => { const f = e.target.files[0]; if (f) loadJSON(f); e.target.value = ''; }}
      />
    </div>
  );
}
