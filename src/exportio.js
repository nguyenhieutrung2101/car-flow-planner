/* Lưu/mở JSON + xuất Excel (SpreadsheetML) — port nguyên từ bản gốc. */
import { STEPS, STEP_LBL, mLabel, effCap, occupancy, tpAllocated, dpAllocated, batchAutoDone, loc, bat } from './model.js';
import { costsByMonth } from './cost.js';

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function saveJSON(state) {
  const clean = JSON.parse(JSON.stringify(state));
  download(new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' }), 'car_flow_plan.json');
}

export function exportExcel(s, t) {
  const NM = s.numMonths;
  const xEsc = x => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cS = v => `<Cell><Data ss:Type="String">${xEsc(v)}</Data></Cell>`;
  const cSH = v => `<Cell ss:StyleID="h"><Data ss:Type="String">${xEsc(v)}</Data></Cell>`;
  const cN = v => `<Cell ss:StyleID="n"><Data ss:Type="Number">${Number(v) || 0}</Data></Cell>`;
  const row = c => `<Row>${c}</Row>`;

  let s1 = row(['No', t('c_name'), t('df_scope'), t('l_region'), t('l_addr'), t('l_gmaps'), t('c_area'), t('c_cap'), t('l_slots'), t('l_home'), t('l_lease'), t('l_leasem'), t('l_prep')].map(cSH).join(''));
  s.locations.forEach((l, i) => {
    s1 += row(cN(i + 1) + cS(l.name) + cS(l.type === 'tp' ? t('tp') : t('dp')) + cS(l.region || '') + cS(l.address || '') + cS(l.gmaps || '')
      + cN(l.area) + cN(effCap(l)) + (l.type === 'dp' ? cN(l.slots) : cS('')) + (l.type === 'dp' ? cN(l.homeRate) : cS(''))
      + cS(mLabel(s, l.leaseStart)) + cN(l.leaseMonths) + cN(l.prep));
  });

  let s2 = row([t('batch'), t('vtype'), t('qty'), t('bt_date'), t('alloc_tp'), t('alloc_dp'), ...STEPS.map(x => STEP_LBL[x]), t('bt_prog')].map(cSH).join(''));
  s.batches.forEach(b => {
    const auto = batchAutoDone(s, b);
    const stepVals = STEPS.map(x => (auto ? t('bt_auto') : t('st' + (b.steps?.[x] ?? 0))));
    const done = auto ? STEPS.length : STEPS.filter(x => (b.steps?.[x] ?? 0) === 2).length;
    s2 += row(cS(b.name) + cS(b.vehicleType) + cN(b.qty) + cS(b.importDate || mLabel(s, b.importMonth))
      + cN(tpAllocated(s, b.id)) + cN(dpAllocated(s, b.id)) + stepVals.map(cS).join('') + cS(`${done}/${STEPS.length}`));
  });

  let s3 = row([t('batch'), t('vtype'), t('qty'), t('layer'), t('locn'), t('d_from'), t('to_m'), t('month_s')].map(cSH).join(''));
  s.cards.forEach(c => {
    const b = bat(s, c.batchId), l = loc(s, c.locationId);
    s3 += row(cS(b ? b.name : '?') + cS(b ? b.vehicleType : '') + cN(c.qty) + cS(l ? (l.type === 'tp' ? t('tp') : t('dp')) : '?')
      + cS(l ? l.name : '?') + cS(mLabel(s, c.from)) + cS(mLabel(s, c.to)) + cN(c.to - c.from + 1));
  });

  let hdr4 = cSH(t('locn')) + cSH(t('df_scope')) + cSH('Capacity');
  for (let m = 0; m < NM; m++) hdr4 += cSH(mLabel(s, m));
  let s4 = row(hdr4);
  s.locations.forEach(l => {
    let r = cS(l.name) + cS(l.type === 'tp' ? t('tp') : t('dp')) + cN(effCap(l));
    for (let m = 0; m < NM; m++) r += cN(occupancy(s, l.id, m));
    s4 += row(r);
  });

  const costSheet = type => {
    let hdr = cSH(t('locn'));
    for (let m = 0; m < NM; m++) hdr += cSH(mLabel(s, m));
    hdr += cSH(t('c_total'));
    let sh = row(hdr);
    const colTot = Array(NM).fill(0); let grand = 0;
    s.locations.filter(l => l.type === type).forEach(l => {
      const cells = costsByMonth(s, l, t); let r = cS(l.name), rt = 0;
      cells.forEach((c, m) => { colTot[m] += c.tot; rt += c.tot; r += cN(Math.round(c.tot)); });
      grand += rt; sh += row(r + cN(Math.round(rt)));
    });
    let tr = cS(t('c_all')); colTot.forEach(v => tr += cN(Math.round(v))); tr += cN(Math.round(grand));
    return sh + row(tr);
  };

  const ws = (name, rows) => `<Worksheet ss:Name="${name}"><Table>${rows}</Table></Worksheet>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
<Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#D9D9D9" ss:Pattern="Solid"/></Style>
<Style ss:ID="n"><NumberFormat ss:Format="#,##0"/></Style>
</Styles>
${ws('Locations', s1)}${ws('Batches', s2)}${ws('Allocations', s3)}${ws('Occupancy', s4)}
${ws('Cost TP (IDR)', costSheet('tp'))}${ws('Cost Depot (IDR)', costSheet('dp'))}
</Workbook>`;
  download(new Blob([xml], { type: 'application/vnd.ms-excel' }), 'car_flow_plan.xls');
}
