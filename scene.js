/* scene.js — procedural photo stand-ins (SVG data URIs) and floor plans. */
(function (G) {
  'use strict';

  const SKY = {
    day:    {sky:['#8DBFE5','#DCEBF4',0.64],sun:['#FFF4D2',318,62,16],far:'#A9BCCF',snow:'#F4F7FA',hills:'#5E8462',lake:'#74A9CB',glint:'#BFDDEE',ground:'#7C9A6C',back:'#C5CAD0',win:'#3D4B5B',lit:'#3D4B5B',trees:'#4C7550',trim:'#FFFFFF',k:0},
    golden: {sky:['#E8A06A','#F6DCB8',0.64],sun:['#FFE0A3',300,124,22],far:'#C49F9C',snow:'#FBEADF',hills:'#6A6D50',lake:'#D49E7E',glint:'#F7D6AE',ground:'#8A8658',back:'#C9AF9C',win:'#4A3E3E',lit:'#FFD486',trees:'#535D3D',trim:'#FFF3E2',k:0.08},
    dusk:   {sky:['#26305A','#D88B73',0.72],sun:['#F6B28B',86,164,26],far:'#4E5179',snow:'#B6B2CC',hills:'#2D3450',lake:'#585C8B',glint:'#E2A188',ground:'#383E5E',back:'#474A6B',win:'#282C46',lit:'#FFC670',trees:'#252B44',trim:'#8B8CAB',k:0.38},
    night:  {sky:['#04071A','#1B244E',0.76],sun:['#E8ECF6',322,56,11],far:'#1A2145',snow:'#58618E',hills:'#0D132F',lake:'#131A3B',glint:'#38447E',ground:'#111739',back:'#1B2145',win:'#141935',lit:'#FFC05E',trees:'#0A0F28',trim:'#3A426F',k:0.62}
  };
  const KINDS = {tower:['#DCE1E7','#AAB4C0','#8B95A2'],altbau:['#E7D4B8','#B8A487','#6E615C'],loft:['#A3563C','#7A3E2C','#594844'],villa:['#F0EFEA','#C8C6BD','#8A8882'],neubau:['#EFEEE9','#C5C3BB','#98968E'],studio:['#D8D1C2','#ADA594','#7B7468'],dach:['#E9DECA','#C1B49B','#B2543A'],attika:['#CFC3B3','#E1EEF5','#3A4149'],reihen:['#EEE5D5','#C8BCA5','#9A4D36']};
  const TINT = {day:null, golden:['#F2A65A',0.16], dusk:['#2A3056',0.56], night:['#090E2B',0.74]};
  function tint(hex, time) {
    const t = TINT[time];
    if (!t) return hex;
    const a = parseInt(hex.slice(1), 16), b = parseInt(t[0].slice(1), 16);
    return '#' + [16, 8, 0].map(s => Math.round(((a >> s) & 255) * (1 - t[1]) + ((b >> s) & 255) * t[1]).toString(16).padStart(2, '0')).join('');
  }
  function rnd(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }
  function hash(str) { let h = 7; for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) % 1000003; return h + 1; }
  const f1 = n => Math.round(n * 10) / 10;
  const R1 = (x, y, w, h) => 'M' + f1(x) + ',' + f1(y) + 'h' + f1(w) + 'v' + f1(h) + 'h' + f1(-w) + 'z';
  const CIRC = (x, y, r) => 'M' + f1(x - r) + ',' + f1(y) + 'a' + r + ',' + r + ' 0 1,0 ' + f1(2 * r) + ',0a' + r + ',' + r + ' 0 1,0 ' + f1(-2 * r) + ',0';

  function layers(l, time) {
    const P = SKY[time], R = rnd(hash(l.id)), K = KINDS[l.kind].map(c => tint(c, time));
    const o = {far:'', snow:'', hills:'', lake:'', glint:'', ground:'', back:'', body:'', shade:'', roof:'', win:'', lit:'', trim:'', trees:''};
    const c = {far:P.far, snow:P.snow, hills:P.hills, lake:P.lake, glint:P.glint, ground:P.ground, back:P.back, body:K[0], shade:K[1], roof:K[2], win:P.win, lit:P.lit, trim:P.trim, trees:P.trees};
    const grid = (x0, y0, cols, rows, dx, dy, w, h, p) => {
      for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) { const s = R1(x0 + cc * dx, y0 + r * dy, w, h); if (R() < p) o.lit += s; else o.win += s; }
    };
    const alps = l.sees.includes('Alpen'), lake = l.sees.includes('See');
    const ridge = [];
    for (let x = -8; x <= 408; x += 16) ridge.push([x, alps ? 132 + R() * 38 + Math.abs(x - 200) / 8 : 168 + R() * 12 + Math.abs(x - 200) / 14]);
    o.far = 'M-8,300' + ridge.map(p => 'L' + p[0] + ',' + p[1].toFixed(0)).join('') + 'L408,300Z';
    if (alps) o.snow = ridge.map((p, i) => (i > 0 && i < ridge.length - 1 && p[1] < ridge[i - 1][1] && p[1] < ridge[i + 1][1]) ? 'M' + (p[0] - 7) + ',' + (p[1] + 9).toFixed(0) + 'L' + p[0] + ',' + p[1].toFixed(0) + 'L' + (p[0] + 7) + ',' + (p[1] + 9).toFixed(0) + 'Z' : '').join('');
    o.hills = lake ? 'M-8,300L-8,196Q100,184 200,192T408,188L408,300Z' : 'M-8,300L-8,206Q90,186 200,198T408,192L408,300Z';
    if (lake) { o.lake = 'M-8,198H408V238H-8Z'; for (let i = 0; i < 7; i++) o.glint += R1(10 + i * 58 + R() * 24, 204 + R() * 28, 18 + R() * 22, 1.5); }
    o.ground = lake ? 'M-8,236H408V300H-8Z' : 'M-8,226H408V300H-8Z';
    switch (l.kind) {
      case 'tower': {
        const top = l.floor >= 25 ? 18 : 34;
        for (let i = 0; i < 5; i++) { const h = 54 + R() * 58, x = 4 + i * 44; o.back += R1(x, 300 - h, 40, h); grid(x + 5, 306 - h, 3, Math.floor((h - 12) / 12), 11, 12, 6, 6, P.k); }
        for (let i = 0; i < 2; i++) { const h = 70 + R() * 50, x = 322 + i * 40; o.back += R1(x, 300 - h, 36, h); grid(x + 5, 306 - h, 3, Math.floor((h - 12) / 12), 10, 12, 6, 6, P.k); }
        o.body = R1(226, top, 66, 300 - top); o.shade = R1(292, top + 6, 20, 294 - top);
        o.roof = R1(222, top - 6, 74, 7) + R1(246, top - 18, 26, 12);
        grid(232, top + 10, 5, Math.floor((288 - top) / 9), 12, 9, 7.5, 4.6, P.k);
        for (let y = top + 14; y < 296; y += 18) o.trim += R1(292, y, 20, 1.4);
        o.trees = CIRC(40, 290, 16) + CIRC(70, 294, 13) + CIRC(360, 292, 15);
        break;
      }
      case 'altbau': {
        o.back = R1(-8, 132, 32, 168) + R1(376, 124, 32, 176);
        o.body = R1(24, 110, 352, 190);
        o.roof = 'M16,112L40,82H360L384,112Z' + R1(70, 88, 20, 16) + R1(152, 88, 20, 16) + R1(230, 88, 20, 16) + R1(310, 88, 20, 16);
        o.shade = R1(24, 262, 352, 38);
        grid(40, 124, 8, 4, 42, 34, 17, 25, P.k);
        o.win += R1(40, 270, 60, 26) + R1(124, 270, 60, 26) + R1(216, 270, 60, 26) + R1(300, 270, 60, 26);
        o.trim = R1(16, 108, 368, 4) + R1(24, 156, 352, 2.2) + R1(24, 260, 352, 3);
        for (let r = 0; r < 4; r++) for (let cc = 0; cc < 8; cc++) o.trim += R1(38 + cc * 42, 150 + r * 34, 21, 2.4);
        o.trees = CIRC(56, 266, 24) + CIRC(28, 280, 18) + CIRC(352, 262, 28);
        break;
      }
      case 'loft': {
        o.back = R1(-8, 150, 30, 150); o.body = R1(18, 128, 364, 172);
        let saw = 'M18,128';
        for (let i = 0; i < 7; i++) saw += 'L' + (44 + i * 52) + ',104L' + (70 + i * 52) + ',128';
        o.roof = saw + 'Z' + R1(334, 58, 18, 48); o.shade = R1(18, 274, 364, 26);
        grid(34, 146, 5, 2, 70, 62, 54, 46, P.k);
        for (let r = 0; r < 2; r++) for (let cc = 0; cc < 5; cc++) { const x = 34 + cc * 70, y = 146 + r * 62; o.trim += R1(x + 26, y, 2, 46) + R1(x, y + 22, 54, 2); }
        o.trees = CIRC(372, 280, 18);
        break;
      }
      case 'villa': {
        o.ground = 'M-8,300L-8,238Q200,214 408,226L408,300Z';
        o.body = R1(84, 152, 232, 86) + R1(136, 110, 174, 42); o.shade = R1(316, 152, 22, 86);
        o.roof = R1(132, 104, 182, 6) + R1(80, 148, 262, 5);
        grid(98, 166, 4, 1, 52, 0, 46, 44, P.k * 1.5); grid(146, 118, 3, 1, 54, 0, 48, 26, P.k * 1.5);
        o.trim = R1(80, 140, 262, 1.6) + R1(80, 238, 262, 3);
        o.trees = CIRC(44, 226, 30) + CIRC(14, 250, 22) + CIRC(368, 214, 34) + CIRC(394, 246, 26) + CIRC(110, 262, 16);
        break;
      }
      case 'neubau': {
        o.back = R1(-8, 160, 46, 140) + R1(362, 150, 46, 150);
        o.body = R1(54, 102, 292, 198); o.shade = R1(346, 108, 16, 192); o.roof = R1(50, 96, 300, 7);
        for (let fl = 0; fl < 5; fl++) grid(62, 110 + fl * 38, 6, 1, 47, 0, 43, 22, P.k);
        for (let fl = 0; fl < 5; fl++) o.trim += R1(46, 134 + fl * 38, 308, 5) + R1(46, 128 + fl * 38, 308, 1.4);
        o.trees = CIRC(24, 274, 22) + CIRC(378, 276, 20);
        break;
      }
      case 'studio': {
        o.lake = 'M-8,262H408V300H-8Z'; o.glint = R1(40, 272, 40, 1.5) + R1(150, 282, 60, 1.5) + R1(280, 270, 50, 1.5);
        o.ground = 'M-8,226H408V262H-8Z'; o.back = R1(-8, 140, 40, 122) + R1(366, 120, 42, 142);
        o.body = R1(44, 92, 312, 170); o.shade = R1(44, 244, 312, 18); o.roof = R1(40, 86, 320, 7);
        grid(58, 104, 7, 5, 43, 28, 20, 15, P.k);
        for (let r = 0; r < 5; r++) o.trim += R1(44, 124 + r * 28, 312, 2);
        o.trees = CIRC(22, 236, 20) + CIRC(380, 232, 22);
        break;
      }
      case 'dach': {
        o.back = 'M-8,300L-8,190L30,160L70,190L70,300Z' + 'M330,300L330,186L370,156L408,186L408,300Z' + R1(-8, 220, 416, 80);
        o.body = R1(78, 162, 244, 138); o.roof = 'M60,164L200,94L340,164Z' + R1(250, 96, 14, 34);
        o.shade = 'M168,140L200,120L232,140V158H168Z';
        grid(180, 138, 2, 1, 26, 0, 14, 16, P.k); grid(98, 184, 5, 3, 44, 38, 22, 24, P.k);
        o.trim = R1(60, 162, 280, 3); o.trees = CIRC(30, 262, 20) + CIRC(372, 258, 24);
        break;
      }
      case 'attika': {
        o.hills = 'M-8,300L-8,172Q120,158 220,166T408,162L408,300Z'; o.lake = 'M-8,182H408V252H-8Z'; o.glint = '';
        for (let i = 0; i < 9; i++) o.glint += R1(8 + i * 46 + R() * 16, 188 + R() * 56, 16 + R() * 24, 1.6);
        o.ground = ''; o.body = R1(-8, 252, 416, 48); o.shade = R1(-8, 212, 416, 40);
        c.shade = (time === 'dusk' || time === 'night') ? 'rgba(160,175,220,0.18)' : 'rgba(225,238,245,0.32)';
        o.roof = R1(-8, 208, 416, 4);
        for (let i = 0; i < 6; i++) o.win += R1(20 + i * 76, 212, 3, 40);
        for (let i = 0; i < 5; i++) o.trim += R1(-8, 262 + i * 9, 416, 1);
        o.trees = CIRC(352, 232, 18) + R1(338, 240, 28, 14);
        break;
      }
      case 'reihen': {
        for (let i = 0; i < 4; i++) {
          const x = 14 + i * 94;
          o.body += R1(x, 150, 88, 112); o.roof += 'M' + (x - 5) + ',152L' + (x + 44) + ',110L' + (x + 93) + ',152Z';
          grid(x + 12, 166, 2, 1, 44, 0, 24, 22, P.k); grid(x + 12, 210, 1, 1, 0, 0, 24, 22, P.k);
          o.win += R1(x + 58, 214, 18, 48);
        }
        o.shade = R1(14, 250, 370, 12); o.ground = 'M-8,262H408V300H-8Z'; o.trim = R1(14, 148, 370, 2);
        o.trees = R1(-8, 262, 416, 10) + CIRC(40, 280, 16) + CIRC(150, 286, 14) + CIRC(250, 282, 15) + CIRC(360, 280, 18);
        break;
      }
    }
    return {o, c, P};
  }

  const ORDER = ['far','snow','hills','lake','glint','ground','back','body','shade','roof','win','lit','trim','trees'];
  const cache = new Map();
  function photo(l, time) {
    const key = l.id + '|' + time;
    if (cache.has(key)) return cache.get(key);
    const {o, c, P} = layers(l, time);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">' +
      '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.sky[0] + '"/><stop offset="' + P.sky[2] + '" stop-color="' + P.sky[1] + '"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#s)"/><circle cx="' + P.sun[1] + '" cy="' + P.sun[2] + '" r="' + P.sun[3] + '" fill="' + P.sun[0] + '"/>' +
      ORDER.map(k => o[k] ? '<path d="' + o[k] + '" fill="' + c[k] + '"/>' : '').join('') + '</svg>';
    const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    cache.set(key, uri);
    return uri;
  }
  const TIMES = ['day', 'golden', 'dusk', 'night'];
  const TIME_LABEL = {day:'Mittag', golden:'Abendsonne', dusk:'Dämmerung', night:'Nacht'};

  /* ---------- floor plans (schematic, scaled to the listing's m²) ---------- */
  const PLANS = {
    1: {W:8, H:6, rooms:[[0,0,8,3.8,'Wohnen/Schlafen'],[0,3.8,3,2.2,'Küche'],[3,3.8,2.6,2.2,'Bad'],[5.6,3.8,2.4,2.2,'Entrée']], out:[0.5,-1.3,4,1.3]},
    2: {W:10, H:6.2, rooms:[[0,0,6,3.8,'Wohnen/Essen'],[6,0,4,3.8,'Zimmer'],[0,3.8,3.4,2.4,'Küche'],[3.4,3.8,2.6,2.4,'Bad'],[6,3.8,4,2.4,'Entrée']], out:[1,-1.4,4,1.4]},
    3: {W:12, H:6.4, rooms:[[0,0,6.2,3.9,'Wohnen/Essen'],[6.2,0,3,3.9,'Zimmer'],[9.2,0,2.8,3.9,'Zimmer'],[0,3.9,3.6,2.5,'Küche'],[3.6,3.9,2.6,2.5,'Bad'],[6.2,3.9,3,2.5,'Entrée'],[9.2,3.9,2.8,2.5,'Réduit']], out:[0.6,-1.5,5,1.5]},
    4: {W:14, H:6.6, rooms:[[0,0,6,4,'Wohnen/Essen'],[6,0,4,4,'Zimmer'],[10,0,4,4,'Zimmer'],[0,4,3.6,2.6,'Küche'],[3.6,4,2.4,2.6,'Bad'],[6,4,2.6,2.6,'Entrée'],[8.6,4,2.4,2.6,'Dusche/WC'],[11,4,3,2.6,'Zimmer']], out:[0.5,-1.6,5.5,1.6]},
    5: {W:12, H:8, rooms:[[0,0,7,4.5,'Wohnen/Essen'],[7,0,5,4.5,'Küche'],[0,4.5,4,3.5,'Zimmer'],[4,4.5,3,3.5,'Entrée'],[7,4.5,2.5,3.5,'WC'],[9.5,4.5,2.5,3.5,'Réduit']], out:[0,-2.2,12,2.2]}
  };
  function plan(l) {
    const T = PLANS[Math.min(5, Math.max(1, Math.floor(l.rooms)))];
    const k = l.m2 / (T.W * T.H), u = 24;
    const pad = 22, top = T.out ? T.out[3] * u + pad : pad;
    const vbW = T.W * u + pad * 2, vbH = T.H * u + top + pad;
    let s = '<svg class="plan" viewBox="0 0 ' + vbW + ' ' + vbH + '" role="img" aria-label="Grundriss, schematisch">';
    if (T.out && l.outdoor) {
      const [ox, oy, ow, oh] = T.out;
      s += '<rect class="plan-out" x="' + (pad + ox * u) + '" y="' + (top + oy * u) + '" width="' + ow * u + '" height="' + oh * u + '"/>';
      s += '<text class="plan-t plan-t-s" x="' + (pad + (ox + ow / 2) * u) + '" y="' + (top + (oy + oh / 2) * u + 4) + '">' + l.outdoor.t + ' ' + l.outdoor.m2 + ' m²</text>';
    }
    for (const [x, y, w, h, name] of T.rooms) {
      const wet = /Bad|Dusche|WC/.test(name);
      s += '<rect class="plan-room' + (wet ? ' plan-wet' : '') + '" x="' + (pad + x * u) + '" y="' + (top + y * u) + '" width="' + w * u + '" height="' + h * u + '"/>';
      const big = w * h >= 9;
      s += '<text class="plan-t' + (big ? '' : ' plan-t-s') + '" x="' + (pad + (x + w / 2) * u) + '" y="' + (top + (y + h / 2) * u - (big ? 2 : 0)) + '">' + name + '</text>';
      s += '<text class="plan-t plan-t-m" x="' + (pad + (x + w / 2) * u) + '" y="' + (top + (y + h / 2) * u + (big ? 13 : 11)) + '">' + Math.round(w * h * k) + ' m²</text>';
      if (wet && l.bathWin && y > 0) s += '<rect class="plan-win" x="' + (pad + (x + w * 0.25) * u) + '" y="' + (top + (y + h) * u - 2) + '" width="' + w * 0.5 * u + '" height="4"/>';
    }
    s += '<rect class="plan-wall" x="' + pad + '" y="' + top + '" width="' + T.W * u + '" height="' + T.H * u + '"/>';
    const wm = Math.round(T.W * Math.sqrt(k) * 10) / 10;
    s += '<text class="plan-t plan-t-m" x="' + (pad + T.W * u / 2) + '" y="' + (vbH - 5) + '">' + wm + ' m</text>';
    s += '</svg>';
    return s;
  }

  /* ================= the view from the flat =================
     One landscape per listing, drawn from what the analysis says it sees (lake, Alps, city, green), how high it is
     and how open the view is. The same random layout is reused at every time of day and in every window. */
  const VP = {
    day: {sky: ['#73B0E1', '#DCECF7'], sun: '#FFF8E0', far: '#9DB2C7', snow: '#F8FBFD', haze: '#E6F0F6', hillFar: '#8AA58F', lake: '#5A98C4', lakeFar: '#93C0DD', glint: '#F0F8FC', ground: '#A7AEAB', roof: ['#B8634C', '#A35742', '#C77D60', '#8D5345', '#97A0AA'], wall: ['#EEE7DB', '#E2D8C8', '#F5F1EA', '#D7CDBE', '#E8E3DA'], win: '#5E738A', lit: '#5E738A', tree: '#4E7948', tree2: '#679157'},
    golden: {sky: ['#E28F58', '#F9E1BF'], sun: '#FFE9B2', far: '#BC9898', snow: '#FCE6D9', haze: '#F6D6B0', hillFar: '#98896A', lake: '#CC9676', lakeFar: '#E4B892', glint: '#FFEBC4', ground: '#AC9E8F', roof: ['#B0553C', '#9C4B38', '#C36C4D', '#87473B', '#A1908A'], wall: ['#F4DBC0', '#EACBA9', '#F8E6CF', '#DFC1A1', '#EDD4B9'], win: '#5D4C48', lit: '#FFD27E', tree: '#5B6839', tree2: '#727D46'},
    night: {sky: ['#03081A', '#1E2A5B'], sun: '#EEF1FA', far: '#202954', snow: '#606A99', haze: '#28316A', hillFar: '#161D42', lake: '#0E1638', lakeFar: '#19234E', glint: '#FFD37E', ground: '#151B3C', roof: ['#1C2245', '#21284E', '#181E40', '#252C54', '#1A2044'], wall: ['#242A50', '#283059', '#202647', '#2C335C', '#232A4E'], win: '#171C3B', lit: '#FFC86B', tree: '#0A0F27', tree2: '#0E1537'}
  };
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const C = (x, y, r) => CIRC(x, y, f1(r));
  const tag = (d, fill, extra) => d ? '<path d="' + d + '" fill="' + fill + '"' + (extra || '') + '/>' : '';
  const box = (x, y, w, h, fill, extra) => '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" fill="' + fill + '"' + (extra || '') + '/>';
  const mix = (a, b, t) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); return '#' + [16, 8, 0].map(s => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t).toString(16).padStart(2, '0')).join(''); };
  const uri = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const svgDoc = (defs, body) => uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"><defs>' + defs + '</defs>' + body + '</svg>');
  const skyDefs = P => '<linearGradient id="vs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.sky[0] + '"/><stop offset="1" stop-color="' + P.sky[1] + '"/></linearGradient>' +
    '<linearGradient id="vl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.lakeFar + '"/><stop offset="1" stop-color="' + P.lake + '"/></linearGradient>' +
    '<linearGradient id="vh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.haze + '" stop-opacity="0"/><stop offset="1" stop-color="' + P.haze + '" stop-opacity=".75"/></linearGradient>';

  /* hz: horizon (eye level) in the 400 × 500 frame. key: which layout; use the same key to get the same view. */
  function landscape(l, time, hz, key) {
    const P = VP[time], H = 500, night = time === 'night';
    const R = rnd(hash(l.id + '|' + key)), RW = rnd(hash(l.id + '|' + key + '|' + time));
    const lake = l.sees.includes('See'), alps = l.sees.includes('Alpen'), city = l.sees.includes('Stadt'), green = l.sees.includes('Grün');
    const open = clampN((l.view - 3) / 6, 0, 1), high = clampN(l.floor / 22, 0, 1);
    let s = box(-10, -10, 420, hz + 16, 'url(#vs)');
    if (night) { let st = ''; for (let i = 0; i < 54; i++) st += C(RW() * 400, RW() * hz * 0.8, RW() < 0.12 ? 1.2 : 0.7); s += tag(st, '#FFFFFF', ' opacity=".8"'); }
    if (time === 'day') s += '<circle cx="322" cy="' + f1(hz * 0.24) + '" r="19" fill="' + P.sun + '"/>';
    else if (time === 'golden') {
      const sx = l.eve ? 236 : 362, sy = hz - (l.eve ? 24 : 74);
      s += '<circle cx="' + sx + '" cy="' + f1(sy) + '" r="86" fill="' + P.sun + '" opacity=".26"/><circle cx="' + sx + '" cy="' + f1(sy) + '" r="27" fill="' + P.sun + '"/>';
    } else s += '<circle cx="302" cy="' + f1(hz * 0.3) + '" r="13" fill="' + P.sun + '"/><circle cx="308" cy="' + f1(hz * 0.3 - 4) + '" r="11.5" fill="' + P.sky[0] + '"/>';
    /* Alps: a jagged ridge with snow caps, bigger the more open and higher the flat is */
    if (alps) {
      const amp = 22 + open * 30 + high * 18, pts = [];
      for (let x = -14; x <= 414; x += 12 + R() * 12) pts.push([x, hz - 4 - amp * (0.3 + R() * 0.7) * (0.6 + 0.4 * Math.sin(x / 400 * Math.PI))]);
      let d = 'M-14,' + f1(hz + 6);
      for (const p of pts) d += 'L' + f1(p[0]) + ',' + f1(p[1]);
      s += tag(d + 'L414,' + f1(hz + 6) + 'Z', P.far);
      let sn = '';
      for (let i = 1; i < pts.length - 1; i++) {
        const [px, py] = pts[i], A = pts[i - 1], B = pts[i + 1];
        if (!(py < A[1] && py < B[1]) || py > hz - amp * 0.5) continue;
        const cap = Math.min(15, A[1] - py, B[1] - py) * 0.75;
        const lx = px + (A[0] - px) * cap / (A[1] - py), rx = px + (B[0] - px) * cap / (B[1] - py), by = py + cap;
        sn += 'M' + f1(lx) + ',' + f1(by) + 'L' + f1(px) + ',' + f1(py) + 'L' + f1(rx) + ',' + f1(by) + 'L' + f1(px + (rx - px) * 0.4) + ',' + f1(by - cap * 0.3) + 'L' + f1(px - (px - lx) * 0.3) + ',' + f1(by - cap * 0.15) + 'Z';
      }
      s += tag(sn, P.snow, night ? ' opacity=".55"' : '');
    }
    s += box(-10, hz - 48, 420, 54, 'url(#vh)');
    /* far hills (Uetliberg, Zürichberg, Pfannenstiel) */
    let hd = 'M-14,' + f1(hz + 8), x = -14;
    while (x < 414) { const w = 50 + R() * 70; hd += 'Q' + f1(x + w / 2) + ',' + f1(hz - 4 - R() * (10 + open * 14)) + ' ' + f1(x + w) + ',' + f1(hz + 1 - R() * 3); x += w; }
    s += tag(hd + 'L' + f1(x) + ',' + f1(hz + 8) + 'Z', P.hillFar);
    /* lake with the far shore, glints and a sailing boat */
    let g0 = hz + 2;
    if (lake) {
      const lh = 14 + open * 44 + high * 24;
      s += box(-10, hz, 420, lh, 'url(#vl)');
      let shore = '';
      for (let xx = -6; xx < 404; xx += 5 + R() * 9) shore += R1(xx, hz - 1.5 - R() * 2.5, 2 + R() * 4, 2 + R() * 2.5);
      s += tag(shore, night ? P.lit : P.wall[1], night ? ' opacity=".85"' : ' opacity=".75"');
      let gl = '';
      for (let i = 0; i < 18; i++) gl += R1(R() * 400, hz + 3 + R() * (lh - 6), 6 + R() * 22, night ? 1.1 : 1.3);
      s += tag(gl, P.glint, night ? ' opacity=".6"' : ' opacity=".85"');
      if (time === 'golden' && l.eve) { let col = ''; for (let i = 0; i < 9; i++) { const w = 26 - i * 2.2; col += R1(236 - w / 2 + (RW() - 0.5) * 6, hz + 2 + i * lh / 9, w, 1.8); } s += tag(col, P.sun, ' opacity=".85"'); }
      if (!night) { const bx = 40 + RW() * 300, by = hz + lh * (0.35 + RW() * 0.4); s += tag('M' + f1(bx) + ',' + f1(by) + 'h16l-3,4h-10z', '#FFFFFF') + tag('M' + f1(bx + 7) + ',' + f1(by - 1) + 'v-13l7,12z', '#FFFFFF', ' opacity=".95"'); }
      g0 = hz + lh;
    }
    s += box(-10, g0 - 1, 420, H - g0 + 12, city ? P.ground : P.tree2);
    /* five rows of houses and trees, far to near; from high up they shrink below the horizon */
    const depth = H - g0;
    for (let r = 0; r < 5; r++) {
      const t = (r + 1) / 5, base = g0 + depth * Math.pow(t, 1.3) + 4, k = (0.32 + t * 1.15) * (1.2 - high * 0.55);
      const walls = ['', '', '', '', ''], roofs = ['', '', '', '', ''];
      let wins = '', lits = '', trees = '', bx = -14 - R() * 24;
      while (bx < 414) {
        if (R() < (green ? 0.3 : city ? 0.08 : 0.4)) { const rr = (6 + R() * 7) * k; trees += C(bx + rr, base - rr * 0.85, rr) + C(bx + rr * 1.9, base - rr * 0.6, rr * 0.82); bx += rr * 2.6; continue; }
        const tower = city && r <= 2 && R() < 0.06;
        const w = (tower ? 11 + R() * 8 : 16 + R() * 24) * k, h = (tower ? 54 + R() * 44 : 11 + R() * 17) * k * (city ? 1 : 0.8);
        const top = base - h, ci = Math.floor(R() * 5);
        walls[ci] += R1(bx, top, w, h);
        if (!tower && R() < (city ? 0.55 : 0.85)) roofs[ci] += 'M' + f1(bx - 1) + ',' + f1(top + 0.5) + 'L' + f1(bx + w * (0.3 + R() * 0.4)) + ',' + f1(top - Math.min(h * 0.5, 9 * k + 3)) + 'L' + f1(bx + w + 1) + ',' + f1(top + 0.5) + 'Z';
        if (k > 0.62 || night) {
          const ww = 2 * k + 0.4, wh = 2.6 * k + 0.4;
          for (let y = top + wh * 1.2; y < base - wh * 1.6; y += wh * 2.2) for (let xx = bx + ww; xx < bx + w - ww * 1.4; xx += ww * 2.4) {
            if (night && RW() < 0.45) lits += R1(xx, y, ww, wh); else if (k > 0.62) wins += R1(xx, y, ww, wh);
          }
        }
        bx += w + (R() < 0.3 ? 2 + R() * 7 : 0.6);
      }
      for (let i = 0; i < 5; i++) s += tag(walls[i], P.wall[i]) + tag(roofs[i], P.roof[i]);
      s += tag(wins, P.win, ' opacity=".55"') + tag(lits, P.lit) + tag(trees, r % 2 ? P.tree : P.tree2);
    }
    /* a poor view honestly: the house across the street fills the window */
    if (open < 0.34 && l.floor < 7) {
      const fTop = hz + 30 - (0.34 - open) * 420, fx = 18 + R() * 50, fw = 400 - fx + 30;
      s += box(fx, fTop, fw, H - fTop + 10, P.wall[3]) + box(fx - 6, fTop - 8, fw + 12, 9, P.roof[3]);
      let fw2 = '', fl2 = '';
      for (let y = fTop + 26; y < H; y += 74) for (let xx = fx + 22; xx < fx + fw - 30; xx += 64) { const r2 = R1(xx, y, 30, 42); if (night && RW() < 0.4) fl2 += r2; else fw2 += r2; }
      s += tag(fw2, P.win, ' opacity=".7"') + tag(fl2, P.lit);
    }
    return s;
  }

  function plant(x, y, k, night) {
    const pot = night ? '#3A2E3A' : '#C8693F', leaf = night ? '#13203A' : '#4F8A4B', leaf2 = night ? '#182844' : '#6BA05E';
    return tag('M' + f1(x - 14 * k) + ',' + f1(y - 30 * k) + 'h' + f1(28 * k) + 'l' + f1(-3 * k) + ',' + f1(30 * k) + 'h' + f1(-22 * k) + 'z', pot) +
      tag(C(x, y - 46 * k, 15 * k) + C(x - 13 * k, y - 38 * k, 11 * k) + C(x + 13 * k, y - 40 * k, 12 * k), leaf) +
      tag(C(x + 4 * k, y - 56 * k, 9 * k) + C(x - 7 * k, y - 50 * k, 7 * k), leaf2);
  }
  /* a side-view chair standing on y, facing right (dir 1) or left (-1) */
  function chair(x, y, k, dir, c) {
    const back = dir > 0 ? x : x + 26 * k;
    return box(back, y - 44 * k, 4 * k, 44 * k, c) + box(x, y - 20 * k, 30 * k, 5 * k, c) + box(x + 2 * k, y - 16 * k, 3 * k, 16 * k, c) + box(x + 25 * k, y - 16 * k, 3 * k, 16 * k, c);
  }

  /* what is in front of the camera: the railing of the balcony, the hedge of the garden, or the window frame */
  function foreground(l, time) {
    const night = time === 'night', P = VP[time], t = l.outdoor ? l.outdoor.t : null;
    if (t === 'Garten' || t === 'Sitzplatz') return tag('M-10,436Q50,412 112,432T236,428T410,430V510H-10Z', P.tree) + box(-10, 472, 420, 40, P.tree2);
    if (t) {
      const metal = night ? '#2B3258' : '#3D454E', modern = ['tower', 'neubau', 'attika'].includes(l.kind);
      let s = '';
      if (t === 'Loggia') s += box(-10, -10, 420, 34, night ? '#1F2547' : '#CFCAC2') + box(-10, -10, 32, 520, night ? '#1A2041' : '#BDB7AE') + box(378, -10, 32, 520, night ? '#1A2041' : '#C6C0B8');
      if (modern) s += box(-10, 398, 420, 80, night ? '#8A9BD8' : '#FFFFFF', ' opacity="' + (night ? '.08' : '.24') + '"') + box(-10, 392, 420, 7, metal, ' rx="3"') + [70, 200, 330].map(x => box(x, 399, 4, 80, metal, ' opacity=".75"')).join('');
      else { let bars = ''; for (let x = 6; x < 400; x += 15) bars += R1(x, 399, 2.6, 80); s += tag(bars, metal) + box(-10, 391, 420, 8, metal, ' rx="3"'); }
      return s + box(-10, 476, 420, 34, night ? '#1C2244' : '#B9B0A4') + plant(30, 478, 1, night);
    }
    const fr = night ? '#2E355D' : '#F2F1ED';
    return '<path d="M-10,-10H410V510H-10ZM20,22V472H380V22Z" fill="' + fr + '" fill-rule="evenodd"/>' + box(196, 22, 8, 450, fr) + box(-10, 472, 420, 38, night ? '#262C51' : '#E5E2DB');
  }
  const viewImg = (l, time) => svgDoc(skyDefs(VP[time]), landscape(l, time, 238, 'v') + foreground(l, time));

  /* ---------- rooms: every window shows the same view ---------- */
  function roomImg(l, which) {
    const P = VP.day, R = rnd(hash(l.id + '|' + which));
    const modern = ['tower', 'neubau', 'attika', 'studio'].includes(l.kind) || l.isNew;
    let defs = skyDefs(P), s = '';
    if (which === 'wohnen') {
      const wall = l.kind === 'loft' ? '#CDA899' : modern ? '#EDEFF0' : '#F2EADD';
      const floorC = l.kind === 'altbau' ? '#B5834F' : l.kind === 'loft' ? '#A8A29A' : modern ? '#D8BE98' : '#C99D6C';
      const fy = 396;
      const wins = l.kind === 'altbau' ? [[50, 56, 128, 292], [222, 56, 128, 292]] : l.kind === 'loft' ? [[34, 64, 332, 268]] : l.kind === 'dach' ? [[116, 126, 168, 200]] :
        (modern || l.kind === 'villa' || l.kind === 'attika') ? [[28, 36, 344, fy - 36]] : [[66, 88, 268, 244]];
      defs += '<clipPath id="wc">' + wins.map(([x, y, w, h]) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>').join('') + '</clipPath>';
      s += box(0, 0, 400, 500, wall);
      if (l.kind === 'loft') { let br = ''; for (let y = 8, i = 0; y < fy; y += 13, i++) { br += R1(0, y, 400, 1.2); for (let x = i % 2 ? 14 : 0; x < 400; x += 28) br += R1(x, y, 1.2, 13); } s += tag(br, '#B88E7D'); }
      if (l.kind === 'dach') s += tag('M-10,-10H170L-10,150Z', '#E1D6C6') + tag('M410,-10H230L410,150Z', '#E6DCCD');
      s += '<g clip-path="url(#wc)">' + landscape(l, 'day', 212, 'v') + '</g>';
      const frame = modern ? '#3F464E' : '#FFFFFF';
      for (const [x, y, w, h] of wins) {
        s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none" stroke="' + frame + '" stroke-width="7"/>';
        if (l.kind === 'altbau' || l.kind === 'dach') s += box(x + w / 2 - 3, y, 6, h, frame) + box(x, y + h * 0.32, w, 6, frame);
        else if (l.kind === 'loft') { for (let i = 1; i < 4; i++) s += box(x + w * i / 4 - 2, y, 4, h, frame); for (let i = 1; i < 3; i++) s += box(x, y + h * i / 3 - 2, w, 4, frame); }
        else if (w > 300) s += box(x + w / 3 - 3, y, 6, h, frame) + box(x + w * 2 / 3 - 3, y, 6, h, frame);
        else s += box(x + w / 2 - 3, y, 6, h, frame);
        if (y + h < fy - 10) s += box(x - 10, y + h, w + 20, 8, modern ? '#D9DCDF' : '#FFFFFF');
      }
      s += box(0, fy, 400, 500 - fy, floorC);
      let pl = '';
      for (let y = fy + 12; y < 500; y += 14 + (y - fy) * 0.12) pl += R1(-10, y, 420, 1.2);
      s += tag(pl, '#000000', ' opacity=".09"') + box(0, fy - 6, 400, 6, modern ? '#E1E4E6' : '#FFFFFF');
      const W0 = wins[0], W1 = wins[wins.length - 1];
      s += tag('M' + W0[0] + ',' + fy + 'L' + (W1[0] + W1[2]) + ',' + fy + 'L' + (W1[0] + W1[2] + 70) + ',500L' + (W0[0] + 40) + ',500Z', '#FFF2C4', ' opacity="' + (l.sun >= 6 ? '.42' : '.22') + '"');
      const sofaC = ['#5D7A8D', '#9B6A4D', '#6D7F5E', '#B4A089', '#4E5C74'][Math.floor(R() * 5)];
      const rugC = ['#D9CFC2', '#C7D2DA', '#E2D3C0', '#CAD3C4'][Math.floor(R() * 4)];
      s += '<ellipse cx="214" cy="462" rx="168" ry="26" fill="' + rugC + '"/>';
      s += box(-24, 368, 200, 62, sofaC, ' rx="16"') + box(-30, 406, 214, 46, mix(sofaC, '#000000', 0.12), ' rx="13"') + box(160, 384, 28, 70, sofaC, ' rx="11"') +
        box(18, 380, 44, 32, '#F1E8DA', ' rx="9"') + box(74, 382, 40, 30, mix(sofaC, '#FFFFFF', 0.35), ' rx="9"');
      s += box(226, 436, 116, 10, '#7E5F44', ' rx="5"') + box(236, 446, 5, 18, '#5E4632') + box(326, 446, 5, 18, '#5E4632') + box(258, 426, 26, 10, '#E9E1D3', ' rx="2"') + box(300, 420, 12, 16, '#4E7E8C', ' rx="4"');
      s += box(292, 240, 3, 156, '#3A3F45') + tag('M276,242H312L304,214H284Z', '#F3E8CF') + plant(362, fy + 4, 1.25, false);
    } else if (which === 'aussen') {
      const t = l.outdoor ? l.outdoor.t : 'Balkon', m2 = l.outdoor ? l.outdoor.m2 : 6, garden = t === 'Garten' || t === 'Sitzplatz';
      s += landscape(l, 'day', garden ? 250 : 200, 'v');
      if (garden) {
        s += tag('M-10,352Q40,300 100,330T220,316T330,324T410,318V380H-10Z', P.tree) + box(-10, 372, 420, 140, '#7DA562');
        let st = ''; for (let i = 0; i < 6; i++) st += R1(-10, 380 + i * 22, 420, 9);
        s += tag(st, '#FFFFFF', ' opacity=".07"');
        if (t === 'Sitzplatz') s += tag('M40,418H372L396,510H16Z', '#D9D2C6');
        s += box(214, 262, 4, 176, '#6A6058') + tag('M134,276Q216,226 298,276Z', '#F0E6D6') + box(150, 418, 132, 9, '#8A6A4C', ' rx="3"') + box(160, 427, 5, 30, '#6A5039') + box(266, 427, 5, 30, '#6A5039') +
          chair(98, 460, 1.1, 1, '#4B5A52') + chair(300, 460, 1.1, -1, '#4B5A52') + plant(360, 486, 1.2, false);
      } else {
        const modernB = ['tower', 'neubau', 'attika'].includes(l.kind);
        if (t === 'Loggia') s += box(-10, -10, 420, 40, '#D2CDC6') + tag('M-10,30H34V420L-10,450Z', '#C3BDB4') + tag('M410,30H366V420L410,450Z', '#CBC5BD');
        s += tag('M-10,410H410V510H-10Z', modernB ? '#C9C3BA' : '#B88B5E');
        let bd = ''; for (let y = 426; y < 510; y += 18) bd += R1(-10, y, 420, 1.4);
        s += tag(bd, '#000000', ' opacity=".1"');
        if (modernB) s += box(-10, 318, 420, 92, '#FFFFFF', ' opacity=".26"') + box(-10, 312, 420, 7, '#3D454E', ' rx="3"');
        else { let bars = ''; for (let x = 4; x < 400; x += 16) bars += R1(x, 318, 3, 92); s += tag(bars, '#3D454E') + box(-10, 311, 420, 8, '#3D454E', ' rx="3"'); }
        if (m2 >= 14) s += box(16, 392, 178, 46, '#6B7B86', ' rx="12"') + box(10, 426, 192, 36, '#5A6973', ' rx="10"') + box(30, 402, 40, 26, '#EFE6D6', ' rx="8"') + box(234, 444, 104, 8, '#8A6A4C', ' rx="4"') + box(244, 452, 5, 22, '#6A5039') + box(322, 452, 5, 22, '#6A5039') + plant(370, 482, 1.3, false);
        else if (m2 >= 8) s += box(140, 420, 150, 9, '#8A6A4C', ' rx="3"') + box(150, 429, 5, 34, '#6A5039') + box(274, 429, 5, 34, '#6A5039') + chair(88, 470, 1.15, 1, '#39424A') + chair(304, 470, 1.15, -1, '#39424A') + plant(366, 484, 1.15, false);
        else s += '<ellipse cx="206" cy="424" rx="42" ry="9" fill="#39424A"/>' + box(203, 424, 6, 44, '#39424A') + chair(124, 470, 1.1, 1, '#39424A') + chair(256, 470, 1.1, -1, '#39424A') + plant(352, 484, 1.05, false);
      }
    } else if (which === 'kueche') {
      const modernK = l.renovated || modern;
      const front = modernK ? ['#F6F6F3', '#E8EAEA', '#3E4851', '#7D8B76'][Math.floor(R() * 4)] : '#B98A5A';
      defs += '<clipPath id="kc"><rect x="146" y="104" width="118" height="126"/></clipPath>';
      s += box(0, 0, 400, 500, '#F2F0EB') + '<g clip-path="url(#kc)">' + landscape(l, 'day', 176, 'v') + '</g>' +
        '<rect x="146" y="104" width="118" height="126" fill="none" stroke="#FFFFFF" stroke-width="6"/>' + box(202, 104, 5, 126, '#FFFFFF');
      const door = mix(front, '#000000', 0.12);
      s += box(10, 90, 122, 120, front, ' rx="3"') + box(278, 90, 112, 120, front, ' rx="3"') + box(70, 90, 2, 120, door) + box(334, 90, 2, 120, door);
      s += box(0, 232, 400, 98, modernK ? '#E5E9EA' : '#F1E6D2');
      let tl = ''; for (let y = 254; y < 330; y += 24) tl += R1(0, y, 400, 1); for (let x = 30; x < 400; x += 48) tl += R1(x, 232, 1, 98);
      s += tag(tl, '#000000', ' opacity=".08"');
      s += box(0, 330, 400, 13, modernK ? '#D8D4CC' : '#E7E0D2') + box(0, 343, 400, 112, front);
      let dl = ''; for (let x = 66; x < 400; x += 66) dl += R1(x, 346, 2, 106);
      s += tag(dl, door) + box(168, 327, 76, 5, '#AEB5BA', ' rx="2"') + '<path d="M206,327V298H222V303" fill="none" stroke="#9AA2A8" stroke-width="4" stroke-linecap="round"/>';
      s += box(34, 325, 92, 6, '#2F3337', ' rx="2"') + box(38, 356, 84, 80, '#33383D', ' rx="4"') + box(48, 372, 64, 40, '#4A5158', ' rx="3"');
      if (modernK) s += box(318, 86, 72, 369, mix(front, '#000000', 0.05), ' rx="3"') + box(326, 190, 3, 60, '#9AA0A5');
      s += box(0, 455, 400, 45, modernK ? '#BFC3C5' : '#C9A27A');
      if (l.openKitchen) s += box(20, 446, 360, 14, '#8A6A4C', ' rx="4"') + '<ellipse cx="200" cy="444" rx="26" ry="6" fill="#E9E2D4"/><circle cx="192" cy="438" r="7" fill="#E39B3C"/><circle cx="206" cy="437" r="7" fill="#C64A3B"/>';
      s += plant(282, 330, 0.55, false);
    } else {
      s += box(0, 0, 400, 500, '#EEF2F3');
      let tl = ''; for (let y = 28; y < 440; y += 28) tl += R1(0, y, 400, 1); for (let x = 28; x < 400; x += 28) tl += R1(x, 0, 1, 440);
      s += tag(tl, '#C9D4D8', ' opacity=".7"') + box(0, 440, 400, 60, '#C7CED1');
      if (l.bathWin) {
        defs += '<clipPath id="bc"><rect x="58" y="74" width="112" height="118"/></clipPath>';
        s += '<g clip-path="url(#bc)">' + landscape(l, 'day', 150, 'v') + '</g>' + box(58, 135, 112, 57, '#FFFFFF', ' opacity=".55"') +
          '<rect x="58" y="74" width="112" height="118" fill="none" stroke="#FFFFFF" stroke-width="6"/>' + box(58, 130, 112, 5, '#FFFFFF');
      } else s += box(150, 18, 100, 10, '#FFFFFF', ' rx="5"');
      if (l.bathtub) {
        s += '<rect x="14" y="340" width="246" height="92" rx="22" fill="#FFFFFF" stroke="#D5DDE0" stroke-width="3"/>' + box(30, 352, 214, 22, '#E4EEF2', ' rx="11"') +
          '<path d="M44,340V318H60" fill="none" stroke="#9AA4AA" stroke-width="5" stroke-linecap="round"/>' + box(196, 300, 44, 74, ['#E9B7A1', '#9DB8C8', '#C9D6B8'][Math.floor(R() * 3)], ' rx="4"');
        s += box(276, 300, 110, 52, modern ? '#7C8A93' : '#E9E4DA', ' rx="6"') + '<ellipse cx="331" cy="304" rx="34" ry="7" fill="#FFFFFF"/>' + box(284, 150, 94, 128, '#DCE8EE', ' rx="8"') + box(288, 140, 86, 6, '#FFFFFF', ' rx="3"');
      } else {
        s += '<rect x="226" y="96" width="164" height="344" fill="#DDEFF5" fill-opacity=".55" stroke="#B9C9D0" stroke-width="3"/><path d="M350,96V122H316" fill="none" stroke="#9AA4AA" stroke-width="5"/>' + box(300, 120, 28, 7, '#9AA4AA', ' rx="3"') + box(226, 430, 164, 10, '#FFFFFF');
        s += box(24, 300, 162, 52, modern ? '#7C8A93' : '#E9E4DA', ' rx="6"') + '<ellipse cx="105" cy="304" rx="40" ry="7" fill="#FFFFFF"/>';
        if (!l.bathWin) s += box(48, 150, 114, 128, '#DCE8EE', ' rx="8"');
      }
      s += plant(l.bathtub ? 370 : 160, 300, 0.5, false);
    }
    return svgDoc(defs, s);
  }

  /* ---------- what you see: peaks, lake and landmarks inside the field of view ---------- */
  /* Bearings from Zürich to the Alps (degrees from north) and apparent height in degrees. */
  const PEAKS = [{n: 'Säntis', b: 103, e: 1.9}, {n: 'Glärnisch', b: 140, e: 2.6}, {n: 'Tödi', b: 157, e: 2.8}, {n: 'Mythen', b: 165, e: 2.2}, {n: 'Uri Rotstock', b: 181, e: 2.6}, {n: 'Rigi', b: 190, e: 2.3}, {n: 'Pilatus', b: 206, e: 2}];
  const MARKS = [{n: 'Uetliberg', x: 145, y: 535, k: 'hill', e: 1.4}, {n: 'Zürichberg', x: 592, y: 292, k: 'hill', e: 1}, {n: 'Prime Tower', x: 262, y: 291, k: 'city'}, {n: 'Grossmünster', x: 384, y: 400, k: 'city'}];
  const COMPASS = ['Norden', 'Nordosten', 'Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten'];
  const DIR8 = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
  const compass = d => COMPASS[Math.round((((d % 360) + 360) % 360) / 45) % 8];
  const angDiff = (a, b) => ((a - b) % 360 + 540) % 360 - 180;
  const bearing = (x, y, X, Y) => (Math.atan2(X - x, -(Y - y)) * 180 / Math.PI + 360) % 360;
  const scache = new Map();
  function sight(l) {
    if (scache.has(l.id)) return scache.get(l.id);
    const X = l.sx != null ? l.sx : l.x, Y = l.sy != null ? l.sy : l.y;
    let from = l.dir - l.span / 2, to = l.dir + l.span / 2;
    const must = [], items = [];
    /* the Alps and the lake are in the analysis, so the field of view turns far enough to include them */
    const widen = b => { const d = angDiff(b, l.dir); if (d < from - l.dir) from = l.dir + d - 8; if (d > to - l.dir) to = l.dir + d + 8; };
    if (l.sees.includes('Alpen')) {
      let pk = PEAKS.filter(p => Math.abs(angDiff(p.b, l.dir)) <= l.span / 2);
      if (!pk.length) pk = PEAKS.slice().sort((a, b) => Math.abs(angDiff(a.b, l.dir)) - Math.abs(angDiff(b.b, l.dir))).slice(0, 2);
      /* name the four most prominent; the ridge still shows the others */
      pk = pk.slice().sort((a, b) => b.e - a.e).slice(0, 4).sort((a, b) => a.b - b.b);
      pk.forEach(p => { must.push(p.b); items.push({n: p.n, b: p.b, k: 'peak', e: p.e}); });
    }
    if (l.sees.includes('See')) { const lb = G.GEO.lakeBearing([X, Y]); must.push(lb.deg); items.push({n: 'Zürichsee', b: lb.deg, k: 'lake'}); }
    must.forEach(widen);
    if (to - from > 210) { const c = (from + to) / 2; from = c - 105; to = c + 105; }
    const mid = (from + to) / 2, half = (to - from) / 2, marks = [];
    for (const m of MARKS) {
      const d = Math.hypot(m.x - X, m.y - Y);
      if (d < 45 || (m.k === 'hill' && d > 700)) continue;
      if (m.k === 'city' && (!l.sees.includes('Stadt') || d > 430 || (l.floor < 4 && l.hill < 0.3))) continue;
      const b = bearing(X, Y, m.x, m.y);
      if (Math.abs(angDiff(b, mid)) <= half - 3) marks.push({n: m.n, b, k: m.k, e: m.e || 1, d});
    }
    /* at most two landmarks: city ones first, then the nearest hill */
    marks.sort((a, b) => (a.k === 'city' ? 0 : 1) - (b.k === 'city' ? 0 : 1) || a.d - b.d).slice(0, 2).forEach(m => items.push(m));
    const out = {from, to, span: Math.round(Math.min(l.span, to - from) / 5) * 5 || l.span, field: Math.round(to - from), items};
    scache.set(l.id, out);
    return out;
  }
  const list3 = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1];
  function viewText(l) {
    const S = sight(l), lake = S.items.some(i => i.k === 'lake');
    const peaks = S.items.filter(i => i.k === 'peak').sort((a, b) => b.e - a.e).slice(0, 3).sort((a, b) => a.b - b.b).map(i => i.n);
    const city = l.sees.includes('Stadt'), green = l.sees.includes('Grün');
    const where = l.floor >= 1 ? 'Aus dem ' + l.floor + '. Stock' : 'Vom Erdgeschoss';
    if (l.view < 5) return where + ' siehst du vor allem die Häuser gegenüber' + (green ? ' und Bäume' : '') + '. Wenig Fernsicht, Blick nach ' + compass(l.dir) + '.';
    /* the lake as the analysis measured it: a strip, the lake, or the whole lake */
    const lakeTxt = l.vLake === 1 ? 'einen Streifen Zürichsee' : l.vLake === 3 ? 'über den ganzen Zürichsee' : 'über den Zürichsee';
    const what = lake && peaks.length ? (l.vLake === 1 ? lakeTxt + ' und die Alpen mit ' + list3(peaks) : lakeTxt + ' bis zu ' + list3(peaks)) : lake ? lakeTxt : peaks.length ? 'bis zu den Alpen mit ' + list3(peaks) :
      city ? (l.view >= 6.5 ? 'weit über die Dächer der Stadt' : 'über die Dächer der Stadt') : 'ins Grüne';
    const tower = S.items.find(i => i.n === 'Prime Tower');
    let t = where + ' siehst du ' + what + '.';
    if ((lake || peaks.length) && city) t += ' Davor liegt die Stadt' + (tower ? ' mit dem Prime Tower' : '') + '.';
    else if (green && (lake || peaks.length || city)) t += ' Im Vordergrund viel Grün.';
    return t + ' ' + S.span + '° Sicht nach ' + compass(l.dir) + (l.free ? ', unverbaubar.' : '.');
  }

  /* ---------- labelled panorama of the field of view (inline SVG, themed via CSS) ---------- */
  function pano(l) {
    const S = sight(l), W = 360, Hh = 140, hz = 90, span = S.to - S.from;
    const X = b => (((b - S.from) % 360) + 360) % 360 / span * W;
    const R = rnd(hash(l.id + '|pano')), inSpan = b => Math.abs(angDiff(b, (S.from + S.to) / 2)) <= span / 2;
    let s = '<rect class="pano-sky" width="360" height="' + hz + '"/><rect class="pano-ground" y="' + hz + '" width="360" height="' + (Hh - hz) + '"/>';
    if (l.sees.includes('Alpen')) {
      let d = '', on = false;
      for (let i = 0; i <= 140; i++) {
        const b = S.from + span * i / 140, bb = ((b % 360) + 360) % 360, x = f1(i / 140 * W);
        if (bb < 92 || bb > 218) { if (on) { d += 'L' + x + ',' + hz + 'Z'; on = false; } continue; }
        let h = 4 + 2.4 * Math.sin(bb * 1.7) + 2 * Math.sin(bb * 4.3);
        for (const p of PEAKS) h = Math.max(h, p.e * 13 * Math.max(0, 1 - Math.abs(angDiff(bb, p.b)) / 6));
        d += (on ? 'L' : 'M' + x + ',' + hz + 'L') + x + ',' + f1(hz - h);
        on = true;
      }
      if (on) d += 'L' + W + ',' + hz + 'Z';
      let sn = '';
      for (const p of PEAKS) { if (!inSpan(p.b)) continue; const x = X(p.b), y = hz - p.e * 13; sn += 'M' + f1(x - 6) + ',' + f1(y + 7) + 'L' + f1(x) + ',' + f1(y) + 'L' + f1(x + 6) + ',' + f1(y + 7) + 'L' + f1(x + 2) + ',' + f1(y + 5) + 'L' + f1(x - 2) + ',' + f1(y + 6.5) + 'Z'; }
      s += '<path class="pano-alps" d="' + d + '"/>' + (sn ? '<path class="pano-snow" d="' + sn + '"/>' : '');
    }
    let hills = '';
    for (const m of S.items.filter(i => i.k === 'hill')) { const x = X(m.b), h = 10 * m.e; hills += 'M' + f1(x - 48) + ',' + hz + 'Q' + f1(x) + ',' + f1(hz - h * 2) + ' ' + f1(x + 48) + ',' + hz + 'Z'; }
    if (hills) s += '<path class="pano-hill" d="' + hills + '"/>';
    const lk = S.items.find(i => i.k === 'lake');
    if (lk) { const x = X(lk.b), w = Math.min(170, 70 + l.view * 9); s += '<path class="pano-lake" d="M' + f1(x - w / 2) + ',' + (hz + 1) + 'H' + f1(x + w / 2) + 'Q' + f1(x + w / 2 - 8) + ',' + (hz + 10) + ' ' + f1(x + w / 2 - 28) + ',' + (hz + 12) + 'H' + f1(x - w / 2 + 28) + 'Q' + f1(x - w / 2 + 8) + ',' + (hz + 10) + ' ' + f1(x - w / 2) + ',' + (hz + 1) + 'Z"/>'; }
    if (l.sees.includes('Stadt')) { let c = '', x = 0; while (x < W) { const w = 5 + R() * 9, h = 3 + R() * 9; c += R1(x, hz + 14 - h, w, h + 9); x += w + R() * 2; } s += '<path class="pano-city" d="' + c + '"/>'; }
    for (const m of S.items.filter(i => i.k === 'city')) {
      const x = X(m.b);
      s += m.n === 'Prime Tower' ? '<rect class="pano-mark" x="' + f1(x - 3) + '" y="' + (hz - 14) + '" width="6" height="34"/>' :
        '<path class="pano-mark" d="' + R1(x - 5, hz - 2, 3.4, 22) + R1(x + 1.6, hz - 2, 3.4, 22) + 'M' + f1(x - 5.6) + ',' + (hz - 2) + 'L' + f1(x - 3.3) + ',' + (hz - 9) + 'L' + f1(x - 1) + ',' + (hz - 2) + 'ZM' + f1(x + 1) + ',' + (hz - 2) + 'L' + f1(x + 3.3) + ',' + (hz - 9) + 'L' + f1(x + 5.6) + ',' + (hz - 2) + 'Z"/>';
    }
    if (l.sees.includes('Grün')) { let tr = ''; for (let x = 4; x < W; x += 12 + R() * 22) tr += C(x, Hh - 26 + R() * 4, 5 + R() * 5); s += '<path class="pano-tree" d="' + tr + '"/>'; }
    /* compass scale */
    let ticks = '', lab = '';
    for (let b = Math.ceil(S.from / 15) * 15; b <= S.to; b += 15) {
      const x = X(b), major = ((b % 45) + 45) % 45 === 0;
      ticks += R1(x - 0.5, Hh - 18, 1, major ? 6 : 3.5);
      if (major) lab += '<text class="pano-c" x="' + f1(clampN(x, 8, W - 8)) + '" y="' + (Hh - 3) + '">' + DIR8[((Math.round(b / 45) % 8) + 8) % 8] + '</text>';
    }
    s += '<rect class="pano-base" y="' + (Hh - 19) + '" width="360" height="19"/><path class="pano-tick" d="' + ticks + '"/>' + lab;
    /* labels in up to three rows so neighbours do not collide; a label that fits nowhere is left out */
    const ends = [-99, -99, -99];
    for (const it of S.items.slice().sort((a, b) => X(a.b) - X(b.b))) {
      const fx = X(it.b), w = it.n.length * 5.6 + 10, x = clampN(fx, w / 2, W - w / 2);
      const row = ends.findIndex(e => x - w / 2 > e + 2);
      if (row < 0) continue;
      ends[row] = x + w / 2;
      const ty = 14 + row * 14, top = it.k === 'peak' ? hz - it.e * 13 : it.k === 'hill' ? hz - 10 * it.e : it.k === 'lake' ? hz + 3 : hz - 15;
      s += '<path class="pano-l" d="M' + f1(fx) + ',' + (ty + 3) + 'V' + f1(top - 2) + '"/><text class="pano-t" x="' + f1(x) + '" y="' + ty + '">' + it.n + '</text>';
    }
    const names = S.items.map(i => i.n);
    return '<svg class="pano" viewBox="0 0 360 140" role="img" aria-label="Panorama nach ' + compass(l.dir) + ', ' + S.field + ' Grad' + (names.length ? ': ' + names.join(', ') : '') + '">' + s + '</svg>';
  }

  /* ---------- view metrics per listing ----------
     What a real pipeline computes today: a viewshed from the window (swissBUILDINGS3D, swissALTI3D, LiDAR from
     swissSURFACE3D), the zoning plan in front, and a vision and language model reading the listing's photos and text.
     Here they are sample values, derived consistently from the listing's view score, height, direction and field. */
  const SUNSET = [245, 257, 272, 286, 298, 303, 300, 290, 276, 261, 247, 238]; /* sunset azimuth in Zürich, by month */
  const MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const MONTHS_SHORT = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
  /* months as text: consecutive months join as "April bis August", wrapping over the new year */
  function monthsText(ms, short) {
    const N = short ? MONTHS_SHORT : MONTHS_LONG;
    if (!ms.length) return '';
    if (ms.length === 12) return short ? 'ganzjährig' : 'das ganze Jahr';
    const set = new Set(ms), runs = [];
    let start = ms.find(m => !set.has((m + 11) % 12));
    if (start === undefined) start = ms[0];
    for (let i = 0, m = start, cur = null; i < 12; i++, m = (m + 1) % 12) {
      if (set.has(m)) { if (!cur) { cur = [m, m]; runs.push(cur); } else cur[1] = m; } else cur = null;
    }
    return runs.map(([a, b]) => a === b ? N[a] : N[a] + (short ? '–' : ' bis ') + N[b]).join(short ? ', ' : ' und ');
  }
  const VON = {Balkon: 'vom Balkon', Loggia: 'von der Loggia', Terrasse: 'von der Terrasse', Dachterrasse: 'von der Dachterrasse', Sitzplatz: 'vom Sitzplatz', Garten: 'vom Garten'};
  const fmtDist = m =>m >= 1000 ? (m >= 10000 ? Math.round(m / 1000) : Math.round(m / 100) / 10) + ' km' : Math.round(m) + ' m';
  function enrichView(l) {
    const S = sight(l), R = rnd(hash(l.id + '|vx')), open = clampN((l.view - 3) / 6, 0, 1);
    const lake = l.sees.includes('See'), alps = l.sees.includes('Alpen'), city = l.sees.includes('Stadt'), green = l.sees.includes('Grün');
    const blocked = open < 0.34 && l.floor < 7;
    const inSpan = az => Math.abs(angDiff(az, l.dir)) <= l.span / 2;
    l.vLake = lake ? (l.view >= 8.7 ? 3 : l.view >= 7.5 ? 2 : 1) : 0;
    l.vLakeDeg = lake ? Math.round([0, 12, 35, 70][l.vLake] * (0.8 + R() * 0.4)) : 0;
    l.vPeaks = alps ? PEAKS.filter(p => Math.abs(angDiff(p.b, (S.from + S.to) / 2)) <= (S.to - S.from) / 2).length : 0;
    l.vFree = blocked ? Math.round(14 + R() * 18) : (lake || alps) && l.view >= 7 ? Math.round(5000 + R() * 40000) : Math.round(45 + open * open * 900 + l.floor * 30 + R() * 60);
    l.vSky = Math.round(clampN(12 + open * 40 + Math.min(l.floor, 25) * 0.8 + R() * 6, 8, 75));
    l.vGreen = Math.round(green ? 22 + R() * 30 : 3 + R() * 10);
    l.vPrivacy = Math.round(blocked ? 18 + R() * 30 : l.floor >= 10 || l.free ? R() * 4 : 4 + (1 - open) * 18 + R() * 6);
    l.vAbove = l.floor >= 10 || l.kind === 'attika' || (l.hill >= 0.4 && l.floor >= 2);
    l.vLeafy = green && l.view < 8 && l.floor <= 4 && R() < 0.6;
    l.vLiving = R() < (l.view >= 6 ? 0.9 : 0.6);
    l.vBalcony = !!l.outdoor && l.outdoor.t !== 'Garten' && l.outdoor.t !== 'Sitzplatz';
    l.vSunset = l.view >= 5 ? SUNSET.map((az, m) => inSpan(az) ? m : -1).filter(m => m >= 0) : [];
    l.vLights = (city && l.view >= 5.5) || (lake && l.view >= 6.5);
    l.vMarks = S.items.filter(i => i.k === 'city' || i.k === 'hill').map(i => i.n);
    l.vHeight = Math.round(l.floor * 3 + 1.5);
    /* what the listing promises, checked against the analysis */
    const nearLake = G.GEO.lakeBearing([l.x, l.y]).dist < 140;
    l.vClaim = lake ? (l.vLake >= 2 || R() < 0.5 ? 'Seesicht' : 'Seeblick teilweise') : alps ? (l.vPeaks >= 4 ? 'Alpenpanorama' : R() < 0.5 ? 'Alpenpanorama' : 'Bergsicht') :
      (nearLake && l.floor >= 3 && R() < 0.35) ? 'Seesicht' : l.view >= 7 ? 'Weitsicht' : null;
    let note = null;
    if (l.vClaim === 'Seesicht' && !lake) note = 'Laut Sichtanalyse ist der See aus der Wohnung nicht zu sehen, höchstens vom Dach.';
    else if (l.vClaim === 'Seesicht' && l.vLake === 1) note = 'Laut Sichtanalyse nur ein schmaler Streifen See' + (l.vBalcony ? ', ' + VON[l.outdoor.t] + ' aus.' : '.');
    else if (l.vClaim === 'Alpenpanorama' && l.vPeaks < 4) note = 'Laut Sichtanalyse ' + (l.vPeaks === 1 ? 'ein Gipfel' : l.vPeaks + ' Gipfel') + ', eher seitlich, kein ganzes Panorama.';
    else if (l.vClaim && l.vLeafy) note = 'Im Sommer verdecken Bäume einen Teil der Sicht. Die Fotos im Inserat sind im Winter entstanden.';
    l.vClaimOk = !note;
    l.vClaimNote = note;
  }
  if (G.DATA) G.DATA.LISTINGS.forEach(enrichView);

  /* ---------- one entry point with a cache: view:day|golden|night, room:wohnen|aussen|kueche|bad, house:day ---------- */
  const icache = new Map();
  function img(l, key) {
    const ck = l.id + '|' + key;
    if (icache.has(ck)) return icache.get(ck);
    const [kind, arg] = key.split(':');
    const u = kind === 'view' ? viewImg(l, arg) : kind === 'room' ? roomImg(l, arg) : photo(l, arg || 'day');
    icache.set(ck, u);
    return u;
  }

  G.SCENE = {photo, plan, TIMES, TIME_LABEL, img, pano, sight, viewText, compass, monthsText, fmtDist};
})(window);
