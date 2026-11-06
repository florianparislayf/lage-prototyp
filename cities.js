/* cities.js — sample listings for the other places of the site: cities, regions and lakes outside Zürich.
   They are copies of the generated Zürich samples with new places, streets and prices, so the pictures, the view
   analysis and every feature keep working. Deterministic: the static pages and the browser build the same listings.
   All values are example data. */
(function (G) {
  'use strict';
  const {LISTINGS, EQUITY, INCOME_FACTOR} = G.DATA;
  const hid = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const STREETS = ['Bahnhofstrasse', 'Dorfstrasse', 'Kirchweg', 'Rebbergstrasse', 'Feldstrasse', 'Lindenweg', 'Sonnenbergstrasse', 'Gartenstrasse', 'Schulstrasse', 'Mühleweg', 'Bergstrasse', 'Wiesenweg'];
  const SHORE = ['Seestrasse', 'Seeweg', 'Uferweg', 'Seeblickstrasse'];
  /* water: what the view and the texts call the lake or river; river: lake views there become views of the river */
  const PLACES = {
    zuerich: {name: 'Zürich', lang: 'de', water: 'Zürichsee'},
    winterthur: {pre: 'wi', name: 'Winterthur', factor: 0.78, rent: 100, buy: 40, quarters: ['Altstadt', 'Veltheim', 'Töss', 'Wülflingen', 'Oberwinterthur', 'Seen', 'Mattenbach', 'Lind', 'Neuwiesen'], streets: ['Technikumstrasse', 'Wartstrasse', 'Zürcherstrasse', 'Schaffhauserstrasse', 'Tösstalstrasse', 'Frauenfelderstrasse', 'Seenerstrasse', 'Rychenbergstrasse', 'Lindstrasse']},
    basel: {pre: 'bs', name: 'Basel', factor: 0.88, rent: 130, buy: 50, water: 'Rhein', river: true, quarters: ['Grossbasel', 'Kleinbasel', 'St. Johann', 'Gundeldingen', 'Bachletten', 'Breite', 'Clara', 'Matthäus', 'Iselin', 'Wettstein', 'St. Alban', 'Gotthelf'], streets: ['Rheinsprung', 'Elsässerstrasse', 'Güterstrasse', 'Holeestrasse', 'Klybeckstrasse', 'Wettsteinallee', 'Gellertstrasse', 'Bärenfelserstrasse', 'Hegenheimerstrasse', 'Oberer Rheinweg', 'St. Alban-Vorstadt', 'Feldbergstrasse']},
    bern: {pre: 'be', name: 'Bern', factor: 0.84, rent: 130, buy: 50, water: 'Aare', river: true, quarters: ['Altstadt', 'Länggasse', 'Breitenrain', 'Kirchenfeld', 'Mattenhof', 'Lorraine', 'Wankdorf', 'Bümpliz', 'Marzili', 'Holligen', 'Weissenbühl'], streets: ['Kramgasse', 'Länggassstrasse', 'Breitenrainstrasse', 'Thunstrasse', 'Effingerstrasse', 'Lorrainestrasse', 'Papiermühlestrasse', 'Bümplizstrasse', 'Aarstrasse', 'Seftigenstrasse', 'Monbijoustrasse']},
    luzern: {pre: 'lu', name: 'Luzern', factor: 0.92, rent: 110, buy: 50, water: 'Vierwaldstättersee', lake: true, quarters: ['Altstadt', 'Tribschen', 'Würzenbach', 'Wesemlin', 'Maihof', 'Allmend', 'Neustadt', 'Hirschmatt', 'Littau', 'Seeburg'], streets: ['Haldenstrasse', 'Tribschenstrasse', 'Bürgenstrasse', 'Zürichstrasse', 'Obergrundstrasse', 'Hirschmattstrasse', 'Seeburgstrasse', 'Horwerstrasse', 'Maihofstrasse', 'Würzenbachstrasse']},
    zug: {pre: 'zg', name: 'Zug', factor: 1.12, rent: 90, buy: 50, water: 'Zugersee', lake: true, quarters: ['Altstadt', 'Oberwil', 'Guthirt', 'Herti', 'Lorzen', 'Zugerberg', 'Letzi', 'Rötel'], streets: ['Artherstrasse', 'Chamerstrasse', 'Baarerstrasse', 'Zugerbergstrasse', 'Hofstrasse', 'Aegeristrasse', 'Oberwilerstrasse', 'Gotthardstrasse']},
    stgallen: {pre: 'sg', name: 'St. Gallen', factor: 0.7, rent: 90, buy: 30, quarters: ['Altstadt', 'St. Fiden', 'Rotmonten', 'Langgasse', 'Lachen', 'Riethüsli', 'Bruggen', 'Neudorf'], streets: ['Rorschacher Strasse', 'Teufener Strasse', 'Langgasse', 'Rosenbergstrasse', 'Zürcher Strasse', 'Notkerstrasse', 'Kesslerstrasse', 'Vadianstrasse']},
    aargau: {pre: 'ag', name: 'Aargau', region: true, factor: 0.72, rent: 50, buy: 70, houses: 0.6, quarters: ['Aarau', 'Baden', 'Wettingen', 'Lenzburg', 'Brugg', 'Rheinfelden', 'Wohlen', 'Zofingen', 'Muri', 'Bremgarten']},
    thurgau: {pre: 'tg', name: 'Thurgau', region: true, factor: 0.62, rent: 40, buy: 60, houses: 0.65, quarters: ['Frauenfeld', 'Kreuzlingen', 'Weinfelden', 'Arbon', 'Amriswil', 'Romanshorn', 'Bischofszell', 'Sirnach']},
    zuerichsee: {pre: 'zs', name: 'Zürichsee', region: true, lake: true, water: 'Zürichsee', factor: 1.15, rent: 50, buy: 50, shore: 0.7, houses: 0.4, quarters: ['Küsnacht', 'Meilen', 'Stäfa', 'Thalwil', 'Horgen', 'Wädenswil', 'Rapperswil', 'Kilchberg', 'Erlenbach', 'Herrliberg']},
    zugersee: {pre: 'zgs', name: 'Zugersee', region: true, lake: true, water: 'Zugersee', factor: 1.1, rent: 35, buy: 40, shore: 0.7, houses: 0.4, quarters: ['Zug', 'Cham', 'Walchwil', 'Risch', 'Oberwil', 'Hünenberg', 'Immensee']},
    vierwaldstaettersee: {pre: 'vw', name: 'Vierwaldstättersee', region: true, lake: true, water: 'Vierwaldstättersee', factor: 0.98, rent: 35, buy: 40, shore: 0.7, houses: 0.4, quarters: ['Weggis', 'Vitznau', 'Meggen', 'Hergiswil', 'Brunnen', 'Küssnacht', 'Horw', 'Kastanienbaum']},
    bielersee: {pre: 'bi', name: 'Bielersee', region: true, lake: true, water: 'Bielersee', factor: 0.8, rent: 20, buy: 35, shore: 0.7, houses: 0.5, quarters: ['Biel', 'Nidau', 'Twann', 'Ligerz', 'Erlach', 'La Neuveville', 'Tüscherz', 'Sutz']},
    bodensee: {pre: 'bo', name: 'Bodensee', region: true, lake: true, water: 'Bodensee', factor: 0.75, rent: 20, buy: 35, shore: 0.7, houses: 0.5, quarters: ['Kreuzlingen', 'Romanshorn', 'Arbon', 'Rorschach', 'Altnau', 'Güttingen', 'Steckborn', 'Ermatingen']},
    geneve: {pre: 'ge', name: 'Genève', lang: 'fr', factor: 1.1, rent: 110, buy: 40, lake: true, water: 'Léman', quarters: ['Eaux-Vives', 'Plainpalais', 'Pâquis', 'Carouge', 'Champel', 'Servette', 'Petit-Saconnex', 'Cologny', 'Florissant', 'Jonction'], streets: ['Rue du Rhône', 'Quai Gustave-Ador', 'Rue de Carouge', 'Avenue de Champel', 'Rue de Lausanne', 'Rue de la Servette', 'Route de Florissant', 'Boulevard Carl-Vogt', 'Rue des Eaux-Vives', 'Avenue de Miremont']},
    lausanne: {pre: 'la', name: 'Lausanne', lang: 'fr', factor: 0.98, rent: 110, buy: 40, lake: true, water: 'Léman', quarters: ['Ouchy', 'Sous-Gare', 'Flon', 'Chailly', 'Montriond', 'Bellevaux', 'Pully', 'Malley', 'Cour', 'Sallaz'], streets: ['Avenue d’Ouchy', 'Avenue de Cour', 'Rue de Bourg', 'Avenue de Rumine', 'Chemin de Montriond', 'Avenue de Chailly', 'Rue du Valentin', 'Avenue de Morges', 'Chemin de Bellerive', 'Avenue des Bains']},
    leman: {pre: 'lm', name: 'Léman', lang: 'fr', region: true, lake: true, water: 'Léman', factor: 1.05, rent: 0, buy: 40, shore: 0.8, houses: 0.5, quarters: ['Nyon', 'Rolle', 'Morges', 'Lutry', 'Vevey', 'Montreux', 'Coppet', 'Versoix', 'Saint-Prex', 'La Tour-de-Peilz'], streets: ['Quai de la Veveyse', 'Route du Lac', 'Chemin du Bord-du-Lac', 'Grand-Rue', 'Avenue du Général-Guisan', 'Chemin des Vignes', 'Quai Perdonnet', 'Rue du Lac']}
  };
  const Q = {
    winterthur: {Altstadt: [8.729, 47.499], Veltheim: [8.713, 47.511], 'Töss': [8.705, 47.488], 'Wülflingen': [8.690, 47.510], Oberwinterthur: [8.758, 47.508], Seen: [8.765, 47.484], Mattenbach: [8.748, 47.495], Lind: [8.735, 47.503], Neuwiesen: [8.718, 47.502]},
    basel: {Grossbasel: [7.588, 47.557], Kleinbasel: [7.596, 47.564], 'St. Johann': [7.578, 47.567], Gundeldingen: [7.595, 47.543], Bachletten: [7.573, 47.548], Breite: [7.613, 47.552], Clara: [7.596, 47.565], 'Matthäus': [7.592, 47.569], Iselin: [7.567, 47.558], Wettstein: [7.601, 47.560], 'St. Alban': [7.602, 47.551], Gotthelf: [7.570, 47.553]},
    bern: {Altstadt: [7.452, 46.948], 'Länggasse': [7.430, 46.955], Breitenrain: [7.455, 46.960], Kirchenfeld: [7.452, 46.940], Mattenhof: [7.428, 46.943], Lorraine: [7.448, 46.957], Wankdorf: [7.465, 46.963], 'Bümpliz': [7.390, 46.945], Marzili: [7.444, 46.944], Holligen: [7.420, 46.940], 'Weissenbühl': [7.435, 46.935]},
    luzern: {Altstadt: [8.305, 47.052], Tribschen: [8.313, 47.042], 'Würzenbach': [8.340, 47.057], Wesemlin: [8.316, 47.060], Maihof: [8.320, 47.062], Allmend: [8.300, 47.035], Neustadt: [8.302, 47.046], Hirschmatt: [8.305, 47.047], Littau: [8.265, 47.050], Seeburg: [8.335, 47.052]},
    zug: {Altstadt: [8.516, 47.166], Oberwil: [8.508, 47.145], Guthirt: [8.520, 47.178], Herti: [8.506, 47.177], Lorzen: [8.512, 47.183], Zugerberg: [8.538, 47.155], Letzi: [8.522, 47.172], 'Rötel': [8.522, 47.165]},
    stgallen: {Altstadt: [9.377, 47.424], 'St. Fiden': [9.393, 47.432], Rotmonten: [9.385, 47.438], Langgasse: [9.394, 47.436], Lachen: [9.360, 47.419], 'Riethüsli': [9.366, 47.412], Bruggen: [9.336, 47.411], Neudorf: [9.405, 47.436]},
    aargau: {Aarau: [8.044, 47.392], Baden: [8.307, 47.473], Wettingen: [8.317, 47.466], Lenzburg: [8.175, 47.389], Brugg: [8.208, 47.481], Rheinfelden: [7.794, 47.554], Wohlen: [8.278, 47.351], Zofingen: [7.946, 47.288], Muri: [8.338, 47.274], Bremgarten: [8.341, 47.351]},
    thurgau: {Frauenfeld: [8.898, 47.556], Kreuzlingen: [9.175, 47.651], Weinfelden: [9.108, 47.567], Arbon: [9.433, 47.516], Amriswil: [9.297, 47.547], Romanshorn: [9.379, 47.566], Bischofszell: [9.239, 47.495], Sirnach: [8.998, 47.462]},
    zuerichsee: {'Küsnacht': [8.584, 47.318], Meilen: [8.646, 47.270], 'Stäfa': [8.723, 47.241], Thalwil: [8.565, 47.296], Horgen: [8.598, 47.260], 'Wädenswil': [8.671, 47.230], Rapperswil: [8.818, 47.226], Kilchberg: [8.546, 47.324], Erlenbach: [8.594, 47.304], Herrliberg: [8.614, 47.290]},
    zugersee: {Zug: [8.516, 47.166], Cham: [8.462, 47.182], Walchwil: [8.517, 47.101], Risch: [8.468, 47.134], Oberwil: [8.508, 47.145], 'Hünenberg': [8.426, 47.174], Immensee: [8.465, 47.096]},
    vierwaldstaettersee: {Weggis: [8.432, 47.032], Vitznau: [8.484, 47.011], Meggen: [8.374, 47.046], Hergiswil: [8.309, 46.985], Brunnen: [8.605, 46.995], 'Küssnacht': [8.440, 47.083], Horw: [8.310, 47.017], Kastanienbaum: [8.334, 47.007]},
    bielersee: {Biel: [7.247, 47.137], Nidau: [7.240, 47.125], Twann: [7.158, 47.094], Ligerz: [7.135, 47.084], Erlach: [7.097, 47.042], 'La Neuveville': [7.098, 47.065], 'Tüscherz': [7.199, 47.116], Sutz: [7.217, 47.104]},
    bodensee: {Kreuzlingen: [9.175, 47.651], Romanshorn: [9.379, 47.566], Arbon: [9.433, 47.516], Rorschach: [9.490, 47.478], Altnau: [9.262, 47.610], 'Güttingen': [9.290, 47.604], Steckborn: [8.982, 47.669], Ermatingen: [9.085, 47.670]},
    geneve: {'Eaux-Vives': [6.160, 46.202], Plainpalais: [6.140, 46.196], 'Pâquis': [6.148, 46.212], Carouge: [6.140, 46.183], Champel: [6.155, 46.192], Servette: [6.130, 46.213], 'Petit-Saconnex': [6.125, 46.222], Cologny: [6.180, 46.218], Florissant: [6.162, 46.192], Jonction: [6.132, 46.201]},
    lausanne: {Ouchy: [6.627, 46.507], 'Sous-Gare': [6.630, 46.512], Flon: [6.630, 46.521], Chailly: [6.655, 46.528], Montriond: [6.619, 46.514], Bellevaux: [6.637, 46.537], Pully: [6.661, 46.511], Malley: [6.605, 46.527], Cour: [6.620, 46.512], Sallaz: [6.645, 46.535]},
    leman: {Nyon: [6.239, 46.383], Rolle: [6.337, 46.459], Morges: [6.498, 46.511], Lutry: [6.686, 46.502], Vevey: [6.843, 46.461], Montreux: [6.912, 46.433], Coppet: [6.191, 46.316], Versoix: [6.163, 46.284], 'Saint-Prex': [6.459, 46.480], 'La Tour-de-Peilz': [6.858, 46.453]}
  };
  /* water as drawn on the map: the detailed Zürichsee inside the Zürich area, Natural Earth lakes outside it */
  const ZH_BOX = (x, y) => x >= 0 && x <= 730 && y >= 0 && y <= 1000;
  const LAKES = (G.SWISS ? G.SWISS.lakes.fine : '').split('M').filter(Boolean).map(s => {
    const pts = s.replace('Z', '').split('L').map(p => p.trim().split(' ').map(Number));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    return {pts, b: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]};
  });
  const wet = (x, y) => ZH_BOX(x, y) ? G.GEO.inPoly(x, y, G.GEO.LAKE) : LAKES.some(r => x >= r.b[0] && x <= r.b[2] && y >= r.b[1] && y <= r.b[3] && G.GEO.inPoly(x, y, r.pts));
  /* the nearest point of a shore, for houses on the lake */
  function shore(x, y) {
    let best = null, bd = Infinity;
    const rings = ZH_BOX(x, y) ? [G.GEO.LAKE] : LAKES.filter(r => x >= r.b[0] - 400 && x <= r.b[2] + 400 && y >= r.b[1] - 400 && y <= r.b[3] + 400).map(r => r.pts);
    for (const pts of rings) for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length], dx = x2 - x1, dy = y2 - y1, q = dx * dx + dy * dy;
      const t = q ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / q)) : 0, px = x1 + t * dx, py = y1 + t * dy, d = Math.hypot(x - px, y - py);
      if (d < bd) { bd = d; best = [px, py]; }
    }
    return best;
  }
  /* a spot for a copy: around its quarter or town; on the lake shore when it stands on the lake; never in the water */
  function locate(l, placeId, R) {
    const ll = (Q[placeId] || {})[l.quarter];
    if (!ll) return;
    const [cx, cy] = G.GEO.proj(ll[0], ll[1]), P = PLACES[placeId], spread = P.region ? 60 : 36;
    l.sx = l.x; l.sy = l.y;
    if (P.lake && (l.lakeFront || l.atLake)) {
      const s = shore(cx, cy);
      if (s) {
        const dx = cx - s[0], dy = cy - s[1], d = Math.hypot(dx, dy) || 1, off = l.lakeFront ? 4 : 8 + R() * 10, along = (R() - 0.5) * 70;
        let x = s[0] + dx / d * off - dy / d * along, y = s[1] + dy / d * off + dx / d * along;
        const s2 = shore(x, y);
        if (s2) { const ex = x - s2[0], ey = y - s2[1], e = Math.hypot(ex, ey) || 1; x = s2[0] + ex / e * off; y = s2[1] + ey / e * off; if (wet(x, y)) { x = s2[0] - ex / e * off; y = s2[1] - ey / e * off; } }
        if (!wet(x, y)) { l.x = x; l.y = y; return; }
      }
    }
    const a = R() * Math.PI * 2, r = Math.sqrt(R()) * spread;
    let k = 1;
    for (let i = 0; i < 5; i++, k /= 2) { const x = cx + Math.cos(a) * r * k, y = cy + Math.sin(a) * r * k; if (!wet(x, y)) { l.x = x; l.y = y; return; } }
    /* the quarter's own point lies in the coarse lake outline (Ouchy, Vevey …): the nearest dry spot around it */
    for (let rr = 12; rr <= 400; rr *= 1.5) for (let j = 0; j < 16; j++) {
      const b = a + j * Math.PI / 8, x = cx + Math.cos(b) * rr, y = cy + Math.sin(b) * rr;
      if (!wet(x, y)) { l.x = x; l.y = y; return; }
    }
    l.x = cx; l.y = cy;
  }
  const SOURCES = LISTINGS.filter(l => l.id[0] === 'g');
  const isHouse = l => l.kind === 'reihen' || l.kind === 'villa';
  const water = l => l.sees.includes('See');
  /* weighted sampling without replacement (Efraimidis–Spirakis): the same picks on every page and at build time */
  function pick(placeId, P, deal) {
    const R = rng(hid(placeId + '|' + deal)), n = P[deal] || 0;
    const ok = l => l.deal === deal && (P.lake || P.river || !water(l));
    const w = l => 1 + (P.shore && l.atLake ? P.shore * 10 : 0) + (P.shore && water(l) ? P.shore * 3 : 0) + (P.houses && isHouse(l) ? P.houses * 12 : 0) + (P.river && (l.atRiver || water(l)) ? 2 : 0);
    return SOURCES.filter(ok).map(l => ({l, k: Math.pow(R(), 1 / w(l))})).sort((a, b) => b.k - a.k).slice(0, n).map(x => x.l);
  }
  const swap = (s, from, to) => s.split(from).join(to);
  /* the texts name the Zürichsee; the Aare is feminine, so its article changes with it */
  const AARE = [['den Zürichsee', 'die Aare'], ['dem Zürichsee', 'der Aare'], ['am Zürichsee', 'an der Aare'], ['zum Zürichsee', 'zur Aare'], ['vom Zürichsee', 'von der Aare']];
  const toWater = (s, w) => swap(w === 'Aare' ? AARE.reduce((t, [a, b]) => swap(t, a, b), s) : s, 'Zürichsee', w);
  function clone(src, placeId, P) {
    const l = Object.assign({}, src), R = rng(hid(placeId + '|' + src.id));
    l.sees = src.sees.slice();
    const q = P.quarters[Math.floor(R() * P.quarters.length)], streets = P.streets || (P.lake && R() < 0.4 ? SHORE : STREETS);
    l.id = P.pre + '-' + src.id;
    l.place = placeId;
    l.quarter = q;
    l.locality = P.region ? P.name : P.lang === 'fr' ? P.name : P.name;
    l.street = streets[Math.floor(R() * streets.length)] + ' ' + (1 + Math.floor(R() * 140));
    const f = P.factor * (0.94 + R() * 0.12), rent = l.deal === 'rent';
    if (rent) { l.price = Math.round(src.price * f / 10) * 10; l.nk = Math.round(src.nk * (0.85 + 0.15 * P.factor) / 10) * 10; l.fair = Math.round(src.fair * f / 10) * 10; l.drop = Math.round(src.drop * f / 10) * 10; }
    else { l.price = Math.round(src.price * f / 10000) * 10000; l.fair = Math.round(src.fair * f / 10000) * 10000; l.drop = Math.round(src.drop * f / 10000) * 10000; }
    l.gross = rent ? l.price + l.nk : l.price;
    l.equity = rent ? 0 : Math.round(l.price * EQUITY / 1000) * 1000;
    l.income = rent ? l.gross * 36 : Math.round(l.price * INCOME_FACTOR / 1000) * 1000;
    l.monthly = rent ? l.gross : Math.round(src.monthly * f / 10) * 10;
    l.hist = l.drop ? [l.price + l.drop, l.price] : [l.price];
    l.water = P.water || null;
    /* the lake or river in the texts; in river towns a lake view is a view of the river */
    const lakeWord = P.river ? 'Blick auf ' + (P.water === 'Aare' ? 'die ' : 'den ') + P.water : 'Seesicht';
    for (const k of ['title', 'ai', 'caveat']) {
      let s = swap(String(l[k] || ''), src.quarter, q);
      if (P.water) s = toWater(s, P.water);
      if (P.river) s = swap(swap(s, 'mit Seesicht', 'mit ' + P.water + 'blick'), 'Seesicht', lakeWord);
      l[k] = s;
    }
    l.riverView = !!P.river && water(src);
    if (!P.lake) { l.atLake = false; l.lakeFront = false; l.boat = false; }
    if (!P.river && !(placeId === 'zuerich')) l.atRiver = false;
    /* around the lakes, about half the houses for sale stand on the shore */
    if (P.shore && !rent && isHouse(l) && R() < 0.55) {
      l.atLake = true; l.lakeFront = true; l.boat = R() < 0.5; l.type = 'haus';
      if (!l.sees.includes('See')) l.sees.push('See');
      l.vLake = Math.max(l.vLake, 2); l.vLakeDeg = Math.max(l.vLakeDeg, 35);
      l.title = (src.kind === 'villa' ? 'Villa' : 'Haus') + ' mit Seeanstoss' + (l.boat ? ' und Bootsplatz' : '') + ' in ' + q;
    }
    if (P.houses && isHouse(l)) { l.plot = Math.round(l.plot * (1.2 + R() * 1.4) / 10) * 10; l.umschwung = l.plot >= 800; l.einlieger = !rent && (l.einlieger || R() < 0.25); l.pool = l.pool || R() < 0.12; }
    if (P.lang === 'fr') l.title = title(l, 'fr');
    locate(l, placeId, R);
    return l;
  }
  /* French and English titles for the pages in those languages */
  const FR = {wohnung: 'Appartement', studio: 'Studio', dach: 'Appartement sous les toits', attika: 'Attique', loft: 'Loft', haus: 'Maison'};
  const EN = {wohnung: 'apartment', studio: 'Studio', dach: 'Top-floor apartment', attika: 'Penthouse', loft: 'Loft', haus: 'House'};
  function title(l, lang) {
    if (lang === 'fr') {
      if (l.lakeFront) return 'Maison pieds dans l’eau' + (l.boat ? ' avec place d’amarrage' : '') + ' à ' + l.quarter;
      const feat = l.vLake >= 2 ? 'avec vue sur le lac' : l.garden ? 'avec jardin' : l.roofTerrace ? 'avec grande terrasse' : l.pool ? 'avec piscine' : l.year < 1930 ? 'ancien avec cachet' : l.view >= 7.5 ? 'avec belle vue' : l.isNew ? 'neuf et lumineux' : 'lumineux';
      const head = FR[l.type] || 'Appartement';
      return head + (l.type === 'studio' ? '' : ' ' + String(l.rooms).replace('.', ',') + ' pièces') + ' ' + feat;
    }
    if (lang === 'en') {
      const feat = l.vLake >= 2 ? 'with lake view' : l.wm ? 'with own washing machine' : l.garden ? 'with garden' : l.bathtub ? 'with bathtub' : l.view >= 7.5 ? 'with a view' : l.isNew ? 'in a new building' : 'in ' + l.quarter;
      const head = l.type === 'wohnung' ? String(l.rooms) + '-room apartment' : EN[l.type] || 'Apartment';
      return head + ' ' + feat;
    }
    return l.title;
  }
  /* Zürich keeps its own listings; every other place gets copies, built the first time a page asks for that place */
  LISTINGS.forEach(l => { l.place = 'zuerich'; l.water = 'Zürichsee'; });
  const BY_PLACE = {zuerich: LISTINGS.slice()}, BY_ID = Object.fromEntries(LISTINGS.map(l => [l.id, l]));
  const PRE = {};
  for (const id in PLACES) if (PLACES[id].pre) PRE[PLACES[id].pre] = id;
  function place(id) {
    if (id === 'schweiz') return Object.keys(PLACES).flatMap(place);
    if (!BY_PLACE[id]) {
      const P = PLACES[id];
      if (!P) return [];
      BY_PLACE[id] = pick(id, P, 'rent').concat(pick(id, P, 'buy')).map(src => clone(src, id, P));
      for (const l of BY_PLACE[id]) BY_ID[l.id] = l;
    }
    return BY_PLACE[id];
  }
  const byId = id => { const pre = String(id).split('-')[0]; if (PRE[pre] && !BY_PLACE[PRE[pre]]) place(PRE[pre]); return BY_ID[id]; };
  /* the view texts and the panorama labels name the Zürichsee; elsewhere they name the local water */
  const localize = (l, s) => l.water && l.water !== 'Zürichsee' ? toWater(s, l.water) : s;
  G.CITIES = {PLACES, place, byId, all: () => place('schweiz'), title, localize};
})(window);
