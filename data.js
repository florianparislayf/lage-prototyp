/* data.js — sample listings (fictional), AI filter definitions and formatting. All values are example data. */
(function (G) {
  'use strict';
  const {proj, onLand, roadDist, railDist, lakeBearing, LIMMAT, SIHL, UNIT_KM} = G.GEO;
  /* distance from a point to a polyline, in map units */
  const lineDist = (x, y, pts) => {
    let d = Infinity;
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1], [x2, y2] = pts[i], dx = x2 - x1, dy = y2 - y1, q = dx * dx + dy * dy;
      const t = q ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / q)) : 0;
      d = Math.min(d, Math.hypot(x - x1 - t * dx, y - y1 - t * dy));
    }
    return d;
  };

  /* ---------- formatting (de-CH) ---------- */
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '’');
  const dec = (n, d) => Number(n).toFixed(d === undefined ? 1 : d);
  const fmt = {
    thou, dec,
    /* Rent is shown as the monthly total including Nebenkosten; `net` is the rent before Nebenkosten. */
    price: l => 'CHF ' + thou(l.gross) + '.–',
    net: l => 'CHF ' + thou(l.price) + '.–',
    short: l => l.deal === 'rent' ? thou(l.gross) : dec(l.price / 1e6, 2) + ' Mio',
    k: n => n >= 1e6 ? dec(n / 1e6, 2) + ' Mio.' : thou(Math.round(n / 1000)) + 'k',
    per: l => l.deal === 'rent' ? '/ Mt.' : '',
    zi: l => String(l.rooms).replace('.5', '½'),
    floor: l => l.floor === 0 ? 'EG' : l.floor + '. OG',
    perM2: l => l.deal === 'rent' ? 'CHF ' + dec(l.price / l.m2) + ' / m²' : 'CHF ' + thou(l.price / l.m2) + ' / m²',
    min: m => m >= 60 ? Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') : m + ' Min.',
    delta: l => Math.round((l.price - l.fair) / l.fair * 1000) / 10
  };

  /* ---------- 14 curated listings ---------- */
  const W = (stop, shop, kita, school, park) => ({stop, shop, kita, school, park});
  const CURATED = [
    {id:'r1',deal:'rent',kind:'tower',title:'Turmwohnung mit Seeblick',street:'Pfingstweidstrasse 51',quarter:'Zürich-West',locality:'Kreis 5',lon:8.5135,lat:47.3885,price:4280,fair:4150,nk:260,rooms:3.5,m2:92,floor:21,floors:26,year:2014,renov:null,avail:'01.01.2027',lift:true,outdoor:{t:'Loggia',m2:9},parking:'Tiefgarage',pets:false,wm:true,bathWin:false,wc2:true,openKitchen:true,ceil:2.55,view:9.4,sees:['See','Alpen','Stadt'],dir:150,span:130,sun:7.8,sunWinter:4.5,eve:true,noiseNight:41,noiseDay:52,flight:false,walk:W(3,4,6,9,5),days:3,drop:210,src:3,corner:true,hill:0},
    {id:'r2',deal:'rent',kind:'altbau',title:'Altbau mit Abendsonne',street:'Zweierstrasse 118',quarter:'Wiedikon',locality:'Kreis 3',lon:8.5195,lat:47.3725,price:2690,fair:2850,nk:190,rooms:3,m2:74,floor:4,floors:5,year:1906,renov:2012,avail:'sofort',lift:false,outdoor:{t:'Balkon',m2:5},parking:null,pets:true,wm:false,bathWin:true,wc2:false,openKitchen:false,ceil:3.1,view:5.2,sees:['Stadt','Grün'],dir:260,span:70,sun:5.1,sunWinter:1.5,eve:true,noiseNight:47,noiseDay:58,flight:false,walk:W(2,3,5,6,6),days:1,drop:0,src:2,corner:false,hill:0},
    {id:'r3',deal:'rent',kind:'loft',title:'Loft im Gewerbehaus',street:'Heinrichstrasse 237',quarter:'Escher-Wyss',locality:'Kreis 5',lon:8.5225,lat:47.3905,price:3550,fair:3480,nk:280,rooms:2.5,m2:88,floor:3,floors:4,year:1929,renov:2018,avail:'01.12.2026',lift:true,outdoor:null,parking:null,pets:true,wm:true,bathWin:false,wc2:false,openKitchen:true,ceil:4.2,view:4.6,sees:['Stadt'],dir:20,span:60,sun:4.2,sunWinter:1,eve:false,noiseNight:50,noiseDay:61,flight:false,walk:W(2,2,7,10,4),days:6,drop:0,src:2,corner:true,hill:0},
    {id:'r4',deal:'rent',kind:'villa',title:'Familienwohnung am Zürichberg',street:'Hochstrasse 64',quarter:'Fluntern',locality:'Kreis 7',lon:8.5640,lat:47.3800,price:5900,fair:6100,nk:380,rooms:4.5,m2:128,floor:2,floors:3,year:1978,renov:2021,avail:'01.02.2027',lift:false,outdoor:{t:'Balkon',m2:18},parking:'Tiefgarage',pets:true,wm:true,bathWin:true,wc2:true,openKitchen:true,ceil:2.5,view:8.3,sees:['Stadt','See','Grün'],dir:205,span:100,sun:8.4,sunWinter:4,eve:true,noiseNight:34,noiseDay:44,flight:false,walk:W(3,7,5,6,2),days:9,drop:300,src:4,corner:false,hill:0.8},
    {id:'r5',deal:'rent',kind:'neubau',title:'Neubau nahe Zürichhorn',street:'Seefeldstrasse 233',quarter:'Seefeld',locality:'Kreis 8',lon:8.5560,lat:47.3560,price:3240,fair:3180,nk:230,rooms:2.5,m2:64,floor:3,floors:5,year:2022,renov:null,avail:'01.12.2026',lift:true,outdoor:{t:'Balkon',m2:8},parking:'Tiefgarage',pets:false,wm:true,bathWin:false,wc2:false,openKitchen:true,ceil:2.6,view:6.1,sees:['See','Stadt'],dir:210,span:50,sun:6.0,sunWinter:2.5,eve:false,noiseNight:44,noiseDay:55,flight:false,walk:W(2,3,6,8,4),days:2,drop:0,src:3,corner:false,hill:0},
    {id:'r6',deal:'rent',kind:'tower',title:'Hochhaus mit Alpenblick',street:'Thurgauerstrasse 120',quarter:'Oerlikon',locality:'Kreis 11',lon:8.5440,lat:47.4120,price:2480,fair:2600,nk:210,rooms:2.5,m2:61,floor:18,floors:22,year:2020,renov:null,avail:'sofort',lift:true,outdoor:{t:'Loggia',m2:7},parking:'Tiefgarage',pets:false,wm:true,bathWin:false,wc2:false,openKitchen:true,ceil:2.5,view:7.7,sees:['Alpen','Stadt'],dir:185,span:100,sun:6.9,sunWinter:3.5,eve:true,noiseNight:43,noiseDay:53,flight:true,walk:W(4,3,6,8,5),days:4,drop:70,src:2,corner:true,hill:0},
    {id:'r7',deal:'rent',kind:'studio',title:'Studio an der Limmat',street:'Wasserwerkstrasse 64',quarter:'Wipkingen',locality:'Kreis 10',lon:8.5300,lat:47.3945,price:1640,fair:1700,nk:140,rooms:1.5,m2:38,floor:2,floors:6,year:1962,renov:2015,avail:'sofort',lift:true,outdoor:{t:'Balkon',m2:4},parking:null,pets:false,wm:false,bathWin:true,wc2:false,openKitchen:false,ceil:2.4,view:4.1,sees:['Grün'],dir:240,span:60,sun:3.9,sunWinter:0.5,eve:false,noiseNight:39,noiseDay:50,flight:false,walk:W(3,4,8,9,2),days:11,drop:80,src:2,corner:false,hill:0},
    {id:'r8',deal:'rent',kind:'altbau',title:'Altbau-Etage in der Enge',street:'Bederstrasse 41',quarter:'Enge',locality:'Kreis 2',lon:8.5310,lat:47.3640,price:4150,fair:4300,nk:290,rooms:4,m2:102,floor:3,floors:4,year:1911,renov:2019,avail:'01.01.2027',lift:false,outdoor:{t:'Balkon',m2:6},parking:null,pets:true,wm:true,bathWin:true,wc2:true,openKitchen:false,ceil:3.2,view:6.8,sees:['See','Stadt'],dir:120,span:60,sun:5.8,sunWinter:2,eve:true,noiseNight:45,noiseDay:57,flight:false,walk:W(3,3,6,7,4),days:5,drop:0,src:3,corner:true,hill:0},
    {id:'r9',deal:'rent',kind:'dach',title:'Dachwohnung mit Alpensicht',street:'Freiestrasse 88',quarter:'Hottingen',locality:'Kreis 7',lon:8.5600,lat:47.3700,price:3780,fair:3700,nk:240,rooms:3.5,m2:86,floor:5,floors:5,year:1958,renov:2016,avail:'01.12.2026',lift:false,outdoor:{t:'Balkon',m2:6},parking:null,pets:false,wm:true,bathWin:true,wc2:false,openKitchen:true,ceil:2.4,view:7.2,sees:['Alpen','Stadt'],dir:190,span:90,sun:7.1,sunWinter:3,eve:true,noiseNight:36,noiseDay:47,flight:false,walk:W(4,5,7,8,3),days:7,drop:0,src:2,corner:false,hill:0.4},
    {id:'b1',deal:'buy',kind:'attika',title:'Attika mit Alpenpanorama',street:'Alte Landstrasse 160',quarter:'Küsnacht',locality:'Küsnacht',lon:8.5840,lat:47.3190,price:3450000,fair:3300000,nk:950,rooms:4.5,m2:156,floor:3,floors:3,year:2019,renov:null,avail:'nach Vereinbarung',lift:true,outdoor:{t:'Terrasse',m2:64},parking:'Tiefgarage',pets:true,wm:true,bathWin:true,wc2:true,openKitchen:true,ceil:2.7,view:9.1,sees:['See','Alpen'],dir:200,span:140,sun:9.2,sunWinter:5,eve:true,noiseNight:37,noiseDay:46,flight:false,walk:W(7,8,9,11,4),days:14,drop:200000,src:3,corner:true,hill:0.3},
    {id:'b2',deal:'buy',kind:'tower',title:'Eigentum im 26. Stock',street:'Hardturmstrasse 300',quarter:'Zürich-West',locality:'Kreis 5',lon:8.5040,lat:47.3925,price:1890000,fair:1950000,nk:620,rooms:3.5,m2:104,floor:26,floors:32,year:2021,renov:null,avail:'nach Vereinbarung',lift:true,outdoor:{t:'Loggia',m2:10},parking:'Tiefgarage',pets:true,wm:true,bathWin:false,wc2:true,openKitchen:true,ceil:2.6,view:9.6,sees:['See','Alpen','Stadt'],dir:140,span:160,sun:8.1,sunWinter:4.5,eve:true,noiseNight:40,noiseDay:51,flight:false,walk:W(3,4,7,10,5),days:6,drop:0,src:2,corner:true,hill:0},
    {id:'b3',deal:'buy',kind:'reihen',title:'Reiheneckhaus mit Garten',street:'Wiesenstrasse 12',quarter:'Adliswil',locality:'Adliswil',lon:8.5250,lat:47.3110,price:1640000,fair:1690000,nk:520,rooms:5.5,m2:148,floor:0,floors:3,year:1996,renov:2020,avail:'Frühling 2027',lift:false,outdoor:{t:'Garten',m2:120},parking:'Garage',pets:true,wm:true,bathWin:true,wc2:true,openKitchen:false,ceil:2.4,view:5.4,sees:['Grün'],dir:250,span:90,sun:6.4,sunWinter:3,eve:true,noiseNight:33,noiseDay:42,flight:false,walk:W(5,6,5,6,2),days:20,drop:80000,src:3,corner:true,hill:0.2},
    {id:'b4',deal:'buy',kind:'neubau',title:'Eigentumswohnung mit Seesicht',street:'Kilchbergstrasse 70',quarter:'Wollishofen',locality:'Kreis 2',lon:8.5300,lat:47.3430,price:1480000,fair:1420000,nk:480,rooms:3.5,m2:96,floor:4,floors:5,year:2008,renov:null,avail:'nach Vereinbarung',lift:true,outdoor:{t:'Balkon',m2:12},parking:'Tiefgarage',pets:true,wm:true,bathWin:false,wc2:true,openKitchen:true,ceil:2.5,view:7.0,sees:['See','Grün'],dir:95,span:80,sun:6.6,sunWinter:2,eve:false,noiseNight:42,noiseDay:53,flight:false,walk:W(4,5,6,7,3),days:9,drop:0,src:2,corner:false,hill:0.1},
    {id:'b5',deal:'buy',kind:'altbau',title:'Altbauwohnung in Unterstrass',street:'Turnerstrasse 24',quarter:'Unterstrass',locality:'Kreis 6',lon:8.5440,lat:47.3880,price:1950000,fair:2010000,nk:560,rooms:4.5,m2:112,floor:2,floors:4,year:1912,renov:2023,avail:'sofort',lift:false,outdoor:{t:'Balkon',m2:7},parking:null,pets:true,wm:true,bathWin:true,wc2:true,openKitchen:true,ceil:3.0,view:5.8,sees:['Stadt','Grün'],dir:240,span:70,sun:5.4,sunWinter:2,eve:true,noiseNight:41,noiseDay:52,flight:false,walk:W(2,3,5,6,4),days:3,drop:0,src:3,corner:true,hill:0}
  ];

  /* ---------- generated listings: deterministic, plausible per quarter ---------- */
  function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }
  const R = rng(20261104);
  const pick = a => a[Math.floor(R() * a.length)];
  const between = (a, b) => a + Math.floor(R() * (b - a + 1));
  const wpick = o => { const e = Object.entries(o); let t = e.reduce((s, x) => s + x[1], 0) * R(); for (const [k, w] of e) { if ((t -= w) <= 0) return k; } return e[0][0]; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r10 = v => Math.round(v / 10) * 10;

  const QUARTERS = [
    {n:'Zürich-West',k:'Kreis 5',x:240,y:290,r:28,rent:42,buy:16500,kinds:{tower:3,neubau:3,loft:2},lake:0,hill:0,noise:44,w:4,st:['Pfingstweidstrasse','Hardturmstrasse','Förrlibuckstrasse','Turbinenstrasse']},
    {n:'Escher-Wyss',k:'Kreis 5',x:290,y:270,r:16,rent:40,buy:16000,kinds:{loft:2,neubau:2,altbau:1},lake:0,hill:0,noise:45,w:2,st:['Heinrichstrasse','Limmatstrasse','Josefstrasse','Fabrikstrasse']},
    {n:'Langstrasse',k:'Kreis 4',x:306,y:338,r:22,rent:37,buy:15000,kinds:{altbau:4,neubau:1},lake:0,hill:0,noise:48,w:3,st:['Hohlstrasse','Brauerstrasse','Zypressenstrasse','Bäckerstrasse']},
    {n:'Wiedikon',k:'Kreis 3',x:268,y:405,r:26,rent:35,buy:14500,kinds:{altbau:3,neubau:2},lake:0,hill:0,noise:44,w:3,st:['Zweierstrasse','Birmensdorferstrasse','Weststrasse','Gertrudstrasse']},
    {n:'Enge',k:'Kreis 2',x:320,y:462,r:16,rent:44,buy:19000,kinds:{altbau:3,neubau:1},lake:0.6,hill:0,noise:44,w:2,st:['Bederstrasse','Tödistrasse','Brandschenkestrasse','Seestrasse']},
    {n:'Wollishofen',k:'Kreis 2',x:308,y:592,r:24,rent:36,buy:15500,kinds:{neubau:3,altbau:1},lake:0.5,hill:0.1,noise:40,w:3,st:['Kilchbergstrasse','Albisstrasse','Butzenstrasse','Etzelstrasse']},
    {n:'Seefeld',k:'Kreis 8',x:446,y:480,r:18,rent:46,buy:21000,kinds:{altbau:2,neubau:2},lake:0.7,hill:0,noise:42,w:3,st:['Seefeldstrasse','Dufourstrasse','Feldeggstrasse','Kreuzstrasse']},
    {n:'Hottingen',k:'Kreis 7',x:462,y:398,r:18,rent:42,buy:19500,kinds:{altbau:2,dach:2},lake:0,hill:0.4,noise:38,w:2,st:['Freiestrasse','Asylstrasse','Hottingerstrasse','Wolfbachstrasse']},
    {n:'Fluntern',k:'Kreis 7',x:488,y:332,r:16,rent:44,buy:21000,kinds:{villa:3,neubau:1},lake:0,hill:0.8,noise:34,w:2,st:['Hochstrasse','Gloriastrasse','Zürichbergstrasse','Krähbühlstrasse']},
    {n:'Hirslanden',k:'Kreis 7',x:508,y:448,r:18,rent:40,buy:18500,kinds:{neubau:2,dach:1},lake:0,hill:0.5,noise:37,w:2,st:['Forchstrasse','Witikonerstrasse','Klusstrasse','Hegibachstrasse']},
    {n:'Unterstrass',k:'Kreis 6',x:396,y:282,r:20,rent:38,buy:16500,kinds:{altbau:3,neubau:1},lake:0,hill:0,noise:41,w:3,st:['Turnerstrasse','Scheuchzerstrasse','Stampfenbachstrasse','Rotbuchstrasse']},
    {n:'Oberstrass',k:'Kreis 6',x:428,y:226,r:18,rent:39,buy:17000,kinds:{neubau:2,villa:1},lake:0,hill:0.4,noise:37,w:2,st:['Winterthurerstrasse','Rigistrasse','Germaniastrasse','Kinkelstrasse']},
    {n:'Wipkingen',k:'Kreis 10',x:312,y:232,r:16,rent:35,buy:14500,kinds:{studio:2,neubau:2,altbau:1},lake:0,hill:0,noise:41,w:2,st:['Wasserwerkstrasse','Rosengartenstrasse','Hönggerstrasse','Nordstrasse']},
    {n:'Höngg',k:'Kreis 10',x:190,y:214,r:24,rent:32,buy:13500,kinds:{neubau:2,reihen:1,villa:1},lake:0,hill:0.6,noise:36,w:3,st:['Limmattalstrasse','Regensdorferstrasse','Kappenbühlweg','Ackersteinstrasse']},
    {n:'Oerlikon',k:'Kreis 11',x:386,y:130,r:26,rent:32,buy:13000,kinds:{tower:2,neubau:3,studio:1},lake:0,hill:0,noise:44,flight:true,w:4,st:['Thurgauerstrasse','Binzmühlestrasse','Edisonstrasse','Affolternstrasse']},
    {n:'Schwamendingen',k:'Kreis 12',x:488,y:152,r:24,rent:28,buy:11500,kinds:{neubau:2,reihen:1,studio:1},lake:0,hill:0,noise:42,flight:true,w:3,st:['Winterthurerstrasse','Überlandstrasse','Saatlenstrasse','Dübendorfstrasse']},
    {n:'Altstetten',k:'Kreis 9',x:150,y:276,r:28,rent:30,buy:12500,kinds:{tower:1,neubau:3,studio:1},lake:0,hill:0,noise:44,w:3,st:['Badenerstrasse','Hohlstrasse','Altstetterstrasse','Vulkanstrasse']},
    {n:'Albisrieden',k:'Kreis 9',x:200,y:352,r:22,rent:29,buy:12500,kinds:{neubau:2,reihen:1},lake:0,hill:0.2,noise:39,w:2,st:['Albisriederstrasse','Fellenbergstrasse','Letzigraben','Triemlistrasse']},
    {n:'Zollikon',k:'Zollikon',x:520,y:612,r:18,rent:42,buy:19000,kinds:{neubau:2,villa:1,attika:1},lake:0.7,hill:0.3,noise:38,w:2,st:['Seestrasse','Alte Landstrasse','Bergstrasse']},
    {n:'Küsnacht',k:'Küsnacht',x:592,y:732,r:22,rent:40,buy:18500,kinds:{villa:1,neubau:2,attika:1},lake:0.7,hill:0.3,noise:37,w:2,st:['Seestrasse','Alte Landstrasse','Zürichstrasse','Schiedhaldenstrasse']},
    {n:'Kilchberg',k:'Kilchberg',x:378,y:722,r:16,rent:38,buy:17500,kinds:{neubau:2,attika:1},lake:0.7,hill:0.3,noise:37,w:2,st:['Seestrasse','Alte Landstrasse','Bergstrasse']},
    {n:'Adliswil',k:'Adliswil',x:290,y:792,r:22,rent:29,buy:11500,kinds:{neubau:2,reihen:2},lake:0,hill:0.2,noise:37,w:2,st:['Zürichstrasse','Wiesenstrasse','Sihlstrasse']},
    {n:'Thalwil',k:'Thalwil',x:462,y:902,r:20,rent:31,buy:13500,kinds:{neubau:2,attika:1,reihen:1},lake:0.7,hill:0.1,noise:38,w:2,st:['Seestrasse','Gotthardstrasse','Alte Landstrasse']}
  ];
  const SUBURB = new Set(['Höngg','Zollikon','Küsnacht','Kilchberg','Adliswil','Thalwil','Schwamendingen']);
  const ROOMS = {studio:[1.5], tower:[2.5,3.5,3.5,4.5], reihen:[4.5,5.5,5.5], villa:[3.5,4.5,4.5,5.5], attika:[3.5,4.5,4.5], loft:[2.5,3.5], altbau:[2,3,3.5,4,4.5], dach:[2.5,3.5,3.5], neubau:[1.5,2.5,2.5,3.5,3.5,4.5]};
  const FLOORS = {tower:[16,32], altbau:[4,5], dach:[4,6], neubau:[3,7], studio:[4,8], loft:[3,5], villa:[2,3], attika:[3,6], reihen:[3,3]};
  const YEARS = {altbau:[1890,1928], dach:[1925,1965], loft:[1900,1935], studio:[1955,1978], neubau:[1995,2025], tower:[2004,2024], villa:[1960,2016], attika:[2008,2024], reihen:[1972,2006]};
  const P = (o, k) => R() < (o[k] !== undefined ? o[k] : 0.5);

  /* force: {deal, kind, quarters} pins a batch to rare kinds or places; start keeps the ids unique across batches. */
  function generate(n, force, start) {
    force = force || {}; start = start || 0;
    const out = [], qw = {};
    QUARTERS.forEach((q, i) => (qw[i] = !force.quarters || force.quarters.includes(q.n) ? q.w : 0));
    for (let i = 0; i < n; i++) {
      const q = QUARTERS[+wpick(qw)];
      let x = q.x, y = q.y;
      for (let t = 0; t < 40; t++) { const a = R() * 2 * Math.PI, d = Math.sqrt(R()) * q.r; x = q.x + Math.cos(a) * d; y = q.y + Math.sin(a) * d; if (onLand(x, y)) break; }
      const deal = force.deal || (R() < 0.64 ? 'rent' : 'buy');
      let kind = force.kind || wpick(q.kinds);
      if (!force.kind && deal === 'buy' && kind === 'studio') kind = 'neubau';
      if (!force.kind && deal === 'rent' && kind === 'reihen' && R() < 0.6) kind = 'neubau';
      const rooms = pick(ROOMS[kind]);
      const m2 = Math.round(rooms * 23 + 8 + R() * 16 + (kind === 'attika' ? 22 : 0) + (kind === 'villa' ? 14 : 0) + (kind === 'loft' ? 18 : 0) + (kind === 'reihen' ? 20 : 0));
      const floors = between(FLOORS[kind][0], FLOORS[kind][1]);
      let floor = between(0, floors - 1);
      if (kind === 'tower') floor = Math.max(8, floors - 1 - between(0, floors - 9));
      if (kind === 'attika' || kind === 'dach') floor = floors;
      if (kind === 'reihen') floor = 0;
      const year = between(YEARS[kind][0], YEARS[kind][1]);
      const renov = year < 1990 && R() < 0.65 ? between(2008, 2024) : null;
      const lift = kind === 'tower' || kind === 'attika' ? true : kind === 'reihen' ? false : kind === 'neubau' ? (floors >= 4 || R() < 0.5) : P({studio:0.7, altbau:0.2, dach:0.15, loft:0.6, villa:0.3}, kind);
      const lb = lakeBearing([x, y]);
      let view = 3 + q.hill * 3 + q.lake * 2.2 + Math.min(floor, 30) * 0.16 + (kind === 'tower' ? 1.4 : 0) + (kind === 'attika' ? 1.6 : 0) + (kind === 'dach' ? 0.8 : 0) + R() * 1.6 - (kind === 'altbau' && floor < 3 ? 0.8 : 0);
      const seesLake = (q.lake > 0 && R() < (lb.dist < 90 ? 0.35 + floor * 0.07 + q.hill * 0.3 : 0.1 + floor * 0.03)) || (kind === 'tower' && floor >= 15 && R() < 0.6) || (kind === 'attika' && q.lake > 0);
      const seesAlps = (view >= 7.2 && R() < 0.8) || (kind === 'tower' && floor >= 14);
      const sees = [];
      if (seesLake) sees.push('See');
      if (seesAlps) sees.push('Alpen');
      if (!SUBURB.has(q.n) && floor >= 3) sees.push('Stadt');
      if (q.hill > 0.3 || R() < 0.35) sees.push('Grün');
      if (!sees.length) sees.push('Stadt');
      if (seesLake) view = Math.max(view, 6.2);
      if (!seesLake && !seesAlps) view = Math.min(view, 6.8);
      view = Math.round(clamp(view, 2, 9.8) * 10) / 10;
      const dir = seesLake ? Math.round(lb.deg) : (pick([90, 135, 180, 180, 225, 225, 270, 315]) + between(-10, 10) + 360) % 360;
      const span = kind === 'tower' || kind === 'attika' ? between(100, 170) : between(50, 110);
      const southness = Math.cos((dir - 180) * Math.PI / 180), westness = Math.cos((dir - 250) * Math.PI / 180);
      const eve = westness > 0.45 || kind === 'attika';
      const sun = Math.round(clamp(4.2 + southness * 1.6 + Math.max(0, westness) * 0.6 + Math.min(floor, 25) * 0.07 + q.hill * 0.8 + (kind === 'tower' || kind === 'attika' ? 1 : 0) - (kind === 'altbau' && floor < 2 ? 1 : 0) + R() * 0.8, 2, 9.6) * 10) / 10;
      const sunWinter = Math.round(clamp(1.2 + southness * 2.4 + Math.min(floor, 25) * 0.1 + q.hill * 0.8 - (kind === 'altbau' && floor < 3 ? 1.2 : 0) - (q.lake > 0.5 && q.hill < 0.2 ? 0.5 : 0) + R() * 0.8, 0, 6) * 2) / 2;
      const rd = roadDist([x, y]), rr = railDist([x, y]);
      const noiseNight = Math.round(clamp(q.noise + (rd < 10 ? 7 : rd < 22 ? 3 : -2) + (rr < 8 ? 5 : rr < 16 ? 2 : 0) - (kind === 'tower' ? 2 : 0) + R() * 4 - 2, 29, 58));
      const sub = SUBURB.has(q.n);
      const walk = W(sub ? between(2, 9) : between(1, 5), sub ? between(3, 12) : between(2, 7), between(3, 11), between(4, 13), q.hill > 0.3 || q.lake > 0.4 ? between(1, 5) : between(2, 10));
      let outdoor = null;
      if (kind === 'attika') outdoor = {t:'Terrasse', m2: between(30, 80)};
      else if (kind === 'reihen') outdoor = {t:'Garten', m2: between(60, 200)};
      else if (kind === 'villa') outdoor = R() < 0.5 ? {t:'Garten', m2: between(40, 120)} : {t:'Balkon', m2: between(10, 20)};
      else if (kind === 'tower') outdoor = {t:'Loggia', m2: between(6, 12)};
      else if (kind === 'neubau') outdoor = R() < 0.9 ? {t: R() < 0.5 ? 'Balkon' : 'Loggia', m2: between(7, 16)} : null;
      else if (kind === 'altbau') outdoor = R() < 0.75 ? {t:'Balkon', m2: between(3, 8)} : null;
      else if (kind === 'dach') outdoor = R() < 0.7 ? (R() < 0.6 ? {t:'Balkon', m2: between(4, 8)} : {t:'Dachterrasse', m2: between(10, 18)}) : null;
      else if (kind === 'studio') outdoor = R() < 0.5 ? {t:'Balkon', m2: between(3, 5)} : null;
      else if (kind === 'loft') outdoor = R() < 0.3 ? {t:'Terrasse', m2: between(12, 30)} : null;
      if (floor === 0 && kind !== 'reihen' && kind !== 'villa' && R() < 0.5) outdoor = {t:'Sitzplatz', m2: between(12, 30)};
      const wm = P({neubau:0.9, tower:0.95, attika:1, villa:0.9, reihen:1, loft:0.6, altbau:0.3, dach:0.45, studio:0.2}, kind);
      const mod = 1 + (view - 5) * 0.025 + (year >= 2015 ? 0.07 : year >= 2000 ? 0.03 : 0) + (kind === 'tower' ? Math.min(floor, 30) * 0.004 : 0) + (kind === 'attika' ? 0.12 : 0) + (wm ? 0.01 : 0) - (noiseNight > 48 ? 0.04 : 0);
      const price = deal === 'rent' ? r10(m2 * q.rent * mod * (0.9 + R() * 0.2)) : Math.round(m2 * q.buy * mod * (0.9 + R() * 0.2) / 10000) * 10000;
      const fair = deal === 'rent' ? r10(price * (0.91 + R() * 0.15)) : Math.round(price * (0.91 + R() * 0.15) / 10000) * 10000;
      const drop = R() < 0.18 ? (deal === 'rent' ? between(1, 6) * 50 : between(2, 9) * 10000) : 0;
      out.push({
        id: 'g' + (start + i + 1), deal, kind, title: null, street: pick(q.st) + ' ' + between(3, 160), quarter: q.n, locality: q.k, x, y,
        price, fair, nk: deal === 'rent' ? r10(110 + m2 * 1.5 + (lift ? 30 : 0) + (kind === 'altbau' ? 20 : 0)) : r10(price * 0.0075 / 12 + m2 * 1.8),
        rooms, m2, floor, floors, year, renov,
        avail: deal === 'rent' ? pick(['sofort', '01.12.2026', '01.12.2026', '01.01.2027', '01.02.2027', '01.03.2027', '01.04.2027']) : pick(['nach Vereinbarung', 'nach Vereinbarung', 'sofort', 'Frühling 2027', 'Sommer 2027']),
        lift, outdoor,
        parking: kind === 'tower' ? (R() < 0.8 ? 'Tiefgarage' : null) : sub ? (R() < 0.85 ? (kind === 'reihen' ? 'Garage' : 'Tiefgarage') : null) : (R() < 0.35 ? 'Tiefgarage' : null),
        pets: deal === 'buy' ? true : R() < 0.45,
        wm, bathWin: P({altbau:0.75, dach:0.6, studio:0.45, reihen:0.85, villa:0.7, loft:0.3, neubau:0.35, tower:0.12, attika:0.55}, kind),
        wc2: rooms >= 3.5 && R() < (kind === 'altbau' ? 0.35 : 0.65),
        openKitchen: P({neubau:0.8, tower:0.9, loft:0.95, attika:0.85, villa:0.6, reihen:0.4, altbau:0.2, dach:0.5, studio:0.6}, kind),
        ceil: kind === 'altbau' ? 2.85 + Math.round(R() * 5) / 10 : kind === 'loft' ? 3.6 + Math.round(R() * 8) / 10 : kind === 'dach' ? 2.3 + Math.round(R() * 2) / 10 : 2.4 + Math.round(R() * 25) / 100,
        view, sees, dir, span, sun, sunWinter, eve, noiseNight, noiseDay: noiseNight + between(8, 11), flight: !!q.flight && R() < 0.85,
        walk, days: Math.max(1, Math.round(-Math.log(1 - R() * 0.97) * 9)), drop, src: between(1, 4), corner: R() < 0.35, hill: q.hill
      });
    }
    return out;
  }

  /* ---------- titles, AI summary, honest caveat ---------- */
  const GENDER = {Wohnung:'f', Attikawohnung:'f', Loft:'n', Studio:'n', Gartenwohnung:'f', Dachwohnung:'f'};
  const ADJ = {
    charm: ['Charmante', 'Charmantes'], modern: ['Moderne', 'Modernes'], neu: ['Neue', 'Neues'], hell: ['Helle', 'Helles'], sonnig: ['Sonnige', 'Sonniges'],
    ruhig: ['Ruhige', 'Ruhiges'], gross: ['Grosszügige', 'Grosszügiges'], renov: ['Renovierte', 'Renoviertes'], stil: ['Stilvolle', 'Stilvolles'], gemuet: ['Gemütliche', 'Gemütliches']
  };
  const GROSS = {Balkon: 'grossem Balkon', Loggia: 'grosser Loggia', Terrasse: 'grosser Terrasse', Dachterrasse: 'grosser Dachterrasse', Sitzplatz: 'grossem Sitzplatz', Garten: 'grossem Garten'};
  const tseed = s => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 1000003; return h; };
  /* Titles from what is true about the flat, varied per listing so that hundreds of them do not repeat. */
  function makeTitle(l) {
    const h = tseed(l.id + '|' + l.street), z = fmt.zi(l);
    if (l.kind === 'reihen') return (l.corner ? 'Reiheneckhaus' : 'Reihenhaus') + ' ' + ['mit Garten', 'mit Garten und Sitzplatz', 'für Familien', 'im Grünen', 'in ' + l.quarter][h % 5];
    const noun = l.kind === 'attika' ? 'Attikawohnung' : l.kind === 'loft' ? 'Loft' : l.rooms <= 1.5 ? 'Studio' : l.kind === 'dach' ? 'Dachwohnung' : (l.outdoor && l.outdoor.t === 'Garten') ? 'Gartenwohnung' : 'Wohnung';
    const adjs = [];
    if (l.kind === 'altbau') adjs.push('charm', 'stil');
    if (l.year >= 2015) adjs.push('modern', 'neu');
    if (l.sun >= 7) adjs.push('hell', 'sonnig');
    if (l.noiseNight < 38) adjs.push('ruhig');
    if (l.m2 / l.rooms >= 30) adjs.push('gross');
    if (l.renov && l.renov >= 2015) adjs.push('renov');
    if (l.kind === 'dach' || l.kind === 'studio') adjs.push('gemuet');
    const suf = [];
    if (l.floor >= 10) suf.push('im ' + l.floor + '. Stock');
    if (l.sees.includes('See') && l.view >= 6.5) suf.push('mit Seesicht');
    if (l.kind === 'attika' || (l.outdoor && l.outdoor.t === 'Dachterrasse')) suf.push('mit Terrasse');
    if (l.outdoor && l.outdoor.m2 >= 12 && GROSS[l.outdoor.t]) suf.push('mit ' + GROSS[l.outdoor.t]);
    if (l.eve && l.outdoor && l.outdoor.m2 >= 8) suf.push('mit Abendsonne');
    if (l.sees.includes('Alpen')) suf.push('mit Bergsicht');
    if (l.kind === 'altbau') suf.push('im Altbau');
    if (l.fireplace) suf.push('mit Cheminée');
    if (l.walk.park <= 3) suf.push('am Park');
    if (l.noiseNight < 38) suf.push('an ruhiger Lage');
    suf.push('in ' + l.quarter);
    /* the best two reasons, then the listing picks one, so similar flats still read differently */
    const suffix = suf.slice(0, 2)[h % Math.min(2, suf.length)];
    const adjKey = adjs.length && h % 5 ? adjs[(h >> 3) % adjs.length] : null;
    const head = noun === 'Wohnung' ? z + '-Zimmer-Wohnung' : noun;
    const adj = adjKey ? ADJ[adjKey][GENDER[noun] === 'n' ? 1 : 0] + ' ' : '';
    return (adj + head + ' ' + suffix).replace(/^./, c => c.toUpperCase());
  }
  function aiSummary(l) {
    const pos = [];
    if (l.floor >= 10) pos.push(l.floor + '. Stock');
    if (l.sees.includes('See')) pos.push('Seesicht'); else if (l.sees.includes('Alpen')) pos.push('Bergsicht');
    if (l.eve) pos.push('Abendsonne');
    if (l.sunWinter >= 3.5) pos.push('auch im Winter Sonne');
    if (l.noiseNight < 40) pos.push('nachts sehr ruhig');
    if (l.outdoor && l.outdoor.m2 >= 12) pos.push(l.outdoor.t + ' mit ' + l.outdoor.m2 + ' m²');
    if (l.ceil >= 2.9) pos.push(dec(l.ceil, 2) + ' m Raumhöhe');
    if (l.wm) pos.push('eigene Waschmaschine');
    if (l.gardenShared) pos.push('Garten zum Mitbenutzen');
    if (l.walk.stop <= 2) pos.push(l.walk.stop + ' Min. zur Haltestelle');
    if (pos.length < 2) pos.push(l.quarter + ' mit kurzen Wegen');
    const p = pos.slice(0, 3);
    const s = p.length === 3 ? p[0] + ', ' + p[1] + ' und ' + p[2] : p.join(' und ');
    return s.charAt(0).toUpperCase() + s.slice(1) + '.';
  }
  function caveat(l) {
    if (l.flight) return 'Liegt in einer Anflugschneise: morgens und abends Fluglärm.';
    if (l.noiseNight >= 48) return 'Strassenseitig laut: nachts ' + l.noiseNight + ' dB an der Fassade.';
    if (!l.lift && l.floor >= 3) return l.floor + '. Stock ohne Lift.';
    if (l.price > l.fair * 1.04) return 'Preis ' + dec(fmt.delta(l)) + ' % über dem KI-Marktwert.';
    if (!l.wm) return 'Keine eigene Waschmaschine, Waschküche im Haus.';
    if (l.sunWinter < 1) return 'Im Winter kaum direkte Sonne.';
    if (l.walk.stop >= 7) return l.walk.stop + ' Min. zu Fuss zur nächsten Haltestelle.';
    if (!l.outdoor) return 'Kein Balkon oder Sitzplatz.';
    if (l.noiseNight >= 45) return 'Tagsüber Verkehrslärm (' + l.noiseDay + ' dB).';
    return 'Nebenkosten von CHF ' + thou(l.nk) + ' pro Monat einplanen.';
  }

  /* ---------- move-in dates ---------- */
  const MONTHS = ['Jan.', 'Feb.', 'März', 'April', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
  const SEASON = {'Frühling': 3, 'Sommer': 6};
  /* Move-in as a timestamp: 0 means right away, null means by arrangement (flexible). */
  function availTime(s) {
    if (s === 'sofort') return 0;
    const p = String(s).split('.');
    if (p.length === 3) return new Date(+p[2], +p[1] - 1, +p[0]).getTime();
    const w = String(s).split(' ');
    if (w.length === 2 && SEASON[w[0]] !== undefined) return new Date(+w[1], SEASON[w[0]], 1).getTime();
    return null;
  }
  function availShort(l) {
    if (l.avail === 'sofort') return 'Sofort';
    const p = l.avail.split('.');
    if (p.length === 3) return (+p[0]) + '. ' + MONTHS[+p[1] - 1] + ' ' + p[2];
    return l.avail.charAt(0).toUpperCase() + l.avail.slice(1);
  }
  const availText = l => l.avail === 'sofort' ? 'ab sofort' : l.avail.split('.').length === 3 ? 'ab ' + availShort(l) : l.avail;
  const SOON = new Date(2026, 11, 1).getTime();

  /* ---------- property types, as the portals list them ---------- */
  const TYPES = [
    {id: 'wohnung', t: 'Wohnung'}, {id: 'studio', t: 'Studio'}, {id: 'dach', t: 'Dachwohnung'},
    {id: 'attika', t: 'Attika'}, {id: 'loft', t: 'Loft'}, {id: 'haus', t: 'Haus'}
  ];

  /* ---------- toggle filters: everything the big portals offer, plus what only the AI can read ---------- */
  const GROUPS = [
    {id: 'alltag', t: 'Im Alltag wichtig'}, {id: 'aussicht', t: 'Aussicht'}, {id: 'wohl', t: 'Wohnqualität'},
    {id: 'umgebung', t: 'Umgebung'}, {id: 'weitere', t: 'Weitere Merkmale'}, {id: 'preis', t: 'Preis'}
  ];
  const FILTERS = [
    {id: 'wm', g: 'alltag', label: 'Eigene Waschmaschine', hint: 'Waschmaschine und Tumbler in der Wohnung statt Waschküche mit Waschplan', src: 'Inseratstext und Fotos', ki: true, test: l => l.wm},
    {id: 'dishwasher', g: 'alltag', label: 'Geschirrspüler', hint: 'Geschirrspüler in der Küche', src: 'Inseratstext und Fotos', ki: true, test: l => l.dishwasher},
    {id: 'balcony', g: 'alltag', label: 'Balkon oder Sitzplatz', hint: 'Eigener Aussenraum: Balkon, Loggia, Terrasse, Sitzplatz oder Garten', src: 'Grundriss und Fotos', ki: true, test: l => !!l.outdoor},
    {id: 'roofTerrace', g: 'alltag', label: 'Dachterrasse', hint: 'Terrasse auf dem Dach oder im obersten Geschoss, mit Fläche in m²', src: 'Grundriss', ki: true, test: l => l.roofTerrace},
    {id: 'garden', g: 'alltag', label: 'Eigener Garten', hint: 'Ein Garten nur für dich, mehr als ein Sitzplatz: Haus oder Gartenwohnung im Erdgeschoss', src: 'Inseratstext und Grundriss', ki: true, test: l => l.garden},
    {id: 'gardenShared', g: 'alltag', label: 'Garten, auch gemeinsam', hint: 'Eigener Garten oder ein Garten, den alle im Haus nutzen dürfen (Gartenmitbenutzung)', src: 'Inseratstext', ki: true, test: l => l.garden || l.gardenShared},
    {id: 'lift', g: 'alltag', label: 'Lift', hint: 'Lift im Haus oder Wohnung im Erdgeschoss', src: 'Inserat', ki: false, test: l => l.lift || l.floor === 0},
    {id: 'pets', g: 'alltag', deal: 'rent', label: 'Haustiere erlaubt', hint: 'Katzen oder Hunde laut Inseratstext erlaubt', src: 'Inseratstext', ki: true, test: l => l.pets},
    {id: 'parking', g: 'alltag', label: 'Parkplatz oder Garage', hint: 'Tiefgarage, Garage oder Aussenparkplatz', src: 'Inserat', ki: false, test: l => !!l.parking},
    {id: 'bike', g: 'alltag', label: 'Veloraum', hint: 'Abschliessbarer Veloraum oder Velokeller', src: 'Inseratstext', ki: true, test: l => l.bikeRoom},
    {id: 'cellar', g: 'alltag', label: 'Keller oder Estrich', hint: 'Abstellraum ausserhalb der Wohnung', src: 'Inserat', ki: false, test: l => l.cellar},
    /* The view: computed from the window (viewshed on 3D city, terrain and LiDAR data), the zoning plan in front, and the
       listing checked by a vision and language model. Lake, mountains, free distance and angle are levels in app.js. */
    {id: 'skyline', g: 'aussicht', sub: 'see', label: 'Stadt und Dächer', hint: 'Blick über die Stadt, nicht auf eine Fassade', src: 'Sichtanalyse', ki: true, test: l => l.sees.includes('Stadt') && l.view >= 5.5},
    {id: 'landmark', g: 'aussicht', sub: 'see', label: 'Wahrzeichen im Blick', hint: 'Grossmünster, Prime Tower, Uetliberg oder Zürichberg', src: 'Sichtanalyse', ki: true, test: l => l.vMarks.length > 0},
    {id: 'greenView', g: 'aussicht', sub: 'see', label: 'Viel Grün im Blick', hint: 'Mindestens ein Viertel des Blicks sind Bäume, Park oder Wald', src: 'LiDAR-Vegetation', ki: true, test: l => l.vGreen >= 25},
    {id: 'lights', g: 'aussicht', sub: 'see', label: 'Lichter in der Nacht', hint: 'Abends die Lichter der Stadt oder am See', src: 'Sichtanalyse', ki: true, test: l => l.vLights},
    {id: 'free', g: 'aussicht', sub: 'frei', label: 'Unverbaubar', hint: 'Hoch genug, am Hang oder am See: nach Zonenplan kann davor nichts gebaut werden, das die Sicht nimmt', src: 'Zonenplan und 3D-Stadtmodell', ki: true, test: l => l.free},
    {id: 'privacy', g: 'aussicht', sub: 'frei', label: 'Wenig Einsicht', hint: 'Höchstens sechs fremde Fenster sehen direkt in deinen Wohnraum', src: 'Umgekehrte Sichtanalyse', ki: true, test: l => l.vPrivacy <= 6},
    {id: 'leafless', g: 'aussicht', sub: 'frei', label: 'Ganzjährig frei', hint: 'Keine Laubbäume davor, die im Sommer die Sicht verdecken', src: 'LiDAR-Vegetation', ki: true, test: l => !l.vLeafy},
    {id: 'above', g: 'aussicht', sub: 'frei', label: 'Über den Dächern', hint: 'Fenster höher als die Häuser ringsum', src: '3D-Stadtmodell', ki: true, test: l => l.vAbove},
    {id: 'sunset', g: 'aussicht', sub: 'wann', label: 'Sonnenuntergang im Blick', hint: 'Die Sonne geht mindestens einen Monat im Jahr in deinem Blickfeld unter', src: 'Sonnenstand und Horizont', ki: true, test: l => l.vSunset.length > 0},
    {id: 'eve', g: 'aussicht', sub: 'wann', label: 'Abendsonne', hint: 'Balkon oder Fenster nach Westen oder Südwesten', src: 'Grundriss und Sonnenstand', ki: true, test: l => l.eve},
    {id: 'living', g: 'aussicht', sub: 'wann', label: 'Aussicht vom Wohnzimmer', hint: 'Die Sicht gibt es vom Sofa aus, nicht nur aus dem Schlafzimmer', src: 'Grundriss und Fotos', ki: true, test: l => l.vLiving},
    {id: 'balconyView', g: 'aussicht', sub: 'wann', label: 'Aussicht vom Balkon', hint: 'Balkon, Loggia oder Terrasse mit derselben Sicht', src: 'Grundriss und Fotos', ki: true, test: l => l.vBalcony},
    {id: 'tower', g: 'aussicht', sub: 'wann', label: 'Hochhaus', hint: 'Wohnung ab dem 10. Stock', src: 'Inserat und Gebäuderegister', ki: false, test: l => l.floor >= 10},
    {id: 'verified', g: 'aussicht', sub: 'check', label: 'Nur bestätigte Aussicht', hint: 'Was Inseratstext und Fotos versprechen, stimmt mit der Sichtanalyse überein', src: 'Sprach- und Bildmodell, Sichtanalyse', ki: true, test: l => l.vClaimOk},
    {id: 'quiet', g: 'wohl', label: 'Ruhig', hint: 'Nachts unter 45 dB an der Fassade und kein Fluglärm', src: 'Lärmkataster und Fluglärmkarte', ki: true, test: l => l.noiseNight < 45 && !l.flight},
    {id: 'sunny', g: 'wohl', label: 'Hell und sonnig', hint: 'Mehr als 6 Stunden direkte Sonne pro Tag im Jahresmittel', src: '3D-Schattenmodell', ki: true, test: l => l.sun >= 6},
    {id: 'renovated', g: 'wohl', label: 'Neu oder renoviert', hint: 'Neubau ab 2012 oder Küche und Bad ab 2015 erneuert', src: 'Inserat, Fotos und Gebäuderegister', ki: true, test: l => l.renovated},
    {id: 'newbuild', g: 'wohl', label: 'Neubau', hint: 'Baujahr ab 2020, oft Erstbezug', src: 'Gebäuderegister', ki: false, test: l => l.year >= 2020},
    {id: 'homeoffice', g: 'wohl', label: 'Zimmer fürs Homeoffice', hint: 'Ein Zimmer mehr als Schlafzimmer, gross genug für einen Arbeitsplatz', src: 'Grundriss', ki: true, test: l => l.homeoffice},
    {id: 'wcSep', g: 'wohl', label: 'Separates WC', hint: 'Gäste-WC zusätzlich zum Bad', src: 'Grundriss', ki: true, test: l => l.wcSep},
    {id: 'bathtub', g: 'wohl', label: 'Badewanne', hint: 'Bad mit Wanne, nicht nur Dusche', src: 'Fotos und Grundriss', ki: true, test: l => l.bathtub},
    {id: 'bathWin', g: 'wohl', label: 'Bad mit Fenster', hint: 'Tageslicht und Lüftung im Badezimmer', src: 'Grundriss und Fotos', ki: true, test: l => l.bathWin},
    {id: 'winter', g: 'wohl', label: 'Sonne auch im Winter', hint: 'Mindestens 3 Stunden Sonne am 21. Dezember', src: '3D-Schattenmodell', ki: true, test: l => l.sunWinter >= 3},
    {id: 'noflight', g: 'wohl', label: 'Ohne Fluglärm', hint: 'Ausserhalb der An- und Abflugschneisen', src: 'Fluglärmkarte', ki: true, test: l => !l.flight},
    {id: 'bigOutdoor', g: 'wohl', label: 'Grosser Balkon', hint: 'Aussenraum ab 10 m², Platz für Tisch und Stühle', src: 'Grundriss', ki: true, test: l => !!l.outdoor && l.outdoor.m2 >= 10},
    {id: 'fireplace', g: 'wohl', label: 'Cheminée', hint: 'Offener Kamin oder Schwedenofen', src: 'Inseratstext und Fotos', ki: true, test: l => l.fireplace},
    {id: 'highCeil', g: 'wohl', label: 'Hohe Decken', hint: 'Raumhöhe ab 2,8 m, oft im Altbau oder Loft', src: 'Grundriss und Inseratstext', ki: true, test: l => l.highCeil},
    {id: 'openKitchen', g: 'wohl', label: 'Offene Küche', hint: 'Offene Küche, Wohnküche oder Kochinsel', src: 'Grundriss', ki: true, test: l => l.openKitchen},
    {id: 'closedKitchen', g: 'wohl', label: 'Separate Küche', hint: 'Geschlossene Küche mit Tür, getrennt vom Wohnraum', src: 'Grundriss', ki: true, test: l => !l.openKitchen},
    {id: 'klima', g: 'wohl', label: 'Klimaanlage', hint: 'Klimaanlage oder Kühlung in der Wohnung', src: 'Inseratstext', ki: true, test: l => l.klima},
    {id: 'wintergarten', g: 'wohl', label: 'Wintergarten', hint: 'Verglaster Aussenraum oder geschlossene Loggia, fast das ganze Jahr nutzbar', src: 'Grundriss und Inseratstext', ki: true, test: l => l.wintergarten},
    {id: 'old', g: 'wohl', label: 'Altbau-Charme', hint: 'Vor 1930 gebaut, oft mit hohen Decken und Parkett', src: 'Gebäuderegister', ki: false, test: l => l.year < 1930},
    {id: 'stop', g: 'umgebung', label: 'Haltestelle nah', hint: 'Tram, Bus oder S-Bahn in höchstens 5 Minuten zu Fuss', src: 'Fahrplan und Wegnetz', ki: true, test: l => l.walk.stop <= 5},
    {id: 'shop', g: 'umgebung', label: 'Einkaufen zu Fuss', hint: 'Supermarkt in höchstens 5 Minuten zu Fuss', src: 'Wegnetz', ki: true, test: l => l.walk.shop <= 5},
    {id: 'family', g: 'umgebung', label: 'Kinderfreundlich', hint: 'Kita und Primarschule in höchstens 10 Minuten, Park in der Nähe', src: 'Wegnetz', ki: true, test: l => l.walk.kita <= 10 && l.walk.school <= 10 && l.walk.park <= 8},
    {id: 'atLake', g: 'umgebung', label: 'Direkt am See (bis 300 m)', hint: 'Höchstens 300 m bis ans Ufer, egal ob der See im Blick ist', src: 'Uferlinie und Wegnetz', ki: true, test: l => l.atLake},
    {id: 'nearLake', g: 'umgebung', label: 'See zu Fuss (bis 800 m)', hint: 'In rund zehn Minuten zu Fuss am Wasser', src: 'Uferlinie und Wegnetz', ki: true, test: l => l.nearLake},
    {id: 'atRiver', g: 'umgebung', label: 'Am Fluss', hint: 'Höchstens 200 m bis zur Limmat oder Sihl', src: 'Gewässernetz und Wegnetz', ki: true, test: l => l.atRiver},
    {id: 'lakeFront', g: 'umgebung', deal: 'buy', label: 'Seeanstoss', hint: 'Das Grundstück grenzt direkt ans Ufer, oft mit Bootsplatz', src: 'Amtliche Vermessung und Uferlinie', ki: true, test: l => l.lakeFront},
    {id: 'forestEdge', g: 'umgebung', label: 'Am Waldrand', hint: 'Wald oder Park in höchstens drei Minuten zu Fuss, viel Grün rundum', src: 'Wegnetz und LiDAR-Vegetation', ki: true, test: l => l.forestEdge},
    {id: 'carFree', g: 'umgebung', deal: 'rent', label: 'Autofreie Siedlung', hint: 'Siedlung, in der die Bewohnerinnen und Bewohner auf ein eigenes Auto verzichten', src: 'Inseratstext', ki: true, test: l => l.carFree},
    {id: 'green', g: 'umgebung', label: 'Grün vor der Tür', hint: 'Park, Wald oder Seeufer in höchstens 5 Minuten', src: 'Wegnetz', ki: true, test: l => l.walk.park <= 5},
    {id: 'wheelchair', g: 'weitere', label: 'Rollstuhlgängig', hint: 'Stufenlos erreichbar, mit Lift oder im Erdgeschoss', src: 'Inserat und Baujahr', ki: true, test: l => l.wheelchair},
    {id: 'minergie', g: 'weitere', label: 'Minergie', hint: 'Zertifizierter Energiestandard, tiefe Heizkosten', src: 'Minergie-Register', ki: false, test: l => l.minergie},
    {id: 'fiber', g: 'weitere', label: 'Glasfaser', hint: 'Glasfaseranschluss in der Wohnung', src: 'Netzabdeckung der Anbieter', ki: false, test: l => l.fiber},
    {id: 'furnished', g: 'weitere', deal: 'rent', label: 'Möbliert', hint: 'Möbliert vermietet', src: 'Inserat', ki: false, test: l => l.furnished},
    {id: 'coop', g: 'weitere', deal: 'rent', label: 'Genossenschaft oder gemeinnützig', hint: 'Kostenmiete; meist mit Anteilscheinen und Regeln zur Belegung, etwa einer Mindestzahl Personen', src: 'Vermieter, abgeglichen mit der Liste gemeinnütziger Bauträger', ki: true, test: l => l.coop},
    {id: 'privateOffer', g: 'weitere', label: 'Von privat, ohne Makler', hint: 'Inseriert von der Eigentümerin oder dem Eigentümer selbst', src: 'Angaben im Inserat', ki: false, test: l => l.privateOffer},
    {id: 'unlimited', g: 'weitere', deal: 'rent', label: 'Unbefristet', hint: 'Keine befristete Miete oder Untermiete', src: 'Inseratstext', ki: true, test: l => !l.temporary},
    {id: 'ownEntrance', g: 'weitere', label: 'Eigener Eingang', hint: 'Eigene Haustür von draussen: Reihenhaus, Gartenwohnung, Maisonette', src: 'Grundriss und Inseratstext', ki: true, test: l => l.ownEntrance},
    {id: 'atelier', g: 'weitere', label: 'Atelier, Werkstatt oder Hobbyraum', hint: 'Atelier, Werkstatt oder Hobbyraum, der zur Wohnung oder zum Haus gehört', src: 'Inseratstext und Grundriss', ki: true, test: l => l.atelier},
    {id: 'evCharge', g: 'weitere', label: 'Ladestation fürs E-Auto', hint: 'Ladestation am eigenen Parkplatz oder in der Tiefgarage', src: 'Inseratstext', ki: true, test: l => l.evCharge},
    {id: 'pool', g: 'weitere', label: 'Pool oder Hallenbad', hint: 'Eigener Pool oder einer im Haus, drinnen oder draussen', src: 'Inseratstext', ki: true, test: l => l.pool},
    {id: 'sauna', g: 'weitere', label: 'Sauna', hint: 'Eigene Sauna oder Wellnessbereich im Haus, Dauermiete statt Ferienwohnung', src: 'Inseratstext', ki: true, test: l => l.sauna},
    {id: 'fitness', g: 'weitere', label: 'Fitnessraum im Haus', hint: 'Fitness- oder Gemeinschaftsraum für alle im Haus', src: 'Inseratstext', ki: true, test: l => l.fitness},
    {id: 'concierge', g: 'weitere', label: 'Concierge', hint: 'Concierge oder Empfang im Haus, Paketannahme, Service-Wohnen', src: 'Inseratstext', ki: true, test: l => l.concierge},
    {id: 'hauswart', g: 'weitere', deal: 'rent', label: 'Mit Hauswartstelle', hint: 'Zur Wohnung gehört eine Teilzeitstelle als Hauswart im Haus', src: 'Inseratstext', ki: true, test: l => l.hauswart},
    {id: 'einlieger', g: 'weitere', deal: 'buy', label: 'Mit Einliegerwohnung', hint: 'Haus mit einer zweiten, kleineren Wohnung für Eltern, Kinder oder zum Vermieten', src: 'Gebäude- und Wohnungsregister und Inseratstext', ki: true, test: l => l.einlieger},
    {id: 'umschwung', g: 'weitere', label: 'Grosses Grundstück', hint: 'Haus mit Grundstück ab 800 m², manchmal mit Stall oder Scheune', src: 'Amtliche Vermessung', ki: true, test: l => l.umschwung},
    {id: 'baurecht', g: 'weitere', deal: 'buy', label: 'Im Baurecht', hint: 'Wohnung gehört dir, der Boden nicht: tieferer Preis, dafür Baurechtszins und eine feste Dauer', src: 'Inseratstext und Grundbuch', ki: true, test: l => l.baurecht},
    {id: 'fair', g: 'preis', label: 'Fairer Preis', hint: 'Höchstens der KI-Marktwert aus vergleichbaren Inseraten', src: 'Preismodell', ki: true, test: l => l.price <= l.fair},
    {id: 'drop', g: 'preis', label: 'Preis gesenkt', hint: 'In den letzten 30 Tagen reduziert', src: 'Preisverlauf', ki: false, test: l => l.drop > 0}
  ];
  const byId = Object.fromEntries(FILTERS.map(f => [f.id, f]));

  /* ---------- badges ----------
     At most three needs people scan for, then one honest drawback. An active filter that every result shares
     (same: true) is not repeated on each listing; one that carries a value (balcony size, walking minutes) comes first. */
  const outText = l => l.outdoor.t + ' ' + l.outdoor.m2 + ' m²';
  const BADGES = {
    wm: {t: () => 'Eigene WM', same: true},
    dishwasher: {t: () => 'Geschirrspüler', same: true},
    balcony: {t: outText},
    bigOutdoor: {t: outText},
    garden: {t: outText},
    gardenShared: {t: l => l.garden ? outText(l) : 'Garten zum Mitbenutzen'},
    renovated: {t: l => l.isNew ? 'Neubau ' + l.year : 'Renoviert ' + l.renov},
    newbuild: {t: l => 'Neubau ' + l.year},
    quiet: {t: () => 'Ruhig', same: true},
    sunny: {t: () => 'Sonnig', same: true},
    lift: {t: () => 'Lift', same: true, show: l => l.lift && l.floor >= 2},
    soon: {t: l => l.avail === 'sofort' ? 'Frei ab sofort' : 'Frei ' + availText(l), show: l => l.soon},
    pets: {t: () => 'Haustiere ok', same: true, show: l => l.pets && l.deal === 'rent'},
    homeoffice: {t: () => 'Homeoffice-Zimmer', same: true},
    parking: {t: l => l.parking},
    bike: {t: () => 'Veloraum', same: true},
    cellar: {t: () => 'Keller', same: true},
    baths: {t: l => l.baths + ' Bäder', show: l => l.baths >= 2},
    wcSep: {t: () => 'Separates WC', same: true},
    bathtub: {t: () => 'Badewanne', same: true},
    bathWin: {t: () => 'Bad mit Fenster', same: true},
    winter: {t: () => 'Wintersonne', same: true},
    noflight: {t: () => 'Kein Fluglärm', same: true},
    fireplace: {t: () => 'Cheminée', same: true},
    stop: {t: l => 'Haltestelle ' + l.walk.stop + ' Min.'},
    shop: {t: l => 'Einkaufen ' + l.walk.shop + ' Min.'},
    family: {t: l => 'Schule ' + l.walk.school + ' Min.'},
    green: {t: () => 'Grün nah', same: true},
    wheelchair: {t: () => 'Rollstuhlgängig', same: true},
    minergie: {t: () => 'Minergie', same: true},
    fiber: {t: () => 'Glasfaser', same: true},
    furnished: {t: () => 'Möbliert', same: true},
    unlimited: {t: () => 'Unbefristet', same: true},
    fair: {t: l => l.price < l.fair ? dec(-fmt.delta(l), 0) + ' % unter Marktwert' : 'Fairer Preis'},
    drop: {t: l => 'Um CHF ' + (l.deal === 'rent' ? thou(l.drop) : fmt.k(l.drop)) + ' gesenkt'},
    free: {t: () => 'Unverbaubar', same: true},
    eve: {t: () => 'Abendsonne', same: true},
    skyline: {t: () => 'Über der Stadt', same: true},
    landmark: {t: l => l.vMarks[0] + ' im Blick'},
    greenView: {t: l => l.vGreen + ' % Grün im Blick'},
    lights: {t: () => 'Lichter nachts', same: true},
    privacy: {t: l => l.vPrivacy <= 1 ? 'Keine Einsicht' : 'Wenig Einsicht'},
    leafless: {t: () => 'Ganzjährig frei', same: true},
    above: {t: () => 'Über den Dächern', same: true},
    sunset: {t: l => 'Sonnenuntergang ' + G.SCENE.monthsText(l.vSunset, true)},
    living: {t: () => 'Sicht vom Wohnzimmer', same: true},
    balconyView: {t: l => 'Sicht ' + ({Balkon: 'vom Balkon', Loggia: 'von der Loggia', Terrasse: 'von der Terrasse', Dachterrasse: 'von der Dachterrasse'}[l.outdoor.t] || 'vom Balkon'), same: true},
    verified: {t: () => 'Aussicht bestätigt', same: true},
    tower: {t: l => l.floor + '. Stock'},
    old: {t: l => 'Altbau ' + l.year}
  };
  const BADGE_ORDER = ['wm', 'balcony', 'renovated', 'quiet', 'baths', 'sunny', 'lift', 'soon', 'pets', 'homeoffice', 'parking', 'stop'];
  const DRAWBACKS = [
    {test: l => l.noiseNight >= 50, t: () => 'Laut'},
    {test: l => !l.lift && l.floor >= 3, t: l => 'Kein Lift, ' + l.floor + '. OG'},
    {test: l => l.flight, t: () => 'Fluglärm'},
    {test: l => !l.wm, t: () => 'Nur Waschküche'},
    {test: l => !l.outdoor, t: () => 'Kein Balkon'},
    {test: l => l.baurecht, t: () => 'Im Baurecht: Baurechtszins'}
  ];
  function badges(l, active) {
    active = active || {};
    const ids = Object.keys(active).filter(id => active[id] && BADGES[id] && !BADGES[id].same).concat(BADGE_ORDER.filter(id => !active[id]));
    const out = [], seen = new Set();
    for (const id of ids) {
      const b = BADGES[id];
      if (!(b.show ? b.show(l) : byId[id].test(l))) continue;
      const t = b.t(l);
      if (seen.has(t)) continue;
      seen.add(t);
      out.push({t, warn: false});
      if (out.length === 3) break;
    }
    const d = DRAWBACKS.find(x => x.test(l));
    if (d) { out.length = Math.min(out.length, 2); out.push({t: d.t(l), warn: true}); }
    return out;
  }

  /* Best matches: the everyday needs weigh most, view and light still count. */
  function baseScore(l) {
    return 50 + (l.wm ? 4 : -2) + (l.outdoor ? 3 + (l.outdoor.m2 >= 10 ? 2 : 0) : -3) + (l.renovated ? 3 : 0) + (!l.lift && l.floor >= 3 ? -4 : 0) +
      (45 - l.noiseNight) * 0.5 - (l.flight ? 3 : 0) + (l.sun - 5) * 1.5 + (l.sunWinter - 2) * 0.8 + (l.view - 5) * 1.4 +
      (l.fair - l.price) / l.fair * 60 + (l.walk.stop <= 3 ? 2 : 0) + (l.walk.shop <= 5 ? 1 : 0) + (l.baths >= 2 ? 1.5 : 0) + (l.dishwasher ? 1 : 0);
  }

  /* Swiss rules of thumb. Buying: 20 % equity, and the mortgage at an imputed 5 %, 1 % upkeep and paying the second
     mortgage down to two thirds within 15 years may take at most a third of gross income. Renting: landlords usually
     ask for an income of three times the gross rent. Owner cost today: 1.5 % mortgage rate, amortisation, running costs. */
  const EQUITY = 0.2;
  const INCOME_FACTOR = 3 * (0.8 * 0.05 + 0.01 + (0.8 - 2 / 3) / 15);
  const OWN_RATE = 0.015;
  const OWN_COST = 0.8 * OWN_RATE + (0.8 - 2 / 3) / 15;
  const hid = s => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 1000003; return h; };
  const OUTER = new Set(['Höngg', 'Zollikon', 'Küsnacht', 'Kilchberg', 'Adliswil', 'Thalwil', 'Schwamendingen']);
  /* Features the sample listings do not spell out are drawn per listing, deterministically and plausibly for the building type. */
  function finalize(l) {
    if (l.lon !== undefined) { const p = proj(l.lon, l.lat); l.x = p[0]; l.y = p[1]; }
    const rent = l.deal === 'rent', q = rng(hid(l.id + '|' + l.street) + 11), p = x => q() < x;
    q();
    const modernKind = ['neubau', 'tower', 'attika', 'reihen', 'villa'].includes(l.kind);
    l.gross = rent ? l.price + l.nk : l.price;
    l.isNew = l.year >= 2012;
    l.renovated = l.isNew || (l.renov != null && l.renov >= 2015);
    l.bikeRoom = p(modernKind ? 0.8 : 0.35);
    l.bathtub = p(l.rooms >= 3.5 ? (l.kind === 'altbau' || l.kind === 'reihen' ? 0.85 : 0.55) : 0.2);
    l.baths = 1 + (l.wc2 && (l.rooms >= 4 || p(0.5)) ? 1 : 0) + (l.rooms >= 5.5 && ['villa', 'reihen', 'attika'].includes(l.kind) ? 1 : 0);
    l.wcSep = (l.wc2 && l.baths === 1) || (l.rooms >= 3.5 && p(0.3));
    l.dishwasher = l.renovated || modernKind || p(0.6);
    l.fireplace = p(['villa', 'attika', 'reihen'].includes(l.kind) ? 0.5 : l.kind === 'altbau' ? 0.2 : 0.05);
    l.wheelchair = (l.lift || l.floor === 0) && l.year >= 2000;
    l.minergie = l.year >= 2010 ? p(0.7) : l.renov != null && l.renov >= 2015 && p(0.25);
    l.furnished = rent && p(l.kind === 'studio' || l.kind === 'loft' ? 0.3 : 0.06);
    l.cellar = p(l.kind === 'loft' ? 0.5 : 0.86);
    l.fiber = p(OUTER.has(l.quarter) ? 0.55 : 0.85);
    l.temporary = rent && p(0.08);
    /* Garden. Just over half of the generated ground-floor flats with a Sitzplatz get a garden of their own beyond it
       (Gartenwohnung); many older and newer blocks have a garden all tenants may use (Gartenmitbenutzung). In the product
       both come from the listing text and the floor plan. Drawn after every other feature, so those keep their values. */
    if (l.id[0] === 'g' && l.floor === 0 && l.outdoor && l.outdoor.t === 'Sitzplatz' && p(0.55)) l.outdoor = {t: 'Garten', m2: Math.round(l.outdoor.m2 * 2.5 + 15)};
    l.garden = !!l.outdoor && l.outdoor.t === 'Garten';
    l.gardenShared = !l.garden && l.floors <= 8 && p({altbau: 0.4, villa: 0.6, neubau: 0.3, dach: 0.3, studio: 0.2, attika: 0.15, loft: 0.05}[l.kind] || 0);
    /* What people search for and portals cannot filter (SEO research, Nov 2026). In the product these come from the
       listing text, the floor plan and geodata; here they are drawn after all other features, so those keep their values. */
    const house = l.kind === 'reihen' || l.kind === 'villa', shore = lakeBearing([l.x, l.y]).dist * UNIT_KM;
    l.atLake = shore <= 0.3;
    l.atRiver = Math.min(lineDist(l.x, l.y, LIMMAT), lineDist(l.x, l.y, SIHL)) * UNIT_KM <= 0.2;
    l.lakeFront = !rent && (house || l.kind === 'attika' || l.kind === 'neubau') && shore <= 0.08;
    l.boat = l.lakeFront && p(0.5);
    l.roofTerrace = !!l.outdoor && (l.outdoor.t === 'Dachterrasse' || (l.outdoor.t === 'Terrasse' && (l.kind === 'attika' || l.floor === l.floors)));
    l.highCeil = l.ceil >= 2.8;
    l.ownEntrance = house || (l.floor === 0 && p(0.3)) || p(0.02);
    l.pool = p(house ? 0.12 : l.kind === 'attika' ? 0.08 : l.kind === 'neubau' || l.kind === 'tower' ? 0.03 : 0.005);
    l.klima = p(l.kind === 'tower' ? 0.3 : l.kind === 'attika' || l.kind === 'neubau' ? 0.15 : l.year >= 2015 ? 0.08 : 0.02);
    l.atelier = p(l.kind === 'loft' ? 0.5 : house ? 0.2 : l.kind === 'altbau' ? 0.06 : 0.03);
    l.fitness = p(l.kind === 'tower' ? 0.35 : l.kind === 'neubau' ? 0.12 : 0.02);
    l.concierge = p(l.kind === 'tower' ? 0.45 : l.kind === 'attika' && l.year >= 2015 ? 0.2 : l.kind === 'neubau' ? 0.05 : 0.01);
    l.evCharge = !!l.parking && p(l.year >= 2018 ? 0.6 : 0.12);
    l.sauna = p(house ? 0.15 : l.kind === 'attika' ? 0.12 : l.kind === 'tower' ? 0.06 : 0.01);
    l.wintergarten = p(house ? 0.1 : l.kind === 'altbau' ? 0.06 : 0.03);
    l.einlieger = house && !rent && p(0.18);
    l.plot = house ? Math.round((l.kind === 'villa' ? 450 + q() * 1300 : 160 + q() * 520) / 10) * 10 : 0;
    l.umschwung = l.plot >= 800;
    l.hauswart = rent && p(0.03);
    l.forestEdge = l.walk.park <= 3 && (OUTER.has(l.quarter) || l.hill >= 0.3);
    l.carFree = rent && l.year >= 2000 && !l.parking && p(0.3);
    l.baurecht = !rent && p(0.08);
    l.nearLake = shore <= 0.8;
    l.coop = rent && p({altbau: 0.2, neubau: 0.22, dach: 0.1, studio: 0.12, reihen: 0.15, tower: 0.05}[l.kind] || 0.02);
    l.privateOffer = p(rent ? 0.18 : 0.12);
    l.type = l.kind === 'reihen' ? 'haus' : l.kind === 'attika' ? 'attika' : l.kind === 'dach' ? 'dach' : l.kind === 'loft' ? 'loft' : l.rooms <= 1.5 ? 'studio' : 'wohnung';
    l.homeoffice = l.rooms >= 3 && l.m2 >= 60;
    l.free = l.floor >= 12 || l.kind === 'attika' || (l.hill >= 0.4 && l.floor >= 2) || (l.sees.includes('See') && l.view >= 8.2);
    l.availTime = availTime(l.avail);
    l.soon = l.availTime != null && l.availTime <= SOON;
    l.equity = rent ? 0 : Math.round(l.price * EQUITY / 1000) * 1000;
    l.income = rent ? l.gross * 36 : Math.round(l.price * INCOME_FACTOR / 1000) * 1000;
    l.monthly = rent ? l.gross : Math.round((l.price * OWN_COST / 12 + l.nk) / 10) * 10;
    if (!l.title) l.title = makeTitle(l);
    l.ai = aiSummary(l);
    l.caveat = caveat(l);
    l.base = baseScore(l);
    l.hist = l.drop ? [l.price + l.drop, l.price] : [l.price];
    return l;
  }
  /* About 500 sample listings: a broad base, then batches so every type and the rare views have enough examples
     for renting and for buying, and a search almost always has something to show. */
  const SUBURBS = ['Höngg', 'Schwamendingen', 'Adliswil', 'Thalwil', 'Albisrieden', 'Kilchberg', 'Zollikon', 'Küsnacht'];
  const LAKESIDE = ['Enge', 'Wollishofen', 'Seefeld', 'Zollikon', 'Küsnacht', 'Kilchberg', 'Thalwil'];
  const BATCHES = [
    [380, {}],
    [12, {deal: 'rent', kind: 'reihen', quarters: SUBURBS}], [10, {deal: 'rent', kind: 'attika', quarters: LAKESIDE.concat(['Fluntern', 'Hottingen', 'Höngg'])}],
    [8, {deal: 'rent', kind: 'dach', quarters: ['Hottingen', 'Fluntern', 'Wiedikon', 'Unterstrass', 'Oberstrass', 'Enge', 'Seefeld']}],
    [8, {deal: 'rent', kind: 'loft', quarters: ['Zürich-West', 'Escher-Wyss', 'Langstrasse', 'Altstetten', 'Oerlikon']}],
    [6, {deal: 'rent', kind: 'villa', quarters: ['Fluntern', 'Oberstrass', 'Höngg', 'Zollikon', 'Küsnacht', 'Kilchberg']}],
    [6, {deal: 'buy', kind: 'studio', quarters: ['Wipkingen', 'Langstrasse', 'Wiedikon', 'Unterstrass', 'Oerlikon', 'Seefeld']}],
    [6, {deal: 'buy', kind: 'loft', quarters: ['Zürich-West', 'Escher-Wyss', 'Langstrasse']}],
    [6, {deal: 'buy', kind: 'dach', quarters: ['Hottingen', 'Fluntern', 'Wiedikon', 'Enge', 'Seefeld']}],
    [8, {deal: 'buy', kind: 'attika', quarters: LAKESIDE}], [8, {deal: 'buy', kind: 'reihen', quarters: SUBURBS}],
    [20, {kind: 'neubau', quarters: LAKESIDE}], [12, {kind: 'tower', quarters: ['Zürich-West', 'Oerlikon', 'Altstetten']}]
  ];
  let gid = 0;
  const GENERATED = [];
  for (const [n, force] of BATCHES) { GENERATED.push(...generate(n, force, gid)); gid += n; }
  const LISTINGS = CURATED.concat(GENERATED).map(finalize);

  G.DATA = {LISTINGS, FILTERS, GROUPS, TYPES, fmt, badges, byId, availShort, availText, EQUITY, INCOME_FACTOR, OWN_RATE};
})(window);
