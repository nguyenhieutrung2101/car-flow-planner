import { useState } from 'react';
import { useApp } from '../../App.jsx';
import Modal from './Modal.jsx';
import { uid, loc, mLabel, fmtN } from '../../model.js';
import { defName } from '../../cost.js';

export default function LocModal() {
  const { state, t, modal, mutate, closeModal } = useApp();
  const l = modal.id ? loc(state, modal.id) : null;
  const tt = l ? l.type : modal.locType;
  const isTP = tt === 'tp';

  const [name, setName] = useState(l ? l.name : '');
  const [region, setRegion] = useState(l ? (l.region || '') : '');
  const [area, setArea] = useState(l ? l.area : '');
  const [addr, setAddr] = useState(l ? (l.address || '') : '');
  const [gmaps, setGmaps] = useState(l ? (l.gmaps || '') : '');
  const [cap, setCap] = useState(l && isTP ? l.capacity : '');
  const [slots, setSlots] = useState(l && !isTP ? l.slots : 550);
  const [home, setHome] = useState(l && !isTP ? l.homeRate : 45);
  const [invest, setInvest] = useState(l && !isTP && l.investOverride != null ? l.investOverride : '');
  const [leaseStart, setLeaseStart] = useState(l ? l.leaseStart : 0);
  const [leaseMonths, setLeaseMonths] = useState(l ? l.leaseMonths : (isTP ? 12 : 18));
  const [prep, setPrep] = useState(l ? l.prep : (isTP ? 1 : 6));
  const [ov, setOv] = useState(() => structuredClone(l?.costOv || {}));

  const defs = state.costDefs.filter(d => d.scope === tt || d.scope === 'both');
  const setOvField = (id, patch) => setOv(o => ({ ...o, [id]: { ...(o[id] || {}), ...patch } }));

  const save = () => {
    const nm = name.trim();
    if (!nm) { window.alert(t('need_name')); return; }
    const ar = +area || 0;
    // costOv: chỉ giữ entry có nội dung (giống readCostOv bản gốc)
    const cleanOv = {};
    for (const d of defs) {
      const e = ov[d.id] || {};
      const out = {};
      if (e.off) out.off = true;
      if (e.amount !== undefined && e.amount !== '' && e.amount !== null) out.amount = +e.amount;
      if (e.payMonth !== undefined && e.payMonth !== '' && e.payMonth !== null) out.payMonth = +e.payMonth;
      if (Object.keys(out).length) cleanOv[d.id] = out;
    }
    const o = {
      type: tt, name: nm, region: region.trim(), address: addr.trim(), gmaps: gmaps.trim(), area: ar,
      leaseStart: +leaseStart, leaseMonths: Math.max(1, +leaseMonths || 1), prep: Math.max(0, +prep || 0),
      costOv: cleanOv,
    };
    if (isTP) {
      let c = +cap;
      if (!c) c = Math.round(ar / 16.5);
      o.capacity = c;
    } else {
      o.slots = +slots || 0;
      o.homeRate = Math.min(99, Math.max(0, +home || 0));
      o.investOverride = invest === '' ? null : +invest;
    }
    mutate(s => {
      if (l) { const l2 = loc(s, l.id); if (l2) Object.assign(l2, o); }
      else s.locations.push({ id: uid(), ...o });
    });
    closeModal();
  };

  const del = () => {
    const n = state.cards.filter(c => c.locationId === l.id).length;
    if (!window.confirm(t('confirm_del_loc')(n))) return;
    mutate(s => {
      s.locations = s.locations.filter(x => x.id !== l.id);
      s.cards = s.cards.filter(c => c.locationId !== l.id);
    });
    closeModal();
  };

  const monthOptions = Array.from({ length: state.numMonths }, (_, i) => (
    <option key={i} value={i}>{mLabel(state, i)}</option>
  ));

  return (
    <Modal
      wide
      title={l ? l.name : (isTP ? t('m_tp_new') : t('m_dp_new'))}
      okLabel={l ? t('save') : t('add_loc')}
      onOk={save}
      extraFooter={l && <button className="sbtn danger pushLeft" onClick={del}>{t('del_loc')}</button>}
    >
      <div className="field">
        <label>{t('l_name')}</label>
        <input value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="row2">
        <div className="field"><label>{t('l_region')}</label><input value={region} onChange={e => setRegion(e.target.value)} /></div>
        <div className="field"><label>{t('l_area')}</label><input type="number" min="0" value={area} onChange={e => setArea(e.target.value)} /></div>
      </div>
      <div className="field"><label>{t('l_addr')}</label><input value={addr} onChange={e => setAddr(e.target.value)} /></div>
      <div className="field"><label>{t('l_gmaps')}</label><input value={gmaps} onChange={e => setGmaps(e.target.value)} placeholder="https://maps.google.com/..." /></div>

      {isTP ? (
        <div className="field">
          <label>{t('l_cap')}</label>
          <input type="number" min="0" value={cap} onChange={e => setCap(e.target.value)} />
          <div className="mini">{t('l_cap_hint')}</div>
        </div>
      ) : (
        <>
          <div className="row2">
            <div className="field"><label>{t('l_slots')}</label><input type="number" min="0" value={slots} onChange={e => setSlots(e.target.value)} /></div>
            <div className="field"><label>{t('l_home')}</label><input type="number" min="0" max="99" value={home} onChange={e => setHome(e.target.value)} /></div>
          </div>
          <div className="mini">{t('l_home_hint')}</div>
          <div className="field">
            <label>{t('l_invest')}</label>
            <input type="number" min="0" value={invest} onChange={e => setInvest(e.target.value)} />
            <div className="mini">{t('l_invest_hint')(fmtN(state, state.investRate))}</div>
          </div>
        </>
      )}

      <div className="row2">
        <div className="field">
          <label>{t('l_lease')}</label>
          <select value={leaseStart} onChange={e => setLeaseStart(+e.target.value)}>{monthOptions}</select>
        </div>
        <div className="field"><label>{t('l_leasem')}</label><input type="number" min="1" value={leaseMonths} onChange={e => setLeaseMonths(e.target.value)} /></div>
      </div>
      <div className="field">
        <label>{t('l_prep')}</label>
        <input type="number" min="0" value={prep} onChange={e => setPrep(e.target.value)} />
        <div className="mini">{isTP ? t('l_prep_tp') : t('l_prep_dp')}</div>
      </div>

      {defs.length > 0 && (
        <>
          <h4>{t('l_costs')}</h4>
          <div className="costov head">
            <span /><span /><span>{t('ov_amount')}</span><span>{t('ov_month')}</span>
          </div>
          {defs.map(d => {
            const e = ov[d.id] || {};
            const basisLbl = d.basis === 'per_m2_month' ? t('basis_m2') : (d.basis === 'monthly' ? t('basis_monthly') : t('basis_once'));
            return (
              <div key={d.id} className="costov">
                <input
                  type="checkbox" checked={!e.off}
                  onChange={ev => setOvField(d.id, { off: !ev.target.checked })}
                />
                <span>{defName(state, d)} <span className="mini">({fmtN(state, d.amount)} {d.currency})</span></span>
                <input
                  type="number" placeholder="std"
                  value={e.amount ?? ''}
                  onChange={ev => setOvField(d.id, { amount: ev.target.value })}
                />
                {d.basis === 'once' ? (
                  <select
                    value={e.payMonth ?? ''}
                    onChange={ev => setOvField(d.id, { payMonth: ev.target.value === '' ? '' : +ev.target.value })}
                  >
                    <option value="">{t('l_lease')}</option>
                    {monthOptions}
                  </select>
                ) : (
                  <span className="mini">
                    {basisLbl}
                    {d.basis === 'per_m2_month' ? ' · ' + ((d.timing || 'prepaid') === 'prepaid' ? t('timing_pre') : t('timing_mo')) : ''}
                  </span>
                )}
              </div>
            );
          })}
        </>
      )}
    </Modal>
  );
}
