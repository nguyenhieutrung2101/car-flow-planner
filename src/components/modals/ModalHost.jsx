import { useApp } from '../../App.jsx';
import BatchModal from './BatchModal.jsx';
import LocModal from './LocModal.jsx';
import CostDefsModal from './CostDefsModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import QtyDialog from './QtyDialog.jsx';

export default function ModalHost() {
  const { modal } = useApp();
  switch (modal.type) {
    case 'batch': return <BatchModal key={modal.id || 'new'} />;
    case 'loc': return <LocModal key={modal.id || `new-${modal.locType}`} />;
    case 'defs': return <CostDefsModal />;
    case 'settings': return <SettingsModal />;
    case 'qty': return <QtyDialog />;
    default: return null;
  }
}
