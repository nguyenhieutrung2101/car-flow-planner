import { useApp } from '../App.jsx';

const TABS = [['board', 'tab_board'], ['bat', 'tab_bat'], ['tp', 'tab_tp'], ['dp', 'tab_dp']];

export default function Tabs() {
  const { t, activeTab, switchTab } = useApp();
  return (
    <div id="tabs">
      {TABS.map(([id, k]) => (
        <button key={id} className={`tab ${activeTab === id ? 'on' : ''}`} onClick={() => switchTab(id)}>
          {t(k)}
        </button>
      ))}
    </div>
  );
}
