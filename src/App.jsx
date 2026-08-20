import { useState, useMemo, useEffect, createContext, useContext } from 'react';
import { makeT } from './i18n.js';
import {
  defaultState, migrate, uid, loc, bat, tpAllocated, H, mLabel, fmtN,
} from './model.js';
import { saveJSON, exportExcel } from './exportio.js';
import Toolbar from './components/Toolbar.jsx';
import Tabs from './components/Tabs.jsx';
import Legend from './components/Legend.jsx';
import BoardTab from './components/BoardTab.jsx';
import BatchTab from './components/BatchTab.jsx';
import CostTab from './components/CostTab.jsx';
import Panel from './components/Panel.jsx';
import ModalHost from './components/modals/ModalHost.jsx';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export default function App() {
  const [state, setState] = useState(() => migrate(defaultState()));
  const [activeTab, setActiveTab] = useState('board');
  const [selBatch, setSelBatch] = useState(null);
  const [selCard, setSelCard] = useState(null);
  const [panel, setPanel] = useState(null); // null | 'import' | 'batch'
  const [modal, setModal] = useState(null);

  const t = useMemo(() => makeT(state.lang), [state.lang]);
  const mutate = fn => setState(s => { const d = structuredClone(s); fn(d); return d; });

  /* ===== điều hướng / chọn ===== */
  const switchTab = id => { setActiveTab(id); setSelCard(null); setPanel(null); };
  const toggleLang = () => mutate(s => { s.lang = s.lang === 'vi' ? 'en' : 'vi'; });
  const closePanel = () => setPanel(null);
  const clearSel = () => { setSelBatch(null); setSelCard(null); setPanel(null); };
  const selectCard = (batchId, cardId) => { setSelBatch(batchId); setSelCard(cardId ?? null); setPanel('batch'); };

  /* ===== modal ===== */
  const closeModal = () => setModal(null);
  const openBatchModal = id => setModal({ type: 'batch', id });
  const openLocModal = (id, locType) => setModal({ type: 'loc', id, locType });
  const openCostDefs = () => setModal({ type: 'defs' });
  const openSettings = () => setModal({ type: 'settings' });
  const qtyDialog = (title, subHTML, def, onOk) => setModal({ type: 'qty', title, subHTML, def, onOk });

  /* ===== thao tác card ===== */
  const delCard = id => {
    mutate(s => { s.cards = s.cards.filter(x => x.id !== id); });
    setSelCard(null);
  };
  const splitCard = id => mutate(s => {
    const c = s.cards.find(x => x.id === id);
    if (!c || c.qty < 2) return;
    const q = Math.floor(c.qty / 2);
    const n = { ...c, id: uid(), qty: c.qty - q };
    c.qty = q;
    s.cards.push(n);
  });
  const saveCardEdit = (id, patch) => mutate(s => {
    const c = s.cards.find(x => x.id === id);
    if (!c) return;
    c.locationId = patch.locationId;
    let f = patch.from, to = patch.to;
    if (to < f) to = f;
    c.from = f; c.to = to;
    c.qty = Math.max(1, patch.qty || 1);
  });

  const cycleStep = (bid, st) => mutate(s => {
    const b = bat(s, bid);
    if (!b) return;
    const dp = s.cards.filter(c => c.batchId === bid && loc(s, c.locationId)?.type === 'dp').reduce((a, c) => a + c.qty, 0);
    if (dp >= b.qty) return; // auto done
    b.steps ??= {};
    b.steps[st] = ((b.steps[st] ?? 0) + 1) % 3;
  });

  /* ===== kéo thả ===== */
  function handleDrop(p, rowId, m) {
    if (rowId === '__import__') return;
    const target = loc(state, rowId);
    if (!target) return;
    if (p.kind === 'imp') {
      const b = bat(state, p.batchId);
      if (!b) return;
      if (target.type === 'tp') {
        const rem = b.qty - tpAllocated(state, b.id);
        qtyDialog(
          t('d_alloc')(b.name, target.name),
          `${t('d_month_in')}: <b>${mLabel(state, m)}</b> · ${t('d_batch')} ${fmtN(state, b.qty)} · ${t('d_not_alloc')}: ${fmtN(state, Math.max(rem, 0))}`,
          rem > 0 ? rem : b.qty,
          q => {
            mutate(s => { s.cards.push({ id: uid(), batchId: b.id, qty: q, locationId: target.id, from: m, to: Math.min(m + s.regDuration - 1, H(s)) }); });
            setSelBatch(b.id); setSelCard(null); setPanel('batch');
          });
      } else {
        qtyDialog(t('d_direct')(b.name, target.name), `${t('d_month_in')}: <b>${mLabel(state, m)}</b>`, b.qty, q => {
          mutate(s => { s.cards.push({ id: uid(), batchId: b.id, qty: q, locationId: target.id, from: m, to: H(s) }); });
          setSelBatch(b.id); setSelCard(null); setPanel('batch');
        });
      }
      return;
    }
    const c = state.cards.find(x => x.id === p.cardId);
    if (!c) return;
    const src = loc(state, c.locationId);
    if (src && src.type === 'tp' && target.type === 'dp') {
      qtyDialog(
        t('d_move')(target.name),
        `${t('d_from')} ${src.name} · ${t('d_card')} ${fmtN(state, c.qty)} · ${t('d_into')} <b>${mLabel(state, m)}</b>`,
        c.qty,
        q => {
          mutate(s => {
            const c2 = s.cards.find(x => x.id === p.cardId);
            if (!c2) return;
            q = Math.min(q, c2.qty);
            if (q >= c2.qty) {
              if (m > c2.from) { c2.to = m - 1; } else { s.cards = s.cards.filter(x => x.id !== c2.id); }
            } else {
              c2.qty -= q;
              if (m > c2.from) s.cards.push({ id: uid(), batchId: c2.batchId, qty: q, locationId: c2.locationId, from: c2.from, to: m - 1 });
            }
            s.cards.push({ id: uid(), batchId: c2.batchId, qty: q, locationId: target.id, from: m, to: H(s) });
          });
          setSelBatch(c.batchId); setSelCard(null); setPanel('batch');
        });
      return;
    }
    mutate(s => {
      const c2 = s.cards.find(x => x.id === p.cardId);
      if (!c2) return;
      const d = c2.to - c2.from;
      c2.locationId = target.id; c2.from = m; c2.to = Math.min(m + d, H(s));
    });
    setSelBatch(c.batchId); setSelCard(c.id); setPanel('batch');
  }

  /* ===== phím Delete xóa card đang chọn ===== */
  useEffect(() => {
    const h = e => {
      if (e.key !== 'Delete' || !selCard || activeTab !== 'board') return;
      const c = state.cards.find(x => x.id === selCard);
      if (c && window.confirm(t('confirm_del_card')(bat(state, c.batchId)?.name, fmtN(state, c.qty)))) {
        delCard(selCard);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [selCard, activeTab, state, t]);

  /* ===== mở JSON ===== */
  const loadJSON = file => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const s = JSON.parse(r.result);
        if (!s.locations || !s.batches || !s.cards) throw 0;
        setState(migrate(s));
        clearSel();
      } catch { window.alert(t('json_bad')); }
    };
    r.readAsText(file);
  };

  const ctx = {
    state, mutate, t,
    activeTab, switchTab, toggleLang,
    selBatch, selCard, selectCard, clearSel,
    panel, setPanel, closePanel,
    modal, closeModal, openBatchModal, openLocModal, openCostDefs, openSettings, qtyDialog,
    delCard, splitCard, saveCardEdit, cycleStep, handleDrop,
    saveJSON: () => saveJSON(state),
    exportExcel: () => exportExcel(state, t),
    loadJSON,
  };

  return (
    <Ctx.Provider value={ctx}>
      <Toolbar />
      <Tabs />
      <div id="main">
        <div id="boardwrap" onClick={e => {
          if (activeTab !== 'board') return;
          if (e.target.closest('.card')) return;
          if (e.target.closest('.cell')) clearSel();
        }}>
          {activeTab === 'board' && <BoardTab />}
          {activeTab === 'bat' && <BatchTab />}
          {(activeTab === 'tp' || activeTab === 'dp') && <CostTab type={activeTab} />}
        </div>
        {activeTab === 'board' && panel && <Panel />}
      </div>
      <Legend />
      {modal && <ModalHost />}
    </Ctx.Provider>
  );
}
