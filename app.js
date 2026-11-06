/* app.js — Lage prototype: map-first property search with AI filters and commute times (sample data). */
(function () {
  'use strict';
  const {GEO, DATA, SCENE} = window;
  const {FILTERS, GROUPS, fmt} = DATA;
  /* every listing in Switzerland: Zürich's own and the copies in the other places (cities.js) */
  const LISTINGS = window.CITIES ? window.CITIES.all() : DATA.LISTINGS;
  const BY_ID = Object.fromEntries(LISTINGS.map(l => [l.id, l]));
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  /* Desktop layout depends on the app's own width, so the phone-frame preview gets the mobile layout. */
  const isDesk = () => document.getElementById('app').clientWidth >= 900;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- icons ---------- */
  const P = {
    pin: 'M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11zM12 7.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5',
    filter: 'M4 7h10M18 7h2M4 17h4M12 17h8M16 4.5v5M10 14.5v5',
    talk: 'M5 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-6l-4 4v-4a2 2 0 0 1-2-2zM9 8.5h6M9 11.5h4',
    close: 'M7 7l10 10M17 7L7 17', plus: 'M12 6v12M6 12h12', check: 'M5 12.5l4.5 4.5L19 7.5',
    heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
    sun: 'M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4',
    chevDown: 'M6 9l6 6l6-6', chevUp: 'M6 15l6-6l6 6', chevL: 'M15 6l-6 6l6 6', chevR: 'M9 6l6 6l-6 6', back: 'M15 5l-7 7l7 7',
    train: 'M8 3.5h8a2.5 2.5 0 0 1 2.5 2.5v8a2.5 2.5 0 0 1-2.5 2.5H8A2.5 2.5 0 0 1 5.5 14V6A2.5 2.5 0 0 1 8 3.5zM5.5 10h13M9 20.5l1.5-4M15 20.5l-1.5-4',
    tram: 'M7 5h10a2 2 0 0 1 2 2v8.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 15.5V7a2 2 0 0 1 2-2zM5 11.5h14M9 21l1.5-3M15 21l-1.5-3M9 2.5h6M12 2.5V5',
    bus: 'M6 4h12a2 2 0 0 1 2 2v10H4V6a2 2 0 0 1 2-2zM4 11h16M7 19v-3M17 19v-3M7.5 13.5h.01M16.5 13.5h.01',
    car: 'M5 16.5h14M6.5 16.5V19M17.5 16.5V19M4.5 16.5v-4l2-5h11l2 5v4M4.5 12.5h15M8 14.5h.01M16 14.5h.01',
    bike: 'M5.5 14.5a3 3 0 1 0 0 6a3 3 0 1 0 0-6M18.5 14.5a3 3 0 1 0 0 6a3 3 0 1 0 0-6M5.5 17.5L9 10h6l3.5 7.5M9 10l3 7.5M14 6.5h2l-1 3.5',
    walk: 'M13 3.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3M10 21l2-6l2.5 2.5V21M8 12l2.5-4.5h3l2 4l2.5 1M10.5 7.5L9 13',
    brief: 'M4 8.5h16v10.5H4zM9 8.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2.5M4 13h16',
    target: 'M12 3v3M12 18v3M3 12h3M18 12h3M12 7.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9',
    sort: 'M7 5v14M4 16l3 3l3-3M17 19V5M14 8l3-3l3 3', eye: 'M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
    sound: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11', leaf: 'M5 19c0-8 5-13 14-14c0 9-5 14-13 14zM5 19l7-7',
    cart: 'M4 5h2l2 10h10l2-7H7.2M10 19.5h.01M17 19.5h.01', child: 'M12 3.5a2 2 0 1 0 0 4a2 2 0 1 0 0-4M8 21l1-6l-2-4l5-2l5 2l-2 4l1 6M12 9v4',
    school: 'M3 9.5L12 5l9 4.5L12 14zM7 11.5V16c1.5 1.5 3 2 5 2s3.5-.5 5-2v-4.5', lift: 'M6 3.5h12v17H6zM10 9l2-2l2 2M10 15l2 2l2-2',
    washer: 'M5 3.5h14v17H5zM5 7.5h14M12 10a4 4 0 1 0 0 8a4 4 0 1 0 0-8M8 5.5h.01', window: 'M5 4h14v16H5zM12 4v16M5 12h14',
    park: 'M7 20V4h6a4 4 0 0 1 0 8H7', paw: 'M12 12.5c-3 0-5 3-5 5c0 1.5 1.5 2 3 1.5c1-.3 1.5-.5 2-.5s1 .2 2 .5c1.5.5 3 0 3-1.5c0-2-2-5-5-5zM6.5 8a1.5 2 0 1 0 0 4a1.5 2 0 1 0 0-4M17.5 8a1.5 2 0 1 0 0 4a1.5 2 0 1 0 0-4M10 4a1.5 2 0 1 0 0 4a1.5 2 0 1 0 0-4M14 4a1.5 2 0 1 0 0 4a1.5 2 0 1 0 0-4',
    clock: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16M12 8v4.5l3 2', kitchen: 'M4 4h16v16H4zM4 9h16M8 6.5h.01M12 6.5h.01',
    ceiling: 'M4 5h16M4 19h16M12 7v10M9.5 9.5L12 7l2.5 2.5M9.5 14.5L12 17l2.5-2.5', bath: 'M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM6 12V6a2 2 0 0 1 4 0',
    info: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16M12 11v5M12 8h.01', search: 'M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13M15.5 15.5L20 20',
    drop: 'M12 5v14M6 13l6 6l6-6', plane: 'M3 13l7-2l4-7h2l-2 7l5 1l2-2h1.5l-1 4l1 4H21l-2-2l-5 1l2 7h-2l-4-7l-7-2z', compare: 'M4 5h7v14H4zM13 5h7v14h-7z', list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
    tiles: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', rows: 'M4 4h16v10H4zM4 17.5h16M4 20.5h10',
    lasso: 'M8.5 16.5c-3.2-.7-5-3.2-4.3-6C5 7.4 9 5.4 13.6 6c4.4.6 7 3.4 6 6.2-.9 2.5-4.4 4.2-8.4 4.1M8.5 16.5c-1 .4-1.6 1.3-1.4 2.3.3 1.3 1.8 1.8 3 1.2M8.5 16.5l.3 3.5',
    minus: 'M7.5 12h9', alert: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16M12 8v4.5M12 15.5h.01'
  };
  const ic = (d, s, sw) => '<svg viewBox="0 0 24 24" width="' + (s || 18) + '" height="' + (s || 18) + '" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  const heartIc = (on, s) => '<svg viewBox="0 0 24 24" width="' + (s || 17) + '" height="' + (s || 17) + '" aria-hidden="true"><path d="' + P.heart + '" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';

  /* ---------- state ---------- */
  const KEY = 'lage-proto-v1';
  /* Places with a travel time. Work comes first and is there from the start (an example at Paradeplatz), without a limit. */
  const workPlace = (base, example) => ({id: base.id, kind: 'work', name: 'Arbeit', short: 'Arbeit', sub: base.name, x: base.x, y: base.y, example: !!example, mode: 'pt', peak: false, max: null});
  /* Ranges use 0 or null for "no limit": price, rooms, area, floor (0 = Erdgeschoss, so null), year built. */
  const BASICS = () => ({priceMin: null, priceMax: null, roomsMin: 0, roomsMax: 0, areaMin: 0, areaMax: 0, floorMin: null, floorMax: null, yearMin: 0, yearMax: 0, baths: 0, types: {}, since: 0, viewMin: 0, vLake: 0, vPeaks: 0, vFree: 0, vAngle: 0, aiQ: '', areas: [], circles: [], moveBy: 'any', income: null, equity: null});
  const defaults = () => Object.assign({deal: 'rent', q: '', active: {}, sort: 'match', saved: {}, pinMode: 'price', view: 'desktop', places: [workPlace(GEO.PLACES[0], true)], layout: 'grid'}, BASICS());
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s && typeof s === 'object' ? Object.assign(defaults(), s) : null;
    } catch (e) { return null; }
  }
  const st = load() || defaults();
  for (const id in st.saved) if (!BY_ID[id]) delete st.saved[id];
  for (const id in st.active) if (!DATA.byId[id]) delete st.active[id];
  if (!st.types || typeof st.types !== 'object') st.types = {};
  st.circles = (Array.isArray(st.circles) ? st.circles : []).filter(c => c && isFinite(c.x) && isFinite(c.y) && isFinite(c.km)).slice(0, 4);
  st.areas = (Array.isArray(st.areas) ? st.areas : []).filter(a => Array.isArray(a) && a.length >= 3 && a.every(p => Array.isArray(p) && isFinite(p[0]) && isFinite(p[1]))).slice(0, 4);
  /* earlier versions kept the workplace apart from the places; it is now the first place */
  if ('work' in st) {
    const w = st.work, list = Array.isArray(st.places) ? st.places : [];
    if (w && !list.some(p => p.kind === 'work')) list.unshift(Object.assign(workPlace(w, w.example), {mode: ['pt', 'car', 'bike'].includes(st.mode) ? st.mode : 'pt', peak: st.mode === 'car', max: st.commuteMax == null ? null : st.commuteMax}));
    st.places = list;
    delete st.work; delete st.mode; delete st.commuteMax;
  }
  st.places = (Array.isArray(st.places) ? st.places : []).filter(p => p && isFinite(p.x) && isFinite(p.y) && ['pt', 'car', 'bike', 'walk'].includes(p.mode)).slice(0, 4);
  st.places.forEach(p => { if (p.kind !== 'work') p.kind = 'other'; p.peak = !!p.peak; if (p.max != null && !isFinite(p.max)) p.max = null; });
  let saveTimer = 0;
  const persist = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* storage unavailable: keep in memory */ } }, 200); };
  const ui = {sel: null, sheet: 'peek', detail: null, ph: {}, dlg: null, pick: false, sortOpen: false, savedTab: 'list', visitDone: false, workQ: '', returnFocus: null, placeKind: 'other', placeIdx: -1, placeReturn: null, draw: false, drawReturn: null};

  /* the description of a dream flat and what it found; DREAM_SET: those listings, when they are the search on the map */
  const dr = {text: '', busy: false, ctl: null, tune: false, read: null, cur: null, view: null, src: '', err: null, pane: 'res', limit: 30, last: 0, run: 0, timer: 0, ctrls: [], open: {}, back: false};
  let DREAM_SET = null;

  /* ---------- travel time to your places (work first) ---------- */
  const PMODES = {pt: {label: 'ÖV', icon: P.tram}, car: {label: 'Auto', icon: P.car}, bike: {label: 'Velo', icon: P.bike}, walk: {label: 'Zu Fuss', icon: P.walk}};
  const modeLabel = p => p.mode === 'car' && p.peak ? 'Auto zur Stosszeit' : PMODES[p.mode].label;
  const SHORT = {hb: 'HB', airport: 'Flughafen', eth: 'ETH'};
  const shortName = p => p.short || SHORT[p.id] || p.name;
  const placeLabel = p => p.kind === 'work' ? 'Arbeit' + (p.example ? ' (Beispiel)' : '') : p.name;
  const pCache = new Map();
  function placeTimes(l, p) {
    const key = l.id + '|' + (+p.x).toFixed(1) + ',' + (+p.y).toFixed(1);
    let r = pCache.get(key);
    if (!r) {
      const o = [l.x, l.y], d = [+p.x, +p.y];
      const lakeside = l.x >= 0 && l.x <= 730 && l.y > 470 && l.y <= 1000 && GEO.lakeBearing(o).dist < 70;
      const R = GEO.travel(o, d, {lakeside, hilly: l.hill > 0.4}), ptR = R.ptR, carR = R.carR, bikeR = R.bikeR, walkR = R.walkR;
      r = {pt: ptR.min, car: carR.normal, carPeak: carR.peak, bike: bikeR.min, walk: walkR.min, ptR, carR, bikeR, walkR};
      pCache.set(key, r);
    }
    return r;
  }
  /* the time in the place's own way; the car counts with rush hour when the place says so */
  function placeTime(l, p, mode, peak) {
    const T = placeTimes(l, p), m = mode || p.mode;
    return m === 'car' ? ((peak === undefined ? p.peak : peak) ? T.carPeak : T.car) : T[m];
  }

  /* ---------- query ---------- */
  const DIACRITICS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(DIACRITICS, '');
  function textMatch(l) {
    const q = norm((st.q || '').trim());
    if (!q || q === 'zurich' || q === 'zuerich') return true;
    return norm(l.quarter + ' ' + l.locality + ' ' + l.street + ' ' + l.title).includes(q);
  }
  /* a radius around a place, in km */
  const inCircle = (l, c) => Math.hypot(l.x - c.x, l.y - c.y) <= c.km / GEO.UNIT_KM;
  function passes(l, active) {
    if (l.deal !== st.deal || !textMatch(l) || (DREAM_SET && !DREAM_SET.has(l.id))) return false;
    if ((st.areas.length || st.circles.length) && !st.areas.some(a => GEO.inPoly(l.x, l.y, a)) && !st.circles.some(c => inCircle(l, c))) return false;
    for (const f of FILTERS) if (active[f.id] && !f.test(l)) return false;
    if ((st.priceMin != null && l.gross < st.priceMin) || (st.priceMax != null && l.gross > st.priceMax)) return false;
    if (l.rooms < st.roomsMin || (st.roomsMax && l.rooms > st.roomsMax) || l.m2 < st.areaMin || (st.areaMax && l.m2 > st.areaMax)) return false;
    if ((st.floorMin != null && l.floor < st.floorMin) || (st.floorMax != null && l.floor > st.floorMax)) return false;
    if ((st.yearMin && l.year < st.yearMin) || (st.yearMax && l.year > st.yearMax)) return false;
    if (l.baths < st.baths || (st.since && l.days > st.since) || l.view < st.viewMin) return false;
    if (l.vLake < st.vLake || l.vPeaks < st.vPeaks || l.vFree < st.vFree || l.span < st.vAngle) return false;
    if (anyType() && !st.types[l.type]) return false;
    if (st.moveBy !== 'any' && l.availTime != null && l.availTime > MOVE_BY[st.moveBy]) return false;
    if (l.deal === 'buy' && ((st.income != null && l.income > st.income) || (st.equity != null && l.equity > st.equity))) return false;
    for (const p of st.places) if (p.max != null && placeTime(l, p) > p.max) return false;
    return true;
  }
  function score(l) {
    let s = l.base;
    if (st.places.length) s += clamp((30 - placeTime(l, st.places[0])) * 0.7, -15, 12);
    return clamp(Math.round(s), 40, 98);
  }
  const loc = (l, s) => window.CITIES ? window.CITIES.localize(l, s) : s;
  /* where a listing is: the town first, then the quarter; in the regions the quarter is the town */
  const whereQ = l => {
    const P = window.CITIES && window.CITIES.PLACES[l.place];
    if (!P || P.region) return l.quarter;
    return l.quarter.indexOf(P.name) === 0 ? l.quarter : P.name + ' · ' + l.quarter;
  };
  const SORTS = [
    {id: 'match', label: 'Beste Treffer', short: 'Treffer'},
    {id: 'commute', label: 'Kürzester Weg', short: 'Weg', place: true},
    {id: 'view', label: 'Beste Aussicht', short: 'Aussicht'},
    {id: 'price', label: 'Preis aufsteigend', short: 'Preis'},
    {id: 'avail', label: 'Frühester Einzug', short: 'Einzug'},
    {id: 'new', label: 'Neueste zuerst', short: 'Neu'},
    {id: 'ppm', label: 'Preis pro m²', short: 'CHF/m²'},
    {id: 'area', label: 'Grösste Fläche', short: 'Fläche'}
  ];
  function sorter() {
    switch (st.sort) {
      case 'commute': return st.places.length ? (a, b) => placeTime(a, st.places[0]) - placeTime(b, st.places[0]) || score(b) - score(a) : (a, b) => score(b) - score(a);
      case 'view': return (a, b) => b.view - a.view || score(b) - score(a);
      case 'price': return (a, b) => a.gross - b.gross;
      case 'avail': { const t = l => l.availTime == null ? 9e15 : l.availTime; return (a, b) => t(a) - t(b) || score(b) - score(a); }
      case 'new': return (a, b) => a.days - b.days;
      case 'ppm': return (a, b) => a.price / a.m2 - b.price / b.m2;
      case 'area': return (a, b) => b.m2 - a.m2;
      default: return (a, b) => score(b) - score(a);
    }
  }
  /* RES: the listings that pass every filter. NEAR: when fewer than six do, the ones that fit the most important
     criteria, each marked with what it misses. */
  /* ALLR: both, all of them on the map. LIST: what the list shows. Like flatfox it is what lies in the visible part
     of the map: RES first, then NEAR. compute(true) also works out where the map will go, so the list is set for it. */
  let RES = [], NEAR = [], ALLR = [], LIST = [], NEAR_BY = new Map(), VIS_N = 0, VNEAR_N = 0, fitT = null;
  function compute(fit) {
    RES = LISTINGS.filter(l => passes(l, st.active)).sort(sorter());
    NEAR = RES.length < NEAR_MIN && !DREAM_SET ? nearMatches(RES.length ? 12 : 24) : [];
    NEAR_BY = new Map(NEAR.map(x => [x.l.id, x]));
    ALLR = RES.concat(NEAR.map(x => x.l));
    if (ui.sel && !ALLR.some(l => l.id === ui.sel)) ui.sel = null;
    /* zoomed in on a place, you stay there as long as results remain in view; a filter doesn't throw you out to the whole country */
    fitT = fit ? fitTarget() : null;
    if (fitT && fit !== 'go' && !ui.fitPlace && view.w < 6000) { layoutList(view); if (VIS_N) fitT = null; }
    layoutList(fitT || view);
  }
  /* The part of the map you can see in view v: what the top bar and the side panel (desktop) or the bottom sheet
     at rest (phone) leave free. The sheet's resting height counts, so pulling it up does not change the list. */
  function mapRect(v) {
    const m = mapEl.getBoundingClientRect(), t = $('#top').getBoundingClientRect(), W = Math.max(1, m.width), H = Math.max(1, m.height);
    const left = isDesk() ? clamp(sheet.getBoundingClientRect().right - m.left, 0, W - 40) : 0;
    const top = clamp(t.bottom - m.top, 0, H - 40), bottom = isDesk() ? H : Math.max(top + 40, H - sheetStates().peek);
    const k = W / v.w;
    return {x0: v.cx + (left - W / 2) / k, x1: v.cx + W / 2 / k, y0: v.cy + (top - H / 2) / k, y1: v.cy + (bottom - H / 2) / k};
  }
  function layoutList(v) {
    const R = mapRect(v), inR = l => l.x >= R.x0 && l.x <= R.x1 && l.y >= R.y0 && l.y <= R.y1;
    const vis = RES.filter(inR), near = NEAR.filter(x => inR(x.l)).map(x => x.l);
    VIS_N = vis.length; VNEAR_N = near.length;
    LIST = vis.concat(near);
  }
  /* set the list for view v; true when it changed */
  function relist(v) {
    const before = LIST.map(l => l.id).join();
    layoutList(v);
    return LIST.map(l => l.id).join() !== before;
  }
  /* after you moved the map: the list shows what the map now shows */
  /* the list is rebuilt when the browser is idle, never while the map still moves */
  let relistT = 0;
  const idle = fn => window.requestIdleCallback ? requestIdleCallback(fn, {timeout: 300}) : setTimeout(fn, 60);
  function afterUserMove() {
    ui.fitPlace = null;
    clearTimeout(relistT);
    relistT = setTimeout(() => idle(() => { if (moving) return; if (relist(view)) { renderSheet(); $('#sheetBody').scrollTop = 0; renderSelGeo(); queueOverlay(); } }), 80);
  }
  const goFit = animate => { const t = fitT; fitT = null; if (t) animateTo(t, animate, false); };
  function countWith(id) {
    const a = Object.assign({}, st.active, {[id]: true});
    let n = 0;
    for (const l of LISTINGS) if (passes(l, a)) n++;
    return n;
  }
  const anyType = () => Object.keys(st.types).some(k => st.types[k]);
  const activeN = () => FILTERS.filter(f => st.active[f.id]).length + (st.priceMin != null || st.priceMax != null ? 1 : 0) + (st.roomsMin || st.roomsMax ? 1 : 0) + (st.areaMin || st.areaMax ? 1 : 0) +
    (st.floorMin != null || st.floorMax != null ? 1 : 0) + (st.yearMin || st.yearMax ? 1 : 0) + (st.baths ? 1 : 0) + (anyType() ? 1 : 0) + (st.since ? 1 : 0) + (st.viewMin ? 1 : 0) + (st.areas.length || st.circles.length ? 1 : 0) + VLEVELS.filter(v => st[v.key]).length +
    (st.moveBy !== 'any' ? 1 : 0) + (st.deal === 'buy' && (st.income != null || st.equity != null) ? 1 : 0) + st.places.filter(p => p.max != null).length;
  /* Min / max choices as the portals offer them. Rent compares the monthly total including Nebenkosten. */
  const RANGES = {
    price: {rent: [500, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000, 4500, 5000, 6000, 7000, 8000],
      buy: [250000, 500000, 750000, 1000000, 1250000, 1500000, 1750000, 2000000, 2500000, 3000000, 4000000, 5000000]},
    rooms: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6],
    area: [20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 200, 250],
    floor: [0, 1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 25],
    year: [1900, 1930, 1950, 1970, 1990, 2000, 2010, 2015, 2020, 2024]
  };
  const priceText = v => st.deal === 'rent' ? 'CHF ' + fmt.thou(v) : 'CHF ' + (v >= 1e6 ? fmt.dec(v / 1e6, 2).replace(/0$/, '') + ' Mio.' : fmt.thou(v / 1000) + 'k');
  const RANGE_TEXT = {price: priceText, rooms: v => String(v).replace('.5', '½'), area: v => v + ' m²', floor: v => v === 0 ? 'EG' : v + '. OG', year: v => String(v)};
  const SINCE = [[0, 'Egal'], [1, '24 Std.'], [3, '3 Tage'], [7, '7 Tage'], [14, '14 Tage']];
  /* View levels: the lake, the mountains, how far and how wide. Each option shows how many listings remain with it. */
  const VLEVELS = [
    {key: 'vLake', t: 'See', opts: [[0, 'Egal'], [1, 'Ein Streifen'], [2, 'Breit'], [3, 'Panorama']], chip: v => ['', 'Seesicht', 'See breit', 'Seepanorama'][v]},
    {key: 'vPeaks', t: 'Berge', opts: [[0, 'Egal'], [1, 'Einzelne Gipfel'], [4, 'Alpenkette']], chip: v => v >= 4 ? 'Alpenkette' : 'Berge im Blick'},
    {key: 'vFree', t: 'Freie Sicht bis zum nächsten Haus', opts: [[0, 'Egal'], [100, 'ab 100 m'], [500, 'ab 500 m'], [5000, 'Horizont']], chip: v => v >= 5000 ? 'Sicht bis zum Horizont' : 'Freie Sicht ab ' + SCENE.fmtDist(v)},
    {key: 'vAngle', t: 'Blickwinkel', opts: [[0, 'Egal'], [80, 'ab 80°'], [100, 'ab 100°'], [130, 'ab 130°']], chip: v => 'Blickwinkel ab ' + v + '°'}
  ];
  /* ---------- when nothing fits everything: the listings that fit the most important criteria ----------
     Each active criterion has a weight (how much it matters to most people) and, for a listing that misses it,
     how far off it is. Near matches rank by the weighted misses: a small miss on an extra comes before a big miss
     on budget, rooms, area, the search area or the way to work. */
  const NEAR_MIN = 6;
  const FW = {pets: 4, wheelchair: 5, furnished: 3, unlimited: 3, lift: 2.5, parking: 2.5, wm: 2, balcony: 2, quiet: 2, garden: 2, homeoffice: 2, family: 2};
  const VV = {vLake: l => l.vLake, vPeaks: l => l.vPeaks, vFree: l => l.vFree, vAngle: l => l.span};
  const zi = v => String(v).replace('.5', '½');
  const flr = v => v === 0 ? 'EG' : v + '. OG';
  const money = v => st.deal === 'rent' ? 'CHF ' + fmt.thou(v) : 'CHF ' + fmt.k(v);
  const critTxt = k => k === 1 ? 'dein Kriterium' : 'alle ' + k + ' Kriterien';
  const showText = n => n ? n + ' ' + (n === 1 ? 'Angebot' : 'Angebote') + ' zeigen' : 'Ähnliche zeigen';
  const hitsOut = n => ' <span class="o-n' + (n ? '' : ' is-zero') + '">· ' + n + ' Treffer</span>';
  const plOut = (max, n) => max == null ? 'Kein Limit' : max + ' Min.' + hitsOut(n);
  const crOut = (km, n) => fmtKm(km) + hitsOut(n);
  /* how far a listing lies outside the drawn areas and radii, in km */
  function outsideKm(l) {
    let d = Infinity;
    for (const c of st.circles) d = Math.min(d, Math.hypot(l.x - c.x, l.y - c.y) * GEO.UNIT_KM - c.km);
    for (const a of st.areas) for (let i = 0; i < a.length; i++) {
      const [x1, y1] = a[i], [x2, y2] = a[(i + 1) % a.length], dx = x2 - x1, dy = y2 - y1, q = dx * dx + dy * dy;
      const t = q ? clamp(((l.x - x1) * dx + (l.y - y1) * dy) / q, 0, 1) : 0;
      d = Math.min(d, Math.hypot(l.x - x1 - t * dx, l.y - y1 - t * dy) * GEO.UNIT_KM);
    }
    return Math.max(0, d);
  }
  /* A ladder of ever looser values: the first one that brings listings back becomes a suggestion in the popup. */
  const ladder = (vals, label, mut) => vals.map(v => ({label: label(v), mut: x => mut(x, v)}));
  /* Every active criterion: its weight, whether a listing meets it, how far off a listing is, and how to loosen it.
     The tests read the state when they run, so they stay right after countIf has put the state back. */
  function criteria() {
    const C = [], add = (id, w, label, ok, gap, more) => C.push(Object.assign({id, w, label, ok, gap}, more || {}));
    const own = LISTINGS.filter(l => l.deal === st.deal), q = (st.q || '').trim();
    if (q && norm(q) !== 'zurich' && norm(q) !== 'zuerich') add('q', 3, 'Suche «' + q + '»', textMatch, () => ({sev: 1, t: 'Nicht in «' + q + '»'}));
    if (st.areas.length || st.circles.length) {
      const what = st.areas.length ? 'Gebiet' : 'Umkreis', one = st.circles.length === 1 && !st.areas.length ? st.circles[0] : null;
      add('area', 4, st.areas.length ? 'Im gezeichneten Gebiet' : st.circles.map(c => fmtKm(c.km) + ' um ' + c.name).join(' oder '),
        l => st.areas.some(a => GEO.inPoly(l.x, l.y, a)) || st.circles.some(c => inCircle(l, c)),
        l => { const km = outsideKm(l); return {sev: km / 0.5, t: fmtKm(Math.max(0.1, Math.round(km * 10) / 10)) + ' ausserhalb vom ' + what}; },
        {loosen: () => st.circles.length ? [ladder([0.5, 1, 1.5, 2, 3, 5], d => one ? 'Umkreis ' + fmtKm(Math.min(10, one.km + d)) + ' um ' + one.name : 'Alle Umkreise ' + fmtKm(d) + ' grösser',
          (x, d) => { x.circles.forEach(c => { c.km = Math.min(10, c.km + d); }); })] : []});
    }
    for (const f of FILTERS) if (st.active[f.id]) add('f:' + f.id, FW[f.id] || 1.5, f.label, f.test, () => ({sev: 0.5, t: f.label}));
    const PR = RANGES.price[st.deal];
    if (st.priceMax != null) add('priceMax', 5, 'Bis ' + priceText(st.priceMax), l => l.gross <= st.priceMax,
      l => ({sev: (l.gross - st.priceMax) / st.priceMax * 10, t: money(l.gross) + ' statt max. ' + money(st.priceMax)}),
      {best: () => 'Am günstigsten: ' + money(Math.min(...own.map(l => l.gross))) + '.', loosen: () => [ladder(PR.filter(v => v > st.priceMax), v => 'Bis ' + priceText(v), (x, v) => { x.priceMax = v; })]});
    if (st.priceMin != null) add('priceMin', 2, 'Ab ' + priceText(st.priceMin), l => l.gross >= st.priceMin,
      l => ({sev: (st.priceMin - l.gross) / st.priceMin * 5, t: money(l.gross) + ' statt ab ' + money(st.priceMin)}),
      {loosen: () => [ladder(PR.filter(v => v < st.priceMin).reverse(), v => 'Ab ' + priceText(v), (x, v) => { x.priceMin = v; })]});
    const RM = RANGES.rooms, AR = RANGES.area, FL = RANGES.floor, YR = RANGES.year;
    if (st.roomsMin) add('roomsMin', 4, 'Ab ' + zi(st.roomsMin) + ' Zimmer', l => l.rooms >= st.roomsMin,
      l => ({sev: st.roomsMin - l.rooms, t: fmt.zi(l) + ' statt ab ' + zi(st.roomsMin) + ' Zimmer'}),
      {best: () => 'Am meisten: ' + zi(Math.max(...own.map(l => l.rooms))) + ' Zimmer.', loosen: () => [ladder(RM.filter(v => v < st.roomsMin).reverse(), v => 'Ab ' + zi(v) + ' Zimmer', (x, v) => { x.roomsMin = v; })]});
    if (st.roomsMax) add('roomsMax', 2, 'Bis ' + zi(st.roomsMax) + ' Zimmer', l => l.rooms <= st.roomsMax,
      l => ({sev: l.rooms - st.roomsMax, t: fmt.zi(l) + ' statt bis ' + zi(st.roomsMax) + ' Zimmer'}),
      {loosen: () => [ladder(RM.filter(v => v > st.roomsMax), v => 'Bis ' + zi(v) + ' Zimmer', (x, v) => { x.roomsMax = v; })]});
    if (st.areaMin) add('areaMin', 3, 'Ab ' + st.areaMin + ' m²', l => l.m2 >= st.areaMin,
      l => ({sev: (st.areaMin - l.m2) / st.areaMin * 6, t: l.m2 + ' statt ab ' + st.areaMin + ' m²'}),
      {best: () => 'Am grössten: ' + Math.max(...own.map(l => l.m2)) + ' m².', loosen: () => [ladder(AR.filter(v => v < st.areaMin).reverse(), v => 'Ab ' + v + ' m²', (x, v) => { x.areaMin = v; })]});
    if (st.areaMax) add('areaMax', 1.5, 'Bis ' + st.areaMax + ' m²', l => l.m2 <= st.areaMax,
      l => ({sev: (l.m2 - st.areaMax) / st.areaMax * 4, t: l.m2 + ' statt bis ' + st.areaMax + ' m²'}),
      {loosen: () => [ladder(AR.filter(v => v > st.areaMax), v => 'Bis ' + v + ' m²', (x, v) => { x.areaMax = v; })]});
    if (st.floorMin != null) add('floorMin', 1.5, 'Ab ' + flr(st.floorMin), l => l.floor >= st.floorMin,
      l => ({sev: (st.floorMin - l.floor) * 0.4, t: fmt.floor(l) + ' statt ab ' + flr(st.floorMin)}),
      {best: () => 'Am höchsten: ' + flr(Math.max(...own.map(l => l.floor))) + '.', loosen: () => [ladder(FL.filter(v => v < st.floorMin).reverse(), v => 'Ab ' + flr(v), (x, v) => { x.floorMin = v; })]});
    if (st.floorMax != null) add('floorMax', 1.5, 'Bis ' + flr(st.floorMax), l => l.floor <= st.floorMax,
      l => ({sev: (l.floor - st.floorMax) * 0.4, t: fmt.floor(l) + ' statt bis ' + flr(st.floorMax)}),
      {loosen: () => [ladder(FL.filter(v => v > st.floorMax), v => 'Bis ' + flr(v), (x, v) => { x.floorMax = v; })]});
    if (st.yearMin) add('yearMin', 1, 'Baujahr ab ' + st.yearMin, l => l.year >= st.yearMin,
      l => ({sev: (st.yearMin - l.year) / 10, t: 'Baujahr ' + l.year + ' statt ab ' + st.yearMin}),
      {loosen: () => [ladder(YR.filter(v => v < st.yearMin).reverse(), v => 'Baujahr ab ' + v, (x, v) => { x.yearMin = v; })]});
    if (st.yearMax) add('yearMax', 1, 'Baujahr bis ' + st.yearMax, l => l.year <= st.yearMax,
      l => ({sev: (l.year - st.yearMax) / 10, t: 'Baujahr ' + l.year + ' statt bis ' + st.yearMax}),
      {loosen: () => [ladder(YR.filter(v => v > st.yearMax), v => 'Baujahr bis ' + v, (x, v) => { x.yearMax = v; })]});
    if (st.baths) add('baths', 2.5, 'Ab ' + st.baths + ' Badezimmern', l => l.baths >= st.baths,
      l => ({sev: st.baths - l.baths, t: l.baths + (l.baths === 1 ? ' Bad' : ' Bäder') + ' statt ab ' + st.baths}),
      {loosen: () => [ladder([st.baths - 1].filter(v => v >= 1), v => 'Ab ' + v + (v === 1 ? ' Bad' : ' Badezimmern'), (x, v) => { x.baths = v; })]});
    if (st.since) {
      const sl = v => (SINCE.find(s => s[0] === v) || [v, v + ' Tage'])[1];
      add('since', 0.5, 'Inserat höchstens ' + sl(st.since) + ' alt', l => l.days <= st.since,
        l => ({sev: (l.days - st.since) / st.since, t: 'Seit ' + l.days + (l.days === 1 ? ' Tag' : ' Tagen') + ' online'}),
        {loosen: () => [ladder(SINCE.map(s => s[0]).filter(v => v > st.since), v => 'Inserat höchstens ' + sl(v) + ' alt', (x, v) => { x.since = v; })]});
    }
    if (st.viewMin) add('viewMin', 2.5, 'Aussicht ab ' + fmt.dec(st.viewMin), l => l.view >= st.viewMin,
      l => ({sev: (st.viewMin - l.view) * 1.2, t: 'Aussicht ' + fmt.dec(l.view) + ' statt ab ' + fmt.dec(st.viewMin)}),
      {best: () => 'Beste Aussicht: ' + fmt.dec(Math.max(...own.map(l => l.view))) + '.', loosen: () => [ladder([0.5, 1, 1.5, 2, 3].map(d => Math.round((st.viewMin - d) * 10) / 10).filter(v => v > 0), v => 'Aussicht ab ' + fmt.dec(v), (x, v) => { x.viewMin = v; })]});
    for (const v of VLEVELS) if (st[v.key]) {
      const need = st[v.key], val = VV[v.key];
      add(v.key, 2, v.chip(need), l => val(l) >= need, l => {
        const h = val(l);
        if (v.key === 'vLake') return {sev: need - h, t: h ? ['', 'See nur als Streifen', 'See breit, kein Panorama'][h] : 'Kein Seeblick'};
        if (v.key === 'vPeaks') return {sev: (need - h) / 2, t: h ? h + ' Gipfel, keine Alpenkette' : 'Keine Berge im Blick'};
        if (v.key === 'vFree') return {sev: Math.log10(need / Math.max(10, h)), t: 'Freie Sicht nur ' + SCENE.fmtDist(h)};
        return {sev: (need - h) / 20, t: 'Blickwinkel ' + h + '°'};
      }, {loosen: () => [ladder(v.opts.map(o => o[0]).filter(o => o && o < need).reverse(), o => v.chip(o), (x, o) => { x[v.key] = o; })]});
    }
    if (anyType()) {
      const want = DATA.TYPES.filter(t => st.types[t.id]).map(t => t.t).join(' oder ');
      add('types', 3, want, l => !!st.types[l.type], l => ({sev: 1, t: (DATA.TYPES.find(t => t.id === l.type) || {t: 'Andere Objektart'}).t + ' statt ' + want}));
    }
    if (st.moveBy !== 'any') {
      const lim = MOVE_BY[st.moveBy], now = st.moveBy === 'now', ml = k => (MOVE.find(m => m[0] === k) || ['', ''])[1];
      add('moveBy', 3, now ? 'Einzug sofort' : 'Einzug bis ' + ml(st.moveBy), l => l.availTime == null || l.availTime <= lim,
        l => ({sev: (l.availTime - (lim || Date.now())) / (30 * 864e5), t: 'Einzug ' + DATA.availShort(l) + (now ? ' statt sofort' : ' statt bis ' + ml(st.moveBy))}),
        {loosen: () => [ladder(MOVE.map(m => m[0]).filter(k => k !== 'any' && MOVE_BY[k] > lim), k => 'Einzug bis ' + ml(k), (x, k) => { x.moveBy = k; })]});
    }
    if (st.deal === 'buy' && st.income != null) add('income', 5, 'Tragbar mit CHF ' + fmt.k(st.income) + ' Einkommen', l => l.income <= st.income,
      l => ({sev: (l.income - st.income) / st.income * 8, t: 'Braucht CHF ' + fmt.k(l.income) + ' Einkommen'}));
    if (st.deal === 'buy' && st.equity != null) add('equity', 5, 'Mit CHF ' + fmt.k(st.equity) + ' Eigenmitteln', l => l.equity <= st.equity,
      l => ({sev: (l.equity - st.equity) / st.equity * 8, t: 'Braucht CHF ' + fmt.k(l.equity) + ' Eigenmittel'}));
    st.places.forEach((p, i) => {
      if (p.max == null) return;
      const cur = () => st.places[i], work = p.kind === 'work', to = work ? 'zur Arbeit' : 'nach ' + shortName(p), max = p.max;
      add('pl' + i, work ? 4 : 3.5, 'Höchstens ' + max + ' Min. ' + to + ' (' + modeLabel(p) + ')', l => placeTime(l, cur()) <= cur().max,
        l => { const t = placeTime(l, cur()); return {sev: (t - cur().max) / 5, t: t + ' Min. ' + to + ' statt max. ' + cur().max}; },
        {best: () => { const pc = cur(); let m = Infinity; for (const l of own) m = Math.min(m, placeTime(l, pc)); return 'Am schnellsten geht es in ' + m + ' Min.'; },
         loosen: () => {
           const L = [ladder([5, 10, 15, 20, 25, 30].map(d => max + d).filter(v => v <= 60), v => 'Bis ' + v + ' Min. ' + to, (x, v) => { x.places[i].max = v; })];
           if (p.mode === 'car' && p.peak) L.push([{label: 'Auto ohne Stosszeit ' + to, mut: x => { x.places[i].peak = false; }}]);
           if (p.mode !== 'pt') L.push([{label: 'Mit ÖV ' + to + ', bis ' + max + ' Min.', mut: x => { x.places[i].mode = 'pt'; x.places[i].peak = false; }}]);
           return L;
         }});
    });
    return C;
  }
  /* The listings that miss the fewest and least important criteria, each with what it misses (most important first). */
  function nearMatches(max) {
    const C = criteria();
    if (!C.length) return [];
    const out = [];
    for (const l of LISTINGS) {
      if (l.deal !== st.deal || passes(l, st.active)) continue;
      let cost = 0;
      const miss = [];
      for (const c of C) {
        if (c.ok(l)) continue;
        const g = c.gap(l);
        cost += c.w * (1 + clamp(g.sev || 0, 0, 4));
        miss.push({t: g.t, w: c.w});
      }
      if (!miss.length) continue;
      miss.sort((a, b) => b.w - a.w);
      out.push({l, miss, cost, met: C.length - miss.length, total: C.length});
    }
    out.sort((a, b) => a.cost - b.cost || score(b.l) - score(a.l));
    return out.slice(0, max);
  }
  /* For the popup: per criterion the gentlest change that brings listings back, then dropping one criterion. */
  function fixOptions() {
    const soft = [];
    for (const c of criteria()) for (const lad of (c.loosen ? c.loosen() : [])) {
      for (const s of lad) { const n = countIf(s.mut); if (n > 0) { soft.push({label: s.label, mut: s.mut, n}); break; } }
    }
    soft.sort((a, b) => b.n - a.n);
    return soft.slice(0, 3).concat(relaxOptions().slice(0, 2));
  }
  function countWithState(patch) {
    const keep = {};
    for (const k in patch) { keep[k] = st[k]; st[k] = patch[k]; }
    let n = 0;
    for (const l of LISTINGS) if (passes(l, st.active)) n++;
    Object.assign(st, keep);
    return n;
  }
  function resetViewState() {
    st.viewMin = 0;
    VLEVELS.forEach(v => { st[v.key] = 0; });
    FILTERS.filter(f => f.g === 'aussicht').forEach(f => { delete st.active[f.id]; });
  }
  /* The wish in plain words, read into the view filters. In this prototype simple word rules do it; in the product a
     language model reads the sentence and returns the same filters. A new wish replaces the previous view filters. */
  const AI_EXAMPLES = ['Seeblick vom Sofa', 'Sonnenuntergang und niemand schaut rein', 'Alpenkette, unverbaubar', 'Hoch über den Dächern mit Lichtern'];
  function aiParse(text) {
    const tok = norm(text).split(/[^a-z0-9]+/).filter(Boolean);
    const has = words => words.some(w => w.endsWith('*') ? tok.some(t => t.startsWith(w.slice(0, -1))) : tok.includes(w));
    const did = [];
    const set = (k, v, label) => { st[k] = Math.max(st[k] || 0, v); did.push(label); };
    const on = (id, label) => { st.active[id] = true; did.push(label); };
    const lake = has(['see', 'seen', 'seeli', 'seeblick*', 'seesicht*', 'zurichsee*', 'seeufer*', 'wasser*', 'seepanorama*']);
    const berg = has(['berg*', 'alpen*', 'gipfel*', 'glarnisch*', 'todi*', 'rigi*', 'pilatus*', 'santis*', 'mythen*', 'schnee*']);
    const pano = has(['panorama*', 'rundum*', 'riesig*', 'grosse', 'grosser', 'grossen', 'ganze', 'ganzer', 'ganzen']);
    if (lake) { if (has(['seepanorama*']) || pano) set('vLake', 3, 'See als Panorama'); else if (has(['breit*', 'viel', 'viele', 'weit', 'weiten'])) set('vLake', 2, 'See breit'); else set('vLake', 1, 'Seesicht'); }
    if (berg) { if (has(['alpenkette*', 'alpenpanorama*', 'bergpanorama*', 'kette*']) || (pano && !lake)) set('vPeaks', 4, 'Alpenkette'); else set('vPeaks', 1, 'Berge im Blick'); }
    if (has(['horizont*', 'fernsicht*', 'endlos*', 'unendlich*'])) set('vFree', 5000, 'Sicht bis zum Horizont');
    else if (has(['weitblick*', 'weitsicht*', 'weit', 'weite', 'weiten'])) set('vFree', 500, 'Freie Sicht ab 500 m');
    else if (has(['nachbarhaus*', 'hinterhof*', 'gegenuber*', 'fassade*', 'wand', 'mauer*'])) set('vFree', 100, 'Kein Haus direkt gegenüber');
    if (has(['rundum*', '180'])) set('vAngle', 130, 'Blickwinkel ab 130°');
    else if (pano && !lake && !berg) set('vAngle', 100, 'Blickwinkel ab 100°');
    if (has(['sonnenuntergang*', 'sunset*', 'untergang*', 'abendrot*'])) on('sunset', 'Sonnenuntergang im Blick');
    if (has(['abendsonne*'])) on('eve', 'Abendsonne');
    if (has(['unverbau*', 'verbaut*', 'verbauen*', 'bleibt'])) on('free', 'Unverbaubar');
    if (has(['einsicht*', 'privat*', 'niemand*', 'beobacht*', 'einblick*', 'reinschau*', 'schaut', 'nachbarn', 'diskret*'])) on('privacy', 'Wenig Einsicht');
    if (has(['sofa*', 'wohnzimmer*', 'wohnraum*', 'couch*', 'esstisch*'])) on('living', 'Aussicht vom Wohnzimmer');
    if (has(['balkon*', 'terrasse*', 'loggia*'])) on('balconyView', 'Aussicht vom Balkon');
    if (has(['grun*', 'wald*', 'park*', 'baum*', 'baume*', 'natur*'])) on('greenView', 'Viel Grün im Blick');
    if (has(['ganzjahr*', 'sommer*', 'immer'])) on('leafless', 'Ganzjährig frei');
    if (has(['stadt*', 'skyline*', 'dacher*', 'city*'])) on('skyline', 'Stadt und Dächer');
    if (has(['lichter*', 'nacht*', 'nachts*', 'beleucht*'])) on('lights', 'Lichter in der Nacht');
    if (has(['grossmunster*', 'prime*', 'uetliberg*', 'wahrzeichen*', 'altstadt*', 'zurichberg*'])) on('landmark', 'Wahrzeichen im Blick');
    if (has(['hochhaus*', 'turm*', 'wolkenkratzer*'])) on('tower', 'Hochhaus');
    else if (has(['uber', 'oben', 'hoch', 'hohe', 'hoher', 'hohen'])) on('above', 'Über den Dächern');
    if (has(['bestatigt*', 'echt*', 'ehrlich*', 'wirklich*', 'fake*', 'gepruft*'])) on('verified', 'Nur bestätigte Aussicht');
    if (has(['traum*', 'spektakul*', 'atemberaub*', 'wow', 'top', 'beste*'])) set('viewMin', 8, 'Gesamtnote ab 8');
    return did;
  }
  function applyWish(text) {
    st.aiQ = text;
    resetViewState();
    const did = aiParse(text);
    ui.aiMsg = did.length ? 'Verstanden: <b>' + did.map(esc).join(' · ') + '</b>' : 'Nichts erkannt. Versuch es mit See, Berge, Sonnenuntergang, wenig Einsicht oder unverbaubar.';
    refresh();
  }
  /* Latest move-in date. Listings "nach Vereinbarung" are flexible and always pass. */
  const MOVE = [['any', 'Egal'], ['now', 'Sofort'], ['dec', '1. Dez.'], ['jan', '1. Jan.'], ['mar', '1. März']];
  const MOVE_BY = {now: 0, dec: new Date(2026, 11, 1).getTime(), jan: new Date(2027, 0, 1).getTime(), mar: new Date(2027, 2, 1).getTime()};
  /* Buyers: what income and equity allow, by the banks' rule of thumb (see data.js). */
  const affordMax = () => Math.min(st.income != null ? st.income / DATA.INCOME_FACTOR : Infinity, st.equity != null ? st.equity / DATA.EQUITY : Infinity);
  function affordNote() {
    const lim = affordMax();
    const rule = 'Faustregel der Banken: 20 % Eigenkapital, und die Wohnkosten mit 5 % kalkulatorischem Zins höchstens ein Drittel des Einkommens.';
    return isFinite(lim) ? 'Damit tragbar bis ca. <b>CHF ' + fmt.dec(lim / 1e6, 2) + ' Mio.</b> ' + rule : rule + ' Zeigt dann nur Objekte, die du dir so leisten kannst.';
  }
  const parseMoney = s => { const d = String(s).replace(/[^0-9]/g, ''); return d ? +d * (/k/i.test(s) ? 1000 : 1) : null; };

  /* ---------- map ---------- */
  const app = $('#app'), mapEl = $('#map'), svg = $('#mapSvg'), overlay = $('#overlay'), ovLayer = $('#ovLayer'), ovScale = $('#ovScale'), ovPins = $('#ovPins'), sheet = $('#sheet');
  const view = {cx: 360, cy: 330, w: 560};
  let vw = 1, vh = 1;
  /* vis: the share of the map's width you can see; on wide screens the list covers the left part */
  let vis = 1;
  const measure = () => { const r = mapEl.getBoundingClientRect(); vw = Math.max(1, r.width); vh = Math.max(1, r.height); vis = isDesk() ? clamp((r.right - sheet.getBoundingClientRect().right) / vw, 0.35, 1) : 1; };
  const kpx = () => vw / view.w;
  const toScreen = (x, y) => [(x - view.cx) * kpx() + vw / 2, (y - view.cy) * kpx() + vh / 2];
  function clientToMap(cx, cy) { const r = mapEl.getBoundingClientRect(); return [(cx - r.left - vw / 2) / kpx() + view.cx, (cy - r.top - vh / 2) / kpx() + view.cy]; }
  function buildMap() {
    const M = GEO.MAP;
    /* Switzerland from Natural Earth (swiss.js) in two levels of detail; the detailed Zürich area (geo.js) inside it.
       The national layers are clipped out of the Zürich area, so nothing is drawn twice there. */
    const SW = window.SWISS, two = (cls, k) => SW ? '<path class="' + cls + ' m-fi" d="' + SW[k].fine + '"/><path class="' + cls + ' m-co" d="' + SW[k].coarse + '"/>' : '';
    svg.innerHTML = '<defs><clipPath id="noZh" clipPathUnits="userSpaceOnUse"><path clip-rule="evenodd" d="M-40000 -40000H40000V40000H-40000ZM0 0V1000H730V0Z"/></clipPath>' +
        '<linearGradient id="fadeL"><stop offset="0" class="fade-in"/><stop offset="1" class="fade-out"/></linearGradient>' +
        '<linearGradient id="fadeR"><stop offset="0" class="fade-out"/><stop offset="1" class="fade-in"/></linearGradient>' +
        '<linearGradient id="fadeT" x2="0" y2="1"><stop offset="0" class="fade-in"/><stop offset="1" class="fade-out"/></linearGradient>' +
        '<linearGradient id="fadeB" x2="0" y2="1"><stop offset="0" class="fade-out"/><stop offset="1" class="fade-in"/></linearGradient></defs>' +
      '<rect class="m-out" x="-40000" y="-40000" width="80000" height="80000"/>' + (SW ? two('m-ch', 'ch') : '<rect class="m-land" x="-600" y="-700" width="2000" height="2400"/>') +
      '<g clip-path="url(#noZh)">' + two('m-sw-road', 'roads') + two('m-sw-rail', 'rail') + two('m-sw-mw', 'motorways') + two('m-sw-river', 'rivers') + two('m-sw-lake', 'lakes') + '</g>' +
      '<g class="m-zh">' +
        '<path class="m-forest" d="' + M.forest + '"/><path class="m-streets" d="' + M.streets + '"/>' +
        /* forest and streets end at the edge of the Zürich data: fade them into plain land there */
        '<g class="m-edge" aria-hidden="true"><rect x="0" y="0" width="70" height="1000" fill="url(#fadeL)"/><rect x="660" y="0" width="70" height="1000" fill="url(#fadeR)"/>' +
        '<rect x="0" y="0" width="730" height="70" fill="url(#fadeT)"/><rect x="0" y="930" width="730" height="70" fill="url(#fadeB)"/></g>' +
        '<path class="m-casing" d="' + M.roads + '"/><path class="m-mw-casing" d="' + M.motorway + '"/>' +
        '<path class="m-road" d="' + M.roads + '"/><path class="m-mw" d="' + M.motorway + '"/>' +
        '<path class="m-river-edge" d="' + M.limmat + '"/><path class="m-river-edge m-sihl" d="' + M.sihl + '"/>' +
        '<path class="m-river" d="' + M.limmat + '"/><path class="m-river m-sihl" d="' + M.sihl + '"/>' +
        '<path class="m-lake" d="' + M.lake + '"/><path class="m-rail" d="' + M.rail + '"/>' +
      '</g>' + two('m-border', 'ch') +
      '<defs><mask id="mDimMask" maskUnits="userSpaceOnUse" x="-16000" y="-7000" width="30000" height="22000"><rect x="-16000" y="-7000" width="30000" height="22000" fill="#fff"/><path id="mHoles" d="M0 0" fill="#000"/></mask></defs>' +
      '<rect class="m-dim" id="mDim" x="-16000" y="-7000" width="30000" height="22000" mask="url(#mDimMask)" visibility="hidden"/><path class="m-area" id="mArea" d="M0 0"/>' +
      '<path class="m-route" id="mRoute" d="M0 0"/><path class="m-cone" id="mCone" d="M0 0"/><path class="m-draw" id="mDraw" d="M0 0"/>';
  }
  /* ---------- map rendering ----------
     At rest the SVG gets its viewBox and the overlay is rendered in full: decluttered, as keyed DOM nodes that are
     only touched when something changed. While a finger, the wheel or an animation moves the map, nothing is
     rebuilt: the SVG and the pin layer move with GPU transforms from the last full render. A full render follows
     when the motion settles, and about every 300 ms during a long gesture, so new pins come in and the map stays
     sharp. The SVG and the pins reach 40 % beyond the edges; before a pan or zoom-out would uncover an edge,
     the map renders in full again, so it is never cut off. */
  const SVG_PAD = 0.4;
  let moving = false, base = null, lastFull = 0, frameQ = false, dirty = false, ovScaled = false;
  /* zoomed out as far as the whole of Switzerland beside the list, and a little more */
  const maxW = () => 27000 / vis;
  /* the middle of the view stays over Switzerland */
  const BB = window.SWISS ? [window.SWISS.bbox[0] + 1500, window.SWISS.bbox[1] + 1500, window.SWISS.bbox[2] - 1500, window.SWISS.bbox[3] - 1500] : [0, 0, 730, 1000];
  const MIN_W = 160;
  const clampView = () => { view.w = clamp(view.w, MIN_W, maxW()); view.cx = clamp(view.cx, BB[0], BB[2]); view.cy = clamp(view.cy, BB[1], BB[3]); };
  function commitView() {
    dirty = false;
    const h = vh / kpx(), f = 1 + SVG_PAD * 2;
    svg.setAttribute('viewBox', (view.cx - view.w * f / 2).toFixed(2) + ' ' + (view.cy - h * f / 2).toFixed(2) + ' ' + (view.w * f).toFixed(2) + ' ' + (h * f).toFixed(2));
    svg.classList.toggle('z-far', view.w > 700);
    svg.classList.toggle('z-reg', view.w > 1400);
    svg.classList.toggle('z-cty', view.w > 5000);
    svg.style.transform = '';
    ovLayer.style.transform = '';
    unscale();
    renderOverlay();
    base = {cx: view.cx, cy: view.cy, w: view.w, vw, vh};
    lastFull = performance.now();
  }
  function moveFrame() {
    dirty = false;
    if (!base || base.vw !== vw || base.vh !== vh) { commitView(); return; }
    const k = kpx(), r = base.w / view.w, tx = vw / 2 * (1 - r) + (base.cx - view.cx) * k, ty = vh / 2 * (1 - r) + (base.cy - view.cy) * k;
    /* the pre-drawn margin is running out (fast pan or zoom-out): render now, before an empty edge shows */
    const guard = Math.min(vw, vh) * 0.08, pl = -SVG_PAD * vw * r + tx, pt = -SVG_PAD * vh * r + ty, pr = (1 + SVG_PAD) * vw * r + tx, pb = (1 + SVG_PAD) * vh * r + ty;
    if (pl > -guard || pt > -guard || pr < vw + guard || pb < vh + guard) { commitView(); return; }
    if (performance.now() - lastFull > 300 && (Math.abs(Math.log(r)) > 0.35 || Math.abs(tx) > vw * 0.28 || Math.abs(ty) > vh * 0.28)) { commitView(); return; }
    const t = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
    svg.style.transform = t + ' scale(' + r.toFixed(5) + ')';
    if (Math.abs(r - 1) < 1e-4) {
      unscale();
      ovLayer.style.transform = t;
    } else {
      /* zooming: dots and labels scale with the map for the moment; pins and markers move apart or together but keep their size */
      ovLayer.style.transform = '';
      ovScaled = true;
      ovScale.style.transform = t + ' scale(' + r.toFixed(5) + ')';
      for (const o of OV.values()) if (o.pin) o.el.style.transform = 'translate(' + (o.x * r + tx).toFixed(1) + 'px,' + (o.y * r + ty).toFixed(1) + 'px) translate(' + o.ax + ',' + o.ay + ')';
    }
  }
  function unscale() {
    if (!ovScaled) return;
    ovScale.style.transform = '';
    for (const o of OV.values()) if (o.pin) o.el.style.transform = o.tf;
    ovScaled = false;
  }
  function queueFrame() { if (frameQ) return; frameQ = true; requestAnimationFrame(() => { frameQ = false; if (!dirty) return; if (moving) moveFrame(); else commitView(); }); }
  function applyView() { clampView(); dirty = true; queueFrame(); }
  function queueOverlay() { dirty = true; queueFrame(); }
  function beginMove() {
    if (moving) return;
    if (!base) commitView();
    moving = true;
    ovLayer.style.willChange = 'transform'; ovScale.style.willChange = 'transform';
    mapEl.classList.add('is-moving');
  }
  /* the motion settled: render in full; a move you made also sets the list to what the map shows */
  function endMove(list) {
    if (!moving) return;
    moving = false;
    ovLayer.style.willChange = ''; ovScale.style.willChange = '';
    mapEl.classList.remove('is-moving');
    commitView();
    if (list) afterUserMove();
  }
  const tf = (x, y, ax, ay) => 'transform:translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(' + ax + ',' + ay + ')';
  /* The overlay as keyed DOM: labels, place markers, dots and price pills. A render touches only what changed. */
  const OV = new Map(), CLUSTERS = new Map();
  function ovSync(items) {
    const seen = new Set();
    for (const it of items) {
      seen.add(it.key);
      let o = OV.get(it.key);
      if (!o || o.tag !== it.tag) {
        if (o) o.el.remove();
        const el = document.createElement(it.tag);
        if (it.tag === 'button') el.type = 'button';
        o = {el, tag: it.tag, cls: null, html: null, attrs: {}, tf: '', pin: !it.flat};
        OV.set(it.key, o);
        (it.flat ? ovScale : ovPins).appendChild(el);
      }
      if (o.cls !== it.cls) { o.el.className = it.cls; o.cls = it.cls; }
      if (o.html !== it.html) { o.el.innerHTML = it.html; o.html = it.html; }
      if (it.attrs) for (const a in it.attrs) if (o.attrs[a] !== it.attrs[a]) { o.el.setAttribute(a, it.attrs[a]); o.attrs[a] = it.attrs[a]; }
      o.x = it.x; o.y = it.y; o.ax = it.ax; o.ay = it.ay;
      const t = 'translate(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px) translate(' + it.ax + ',' + it.ay + ')';
      if (o.tf !== t) { o.el.style.transform = t; o.tf = t; }
    }
    for (const [k, o] of OV) if (!seen.has(k)) { o.el.remove(); OV.delete(k); }
  }
  function renderOverlay() {
    const items = [], add = (key, tag, cls, html, attrs, x, y, ax, ay) => items.push({key, tag, cls, html, attrs, x, y, ax, ay, flat: key[0] === 'l' || key[0] === 'd'});
    const far = view.w > 640, mx = vw * 0.4, my = vh * 0.4;
    const inPad = (x, y, e) => x > -mx - e && y > -my - e && x < vw + mx + e && y < vh + my + e;
    GEO.LABELS.forEach((lb, i) => {
      if ((lb.k === 'q' && far) || view.w > 2500) return;
      const [sx, sy] = toScreen(lb.x, lb.y);
      if (inPad(sx, sy, 80)) add('l' + i, 'span', 'lbl lbl-' + lb.k, esc(lb.t), null, sx, sy, '-50%', '-50%');
    });
    if (window.SWISS) window.SWISS.places.forEach((c, i) => {
      if (view.w > 5000 ? c.pop < 60000 : view.w <= 1400 && c.x >= 0 && c.x <= 730 && c.y >= 0 && c.y <= 1000) return;
      const [sx, sy] = toScreen(c.x, c.y);
      if (inPad(sx, sy, 80)) add('lc' + i, 'span', 'lbl lbl-c' + (c.pop >= 100000 ? ' lbl-big' : ''), esc(c.n), null, sx, sy, '-50%', '-50%');
    });
    if (view.w < 3000) { const hb = toScreen(367, 347); add('hb', 'span', 'hb' + (st.places.some(p => p.id === 'hb') ? ' is-on' : ''), ic(P.train, 13, 2) + '<span>HB</span>', null, hb[0], hb[1], '-50%', '-50%'); }
    st.areas.forEach((a, i) => {
      let top = a[0];
      for (const p of a) if (p[1] < top[1]) top = p;
      const xs = a.map(p => p[0]), sc = toScreen((Math.min(...xs) + Math.max(...xs)) / 2, top[1]);
      const n = RES.filter(l => GEO.inPoly(l.x, l.y, a)).length;
      add('ar' + i, 'span', 'area-mk', ic(P.lasso, 13, 2.2) + n + (n === 1 ? ' Angebot' : ' Angebote'), null, clamp(sc[0], 70, vw - 70), clamp(sc[1], 40, vh - 20), '-50%', '-125%');
    });
    st.circles.forEach((c, i) => {
      const sc = toScreen(c.x, c.y - c.km / GEO.UNIT_KM), n = RES.filter(l => inCircle(l, c)).length;
      add('ci' + i, 'span', 'area-mk', ic(P.target, 13, 2.2) + fmtKm(c.km) + ' um ' + esc(c.name) + ' · ' + n, null, clamp(sc[0], 70, vw - 70), clamp(sc[1], 40, vh - 20), '-50%', '-125%');
    });
    st.places.forEach((p, i) => {
      const work = p.kind === 'work';
      if (p.id === 'hb' && !work) return;
      const s = toScreen(p.x, p.y);
      add('pl' + i, 'span', work ? 'work-mk' : 'place-mk', ic(work ? P.brief : P.pin, work ? 15 : 13, 2.2) + '<span>' + esc(work ? 'Arbeit' : shortName(p)) + '</span>', null, clamp(s[0], 50, vw - 50), clamp(s[1], 20, vh - 20), '-50%', '-50%');
    });
    /* Price pills (compact) for the results; the selected listing gets the full teardrop pin. Pills that would overlap become dots. */
    const P0 = st.places[0], timeMode = st.pinMode === 'time' && !!P0, viewMode = st.pinMode === 'view';
    const pts = [];
    for (const l of ALLR) {
      const s = toScreen(l.x, l.y);
      if (!inPad(s[0], s[1], 0)) continue;
      const text = timeMode ? placeTime(l, P0) + '′' : viewMode ? fmt.dec(l.view) : fmt.short(l);
      pts.push({l, s, text, near: NEAR_BY.has(l.id), w: 20 + text.length * 7.6 + (timeMode || viewMode ? 16 : 0) + (st.saved[l.id] ? 14 : 0)});
    }
    /* Best matches (or, in view mode, the best views) get a pill where there is room; the others show as dots until you zoom in. */
    pts.sort((a, b) => (b.l.id === ui.sel) - (a.l.id === ui.sel) || a.near - b.near || (viewMode ? b.l.view - a.l.view : score(b.l) - score(a.l)));
    const pills = [], dots = [];
    for (const p of pts) {
      const isSel = p.l.id === ui.sel;
      const blocked = !isSel && pills.some(q => Math.abs(q.s[0] - p.s[0]) < (q.w + p.w) / 2 + 3 && (q.l.id === ui.sel ? p.s[1] - q.s[1] > -24 && q.s[1] - p.s[1] < 66 : Math.abs(q.s[1] - p.s[1]) < 31));
      (blocked ? dots : pills).push(p);
    }
    const aria = l => l.title + ', ' + fmt.price(l) + (timeMode ? ', ' + placeTime(l, P0) + ' Minuten ' + modeLabel(P0) + ' bis ' + placeLabel(P0) : '') + (viewMode ? ', Aussicht ' + fmt.dec(l.view) + ' von 10' : '') + (st.saved[l.id] ? ', gemerkt' : '') + (NEAR_BY.has(l.id) ? ', passt nicht ganz' : '');
    /* Zoomed out (whole country or a region), listings close together become one bubble with their number; a tap
       zooms in on them. The grid is in map units, so the bubbles stay put while you pan. */
    if (view.w > 1400) {
      const cell = 58 / kpx(), cells = new Map();
      CLUSTERS.clear();
      for (const p of pts) {
        if (p.l.id === ui.sel) continue;
        const key = Math.floor(p.l.x / cell) + '_' + Math.floor(p.l.y / cell);
        let c = cells.get(key);
        if (!c) cells.set(key, c = {ls: [], sx: 0, sy: 0, near: 0});
        c.ls.push(p.l); c.sx += p.s[0]; c.sy += p.s[1]; if (p.near) c.near++;
      }
      /* bubbles that would mostly cover each other become one, the bigger one taking in the smaller */
      const rOf = n => n >= 100 ? 27 : n >= 10 ? 23 : n > 1 ? 20 : 7;
      const kept = [];
      for (const [key, c] of [...cells].sort((a, b) => b[1].ls.length - a[1].ls.length)) {
        const n = c.ls.length, x = c.sx / n, y = c.sy / n;
        const k = kept.find(q => Math.hypot(q.c.sx / q.c.ls.length - x, q.c.sy / q.c.ls.length - y) < (rOf(q.c.ls.length) + rOf(n)) * 0.8);
        if (k) { k.c.ls.push(...c.ls); k.c.sx += c.sx; k.c.sy += c.sy; k.c.near += c.near; } else kept.push({key, c});
      }
      const bubbles = [];
      for (const {key, c} of kept) {
        const n = c.ls.length, x = c.sx / n, y = c.sy / n;
        if (n === 1) { const l = c.ls[0]; add('d' + l.id, 'button', 'pd' + (st.saved[l.id] ? ' is-saved' : '') + (NEAR_BY.has(l.id) ? ' pd-near' : ''), '', {'data-pin': l.id, 'aria-label': aria(l)}, x, y, '-50%', '-50%'); continue; }
        CLUSTERS.set(key, c.ls);
        bubbles.push({x, y, r: rOf(n)});
        add('k' + key, 'button', 'pc' + (c.near === n ? ' pc-near' : '') + (n >= 100 ? ' pc-l' : n >= 10 ? ' pc-m' : ''), n >= 1000 ? (n / 1000).toFixed(1).replace('.', ',') + 'k' : String(n), {'data-cluster': key, 'aria-label': n + ' Angebote, hineinzoomen'}, x, y, '-50%', '-50%');
      }
      /* a bubble sits where the listings are, which is usually on the name of the town: the name moves below or
         above it, and is left out when other bubbles cover both spots */
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i], mark = it.key[0] === 'p' && it.key[1] === 'l';
        if (!mark && (it.key[0] !== 'l' || it.key[1] !== 'c')) continue;
        const hw = mark ? 36 : it.html.length * 3.6 + 6, hit = (y, not) => bubbles.find(b => b !== not && Math.abs(b.x - it.x) < b.r + hw && Math.abs(b.y - y) < b.r + 9);
        const b = hit(it.y);
        if (!b) continue;
        if (mark || hit(b.y + b.r + 10, b)) {
          if (mark || !hit(b.y - b.r - 10, b)) { it.y = b.y - b.r - 3; it.ay = '-100%'; } else items.splice(i, 1);
        } else { it.y = b.y + b.r + 2; it.ay = '0'; }
      }
      const sel = ui.sel && pts.find(p => p.l.id === ui.sel);
      if (sel) add('p' + sel.l.id, 'button', 'pin is-sel', '<span class="pin-bubble">' + esc(sel.text) + '</span><span class="pin-drop"><span class="pin-dot"></span></span>', {'data-pin': sel.l.id, 'aria-pressed': 'true', 'aria-label': aria(sel.l)}, sel.s[0], sel.s[1], '-50%', '-100%');
      ovSync(items);
      return;
    }
    /* with hundreds of listings, dots that would sit on top of each other show once; every listing stays in the list */
    const shownDots = [];
    for (const d of dots) if (!shownDots.some(k => Math.abs(k.s[0] - d.s[0]) < 8 && Math.abs(k.s[1] - d.s[1]) < 8)) shownDots.push(d);
    for (const {l, s} of shownDots) add('d' + l.id, 'button', 'pd' + (st.saved[l.id] ? ' is-saved' : '') + (viewMode && l.view >= 8 ? ' pd-hi' : '') + (NEAR_BY.has(l.id) ? ' pd-near' : ''), '', {'data-pin': l.id, 'aria-label': aria(l)}, s[0], s[1], '-50%', '-50%');
    for (const {l, s, text} of pills) {
      const saved = !!st.saved[l.id];
      const label = (timeMode ? ic(PMODES[P0.mode].icon, 12, 2.2) : viewMode ? ic(P.eye, 12, 2.2) : '') + esc(text) + (saved ? '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="' + P.heart + '" fill="var(--heart)"/></svg>' : '');
      /* view mode colours the pills: the best views stand out, poor ones step back */
      const tone = viewMode ? (l.view >= 8 ? ' pp-hi' : l.view < 5 ? ' pp-lo' : '') : '';
      if (l.id === ui.sel) add('p' + l.id, 'button', 'pin is-sel', '<span class="pin-bubble">' + label + '</span><span class="pin-drop"><span class="pin-dot"></span></span>', {'data-pin': l.id, 'aria-pressed': 'true', 'aria-label': aria(l)}, s[0], s[1], '-50%', '-100%');
      else add('p' + l.id, 'button', 'pp' + tone + (NEAR_BY.has(l.id) ? ' pp-near' : ''), label, {'data-pin': l.id, 'aria-pressed': 'false', 'aria-label': aria(l)}, s[0], s[1], '-50%', 'calc(-100% - 7px)');
    }
    ovSync(items);
  }
  function renderSelGeo() {
    const l = ui.sel ? BY_ID[ui.sel] : null;
    $('#mCone').setAttribute('d', l ? GEO.cone(l.x, l.y, l.dir, l.span, 120) : 'M0 0');
    const w = st.places[0];
    $('#mRoute').setAttribute('d', l && w ? 'M' + l.x.toFixed(1) + ',' + l.y.toFixed(1) + 'L' + (+w.x).toFixed(1) + ',' + (+w.y).toFixed(1) : 'M0 0');
  }
  function insets() {
    const m = mapEl.getBoundingClientRect(), t = $('#top').getBoundingClientRect();
    if (isDesk()) return {top: t.bottom - m.top + 4, bottom: 78, left: sheet.getBoundingClientRect().right - m.left};
    return {top: t.bottom - m.top + 4, bottom: sheetPx() + 8, left: 0};
  }
  let anim = 0;
  /* Move the map to t, animated unless motion is reduced. list: it was your move, so the list follows the map. */
  function animateTo(t, animate, list) {
    if (anim) cancelAnimationFrame(anim);
    anim = 0;
    if (!animate || reduced) {
      Object.assign(view, t);
      clampView();
      if (moving) endMove(list); else { applyView(); if (list) afterUserMove(); }
      return;
    }
    beginMove();
    const f = Object.assign({}, view), t0 = performance.now(), D = 420;
    const step = now => {
      const p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 3);
      view.w = f.w + (t.w - f.w) * e; view.cx = f.cx + (t.cx - f.cx) * e; view.cy = f.cy + (t.cy - f.cy) * e;
      clampView();
      if (p < 1) { moveFrame(); anim = requestAnimationFrame(step); } else { anim = 0; endMove(list); }
    };
    anim = requestAnimationFrame(step);
  }
  /* the view that frames these points in the part of the map the panel or the sheet leaves free */
  function fitView(points, minW) {
    measure();
    if (!points.length) return {w: view.w, cx: view.cx, cy: view.cy};
    const ins = insets(), pad = 30, pinH = 64;
    const aw = Math.max(90, vw - ins.left - pad * 2), ah = Math.max(90, vh - ins.top - ins.bottom - pad - pinH);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of points) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const bw = Math.max(minW || 80, x1 - x0), bh = Math.max(minW || 80, y1 - y0);
    const w = clamp(vw / Math.min(aw / bw, ah / bh), MIN_W, maxW()), k = vw / w;
    const acx = ins.left + pad + aw / 2, acy = ins.top + pinH + ah / 2;
    return {w, cx: clamp((x0 + x1) / 2 - (acx - vw / 2) / k, BB[0], BB[2]), cy: clamp((y0 + y1) / 2 - (acy - vh / 2) / k, BB[1], BB[3])};
  }
  function fit(points, animate, minW) { if (points.length) animateTo(fitView(points, minW), animate, true); }
  /* Frame the city core first; listings out on the lake shores stay one pan or one tap on "Alle zeigen" away. */
  function fitTarget(all) {
    /* the exact results decide where the map goes; the near matches only when there are none */
    const base = RES.length ? RES : ALLR;
    /* a link to one place opens the map there */
    if (ui.fitPlace && !all) { const here = base.filter(l => l.place === ui.fitPlace); if (here.length) return fitView(here.map(l => [l.x, l.y]), 90); }
    let pts = base.map(l => [l.x, l.y]);
    if (!all && pts.length >= 10) {
      const core = pts.filter(([x, y]) => x >= 150 && x <= 540 && y >= 80 && y <= 560);
      if (core.length >= 3 && core.length >= pts.length * 0.6) pts = core;
    }
    return fitView(pts.length ? pts : [[367, 347]], 90);
  }
  /* The list is set for where the map is going before the map moves, so it changes once, not twice. */
  function fitResults(animate, all) {
    if (all) ui.fitPlace = null;
    const t = fitTarget(all);
    if (relist(t)) { renderSheet(); $('#sheetBody').scrollTop = 0; renderSelGeo(); }
    animateTo(t, animate, false);
  }
  function panTo(l) {
    measure();
    const ins = insets(), s = toScreen(l.x, l.y);
    if (s[0] > ins.left + 40 && s[0] < vw - 40 && s[1] > ins.top + 70 && s[1] < vh - ins.bottom - 20) return;
    const k = kpx(), acx = ins.left + (vw - ins.left) / 2, acy = ins.top + (vh - ins.top - ins.bottom) / 2 + 30;
    animateTo({w: view.w, cx: l.x - (acx - vw / 2) / k, cy: l.y - (acy - vh / 2) / k}, true, false);
  }
  /* zoom by f around a point given in client coordinates */
  function zoomTarget(cx, cy, f) {
    const r = mapEl.getBoundingClientRect(), mx = cx - r.left, my = cy - r.top;
    const u = [(mx - vw / 2) / kpx() + view.cx, (my - vh / 2) / kpx() + view.cy];
    const w = clamp(view.w * f, MIN_W, maxW()), k = vw / w;
    return {w, cx: u[0] - (mx - vw / 2) / k, cy: u[1] - (my - vh / 2) / k};
  }
  function zoomAt(cx, cy, f) { Object.assign(view, zoomTarget(cx, cy, f)); applyView(); }
  /* the middle of the part of the map you can see, in client coordinates */
  function visCenter() {
    measure();
    const r = mapEl.getBoundingClientRect(), ins = insets();
    return [r.left + ins.left + (vw - ins.left) / 2, r.top + ins.top + (vh - ins.top - ins.bottom) / 2];
  }

  /* ---------- draw the search area on the map ----------
     In draw mode one finger (or the mouse) traces the area instead of panning; the shape closes on release.
     Up to four areas; a listing counts when it lies in any of them. */
  let drawPts = null, drawId = null, drawLast = null;
  const fmtKm = km => String(km).replace('.', ',') + ' km';
  const polyD = a => 'M' + a.map(p => p[0] + ',' + p[1]).join('L') + 'Z';
  const circD = c => { const r = c.km / GEO.UNIT_KM, f = v => v.toFixed(1); return 'M' + f(c.x - r) + ',' + f(c.y) + 'a' + f(r) + ',' + f(r) + ' 0 1,0 ' + f(2 * r) + ',0a' + f(r) + ',' + f(r) + ' 0 1,0 ' + f(-2 * r) + ',0Z'; };
  function renderAreas() {
    const d = st.areas.map(polyD).join('') + st.circles.map(circD).join('');
    $('#mArea').setAttribute('d', d || 'M0 0');
    $('#mHoles').setAttribute('d', d || 'M0 0');
    $('#mDim').setAttribute('visibility', d ? 'visible' : 'hidden');
    $('#drawBtn').classList.toggle('is-on', !!st.areas.length || ui.draw);
    $('#drawBtn').setAttribute('aria-pressed', String(ui.draw));
  }
  function startDrawMode(fromFilters) {
    ui.draw = true;
    ui.drawReturn = fromFilters ? 'filters' : null;
    if (ui.detail) closeDetail();
    if (!isDesk()) setSheet('peek');
    mapEl.classList.add('is-drawing');
    $('#drawText').textContent = (window.matchMedia('(pointer: coarse)').matches ? 'Fahr mit dem Finger' : 'Zeichne mit gedrückter Maustaste') + ' einmal um das Gebiet, das dich interessiert.';
    $('#drawBanner').hidden = false;
    renderAreas();
  }
  function stopDrawMode() {
    ui.draw = false;
    drawPts = null; drawId = null;
    mapEl.classList.remove('is-drawing');
    $('#drawBanner').hidden = true;
    $('#mDraw').setAttribute('d', 'M0 0');
    renderAreas();
    if (ui.drawReturn === 'filters') { ui.drawReturn = null; openDlg('filters'); scrollDlgTo('fAreaSec'); }
  }
  function addArea(pts) {
    if (st.areas.length >= 4) st.areas.shift();
    st.areas.push(pts);
    refresh({fit: false});
    fit(pts, true, 40);
    const n = RES.filter(l => GEO.inPoly(l.x, l.y, pts)).length;
    toast(n ? n + (n === 1 ? ' Angebot' : ' Angebote') + ' im Gebiet' : 'Im Gebiet gibt es mit deinen Filtern gerade keine Angebote');
  }
  function finishDraw(ok) {
    const pts = drawPts;
    drawPts = null; drawId = null;
    $('#mDraw').setAttribute('d', 'M0 0');
    if (!ok || !pts) return;
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    if (pts.length < 6 || Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < 12) { toast('Zu klein. Fahr einmal um das ganze Gebiet.'); return; }
    const k = Math.ceil(pts.length / 80), simple = pts.filter((p, i) => i % k === 0).map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]);
    const back = ui.drawReturn;
    ui.drawReturn = null;
    stopDrawMode();
    addArea(simple);
    if (back === 'filters') { openDlg('filters'); scrollDlgTo('fAreaSec'); }
  }
  /* Without drawing: take the part of the map you are looking at. Also the way in for keyboard users. */
  function areaFromView() {
    measure();
    const ins = insets(), r = mapEl.getBoundingClientRect(), x0 = r.left + ins.left + 14, x1 = r.left + vw - 14, y0 = r.top + ins.top + 10, y1 = r.top + vh - ins.bottom - 10;
    const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => clientToMap(x, y).map(v => Math.round(v * 10) / 10));
    const back = ui.drawReturn;
    ui.drawReturn = null;
    stopDrawMode();
    addArea(pts);
    if (back === 'filters') { openDlg('filters'); scrollDlgTo('fAreaSec'); }
  }

  /* map gestures: drag to pan, pinch / wheel / double-click to zoom, tap for pins */
  const ptrs = new Map();
  let gest = null, moved = 0;
  const mid = pts => ({x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length});
  function startGesture() {
    const pts = [...ptrs.values()];
    gest = {view: Object.assign({}, view), mid: mid(pts), dist: pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0};
  }
  mapEl.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (ui.draw) {
      if (drawId != null) return;
      try { mapEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      measure();
      drawId = e.pointerId; drawLast = [e.clientX, e.clientY]; drawPts = [clientToMap(e.clientX, e.clientY)];
      e.preventDefault();
      return;
    }
    try { mapEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    ptrs.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (anim) { cancelAnimationFrame(anim); anim = 0; }
    if (ptrs.size === 1) moved = 0;
    measure();
    startGesture();
  });
  mapEl.addEventListener('pointermove', e => {
    if (ui.draw) {
      if (e.pointerId !== drawId || !drawPts || Math.hypot(e.clientX - drawLast[0], e.clientY - drawLast[1]) < 4) return;
      drawLast = [e.clientX, e.clientY];
      drawPts.push(clientToMap(e.clientX, e.clientY));
      $('#mDraw').setAttribute('d', 'M' + drawPts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L'));
      return;
    }
    if (!ptrs.has(e.pointerId) || !gest) return;
    ptrs.set(e.pointerId, {x: e.clientX, y: e.clientY});
    const pts = [...ptrs.values()], m = mid(pts), k0 = vw / gest.view.w;
    if (pts.length === 1) {
      const dx = m.x - gest.mid.x, dy = m.y - gest.mid.y;
      moved = Math.max(moved, Math.hypot(dx, dy));
      if (moved < 4) return;
      mapEl.classList.add('is-dragging');
      beginMove();
      view.w = gest.view.w; view.cx = gest.view.cx - dx / k0; view.cy = gest.view.cy - dy / k0;
    } else if (gest.dist) {
      moved = 99;
      beginMove();
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), r = mapEl.getBoundingClientRect();
      const w = clamp(gest.view.w * gest.dist / Math.max(1, d), MIN_W, maxW()), k1 = vw / w;
      const ux = (gest.mid.x - r.left - vw / 2) / k0 + gest.view.cx, uy = (gest.mid.y - r.top - vh / 2) / k0 + gest.view.cy;
      view.w = w; view.cx = ux - (m.x - r.left - vw / 2) / k1; view.cy = uy - (m.y - r.top - vh / 2) / k1;
    }
    applyView();
  });
  function endPointer(e) {
    if (ui.draw) { if (e.pointerId === drawId) finishDraw(e.type === 'pointerup'); return; }
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (ptrs.size) { startGesture(); return; }
    mapEl.classList.remove('is-dragging');
    gest = null;
    if (moving && !anim) endMove(true);
    if (moved < 6 && e.type === 'pointerup') tapAt(e.clientX, e.clientY);
  }
  mapEl.addEventListener('pointerup', endPointer);
  mapEl.addEventListener('pointercancel', endPointer);
  /* a burst of wheel events is one gesture: moved with transforms, rendered in full once it stops */
  let wheelT = 0;
  mapEl.addEventListener('wheel', e => {
    e.preventDefault();
    if (anim) { cancelAnimationFrame(anim); anim = 0; }
    measure();
    beginMove();
    zoomAt(e.clientX, e.clientY, Math.exp(e.deltaY * 0.0016));
    clearTimeout(wheelT);
    wheelT = setTimeout(() => endMove(true), 180);
  }, {passive: false});
  mapEl.addEventListener('dblclick', e => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.closest('[data-pin],[data-cluster]')) return;
    measure();
    animateTo(zoomTarget(e.clientX, e.clientY, 0.55), true, true);
  });
  function tapAt(x, y) {
    if (ui.pick) { const [mx, my] = clientToMap(x, y); mapPicked(mx, my); return; }
    const el = document.elementFromPoint(x, y);
    const pin = el && el.closest('[data-pin]'), cl = el && el.closest('[data-cluster]');
    if (pin) { pickListing(pin.dataset.pin, true); return; }
    if (cl) { const ls = CLUSTERS.get(cl.dataset.cluster); if (ls) fit(ls.map(l => [l.x, l.y]), true, 50); return; }
    if (ui.sel) { ui.sel = null; renderSelection(); }
  }

  /* ---------- selection ---------- */
  function pickListing(id, fromMap) {
    if (fromMap && ui.sel === id) { openDetail(id); return; }
    ui.sel = id;
    renderSelection();
    if (fromMap) scrollCard(id); else panTo(BY_ID[id]);
  }
  function renderSelection() {
    document.querySelectorAll('.lst.is-sel').forEach(c => c.classList.remove('is-sel'));
    if (ui.sel) { const c = document.querySelector('.lst[data-id="' + ui.sel + '"]'); if (c) c.classList.add('is-sel'); }
    renderSelGeo();
    queueOverlay();
  }
  /* A tapped pin scrolls the feed to its listing; the scroll sync below is held off meanwhile. */
  let syncHold = 0, syncT = 0;
  function scrollCard(id) {
    let card = document.querySelector('.lst[data-id="' + id + '"]');
    if (!card && !LIST.some(l => l.id === id) && relist(view)) renderSheet();
    if (!card) { const i = LIST.findIndex(l => l.id === id); if (i >= 0) { renderMore(i + 4); card = document.querySelector('.lst[data-id="' + id + '"]'); } }
    const body = $('#sheetBody');
    if (!card) return;
    syncHold = performance.now() + 1400;
    body.scrollTo({top: Math.max(0, card.offsetTop - body.offsetTop - 8), behavior: reduced ? 'auto' : 'smooth'});
  }
  /* Scrolling the feed selects the listing you are looking at and shows it on the map, with its view cone. */
  function syncFromScroll() {
    if (performance.now() < syncHold || ui.detail) return;
    const body = $('#sheetBody'), line = body.getBoundingClientRect().top + Math.min(200, body.clientHeight * 0.4);
    for (const p of body.querySelectorAll('.lst')) {
      const r = p.getBoundingClientRect();
      if (r.bottom <= line) continue;
      if (r.top <= line && p.dataset.id !== ui.sel) { ui.sel = p.dataset.id; renderSelection(); panTo(BY_ID[ui.sel]); }
      break;
    }
  }

  /* ---------- top bar ---------- */
  /* Quick filters under the search: top views, HB within 20 minutes, then the everyday needs. */
  const SUGGEST = ['wm', 'garden', 'quiet', 'balcony', 'renovated', 'lift', 'pets', 'sunny', 'homeoffice', 'stop', 'parking'];
  const HB_QUICK = {mode: 'pt', max: 20}, TOP_VIEW = 8;
  function countWithView(v) {
    const keep = st.viewMin;
    st.viewMin = v;
    let n = 0;
    for (const l of LISTINGS) if (passes(l, st.active)) n++;
    st.viewMin = keep;
    return n;
  }
  function countWithPlace(p) {
    const keep = st.places;
    st.places = keep.concat([p]);
    let n = 0;
    for (const l of LISTINGS) if (passes(l, st.active)) n++;
    st.places = keep;
    return n;
  }
  function renderTop() {
    $('#dealRent').setAttribute('aria-pressed', String(st.deal === 'rent'));
    $('#dealBuy').setAttribute('aria-pressed', String(st.deal === 'buy'));
    const q = $('#q');
    if (document.activeElement !== q) q.value = st.q || '';
    const n = activeN();
    let h = '<button type="button" class="chip chip-filter" data-act="openFilters" aria-haspopup="dialog" aria-label="Alle Filter' + (n ? ', ' + n + ' aktiv' : '') + '">' + ic(P.filter, 16) + '<span>Filter</span>' + (n ? '<span class="chip-count">' + n + '</span>' : '<span style="width:4px"></span>') + '</button>';
    h += DREAM_SET
      ? '<button type="button" class="chip chip-on chip-dream-on" data-act="dream" aria-haspopup="dialog" aria-label="Regler deiner Beschreibung öffnen, ' + DREAM_SET.size + ' Treffer">' + ic(P.talk, 16, 2) + '<span>Deine Beschreibung</span><span class="chip-count">' + DREAM_SET.size + '</span></button>' +
        '<button type="button" class="chip chip-on chip-x" data-act="dreamClear" aria-label="Suche nach deiner Beschreibung beenden">' + ic(P.close, 15, 2) + '</button>'
      : '<button type="button" class="chip chip-dream" data-act="dream" aria-haspopup="dialog">' + ic(P.talk, 16, 2) + '<span>Traumwohnung beschreiben</span></button>';
    const wk = st.places.find(p => p.kind === 'work');
    h += wk
      ? '<button type="button" class="chip chip-work" data-act="openFilters" data-v="fPlaceSec" aria-haspopup="dialog" aria-label="Arbeitsweg nach ' + esc(wk.sub) + ', ' + esc(modeLabel(wk)) + (wk.max != null ? ', höchstens ' + wk.max + ' Minuten' : '') + ', ändern">' + ic(PMODES[wk.mode].icon, 16) + '<span>Arbeit</span><span class="chip-sub">' + (wk.max != null ? '≤ ' + wk.max + ' Min.' : wk.example ? 'Beispiel' : esc(wk.sub)) + '</span></button>'
      : '<button type="button" class="chip chip-add" data-act="placeAddWork" aria-haspopup="dialog">' + ic(P.brief, 16) + '<span>Arbeitsort setzen</span></button>';
    if (st.areas.length) h += '<button type="button" class="chip chip-on" data-act="clearAreas" aria-label="Gezeichnetes Gebiet entfernen">' + ic(P.lasso, 16, 2) + '<span>' + (st.areas.length === 1 ? 'Gezeichnetes Gebiet' : st.areas.length + ' Gebiete') + '</span>' + ic(P.close, 15, 2) + '</button>';
    st.circles.forEach((c, i) => { h += '<button type="button" class="chip chip-on" data-act="circleDel" data-id="' + i + '" aria-label="Umkreis ' + fmtKm(c.km) + ' um ' + esc(c.name) + ' entfernen">' + ic(P.target, 16, 2) + '<span>' + fmtKm(c.km) + ' um ' + esc(c.name) + '</span>' + ic(P.close, 15, 2) + '</button>'; });
    if (!st.areas.length && !st.circles.length) h += '<button type="button" class="chip chip-add" data-act="draw">' + ic(P.lasso, 16, 2) + '<span>Gebiet zeichnen</span></button>';
    st.places.forEach((p, i) => {
      if (p.kind === 'work') return;
      h += '<button type="button" class="chip chip-on" data-act="placeDel" data-id="' + i + '" aria-label="' + (p.max != null ? 'Höchstens ' + p.max + ' Minuten ' : '') + esc(modeLabel(p)) + ' bis ' + esc(p.name) + ', entfernen">' + ic(PMODES[p.mode].icon, 15, 2) + '<span>' + (p.max != null ? '≤ ' + p.max + ' Min. ' : '') + esc(shortName(p)) + '</span>' + ic(P.close, 15, 2) + '</button>';
    });
    if (st.viewMin) h += '<button type="button" class="chip chip-on" data-act="clearView" aria-label="Aussicht ab ' + fmt.dec(st.viewMin) + ', entfernen">' + ic(P.eye, 15, 2) + '<span>Aussicht ab ' + fmt.dec(st.viewMin) + '</span>' + ic(P.close, 15, 2) + '</button>';
    for (const v of VLEVELS) if (st[v.key]) h += '<button type="button" class="chip chip-on" data-act="clearV" data-id="' + v.key + '" aria-label="' + esc(v.chip(st[v.key])) + ', entfernen">' + ic(P.eye, 15, 2) + '<span>' + esc(v.chip(st[v.key])) + '</span>' + ic(P.close, 15, 2) + '</button>';
    for (const f of FILTERS) if (st.active[f.id]) h += '<button type="button" class="chip chip-on" data-act="toggleF" data-id="' + f.id + '" aria-label="' + esc(f.label) + ' entfernen"><span>' + esc(f.label) + '</span>' + ic(P.close, 15, 2) + '</button>';
    let k = 0;
    if (!st.viewMin) {
      const cnt = countWithView(TOP_VIEW);
      if (cnt && cnt < RES.length) { h += '<button type="button" class="chip chip-add" data-act="quickView" aria-label="Aussicht ab 8 von 10, ' + cnt + ' Treffer">' + ic(P.eye, 15, 2) + '<span>Top-Aussicht</span><span class="chip-n">' + cnt + '</span></button>'; k++; }
    }
    if (!st.places.some(p => p.kind !== 'work')) {
      const hbP = GEO.PLACES.find(p => p.id === 'hb'), cnt = countWithPlace(Object.assign({}, hbP, HB_QUICK));
      if (cnt && cnt < RES.length) {
        h += '<button type="button" class="chip chip-add" data-act="placeQuick" data-id="hb" aria-label="Höchstens 20 Minuten mit ÖV bis Zürich HB, ' + cnt + ' Treffer">' + ic(P.plus, 15, 2) + '<span>≤ 20 Min. bis HB</span><span class="chip-n">' + cnt + '</span></button>';
        k++;
      }
    }
    for (const id of SUGGEST) {
      if (k >= 4 || st.active[id]) continue;
      const cnt = countWith(id);
      if (!cnt || cnt === RES.length) continue;
      const f = DATA.byId[id];
      h += '<button type="button" class="chip chip-add" data-act="toggleF" data-id="' + id + '" aria-label="' + esc(f.label) + ' hinzufügen, ' + cnt + ' Treffer">' + ic(P.plus, 15, 2) + '<span>' + esc(f.label) + '</span><span class="chip-n">' + cnt + '</span></button>';
      k++;
    }
    $('#chips').innerHTML = h;
  }

  /* ---------- sheet ---------- */
  function sheetStates() {
    const H = app.clientHeight, topB = $('#top').getBoundingClientRect().bottom - app.getBoundingClientRect().top;
    return {peek: clamp(Math.round(H * 0.4), 260, 380), half: Math.round(H * 0.62), full: Math.max(300, Math.round(H - topB - 6))};
  }
  let dragH = null;
  const sheetPx = () => dragH != null ? dragH : isDesk() ? 0 : sheetStates()[ui.sheet];
  function setSheet(state, animate) {
    ui.sheet = state;
    dragH = null;
    sheet.classList.toggle('no-anim', animate === false);
    const h = isDesk() ? 0 : sheetStates()[state];
    if (!isDesk()) sheet.style.height = h + 'px'; else sheet.style.height = '';
    app.style.setProperty('--sheet-h', h + 'px');
    app.dataset.sheet = isDesk() ? 'panel' : state;
    $('#mapBtn').hidden = isDesk() || state !== 'full';
    $('#sheetToggle').setAttribute('aria-expanded', String(state !== 'peek'));
    if (animate === false) requestAnimationFrame(() => sheet.classList.remove('no-anim'));
  }
  (function sheetDrag() {
    const grip = $('#sheetGrip');
    let start = null;
    grip.addEventListener('pointerdown', e => {
      if (isDesk() || (e.pointerType === 'mouse' && e.button !== 0) || e.target.closest('.sheet-actions')) return;
      start = {y: e.clientY, h: sheet.getBoundingClientRect().height, t: performance.now(), moved: false};
      const move = ev => {
        const dy = ev.clientY - start.y;
        if (!start.moved && Math.abs(dy) < 6) return;
        start.moved = true;
        sheet.classList.add('no-anim');
        dragH = clamp(start.h - dy, 140, sheetStates().full);
        sheet.style.height = dragH + 'px';
        app.style.setProperty('--sheet-h', dragH + 'px');
      };
      const up = ev => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        sheet.classList.remove('no-anim');
        if (!start.moved) { start = null; return; }
        suppressClick = performance.now();
        const s = sheetStates(), h = dragH, v = (ev.clientY - start.y) / Math.max(1, performance.now() - start.t);
        let next = ['peek', 'half', 'full'].reduce((a, k) => Math.abs(s[k] - h) < Math.abs(s[a] - h) ? k : a, 'peek');
        if (v < -0.45) next = h > s.half ? 'full' : 'half';
        else if (v > 0.45) next = h < s.half ? 'peek' : 'half';
        start = null;
        setSheet(next);
        queueOverlay();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
  })();
  let suppressClick = 0;

  /* ---------- the feed: one scrollable profile per listing, the view first ----------
     Large pictures stacked with short prompt cards in between, no swiping and no like or skip. */
  /* All pictures of a listing, in gallery order. */
  function shots(l) {
    const lake = l.sees.includes('See'), city = l.sees.includes('Stadt');
    const out = [
      {k: 'view:day', t: 'Aussicht am Mittag'},
      {k: 'view:golden', t: l.eve ? 'Abendsonne gegen 19 Uhr' : 'Am Abend'},
      {k: 'view:night', t: lake ? 'Nachts: Lichter am See' : city ? 'Nachts: Stadtlichter' : 'Nachts'},
      {k: 'room:wohnen', t: 'Wohnen' + (l.ceil >= 2.9 ? ', ' + fmt.dec(l.ceil, 2) + ' m hoch' : '') + ', Fenster nach ' + compass(l.dir)}
    ];
    if (l.outdoor) out.push({k: 'room:aussen', t: l.outdoor.t + ' ' + l.outdoor.m2 + ' m²' + (l.eve ? ', mit Abendsonne' : ', nach ' + compass(l.dir))});
    out.push({k: 'room:kueche', t: l.openKitchen ? 'Offene Küche' : 'Küche'}, {k: 'room:bad', t: (l.baths > 1 ? l.baths + ' Bäder, hier ' : '') + (l.bathtub ? 'Bad mit Wanne' : 'Bad mit Dusche') + (l.bathWin ? ' und Fenster' : '')},
      {k: 'house:day', t: 'Das Haus: ' + (l.kind === 'reihen' ? 'Reihenhaus' : l.floors + ' Etagen') + ', Baujahr ' + l.year});
    return out;
  }
  const seesHtml = l => ['See', 'Alpen', 'Stadt', 'Grün'].filter(x => l.sees.includes(x)).map(x => '<span class="bdg">' + x + '</span>').join('') +
    (l.free ? '<span class="bdg bdg-acc">' + ic(P.check, 12, 2.4) + 'Unverbaubar</span>' : '') + '<span class="bdg">' + l.span + '° Sicht</span>' +
    '<span class="bdg">Frei bis ' + SCENE.fmtDist(l.vFree) + '</span>' + (l.vSunset.length ? '<span class="bdg">Sonnenuntergang ' + SCENE.monthsText(l.vSunset, true) + '</span>' : '') +
    (l.vPrivacy <= 6 ? '<span class="bdg">Wenig Einsicht</span>' : '');
  /* the listing check in one line: does the view the listing promises hold up against the analysis? */
  const claimLine = l => !l.vClaim ? '' : '<p class="claim-l ' + (l.vClaimOk ? 'is-ok' : 'is-no') + '">' + ic(l.vClaimOk ? P.check : P.alert, 15, 2.4) +
    '<span>Inserat verspricht «' + esc(l.vClaim) + '»: ' + (l.vClaimOk ? 'bestätigt.' : esc(l.vClaimNote)) + '</span></p>';
  function needsHtml(l) {
    return DATA.badges(l, st.active).map(b => '<span class="bdg' + (b.warn ? ' bdg-warn' : '') + '">' + (b.warn ? ic(P.alert, 13, 2.4) + '<span class="sr">Nachteil: </span>' : '') + esc(b.t) + '</span>').join('');
  }
  function profileHtml(l) {
    const saved = !!st.saved[l.id], rent = l.deal === 'rent', sh = shots(l), nm = NEAR_BY.get(l.id);
    const fig = (k, cls) => {
      const i = sh.findIndex(x => x.k === k);
      return '<figure class="ph' + (cls ? ' ' + cls : '') + '" data-act="open" data-id="' + l.id + '" data-v="' + i + '"><img class="lz" data-l="' + l.id + '" data-k="' + k + '" alt="' + esc(sh[i].t) + '" draggable="false" decoding="async"><figcaption>' + esc(sh[i].t) + '</figcaption></figure>';
    };
    let vit = '<span><b>' + esc(fmt.price(l)) + '</b>' + (rent ? ' / Mt. inkl. NK' : '') + '</span><span>' + fmt.zi(l) + ' Zi.</span><span>' + l.m2 + ' m²</span><span>' + l.baths + (l.baths > 1 ? ' Bäder' : ' Bad') + '</span><span>Einzug ' + esc(DATA.availShort(l)) + '</span>';
    if (!rent) vit += '<span>Einkommen ab CHF ' + fmt.k(l.income) + '</span>';
    for (const p of st.places) vit += '<span class="vt-cm">' + ic(PMODES[p.mode].icon, 14, 2.2) + placeTime(l, p) + ' Min. ' + esc(p.kind === 'work' ? 'zur Arbeit' : shortName(p)) + (p.mode === 'car' && p.peak ? ' (Stoss)' : '') + '</span>';
    const second = l.outdoor ? 'room:aussen' : 'room:kueche';
    return '<article class="prof lst' + (l.id === ui.sel ? ' is-sel' : '') + (nm ? ' is-near' : '') + '" data-id="' + l.id + '">' +
      '<div class="prof-h"><button type="button" class="prof-ht" data-act="open" data-id="' + l.id + '"><span class="prof-q">' + esc(whereQ(l)) + ' · ' + (l.floor >= 1 ? l.floor + '. Stock' : 'Erdgeschoss') + '</span><span class="prof-t">' + esc(l.title) + '</span></button>' +
        '<button type="button" class="prof-heart' + (saved ? ' is-on' : '') + '" data-act="save" data-id="' + l.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? 'Gemerkt' : 'Merken') + '"><span>' + heartIc(saved, 20) + '</span></button></div>' +
      (nm ? nearBHtml(nm) : '') +
      '<figure class="ph ph-hero" data-act="open" data-id="' + l.id + '" data-v="0"><img class="lz" data-l="' + l.id + '" data-k="view:day" alt="Aussicht von ' + esc(l.title) + '" draggable="false" decoding="async">' +
        '<span class="vscore' + (l.view >= 8 ? ' is-top' : '') + '">' + ic(P.eye, 16, 2.2) + 'Aussicht <b>' + fmt.dec(l.view) + '</b></span>' +
        '<figcaption>Blick nach ' + compass(l.dir) + (l.floor >= 1 ? ' aus dem ' + l.floor + '. Stock' : ' vom Erdgeschoss') + '</figcaption></figure>' +
      '<div class="vitals">' + vit + '</div>' +
      '<div class="prompt"><span class="prompt-k">Die Aussicht</span><p class="prompt-a">' + esc(loc(l, SCENE.viewText(l))) + '</p><div class="prompt-b">' + seesHtml(l) + '</div>' + claimLine(l) + '</div>' +
      fig('view:golden') +
      '<div class="pano-card"><div class="pano-h"><span>' + ic(P.eye, 15, 2) + 'Was du siehst</span><span>Blick nach ' + compass(l.dir) + '</span></div><div class="pano-lz" data-l="' + l.id + '"></div></div>' +
      fig('room:wohnen') +
      '<div class="prompt"><span class="prompt-k">Im Alltag</span><div class="prompt-b prompt-b-lg">' + needsHtml(l) + '</div></div>' +
      (l.view >= 6.5 ? fig('view:night') : '') + fig(second) + fig('house:day', 'ph-wide') +
      '<div class="prompt prompt-warn"><span class="prompt-k">' + ic(P.info, 15, 2.2) + 'Gut zu wissen</span><p class="prompt-a">' + esc(l.caveat) + '</p></div>' +
      '<button type="button" class="prof-more" data-act="open" data-id="' + l.id + '">Alle Details, Grundriss und Wegzeiten' + ic(P.chevR, 16, 2.2) + '</button>' +
    '</article>';
  }
  /* ---------- the alternative: compact tiles, one picture per listing that is really four ---------- */
  /* Badges: your travel-time places first (the times differ per listing), then the needs from data.js and one drawback. */
  function cardBadges(l) {
    const all = DATA.badges(l, st.active), warn = all.find(b => b.warn);
    const vb = [];
    if (st.vLake) vb.push({t: ['', 'See: Streifen', 'See breit', 'Seepanorama'][l.vLake]});
    if (st.vPeaks) vb.push({t: l.vPeaks + ' Gipfel'});
    if (st.vFree) vb.push({t: 'Frei bis ' + SCENE.fmtDist(l.vFree)});
    if (st.vAngle) vb.push({t: l.span + '° Blick'});
    const pos = vb.concat(all.filter(b => !b.warn)).slice(0, warn ? 2 : 3);
    if (warn) pos.push(warn);
    if (!pos.length) return '';
    return '<span class="card-b">' + pos.map(b => '<span class="bdg' + (b.warn ? ' bdg-warn' : b.icon ? ' bdg-acc' : '') + '">' +
      (b.warn ? ic(P.alert, 12, 2.4) + '<span class="sr">Nachteil: </span>' : b.icon ? ic(b.icon, 12, 2.2) : '') + esc(b.t) + '</span>').join('') + '</span>';
  }
  /* The four: the view at noon, the view in the evening (golden hour with evening sun, else the lights at night),
     the living room with its window, and the balcony (or the house when there is none). Each opens the gallery there. */
  const tileKeys = l => ['view:day', l.eve ? 'view:golden' : 'view:night', 'room:wohnen', l.outdoor ? 'room:aussen' : 'house:day'];
  function tileHtml(l) {
    const saved = !!st.saved[l.id], rent = l.deal === 'rent', sh = shots(l), nm = NEAR_BY.get(l.id);
    const cells = tileKeys(l).map(k => { const i = sh.findIndex(x => x.k === k); return '<span class="mo-c" data-act="open" data-id="' + l.id + '" data-v="' + i + '" title="' + esc(sh[i].t) + '"><img class="lz" data-l="' + l.id + '" data-k="' + k + '" alt="" draggable="false" decoding="async"></span>'; }).join('');
    const cm = st.places.length ? '<span class="card-cm">' + st.places.slice(0, 2).map(p => ic(PMODES[p.mode].icon, 13, 2) + placeTime(l, p) + '′<span class="pk"> ' + esc(p.kind === 'work' ? 'Arbeit' : shortName(p)) + '</span>').join('<span class="sep">·</span>') + '</span>' : '';
    return '<article class="card lst' + (l.id === ui.sel ? ' is-sel' : '') + (nm ? ' is-near' : '') + '" data-id="' + l.id + '">' +
      '<div class="card-photo mosaic">' + cells +
        '<span class="photo-badge' + (l.view >= 8 ? ' is-top' : '') + '">' + ic(P.eye, 13, 2.2) + '<span>' + fmt.dec(l.view) + '</span><span class="sr"> von 10 Aussicht</span></span>' +
        (nm ? '<span class="near-tag">' + ic(P.alert, 12, 2.4) + 'Passt nicht ganz</span>' : '') +
        '<button type="button" class="heart' + (saved ? ' is-on' : '') + '" data-act="save" data-id="' + l.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? 'Gemerkt' : 'Merken') + '"><span>' + heartIc(saved) + '</span></button>' +
      '</div>' +
      '<button type="button" class="card-body" data-act="open" data-id="' + l.id + '" aria-label="' + esc(l.title + ', ' + fmt.price(l) + (nm ? ', passt nicht ganz: ' + nm.miss.map(m => m.t).join(', ') : '')) + ', Details">' +
        '<span class="card-q trunc">' + esc(whereQ(l)) + '</span>' +
        '<span class="card-t trunc">' + esc(l.title) + '</span>' +
        '<span class="card-s trunc">' + fmt.zi(l) + ' Zi. · ' + l.m2 + ' m² · ' + fmt.floor(l) + '</span>' +
        '<span class="card-p"><b>' + esc(fmt.price(l)) + '</b>' + (rent ? ' <span class="per">/ Mt. inkl. NK</span>' : '') + '</span>' +
        (rent ? '' : '<span class="card-x">Einkommen ab CHF ' + fmt.k(l.income) + '</span>') + cm + (nm ? missHtml(nm, 2) : cardBadges(l)) +
      '</button></article>';
  }
  /* Pictures are drawn only when their profile scrolls near, so the feed stays quick. */
  let lzObs = null;
  /* The list renders in pages; the next page, the pictures and the panoramas load as you scroll near them. */
  const PAGE = {feed: 6, grid: 24};
  let shown = 0;
  function hydrate() {
    const body = $('#sheetBody'), more = $('#moreS');
    const fill = t => {
      if (t.id === 'moreS') { renderMore(); return; }
      if (t.tagName === 'IMG') { if (!t.getAttribute('src')) t.src = SCENE.img(BY_ID[t.dataset.l], t.dataset.k); }
      else { t.innerHTML = loc(BY_ID[t.dataset.l], SCENE.pano(BY_ID[t.dataset.l])); t.classList.remove('pano-lz'); }
    };
    if (lzObs) lzObs.disconnect();
    const items = [...body.querySelectorAll('img.lz:not([src]), .pano-lz')];
    if (!('IntersectionObserver' in window)) { items.forEach(fill); if (more && !more.hidden) renderMore(LIST.length); return; }
    lzObs = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; lzObs.unobserve(e.target); fill(e.target); }), {root: body, rootMargin: '1400px 0px'});
    items.forEach(t => lzObs.observe(t));
    if (more && !more.hidden) lzObs.observe(more);
  }
  function renderMore(upTo) {
    const lst = $('#lst');
    if (!lst || shown >= LIST.length) return;
    const from = shown, to = Math.min(LIST.length, Math.max(upTo || 0, shown + PAGE[st.layout === 'feed' ? 'feed' : 'grid']));
    lst.insertAdjacentHTML('beforeend', LIST.slice(from, to).map((l, j) => itemHtml(l, from + j)).join(''));
    shown = to;
    if (shown >= LIST.length) $('#moreS').hidden = true;
    hydrate();
  }
  const missHtml = (nm, max) => '<span class="miss">' + nm.miss.slice(0, max || 12).map(m => '<span class="miss-i">' + ic(P.close, 12, 2.8) + '<span class="sr">Passt nicht: </span>' + esc(m.t) + '</span>').join('') +
    (max && nm.miss.length > max ? '<span class="miss-more">und ' + (nm.miss.length - max) + ' weitere</span>' : '') + '</span>';
  const nearBHtml = nm => '<div class="near-b"><span class="near-bh">' + ic(P.alert, 16, 2.2) + '<b>Passt nicht ganz</b><span>erfüllt ' + nm.met + ' von ' + nm.total + (nm.total === 1 ? ' Kriterium' : ' Kriterien') + '</span></span>' + missHtml(nm) + '</div>';
  function itemHtml(l, i) {
    return (i === VIS_N && VIS_N && VNEAR_N ? nearDivHtml() : '') + (st.layout === 'feed' ? profileHtml(l) : tileHtml(l));
  }
  function nearNoteHtml() {
    const N = VNEAR_N;
    return '<div class="near-note" role="note"><span class="near-ic">' + ic(P.alert, 20, 2.2) + '</span><div class="near-nt"><b>Kein Angebot erfüllt ' + critTxt(NEAR[0].total) + '</b>' +
      '<p>Hier ' + (N === 1 ? 'das eine, das' : 'die ' + N + ', die') + ' am meisten davon erfüllen. Bei jedem steht, was nicht passt; auf der Karte sind sie gestrichelt.</p>' +
      '<div class="near-act"><button type="button" data-act="whyZero" aria-label="Warum keine Treffer? Vorschläge ansehen">Vorschläge</button><button type="button" data-act="openFilters">Filter anpassen</button></div></div></div>';
  }
  function nearDivHtml() {
    return '<div class="near-div" role="separator" aria-label="Fast passend"><b>Fast passend</b><span>' + (VNEAR_N === 1 ? 'Dieses Angebot erfüllt' : 'Diese ' + VNEAR_N + ' erfüllen') + ' nicht alle Kriterien. Bei jedem steht, was nicht passt.</span></div>';
  }
  function renderSheet() {
    const n = RES.length, nn = NEAR.length, unit = c => st.deal === 'rent' ? (c === 1 ? 'Wohnung' : 'Wohnungen') : (c === 1 ? 'Objekt' : 'Objekte'), part = RES.length ? VIS_N < RES.length : VNEAR_N < NEAR.length;
    $('#sheetCount').textContent = !n && nn ? VNEAR_N + ' ähnliche' : VIS_N + ' ' + unit(VIS_N);
    const wk = st.places.find(p => p.kind === 'work');
    $('#sheetSub').textContent = part ? 'im Kartenausschnitt, ' + (n || nn) + ' insgesamt' : !n && nn ? 'Keine erfüllt alles' : nn ? '+ ' + nn + ' ähnliche unten' : st.places.length ? 'Wegzeit ' + st.places.slice(0, 2).map(p => p.kind === 'work' ? 'zur Arbeit' : 'nach ' + shortName(p)).join(' und ') + (wk && wk.example ? ' (Beispiel)' : '') : 'Setze deinen Arbeitsort für Wegzeiten';
    const sn = Object.keys(st.saved).length;
    $('#savedBtn').innerHTML = heartIc(sn > 0, 15) + '<span>' + sn + '</span>';
    $('#savedBtn').setAttribute('aria-label', 'Gemerkt: ' + sn);
    const so = SORTS.find(s => s.id === st.sort) || SORTS[0];
    $('#sortBtn').innerHTML = ic(P.sort, 15) + '<span class="sort-l">' + sortText(so, true) + '</span>' + ic(P.chevDown, 14, 2);
    $('#laySeg').innerHTML = '<button type="button" data-act="layout" data-v="grid" aria-pressed="' + (st.layout !== 'feed') + '" aria-label="Kacheln mit vier Bildern" title="Kacheln">' + ic(P.tiles, 17) + '</button>' +
      '<button type="button" data-act="layout" data-v="feed" aria-pressed="' + (st.layout === 'feed') + '" aria-label="Feed mit grossen Bildern" title="Feed">' + ic(P.rows, 17) + '</button>';
    $('#sortBtn').setAttribute('aria-label', 'Sortieren: ' + sortText(so));
    const body = $('#sheetBody');
    if (!n && !nn) {
      /* nothing left at all: offer the one change that brings the most listings back */
      ui.relax = relaxOptions();
      body.innerHTML = '<div class="empty"><span class="empty-ic">' + ic(P.search, 22) + '</span><b>Keine Treffer</b><p>' +
        (ui.relax.length ? 'Mit allen Filtern zusammen passt gerade kein Angebot. Mit einer Änderung bekommst du wieder Treffer:' : 'Mit diesen Filtern passt gerade kein Angebot.') + '</p>' +
        (ui.relax.length ? '<div class="relax">' + ui.relax.map((c, i) => '<button type="button" data-act="relax" data-v="' + i + '"><span>' + esc(c.label) + '</span><b>' + c.n + (c.n === 1 ? ' Angebot' : ' Angebote') + '</b></button>').join('') + '</div>' : '') +
        '<button type="button" class="btn-sec" data-act="resetFilters">Alle Filter zurücksetzen</button></div>';
      return;
    }
    if (!LIST.length) {
      body.innerHTML = '<div class="empty"><span class="empty-ic">' + ic(P.target, 22) + '</span><b>Hier ist nichts</b><p>In diesem Kartenausschnitt gibt es keine ' + (n ? 'passenden' : 'ähnlichen') + ' Angebote. Verschieb die Karte oder zeig alle ' + (n || nn) + '.</p>' +
        '<button type="button" class="btn-pri" data-act="fit">Alle ' + (n || nn) + ' zeigen</button></div>';
      return;
    }
    shown = Math.min(LIST.length, PAGE[st.layout === 'feed' ? 'feed' : 'grid']);
    body.innerHTML = (n ? '' : nearNoteHtml()) + (part ? '<div class="inview"><span>Die Liste zeigt, was auf der Karte zu sehen ist.</span><button type="button" data-act="fit">Alle ' + (n || nn) + ' zeigen</button></div>' : '') + '<div class="' + (st.layout === 'feed' ? 'feed' : 'grid') + '" id="lst">' + LIST.slice(0, shown).map(itemHtml).join('') + '</div>' +
      '<div class="more-s" id="moreS"' + (shown < LIST.length ? '' : ' hidden') + '>Weitere Angebote laden …</div>' +
      '<p class="list-foot">Prototyp: alle Inserate, Preise, Bilder und KI-Werte sind Beispieldaten.<br>Bilder und Panoramen sind Illustrationen aus der Sichtanalyse, keine Fotos.<br>Wegzeiten sind Schätzungen aus einem vereinfachten Netz.</p>';
    hydrate();
  }
  /* Which single change brings the most listings back: each active filter, range, place limit, area or the search text. */
  function relaxOptions() {
    const C = [], add = (label, mut) => C.push({label, mut});
    FILTERS.forEach(f => { if (st.active[f.id]) add('Ohne «' + f.label + '»', x => { delete x.active[f.id]; }); });
    VLEVELS.forEach(v => { if (st[v.key]) add('Ohne «' + v.chip(st[v.key]) + '»', x => { x[v.key] = 0; }); });
    if (st.viewMin) add('Aussicht-Note egal', x => { x.viewMin = 0; });
    if (st.priceMin != null || st.priceMax != null) add('Preis egal', x => { x.priceMin = null; x.priceMax = null; });
    if (st.roomsMin || st.roomsMax) add('Zimmer egal', x => { x.roomsMin = 0; x.roomsMax = 0; });
    if (st.areaMin || st.areaMax) add('Wohnfläche egal', x => { x.areaMin = 0; x.areaMax = 0; });
    if (st.floorMin != null || st.floorMax != null) add('Etage egal', x => { x.floorMin = null; x.floorMax = null; });
    if (st.yearMin || st.yearMax) add('Baujahr egal', x => { x.yearMin = 0; x.yearMax = 0; });
    if (st.baths) add('Badezimmer egal', x => { x.baths = 0; });
    if (anyType()) add('Alle Objektarten', x => { x.types = {}; });
    if (st.since) add('Online seit egal', x => { x.since = 0; });
    if (st.moveBy !== 'any') add('Einzug egal', x => { x.moveBy = 'any'; });
    if (st.deal === 'buy' && (st.income != null || st.equity != null)) add('Ohne Tragbarkeit', x => { x.income = null; x.equity = null; });
    st.places.forEach((p, i) => { if (p.max != null) add('Ohne Limit ' + (p.kind === 'work' ? 'zur Arbeit' : 'nach ' + shortName(p)), x => { x.places[i].max = null; }); });
    if (st.areas.length || st.circles.length) add('Im ganzen Gebiet suchen', x => { x.areas = []; x.circles = []; });
    if ((st.q || '').trim()) add('Ohne Suche «' + st.q.trim() + '»', x => { x.q = ''; });
    return C.map(c => Object.assign(c, {n: countIf(c.mut)})).filter(c => c.n > 0).sort((a, b) => b.n - a.n).slice(0, 4);
  }
  function countIf(mut) {
    const snap = JSON.stringify(st);
    mut(st);
    let n = 0;
    for (const l of LISTINGS) if (passes(l, st.active)) n++;
    const back = JSON.parse(snap);
    Object.keys(st).forEach(k => { delete st[k]; });
    Object.assign(st, back);
    return n;
  }
  /* The way sort names its place: "Kürzester Arbeitsweg" for work, otherwise the place. */
  function sortText(s, short) {
    if (s.id !== 'commute') return short ? s.short : s.label;
    const p = st.places[0];
    if (!p) return short ? 'Weg' : 'Kürzester Weg';
    return p.kind === 'work' ? (short ? 'Arbeitsweg' : 'Kürzester Arbeitsweg') : (short ? 'Weg' : 'Kürzester Weg nach ' + shortName(p));
  }
  function renderSortMenu() {
    const m = $('#sortMenu');
    m.hidden = !ui.sortOpen;
    $('#sortBtn').setAttribute('aria-expanded', String(ui.sortOpen));
    if (!ui.sortOpen) return;
    m.innerHTML = SORTS.map(s => {
      const dis = s.place && !st.places.length;
      return '<button type="button" data-act="sort" data-v="' + s.id + '" aria-pressed="' + (st.sort === s.id) + '"' + (dis ? ' disabled' : '') + '><span>' + sortText(s) + '</span>' + (st.sort === s.id ? ic(P.check, 16, 2) : '') + '</button>';
    }).join('');
  }

  function renderAll() {
    renderTop();
    renderAreas();
    renderSheet();
    renderSortMenu();
    renderSelGeo();
    const pm = $('#pinMode'), pmv = st.pinMode === 'time' && !st.places.length ? 'price' : st.pinMode;
    pm.hidden = false;
    pm.innerHTML = '<button type="button" data-act="pinMode" data-v="price" aria-pressed="' + (pmv === 'price') + '">CHF</button>' +
      '<button type="button" data-act="pinMode" data-v="view" aria-pressed="' + (pmv === 'view') + '" aria-label="Aussicht auf den Pins">' + ic(P.eye, 14, 2.2) + 'Sicht</button>' +
      (st.places.length ? '<button type="button" data-act="pinMode" data-v="time" aria-pressed="' + (pmv === 'time') + '" aria-label="Minuten ' + (st.places[0].kind === 'work' ? 'zur Arbeit' : 'nach ' + esc(shortName(st.places[0]))) + '">' + ic(PMODES[st.places[0].mode].icon, 14, 2.2) + 'Min.</button>' : '');
    queueOverlay();
  }
  function refresh(opts) {
    const fit = !opts || opts.fit !== false;
    compute(fit && opts && opts.go ? 'go' : fit);
    renderAll();
    if (ui.dlg) renderDlg(true);
    redrawDetail();
    if (fit) goFit(true);
    persist();
    checkZero();
  }

  /* ---------- detail ---------- */
  const COMPASS = ['Norden', 'Nordosten', 'Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten'];
  const compass = d => COMPASS[Math.round((((d % 360) + 360) % 360) / 45) % 8];
  const legIcon = m => m === 'walk' ? P.walk : m === 'S' ? P.train : m === 'T' ? P.tram : P.bus;
  function legsHtml(pt) {
    return pt.legs.map(g => {
      const txt = g.mode === 'walk' ? g.min + ' Min. zu Fuss' : g.name + (g.from && g.to && g.from !== g.to ? ' ' + g.from + ' – ' + g.to : '') + ' · ' + g.min + ' Min.';
      return '<span class="leg">' + ic(legIcon(g.mode), 14, 2) + '<span>' + esc(txt) + '</span></span>';
    }).join('');
  }
  /* The view section of the detail: score, labelled panorama, the AI text and what is visible. */
  function viewFactsHtml(l) {
    const rows = [
      [l.vLake ? 'ok' : 'mid', 'See', ['Nicht im Blick', 'Ein Streifen', 'Breit', 'Panorama'][l.vLake] + (l.vLake ? ', ' + l.vLakeDeg + '° des Blicks' : '')],
      [l.vPeaks ? 'ok' : 'mid', 'Berge', l.vPeaks ? (l.vPeaks >= 4 ? 'Alpenkette, ' : '') + l.vPeaks + ' Gipfel' : 'Keine'],
      [l.vFree >= 100 ? 'ok' : 'no', 'Freie Sicht', SCENE.fmtDist(l.vFree) + (l.vFree < 50 ? ' bis zum Haus gegenüber' : l.vFree >= 5000 ? ', bis zum Horizont' : '')],
      [l.span >= 100 ? 'ok' : 'mid', 'Blickwinkel', l.span + '°, nach ' + compass(l.dir)],
      ['mid', 'Himmel', l.vSky + ' % des Fensters'],
      [l.vGreen >= 25 ? 'ok' : 'mid', 'Grün', l.vGreen + ' % des Blicks' + (l.vLeafy ? ', im Sommer dichter' : '')],
      [l.vPrivacy <= 6 ? 'ok' : l.vPrivacy >= 18 ? 'no' : 'mid', 'Einsicht', l.vPrivacy === 0 ? 'Niemand sieht direkt hinein' : l.vPrivacy + (l.vPrivacy === 1 ? ' fremdes Fenster' : ' fremde Fenster') + ' mit Blick hinein'],
      [l.vSunset.length ? 'ok' : 'mid', 'Sonnenuntergang', l.vSunset.length ? 'Im Blick: ' + SCENE.monthsText(l.vSunset) : 'Nicht im Blick'],
      [l.vLiving ? 'ok' : 'no', 'Von wo', (l.vLiving ? 'Wohnzimmer' : 'Nur Schlafzimmer') + (l.vBalcony ? ' und ' + l.outdoor.t : '')],
      [l.vLeafy ? 'mid' : 'ok', 'Jahreszeit', l.vLeafy ? 'Im Sommer teils hinter Laubbäumen' : 'Ganzjährig gleich'],
      [l.free ? 'ok' : l.vFree < 200 ? 'no' : 'mid', 'Verbauung', l.free ? 'Unverbaubar' : l.vFree < 200 ? 'Kann sich ändern: Bauzone vor dem Haus' : 'Möglich, aber nicht direkt davor'],
      [l.vLights ? 'ok' : 'mid', 'Nachts', l.vLights ? (l.vLake ? 'Lichter am See und in der Stadt' : 'Lichter der Stadt') : 'Eher dunkel']
    ];
    if (l.vMarks.length) rows.push(['ok', 'Wahrzeichen', l.vMarks.join(', ')]);
    return '<ul class="glance vfacts">' + rows.map(([s, k, v]) => '<li class="is-' + s + '"><span class="gi">' + ic(s === 'ok' ? P.check : s === 'no' ? P.close : P.minus, 13, 2.6) + '</span><span class="gl"><small>' + esc(k) + '</small><b>' + esc(v) + '</b></span></li>').join('') + '</ul>';
  }
  function viewSecHtml(l) {
    const claim = l.vClaim
      ? '<div class="claim ' + (l.vClaimOk ? 'is-ok' : 'is-no') + '">' + ic(l.vClaimOk ? P.check : P.alert, 18, 2.2) + '<span><b>Inserat-Check: «' + esc(l.vClaim) + '»</b>' + (l.vClaimOk ? 'Die Sichtanalyse bestätigt, was Text und Fotos versprechen.' : esc(l.vClaimNote)) + '</span></div>'
      : '<div class="claim">' + ic(P.info, 18, 2.2) + '<span><b>Inserat-Check</b>Das Inserat sagt nichts zur Aussicht. Alle Werte stammen aus der Sichtanalyse.</span></div>';
    return '<section class="d-sec"><div class="d-sec-h"><h2>Aussicht</h2><span class="vbig">' + fmt.dec(l.view) + '<small> / 10</small></span></div>' +
      '<p class="d-sub">KI-Sichtanalyse ab deinem Fenster, ' + l.vHeight + ' m über Boden.</p>' +
      '<div class="pano-card">' + loc(l, SCENE.pano(l)) + '</div><p class="view-txt">' + esc(loc(l, SCENE.viewText(l))) + '</p>' +
      viewFactsHtml(l) + claim +
      '<p class="vsrc">Sichtanalyse mit swissBUILDINGS3D, swissALTI3D und swissSURFACE3D (LiDAR) von swisstopo, Zonenplan der Gemeinde und Sonnenstand. Fotos und Inseratstext liest ein Bild- und Sprachmodell. Im Prototyp sind alle Werte Beispieldaten.</p></section>';
  }
  /* "Auf einen Blick": the things people check first, each marked yes, no or neutral. */
  function glanceHtml(l) {
    const rows = [];
    const add = (s, b, small) => rows.push('<li class="is-' + s + '"><span class="gi">' + ic(s === 'ok' ? P.check : s === 'no' ? P.close : P.minus, 13, 2.6) + '</span><span class="gl"><b>' + esc(b) + '</b>' + (small ? '<small>' + esc(small) + '</small>' : '') + '</span></li>');
    add(l.wm ? 'ok' : 'no', l.wm ? 'Eigene Waschmaschine' : 'Keine eigene Waschmaschine', l.wm ? 'mit Tumbler, in der Wohnung' : 'Waschküche im Haus');
    add(l.outdoor ? 'ok' : 'no', l.outdoor ? l.outdoor.t + ' ' + l.outdoor.m2 + ' m²' : 'Kein Balkon', l.outdoor ? 'nach ' + compass(l.dir) + (l.eve ? ', mit Abendsonne' : '') : 'kein eigener Aussenraum');
    if (l.gardenShared) add('ok', 'Garten zum Mitbenutzen', 'gemeinsam mit den anderen im Haus');
    if (l.floor === 0) add('ok', l.kind === 'reihen' ? 'Eigener Eingang' : 'Erdgeschoss', 'ohne Treppen');
    else add(l.lift ? 'ok' : l.floor >= 3 ? 'no' : 'mid', l.lift ? 'Lift' : 'Kein Lift', fmt.floor(l) + ' von ' + l.floors);
    add(l.noiseNight < 45 && !l.flight ? 'ok' : l.noiseNight >= 50 || l.flight ? 'no' : 'mid', l.flight ? 'Fluglärm' : l.noiseNight < 45 ? 'Ruhig' : l.noiseNight >= 50 ? 'Laut' : 'Etwas Verkehrslärm', 'nachts ' + l.noiseNight + ' dB an der Fassade');
    add(l.sun >= 6 ? 'ok' : l.sun < 4.5 ? 'no' : 'mid', l.sun >= 6 ? 'Sonnig' : l.sun < 4.5 ? 'Wenig Sonne' : 'Hell', fmt.dec(l.sun) + ' h pro Tag, im Dezember ' + fmt.dec(l.sunWinter) + ' h');
    add(l.renovated ? 'ok' : 'mid', l.isNew ? 'Neubau' : l.renovated ? 'Renoviert ' + l.renov : 'Baujahr ' + l.year, l.renovated ? 'Baujahr ' + l.year : l.renov ? 'zuletzt renoviert ' + l.renov : 'nicht renoviert');
    add(l.baths >= 2 || l.wcSep ? 'ok' : 'mid', (l.baths === 1 ? 'Ein Bad' : l.baths + ' Bäder') + (l.wcSep ? ' und separates WC' : ''), (l.bathtub ? 'mit Badewanne' : 'mit Dusche') + (l.bathWin ? ' und Fenster' : ', ohne Fenster'));
    add(l.homeoffice ? 'ok' : 'mid', l.homeoffice ? 'Zimmer fürs Homeoffice' : 'Kein Büro-Zimmer', l.homeoffice ? '' : 'Arbeitsplatz im Wohnraum');
    if (l.deal === 'rent') add(l.pets ? 'ok' : 'no', l.pets ? 'Haustiere erlaubt' : 'Keine Haustiere', 'laut Inserat');
    add(l.dishwasher ? 'ok' : 'no', l.dishwasher ? 'Geschirrspüler' : 'Kein Geschirrspüler', '');
    add(l.parking ? 'ok' : 'mid', l.parking || 'Kein Parkplatz', '');
    add(l.bikeRoom ? 'ok' : 'mid', l.bikeRoom ? 'Veloraum' : 'Kein Veloraum', '');
    add(l.cellar ? 'ok' : 'mid', l.cellar ? 'Keller oder Estrich' : 'Kein Kellerabteil', '');
    add('mid', l.openKitchen ? 'Offene Küche' : 'Separate Küche', l.ceil >= 2.9 ? fmt.dec(l.ceil, 2) + ' m Raumhöhe' : '');
    if (l.fireplace) add('ok', 'Cheminée', '');
    if (l.minergie) add('ok', 'Minergie', 'tiefe Heizkosten');
    if (l.wheelchair) add('ok', 'Rollstuhlgängig', 'stufenlos erreichbar');
    add(l.fiber ? 'ok' : 'mid', l.fiber ? 'Glasfaser' : 'Kein Glasfaseranschluss', '');
    if (l.furnished) add('mid', 'Möbliert vermietet', '');
    if (l.temporary) add('no', 'Befristet', 'befristete Miete');
    return '<section class="d-sec"><h2 style="margin-bottom:12px">Auf einen Blick</h2><ul class="glance">' + rows.join('') + '</ul></section>';
  }
  /* Travel times to your places: the first one in full (every way, rush hour, the ÖV legs), the others in one line. */
  function waysHtml(l) {
    if (!st.places.length) return '<section class="d-sec"><h2>Wegzeit</h2><div class="work-cta" style="margin-top:10px"><p>Setze deinen Arbeitsort und sieh bei jeder Wohnung, wie lange du zur Arbeit brauchst: mit ÖV, Velo, zu Fuss und mit dem Auto, auf Wunsch zur Stosszeit.</p><button type="button" class="btn-pri" data-act="placeAddWork">' + ic(P.brief, 18) + 'Arbeitsort setzen</button></div></section>';
    const row = (sel, icon, title, sub, val, warn, legs) => '<div class="cm-row' + (sel ? ' is-sel' : '') + '"><span class="cm-ic">' + ic(icon, 18) + '</span><span class="cm-l"><b>' + title + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + (legs || '') + '</span><span class="cm-v' + (warn ? ' peak' : '') + '">' + val + ' Min.</span></div>';
    let h = '<section class="d-sec"><div class="d-sec-h"><h2>Wegzeit</h2><button type="button" data-act="openFilters" data-v="fPlaceSec">Ändern</button></div>';
    st.places.forEach((p, i) => {
      const T = placeTimes(l, p), t = placeTime(l, p), over = p.max != null && t > p.max;
      const head = '<p class="d-sub way-h"><b>' + esc(placeLabel(p)) + '</b> · ' + esc(p.kind === 'work' ? p.sub : shortName(p)) + ' · ' + esc(modeLabel(p)) + (p.max != null ? ', höchstens ' + p.max + ' Min.' : '') + '</p>';
      if (i === 0) {
        const pt = T.ptR;
        h += head + '<div class="cm">' +
          row(p.mode === 'pt', P.tram, 'ÖV, Tür zu Tür', (pt.transfers ? pt.transfers + '× umsteigen' : 'ohne Umsteigen') + ' · ' + pt.walk + ' Min. zu Fuss', T.pt, over && p.mode === 'pt', '<span class="legs">' + legsHtml(pt) + '</span>') +
          row(p.mode === 'car' && !p.peak, P.car, 'Auto, normal', 'z. B. um 10 Uhr · ' + T.carR.km + ' km · Parkplatzsuche eingerechnet', T.car, over && p.mode === 'car' && !p.peak) +
          row(p.mode === 'car' && p.peak, P.car, 'Auto, Stosszeit', '7–8.30 und 16.30–18.30 Uhr · ' + (T.carPeak - T.car) + ' Min. mehr im Stau', T.carPeak, true) +
          row(p.mode === 'bike', P.bike, 'Velo', T.bikeR.km + ' km' + (l.hill > 0.4 ? ' · mit Steigung' : ''), T.bike, over && p.mode === 'bike') +
          (T.walk <= 60 || p.mode === 'walk' ? row(p.mode === 'walk', P.walk, 'Zu Fuss', T.walkR.km + ' km', T.walk, over && p.mode === 'walk') : '') +
          '</div>' + (p.kind === 'work' ? '<p class="cm-week">Pro Woche, 5 Tage hin und zurück: <b>' + fmt.min(t * 10) + '</b> ' + (p.mode === 'pt' ? 'mit dem ÖV' : p.mode === 'car' ? (p.peak ? 'mit dem Auto zur Stosszeit' : 'mit dem Auto') : p.mode === 'bike' ? 'mit dem Velo' : 'zu Fuss') + '.</p>' : '');
      } else {
        h += head + '<div class="cm">' + row(true, PMODES[p.mode].icon, esc(modeLabel(p)), Object.keys(PMODES).filter(m => m !== p.mode).map(m => PMODES[m].label + ' ' + placeTime(l, p, m, false) + ' Min.').join(' · '), t, over) + '</div>';
      }
    });
    return h + '</section>';
  }
  function detailHtml(l) {
    const saved = !!st.saved[l.id], d = fmt.delta(l), rent = l.deal === 'rent';
    const sh = shots(l);
    const slides = sh.map(x => '<div class="slide"><img src="' + SCENE.img(l, x.k) + '" alt="' + esc(l.title + ', ' + x.t) + '" draggable="false"></div>').join('') + '<div class="slide slide-plan">' + SCENE.plan(l) + '</div>';
    const fairB = d <= -1 ? '<span class="badge badge-good">' + ic(P.check, 14, 2.2) + fmt.dec(-d) + ' % unter KI-Marktwert</span>' : d >= 3 ? '<span class="badge badge-warn">' + fmt.dec(d) + ' % über KI-Marktwert</span>' : '<span class="badge badge-acc">Etwa zum KI-Marktwert</span>';
    const badges = fairB + (l.drop ? '<span class="badge badge-good">' + ic(P.drop, 14, 2.2) + 'Um CHF ' + fmt.thou(l.drop) + ' gesenkt</span>' : '') + (l.days <= 3 ? '<span class="badge badge-acc">Neu, seit ' + l.days + (l.days === 1 ? ' Tag' : ' Tagen') + '</span>' : '') + '<span class="badge badge-acc">Passt zu ' + score(l) + ' %</span>' +
      (!rent && (st.income != null || st.equity != null) ? (l.income <= (st.income == null ? Infinity : st.income) && l.equity <= (st.equity == null ? Infinity : st.equity) ? '<span class="badge badge-good">' + ic(P.check, 14, 2.2) + 'Für dich tragbar</span>' : '<span class="badge badge-warn">Über deinem Budget</span>') : '');
    const cost = rent
      ? '<p class="d-cost">CHF ' + fmt.thou(l.price) + ' Miete + CHF ' + fmt.thou(l.nk) + ' Nebenkosten.<br>Verwaltungen verlangen meist ein Einkommen ab CHF ' + fmt.thou(l.income / 12) + ' pro Monat (dreimal die Miete).</p>'
      : '<p class="d-cost">Eigenkapital ab CHF ' + fmt.thou(l.equity) + ' (20 %), Einkommen ab CHF ' + fmt.thou(l.income) + ' pro Jahr.<br>Wohnkosten heute ca. CHF ' + fmt.thou(l.monthly) + ' pro Monat: ' + fmt.dec(DATA.OWN_RATE * 100) + ' % Zins, Amortisation und Nebenkosten.</p>';
    const noisePos = clamp((l.noiseNight - 30) / 30 * 100, 0, 100);
    const lo = l.fair * 0.85, hi = l.fair * 1.15, pos = v => clamp((v - lo) / (hi - lo) * 100, 3, 97);
    const ana = '<section class="d-sec"><div class="d-sec-h"><h2>KI-Analyse</h2></div><p class="d-sub">Aus Fotos, Grundriss, Inseratstext und Geodaten berechnet.</p><div class="ana">' +
      '<div class="ana-c"><span class="ana-k">' + ic(P.sun, 15, 2) + 'Sonne</span><span class="ana-v">' + fmt.dec(l.sun) + '<small> h / Tag</small></span><span class="ana-d">Am 21. Dezember ' + fmt.dec(l.sunWinter) + ' h' + (l.eve ? ' · Abendsonne' : '') + ' · ' + (l.outdoor ? l.outdoor.t : 'Fenster') + ' nach ' + compass(l.dir) + '</span><span class="ana-src">3D-Schattenmodell, Jahresmittel</span></div>' +
      '<div class="ana-c"><span class="ana-k">' + ic(P.sound, 15, 2) + 'Ruhe</span><span class="ana-v">' + l.noiseNight + '<small> dB nachts</small></span><div><div class="meter"><i style="left:' + noisePos + '%"></i></div><div class="meter-l"><span>30 ruhig</span><span>60 laut</span></div></div><span class="ana-d">Tagsüber ' + l.noiseDay + ' dB' + (l.flight ? ' · Fluglärm aus der Anflugschneise' : ' · kein Fluglärm') + '</span><span class="ana-src">Lärmkataster Strasse und Bahn, Fluglärmkarte</span></div>' +
      '<div class="ana-c ana-wide"><span class="ana-k">' + ic(P.info, 15, 2) + 'Preis</span><span class="ana-v">' + (rent ? 'CHF ' + fmt.thou(l.fair) + '<small> netto</small>' : (l.fair / 1e6).toFixed(2) + '<small> Mio.</small>') + '</span><span class="ana-d">KI-Marktwert. Das Angebot liegt bei ' + fmt.perM2(l) + '.</span><div class="fairbar"><span class="band"></span><span class="mk" style="left:' + pos(l.fair) + '%;color:var(--muted)">Marktwert</span><span class="mk" style="left:' + pos(l.price) + '%;top:16px;flex-direction:column-reverse;color:' + (l.price <= l.fair ? 'var(--good)' : 'var(--warn)') + '">Preis</span></div><span class="ana-src">Preismodell aus vergleichbaren Inseraten aller Portale</span></div>' +
      '<div class="ana-c ana-wide"><span class="ana-k">' + ic(P.walk, 15, 2) + 'Zu Fuss erreichbar</span><div class="walks">' +
        '<div>' + ic(P.tram, 16) + 'Haltestelle<b>' + l.walk.stop + ' Min.</b></div><div>' + ic(P.cart, 16) + 'Supermarkt<b>' + l.walk.shop + ' Min.</b></div>' +
        '<div>' + ic(P.child, 16) + 'Kita<b>' + l.walk.kita + ' Min.</b></div><div>' + ic(P.school, 16) + 'Primarschule<b>' + l.walk.school + ' Min.</b></div>' +
        '<div>' + ic(P.leaf, 16) + 'Park, Wald oder See<b>' + l.walk.park + ' Min.</b></div></div><span class="ana-src">Fusswege im Wegnetz</span></div>' +
      '</div></section>';
    return '<div class="detail-scroll" id="dScroll">' +
      '<div class="gal"><div class="gal-track" id="galTrack" tabindex="0" aria-label="Bilder">' + slides + '</div>' +
        '<div class="gal-top"><button type="button" class="round" data-act="closeDetail" aria-label="Zurück zur Karte">' + ic(P.back, 20, 2) + '</button><button type="button" class="round' + (saved ? ' is-on' : '') + '" data-act="save" data-id="' + l.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? 'Gemerkt' : 'Merken') + '">' + heartIc(saved, 20) + '</button></div>' +
        '<button type="button" class="round gal-nav gal-prev" data-act="galPrev" aria-label="Vorheriges Bild">' + ic(P.chevL, 20, 2) + '</button><button type="button" class="round gal-nav gal-next" data-act="galNext" aria-label="Nächstes Bild">' + ic(P.chevR, 20, 2) + '</button>' +
        '<div class="gal-meta"><span id="galLabel">' + esc(sh[0].t) + '</span><span id="galCount">1 / ' + (sh.length + 1) + '</span></div></div>' +
      '<div class="d-head">' + (NEAR_BY.has(l.id) ? nearBHtml(NEAR_BY.get(l.id)) : '') + '<span class="d-q">' + esc(l.quarter + ' · ' + l.locality) + '</span><h1 id="dTitle">' + esc(l.title) + '</h1><span class="d-addr">' + esc(l.street) + '</span>' +
        '<div class="d-price"><b>' + esc(fmt.price(l)) + '</b><span>' + (rent ? '/ Mt. inkl. Nebenkosten' : 'Kaufpreis') + '</span></div>' + cost +
        '<div class="badges">' + badges + '</div><p class="d-ai"><span class="ki">KI</span> ' + esc(l.ai) + '</p></div>' +
      '<div class="facts"><div class="fact"><b>' + fmt.zi(l) + '</b><span>Zimmer</span></div><div class="fact"><b>' + l.m2 + ' m²</b><span>Wohnfläche</span></div>' +
        '<div class="fact"><b>' + l.baths + (l.wcSep ? ' + WC' : '') + '</b><span>' + 'Badezimmer' + '</span></div><div class="fact"><b>' + (l.floor === 0 ? 'EG' : l.floor + '. OG') + '</b><span>' + (l.kind === 'reihen' ? 'Haus, ' + l.floors + ' Etagen' : 'von ' + l.floors) + '</span></div>' +
        '<div class="fact"><b>' + l.year + '</b><span>' + (l.renov ? 'Baujahr, renoviert ' + l.renov : 'Baujahr') + '</span></div><div class="fact"><b>' + esc(DATA.availShort(l)) + '</b><span>Einzug</span></div></div>' +
      viewSecHtml(l) + glanceHtml(l) + waysHtml(l) + ana +
      '<section class="d-sec"><h2 style="margin-bottom:4px">Grundriss</h2><p class="d-sub">Schematisch, aus dem Grundriss im Inserat gelesen.</p>' + SCENE.plan(l) + '</section>' +
      '<section class="d-sec"><h2 style="margin-bottom:12px">Gut zu wissen</h2><div class="caveat">' + ic(P.info, 20, 2) + '<span>' + esc(l.caveat) + '</span></div></section>' +
      '<p class="d-foot">Auf ' + l.src + (l.src === 1 ? ' Portal' : ' Portalen') + ' gefunden, Duplikate zusammengeführt · seit ' + l.days + (l.days === 1 ? ' Tag' : ' Tagen') + ' online.<br>Prototyp mit Beispieldaten: Inserat, Preise und KI-Werte sind erfunden.</p>' +
    '</div>' +
    '<div class="detail-bar"><span class="p"><b>' + esc(fmt.price(l)) + '</b><span>' + (rent ? 'pro Monat inkl. NK' : 'Kaufpreis') + '</span></span><button type="button" class="btn-pri" data-act="visit" data-id="' + l.id + '">' + (rent ? 'Besichtigung anfragen' : 'Dokumentation anfragen') + '</button></div>';
  }
  function bindGallery(slide) {
    const track = $('#galTrack'), labels = shots(BY_ID[ui.detail]).map(x => x.t).concat(['Grundriss']);
    const show = i => { $('#galCount').textContent = (i + 1) + ' / ' + labels.length; $('#galLabel').textContent = labels[i]; };
    track.addEventListener('scroll', () => show(clamp(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)), 0, labels.length - 1)), {passive: true});
    if (slide > 0) { track.style.scrollBehavior = 'auto'; track.scrollLeft = slide * track.clientWidth; track.style.scrollBehavior = ''; show(clamp(slide, 0, labels.length - 1)); }
  }
  /* Filters, workplace or places changed while the detail is open: redraw it in place. */
  function redrawDetail() {
    if (!ui.detail) return;
    const s = $('#dScroll').scrollTop;
    $('#detail').innerHTML = detailHtml(BY_ID[ui.detail]);
    $('#dScroll').scrollTop = s;
    bindGallery();
  }
  /* slide: open the gallery at the picture that was tapped in the feed */
  function openDetail(id, slide) {
    ui.detail = id;
    ui.sel = id;
    ui.returnFocus = document.activeElement;
    const d = $('#detail');
    d.innerHTML = detailHtml(BY_ID[id]);
    d.hidden = false;
    $('#dScroll').scrollTop = 0;
    bindGallery(slide);
    requestAnimationFrame(() => { d.classList.add('is-open'); setTimeout(() => { const b = d.querySelector('[data-act="closeDetail"]'); if (b) b.focus({preventScroll: true}); }, 60); });
    renderSelection();
    if (isDesk()) panTo(BY_ID[id]);
  }
  function closeDetail() {
    const d = $('#detail');
    d.classList.remove('is-open');
    ui.detail = null;
    setTimeout(() => { if (!ui.detail) { d.hidden = true; d.innerHTML = ''; } }, 330);
    if (dr.back) { dr.back = false; openDlg('dream'); return; }
    if (ui.returnFocus && document.contains(ui.returnFocus)) ui.returnFocus.focus({preventScroll: true});
  }

  /* ---------- dialogs ---------- */
  /* A min / max pair of selects, as the portals offer it. Keys: price, rooms, area, floor, year. */
  const RANGE_STATE = {price: ['priceMin', 'priceMax'], rooms: ['roomsMin', 'roomsMax'], area: ['areaMin', 'areaMax'], floor: ['floorMin', 'floorMax'], year: ['yearMin', 'yearMax']};
  const rangeOpts = key => key === 'price' ? RANGES.price[st.deal] : RANGES[key];
  const isSet = (key, v) => key === 'floor' || key === 'price' ? v != null : !!v;
  function rangeHtml(key, title, id) {
    const [a, b] = RANGE_STATE[key], opts = rangeOpts(key), text = RANGE_TEXT[key];
    const sel = (field, which) => '<label class="sel"><span class="sel-k">' + which + '</span><select id="r-' + key + '-' + field + '" data-range="' + key + '" data-field="' + field + '">' +
      '<option value=""' + (isSet(key, st[field]) ? '' : ' selected') + '>' + (which === 'von' ? 'Egal' : 'Kein Limit') + '</option>' +
      opts.map(v => '<option value="' + v + '"' + (st[field] === v ? ' selected' : '') + '>' + text(v) + '</option>').join('') + '</select>' + ic(P.chevDown, 16, 2) + '</label>';
    return '<div class="f-sec"' + (id ? ' id="' + id + '"' : '') + '><h3>' + title + '</h3><div class="rng">' + sel(a, 'von') + sel(b, 'bis') + '</div></div>';
  }
  /* One radius in the filter sheet: around which place, how far, how many listings. */
  function circleRowHtml(c, i) {
    const n = LISTINGS.filter(l => l.deal === st.deal && inCircle(l, c)).length;
    return '<div class="pl"><div class="pl-h"><span class="pl-ic">' + ic(P.target, 18) + '</span><span class="pl-t"><b>' + fmtKm(c.km) + ' um ' + esc(c.name) + '</b><small id="fCrN' + i + '">' + n + (n === 1 ? ' Angebot' : ' Angebote') + ' darin, vor den übrigen Filtern</small></span>' +
      '<button type="button" class="x-btn" data-act="circleDel" data-id="' + i + '" aria-label="Umkreis um ' + esc(c.name) + ' entfernen">' + ic(P.close, 16, 2) + '</button></div>' +
      '<div class="f-row"><label for="fCr' + i + '" class="muted" style="font-size:13px">Radius</label><output id="fCrV' + i + '" for="fCr' + i + '">' + crOut(c.km, RES.length) + '</output></div>' +
      '<input type="range" id="fCr' + i + '" data-cr="' + i + '" min="0.5" max="10" step="0.5" value="' + c.km + '"></div>';
  }
  /* One place in the filter sheet: where, how (with rush hour for the car) and the limit. */
  function placeRowHtml(p, i) {
    const work = p.kind === 'work', lim = p.max == null ? 65 : p.max;
    return '<div class="pl' + (work ? ' pl-work' : '') + '"><div class="pl-h"><span class="pl-ic">' + ic(work ? P.brief : P.pin, 18) + '</span><span class="pl-t"><b>' + esc(work ? 'Arbeit' : p.name) + '</b><small>' + esc(work ? p.sub + (p.example ? ' · Beispiel, wähle deinen Arbeitsort' : '') : p.sub) + '</small></span>' +
        (work ? '<button type="button" class="pl-chg" data-act="placeChange" data-id="' + i + '">Ändern</button>' : '') +
        '<button type="button" class="x-btn" data-act="placeDel" data-id="' + i + '" aria-label="' + esc(work ? 'Arbeitsort' : p.name) + ' entfernen">' + ic(P.close, 16, 2) + '</button></div>' +
      '<div class="seg" role="group" aria-label="Unterwegs mit">' + Object.keys(PMODES).map(m => '<button type="button" data-act="placeMode" data-id="' + i + '" data-v="' + m + '" aria-pressed="' + (p.mode === m) + '">' + ic(PMODES[m].icon, 15) + PMODES[m].label + '</button>').join('') + '</div>' +
      (p.mode === 'car' ? '<button type="button" class="tg pl-peak" data-act="placePeak" data-id="' + i + '" aria-pressed="' + !!p.peak + '"><span class="tg-t"><span class="tg-l">Zur Stosszeit</span><span class="tg-h">7–8.30 und 16.30–18.30 Uhr, mit Stau und Parkplatzsuche</span></span><span class="sw" aria-hidden="true"></span></button>' : '') +
      '<div class="f-row"><label for="fPl' + i + '" class="muted" style="font-size:13px">Höchstens</label><output id="fPlV' + i + '" for="fPl' + i + '">' + plOut(p.max, RES.length) + '</output></div>' +
      '<input type="range" id="fPl' + i + '" data-pl="' + i + '" min="5" max="65" step="5" value="' + lim + '"></div>';
  }
  /* A filter switch with its live count. */
  function toggleHtml(f) {
    if (f.deal && f.deal !== st.deal) return '';
    const on = !!st.active[f.id], n = on ? RES.length : countWith(f.id);
    return '<button type="button" class="tg" data-act="toggleF" data-id="' + f.id + '" aria-pressed="' + on + '"' + (!n && !on && !LISTINGS.some(x => x.deal === st.deal && f.test(x)) ? ' disabled' : '') + '><span class="tg-t"><span class="tg-l">' + esc(f.label) + (f.ki ? '<span class="ki">KI</span>' : '') + '</span><span class="tg-h">' + esc(f.hint) + ' · ' + esc(f.src) + '</span></span><span class="tg-n" aria-label="' + n + ' Treffer">' + n + '</span><span class="sw" aria-hidden="true"></span></button>';
  }
  function levelHtml(v) {
    return '<div class="lvl"><span class="lvl-k">' + v.t + '</span><div class="seg seg-c" role="group" aria-label="' + v.t + '">' + v.opts.map(([val, t]) => {
      const cur = st[v.key] === val, n = cur ? RES.length : countWithState({[v.key]: val});
      return '<button type="button" data-act="vlevel" data-id="' + v.key + '" data-v="' + val + '" aria-pressed="' + cur + '"' + (!n && !cur && !LISTINGS.some(x => x.deal === st.deal && VV[v.key](x) >= val) ? ' disabled' : '') + '>' + t + (val ? '<span class="seg-n">' + n + '</span>' : '') + '</button>';
    }).join('') + '</div></div>';
  }
  /* The view block: a wish in plain words, the overall score, then what you see, how free it is, when and from
     where, and whether the listing tells the truth about it. */
  const VSUB = [['see', 'Was du sehen willst'], ['frei', 'Wie frei'], ['wann', 'Wann und von wo'], ['check', 'Inserat-Check']];
  function viewFilterHtml() {
    const anyV = st.viewMin || VLEVELS.some(v => st[v.key]) || FILTERS.some(f => f.g === 'aussicht' && st.active[f.id]);
    let h = '<div class="f-sec vf" id="fViewSec"><div class="vf-h"><h3>Aussicht</h3>' + (anyV ? '<button type="button" class="vf-reset" data-act="resetView">Aussicht zurücksetzen</button>' : '') + '</div>' +
      '<p class="f-note">Gerechnet ab deinem Fenster: Sichtanalyse auf 3D-Stadtmodell, Gelände und LiDAR-Daten von swisstopo, dazu der Zonenplan. Ein Bild- und Sprachmodell prüft, was Inserat und Fotos versprechen.</p>';
    h += '<div class="ai-q"><label for="fAiQ" class="ai-l"><span class="ki">KI</span>Beschreibe deine Wunschaussicht</label>' +
      '<div class="ai-row"><input id="fAiQ" type="text" autocomplete="off" enterkeyhint="search" placeholder="z. B. Seeblick vom Sofa, niemand schaut rein" value="' + esc(st.aiQ) + '"><button type="button" class="ai-go" data-act="aiView">Anwenden</button></div>' +
      (ui.aiMsg ? '<p class="ai-out" role="status">' + ui.aiMsg + '</p>' : '') +
      '<div class="ai-ex">' + AI_EXAMPLES.map(x => '<button type="button" data-act="aiEx" data-v="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>' +
      '<p class="ai-note">Im Prototyp liest eine einfache Wortregel deine Eingabe, im Produkt ein Sprachmodell.</p></div>';
    h += '<div class="f-row"><label for="fView" class="muted" style="font-size:13px">Gesamtnote ab</label><output id="fViewV" for="fView">' + (st.viewMin ? fmt.dec(st.viewMin) + ' / 10' : 'Egal') + '</output></div>' +
      '<input type="range" id="fView" min="0" max="9" step="0.5" value="' + st.viewMin + '">';
    for (const [sub, title] of VSUB) {
      h += '<div class="vf-sub"><h4>' + title + '</h4>';
      if (sub === 'see') h += levelHtml(VLEVELS[0]) + levelHtml(VLEVELS[1]);
      if (sub === 'frei') h += levelHtml(VLEVELS[2]) + levelHtml(VLEVELS[3]);
      h += '<div>' + FILTERS.filter(f => f.g === 'aussicht' && f.sub === sub).map(toggleHtml).join('') + '</div></div>';
    }
    return h + '</div>';
  }
  function filtersHtml() {
    let h = '<div class="dlg-h"><div><h2 id="dlgTitle">Filter</h2><p>Alles, was die grossen Portale filtern, und dazu, was nur die KI aus Fotos, Grundrissen, Inseratstexten und Geodaten liest. Die Zahl zeigt, wie viele Angebote übrig bleiben.</p></div><button type="button" class="x-btn" data-act="closeDlg" aria-label="Schliessen">' + ic(P.close, 18, 2) + '</button></div><div class="dlg-b" id="dlgBody">';
    h += '<nav class="jump" aria-label="Zu einem Abschnitt springen">' + [['fAreaSec', 'Suchgebiet'], ['fPlaceSec', 'Wegzeit'], ['fViewSec', 'Aussicht'], ['fg-alltag', 'Im Alltag'], ['fg-wohl', 'Wohnqualität'], ['fg-umgebung', 'Umgebung'], ['fg-weitere', 'Weitere']]
      .map(([id, t]) => '<button type="button" data-act="jump" data-v="' + id + '">' + t + '</button>').join('') + '</nav>';
    h += '<div class="f-sec"><h3>Angebot</h3><div class="seg"><button type="button" data-act="deal" data-v="rent" aria-pressed="' + (st.deal === 'rent') + '">Mieten</button><button type="button" data-act="deal" data-v="buy" aria-pressed="' + (st.deal === 'buy') + '">Kaufen</button></div></div>';
    /* Where: draw areas, a radius around a place, and how far work and other places may be. */
    h += '<div class="f-sec" id="fAreaSec"><h3>Suchgebiet</h3><p class="f-note">Wo du suchst: Gebiete auf der Karte zeichnen, einen Umkreis um einen Ort ziehen, und festlegen, wie weit es zur Arbeit und zu anderen Orten sein darf.</p>';
    h += '<div class="vf-sub"><h4>Gezeichnete Gebiete</h4>' + (st.areas.length
      ? '<div>' + st.areas.map((a, i) => { const n = LISTINGS.filter(l => l.deal === st.deal && GEO.inPoly(l.x, l.y, a)).length; return '<div class="area-row"><span class="area-ic">' + ic(P.lasso, 18, 2) + '</span><span class="area-t"><b>Gebiet ' + (i + 1) + '</b><small>' + n + (n === 1 ? ' Angebot' : ' Angebote') + ' darin, vor den übrigen Filtern</small></span><button type="button" class="x-btn" data-act="delArea" data-id="' + i + '" aria-label="Gebiet ' + (i + 1) + ' entfernen">' + ic(P.close, 16, 2) + '</button></div>'; }).join('') + '</div>'
      : '<p class="f-note">Ein Stück Seeufer, dein Lieblingsquartier oder die Strassen rund um die Schule.</p>') +
      '<button type="button" class="btn-sec" data-act="drawFromFilters" style="align-self:flex-start">' + ic(P.lasso, 18, 2) + (st.areas.length ? 'Weiteres Gebiet zeichnen' : 'Auf der Karte zeichnen') + '</button></div>';
    h += '<div class="vf-sub" id="fCircSec"><h4>Umkreis</h4>' + (st.circles.length ? st.circles.map(circleRowHtml).join('') : '<p class="f-note">Ein Radius um einen Ort, wie auf den grossen Portalen: zum Beispiel 2 km um Zürich HB.</p>');
    if (st.circles.length < 4) {
      const wk = st.places.find(p => p.kind === 'work');
      h += '<div class="seg">' + ['hb', 'para'].filter(id => !st.circles.some(c => c.id === id)).map(id => GEO.PLACES.find(p => p.id === id)).map(p => '<button type="button" data-act="circleQuick" data-id="' + p.id + '">' + ic(P.plus, 15, 2) + '2 km um ' + esc(p.name) + '</button>').join('') +
        (wk && !st.circles.some(c => c.id === 'work') ? '<button type="button" data-act="circleWork">' + ic(P.brief, 15, 2) + '3 km um die Arbeit</button>' : '') +
        '<button type="button" data-act="circleAdd">' + ic(P.search, 15, 2) + 'Anderer Mittelpunkt</button></div>';
    }
    h += '</div>';
    /* Travel time: work first (set from the start), then any place that matters, each with its own way and limit. */
    h += '<div class="vf-sub" id="fPlaceSec"><h4>Wegzeit</h4><p class="f-note">Wie lange du von der Wohnung zur Arbeit brauchst, und zu jedem Ort, der dir wichtig ist. Mit einem Limit filtert der Ort, ohne Limit zeigt er nur die Zeit.</p>';
    st.places.forEach((p, i) => { h += placeRowHtml(p, i); });
    if (st.places.length < 4) {
      const quick = ['hb', 'airport'].filter(id => !st.places.some(p => p.id === id && p.kind !== 'work')).map(id => GEO.PLACES.find(p => p.id === id));
      h += '<div class="seg">' + (st.places.some(p => p.kind === 'work') ? '' : '<button type="button" data-act="placeAddWork">' + ic(P.brief, 15, 2) + 'Arbeitsort</button>') +
        quick.map(p => '<button type="button" data-act="placeQuick" data-id="' + p.id + '">' + ic(P.plus, 15, 2) + esc(p.name) + '</button>').join('') +
        '<button type="button" data-act="placeAdd">' + ic(P.search, 15, 2) + 'Anderer Ort</button></div>';
    }
    h += '</div></div>';
    h += '<div class="f-sec"><h3>Objektart</h3><div class="seg" role="group" aria-label="Objektart, mehrere möglich">' + DATA.TYPES.map(t => '<button type="button" data-act="type" data-v="' + t.id + '" aria-pressed="' + !!st.types[t.id] + '">' + t.t + '</button>').join('') + '</div></div>';
    h += rangeHtml('price', st.deal === 'rent' ? 'Miete pro Monat, inkl. Nebenkosten' : 'Kaufpreis');
    if (st.deal === 'buy') {
      const money = (id, label, v, ph) => '<label class="money" for="' + id + '"><span>' + label + '</span><span class="money-in"><span>CHF</span><input id="' + id + '" inputmode="numeric" enterkeyhint="done" autocomplete="off" placeholder="' + ph + '" value="' + (v == null ? '' : fmt.thou(v)) + '"></span></label>';
      h += '<div class="f-sec" id="fAffSec"><h3>Tragbarkeit</h3><div class="money-row">' + money('fInc', 'Einkommen pro Jahr', st.income, 'z. B. 180’000') + money('fEq', 'Eigenkapital', st.equity, 'z. B. 300’000') + '</div><p class="f-note" id="fAfford">' + affordNote() + '</p></div>';
    }
    h += rangeHtml('rooms', 'Zimmer') + rangeHtml('area', 'Wohnfläche');
    h += '<div class="f-sec"><h3>Badezimmer</h3><div class="seg">' + [[0, 'Egal'], [1, '1+'], [2, '2+'], [3, '3+']].map(([v, t]) => '<button type="button" data-act="baths" data-v="' + v + '" aria-pressed="' + (st.baths === v) + '">' + t + '</button>').join('') + '</div>' +
      '<p class="f-note">Gezählt werden ganze Bäder mit Dusche oder Wanne. Ein separates WC findest du unter Wohnqualität.</p></div>';
    h += rangeHtml('floor', 'Etage') + rangeHtml('year', 'Baujahr');
    h += '<div class="f-sec"><h3>Online seit</h3><div class="seg">' + SINCE.map(([v, t]) => '<button type="button" data-act="since" data-v="' + v + '" aria-pressed="' + (st.since === v) + '">' + t + '</button>').join('') + '</div></div>';
    h += '<div class="f-sec"><h3>Einzug spätestens</h3><div class="seg">' + MOVE.map(([v, t]) => '<button type="button" data-act="move" data-v="' + v + '" aria-pressed="' + (st.moveBy === v) + '">' + t + '</button>').join('') + '</div>' +
      (st.moveBy !== 'any' ? '<p class="f-note">Angebote mit Einzug «nach Vereinbarung» bleiben drin.</p>' : '') + '</div>';
    for (const g of GROUPS) {
      if (g.id === 'aussicht') { h += viewFilterHtml(); continue; }
      h += '<div class="f-sec" id="fg-' + g.id + '"><h3>' + g.t + '</h3><div>' + FILTERS.filter(x => x.g === g.id).map(toggleHtml).join('') + '</div></div>';
    }
    h += '</div><div class="dlg-f"><button type="button" class="btn-sec" data-act="resetFilters">Zurücksetzen</button><button type="button" class="btn-pri" data-act="closeDlg" id="fShow">' + showText(RES.length) + '</button></div>';
    return h;
  }
  /* One picker for every place. For work it sets or moves the workplace (ui.placeKind, ui.placeIdx). */
  function workList() {
    const q = norm(ui.workQ.trim()), work = ui.placeKind === 'work', cur = ui.placeIdx >= 0 ? st.places[ui.placeIdx] : null;
    const list = GEO.PLACES.filter(p => (!q || norm(p.name + ' ' + p.sub).includes(q)) && (work || ui.placeKind === 'circle' || !st.places.some(x => x.id === p.id && x.kind !== 'work')));
    if (!list.length) return '<p class="f-note" style="padding:12px 4px">Kein Ort gefunden. Wähle den Ort direkt auf der Karte.</p>';
    return list.map(p => {
      const on = !!cur && cur.id === p.id && !cur.example;
      return '<button type="button" class="w-row" data-act="pickPlace" data-id="' + p.id + '" aria-pressed="' + on + '">' + ic(P.pin, 20) + '<span><b>' + esc(p.name) + '</b><small>' + esc(p.sub) + '</small></span>' + (on ? ic(P.check, 20, 2.2) : '') + '</button>';
    }).join('');
  }
  function placeHtml() {
    const work = ui.placeKind === 'work';
    return '<div class="dlg-h"><button type="button" class="x-btn" data-act="placeBack" aria-label="' + (ui.placeReturn === 'filters' ? 'Zurück zu den Filtern' : 'Schliessen') + '">' + ic(P.chevL, 20, 2.2) + '</button>' +
      '<div style="flex:1;min-width:0"><h2 id="dlgTitle">' + (work ? 'Arbeitsort wählen' : ui.placeKind === 'circle' ? 'Mittelpunkt für den Umkreis' : 'Ort hinzufügen') + '</h2><p>' + (ui.placeKind === 'circle' ? 'Um welchen Ort soll der Umkreis gehen? Den Radius stellst du danach ein.' : work ? 'Wir rechnen für jede Wohnung den Weg zur Arbeit: mit ÖV, Velo, zu Fuss und mit dem Auto, auf Wunsch zur Stosszeit.' : 'Ein Ort, zu dem du es nicht weit haben willst: Bahnhof, Familie, Schule oder Sportclub. Die Wegzeit legst du danach fest.') + '</p></div></div>' +
      '<div class="dlg-b" id="dlgBody"><div class="f-sec"><label class="fld"><span class="sr">Ort suchen</span>' + ic(P.search, 18) + '<input id="wq" type="search" placeholder="Ort, Quartier oder Bahnhof" value="' + esc(ui.workQ) + '" autocomplete="off"></label>' +
        '<div class="w-list" id="wList">' + workList() + '</div>' +
        '<button type="button" class="btn-sec" data-act="pickOnMap" style="align-self:flex-start;margin-top:6px">' + ic(P.target, 18) + 'Auf der Karte wählen</button></div></div>' +
      '<div class="dlg-f"><button type="button" class="btn-pri" data-act="placeBack">' + (ui.placeReturn === 'filters' ? 'Zurück zu den Filtern' : 'Fertig') + '</button></div>';
  }
  /* Set a place from the list or the map: replace the one being changed, or add a new one (work goes first). */
  function applyPlacePick(base) {
    if (ui.placeKind === 'circle') {
      if (st.circles.length >= 4) { toast('Höchstens vier Umkreise'); return false; }
      st.circles.push({id: base.id, name: base.short || SHORT[base.id] || base.name, x: +base.x, y: +base.y, km: 2});
      return true;
    }
    const work = ui.placeKind === 'work', idx = ui.placeIdx;
    const loc = work ? {id: base.id, kind: 'work', name: 'Arbeit', short: 'Arbeit', sub: base.workSub || base.name, x: base.x, y: base.y, example: false}
      : {id: base.id, kind: 'other', name: base.name, short: base.short, sub: base.sub, x: base.x, y: base.y};
    if (idx >= 0 && st.places[idx]) { Object.assign(st.places[idx], loc); return true; }
    if (st.places.length >= 4) { toast('Höchstens vier Orte'); return false; }
    const np = Object.assign({mode: 'pt', peak: false, max: work ? null : 20}, loc);
    if (work) st.places.unshift(np); else st.places.push(np);
    return true;
  }
  function openPlacePicker(kind, idx, fromFilters) {
    ui.workQ = ''; ui.placeKind = kind; ui.placeIdx = idx; ui.placeReturn = fromFilters ? 'filters' : null;
    if (ui.dlg) { ui.dlg = 'place'; renderDlg(false); $('#dlgPanel').focus({preventScroll: true}); } else openDlg('place');
  }
  const placeDone = () => { if (ui.placeReturn === 'filters') backToFilters('fPlaceSec'); else closeDlg(); };
  function scrollDlgTo(id) {
    const sec = document.getElementById(id), body = $('#dlgBody');
    if (sec && body) body.scrollTop = Math.max(0, sec.offsetTop - body.offsetTop - 12);
  }
  /* A picker opened from the filter sheet returns there, scrolled to its section. */
  function backToFilters(secId) {
    ui.placeReturn = null; ui.placeKind = 'other'; ui.placeIdx = -1;
    ui.dlg = 'filters';
    renderDlg(false);
    scrollDlgTo(secId || 'fPlaceSec');
    $('#dlgPanel').focus({preventScroll: true});
  }
  function savedHtml() {
    const ids = Object.keys(st.saved).sort((a, b) => st.saved[a] - st.saved[b]).filter(id => BY_ID[id]);
    let h = '<div class="dlg-h"><div><h2 id="dlgTitle">Gemerkt</h2><p>' + (ids.length ? ids.length + (ids.length === 1 ? ' Angebot' : ' Angebote') + ' auf diesem Gerät gespeichert.' : 'Tippe auf das Herz bei einem Angebot, um es hier zu sammeln.') + '</p></div><button type="button" class="x-btn" data-act="closeDlg" aria-label="Schliessen">' + ic(P.close, 18, 2) + '</button></div><div class="dlg-b" id="dlgBody">';
    if (!ids.length) return h + '<div class="empty"><span class="empty-ic">' + heartIc(false, 22) + '</span><b>Noch nichts gemerkt</b><p>Gemerkte Angebote kannst du hier nebeneinander vergleichen: Preis, Wegzeit, Aussicht, Sonne und Ruhe.</p></div></div>';
    h += '<div class="seg"><button type="button" data-act="savedTab" data-v="list" aria-pressed="' + (ui.savedTab === 'list') + '">' + ic(P.list, 16) + 'Liste</button><button type="button" data-act="savedTab" data-v="compare" aria-pressed="' + (ui.savedTab === 'compare') + '">' + ic(P.compare, 16) + 'Vergleichen</button></div>';
    if (ui.savedTab === 'list') {
      h += '<div>' + ids.map(id => {
        const l = BY_ID[id];
        return '<div class="s-row"><img src="' + SCENE.img(l, 'view:day') + '" alt=""><button type="button" class="s-open" data-act="openSaved1" data-id="' + id + '"><b class="trunc">' + esc(l.title) + '</b><span>' + esc(fmt.price(l)) + (l.deal === 'rent' ? ' / Mt. inkl. NK' : '') + ' · ' + fmt.zi(l) + ' Zi. · ' + l.m2 + ' m²</span>' + (st.places.length ? '<span>' + st.places.slice(0, 2).map(p => (p.kind === 'work' ? 'Arbeit' : shortName(p)) + ' ' + placeTime(l, p) + ' Min.').join(' · ') + '</span>' : '') + '</button><button type="button" class="x-btn" data-act="save" data-id="' + id + '" aria-label="Entfernen" style="color:var(--heart)">' + heartIc(true, 18) + '</button></div>';
      }).join('') + '</div>';
    } else {
      const L = ids.slice(-3).map(id => BY_ID[id]);
      /* Rows in the order people decide: cost, space, move-in, commute, the everyday needs, then quality. */
      const mixed = new Set(L.map(l => l.deal)).size > 1, anyBuy = L.some(l => l.deal === 'buy');
      const rows = [
        {k: 'Preis', v: l => l.gross, best: mixed ? null : 'min', s: l => fmt.price(l) + (l.deal === 'rent' ? ' inkl. NK' : '')},
        {k: 'Wohnkosten pro Monat', v: l => l.monthly, best: 'min', s: l => 'CHF ' + fmt.thou(l.monthly) + (l.deal === 'buy' ? ' (geschätzt)' : ''), when: anyBuy},
        {k: 'Zimmer', v: l => l.rooms, best: 'max', s: l => fmt.zi(l)},
        {k: 'Fläche', v: l => l.m2, best: 'max', s: l => l.m2 + ' m²'},
        {k: 'Badezimmer', v: l => l.baths + (l.wcSep ? 0.5 : 0), best: 'max', s: l => l.baths + (l.wcSep ? ' + WC' : '')},
        {k: 'Aussicht', v: l => l.view, best: 'max', s: l => fmt.dec(l.view) + ' / 10'},
        {k: 'Einzug', v: () => 0, best: null, s: l => DATA.availShort(l)},
      ].concat(st.places.map(p => ({k: (p.kind === 'work' ? 'Arbeit' : shortName(p)) + ', ' + modeLabel(p), v: l => placeTime(l, p), best: 'min', s: l => placeTime(l, p) + ' Min.'})), [
        {k: 'Waschmaschine', v: l => l.wm ? 1 : 0, best: 'max', s: l => l.wm ? 'Eigene' : 'Waschküche'},
        {k: 'Aussenraum', v: l => l.outdoor ? l.outdoor.m2 : 0, best: 'max', s: l => l.outdoor ? l.outdoor.t + ' ' + l.outdoor.m2 + ' m²' : 'Keiner'},
        {k: 'Garten', v: l => l.garden ? 2 : l.gardenShared ? 1 : 0, best: 'max', s: l => l.garden ? 'Eigener, ' + l.outdoor.m2 + ' m²' : l.gardenShared ? 'Zum Mitbenutzen' : 'Keiner'},
        {k: 'Lift', v: l => l.lift || l.floor === 0 ? 1 : 0, best: 'max', s: l => l.floor === 0 ? 'Erdgeschoss' : l.lift ? 'Ja, ' + fmt.floor(l) : 'Nein, ' + fmt.floor(l)},
        {k: 'Zustand', v: l => l.renovated ? 1 : 0, best: 'max', s: l => l.isNew ? 'Neubau ' + l.year : l.renov ? 'Renoviert ' + l.renov : 'Baujahr ' + l.year},
        {k: 'Lärm nachts', v: l => l.noiseNight, best: 'min', s: l => l.noiseNight + ' dB' + (l.flight ? ', Fluglärm' : '')},
        {k: 'Sonne pro Tag', v: l => l.sun, best: 'max', s: l => fmt.dec(l.sun) + ' h'},
        {k: 'Zum Marktwert', v: l => fmt.delta(l), best: 'min', s: l => (fmt.delta(l) > 0 ? '+' : '') + fmt.dec(fmt.delta(l)) + ' %'}
      ]).filter(r => r.when !== false);
      h += '<p class="f-note">' + (ids.length > 3 ? 'Die drei zuletzt gemerkten Angebote. ' : '') + 'Grün ist jeweils der beste Wert.</p><div class="cmp-wrap"><table class="cmp"><thead><tr><th></th>' + L.map(l => '<th scope="col"><img src="' + SCENE.img(l, 'view:day') + '" alt="">' + esc(l.title) + '</th>').join('') + '</tr></thead><tbody>' +
        rows.map(r => {
          const vals = L.map(r.v), b = r.best === 'min' ? Math.min(...vals) : Math.max(...vals);
          return '<tr><th scope="row">' + esc(r.k) + '</th>' + L.map((l, i) => '<td' + (r.best && L.length > 1 && vals[i] === b ? ' class="best"' : '') + '>' + esc(r.s(l)) + '</td>').join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
    }
    return h + '</div>';
  }
  function visitHtml() {
    const l = BY_ID[ui.visitId], rent = l.deal === 'rent';
    let h = '<div class="dlg-h"><div><h2 id="dlgTitle">' + (rent ? 'Besichtigung anfragen' : 'Dokumentation anfragen') + '</h2><p>' + esc(l.title) + ' · ' + esc(l.street) + '</p></div><button type="button" class="x-btn" data-act="closeDlg" aria-label="Schliessen">' + ic(P.close, 18, 2) + '</button></div><div class="dlg-b" id="dlgBody">';
    if (ui.visitDone) {
      return h + '<div class="ok">' + ic(P.check, 26, 2.2) + '<b>Anfrage vorbereitet</b><p>In der echten App ginge sie jetzt an die Verwaltung. Dies ist ein Prototyp: es wurde nichts verschickt und nichts gespeichert.</p></div></div><div class="dlg-f"><button type="button" class="btn-pri" data-act="closeDlg">Fertig</button></div>';
    }
    const msg = 'Guten Tag\n\nIch interessiere mich für ' + (rent ? 'die ' : 'das Objekt ') + fmt.zi(l) + '-Zimmer-' + (l.kind === 'reihen' ? 'Haus' : 'Wohnung') + ' an der ' + l.street + ' und würde ' + (rent ? 'sie gerne besichtigen' : 'gerne die Verkaufsdokumentation erhalten') + '.\n\nFreundliche Grüsse';
    h += '<form class="form" id="visitForm" novalidate><label for="vName">Name<input id="vName" name="name" autocomplete="name" required></label><label for="vMail">E-Mail<input id="vMail" name="email" type="email" autocomplete="email" required></label>' +
      (rent ? '<div class="f-sec"><h3>Wann passt es dir?</h3><div class="seg">' + ['Mo ab 17 Uhr', 'Di ab 17 Uhr', 'Mi ab 17 Uhr', 'Sa Vormittag'].map((t, i) => '<button type="button" data-act="slot" data-v="' + i + '" aria-pressed="' + !!(ui.slots && ui.slots[i]) + '">' + t + '</button>').join('') + '</div></div>' : '') +
      '<label for="vMsg">Nachricht<textarea id="vMsg" name="msg">' + esc(msg) + '</textarea></label><p class="f-note" id="vErr" role="alert"></p></form></div>' +
      '<div class="dlg-f"><button type="submit" form="visitForm" class="btn-pri">Anfrage vorbereiten</button></div>';
    return h;
  }
  /* Nothing fits all criteria: say so once in a popup, then the near matches carry the list. */
  function checkZero() {
    if (RES.length) { ui.zeroSeen = false; return; }
    if (ui.zeroSeen || !NEAR.length || ui.dlg || ui.detail || ui.draw || ui.pick) return;
    ui.zeroSeen = true;
    openDlg('nomatch');
  }
  function nomatchHtml() {
    const C = criteria(), own = LISTINGS.filter(l => l.deal === st.deal), N = NEAR.length, k = C.length, rent = st.deal === 'rent';
    let blk = null;
    for (const c of C) { const m = own.filter(c.ok).length; if (!blk || m < blk.m) blk = {c, m}; }
    const best = blk && blk.c.best ? ' ' + blk.c.best() : '';
    ui.fixes = fixOptions();
    let h = '<div class="pop"><button type="button" class="x-btn pop-x" data-act="closeDlg" aria-label="Schliessen">' + ic(P.close, 18, 2) + '</button>' +
      '<h2 id="dlgTitle">Kein Angebot erfüllt ' + critTxt(k) + '</h2>' +
      '<p>Wir zeigen dir stattdessen ' + (N === 1 ? 'das eine, das' : 'die ' + N + ', die') + ' am meisten davon erfüllen. Preis, Zimmer, Gebiet und Weg zählen dabei mehr als Extras.</p>';
    if (blk) h += '<p class="pop-why">' + ic(P.info, 16, 2.2) + '<span>' + (blk.m === 0 ? (rent ? 'Keine Wohnung' : 'Kein Objekt') + ' erfüllt ' + (k > 1 ? 'schon allein ' : '') + '<b>' + esc(blk.c.label) + '</b>.' :
      'Am meisten schränkt <b>' + esc(blk.c.label) + '</b> ein: Das erfüllen allein nur ' + blk.m + (blk.m === 1 ? ' Angebot.' : ' Angebote.')) + esc(best) + '</span></p>';
    if (ui.fixes.length) h += '<div class="pop-fix"><span class="pop-k">Mit einer Änderung wieder Treffer</span><div class="relax">' + ui.fixes.map((f, i) => '<button type="button" data-act="fix" data-v="' + i + '"><span>' + esc(f.label) + '</span><b>' + f.n + (f.n === 1 ? ' Angebot' : ' Angebote') + '</b></button>').join('') + '</div></div>';
    else h += '<div class="pop-fix"><span class="pop-k">Keine einzelne Änderung reicht</span><div class="relax"><button type="button" data-act="nmReset"><span>Alle Filter zurücksetzen</span><b>' + LISTINGS.filter(l => l.deal === st.deal).length + ' Angebote</b></button></div></div>';
    return h + '<div class="pop-f"><button type="button" class="btn-pri" data-act="closeDlg">' + (N === 1 ? 'Das ähnliche Angebot ansehen' : N + ' ähnliche ansehen') + '</button><button type="button" class="pop-lnk" data-act="nmFilters">Filter selbst anpassen</button></div></div>';
  }
  /* ---------- "Beschreib deine Traumwohnung" ----------
     Claude reads the description (dream.js) and the criteria become controls: sliders for price, area, rooms and travel
     time, a switch for the place and a Muss or Wunsch switch per feature. Every change checks all listings again: the
     list follows at once, and each control shows how many listings its next step adds or takes away. Each row says
     what fits and what doesn't. "Auf der Karte zeigen" makes the result the search on the map. */
  const drClone = c => Object.assign({}, c, {places: c.places.slice(), features: c.features.map(f => Object.assign({}, f)), commute: c.commute.map(q => Object.assign({}, q))});
  const drFits = c => DREAM.match(c).exact.length;
  const drFxText = d => d > 0 ? '+' + d : d < 0 ? '−' + -d : '±0';
  const drFxClass = d => 'dr-fx ' + (d > 0 ? 'is-up' : d < 0 ? 'is-down' : 'is-same');
  const drZi = v => String(v).replace('.5', '½');
  /* every slider has a loose end where the criterion falls away and it reads "Egal" */
  function drSliderDefs(c) {
    const buy = c.deal === 'buy', top = buy ? 5000000 : 10000, step = buy ? 50000 : 100, low = buy ? 300000 : 1000;
    const defs = [
      {key: 'price', label: buy ? 'Kaufpreis' : 'Miete pro Monat', min: Math.min(low, c.priceMax || low), max: Math.max(top, (c.priceMax || 0) + step), step, jump: buy ? 100000 : 200, off: 'max',
        down: buy ? '−100’000' : '−200', up: buy ? '+100’000' : '+200', get: s => s.priceMax, set: (s, v) => { s.priceMax = v; }, text: v => 'bis ' + DREAM.money(v, c.deal)},
      {key: 'area', label: 'Wohnfläche', min: 30, max: Math.max(180, c.areaMin || 0), step: 5, jump: 10, off: 'min', down: '−10', up: '+10', get: s => s.areaMin, set: (s, v) => { s.areaMin = v; }, text: v => 'ab ' + v + ' m²'},
      {key: 'rooms', label: 'Zimmer', min: 1, max: Math.max(5.5, c.roomsMin || 0), step: 0.5, jump: 0.5, off: 'min', down: '−½', up: '+½', get: s => s.roomsMin, set: (s, v) => { s.roomsMin = v; }, text: v => 'ab ' + drZi(v)}
    ];
    for (const q of c.commute) {
      const find = s => s.commute.find(x => x.to === q.to && x.mode === q.mode), t = GEO.PLACES.find(p => p.id === q.to);
      defs.push({key: 'to-' + q.to + '-' + q.mode, label: 'Zu ' + (t ? t.name : q.to) + ' ' + DREAM.MODES[q.mode], min: 5, max: Math.max(120, q.max + 5), step: 5, jump: 5, off: 'max', down: '−5', up: '+5',
        get: s => { const x = find(s); return x ? x.max : null; },
        set: (s, v) => { const x = find(s); if (v === null) s.commute = s.commute.filter(y => y !== x); else if (x) x.max = v; else s.commute.push({to: q.to, mode: q.mode, max: v}); },
        text: v => 'höchstens ' + v + ' Min.'});
    }
    return defs;
  }
  function drSwitchDefs(c) {
    const defs = [];
    if (c.places.length) defs.push({key: 'places', label: c.places.map(DREAM.PLACE_NAME).join(' oder '), onName: 'Nur hier', offName: 'Schweiz', toOn: 'nur hier', toOff: 'in der ganzen Schweiz',
      on: s => s.places.length > 0, flip: s => { s.places = s.places.length ? [] : c.places.slice(); }});
    for (const x of c.features) defs.push({key: 'f-' + x.id, label: DATA.byId[x.id].label, onName: 'Muss', offName: 'Wunsch', toOn: 'als Muss', toOff: 'als Wunsch',
      on: s => s.features.find(f => f.id === x.id).must, flip: s => { const f = s.features.find(y => y.id === x.id); f.must = !f.must; }});
    if (c.lake) defs.push({key: 'lake', label: ['', 'Seeblick', 'Breiter Seeblick', 'Seepanorama'][c.lake], onName: 'Muss', offName: 'Egal', toOn: 'als Muss', toOff: 'weglassen', on: s => !!s.lake, flip: s => { s.lake = s.lake ? 0 : c.lake; }});
    return defs;
  }
  function drSlider(d, box) {
    const el = document.createElement('div'), id = 'drR-' + d.key;
    el.className = 'dr-sl';
    el.innerHTML = '<div class="dr-sl-h"><label for="' + id + '">' + esc(d.label) + '</label><output for="' + id + '"></output></div><div class="dr-sl-c">' +
      '<button class="dr-stp" type="button"><span>' + d.down + '</span><span class="dr-fx is-same">…</span></button>' +
      '<input type="range" id="' + id + '" min="' + d.min + '" max="' + d.max + '" step="' + d.step + '">' +
      '<button class="dr-stp" type="button"><span>' + d.up + '</span><span class="dr-fx is-same">…</span></button></div>';
    box.appendChild(el);
    const input = el.querySelector('input'), out = el.querySelector('output'), [minus, plus] = el.querySelectorAll('.dr-stp');
    const offAt = d.off === 'max' ? d.max : d.min, lim = v => clamp(v, d.min, d.max);
    const pos = () => { const v = d.get(dr.cur); return v === null || v === undefined ? offAt : v; };
    const write = (s, v) => d.set(s, v === offAt ? null : v);
    const paint = () => {
      const v = pos(), text = v === offAt ? 'Egal' : d.text(v);
      input.value = v;
      input.setAttribute('aria-valuetext', text);
      out.textContent = text;
    };
    const move = v => { write(dr.cur, v); paint(); drSchedule(); };
    input.addEventListener('input', () => move(+input.value));
    minus.addEventListener('click', () => { if (pos() > d.min) move(lim(pos() - d.jump)); });
    plus.addEventListener('click', () => { if (pos() < d.max) move(lim(pos() + d.jump)); });
    const jobs = base => [[minus, -1, d.down], [plus, 1, d.up]].map(([b, dir, name]) => () => {
      const fx = b.lastElementChild, to = lim(pos() + dir * d.jump), stuck = to === pos();
      b.setAttribute('aria-disabled', String(stuck));
      if (stuck) { fx.textContent = ''; b.setAttribute('aria-label', d.label + ' ' + name + ': nicht möglich'); return; }
      const s = drClone(dr.cur);
      write(s, to);
      const delta = drFits(s) - base, n = Math.abs(delta);
      fx.className = drFxClass(delta);
      fx.textContent = drFxText(delta);
      b.setAttribute('aria-label', d.label + ' ' + name + ': ' + n + (n === 1 ? ' Inserat ' : ' Inserate ') + (delta < 0 ? 'weniger' : 'mehr'));
    });
    paint();
    return {paint, jobs};
  }
  function drSwitch(d, box) {
    const li = document.createElement('li');
    li.className = 'dr-sw';
    li.innerHTML = '<div><span class="dr-sw-l">' + esc(d.label) + '</span><span class="dr-sw-fx"></span></div>' +
      '<button class="dr-tg" type="button" role="switch" aria-label="' + esc(d.label) + ': ' + esc(d.onName) + '"><span>' + esc(d.onName) + '</span><span>' + esc(d.offName) + '</span></button>';
    box.appendChild(li);
    const btn = li.querySelector('button'), hint = li.querySelector('.dr-sw-fx');
    const paint = () => btn.setAttribute('aria-checked', String(!!d.on(dr.cur)));
    btn.addEventListener('click', () => { d.flip(dr.cur); paint(); drSchedule(); });
    const jobs = base => [() => {
      const s = drClone(dr.cur);
      d.flip(s);
      const delta = drFits(s) - base;
      hint.innerHTML = esc(d.on(dr.cur) ? d.toOff : d.toOn) + ' <span class="' + drFxClass(delta) + '">' + drFxText(delta) + '</span>';
    }];
    paint();
    return {paint, jobs};
  }
  function drBuild() {
    const sl = $('#drSliders'), sw = $('#drSwitches');
    dr.ctrls = drSliderDefs(dr.read).map(d => drSlider(d, sl)).concat(drSwitchDefs(dr.read).map(d => drSwitch(d, sw)));
    $('#drSwWrap').hidden = !sw.children.length;
  }
  /* what each next step would bring costs one check of all listings, so it runs in short slices and starts over after a change */
  function drEffects(base) {
    const mine = ++dr.run, todo = dr.ctrls.flatMap(c => c.jobs(base));
    const slice = () => {
      if (mine !== dr.run || ui.dlg !== 'dream') return;
      const t = performance.now();
      while (todo.length && performance.now() - t < 12) todo.shift()();
      if (todo.length) setTimeout(slice, 0);
    };
    slice();
  }
  /* the pictures are drawn when they scroll into view */
  let drObs = null;
  const drPics = new Map();
  function drImgs() {
    if (drObs) drObs.disconnect();
    const box = $('#drResults'), root = getComputedStyle(box).overflowY === 'auto' ? box : $('#dlgBody');
    drObs = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.dataset.dr;
      drObs.unobserve(e.target);
      if (!drPics.has(id)) drPics.set(id, DREAM.img(BY_ID[id], 'view:day'));
      e.target.src = drPics.get(id);
    }), {root, rootMargin: '300px'});
    document.querySelectorAll('.dr-img').forEach(i => { if (drPics.has(i.dataset.dr)) i.src = drPics.get(i.dataset.dr); else drObs.observe(i); });
  }
  function drRow(h) {
    const l = h.l, miss = h.res.filter(r => !r.ok), got = h.res.filter(r => r.ok), lack = miss.filter(r => r.k.must), wish = miss.filter(r => !r.k.must), open = !!dr.open[l.id], scored = h.res.length > 0;
    const line = !scored ? '' : lack.length ? '<span class="dr-l is-lack">Fehlt: ' + esc(lack.map(r => r.k.label).join(', ')) + '</span>'
      : wish.length ? '<span class="dr-l is-wish">Wunsch offen: ' + esc(wish.map(r => r.k.label).join(', ')) + '</span>' : '<span class="dr-l is-ok">Alles erfüllt</span>';
    const item = r => '<li class="' + (r.ok ? 'is-ok' : r.k.must ? 'is-no' : 'is-soft') + '">' + ic(r.ok ? P.check : P.close, 13, 2.6) + '<span>' + esc(r.k.label) + (r.note ? ' <small>' + esc(r.note) + '</small>' : '') + '</span></li>';
    return '<li class="dr-row' + (h.mustMiss ? ' is-near' : '') + '" data-row="' + l.id + '"><button type="button" class="dr-rowb" data-act="dreamOpen" data-id="' + l.id + '">' +
      '<img class="dr-img" data-dr="' + l.id + '" alt="" width="72" height="72" decoding="async">' +
      '<span class="dr-rb"><span class="card-q trunc">' + esc(whereQ(l)) + '</span><b class="dr-t">' + esc(l.title) + '</b><span class="dr-f">' + esc(DREAM.facts(l)) + '</span></span>' +
      '<span class="dr-rp"><b>' + esc(DREAM.price(l)) + '</b><small>' + esc(DREAM.per(l)) + '</small>' + (scored ? '<span class="dr-fit" aria-label="Passt zu ' + h.fit + ' Prozent">' + h.fit + ' %</span>' : '') + '</span></button>' +
      (scored ? '<button type="button" class="dr-ckb" data-act="dreamCheck" data-id="' + l.id + '" aria-expanded="' + open + '" aria-label="Alle Punkte: ' + got.length + ' von ' + h.res.length + ' erfüllt">' + line + '<span class="dr-of">' + got.length + ' von ' + h.res.length + '</span>' + ic(open ? P.chevUp : P.chevDown, 14, 2.4) + '</button>' +
        (open ? '<ul class="dr-ck">' + miss.concat(got).map(item).join('') + '</ul>' : '') : '') + '</li>';
  }
  function drRows() {
    const v = dr.view, a = v.exact.slice(0, dr.limit), b = v.near.slice(0, Math.max(0, dr.limit - a.length)), left = v.exact.length + v.near.length - a.length - b.length;
    $('#drRowsE').innerHTML = a.map(drRow).join('');
    $('#drRowsN').innerHTML = b.map(drRow).join('');
    $('#drExact').hidden = !a.length;
    $('#drNear').hidden = !b.length;
    $('#drExactN').textContent = v.exact.length;
    $('#drNearN').textContent = v.near.total > v.near.length ? v.near.total + ', hier die ' + v.near.length + ' nächsten' : v.near.total;
    $('#drMore').hidden = left <= 0;
    $('#drMore').textContent = 'Mehr zeigen (' + left + ')';
    $('#drNone').hidden = v.exact.length > 0;
    $('#drNone').textContent = !v.total ? 'Dafür gibt es keine Beispielinserate. Geh zurück und nimm einen anderen Ort.'
      : v.near.length ? 'Kein Inserat passt genau. Gib bei einem Regler nach oder mach ein Muss zum Wunsch.'
      : 'Kein Inserat kommt nah genug heran. Zieh die Regler weiter auf oder beschreib deine Wohnung anders.';
    drImgs();
  }
  /* delta: what the last change did to the count; null when nothing changed yet */
  function drPaint(delta) {
    const v = dr.view, n = v.exact.length, hits = n || v.near.length, fx = $('#drDelta');
    $('#drNum').textContent = n;
    $('#drWord').textContent = n === 1 ? 'passt genau' : 'passen genau';
    fx.hidden = delta === null;
    if (delta !== null) { fx.className = drFxClass(delta); fx.textContent = drFxText(delta); }
    $('#drRest').textContent = v.near.total + ' fast, von ' + v.total + ' Inseraten';
    $('#drTabN').textContent = hits;
    $('#drChips').innerHTML = DREAM.chips(dr.cur).map(k => '<li class="' + (k.must ? 'is-must' : 'is-wish') + '"><span class="sr">' + (k.must ? 'Muss' : 'Wunsch') + ': </span>' + esc(k.label) + '</li>').join('');
    $('#drFoot').hidden = !hits;
    $('#drMap').textContent = hits === 1 ? 'Auf der Karte zeigen' : (n ? 'Alle ' + n : 'Die ' + hits + ' nächsten') + ' auf der Karte zeigen';
    drRows();
    drEffects(n);
  }
  function drUpdate() {
    const before = dr.last;
    dr.view = DREAM.match(dr.cur);
    dr.last = dr.view.exact.length;
    dr.limit = 30;
    drPaint(dr.last - before);
  }
  function drSchedule() {
    clearTimeout(dr.timer);
    dr.run++;
    dr.timer = setTimeout(() => { if (ui.dlg === 'dream' && dr.tune) drUpdate(); }, 120);
  }
  /* on claude.ai Claude reads the description; on a plain web host there is no model, and word rules do it */
  const drAi = () => !!(window.claude && typeof window.claude.use === 'function');
  function dreamAsk() {
    return '<div class="dlg-h"><div><h2 id="dlgTitle">Beschreib deine Traumwohnung</h2><p>In deinen Worten. ' + (drAi() ? 'Claude' : 'Lage') + ' macht daraus Regler, mit denen du die Suche feinstellst.</p></div><button type="button" class="x-btn" data-act="closeDlg" aria-label="Schliessen">' + ic(P.close, 18, 2) + '</button></div>' +
      '<div class="dlg-b" id="dlgBody"><div class="dr-in"><label class="sr" for="drText">Deine Beschreibung</label>' +
      '<textarea id="drText" class="dr-text" rows="4" maxlength="1200" placeholder="Zum Beispiel: hell und ruhig, drei Zimmer, nah am See, höchstens eine halbe Stunde zur Arbeit">' + esc(dr.text) + '</textarea>' +
      (dr.busy ? '' : '<div class="dr-exs"><span>Beispiele</span>' + DREAM.EXAMPLES.slice(0, 3).map((t, i) => '<button type="button" class="dr-ex" data-act="dreamEx" data-id="' + i + '">' + esc(t) + '</button>').join('') + '</div>') +
      (dr.busy ? '<button type="button" class="btn-sec" data-act="dreamStop">Abbrechen</button>' : '<button type="button" class="btn-pri" data-act="dreamGo">Wohnungen finden</button>') +
      '<p class="dr-st" role="status">' + (dr.busy ? (drAi() ? 'Claude' : 'Lage') + ' liest deine Beschreibung …' : '') + '</p></div><p class="dr-sample">Alle Inserate sind Beispieldaten.</p></div>';
  }
  function dreamTune() {
    const blank = !dr.view.checks.length && !dr.read.places.length;
    return '<div class="dlg-h"><div><div class="dr-ht"><h2 id="dlgTitle" tabindex="-1">Deine Suche</h2>' + (dr.src === 'ki' ? '<span class="dr-ki">Von Claude gelesen</span>' : '') + '</div><p>' + esc(dr.read.summary) + '</p></div><button type="button" class="x-btn" data-act="closeDlg" aria-label="Schliessen">' + ic(P.close, 18, 2) + '</button></div>' +
      '<div class="dlg-b dr-tune" id="dlgBody"><div class="dr-top"><ul class="dr-chips" id="drChips" aria-label="Aktuelle Kriterien"></ul>' +
      '<div class="dr-top-f"><p class="dr-key"><i class="is-must"></i>Muss<i class="is-wish"></i>Wunsch</p><button type="button" class="dr-back" data-act="dreamBack">Beschreibung ändern</button></div>' +
      (dr.src === 'ki' ? '' : '<p class="dr-note">' + (dr.err ? 'Claude war gerade nicht erreichbar. Erkannt mit einfachen Regeln.' : drAi() ? 'Ohne Claude erkannt, mit einfachen Regeln.' : 'Erkannt mit einfachen Wortregeln, ohne KI. Stimmt etwas nicht, korrigier es mit den Reglern.') + '</p>') +
      (blank ? '<p class="dr-note">Daraus liess sich nichts Konkretes lesen. Stell die Regler selbst ein oder beschreib es genauer.</p>' : '') + '</div>' +
      '<div class="dr-bar"><p class="dr-n" role="status"><b id="drNum"></b> <span id="drWord"></span><span id="drDelta" hidden></span><span class="dr-rest" id="drRest"></span></p>' +
      '<div class="dr-tabs" role="group" aria-label="Ansicht"><button type="button" data-act="dreamPane" data-v="res" aria-pressed="' + (dr.pane === 'res') + '">Treffer <span id="drTabN"></span></button><button type="button" data-act="dreamPane" data-v="ctl" aria-pressed="' + (dr.pane === 'ctl') + '">Regler</button></div></div>' +
      '<div class="dr-split" id="drSplit" data-pane="' + dr.pane + '"><section class="dr-panel" aria-labelledby="drPanelH"><div class="dr-panel-h"><h3 id="drPanelH">Regler</h3><button type="button" class="dr-reset" data-act="dreamReset">Zurücksetzen</button></div>' +
      '<p class="dr-hint">Die kleinen Zahlen sagen, wie viele Inserate mit diesem Schritt mehr (+) oder weniger (−) genau passen.</p><div id="drSliders"></div><div id="drSwWrap"><h4>Merkmale</h4><ul class="dr-sws" id="drSwitches"></ul></div></section>' +
      '<section class="dr-results" id="drResults" aria-label="Treffer"><p class="dr-none" id="drNone" hidden></p>' +
      '<div id="drExact"><h4>Passt genau <span id="drExactN"></span></h4><ol class="dr-rows" id="drRowsE"></ol></div><div id="drNear"><h4>Fast <span id="drNearN"></span></h4><ol class="dr-rows" id="drRowsN"></ol></div>' +
      '<button type="button" class="btn-sec dr-more" id="drMore" data-act="dreamMore" hidden></button><p class="dr-sample">Alle Inserate sind Beispieldaten.</p></section></div></div>' +
      '<div class="dlg-f" id="drFoot"><button type="button" class="btn-pri" id="drMap" data-act="dreamMap"></button></div>';
  }
  const dreamHtml = () => dr.tune ? dreamTune() : dreamAsk();
  async function dreamGo() {
    const text = dr.text.trim();
    if (!text) { const f = $('#drText'); if (f) f.focus(); return; }
    if (dr.busy) return;
    const ctl = dr.ctl = new AbortController();
    dr.busy = true;
    renderDlg(false);
    const out = await DREAM.understand(text, {signal: ctl.signal});
    if (ctl !== dr.ctl) return;
    dr.ctl = null; dr.busy = false; dr.tune = true; dr.pane = 'res'; dr.limit = 30; dr.open = {};
    dr.read = out.criteria; dr.cur = drClone(out.criteria); dr.src = out.source; dr.err = out.error;
    dr.view = DREAM.match(dr.cur);
    dr.last = dr.view.exact.length;
    if (ui.dlg !== 'dream') return;
    renderDlg(false);
    $('#dlgTitle').focus({preventScroll: true});
  }
  function dreamStop() {
    if (dr.ctl) dr.ctl.abort();
    dr.ctl = null; dr.busy = false;
    if (ui.dlg === 'dream') renderDlg(true);
  }
  function dreamBack() {
    clearTimeout(dr.timer);
    dr.run++;
    dr.tune = false;
    renderDlg(false);
    const f = $('#drText');
    if (f && !window.matchMedia('(pointer: coarse)').matches) f.focus({preventScroll: true});
  }
  function dreamReset() {
    clearTimeout(dr.timer);
    dr.cur = drClone(dr.read);
    dr.ctrls.forEach(c => c.paint());
    drUpdate();
  }
  /* on a phone the list and the controls share the screen, one at a time */
  function dreamPane(p) {
    dr.pane = p;
    $('#drSplit').dataset.pane = p;
    document.querySelectorAll('.dr-tabs [data-act="dreamPane"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === p)));
    const body = $('#dlgBody'), top = $('#drSplit').offsetTop - body.offsetTop - $('.dr-bar').offsetHeight;
    if (body.scrollTop > top) body.scrollTop = Math.max(0, top);
  }
  function dreamCheck(id) {
    dr.open[id] = !dr.open[id];
    const li = document.querySelector('[data-row="' + id + '"]'), h = dr.view.exact.concat(dr.view.near).find(x => x.l.id === id);
    if (!li || !h) return;
    li.outerHTML = drRow(h);
    drImgs();
    document.querySelector('[data-row="' + id + '"] .dr-ckb').focus({preventScroll: true});
  }
  /* the result becomes the search on the map; the filters step aside */
  function dreamMap() {
    const v = dr.view, hits = v.exact.length ? v.exact : v.near;
    Object.assign(st, BASICS(), {deal: dr.cur.deal, active: {}, q: '', places: st.places.filter(p => p.kind === 'work').map(p => Object.assign(p, {max: null}))});
    DREAM_SET = new Set(hits.map(x => x.l.id));
    ui.zeroSeen = false;
    ui.fitPlace = null;
    closeDlg();
    refresh({go: true});
  }
  function renderDlg(keepScroll) {
    const p = $('#dlgPanel'), b = $('#dlgBody'), top = keepScroll && b ? b.scrollTop : 0;
    p.innerHTML = ui.dlg === 'dream' ? dreamHtml() : ui.dlg === 'nomatch' ? nomatchHtml() : ui.dlg === 'filters' ? filtersHtml() : ui.dlg === 'place' ? placeHtml() : ui.dlg === 'saved' ? savedHtml() : ui.dlg === 'visit' ? visitHtml() : '';
    if (keepScroll && $('#dlgBody')) $('#dlgBody').scrollTop = top;
    p.classList.toggle('is-tune', ui.dlg === 'dream' && dr.tune);
    if (ui.dlg === 'dream' && dr.tune) { drBuild(); drPaint(null); }
  }
  function openDlg(kind) {
    if (!ui.dlg) ui.returnDlgFocus = document.activeElement;
    ui.dlg = kind;
    $('#dlgPanel').classList.toggle('is-pop', kind === 'nomatch');
    $('#dlgPanel').classList.toggle('is-dream', kind === 'dream');
    ui.sortOpen = false;
    renderSortMenu();
    renderDlg(false);
    const d = $('#dlg');
    d.hidden = false;
    requestAnimationFrame(() => { d.classList.add('is-open'); setTimeout(() => { const f = kind === 'place' ? $('#wq') : kind === 'dream' && !dr.tune ? $('#drText') : kind === 'visit' && !ui.visitDone ? $('#vName') : $('#dlgPanel'); if (f && !((kind === 'place' || kind === 'dream') && window.matchMedia('(pointer: coarse)').matches)) f.focus({preventScroll: true}); else $('#dlgPanel').focus({preventScroll: true}); }, 80); });
  }
  function closeDlg() {
    const d = $('#dlg'), was = ui.dlg;
    if (was === 'dream' && dr.ctl) dreamStop();
    d.classList.remove('is-open');
    ui.dlg = null;
    ui.placeReturn = null; ui.placeKind = 'other'; ui.placeIdx = -1;
    setTimeout(() => { if (!ui.dlg) { d.hidden = true; $('#dlgPanel').innerHTML = ''; $('#dlgPanel').classList.remove('is-pop', 'is-dream', 'is-tune'); } }, 300);
    if (ui.returnDlgFocus && document.contains(ui.returnDlgFocus)) ui.returnDlgFocus.focus({preventScroll: true});
    /* left the filters with nothing that fits everything: explain it once */
    if (was && was !== 'nomatch') setTimeout(checkZero, 340);
  }

  /* ---------- a place picked on the map ---------- */
  function mapPicked(x, y) {
    ui.pick = false;
    $('#pickBanner').hidden = true;
    mapEl.classList.remove('is-picking');
    /* the quarters are Zürich's; elsewhere the nearest station names the spot */
    const q = x >= 0 && x <= 730 && y >= 0 && y <= 1000 ? GEO.nearestQuarter(x, y) : GEO.STATIONS.reduce((b, c) => Math.hypot(c.x - x, c.y - y) < Math.hypot(b.x - x, b.y - y) ? c : b).n;
    ui.placeKind = ui.pickKind || 'other'; ui.placeIdx = ui.pickIdx == null ? -1 : ui.pickIdx;
    if (applyPlacePick({id: 'map' + Date.now(), name: 'Ort bei ' + q, workSub: 'Bei ' + q + ', auf der Karte gewählt', sub: 'Auf der Karte gewählt', short: q, x, y})) toast(ui.placeKind === 'work' ? 'Arbeitsort gesetzt: bei ' + q : ui.placeKind === 'circle' ? 'Umkreis um ' + q : 'Ort hinzugefügt: bei ' + q);
    ui.placeKind = 'other'; ui.placeIdx = -1;
    compute(); renderAll(); redrawDetail(); persist();
    if (ui.pickReturn === 'filters') { ui.pickReturn = null; openDlg('filters'); scrollDlgTo('fPlaceSec'); }
    checkZero();
  }

  /* ---------- preview: desktop layout or the phone frame (wide screens only) ---------- */
  function applyPreview() {
    $('#stage').classList.toggle('is-mobile', st.view === 'mobile');
    document.querySelectorAll('#viewToggle [data-act="view"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === st.view)));
  }

  /* ---------- toast ---------- */
  let toastT = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.hidden = true; }, 2600);
  }

  /* ---------- actions ---------- */
  function toggleSave(id) {
    const on = !st.saved[id];
    if (on) st.saved[id] = Date.now(); else delete st.saved[id];
    persist();
    /* the pages around the map keep their own list (with listings outside Zürich); keep both in step */
    try { const k = 'lage-saved-v1', s = JSON.parse(localStorage.getItem(k)) || {}; if (on) s[id] = st.saved[id]; else delete s[id]; localStorage.setItem(k, JSON.stringify(s)); } catch (e) { /* storage unavailable */ }
    document.querySelectorAll('[data-act="save"][data-id="' + id + '"]').forEach(b => {
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? 'Gemerkt' : 'Merken');
      const holder = b.querySelector('span') && !b.classList.contains('round') && !b.classList.contains('x-btn') ? b.querySelector('span') : b;
      holder.innerHTML = heartIc(on, b.classList.contains('round') || b.classList.contains('prof-heart') ? 20 : b.classList.contains('x-btn') ? 18 : 17);
    });
    const sn = Object.keys(st.saved).length;
    $('#savedBtn').innerHTML = heartIc(sn > 0, 15) + '<span>' + sn + '</span>';
    $('#savedBtn').setAttribute('aria-label', 'Gemerkt: ' + sn);
    queueOverlay();
    if (ui.dlg === 'saved') renderDlg(true);
    toast(on ? 'Gemerkt' : 'Aus der Merkliste entfernt');
  }
  function resetFilters() {
    DREAM_SET = null;
    Object.assign(st, BASICS(), {active: {}, q: '', places: st.places.filter(p => p.kind === 'work').map(p => Object.assign(p, {max: null}))});
    ui.aiMsg = '';
    refresh();
  }
  document.addEventListener('click', e => {
    if (suppressClick && performance.now() - suppressClick < 350) { suppressClick = 0; e.preventDefault(); return; }
    if (ui.sortOpen && !e.target.closest('#sortMenu') && !e.target.closest('#sortBtn')) { ui.sortOpen = false; renderSortMenu(); }
    const pinBtn = e.target.closest('[data-pin]');
    if (pinBtn && e.detail === 0) { pickListing(pinBtn.dataset.pin, true); return; }
    const cl = e.target.closest('[data-cluster]');
    if (cl && e.detail === 0) { const ls = CLUSTERS.get(cl.dataset.cluster); if (ls) fit(ls.map(l => [l.x, l.y]), true, 50); return; }
    const a = e.target.closest('[data-act]');
    if (!a || a.disabled) return;
    const id = a.dataset.id, v = a.dataset.v;
    switch (a.dataset.act) {
      case 'deal': if (st.deal !== v) { st.deal = v; st.priceMin = null; st.priceMax = null; ui.sel = null; FILTERS.forEach(f => { if (f.deal && f.deal !== v) delete st.active[f.id]; }); refresh(); } break;
      case 'toggleF': if (st.active[id]) delete st.active[id]; else st.active[id] = true; refresh(); break;
      case 'openFilters': openDlg('filters'); if (v) scrollDlgTo(v); break;
      case 'openSaved': openDlg('saved'); break;
      case 'closeDlg': closeDlg(); break;
      case 'dream': openDlg('dream'); break;
      case 'dreamEx': { dr.text = DREAM.EXAMPLES[+id]; const f = $('#drText'); if (f) { f.value = dr.text; f.focus({preventScroll: true}); } break; }
      case 'dreamGo': dreamGo(); break;
      case 'dreamStop': dreamStop(); break;
      case 'dreamMore': dr.limit += 30; drRows(); break;
      case 'dreamBack': dreamBack(); break;
      case 'dreamReset': dreamReset(); break;
      case 'dreamPane': dreamPane(v); break;
      case 'dreamCheck': dreamCheck(id); break;
      case 'dreamOpen': dr.back = true; closeDlg(); if (BY_ID[id].deal !== st.deal) { st.deal = BY_ID[id].deal; st.priceMax = null; compute(); renderAll(); } openDetail(id); break;
      case 'dreamMap': dreamMap(); break;
      case 'dreamClear': DREAM_SET = null; refresh(); break;
      case 'save': toggleSave(id); break;
      case 'open': if (ui.sel !== id) { ui.sel = id; renderSelection(); panTo(BY_ID[id]); } openDetail(id, +v || 0); break;
      case 'toggleSheet': setSheet(ui.sheet === 'peek' ? 'full' : 'peek'); queueOverlay(); break;
      case 'showMap': setSheet('peek'); queueOverlay(); break;
      case 'sortMenu': ui.sortOpen = !ui.sortOpen; renderSortMenu(); if (ui.sortOpen) setTimeout(() => { const b = $('#sortMenu button[aria-pressed="true"]'); if (b) b.focus(); }, 0); break;
      case 'sort': st.sort = v; ui.sortOpen = false; refresh({fit: false}); $('#sheetBody').scrollTop = 0; $('#sortBtn').focus(); break;
      case 'zoomIn': { const c = visCenter(); animateTo(zoomTarget(c[0], c[1], 0.6), true, true); break; }
      case 'zoomOut': { const c = visCenter(); animateTo(zoomTarget(c[0], c[1], 1.6), true, true); break; }
      case 'fit': fitResults(true, true); break;
      case 'pinMode': st.pinMode = v; renderAll(); persist(); break;
      case 'layout': if (st.layout !== v) { st.layout = v; persist(); renderSheet(); $('#sheetBody').scrollTop = 0; renderSelection(); } break;
      case 'view': if (st.view !== v) { st.view = v; persist(); applyPreview(); requestAnimationFrame(() => { measure(); setSheet(ui.sheet, false); fitResults(false); }); } break;
      case 'closeDetail': closeDetail(); break;
      case 'galPrev': case 'galNext': { const t = $('#galTrack'); t.scrollBy({left: (a.dataset.act === 'galNext' ? 1 : -1) * t.clientWidth, behavior: reduced ? 'auto' : 'smooth'}); break; }
      case 'visit': ui.visitId = id; ui.visitDone = false; ui.slots = {}; openDlg('visit'); break;
      case 'slot': ui.slots[v] = !ui.slots[v]; a.setAttribute('aria-pressed', String(!!ui.slots[v])); break;
      case 'pickOnMap':
        ui.pickKind = ui.placeKind; ui.pickIdx = ui.placeIdx; ui.pickReturn = ui.placeReturn;
        closeDlg(); if (ui.detail) closeDetail();
        ui.pick = true;
        $('#pickText').textContent = ui.pickKind === 'work' ? 'Tippe auf die Karte, um deinen Arbeitsort zu setzen.' : ui.pickKind === 'circle' ? 'Tippe auf die Karte, um den Mittelpunkt des Umkreises zu setzen.' : 'Tippe auf die Karte, um den Ort zu wählen.';
        $('#pickBanner').hidden = false; mapEl.classList.add('is-picking'); setSheet('peek');
        break;
      case 'cancelPick': {
        ui.pick = false; $('#pickBanner').hidden = true; mapEl.classList.remove('is-picking');
        const back = ui.pickReturn === 'filters';
        ui.pickReturn = null; ui.pickKind = null; ui.pickIdx = null;
        if (back) { openDlg('filters'); scrollDlgTo('fPlaceSec'); }
        break;
      }
      case 'type': if (st.types[v]) delete st.types[v]; else st.types[v] = true; refresh(); break;
      case 'baths': st.baths = +v; refresh(); break;
      case 'since': st.since = +v; refresh(); break;
      case 'quickView': st.viewMin = TOP_VIEW; refresh(); toast('Aussicht ab 8 von 10. Feiner einstellen unter Filter.'); break;
      case 'clearView': st.viewMin = 0; refresh(); break;
      case 'clearV': st[id] = 0; refresh(); break;
      case 'vlevel': st[id] = +v; refresh(); break;
      case 'aiView': { const inp = $('#fAiQ'); applyWish(inp ? inp.value : st.aiQ); break; }
      case 'aiEx': applyWish(v); break;
      case 'resetView': resetViewState(); st.aiQ = ''; ui.aiMsg = ''; refresh(); break;
      case 'jump': scrollDlgTo(v); break;
      case 'draw': if (ui.draw) stopDrawMode(); else startDrawMode(false); break;
      case 'drawFromFilters': closeDlg(); startDrawMode(true); break;
      case 'cancelDraw': stopDrawMode(); break;
      case 'drawView': areaFromView(); break;
      case 'clearAreas': st.areas = []; refresh(); break;
      case 'delArea': st.areas.splice(+id, 1); refresh(); break;
      case 'move': st.moveBy = v; refresh(); break;
      case 'placeQuick': {
        const p = GEO.PLACES.find(x => x.id === id);
        ui.placeKind = 'other'; ui.placeIdx = -1;
        if (p && applyPlacePick(Object.assign({}, p))) { refresh(); if (!ui.dlg) toast('Höchstens 20 Min. mit ÖV bis ' + p.name + '. Anpassen unter Filter.'); }
        break;
      }
      case 'placeAddWork': openPlacePicker('work', -1, ui.dlg === 'filters'); break;
      case 'placeChange': if (st.places[+id]) openPlacePicker(st.places[+id].kind, +id, true); break;
      case 'placeAdd': openPlacePicker('other', -1, true); break;
      case 'circleAdd': openPlacePicker('circle', -1, true); break;
      case 'circleQuick': { const p = GEO.PLACES.find(x => x.id === id); ui.placeKind = 'circle'; if (p && applyPlacePick(Object.assign({}, p))) refresh(); ui.placeKind = 'other'; break; }
      case 'circleWork': { const w = st.places.find(p => p.kind === 'work'); if (w && st.circles.length < 4) { st.circles.push({id: 'work', name: 'die Arbeit', x: +w.x, y: +w.y, km: 3}); refresh(); } break; }
      case 'circleDel': st.circles.splice(+id, 1); refresh(); break;
      case 'whyZero': openDlg('nomatch'); break;
      case 'fix': { const f = ui.fixes && ui.fixes[+v]; if (f) { f.mut(st); closeDlg(); refresh(); toast(f.label + ': ' + RES.length + (RES.length === 1 ? ' Angebot' : ' Angebote')); } break; }
      case 'nmFilters': closeDlg(); setTimeout(() => openDlg('filters'), 260); break;
      case 'nmReset': closeDlg(); resetFilters(); break;
      case 'relax': { const c = ui.relax && ui.relax[+v]; if (c) { c.mut(st); refresh(); toast(c.label + ': ' + RES.length + (RES.length === 1 ? ' Angebot' : ' Angebote')); } break; }
      case 'pickPlace': { const p = GEO.PLACES.find(x => x.id === id); if (p && applyPlacePick(Object.assign({}, p))) { compute(true); renderAll(); redrawDetail(); goFit(true); persist(); toast(ui.placeKind === 'work' ? 'Arbeitsort: ' + p.name : ui.placeKind === 'circle' ? 'Umkreis um ' + p.name : 'Ort hinzugefügt: ' + p.name); } placeDone(); break; }
      case 'placeBack': placeDone(); break;
      case 'placeMode': if (st.places[+id]) { st.places[+id].mode = v; refresh(); } break;
      case 'placePeak': if (st.places[+id]) { st.places[+id].peak = !st.places[+id].peak; refresh({fit: false}); } break;
      case 'placeDel': st.places.splice(+id, 1); if (!st.places.length) { if (st.sort === 'commute') st.sort = 'match'; if (st.pinMode === 'time') st.pinMode = 'price'; } refresh(); break;
      case 'resetFilters': resetFilters(); break;
      case 'clearQ': st.q = ''; refresh(); break;
      case 'savedTab': ui.savedTab = v; renderDlg(false); break;
      case 'openSaved1': closeDlg(); if (BY_ID[id].deal !== st.deal) { st.deal = BY_ID[id].deal; st.priceMax = null; compute(); renderAll(); } openDetail(id); break;
    }
  });
  document.addEventListener('submit', e => {
    if (e.target.id !== 'visitForm') return;
    e.preventDefault();
    const name = $('#vName').value.trim(), mail = $('#vMail').value.trim();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { $('#vErr').textContent = !name ? 'Bitte gib deinen Namen ein.' : 'Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@beispiel.ch.'; return; }
    ui.visitDone = true;
    renderDlg(false);
  });
  let qT = 0;
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'drText') dr.text = t.value;
    else if (t.id === 'q') { st.q = t.value; clearTimeout(qT); qT = setTimeout(() => refresh(), 220); }
    else if (t.id === 'wq') { ui.workQ = t.value; $('#wList').innerHTML = workList(); }
    else if (t.id === 'fAiQ') { st.aiQ = t.value; }
    else if (t.id === 'fView') { st.viewMin = +t.value; $('#fViewV').textContent = st.viewMin ? fmt.dec(st.viewMin) + ' / 10' : 'Egal'; liveCount(); }
    else if (t.id === 'fInc' || t.id === 'fEq') { const v = parseMoney(t.value); if (t.id === 'fInc') st.income = v; else st.equity = v; $('#fAfford').innerHTML = affordNote(); liveCount(); }
    else if (t.dataset && t.dataset.cr != null) {
      const i = +t.dataset.cr, c = st.circles[i];
      if (c) { c.km = +t.value; const n = LISTINGS.filter(l => l.deal === st.deal && inCircle(l, c)).length; $('#fCrN' + i).textContent = n + (n === 1 ? ' Angebot' : ' Angebote') + ' darin, vor den übrigen Filtern'; renderAreas(); $('#fCrV' + i).innerHTML = crOut(c.km, liveCount()); }
    }
    else if (t.dataset && t.dataset.pl != null) { const i = +t.dataset.pl, p = st.places[i]; if (p) { p.max = +t.value >= 65 ? null : +t.value; $('#fPlV' + i).innerHTML = plOut(p.max, liveCount()); } }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'fView' || (t.dataset && (t.dataset.pl != null || t.dataset.cr != null))) refresh();
    /* min / max selects: keep the pair consistent, then update in place so focus stays on the select */
    else if (t.dataset && t.dataset.range) {
      const key = t.dataset.range, [a, b] = RANGE_STATE[key], field = t.dataset.field;
      st[field] = t.value === '' ? (key === 'floor' || key === 'price' ? null : 0) : +t.value;
      const other = field === a ? b : a;
      if (isSet(key, st[a]) && isSet(key, st[b]) && st[a] > st[b]) { st[other] = key === 'floor' || key === 'price' ? null : 0; refresh(); return; }
      compute(true); renderAll(); syncFilterCounts(); redrawDetail(); goFit(true); persist();
    }
    /* Text fields commit on blur: update in place so the tap that caused the blur still lands on its button. */
    else if (t.id === 'fInc' || t.id === 'fEq') {
      const v = t.id === 'fInc' ? st.income : st.equity;
      t.value = v == null ? '' : fmt.thou(v);
      compute(true); renderAll(); syncFilterCounts(); redrawDetail(); goFit(true); persist();
    }
  });
  function syncFilterCounts() {
    document.querySelectorAll('#dlgBody .tg[data-id]').forEach(b => {
      const n = st.active[b.dataset.id] ? RES.length : countWith(b.dataset.id), el = b.querySelector('.tg-n');
      el.textContent = n; el.setAttribute('aria-label', n + ' Treffer');
    });
    liveCount();
  }
  function liveCount() {
    const n = LISTINGS.reduce((s, l) => s + (passes(l, st.active) ? 1 : 0), 0);
    const b = $('#fShow');
    if (b) b.textContent = showText(n);
    return n;
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'fAiQ') { e.preventDefault(); applyWish(e.target.value); return; }
    if (e.key !== 'Escape') return;
    if (ui.sortOpen) { ui.sortOpen = false; renderSortMenu(); $('#sortBtn').focus(); }
    else if (ui.dlg) closeDlg();
    else if (ui.detail) closeDetail();
    else if (ui.draw) stopDrawMode();
    else if (ui.pick) { ui.pick = false; $('#pickBanner').hidden = true; mapEl.classList.remove('is-picking'); }
  });
  document.addEventListener('keydown', e => { if (e.target.id === 'drText' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); dreamGo(); } });
  $('#q').addEventListener('keydown', e => { if (e.key === 'Enter') { clearTimeout(qT); refresh(); e.target.blur(); } });

  /* ?perf in the URL exposes the map internals for timing tests */
  if (location.search.indexOf('perf') >= 0) window.__lage = {refresh, compute, view, applyView, renderOverlay, zoomAt, measure, beginMove, endMove, moveFrame, commitView, get LIST() { return LIST; }, get ALLR() { return ALLR; }};

  /* ---------- init ---------- */
  [app, mapEl, overlay].forEach(el => el.addEventListener('scroll', () => { el.scrollLeft = 0; el.scrollTop = 0; }));
  $('#sheetBody').addEventListener('scroll', () => { clearTimeout(syncT); syncT = setTimeout(syncFromScroll, 160); }, {passive: true});
  applyPreview();
  buildMap();
  compute();
  measure();
  setSheet('peek', false);
  renderAll();
  fitResults(false);
  setTimeout(checkZero, 600);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { setSheet(ui.sheet, false); fitResults(false); });
  let rT = 0;
  const relayout = () => { clearTimeout(rT); rT = setTimeout(() => { measure(); setSheet(ui.sheet, false); applyView(); afterUserMove(); }, 60); };
  if (window.ResizeObserver) new ResizeObserver(relayout).observe(app); else window.addEventListener('resize', relayout);

  /* ---------- links from the landing pages ----------
     #rent-garten or #buy-seeanstoss opens the map with that search (and nothing else), #l-g12 opens one listing,
     #saved the saved list. Hash names stay plain (letters, digits, hyphens), so they survive in the artifact's URL. */
  const PRESET = {garten: {f: ['garden']}, seesicht: {vLake: 1}, rheinblick: {vLake: 1}, waschmaschine: {f: ['wm']}, hochhaus: {f: ['tower']}, altbau: {f: ['old']},
    'naehe-hb': {to: ['hb', 15]}, 'naehe-eth': {to: ['eth', 15]}, 'naehe-flughafen': {to: ['airport', 20]}, seeanstoss: {f: ['lakeFront']},
    'zwei-badezimmer': {baths: 2}, pool: {f: ['pool']}, ruhig: {f: ['quiet']}, aussicht: {viewMin: 7.5}, einlieger: {f: ['einlieger']},
    dachterrasse: {f: ['roofTerrace']}, umschwung: {f: ['umschwung']}, klimaanlage: {f: ['klima']}, atelier: {f: ['atelier']}, hauswart: {f: ['hauswart']},
    abendsonne: {f: ['eve']}, 'hund-garten': {f: ['pets', 'garden']}, hindernisfrei: {f: ['wheelchair']}, badewanne: {f: ['bathtub']}, cheminee: {f: ['fireplace']},
    penthouse: {types: ['attika']}, wintergarten: {f: ['wintergarten']}, 'im-gruenen': {f: ['forestEdge']}, autofrei: {f: ['carFree']}, ladestation: {f: ['evCharge']},
    sauna: {f: ['sauna']}, minergie: {f: ['minergie']}, concierge: {f: ['concierge']}, glasfaser: {f: ['fiber']}, 'am-see': {f: ['atLake']},
    'eigener-eingang': {f: ['ownEntrance']}, 'am-fluss': {f: ['atRiver']}, 'offene-kueche': {f: ['openKitchen']}, baurecht: {f: ['baurecht']},
    'hohe-decken': {f: ['highCeil']}, fitnessraum: {f: ['fitness']}};
  function fromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return;
    if (h === 'saved') { openDlg('saved'); return; }
    if (h === 'traum') { openDlg('dream'); return; }
    if (h.startsWith('l-')) {
      const id = h.slice(2), l = BY_ID[id];
      if (!l) return;
      if (l.deal !== st.deal) { st.deal = l.deal; refresh(); }
      ui.sel = id;
      openDetail(id);
      return;
    }
    const m = /^(rent|buy)(?:-(.+))?$/.exec(h);
    if (!m) return;
    let rest = m[2] || '', inPlace = null;
    const mi = /(?:^|-)in-([a-z]+)$/.exec(rest);
    if (mi) { inPlace = mi[1]; rest = rest.slice(0, mi.index); }
    const pr = rest ? PRESET[rest] : null;
    DREAM_SET = null;
    Object.assign(st, BASICS(), {deal: m[1], active: {}, q: '', places: st.places.filter(p => p.kind === 'work').map(p => Object.assign(p, {max: null}))});
    if (pr) {
      (pr.f || []).forEach(id => { if (DATA.byId[id]) st.active[id] = true; });
      if (pr.vLake) st.vLake = pr.vLake;
      if (pr.viewMin) st.viewMin = pr.viewMin;
      if (pr.baths) st.baths = pr.baths;
      if (pr.types) pr.types.forEach(t => { st.types[t] = true; });
      if (pr.to) { const b = GEO.PLACES.find(p => p.id === pr.to[0]); if (b) st.places.push({id: b.id, kind: 'other', name: b.name, short: SHORT[b.id], sub: b.sub, x: b.x, y: b.y, mode: 'pt', peak: false, max: pr.to[1]}); }
    }
    ui.zeroSeen = false;
    ui.fitPlace = inPlace;
    refresh({go: true});
  }
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();
