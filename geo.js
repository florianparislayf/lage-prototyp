/* geo.js — stylised Zürich map (730 × 1000 units, north up, 1 unit ≈ 16.6 m) and commute models.
   Prototype with sample data: the transit network is a simplified sketch, not a timetable. */
(function (G) {
  'use strict';

  const UNIT_KM = 0.0166;
  const proj = (lon, lat) => [(lon - 8.46) / 0.16 * 730, (47.43 - lat) / 0.15 * 1000];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  const LAKE = [[366,428],[380,423],[395,426],[402,445],[410,470],[423,495],[436,507],[450,525],[466,548],[485,575],[503,612],[521,655],[540,700],[556,735],[572,770],[593,820],[620,860],[660,900],[703,933],[730,955],[730,1000],[530,1000],[500,945],[488,913],[462,870],[443,833],[425,790],[410,750],[401,720],[388,680],[370,640],[352,600],[343,565],[341,530],[346,500],[354,470],[360,445]];
  const FOREST = [
    [[108,470],[150,440],[196,452],[218,500],[232,560],[236,630],[230,700],[218,780],[204,860],[190,940],[182,1000],[84,1000],[96,920],[108,840],[116,760],[118,680],[114,600],[108,530]],
    [[468,262],[515,232],[575,220],[640,232],[690,262],[705,318],[676,362],[612,374],[560,360],[515,334],[484,302]],
    [[188,152],[230,128],[286,126],[332,140],[348,165],[326,190],[280,202],[232,196],[202,180]],
    [[262,612],[300,600],[320,626],[306,662],[270,670],[254,642]],
    [[640,600],[700,575],[730,590],[730,780],[690,760],[655,700]]
  ];
  const ROADS = [
    [[255,440],[258,380],[260,300],[285,262],[310,230],[322,190],[345,150]],
    [[350,365],[300,350],[250,335],[200,318],[135,295],[60,275],[0,262]],
    [[352,452],[340,520],[338,580],[367,660],[396,738],[432,820],[458,875],[512,1000]],
    [[402,432],[416,478],[446,515],[482,560],[514,622],[542,690],[566,744],[592,795],[622,845],[668,885],[712,922],[730,940]],
    [[375,335],[415,300],[455,268],[505,230],[560,190],[640,140],[730,95]],
    [[410,420],[455,445],[510,465],[570,490],[650,520],[730,545]],
    [[352,372],[305,398],[260,425],[215,460],[170,500],[110,550],[40,610]],
    [[372,322],[376,260],[382,200],[388,130],[393,60],[396,0]]
  ];
  const MOTORWAY = [[0,120],[80,100],[160,82],[260,72],[360,64],[460,58],[560,52],[730,40]];
  const RAIL = [
    [[367,347],[330,330],[295,315],[260,300],[215,285],[175,272],[135,260],[70,243],[0,225]],
    [[367,347],[355,320],[335,285],[317,247],[328,205],[355,160],[386,123],[395,60],[400,0]],
    [[367,347],[390,385],[405,424],[436,478],[468,530],[503,575],[528,613],[556,680],[588,749],[612,800],[644,853],[684,890],[726,920],[730,923]],
    [[367,347],[330,370],[290,391],[325,439],[333,500],[333,549],[360,630],[386,705],[405,770],[423,829],[470,897],[515,1000]],
    [[340,372],[305,440],[292,515],[285,560],[262,620],[258,665],[282,745],[300,790],[310,830]]
  ];
  const LIMMAT = [[381,424],[378,405],[376,390],[379,372],[380,357],[373,338],[366,323],[352,305],[335,287],[322,268],[312,250],[292,242],[270,237],[250,233],[225,226],[200,219],[170,213],[140,208],[110,203],[80,195],[45,183],[0,167]];
  const SIHL = [[365,1000],[362,947],[335,880],[310,830],[297,793],[282,745],[262,700],[252,667],[262,620],[283,567],[292,515],[297,470],[306,440],[319,413],[333,388],[342,360],[355,340],[366,323]];

  const line = pts => 'M' + pts.map(p => p[0] + ',' + p[1]).join('L');
  const poly = pts => line(pts) + 'Z';
  function inPoly(x, y, pts) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  const onLand = (x, y) => !inPoly(x, y, LAKE) && !FOREST.some(f => inPoly(x, y, f));
  function segDist(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }
  const polyDist = (p, pts) => { let m = Infinity; for (let i = 1; i < pts.length; i++) m = Math.min(m, segDist(p, pts[i - 1], pts[i])); return m; };
  const roadDist = p => Math.min(...ROADS.map(r => polyDist(p, r)));
  const railDist = p => Math.min(...RAIL.map(r => polyDist(p, r)));
  function lakeBearing(p) {
    let best = null, bd = Infinity;
    for (const q of LAKE) { const d = dist(p, q); if (d < bd) { bd = d; best = q; } }
    const a = Math.atan2(best[0] - p[0], -(best[1] - p[1])) * 180 / Math.PI;
    return { deg: (a + 360) % 360, dist: bd };
  }

  /* Street fabric: rotated grids per district, partitioned Voronoi-style. [cx, cy, radius, angle, spacing] */
  const DISTRICTS = [[300,330,70,-28,12],[245,285,55,-32,12],[385,388,34,8,9],[272,412,60,14,13],[332,468,40,-18,12],[402,290,52,18,13],[312,232,46,-8,13],[386,128,62,4,14],[448,472,44,32,12],[462,395,44,-14,14],[150,275,66,-20,15],[196,215,42,10,16],[318,585,48,0,15],[515,615,36,28,15],[386,724,34,10,14],[584,745,40,24,15],[290,796,46,0,15],[468,912,40,20,15],[492,330,30,-10,15],[488,150,58,12,15],[318,92,48,-6,15],[196,352,48,-12,15],[236,466,40,6,15],[506,446,40,20,15],[262,700,30,0,15],[432,826,30,24,15],[612,836,34,30,15],[422,212,40,-24,14]];
  const STREETS = (() => {
    let d = '';
    const near = (x, y) => { let bi = -1, bv = 1; DISTRICTS.forEach((q, i) => { const v = Math.hypot(x - q[0], y - q[1]) / q[2]; if (v < bv) { bv = v; bi = i; } }); return bi; };
    DISTRICTS.forEach(([cx, cy, rad, ang, sp], i) => {
      const a = ang * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      for (const rot of [0, 1]) {
        for (let o = -rad + sp / 2; o < rad; o += sp) {
          const h = Math.sqrt(rad * rad - o * o), ts = [];
          for (let t = -h; t < h; t += sp / 3) ts.push(t);
          ts.push(h);
          let start = null, prev = null;
          const flush = () => { if (start && prev !== start) d += 'M' + start[0].toFixed(0) + ',' + start[1].toFixed(0) + 'L' + prev[0].toFixed(0) + ',' + prev[1].toFixed(0); start = prev = null; };
          for (const t of ts) {
            const u = rot ? o : t, v = rot ? t : o, x = cx + u * ca - v * sa, y = cy + u * sa + v * ca;
            if (near(x, y) === i && onLand(x, y)) { if (!start) start = [x, y]; prev = [x, y]; } else flush();
          }
          flush();
        }
      }
    });
    return d;
  })();

  const MAP = {
    lake: poly(LAKE),
    forest: FOREST.map(poly).join(''),
    streets: STREETS,
    roads: ROADS.map(line).join(''),
    motorway: line(MOTORWAY),
    rail: RAIL.map(line).join(''),
    limmat: line(LIMMAT),
    sihl: line(SIHL)
  };
  const LABELS = [
    {t:'Zürich-West',x:212,y:304,k:'q'},{t:'Kreis 4',x:318,y:362,k:'q'},{t:'Altstadt',x:396,y:384,k:'q'},{t:'Wiedikon',x:262,y:414,k:'q'},
    {t:'Enge',x:312,y:472,k:'q'},{t:'Seefeld',x:460,y:470,k:'q'},{t:'Hottingen',x:486,y:420,k:'q'},{t:'Fluntern',x:506,y:306,k:'q'},
    {t:'Unterstrass',x:408,y:262,k:'q'},{t:'Wipkingen',x:298,y:214,k:'q'},{t:'Oerlikon',x:412,y:96,k:'q'},{t:'Höngg',x:170,y:238,k:'q'},
    {t:'Altstetten',x:110,y:284,k:'q'},{t:'Wollishofen',x:290,y:616,k:'q'},{t:'Zollikon',x:542,y:592,k:'q'},{t:'Kilchberg',x:362,y:752,k:'q'},
    {t:'Küsnacht',x:604,y:720,k:'q'},{t:'Adliswil',x:250,y:832,k:'q'},{t:'Thalwil',x:440,y:942,k:'q'},{t:'Schwamendingen',x:500,y:122,k:'q'},
    {t:'Albisrieden',x:190,y:378,k:'q'},{t:'Hirslanden',x:520,y:470,k:'q'},
    {t:'Zürichsee',x:468,y:690,k:'w'},{t:'Uetliberg',x:160,y:600,k:'h'},{t:'Zürichberg',x:592,y:292,k:'h'}
  ];
  function nearestQuarter(x, y) {
    let best = null, bd = Infinity;
    for (const l of LABELS) if (l.k === 'q') { const d = Math.hypot(l.x - x, l.y - y); if (d < bd) { bd = d; best = l.t; } }
    return best;
  }
  function cone(x, y, dir, span, r) {
    const rad = d => d * Math.PI / 180, p = a => [x + Math.sin(rad(a)) * r, y - Math.cos(rad(a)) * r];
    const a = p(dir - span / 2), b = p(dir + span / 2);
    return 'M' + x.toFixed(1) + ',' + y.toFixed(1) + 'L' + a[0].toFixed(1) + ',' + a[1].toFixed(1) + 'A' + r + ',' + r + ' 0 ' + (span > 180 ? 1 : 0) + ',1 ' + b[0].toFixed(1) + ',' + b[1].toFixed(1) + 'Z';
  }

  /* ---------- Public transport: a sketch of the network (S-Bahn, tram, bus hubs) ---------- */
  const NODES = {
    HB:['Zürich HB',367,347], HARD:['Hardbrücke',260,300], ALT:['Altstetten',135,260], WIP:['Wipkingen',317,247],
    OER:['Oerlikon',386,123], FLU:['Flughafen',436,-188], STA:['Stadelhofen',405,424], TIE:['Tiefenbrunnen',463,530],
    ZOL:['Zollikon',520,613], KUS:['Küsnacht',588,749], WIE:['Wiedikon',290,391], ENG:['Enge',325,439],
    WOL:['Wollishofen',333,549], KIL:['Kilchberg',386,705], THA:['Thalwil',470,897], SEL:['Selnau',340,372],
    GIE:['Giesshübel',305,440], BRU:['Brunau',285,560], LEI:['Leimbach',258,665], ADL:['Adliswil',300,790],
    PAR:['Paradeplatz',362,402], BEL:['Bellevue',395,428], ESC:['Escher-Wyss-Platz',285,262], HTU:['Hardturm',205,250],
    STF:['Stauffacher',330,375], ALB:['Albisriederplatz',300,368], ALR:['Albisrieden',196,352], KRZ:['Kreuzplatz',432,440],
    HEG:['Hegibachplatz',470,450], BUR:['Burgwies',505,470], FEL:['Feldeggstrasse',430,470], ETH:['ETH/Universitätsspital',410,340],
    FLN:['Kirche Fluntern',470,345], ZOO:['Zoo',530,330], KUN:['Kunsthaus',410,398], ROE:['Römerhof',470,395],
    KLU:['Klusplatz',505,415], SHP:['Schaffhauserplatz',380,262], BUC:['Bucheggplatz',345,210], MIL:['Milchbuck',395,215],
    SWA:['Schwamendingerplatz',490,150], HOE:['Höngg',196,220], WPL:['Wipkingerplatz',305,250], MOR:['Morgental',322,585],
    FRI:['Friesenberg',245,465], LIN:['Lindenplatz',150,290], PFI:['Pfingstweidstrasse',240,280],
    SMW:['Schmiede Wiedikon',276,398], LAN:['Langstrasse',305,335]
  };
  const LINES = [
    {m:'S', s:['ALT','HARD','HB']},
    {m:'S', s:['HB','WIP','OER']},
    {m:'S', s:['HB','OER','FLU']},
    {m:'S', s:['HB','STA','TIE','ZOL','KUS']},
    {m:'S', s:['HB','WIE','ENG','WOL','KIL','THA']},
    {m:'S', s:['HB','SEL','GIE','BRU','LEI','ADL']},
    {m:'T', s:['HTU','PFI','ESC','HB','BEL','FEL','TIE']},
    {m:'T', s:['MOR','ENG','PAR','HB','SHP','MIL','SWA']},
    {m:'T', s:['ALR','ALB','STF','PAR','BEL','KRZ','HEG','BUR']},
    {m:'T', s:['HB','ETH','FLN','ZOO']},
    {m:'T', s:['BEL','KUN','ROE','KLU']},
    {m:'T', s:['BEL','KUN','ETH']},
    {m:'T', s:['HB','SHP','OER']},
    {m:'T', s:['HOE','WPL','BUC','MIL']},
    {m:'T', s:['HOE','ESC','HB','STF','SMW','FRI']},
    {m:'T', s:['WIE','SMW']},
    {m:'T', s:['HARD','LAN','STF']},
    {m:'B', s:['LAN','HB']},
    {m:'B', s:['ALT','LIN','ALB']},
    {m:'B', s:['OER','SWA']},
    {m:'B', s:['KIL','ADL']},
    {m:'B', s:['ZOL','BUR']}
  ];
  const MODE = {
    S: {name:'S-Bahn', wait:[3.5, 2.5], edge: d => Math.max(2, 1.2 + d * 0.022)},
    T: {name:'Tram', wait:[3, 2], edge: d => Math.max(1.5, 0.5 + d * 0.065)},
    B: {name:'Bus', wait:[4.5, 3.5], edge: d => Math.max(2, 0.8 + d * 0.075)}
  };
  const WALK_MIN_PER_UNIT = 0.25;   // ≈ 80 m/min on streets with 1.2 detour
  const node = id => NODES[id];
  const nodePt = id => [NODES[id][1], NODES[id][2]];
  const linesAt = {};
  LINES.forEach((L, li) => L.s.forEach(id => (linesAt[id] = linesAt[id] || []).push(li)));

  /* tiny binary heap */
  function Heap() { this.a = []; }
  Heap.prototype.push = function (x) { const a = this.a; a.push(x); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p].t <= a[i].t) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } };
  Heap.prototype.pop = function () {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l].t < a[m].t) m = l; if (r < a.length && a[r].t < a[m].t) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } }
    return top;
  };

  /* Access to the network: walk, or a local feeder bus for longer distances. */
  function access(d) {
    const walk = d * WALK_MIN_PER_UNIT;
    if (d <= 70) return {t: walk, m: 'walk'};
    const feeder = 7 + 2 + d * 0.09;
    return feeder < walk ? {t: feeder, m: 'feeder'} : {t: walk, m: 'walk'};
  }

  /* Door-to-door public transport time. peak: shorter waits (denser timetable). */
  function routePT(o, d, peak) {
    const pk = peak ? 1 : 0;
    const direct = dist(o, d) * WALK_MIN_PER_UNIT;
    let best = {t: direct <= 25 ? direct : Infinity, legs: [{m: 'walk', t: direct}]};
    const heap = new Heap(), seen = new Map();
    for (const id in NODES) {
      const dd = dist(o, nodePt(id));
      if (dd > 150) continue;
      const acc = access(dd);
      if (acc.t > 24) continue;
      for (const li of linesAt[id] || []) {
        const m = LINES[li].m;
        heap.push({t: acc.t + MODE[m].wait[pk], id, li, rode: false, legs: [{m: acc.m, t: acc.t, to: id}, {m, li, from: id, to: id, t: 0}]});
      }
    }
    while (heap.a.length) {
      const s = heap.pop();
      const key = s.id + '|' + s.li + '|' + (s.rode ? 1 : 0);
      if (seen.has(key)) continue;
      seen.set(key, s.t);
      if (s.t >= best.t) continue;
      if (s.rode) {
        const eg = access(dist(nodePt(s.id), d));
        if (eg.t <= 24 && s.t + eg.t < best.t) best = {t: s.t + eg.t, legs: s.legs.concat([{m: eg.m, t: eg.t, from: s.id}])};
      }
      const L = LINES[s.li], idx = L.s.indexOf(s.id);
      for (const j of [idx - 1, idx + 1]) {
        if (j < 0 || j >= L.s.length) continue;
        const nb = L.s[j], et = MODE[L.m].edge(dist(nodePt(s.id), nodePt(nb)));
        const legs = s.legs.slice(); const last = Object.assign({}, legs[legs.length - 1]);
        last.to = nb; last.t += et; legs[legs.length - 1] = last;
        heap.push({t: s.t + et, id: nb, li: s.li, rode: true, legs});
      }
      if (!s.rode) continue;
      for (const li2 of linesAt[s.id]) {
        if (li2 === s.li) continue;
        const m2 = LINES[li2].m;
        heap.push({t: s.t + 1.5 + MODE[m2].wait[pk], id: s.id, li: li2, rode: false, legs: s.legs.concat([{m: m2, li: li2, from: s.id, to: s.id, t: 0}])});
      }
    }
    const vehicles = best.legs.filter(l => MODE[l.m] || l.m === 'feeder');
    return {
      min: Math.max(2, Math.round(best.t)),
      transfers: Math.max(0, vehicles.length - 1),
      walk: Math.round(best.legs.filter(l => l.m === 'walk').reduce((a, l) => a + l.t, 0)),
      legs: best.legs.map(l => ({
        mode: l.m,
        name: MODE[l.m] ? MODE[l.m].name : l.m === 'feeder' ? 'Bus' : 'zu Fuss',
        from: l.from ? node(l.from)[0] : null,
        to: l.to ? node(l.to)[0] : null,
        min: Math.max(1, Math.round(l.t))
      })).filter(l => !(l.mode === 'walk' && l.min <= 1 && best.legs.length > 1))
    };
  }

  /* Car: free-flow speed by trip length and centrality, parking search, peak-hour factor. */
  const HB_PT = [367, 347];
  function routeCar(o, d, lakeside) {
    const km = dist(o, d) * UNIT_KM * 1.35 + 0.3;
    const cO = Math.max(0, 3 - dist(o, HB_PT) * UNIT_KM), cD = Math.max(0, 3 - dist(d, HB_PT) * UNIT_KM);
    const centrality = (cO + cD) / 6;
    const v = 30 - centrality * 10 + Math.min(14, km * 0.9);
    const parking = dist(d, HB_PT) * UNIT_KM < 1.6 ? 5 : 1.5;
    const normal = km / v * 60 + 2 + parking;
    const peak = normal * (1.35 + centrality * 0.45 + (lakeside ? 0.15 : 0));
    return {normal: Math.max(3, Math.round(normal)), peak: Math.max(4, Math.round(peak)), km: Math.round(km * 10) / 10};
  }
  function routeBike(o, d, hilly) {
    const km = dist(o, d) * UNIT_KM * 1.2;
    return {min: Math.max(2, Math.round((km / 17 * 60 + 1.5) * (hilly ? 1.18 : 1))), km: Math.round(km * 10) / 10};
  }
  function routeWalk(o, d) {
    return {min: Math.max(1, Math.round(dist(o, d) * WALK_MIN_PER_UNIT)), km: Math.round(dist(o, d) * UNIT_KM * 1.2 * 10) / 10};
  }

  /* Workplace presets (map units). */
  const PLACES = [
    {id:'para', name:'Paradeplatz', sub:'Bankenviertel, Kreis 1', x:362, y:402},
    {id:'hb', name:'Zürich HB', sub:'Hauptbahnhof', x:367, y:347},
    {id:'west', name:'Zürich-West', sub:'Hardbrücke, Kreis 5', x:262, y:292},
    {id:'eth', name:'ETH Zentrum', sub:'Hochschulquartier, Kreis 6', x:412, y:338},
    {id:'sta', name:'Stadelhofen', sub:'Kreis 1', x:405, y:424},
    {id:'oer', name:'Oerlikon', sub:'Bahnhof Oerlikon, Kreis 11', x:386, y:126},
    {id:'alt', name:'Altstetten', sub:'Bahnhof Altstetten, Kreis 9', x:138, y:262},
    {id:'enge', name:'Enge', sub:'Bahnhof Enge, Kreis 2', x:326, y:442},
    {id:'seefeld', name:'Seefeld', sub:'Kreis 8', x:446, y:478},
    {id:'airport', name:'Flughafen Zürich', sub:'Kloten', x:436, y:-188},
    {id:'thalwil', name:'Thalwil', sub:'Bahnhof Thalwil', x:470, y:897},
    {id:'adliswil', name:'Adliswil', sub:'Zentrum', x:300, y:792}
  ];

  /* ---------- the rest of Switzerland ----------
     Trips inside the Zürich area use the network above. Longer ones: to the nearest station (on foot, or by tram and
     bus), the train between stations, and on again. Train times for the main pairs as in the timetable, the others
     from the distance. Car, bike and walking times from the distance. */
  const STATIONS = [
    ['zh', 'Zürich HB', 8.5403, 47.3779], ['bs', 'Basel SBB', 7.5896, 47.5474], ['be', 'Bern', 7.4391, 46.9490], ['lu', 'Luzern', 8.3101, 47.0502],
    ['wi', 'Winterthur', 8.7240, 47.5003], ['zg', 'Zug', 8.5153, 47.1737], ['sg', 'St. Gallen', 9.3696, 47.4232], ['ge', 'Genève', 6.1424, 46.2102],
    ['la', 'Lausanne', 6.6291, 46.5168], ['bi', 'Biel/Bienne', 7.2431, 47.1328], ['th', 'Thun', 7.6297, 46.7547], ['aa', 'Aarau', 8.0512, 47.3913],
    ['bd', 'Baden', 8.3077, 47.4763], ['ol', 'Olten', 7.9079, 47.3518], ['fr', 'Fribourg', 7.1511, 46.8032], ['ne', 'Neuchâtel', 6.9356, 46.9966],
    ['lg', 'Lugano', 8.9469, 46.0054], ['ch', 'Chur', 9.5288, 46.8530], ['sh', 'Schaffhausen', 8.6326, 47.6981], ['ff', 'Frauenfeld', 8.8966, 47.5578],
    ['ra', 'Rapperswil', 8.8172, 47.2253], ['kr', 'Kreuzlingen', 9.1700, 47.6480], ['si', 'Sion', 7.3590, 46.2273], ['mx', 'Montreux', 6.9105, 46.4353],
    ['ny', 'Nyon', 6.2330, 46.3833], ['mo', 'Morges', 6.4940, 46.5100], ['ve', 'Vevey', 6.8420, 46.4620], ['ar', 'Arbon', 9.4310, 47.5130],
    ['ro', 'Romanshorn', 9.3790, 47.5650], ['rs', 'Rorschach', 9.4900, 47.4780], ['wa', 'Wädenswil', 8.6720, 47.2290], ['me', 'Meilen', 8.6440, 47.2700],
    ['hg', 'Horgen', 8.5980, 47.2610], ['we', 'Weinfelden', 9.1080, 47.5660], ['wl', 'Wil', 9.0480, 47.4620], ['lz', 'Lenzburg', 8.1770, 47.3890],
    ['br', 'Brugg', 8.2080, 47.4810], ['wo', 'Wohlen', 8.2740, 47.3490], ['zf', 'Zofingen', 7.9440, 47.2870], ['rf', 'Rheinfelden', 7.7920, 47.5520],
    ['cm', 'Cham', 8.4610, 47.1820], ['kn', 'Küssnacht', 8.4420, 47.0840], ['bn', 'Brunnen', 8.6060, 46.9940], ['ln', 'La Neuveville', 7.0980, 47.0650],
    ['st', 'Steckborn', 8.9820, 47.6690], ['mu', 'Muri', 8.3380, 47.2740], ['bg', 'Bremgarten', 8.3420, 47.3510], ['bz', 'Bischofszell', 9.2390, 47.4950],
    ['am', 'Amriswil', 9.2970, 47.5470], ['sr', 'Sirnach', 8.9980, 47.4620], ['er', 'Erlach', 7.0970, 47.0420], ['tw', 'Twann', 7.1580, 47.0940]
  ].map(([id, n, lon, lat]) => { const p = proj(lon, lat); return {id, n, x: p[0], y: p[1]}; });
  const RAIL_MIN = {'be-zh': 56, 'lu-zh': 41, 'sg-zh': 62, 'ge-zh': 162, 'la-zh': 130, 'ch-zh': 75, 'lg-zh': 116, 'bs-zh': 53, 'wi-zh': 20, 'zg-zh': 22,
    'be-la': 66, 'be-bs': 55, 'be-ge': 102, 'be-lu': 60, 'bs-lu': 61, 'ge-la': 36, 'lg-lu': 98, 'bi-zh': 75, 'th-zh': 77, 'aa-zh': 25, 'bd-zh': 15, 'ol-zh': 31};
  const IN_NET = p => p[0] >= -20 && p[0] <= 750 && p[1] >= -260 && p[1] <= 1020;
  const r1 = n => Math.round(n * 10) / 10;
  function nearestStation(p) { let b = null, bd = Infinity; for (const s of STATIONS) { const d = dist(p, [s.x, s.y]); if (d < bd) { bd = d; b = s; } } return b; }
  /* to or from a station: on foot when it is close, otherwise tram or bus with the wait */
  function localLeg(p, s, inbound) {
    const km = dist(p, [s.x, s.y]) * UNIT_KM;
    if (IN_NET(p) && s.id === 'zh') { const r = inbound ? routePT([s.x, s.y], p, false) : routePT(p, [s.x, s.y], false); return {min: r.min, legs: r.legs}; }
    if (km < 0.9) { const m = Math.max(1, Math.round(km * 1.2 * 12.5)); return {min: m, legs: [{mode: 'walk', name: 'zu Fuss', from: null, to: null, min: m}]}; }
    const m = Math.min(55, Math.round(6 + km * 2.4));
    return {min: m, legs: [{mode: 'T', name: 'Tram oder Bus', from: inbound ? s.n : null, to: inbound ? null : s.n, min: m}]};
  }
  function railMin(a, b) {
    if (a === b) return 0;
    const k = [a.id, b.id].sort().join('-');
    return RAIL_MIN[k] || Math.round(6 + dist([a.x, a.y], [b.x, b.y]) * UNIT_KM * 0.62);
  }
  function travel(o, d, opt) {
    opt = opt || {};
    if (IN_NET(o) && IN_NET(d)) {
      const m = opt.only;
      return {ptR: !m || m === 'pt' ? routePT(o, d, false) : null, carR: !m || m === 'car' ? routeCar(o, d, opt.lakeside) : null, bikeR: !m || m === 'bike' ? routeBike(o, d, opt.hilly) : null, walkR: !m || m === 'walk' ? routeWalk(o, d) : null};
    }
    const km = dist(o, d) * UNIT_KM, so = nearestStation(o), sd = nearestStation(d);
    let ptR;
    if (so === sd) {
      const m = km < 0.9 ? Math.max(1, Math.round(km * 1.2 * 12.5)) : Math.round(6 + km * 2.4);
      ptR = {min: m, transfers: 0, walk: km < 0.9 ? m : 3, legs: [{mode: km < 0.9 ? 'walk' : 'T', name: km < 0.9 ? 'zu Fuss' : 'Tram oder Bus', from: null, to: null, min: m}]};
    } else {
      const a = localLeg(o, so, false), r = railMin(so, sd), b = localLeg(d, sd, true);
      ptR = {min: a.min + 4 + r + b.min, transfers: 2, walk: 4, legs: a.legs.concat([{mode: 'S', name: 'Zug', from: so.n, to: sd.n, min: r}], b.legs)};
    }
    const ckm = km * 1.3 + 0.5, v = ckm > 20 ? 78 : ckm > 6 ? 48 : 28, normal = Math.round(ckm / v * 60 + 6);
    return {ptR, carR: {normal, peak: Math.round(normal * (ckm > 20 ? 1.25 : 1.4)), km: r1(ckm)},
      bikeR: {min: Math.round(km * 1.2 / 17 * 60 + 2), km: r1(km * 1.2)}, walkR: {min: Math.max(1, Math.round(km * 1.2 * 12.5)), km: r1(km * 1.2)}};
  }
  /* the main stations are places too: as a workplace or a place you want to be close to */
  STATIONS.slice(1, 19).forEach(s => PLACES.push({id: 'st-' + s.id, name: s.n === 'Genève' ? 'Genève Cornavin' : s.n === 'Bern' ? 'Bern Bahnhof' : s.n === 'Luzern' ? 'Luzern Bahnhof' : s.n === 'Lausanne' ? 'Lausanne Gare' : s.n, sub: 'Bahnhof', x: s.x, y: s.y}));

  G.GEO = {UNIT_KM, proj, dist, LAKE, FOREST, LIMMAT, SIHL, STATIONS, travel, inPoly, onLand, roadDist, railDist, lakeBearing, MAP, LABELS, nearestQuarter, cone, NODES, routePT, routeCar, routeBike, routeWalk, PLACES};
})(window);
