/* tests.js — which listings belong to which search (query cluster), and in what order they show.
   Shared by the page generator (Node) and the pages in the browser, so counts and listings always match. */
(function (G) {
  'use strict';
  const HB = [367, 347], ETH = [412, 338], AIRPORT = [436, -188];
  const memo = new Map();
  /* door-to-door minutes by public transport in the simplified network; copies in other cities stand in the
     same spot as their Zürich source, so their time to "the station" is the source's time to the HB */
  function ptMin(l, to, key) {
    const x = l.sx != null ? l.sx : l.x, y = l.sy != null ? l.sy : l.y, k = key + '|' + x.toFixed(1) + ',' + y.toFixed(1);
    if (!memo.has(k)) memo.set(k, G.GEO.routePT([x, y], to, false).min);
    return memo.get(k);
  }
  const station = l => ptMin(l, HB, 'hb'), uni = l => ptMin(l, ETH, 'eth'), airport = l => ptMin(l, AIRPORT, 'air');
  const house = l => l.type === 'haus';
  /* test: belongs to the search; for buy pages of "Haus mit …" only houses count */
  const T = {
    garten: l => l.garden,
    seesicht: l => l.vLake >= 1 && !l.riverView,
    waschmaschine: l => l.wm,
    hochhaus: l => l.floor >= 10,
    altbau: l => l.year < 1930,
    'naehe-hb': l => station(l) <= 15,
    'naehe-eth': l => uni(l) <= 15,
    'naehe-flughafen': l => airport(l) <= 20,
    seeanstoss: l => l.lakeFront && house(l),
    'zwei-badezimmer': l => l.baths >= 2,
    pool: (l, deal) => l.pool && (deal !== 'buy' || house(l)),
    ruhig: l => l.noiseNight < 45 && !l.flight,
    aussicht: l => l.view >= 7.5,
    einlieger: l => l.einlieger && house(l),
    dachterrasse: l => l.roofTerrace,
    umschwung: l => l.umschwung && house(l),
    klimaanlage: l => l.klima,
    atelier: (l, deal) => l.atelier && (deal !== 'buy' || house(l)),
    hauswart: l => l.hauswart,
    rheinblick: l => l.riverView,
    abendsonne: l => l.eve,
    'hund-garten': l => l.pets && l.garden,
    hindernisfrei: l => l.wheelchair,
    badewanne: l => l.bathtub,
    cheminee: l => l.fireplace,
    penthouse: l => l.type === 'attika',
    wintergarten: l => l.wintergarten,
    'im-gruenen': l => l.forestEdge,
    autofrei: l => l.carFree,
    ladestation: l => l.evCharge,
    sauna: l => l.sauna,
    minergie: l => l.minergie,
    concierge: l => l.concierge,
    glasfaser: l => l.fiber,
    'am-see': l => l.atLake,
    'eigener-eingang': l => l.ownEntrance,
    'am-fluss': l => l.atRiver || l.riverView,
    'offene-kueche': l => l.openKitchen,
    baurecht: l => l.baurecht,
    'hohe-decken': l => l.highCeil,
    fitnessraum: l => l.fitness
  };
  /* order on the page: the strongest examples of the feature first, otherwise the best overall */
  const RANK = {
    seesicht: (a, b) => b.vLake - a.vLake || b.view - a.view,
    aussicht: (a, b) => b.view - a.view,
    rheinblick: (a, b) => b.view - a.view,
    'naehe-hb': (a, b) => station(a) - station(b),
    'naehe-eth': (a, b) => uni(a) - uni(b),
    'naehe-flughafen': (a, b) => airport(a) - airport(b),
    hochhaus: (a, b) => b.floor - a.floor,
    dachterrasse: (a, b) => (b.outdoor ? b.outdoor.m2 : 0) - (a.outdoor ? a.outdoor.m2 : 0),
    garten: (a, b) => (a.type === 'haus') - (b.type === 'haus') || (b.outdoor ? b.outdoor.m2 : 0) - (a.outdoor ? a.outdoor.m2 : 0),
    ruhig: (a, b) => a.noiseNight - b.noiseNight,
    'hohe-decken': (a, b) => b.ceil - a.ceil
  };
  const rank = id => RANK[id] || ((a, b) => b.base - a.base);
  /* what a card says about the feature, so each page shows why a listing is on it */
  const NOTE = {
    garten: l => 'Eigener Garten' + (l.outdoor ? ' ' + l.outdoor.m2 + ' m²' : ''),
    seesicht: l => ['', 'See: ein Streifen', 'See breit im Blick', 'Seepanorama'][l.vLake],
    hochhaus: l => l.floor + '. Stock',
    altbau: l => 'Baujahr ' + l.year,
    'naehe-hb': l => station(l) + ' Min. zum Bahnhof',
    'naehe-eth': l => uni(l) + ' Min. zur ETH',
    'naehe-flughafen': l => airport(l) + ' Min. zum Flughafen',
    seeanstoss: l => 'Seeanstoss' + (l.boat ? ' mit Bootsplatz' : ''),
    'zwei-badezimmer': l => l.baths + ' Bäder' + (l.wcSep ? ' + WC' : ''),
    ruhig: l => 'Nachts ' + l.noiseNight + ' dB',
    aussicht: l => 'Aussicht ' + l.view.toFixed(1),
    dachterrasse: l => (l.outdoor ? l.outdoor.t + ' ' + l.outdoor.m2 + ' m²' : 'Dachterrasse'),
    rheinblick: l => 'Blick auf den ' + (l.water || 'Fluss'),
    abendsonne: l => 'Abendsonne, ' + l.sun.toFixed(1) + ' h Sonne',
    'hohe-decken': l => l.ceil.toFixed(2).replace('.', ',') + ' m Raumhöhe',
    'am-see': l => 'Wenige Minuten zum ' + (l.water || 'See'),
    'am-fluss': l => 'Am ' + (l.riverView ? l.water : 'Fluss'),
    umschwung: l => 'Grundstück ' + l.plot + ' m²'
  };
  G.LAGE = {TESTS: T, rank, NOTE, station, uni, airport};
})(typeof window !== 'undefined' ? window : globalThis);
