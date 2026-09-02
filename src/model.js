/* Dữ liệu, state mặc định & các hàm thuần — port từ bản gốc, các hàm nhận
   `state` làm tham số đầu thay vì đọc biến toàn cục. */

export const PALETTE = ['#2e5d8c', '#3d8b5f', '#b7791f', '#8c4646', '#5b5ea6', '#2a7f8f',
  '#7a6210', '#a04f7c', '#4d6b2f', '#8a5a3b', '#37698a', '#6b4f8a'];
export const VEHICLES = ['VF5', 'VFe34', 'Limo', 'VF6', 'EvoGrand', 'Feliz'];
export const STEPS = ['quota', 'tera', 'kir', 'kp', 'stnk'];
export const STEP_LBL = { quota: 'Taxi Quota', tera: 'TERA', kir: 'KIR', kp: 'KP', stnk: 'STNK' };

export const uid = () => Math.random().toString(36).slice(2, 9);

function defaultCostDefs() {
  return [
    { id: 'd_land_tp', scope: 'tp', basis: 'per_m2_month', amount: 49950, currency: 'IDR', timing: 'prepaid', name: { vi: 'Thuê đất', en: 'Land lease' } },
    { id: 'd_opex_tp', scope: 'tp', basis: 'monthly', amount: 260717529, currency: 'IDR', timing: 'monthly', name: { vi: 'Vận hành hàng tháng', en: 'Monthly operations' } },
    { id: 'd_setup_tp', scope: 'tp', basis: 'once', amount: 192309720, currency: 'IDR', timing: 'prepaid', name: { vi: 'Vật tư ban đầu', en: 'Initial materials' } },
    { id: 'd_elec_tp', scope: 'tp', basis: 'once', amount: 1110000000, currency: 'IDR', timing: 'prepaid', name: { vi: 'Nâng cấp đường điện', en: 'Electricity upgrade' } },
    { id: 'd_land_dp', scope: 'dp', basis: 'per_m2_month', amount: 24420, currency: 'IDR', timing: 'prepaid', name: { vi: 'Thuê đất', en: 'Land lease' } },
  ];
}

export function defaultState() {
  return {
    lang: 'vi', startMonth: '2026-01', numMonths: 18, regDuration: 2,
    fxRate: 16800, investRate: 50000000,
    costDefs: defaultCostDefs(),
    locations: [
      { id: 'L1', type: 'tp', name: 'Natura Phase 1', region: 'Jawa Barat', address: 'Kawasan Natura, Jawa Barat', gmaps: '', area: 80000, capacity: 4525, leaseStart: 0, leaseMonths: 12, prep: 1, costOv: {} },
      { id: 'L2', type: 'tp', name: 'VIVO Phase 1', region: 'Jawa Barat', address: 'Kawasan VIVO, Jawa Barat', gmaps: '', area: 28850, capacity: 1692, leaseStart: 0, leaseMonths: 12, prep: 1, costOv: {} },
      { id: 'L3', type: 'tp', name: 'Ciracas', region: 'Jakarta Timur', address: 'Ciracas, Jakarta Timur', gmaps: '', area: 28470, capacity: 1500, leaseStart: 5, leaseMonths: 12, prep: 1, costOv: {} },
      { id: 'L4', type: 'dp', name: 'Depot Cawang', region: 'Jakarta Timur', address: 'Cawang, Jakarta Timur', gmaps: '', area: 20000, slots: 550, homeRate: 45, leaseStart: 0, leaseMonths: 18, prep: 6, costOv: {}, investOverride: null },
      { id: 'L5', type: 'dp', name: 'Depot Kemayoran B9', region: 'Jakarta Pusat', address: 'Blok B9 Kemayoran, Jakarta Pusat', gmaps: '', area: 19600, slots: 400, homeRate: 45, leaseStart: 2, leaseMonths: 16, prep: 6, costOv: {}, investOverride: null },
    ],
    batches: [
      { id: 'B1', name: 'Batch 01', vehicleType: 'VF5', qty: 1000, importDate: '2026-07-05', importMonth: 6, color: PALETTE[0], steps: { quota: 2, tera: 2, kir: 2, kp: 2, stnk: 2 } },
      { id: 'B2', name: 'Batch 02', vehicleType: 'VFe34', qty: 800, importDate: '2026-09-10', importMonth: 8, color: PALETTE[1], steps: { quota: 2, tera: 1, kir: 1, kp: 0, stnk: 0 } },
    ],
    cards: [
      { id: 'C1', batchId: 'B1', qty: 600, locationId: 'L1', from: 6, to: 7 },
      { id: 'C2', batchId: 'B1', qty: 400, locationId: 'L2', from: 6, to: 7 },
      { id: 'C3', batchId: 'B1', qty: 600, locationId: 'L4', from: 8, to: 17 },
      { id: 'C4', batchId: 'B1', qty: 400, locationId: 'L4', from: 8, to: 17 },
      { id: 'C5', batchId: 'B2', qty: 500, locationId: 'L1', from: 8, to: 9 },
    ],
  };
}

export function migrate(s) {
  s.lang ??= 'vi'; s.fxRate ??= 16800; s.investRate ??= 50000000;
  s.costDefs ??= defaultCostDefs();
  (s.locations || []).forEach(l => {
    l.address ??= ''; l.gmaps ??= ''; l.costOv ??= {};
    l.leaseMonths ??= Math.max(1, s.numMonths - (l.leaseStart || 0));
    if (l.type === 'dp') l.investOverride ??= null;
  });
  (s.batches || []).forEach(b => {
    b.steps ??= { quota: 0, tera: 0, kir: 0, kp: 0, stnk: 0 };
    if (!b.importDate) { b.importDate = monthToDate(s, b.importMonth ?? 0); }
    b.importMonth = dateToMonth(s, b.importDate);
  });
  return s;
}

/* ===== month / date helpers ===== */
function baseYM(s) { const [y, m] = s.startMonth.split('-').map(Number); return y * 12 + (m - 1); }
export function mLabel(s, i, withYear = true) {
  const tot = baseYM(s) + i, yy = Math.floor(tot / 12), mm = tot % 12 + 1;
  return withYear ? `T${mm}/${String(yy).slice(2)}` : `T${mm}`;
}
export function monthToDate(s, i) { const tot = baseYM(s) + i; return `${Math.floor(tot / 12)}-${String(tot % 12 + 1).padStart(2, '0')}-01`; }
export function dateToMonth(s, d) {
  if (!d) return 0;
  const [y, m] = d.split('-').map(Number);
  return Math.min(Math.max((y * 12 + (m - 1)) - baseYM(s), 0), (s.numMonths || 18) - 1);
}
export const H = s => s.numMonths - 1;

/* ===== derived ===== */
export const loc = (s, id) => s.locations.find(l => l.id === id);
export const bat = (s, id) => s.batches.find(b => b.id === id);
export function effCap(l) {
  if (l.type === 'tp') return l.capacity || 0;
  const hr = (l.homeRate || 0) / 100;
  return hr < 1 ? Math.round((l.slots || 0) / (1 - hr)) : (l.slots || 0);
}
export const readyMonth = l => (l.leaseStart ?? 0) + (l.prep ?? 0);
export function occupancy(s, locId, m) { return s.cards.filter(c => c.locationId === locId && c.from <= m && c.to >= m).reduce((a, c) => a + c.qty, 0); }
export function tpAllocated(s, bid) { return s.cards.filter(c => c.batchId === bid && loc(s, c.locationId)?.type === 'tp').reduce((a, c) => a + c.qty, 0); }
export function dpAllocated(s, bid) { return s.cards.filter(c => c.batchId === bid && loc(s, c.locationId)?.type === 'dp').reduce((a, c) => a + c.qty, 0); }
export const batchAutoDone = (s, b) => dpAllocated(s, b.id) >= b.qty;

/* ===== format ===== */
export function fmtN(s, n) { return (Number(n) || 0).toLocaleString(s.lang === 'vi' ? 'vi-VN' : 'en-US'); }
export function fmtMoney(s, n) {
  n = Number(n) || 0; const a = Math.abs(n);
  const lc = s.lang === 'vi' ? 'vi-VN' : 'en-US';
  if (a >= 1e9) return (n / 1e9).toLocaleString(lc, { maximumFractionDigits: 2 }) + 'B';
  if (a >= 1e6) return (n / 1e6).toLocaleString(lc, { maximumFractionDigits: 1 }) + 'M';
  return n.toLocaleString(lc);
}
export function esc(x) { return String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

/* Xếp card vào lane để không đè nhau — trả về Map(key → lane) + số lane. */
export function laneAssign(items, keyOf) {
  const lanes = []; const laneOf = new Map();
  [...items].sort((a, b) => a.from - b.from || a.to - b.to).forEach(c => {
    let ln = 0;
    while (lanes[ln] !== undefined && lanes[ln] >= c.from) ln++;
    lanes[ln] = c.to; laneOf.set(keyOf(c), ln);
  });
  return { laneOf, count: Math.max(1, lanes.length) };
}
