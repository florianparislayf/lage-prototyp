/* dream.js — "Beschreib deine Traumwohnung". Claude turns a description into search criteria (the artifact's `sample`
   capability); the page then checks every listing against them, ranks the ones that fit and says per listing what
   fits and what does not. Without Claude (local preview, no consent, rate limit) simple word rules stand in, so the
   page always answers. Needs geo.js, data.js, scene.js, swiss.js, cities.js and assets/tests.js before it.

   API (window.DREAM):
     EXAMPLES                          five example descriptions
     understand(text, {signal})        -> Promise<{criteria, source: 'ki' | 'regeln', error?}>
     match(criteria)                   -> {exact: Hit[], near: Hit[] (the 30 closest; near.total: how many there are), checks: Check[], total}
                                          Hit = {l, fit (0..100), mustMiss, res: [{k: Check, ok, note}]}
     chips(criteria)                   -> [{id, label, must}]   what was understood, for display
     view helpers: title(l), price(l), per(l), facts(l), where(l), img(l, key), keys(l), travelNote(l, criteria) */
(function (G) {
  'use strict';
  const {DATA, CITIES, GEO, SCENE} = G;
  const FILTERS = DATA.FILTERS, F = Object.fromEntries(FILTERS.map(f => [f.id, f]));
  const PL = CITIES.PLACES, PLACE_IDS = Object.keys(PL).concat(['schweiz']);
  const PLACE_NAME = id => id === 'schweiz' ? 'Schweiz' : id === 'zuerich' ? 'Zürich' : id === 'geneve' ? 'Genf' : PL[id].name;
  const TARGETS = GEO.PLACES.map(p => ({id: p.id, name: p.name, x: p.x, y: p.y}));
  const T = Object.fromEntries(TARGETS.map(t => [t.id, t]));
  const MODES = {pt: 'mit ÖV', car: 'mit dem Auto', bike: 'mit dem Velo', walk: 'zu Fuss'};
  const MOVE = {now: 0, dec: new Date(2026, 11, 1).getTime(), jan: new Date(2027, 0, 1).getTime(), mar: new Date(2027, 2, 1).getTime()};
  const MOVE_TXT = {now: 'Einzug sofort', dec: 'Einzug bis 1. Dezember', jan: 'Einzug bis 1. Januar', mar: 'Einzug bis 1. März'};
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '’');
  const money = (v, deal) => deal === 'buy' && v >= 1e6 ? 'CHF ' + (v / 1e6).toFixed(2).replace(/0$/, '').replace('.', ',') + ' Mio.' : 'CHF ' + thou(v);
  const zi = v => String(v).replace('.5', '½');

  const EXAMPLES = [
    'Ruhige 3½-Zimmer-Wohnung in Zürich bis CHF 3’800, mit Balkon und Abendsonne, höchstens 20 Minuten mit dem Velo zur ETH.',
    'Altbau mit hohen Decken in Basel oder Bern, eigene Waschmaschine, Haustiere erlaubt, Einzug bis März.',
    'Familie mit zwei Kindern sucht ein Haus mit Garten am Zürichsee zum Kaufen, höchstens 2,5 Millionen.',
    'Kleine Wohnung mit Seesicht in Lausanne oder Genf, gerne mit Dachterrasse, bis 3000 im Monat.',
    'Hell, ab 80 m², Blick auf die Berge, eine halbe Stunde mit dem Zug nach Bern, egal wo in der Schweiz.'
  ];

  /* ---------- Claude: description -> criteria ---------- */
  function prompt(text) {
    return [
      'Du hilfst bei der Wohnungssuche in der Schweiz. Wandle die Beschreibung in Suchkriterien um.',
      'Antworte nur mit JSON: {"deal":"rent"|"buy","places":[id],"priceMax":number|null,"priceMin":number|null,"roomsMin":number|null,"roomsMax":number|null,"areaMin":number|null,' +
        '"features":[{"id":id,"must":boolean}],"viewMin":number|null,"lake":0|1|2|3,"commute":[{"to":id,"mode":"pt"|"car"|"bike"|"walk","max":number}],"moveBy":"any"|"now"|"dec"|"jan"|"mar","summary":string}',
      'Regeln: Mieten: CHF pro Monat inklusive Nebenkosten; Kaufen: Kaufpreis in CHF. places leer heisst ganze Schweiz. "must": true nur, wenn die Person es klar verlangt, sonst false. ' +
        'viewMin 1 bis 10 nur bei ausdrücklichem Wunsch nach Aussicht. lake: 1 Seeblick, 2 breiter Seeblick, 3 Seepanorama. Nimm nur ids aus den Listen unten. summary: ein kurzer Satz in Du-Form, was du verstanden hast.',
      'Orte (places): ' + PLACE_IDS.map(id => id + '=' + PLACE_NAME(id)).join(', '),
      'Ziele für Wegzeiten (commute.to): ' + TARGETS.map(t => t.id + '=' + t.name).join(', '),
      'Merkmale (features.id): ' + FILTERS.map(f => f.id + '=' + f.label).join('; '),
      'Beschreibung: ' + String(text).slice(0, 1200)
    ].join('\n');
  }
  let samplePromise = null;
  const getSample = () => {
    if (!samplePromise) samplePromise = (G.claude && typeof G.claude.use === 'function') ? Promise.resolve(G.claude.use('sample')).catch(() => null) : Promise.resolve(null);
    return samplePromise;
  };
  async function understand(text, opt) {
    opt = opt || {};
    const sample = await getSample();
    let error = null;
    if (sample) {
      try {
        const v = await sample.json(prompt(text), {modelTier: 'default', signal: opt.signal});
        const c = clean(v, text);
        if (c) return {criteria: c, source: 'ki'};
      } catch (e) { error = e && e.code ? e.code : 'error'; }
    }
    return {criteria: clean(rules(text), text), source: 'regeln', error};
  }

  /* ---------- the same without Claude: word rules ---------- */
  const MARKS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(MARKS, '');
  const WORDS = [
    [/balkon|loggia|(?<!dach)terrasse|sitzplatz/, 'balcony'], [/garten/, 'garden'], [/ruhig|leise/, 'quiet'], [/waschmaschine|waschturm|tumbler/, 'wm'],
    [/haustier|hund|katze/, 'pets'], [/\blift\b|aufzug/, 'lift'], [/altbau/, 'old'], [/hohe decken|hohen decken/, 'highCeil'], [/dachterrasse/, 'roofTerrace'],
    [/abendsonne/, 'eve'], [/sonnig|\bhell\b/, 'sunny'], [/parkplatz|garage/, 'parking'], [/\bpool\b|hallenbad|schwimmbad/, 'pool'], [/chemin|kamin/, 'fireplace'],
    [/badewanne/, 'bathtub'], [/geschirrspuler|abwasch/, 'dishwasher'], [/neubau/, 'newbuild'], [/minergie/, 'minergie'], [/homeoffice|arbeitszimmer/, 'homeoffice'],
    [/kinder|familie|schule/, 'family'], [/rollstuhl|hindernisfrei|barrierefrei/, 'wheelchair'], [/hochhaus|turm/, 'tower'], [/offene kuche|wohnkuche/, 'openKitchen'],
    [/eigener eingang|eigenen eingang/, 'ownEntrance'], [/klima/, 'klima'], [/atelier|werkstatt|hobbyraum/, 'atelier'], [/genossenschaft/, 'coop'], [/von privat|ohne makler/, 'privateOffer'],
    [/am see|seenah|ufer/, 'atLake'], [/am fluss|limmat|aare|rhein/, 'atRiver'], [/wald|im grunen/, 'forestEdge'], [/glasfaser/, 'fiber'], [/mobliert/, 'furnished'], [/baurecht/, 'baurecht']
  ];
  const PLACE_WORDS = [[/zurichsee/, 'zuerichsee'], [/zuerich|zurich/, 'zuerich'], [/winterthur/, 'winterthur'], [/basel/, 'basel'], [/\bbern\b/, 'bern'], [/luzern|lucerne/, 'luzern'],
    [/\bzug\b/, 'zug'], [/st\.? ?gallen/, 'stgallen'], [/aargau/, 'aargau'], [/thurgau/, 'thurgau'], [/zugersee/, 'zugersee'], [/vierwaldst/, 'vierwaldstaettersee'],
    [/bielersee/, 'bielersee'], [/bodensee/, 'bodensee'], [/genf|geneve|geneva/, 'geneve'], [/lausanne/, 'lausanne'], [/leman|genfersee/, 'leman']];
  /* a filter's own name counts too: "Sauna", "Wintergarten", "Grosses Grundstück" */
  const NAMES = FILTERS.map(f => ({id: f.id, names: norm(f.label).replace(/\(.*?\)/g, ' ').split(/ oder | und |,/).map(s => s.trim()).filter(s => s.length >= 5)}));
  const NUM_WORDS = {zwei: 2, drei: 3, vier: 4, funf: 5, sechs: 6};
  function rules(text) {
    const t = norm(text), c = {deal: /kauf|eigentum/.test(t) ? 'buy' : 'rent', places: [], features: [], commute: [], moveBy: 'any', lake: 0, viewMin: null};
    /* a place after "nach", "zur" or "mit dem" is where you go, not where you live ("mit dem Zug nach Bern") */
    const anyPlace = /egal wo|ganze schweiz|uberall/.test(t);
    for (const [re, id] of PLACE_WORDS) {
      if (anyPlace) break;
      const g = new RegExp(re.source, 'g');
      let m2, home = false;
      while ((m2 = g.exec(t))) if (!/(nach|zur|zum|bis|mit dem|mit der|per)\s*$/.test(t.slice(Math.max(0, m2.index - 9), m2.index))) home = true;
      if (home && !(id === 'zuerich' && /zurichsee/.test(t) && !/zurich(?!see)/.test(t))) c.places.push(id);
    }
    /* "gerne", "idealerweise", "wenn möglich": a wish, not a must */
    const clauses = t.split(/[,;.]| und /);
    const soft = /gerne|idealerweise|wenn moglich|ware schon|optional|nice/;
    for (const [re, id] of WORDS) {
      const cl = clauses.find(x => re.test(x));
      if (cl) c.features.push({id, must: !soft.test(cl)});
    }
    for (const {id, names} of NAMES) {
      if (id === 'gardenShared' || c.features.some(x => x.id === id)) continue;
      const cl = clauses.find(x => names.some(n => x.includes(n)));
      if (cl) c.features.push({id, must: !soft.test(cl)});
    }
    if (/seesicht|seeblick|blick auf den see/.test(t)) c.lake = /panorama/.test(t) ? 3 : 1;
    if (/aussicht|berge|alpen|weitblick/.test(t)) c.viewMin = 7;
    const num = s => +String(s).replace(/[’' ]/g, '').replace(',', '.');
    /* "bis 3000", not "höchstens 20 Minuten" or "bis 90 m²" */
    for (const x of t.matchAll(/(?:bis|max\.?|maximal|hochstens|unter|weniger als|budget)\s*(?:chf\s*|fr\.\s*)?(\d[\d’' .,]*)\s*(mio|million|min|m2|m²|qm|quadrat|zimmer|zi\b|stock|km)?/g)) {
      if (x[2] && !/mio|million/.test(x[2])) continue;
      c.priceMax = Math.round(num(x[1]) * (x[2] ? 1e6 : 1));
      break;
    }
    let m;
    if (!c.priceMax && (m = /(?:chf|fr\.)\s*(\d[\d’' .,]*)\s*(mio|million)?/.exec(t) || /(\d[\d’' .,]*)\s*(mio|million|chf|franken)/.exec(t))) c.priceMax = Math.round(num(m[1]) * (/mio|million/.test(m[2] || '') ? 1e6 : 1));
    if (c.priceMax && c.priceMax < 100) c.priceMax = c.deal === 'buy' ? c.priceMax * 1e6 : c.priceMax * 1000;
    m = /(\d+(?:[.,]5|½)?)\s*(?:-|\s)?(?:zimmer|zi\b)/.exec(t.replace('½', '.5'));
    if (m) c.roomsMin = num(m[1]);
    else if ((m = /(zwei|drei|vier|funf|sechs)(einhalb)?[ -]?(?:zimmer|zi\b)/.exec(t))) c.roomsMin = NUM_WORDS[m[1]] + (m[2] ? 0.5 : 0);
    m = /ab\s*(\d+)\s*m/.exec(t) || /(\d+)\s*(?:m2|m²|qm|quadratmeter)/.exec(t);
    if (m) c.areaMin = +m[1];
    m = /(\d+|halbe stunde|viertelstunde)\s*(?:min\w*)?\s*(?:mit dem |mit der |mit |per |zu )?(velo|fahrrad|auto|zug|ov|tram|bus|fuss)?\s*(?:zur|zum|nach|bis)\s+([a-z .-]+)/.exec(t);
    if (m) {
      const max = m[1] === 'halbe stunde' ? 30 : m[1] === 'viertelstunde' ? 15 : +m[1];
      const mode = /velo|fahrrad/.test(m[2] || '') ? 'bike' : /auto/.test(m[2] || '') ? 'car' : /fuss/.test(m[2] || '') ? 'walk' : 'pt';
      const name = m[3].trim(), tg = /^(hb|hauptbahnhof)\b/.test(name) ? T.hb : TARGETS.find(x => norm(x.name).startsWith(name.split(' ')[0]) || name.startsWith(norm(x.name).split(' ')[0]));
      if (tg && max) c.commute.push({to: tg.id, mode, max});
    }
    if (/sofort/.test(t)) c.moveBy = 'now'; else if (/dezember/.test(t)) c.moveBy = 'dec'; else if (/januar/.test(t)) c.moveBy = 'jan'; else if (/marz|maerz/.test(t)) c.moveBy = 'mar';
    return c;
  }

  /* ---------- whatever came back: keep what makes sense ---------- */
  function clean(v, text) {
    if (!v || typeof v !== 'object') return null;
    const n = x => (x === null || x === undefined || x === '' || !isFinite(+x)) ? null : +x;
    const c = {
      deal: v.deal === 'buy' ? 'buy' : 'rent',
      places: (Array.isArray(v.places) ? v.places : []).filter(id => PLACE_IDS.includes(id) && id !== 'schweiz'),
      priceMax: n(v.priceMax), priceMin: n(v.priceMin), roomsMin: n(v.roomsMin), roomsMax: n(v.roomsMax), areaMin: n(v.areaMin),
      features: (Array.isArray(v.features) ? v.features : []).filter(x => x && F[x.id] && (!F[x.id].deal || F[x.id].deal === (v.deal === 'buy' ? 'buy' : 'rent'))).map(x => ({id: x.id, must: !!x.must})),
      viewMin: n(v.viewMin) && n(v.viewMin) > 0 ? Math.min(9.5, n(v.viewMin)) : null,
      lake: [1, 2, 3].includes(+v.lake) ? +v.lake : 0,
      commute: (Array.isArray(v.commute) ? v.commute : []).filter(x => x && T[x.to] && MODES[x.mode] && n(x.max) > 0).slice(0, 3).map(x => ({to: x.to, mode: x.mode, max: Math.min(180, Math.max(5, Math.round(n(x.max))))})),
      moveBy: MOVE_TXT[v.moveBy] ? v.moveBy : 'any',
      text: String(text || '')
    };
    c.features = c.features.filter((x, i, a) => a.findIndex(y => y.id === x.id) === i);
    c.summary = typeof v.summary === 'string' && v.summary.trim() ? v.summary.trim().slice(0, 240) : summarize(c);
    return c;
  }
  function summarize(c) {
    const p = [c.deal === 'buy' ? 'Kaufen' : 'Mieten'];
    p.push(c.places.length ? c.places.map(PLACE_NAME).join(' oder ') : 'in der ganzen Schweiz');
    if (c.roomsMin) p.push('ab ' + zi(c.roomsMin) + ' Zimmer');
    if (c.areaMin) p.push('ab ' + c.areaMin + ' m²');
    if (c.priceMax) p.push('bis ' + money(c.priceMax, c.deal));
    if (c.lake) p.push(['', 'Seeblick', 'breiter Seeblick', 'Seepanorama'][c.lake]);
    if (c.viewMin) p.push('gute Aussicht');
    if (c.features.length) p.push(c.features.map(x => F[x.id].label).join(', '));
    if (c.commute.length) p.push(c.commute.map(x => 'höchstens ' + x.max + ' Min. ' + MODES[x.mode] + ' zu ' + T[x.to].name).join(', '));
    if (c.moveBy !== 'any') p.push(MOVE_TXT[c.moveBy]);
    return p.join(', ') + '.';
  }

  /* ---------- every listing against the criteria ---------- */
  const tcache = new Map();
  function travelMin(l, q) {
    const k = l.id + '|' + q.to + '|' + q.mode;
    if (!tcache.has(k)) {
      const t = T[q.to], r = GEO.travel([l.x, l.y], [t.x, t.y], {lakeside: false, hilly: l.hill > 0.4, only: q.mode});
      tcache.set(k, q.mode === 'pt' ? r.ptR.min : q.mode === 'car' ? r.carR.normal : q.mode === 'bike' ? r.bikeR.min : r.walkR.min);
    }
    return tcache.get(k);
  }
  function checksFor(c) {
    const K = [], add = (id, label, must, w, ok, note) => K.push({id, label, must, w, ok, note});
    if (c.priceMax) add('priceMax', 'Bis ' + money(c.priceMax, c.deal), true, 3, l => l.gross <= c.priceMax, l => money(l.gross, c.deal));
    if (c.priceMin) add('priceMin', 'Ab ' + money(c.priceMin, c.deal), false, 1, l => l.gross >= c.priceMin, l => money(l.gross, c.deal));
    if (c.roomsMin) add('roomsMin', 'Ab ' + zi(c.roomsMin) + ' Zimmer', true, 3, l => l.rooms >= c.roomsMin, l => zi(l.rooms) + ' Zimmer');
    if (c.roomsMax) add('roomsMax', 'Bis ' + zi(c.roomsMax) + ' Zimmer', false, 1, l => l.rooms <= c.roomsMax, l => zi(l.rooms) + ' Zimmer');
    if (c.areaMin) add('areaMin', 'Ab ' + c.areaMin + ' m²', true, 2, l => l.m2 >= c.areaMin, l => l.m2 + ' m²');
    for (const x of c.features) { const f = F[x.id]; add('f:' + x.id, f.label, x.must, x.must ? 2 : 1, l => !!f.test(l), null); }
    if (c.lake) add('lake', ['', 'Seeblick', 'Breiter Seeblick', 'Seepanorama'][c.lake], true, 2, l => l.vLake >= c.lake && !l.riverView, l => l.vLake ? ['', 'See: ein Streifen', 'See breit', 'Seepanorama'][l.vLake] : 'Kein Seeblick');
    if (c.viewMin) add('view', 'Aussicht ab ' + c.viewMin.toFixed(1), false, 2, l => l.view >= c.viewMin, l => 'Aussicht ' + l.view.toFixed(1));
    for (const q of c.commute) add('to:' + q.to, 'Höchstens ' + q.max + ' Min. ' + MODES[q.mode] + ' zu ' + T[q.to].name, true, 3, l => travelMin(l, q) <= q.max, l => travelMin(l, q) + ' Min. ' + MODES[q.mode]);
    if (c.moveBy !== 'any') add('move', MOVE_TXT[c.moveBy], false, 1, l => l.availTime == null || l.availTime <= MOVE[c.moveBy], l => 'Einzug ' + DATA.availShort(l));
    return K;
  }
  function match(c) {
    const ids = c.places.length ? c.places : Object.keys(PL);
    const pool = ids.flatMap(id => CITIES.place(id)).filter(l => l.deal === c.deal);
    const checks = checksFor(c), W = checks.reduce((a, k) => a + k.w, 0) || 1;
    const hits = pool.map(l => {
      const res = checks.map(k => ({k, ok: k.ok(l), note: k.note ? k.note(l) : ''}));
      const got = res.reduce((a, r) => a + (r.ok ? r.k.w : 0), 0);
      return {l, res, mustMiss: res.filter(r => r.k.must && !r.ok).length, fit: Math.round(got / W * 100)};
    });
    const order = (a, b) => b.fit - a.fit || b.l.base - a.l.base;
    /* near holds the 30 closest; near.total says how many there are */
    const closeBy = hits.filter(h => h.mustMiss > 0 && h.mustMiss <= 2).sort((a, b) => a.mustMiss - b.mustMiss || order(a, b)), near = closeBy.slice(0, 30);
    near.total = closeBy.length;
    return {exact: hits.filter(h => h.mustMiss === 0).sort(order), near, checks, total: pool.length};
  }
  function chips(c) {
    const out = [{id: 'deal', label: c.deal === 'buy' ? 'Kaufen' : 'Mieten', must: true}];
    out.push({id: 'places', label: c.places.length ? c.places.map(PLACE_NAME).join(' oder ') : 'Ganze Schweiz', must: true});
    for (const k of checksFor(c)) out.push({id: k.id, label: k.label, must: k.must});
    return out;
  }

  /* ---------- for the pages that show the results ---------- */
  const title = l => CITIES.title(l, l.place === 'geneve' || l.place === 'lausanne' || l.place === 'leman' ? 'fr' : 'de');
  const price = l => DATA.fmt.price(l);
  const per = l => l.deal === 'rent' ? '/ Mt. inkl. NK' : '';
  const facts = l => zi(l.rooms) + ' Zi. · ' + l.m2 + ' m² · ' + (l.floor === 0 ? 'EG' : l.floor + '. OG');
  const where = l => l.quarter + (l.place && l.place !== 'zuerich' ? ' · ' + PLACE_NAME(l.place) : ' · Zürich');
  const keys = l => ['view:day', l.eve ? 'view:golden' : 'view:night', 'room:wohnen', l.outdoor ? 'room:aussen' : 'house:day'];
  const img = (l, key) => SCENE.img(l, key || 'view:day');

  G.DREAM = {EXAMPLES, understand, match, chips, title, price, per, facts, where, keys, img, money, PLACE_NAME, MODES};
})(window);
