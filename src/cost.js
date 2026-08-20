/* Cost engine — port nguyên logic tính chi phí theo tháng. */

export const toIDR = (s, amt, cur) => (cur === 'USD' ? amt * s.fxRate : amt);
export const defName = (s, d) => (typeof d.name === 'object' ? (d.name[s.lang] || d.name.vi) : d.name);
export const locDefs = (s, l) => s.costDefs.filter(d => d.scope === l.type || d.scope === 'both');

export function costsByMonth(s, l, t) {
  const NM = s.numMonths;
  const cells = Array.from({ length: NM }, () => ({ tot: 0, items: [] }));
  const push = (m, label, amt, cur) => {
    if (m < 0 || m >= NM || !amt) return;
    cells[m].tot += toIDR(s, amt, cur);
    cells[m].items.push({ label, amt, cur });
  };
  const ls = l.leaseStart ?? 0, lm = Math.max(1, l.leaseMonths || 1);
  const lend = Math.min(ls + lm - 1, NM - 1);
  for (const d of locDefs(s, l)) {
    const ov = (l.costOv || {})[d.id] || {};
    if (ov.off) continue;
    const amt = (ov.amount ?? d.amount) || 0;
    if (d.basis === 'per_m2_month') {
      const monthly = amt * (l.area || 0);
      if ((d.timing || 'prepaid') === 'prepaid') push(ls, defName(s, d), monthly * lm, d.currency);
      else for (let m = ls; m <= lend; m++) push(m, defName(s, d), monthly, d.currency);
    } else if (d.basis === 'monthly') {
      for (let m = ls; m <= lend; m++) push(m, defName(s, d), amt, d.currency);
    } else { // once
      push(ov.payMonth ?? ls, defName(s, d), amt, d.currency);
    }
  }
  if (l.type === 'dp') {
    const rate = l.investOverride ?? s.investRate;
    push(ls, t('c_construction'), rate * (l.slots || 0), 'IDR');
  }
  return cells;
}
