import { useApp } from '../App.jsx';
import { mLabel, effCap, fmtN, fmtMoney } from '../model.js';
import { costsByMonth } from '../cost.js';

const W = [150, 170, 52, 72, 72]; // độ rộng 5 cột sticky đầu
const OFFS = W.reduce((a, _, i) => { a.push((a[i - 1] ?? 0) + (W[i - 1] ?? 0)); return a; }, []);

const stick = i => ({ left: OFFS[i], minWidth: W[i], maxWidth: W[i] + 60 });

export default function CostTab({ type }) {
  const { state, t, openLocModal, openCostDefs } = useApp();
  const NM = state.numMonths;
  const locs = state.locations.filter(l => l.type === type);

  const rows = locs.map(l => ({ l, cells: costsByMonth(state, l, t) }));
  const colTot = Array(NM).fill(0);
  let grand = 0;
  rows.forEach(({ cells }) => cells.forEach((c, m) => { colTot[m] += c.tot; grand += c.tot; }));
  const usd = grand / state.fxRate;

  return (
    <div className="dtwrap">
      <div className="dtbar">
        <h2>{type === 'tp' ? t('tpt_title') : t('dpt_title')}</h2>
        <button className="sbtn primary" onClick={() => openLocModal(null, type)}>
          {type === 'tp' ? t('add_tp') : t('add_dp')}
        </button>
        <button className="sbtn" onClick={openCostDefs}>{t('cost_defs')}</button>
        <span className="note">
          {t('c_grand')}: <b>{fmtN(state, Math.round(grand))} IDR</b> ≈ {fmtN(state, Math.round(usd))} USD (fx {fmtN(state, state.fxRate)})
        </span>
      </div>
      <table className="dt">
        <thead>
          <tr>
            <th className="stick" style={stick(0)}>{t('c_name')}</th>
            <th className="stick" style={stick(1)}>{t('c_addr')}</th>
            <th className="stick" style={stick(2)}>{t('c_map')}</th>
            <th className="stick" style={stick(3)}>{t('c_area')}</th>
            <th className="stick" style={stick(4)}>{t('c_cap')}</th>
            {Array.from({ length: NM }, (_, m) => <th key={m} className="num">{mLabel(state, m)}</th>)}
            <th className="num">{t('c_total')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ l, cells }) => {
            const rowTot = cells.reduce((a, c) => a + c.tot, 0);
            return (
              <tr key={l.id}>
                <td className="stick nameCell" style={stick(0)} onClick={() => openLocModal(l.id)}>
                  <b>{l.name}</b><br /><span className="mut">{l.region || ''}</span>
                </td>
                <td className="stick wrap" style={stick(1)}>{l.address || ''}</td>
                <td className="stick" style={stick(2)}>
                  {l.gmaps ? <a href={l.gmaps} target="_blank" rel="noopener noreferrer">{t('c_open')}</a> : '—'}
                </td>
                <td className="stick num" style={stick(3)}>{fmtN(state, l.area)}</td>
                <td className="stick num" style={stick(4)}>{fmtN(state, effCap(l))}</td>
                {cells.map((c, m) => (
                  <td
                    key={m}
                    className={`money ${c.tot ? 'has' : ''}`}
                    title={c.items.map(it => `${it.label}: ${fmtN(state, it.amt)} ${it.cur}`).join('\n')}
                  >
                    {c.tot ? fmtMoney(state, c.tot) : ''}
                  </td>
                ))}
                <td className="money pre">{fmtMoney(state, rowTot)}</td>
              </tr>
            );
          })}
          <tr className="total">
            <td className="stick" style={stick(0)}>{t('c_all')}</td>
            <td className="stick" style={stick(1)} />
            <td className="stick" style={stick(2)} />
            <td className="stick" style={stick(3)} />
            <td className="stick" style={stick(4)} />
            {colTot.map((v, m) => <td key={m} className="money">{v ? fmtMoney(state, v) : ''}</td>)}
            <td className="money">{fmtMoney(state, grand)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
