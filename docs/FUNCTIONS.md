# Function & Component Inventory

Generated from a full read of the source tree at commit `6c1df89`.

**Scope:** all first-party source files.
**Excluded:** `node_modules/`, `dist/`, `package-lock.json`, and `public/legacy.html` (the frozen v1 single-file app — a complete snapshot of the pre-React implementation, kept only as a deployable fallback at `/legacy.html`; its ~100 internal functions are not part of the React app and are not inventoried here). There are no test files or third-party vendored sources in the repo.

**Conventions used below:**
- `state` = the central app-state object (see `defaultState()` in `src/model.js`): `{ lang, startMonth, numMonths, regDuration, fxRate, investRate, costDefs[], locations[], batches[], cards[] }`.
- `t` = translator function `key => string | fn` produced by `makeT(lang)`.
- [PUBLIC] = exported from its module. React components consumed via JSX are also marked [PUBLIC] when exported.
- "ctx" = the app context object provided by `<App>` and read with `useApp()`.

---

## 1. File map

| File | Role |
| --- | --- |
| `index.html` | Vite entry page: favicon, `#root`, loads `src/main.jsx`. No script logic. |
| `vite.config.js` | Vite config: registers the React plugin. No functions. |
| `wrangler.jsonc` | Cloudflare Workers config (assets `./dist`, build command). Data only. |
| `src/main.jsx` | Bootstrap: mounts `<App>` into `#root`, imports global CSS. |
| `src/App.jsx` | Root component: owns all app state, selection, modal routing, drag-drop handler; provides everything to children via React context. |
| `src/i18n.js` | VI/EN translation table + translator factory. |
| `src/model.js` | Domain model: constants, default state, migration, date/month math, derived queries, formatting, lane packing. All pure. |
| `src/cost.js` | Cost engine: computes per-month cost cells for a location. Pure. |
| `src/exportio.js` | JSON save + Excel (SpreadsheetML) export + browser download helper. |
| `src/styles.css` | Neo-brutalism pastel design system. No logic. |
| `src/components/Toolbar.jsx` | Top toolbar: action buttons, language toggle, hidden JSON file input. |
| `src/components/Tabs.jsx` | Tab strip (board / batches / TP costs / depot costs). |
| `src/components/Legend.jsx` | Bottom legend bar, varies by active tab. |
| `src/components/BoardTab.jsx` | Timeline board: month header, section rows, import row, location rows, cards, HTML5 drag & drop. |
| `src/components/BatchTab.jsx` | Batch table with registration-step chips. |
| `src/components/CostTab.jsx` | Monthly cost table (sticky columns, tooltips, totals) for TP or depot. |
| `src/components/Panel.jsx` | Right side panel: import summary or batch tracking + card editor. |
| `src/components/modals/Modal.jsx` | Generic modal shell (mask, header, footer). |
| `src/components/modals/ModalHost.jsx` | Renders the active modal by `modal.type`. |
| `src/components/modals/QtyDialog.jsx` | "How many cars?" prompt used by drag-drop flows. |
| `src/components/modals/BatchModal.jsx` | Create/edit/delete an import batch. |
| `src/components/modals/LocModal.jsx` | Create/edit/delete a location (TP/depot) incl. cost overrides. |
| `src/components/modals/CostDefsModal.jsx` | Edit the standard cost-definition table. |
| `src/components/modals/SettingsModal.jsx` | Global settings (timeline, FX, invest rate). |

---

## 2. `src/main.jsx`

No function definitions. Top-level side effect: `createRoot(document.getElementById('root')).render(<App />)` (line 5) — mounts the React tree into the DOM.

## 3. `src/i18n.js`

### `I18N` — line 3 [PUBLIC]
Data constant, not a function: `{ vi: {...}, en: {...} }`. Contains 11 parameterized **message-builder functions per language** (22 total), all pure string builders returning HTML/text:
`w_remain(c)`, `w_over(c)`, `w_dp_over(a, b)`, `w_early(l, m1, m2)`, `w_dwell(l, n, r)`, `l_invest_hint(s)`, `confirm_del_loc(n)`, `d_alloc(b, l)`, `d_direct(b, l)`, `d_move(l)`, `confirm_del_card(n, q)` (vi: lines 22–26, 40, 46, 57, 59, 75; en: lines 84–88, 100, 105, 116, 118, 124).

### `makeT(lang)` — line 126 [PUBLIC]
- Signature: `(lang: 'vi'|'en') => (k: string) => string | Function`
- Purpose: builds the translator `t`; falls back en→vi→raw key.
- Calls: none. Called by: `App` (memoized as `t`), and transitively by nearly every component.
- Side effects: pure.

## 4. `src/model.js`

Data constants [PUBLIC]: `PALETTE` (line 4), `VEHICLES` (6), `STEPS` (7), `STEP_LBL` (8).

| Function | Line | Signature | Purpose | Calls / Called by | Side effects |
| --- | --- | --- | --- | --- | --- |
| `uid()` [PUBLIC] | 10 | `() => string` | Random 7-char id for batches/locations/cards. | — / App (`splitCard`, `handleDrop`), BatchModal, LocModal, CostDefsModal | pure (nondeterministic) |
| `defaultCostDefs()` [PUBLIC] | 12 | `() => CostDef[]` | Standard cost-definition seed rows. | — / `defaultState`, `migrate` | pure |
| `defaultState()` [PUBLIC] | 22 | `() => State` | Full demo state (5 locations, 2 batches, 5 cards). | `defaultCostDefs` / App initial `useState` | pure |
| `migrate(s)` [PUBLIC] | 48 | `(s: State) => State` | Backfills missing fields on loaded/older state; recomputes `importMonth` from `importDate`. | `defaultCostDefs`, `monthToDate`, `dateToMonth` / App (init + `loadJSON`) | **mutates its argument** (returned) |
| `baseYM(s)` [PUBLIC] | 65 | `(s: State) => number` | `startMonth` as absolute month count (y×12+m). | — / `mLabel`, `monthToDate`, `dateToMonth` | pure |
| `mLabel(s, i, withYear?)` [PUBLIC] | 66 | `(s, i: number, withYear = true) => string` | Month index → label `T7/26` or `T7`. | `baseYM` / BoardTab, Panel, CostTab, LocModal, App (`handleDrop`), `exportExcel` | pure |
| `monthToDate(s, i)` [PUBLIC] | 70 | `(s, i: number) => string` | Month index → ISO date `YYYY-MM-01`. | `baseYM` / `migrate`, BatchModal | pure |
| `dateToMonth(s, d)` [PUBLIC] | 71 | `(s, d: string) => number` | ISO date → clamped month index on the timeline. | `baseYM` / `migrate`, BatchModal, SettingsModal | pure |
| `H(s)` [PUBLIC] | 76 | `(s: State) => number` | Last month index (`numMonths - 1`). | — / App (`handleDrop`), Panel, BoardTab, SettingsModal | pure |
| `loc(s, id)` [PUBLIC] | 79 | `(s, id: string) => Location \| undefined` | Find location by id. | — / App, Panel, LocModal, `tpAllocated`, `dpAllocated`, `exportExcel` | pure |
| `bat(s, id)` [PUBLIC] | 80 | `(s, id: string) => Batch \| undefined` | Find batch by id. | — / App, BoardTab `Card`, Panel, BatchModal, `exportExcel` | pure |
| `effCap(l)` [PUBLIC] | 81 | `(l: Location) => number` | Effective capacity: TP = `capacity`; depot = `slots ÷ (1 − homeRate%)`. | — / BoardTab `LocRow`, CostTab, `exportExcel` | pure |
| `readyMonth(l)` [PUBLIC] | 86 | `(l: Location) => number` | First usable month (`leaseStart + prep`). | — / BoardTab (`Card`, `LocRow`), Panel warnings | pure |
| `occupancy(s, locId, m)` [PUBLIC] | 87 | `(s, locId: string, m: number) => number` | Cars sitting in a location during month `m`. | — / BoardTab `LocRow`, `exportExcel` | pure |
| `tpAllocated(s, bid)` [PUBLIC] | 88 | `(s, bid: string) => number` | Batch quantity already allocated to temp parking. | `loc` / App (`handleDrop`), BoardTab `Card`, Panel, BatchTab, `exportExcel` | pure |
| `dpAllocated(s, bid)` [PUBLIC] | 89 | `(s, bid: string) => number` | Batch quantity already moved to depots. | `loc` / `batchAutoDone`, Panel, BatchTab, `exportExcel` | pure |
| `batchAutoDone(s, b)` [PUBLIC] | 90 | `(s, b: Batch) => boolean` | True when the whole batch reached depots (auto-completes steps). | `dpAllocated` / BatchTab `StepChip`, `exportExcel` | pure |
| `fmtN(s, n)` [PUBLIC] | 93 | `(s, n: number) => string` | Locale thousands formatting (vi-VN / en-US). | — / most components, App dialogs, `exportExcel` is N/A (uses raw numbers) | pure |
| `fmtMoney(s, n)` [PUBLIC] | 94 | `(s, n: number) => string` | Compact money: `1,2B` / `260,7M` / plain. | — / CostTab | pure |
| `esc(x)` [PUBLIC] | 101 | `(x: any) => string` | HTML-escape (`& < > "`). | — / Panel (escapes names injected into warning HTML) | pure |
| `laneAssign(items, keyOf)` [PUBLIC] | 104 | `(items: {from,to}[], keyOf: item => string) => { laneOf: Map<string, number>, count: number }` | Greedy interval packing of cards into non-overlapping lanes. | — / BoardTab (`ImportRow`, `LocRow`) | pure (does not mutate input; sorts a copy) |

## 5. `src/cost.js`

| Function | Line | Signature | Purpose | Calls / Called by | Side effects |
| --- | --- | --- | --- | --- | --- |
| `toIDR(s, amt, cur)` [PUBLIC] | 3 | `(s, amt: number, cur: 'IDR'\|'USD') => number` | Convert USD→IDR by `s.fxRate`; IDR passes through. | — / `costsByMonth` (only) | pure |
| `defName(s, d)` [PUBLIC] | 4 | `(s, d: CostDef) => string` | Localized name of a cost definition. | — / `costsByMonth`, LocModal | pure |
| `locDefs(s, l)` [PUBLIC] | 5 | `(s, l: Location) => CostDef[]` | Cost defs applying to a location (its type or `both`). | — / `costsByMonth` (only) | pure |
| `costsByMonth(s, l, t)` [PUBLIC] | 7 | `(s, l: Location, t: translator) => { tot: number, items: {label, amt, cur}[] }[]` | Per-month cost cells: land per-m² (prepaid or monthly), monthly opex, one-time items with pay-month override, depot construction (`investRate × slots` at lease start). Honors per-location overrides (`off`, `amount`, `payMonth`). | inner `push(m, label, amt, cur)` (line 10), `locDefs`, `defName`, `toIDR` / CostTab, `exportExcel` | pure |

## 6. `src/exportio.js`

| Function | Line | Signature | Purpose | Calls / Called by | Side effects |
| --- | --- | --- | --- | --- | --- |
| `download(blob, name)` [PUBLIC] | 5 | `(blob: Blob, name: string) => void` | Trigger a browser file download via a temporary `<a>` + object URL. | — / `saveJSON`, `exportExcel` | **DOM manipulation, starts a download**, revokes URL after 2 s |
| `saveJSON(state)` [PUBLIC] | 13 | `(state: State) => void` | Serialize state to pretty JSON and download as `car_flow_plan.json`. | `download` / Toolbar (via ctx `saveJSON`) | download side effect |
| `exportExcel(s, t)` [PUBLIC] | 18 | `(s: State, t: translator) => void` | Build a 6-sheet SpreadsheetML workbook (Locations, Batches, Allocations, Occupancy, Cost TP, Cost Depot) and download `car_flow_plan.xls`. | inner helpers `xEsc`, `cS`, `cSH`, `cN`, `row` (lines 20–24), `costSheet(type)` (58), `ws(name, rows)` (73); model: `mLabel`, `effCap`, `occupancy`, `tpAllocated`, `dpAllocated`, `batchAutoDone`, `loc`, `bat`, `STEPS`, `STEP_LBL`; cost: `costsByMonth` / Toolbar (via ctx `exportExcel`) | download side effect |

## 7. `src/App.jsx`

### `useApp()` — line 17 [PUBLIC]
- Signature: `() => ctx`
- Purpose: context hook; the only way components reach state/actions.
- Called by: every component in `src/components/**`.
- Side effects: pure (React hook).

### `App()` — line 19 [PUBLIC, default]
- Signature: `() => JSX`
- Purpose: owns all state (`state`, `activeTab`, `selBatch`, `selCard`, `panel`, `modal`), builds ctx, renders chrome + active tab + panel + modal host.
- Side effects: React state; registers a window `keydown` listener (effect, line 138).

Closures defined inside `App` (exposed through ctx unless noted):

| Function | Line | Signature | Purpose | Calls | Side effects |
| --- | --- | --- | --- | --- | --- |
| `mutate(fn)` | 28 | `(fn: draft => void) => void` | Central state updater: `structuredClone` then apply `fn`. | `setState` | React state write |
| `switchTab(id)` | 31 | `(id: 'board'\|'bat'\|'tp'\|'dp') => void` | Change tab; clears card selection + panel. | setters | state write |
| `toggleLang()` | 32 | `() => void` | Flip `state.lang` vi↔en. | `mutate` | state write |
| `closePanel()` | 33 | `() => void` | Hide side panel. | `setPanel` | state write |
| `clearSel()` | 34 | `() => void` | Clear batch/card selection and panel. | setters | state write |
| `selectCard(batchId, cardId)` | 35 | `(batchId: string, cardId?: string) => void` | Select a card/batch and open tracking panel. | setters | state write |
| `closeModal()` | 38 | `() => void` | Dismiss modal. | `setModal` | state write |
| `openBatchModal(id)` | 39 | `(id?: string) => void` | Open batch create/edit modal. | `setModal` | state write |
| `openLocModal(id, locType)` | 40 | `(id?: string, locType?: 'tp'\|'dp') => void` | Open location modal (edit if `id`, else create of `locType`). | `setModal` | state write |
| `openCostDefs()` | 41 | `() => void` | Open cost-definitions modal. | `setModal` | state write |
| `openSettings()` | 42 | `() => void` | Open settings modal. | `setModal` | state write |
| `qtyDialog(title, subHTML, def, onOk)` | 43 | `(title: string, subHTML: string, def: number, onOk: q => void) => void` | Open quantity prompt; `onOk` receives the confirmed number. | `setModal` | state write |
| `delCard(id)` | 46 | `(id: string) => void` | Remove a card; clear card selection. | `mutate` | state write |
| `splitCard(id)` | 50 | `(id: string) => void` | Split a card into two halves (⌊q/2⌋ / rest). | `mutate`, `uid` | state write |
| `saveCardEdit(id, patch)` | 58 | `(id: string, patch: {locationId, from, to, qty}) => void` | Apply card editor values; clamps `to ≥ from`, `qty ≥ 1`. | `mutate` | state write |
| `cycleStep(bid, st)` | 68 | `(bid: string, st: StepKey) => void` | Cycle a registration step 0→1→2→0 unless batch is auto-done. | `mutate`, `bat`, inline dp calc | state write |
| `handleDrop(p, rowId, m)` | 78 | `(p: {kind:'imp',batchId} \| {kind:'card',cardId}, rowId: string, m: number) => void` | Drag-drop dispatcher: import→TP (qty dialog, stay `regDuration` months), import→depot direct, TP-card→depot (split/truncate source, create depot card), otherwise move card keeping duration. | `loc`, `bat`, `tpAllocated`, `qtyDialog`, `mutate`, `uid`, `mLabel`, `fmtN`, `H` | state write (via dialog callbacks) |
| keydown handler `h(e)` (not in ctx) | 139 | `(e: KeyboardEvent) => void` | Delete key removes selected card after `confirm()`. | `delCard`, `bat`, `fmtN` | `window.confirm`, state write |
| `loadJSON(file)` | 151 | `(file: File) => void` | Read a JSON file, validate shape, `migrate`, replace state, clear selection. | `FileReader`, `migrate`, `setState`, `clearSel` | file read, state write, `alert` on bad JSON |

## 8. `src/components/Toolbar.jsx`

### `Toolbar()` — line 4 [PUBLIC, default]
- Signature: `() => JSX`
- Purpose: title, action buttons (new batch/TP/depot, cost defs, settings, save/open JSON, export Excel), language toggle; owns the hidden file input (`useRef`).
- Calls: ctx `openBatchModal`, `openLocModal`, `openCostDefs`, `openSettings`, `saveJSON`, `exportExcel`, `loadJSON`, `toggleLang`.
- Side effects: none beyond delegated ctx actions.

## 9. `src/components/Tabs.jsx`

Data constant `TABS` (line 3).

### `Tabs()` — line 5 [PUBLIC, default]
- Signature: `() => JSX`
- Purpose: renders the 4 tab buttons, highlights active, calls `switchTab`.
- Side effects: none.

## 10. `src/components/Legend.jsx`

### `Legend()` — line 3 [PUBLIC, default]
- Signature: `() => JSX`
- Purpose: bottom legend — board swatches (prep/nolease/occupancy tiers) or cost-tab hint.
- Side effects: none.

## 11. `src/components/BoardTab.jsx`

Constant `LANE_H = 46` (line 6).

| Function | Line | Signature | Purpose | Calls | Side effects |
| --- | --- | --- | --- | --- | --- |
| `Cell({rowId, month, height, extraClass, children})` | 9 | props → JSX | One grid cell; drop target (except import row). Adds/removes `dropok` class imperatively during drag-over; parses payload and forwards to `handleDrop`. | ctx `handleDrop` | imperative `classList` toggling |
| `Card({card, lane, imp})` | 32 | props → JSX | A draggable allocation card (or import card with remaining badge); highlight/dim by selected batch; warn icon if placed before location ready. | `bat`, `tpAllocated`, `readyMonth`, `mLabel`, `fmtN`, ctx `selectCard`; sets `dataTransfer` on drag start | drag payload write |
| `SecTitle({label, addType})` | 87 | props → JSX | Ink-colored layer header with optional "+ add" button. | ctx `openLocModal` | none |
| `ImportRow()` | 100 | `() => JSX` | Layer-1 row: one import card per batch at its import month. | `laneAssign`, ctx `setPanel('import')` | none |
| `LocRow({l})` | 127 | props → JSX | A location row: capacity/lease meta, per-month cells with prep/nolease shading + occupancy strip, its cards. | `laneAssign`, `effCap`, `occupancy`, `readyMonth`, `mLabel`, `fmtN`, `H`, ctx `openLocModal` | none |
| `BoardTab()` [PUBLIC, default] | 171 | `() => JSX` | Assembles month header + 3 layers (import, TP rows, depot rows); sets board width from `numMonths`. | `mLabel`, renders the above | none |

## 12. `src/components/BatchTab.jsx`

| Function | Line | Signature | Purpose | Calls | Side effects |
| --- | --- | --- | --- | --- | --- |
| `StepChip({b, st})` | 6 | props → JSX | Status chip for one registration step; click cycles state unless auto-done. | `batchAutoDone`, ctx `cycleStep` | none (click → state via ctx) |
| `BatchTab()` [PUBLIC, default] | 21 | `() => JSX` | Batch table (qty, dates, TP/depot allocation, 5 step chips, progress) + step legend (i18n HTML). Row click opens batch modal. | `batchAutoDone`, `tpAllocated`, `dpAllocated`, `mLabel`, `fmtN`, ctx `openBatchModal` | renders i18n HTML via `dangerouslySetInnerHTML` |

## 13. `src/components/CostTab.jsx`

Constants `W`, `OFFS` (lines 5–6).

| Function | Line | Signature | Purpose | Calls | Side effects |
| --- | --- | --- | --- | --- | --- |
| `stick(i)` | 8 | `(i: number) => CSSProperties` | Inline style for the i-th sticky column (left offset, widths). | — | pure |
| `CostTab({type})` [PUBLIC, default] | 10 | `({type: 'tp'\|'dp'}) => JSX` | Monthly cost table: sticky identity columns, money cells with tooltip breakdowns, column totals, grand total in IDR + USD. Name click edits location. | `costsByMonth`, `effCap`, `mLabel`, `fmtN`, `fmtMoney`, ctx `openLocModal`, `openCostDefs` | none |

## 14. `src/components/Panel.jsx`

| Function | Line | Signature | Purpose | Calls | Side effects |
| --- | --- | --- | --- | --- | --- |
| `MonthSelect({value, onChange})` | 7 | props → JSX | Month dropdown over the timeline range. | `mLabel` | none |
| `CardEditor({card})` | 19 | props → JSX | Local-state editor for the selected card (location/from/to/qty); Save/Split/Delete. Remounted via key when the card changes. | ctx `saveCardEdit`, `splitCard`, `delCard` | local state; writes via ctx |
| `ImportInfo()` | 53 | `() => JSX` | Table of batches with unallocated remainder; "+ new batch". | `tpAllocated`, `mLabel`, `fmtN`, ctx `openBatchModal`, `closePanel` | none |
| `BatchPanel()` | 82 | `() => JSX` | Tracking view for the selected batch: KPIs, warning boxes (unallocated / over-allocated / early arrival / long dwell), allocation table, edit button, card editor. | `bat`, `loc`, `tpAllocated`, `dpAllocated`, `readyMonth`, `mLabel`, `fmtN`, `esc`, `H`, ctx `clearSel`, `openBatchModal` | warning HTML via `dangerouslySetInnerHTML` (inputs escaped with `esc`) |
| `Panel()` [PUBLIC, default] | 144 | `() => JSX` | Chooses `ImportInfo` vs `BatchPanel` by `panel` mode. | — | none |

## 15. `src/components/modals/Modal.jsx`

### `Modal({title, wide, onOk, okLabel, extraFooter, children})` — line 4 [PUBLIC, default]
- Purpose: shared modal chrome; mask click closes; footer = extra + Cancel + OK.
- Calls: ctx `closeModal`. Side effects: none.

## 16. `src/components/modals/ModalHost.jsx`

### `ModalHost()` — line 8 [PUBLIC, default]
- Purpose: switch on `modal.type` → renders BatchModal / LocModal / CostDefsModal / SettingsModal / QtyDialog (keyed so switching targets remounts local state).
- Side effects: none.

## 17. `src/components/modals/QtyDialog.jsx`

### `QtyDialog()` — line 5 [PUBLIC, default]
- Purpose: number prompt seeded with `modal.def`; autofocus+select (effect, line 10); Enter or OK confirms.
- Inner `ok()` (line 15): clamp ≥ 1, `closeModal`, then invoke `modal.onOk(q)` — which performs the state mutation defined by the drag-drop flow.
- Side effects: focus manipulation; delegated state writes.

## 18. `src/components/modals/BatchModal.jsx`

### `BatchModal()` — line 6 [PUBLIC, default]
- Purpose: create or edit a batch (name, vehicle type, qty, import date); delete with confirm.
- Inner `save()` (line 14): validates/clamps, computes `importMonth` via `dateToMonth`, assigns or pushes (new color from `PALETTE`, zeroed steps) via `mutate`; closes.
- Inner `del()` (line 34): `confirm(t('confirm_del_batch'))` → removes batch + its cards via `mutate`; clears selection if it was selected; closes.
- Side effects: `window.confirm`, state writes via ctx.

## 19. `src/components/modals/LocModal.jsx`

### `LocModal()` — line 7 [PUBLIC, default]
- Purpose: create/edit a location. TP: capacity (blank → auto `area / 16.5`). Depot: slots, %home, invest override. Common: region/address/gmaps/area, lease start/term, prep time, per-cost-def overrides (enable, amount, pay month).
- Inner `setOvField(id, patch)` (line 28): merge one override field into local `ov` state.
- Inner `save()` (line 30): validates name (`alert` if empty), compacts overrides to only meaningful entries (mirrors v1 `readCostOv`), builds the location object, assigns or pushes via `mutate`; closes.
- Inner `del()` (line 65): `confirm(t('confirm_del_loc')(n))` → removes location + its cards via `mutate`; closes.
- Calls: `loc`, `uid`, `mLabel`, `fmtN`, `defName`.
- Side effects: `window.alert`/`confirm`, state writes via ctx.

## 20. `src/components/modals/CostDefsModal.jsx`

### `CostDefsModal()` — line 6 [PUBLIC, default]
- Purpose: editable table of standard cost definitions (bilingual name, scope, basis, amount, currency, timing) with add/remove rows.
- Inner `patch(i, fn)` (line 13): immutably update row i of local `defs`.
- Inner `removeAt(i)` (line 14): drop row i.
- Inner `addRow()` (line 15): append a blank def (`uid()` id).
- Inner `save()` (line 19): coerce amounts to numbers, replace `state.costDefs` via `mutate`; closes.
- Side effects: state writes via ctx.

## 21. `src/components/modals/SettingsModal.jsx`

### `SettingsModal()` — line 6 [PUBLIC, default]
- Purpose: edit timeline start, months shown (3–60), registration duration (≥1), FX rate, standard depot invest rate.
- Inner `save()` (line 14): clamps values; recomputes every batch's `importMonth` (`dateToMonth`) and clamps all cards and lease starts to the new horizon (`H`) via `mutate`; closes.
- Side effects: state writes via ctx.

---

## 22. Totals

- **Module-level named functions (non-component):** 33 — i18n 1, model 21, cost 4, exportio 3, App exports 2 (`useApp`, `App`), CostTab `stick` 1, plus `Cell`-adjacent none.
- **React components:** 24 (1 root + 23 in `src/components/**`, of which 14 are exported defaults and 9 are file-private sub-components).
- **Named inner closures documented:** 30 (18 in `App`, 11 across modals, plus the keydown handler) — not counting the 7 tiny one-line builders inside `exportExcel` and `push` inside `costsByMonth`, which are listed with their parents.
- **i18n message-builder functions:** 22 (11 × 2 languages).

Everything above was read in full; no file was truncated (largest source file is `BoardTab.jsx`, 196 lines).

## 23. Dead / unused code noticed

- i18n keys with no references in `src/`: `hint_board`, `c_landdp`, `df_del` (all three were already unused in the v1 app and were ported for parity).
- `src/components/BoardTab.jsx:33` — `selCard` is destructured from `useApp()` in `Card` but never used.
- Unused **exports** (live functions, but only referenced within their own module, so the `export` keyword does nothing): `toIDR`, `locDefs` (`src/cost.js`), `baseYM`, `defaultCostDefs` (`src/model.js`), `download` (`src/exportio.js`).
