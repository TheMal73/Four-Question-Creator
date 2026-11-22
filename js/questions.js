/*
 * GCSE Maths fluency question generators.
 * Each topic has a gen() function that returns { q, a } as HTML strings,
 * with fresh random numbers every time it is called.
 */
(function (global) {
  'use strict';

  // ---------- random helpers ----------
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const RNZ = (a, b) => { let x; do { x = R(a, b); } while (x === 0); return x; };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const chance = (p) => Math.random() < p;
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
  const sum = (arr) => arr.reduce((s, x) => s + x, 0);

  // ---------- formatting helpers ----------
  const M = '−';          // minus sign
  const TIMES = '×';
  const DIV = '÷';
  const LE = '≤';
  const GE = '≥';
  const it = (s) => `<i>${s}</i>`;
  const X = it('x');
  const Y = it('y');
  const sq = (s) => `${s}<sup>2</sup>`;

  function num(x) {
    const r = Math.round(x * 1e9) / 1e9;
    const s = Math.abs(r).toLocaleString('en-GB', { maximumFractionDigits: 9 });
    return (r < 0 ? M : '') + s;
  }
  const nb = (x) => (x < 0 ? `(${num(x)})` : num(x));
  function dp(x, d) {
    const r = Math.round(x * 10 ** d) / 10 ** d;
    const s = Math.abs(r).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
    return (r < 0 ? M : '') + s;
  }
  function money(x) {
    const r = Math.round(x * 100) / 100;
    return '£' + (Number.isInteger(r) ? num(r) : dp(r, 2));
  }
  const fracHTML = (a, b) => `<span class="frac"><span class="fn">${a}</span><span class="fd">${b}</span></span>`;
  function fr(p, q) {
    if (q < 0) { p = -p; q = -q; }
    const g = gcd(p, q) || 1; p /= g; q /= g;
    if (q === 1) return num(p);
    return (p < 0 ? M : '') + fracHTML(Math.abs(p), q);
  }
  // Simplified fraction, plus mixed-number form if improper.
  function frAns(p, q) {
    if (q < 0) { p = -p; q = -q; }
    const g = gcd(p, q) || 1; p /= g; q /= g;
    if (q === 1) return num(p);
    let s = fr(p, q);
    if (Math.abs(p) > q) {
      s += ` = ${p < 0 ? M : ''}${Math.trunc(Math.abs(p) / q)}${fracHTML(Math.abs(p) % q, q)}`;
    }
    return s;
  }
  function properFrac(lo, hi) {
    const d = R(lo, hi); let n;
    do { n = R(1, d - 1); } while (gcd(n, d) !== 1);
    return [n, d];
  }
  // terms: [[coefficient, variableHTML], ...] -> "3x² − x + 4"
  function poly(terms) {
    let s = '';
    for (const [c, v] of terms) {
      if (!c) continue;
      const a = Math.abs(c);
      const body = a === 1 && v ? v : num(a) + v;
      if (s === '') s = (c < 0 ? M : '') + body;
      else s += (c < 0 ? ` ${M} ` : ' + ') + body;
    }
    return s || '0';
  }
  const pw = (base, e) => (e === 0 ? '1' : e === 1 ? base : `${base}<sup>${num(e)}</sup>`);
  const co = (c) => (c === 1 ? '' : num(c));
  const surd = (inner) => `<span class="surd">√<span class="rad">${inner}</span></span>`;
  const signed = (b) => (b < 0 ? ` ${M} ${num(-b)}` : ` + ${num(b)}`);
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  function hrsStr(t) {
    const h = Math.floor(t), m = Math.round((t - h) * 60);
    const parts = [];
    if (h) parts.push(plural(h, 'hour'));
    if (m) parts.push(plural(m, 'minute'));
    return parts.join(' ');
  }

  const Q = (ins, math, note) =>
    `<div class="ins">${ins}</div>${math ? `<div class="mx">${math}</div>` : ''}${note ? `<div class="note">${note}</div>` : ''}`;

  // ---------- SVG diagrams ----------
  const svg = (inner, label) =>
    `<svg class="diagram" viewBox="0 0 300 180" role="img" aria-label="${label}">${inner}</svg>`;
  const stroke = 'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"';
  const dash = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="6 5"';
  const lbl = (x, y, t, anchor = 'middle') =>
    `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="18" fill="currentColor"${t === 'x' ? ' font-style="italic"' : ''}>${t}</text>`;

  // Right angle bottom-right, angle of interest bottom-left.
  function rightTri({ adj = '', opp = '', hyp = '', ang = '' }) {
    let s = `<polygon points="30,150 230,150 230,40" ${stroke}/>`;
    s += `<polyline points="216,150 216,136 230,136" fill="none" stroke="currentColor" stroke-width="2"/>`;
    if (ang) {
      s += `<path d="M 75 150 A 45 45 0 0 0 69.4 128.3" fill="none" stroke="currentColor" stroke-width="2"/>`;
      s += lbl(84, 143, ang, 'start');
    }
    if (adj) s += lbl(130, 174, adj);
    if (opp) s += lbl(240, 101, opp, 'start');
    if (hyp) s += lbl(122, 84, hyp, 'end');
    return svg(s, 'Right-angled triangle');
  }

  // ---------- topics ----------
  const TOPICS = [];
  const topic = (id, group, name, gen, tier = 'F') => TOPICS.push({ id, group, name, gen, tier });

  // ===== NUMBER =====
  topic('addFrac', 'Number', 'Adding & subtracting fractions', () => {
    const [a, b] = properFrac(2, 9); let c, d;
    do { [c, d] = properFrac(2, 9); } while (d === b);
    const plus = chance(0.5);
    return { q: Q('Work out', `${fr(a, b)} ${plus ? '+' : M} ${fr(c, d)}`), a: frAns(a * d + (plus ? 1 : -1) * c * b, b * d) };
  });

  topic('mulFrac', 'Number', 'Multiplying fractions', () => {
    const [a, b] = properFrac(2, 10), [c, d] = properFrac(2, 10);
    return { q: Q('Work out', `${fr(a, b)} ${TIMES} ${fr(c, d)}`), a: frAns(a * c, b * d) };
  });

  topic('divFrac', 'Number', 'Dividing fractions', () => {
    const [a, b] = properFrac(2, 10), [c, d] = properFrac(2, 10);
    return { q: Q('Work out', `${fr(a, b)} ${DIV} ${fr(c, d)}`), a: frAns(a * d, b * c) };
  });

  topic('mixedNum', 'Number', 'Calculating with mixed numbers', () => {
    const [a, b] = properFrac(2, 6), [c, d] = properFrac(2, 6);
    const w1 = R(1, 4), w2 = R(1, 3);
    const p1 = w1 * b + a, p2 = w2 * d + c;
    const mix = (w, n, dd) => `${w}${fracHTML(n, dd)}`;
    const op = pick(['+', M, TIMES, DIV]);
    let ans;
    if (op === '+') ans = frAns(p1 * d + p2 * b, b * d);
    else if (op === M) ans = frAns(p1 * d - p2 * b, b * d);
    else if (op === TIMES) ans = frAns(p1 * p2, b * d);
    else ans = frAns(p1 * d, b * p2);
    return { q: Q('Work out', `${mix(w1, a, b)} ${op} ${mix(w2, c, d)}`), a: ans };
  });

  topic('fracAmount', 'Number', 'Fraction of an amount', () => {
    const [n, d] = properFrac(2, 12);
    const amt = d * R(2, 15);
    return { q: Q('Work out', `${fr(n, d)} of ${amt}`), a: num((n * amt) / d) };
  });

  topic('fdp', 'Number', 'Fractions, decimals & percentages', () => {
    const d = pick([2, 4, 5, 8, 10, 20, 25, 50]); let n;
    do { n = R(1, d - 1); } while (gcd(n, d) !== 1);
    const f = fr(n, d), dec = num(n / d), pct = num((n * 100) / d) + '%';
    const t = pick(['fd', 'fp', 'df', 'pf', 'dp', 'pd']);
    const map = {
      fd: ['Write as a decimal', f, dec],
      fp: ['Write as a percentage', f, pct],
      df: ['Write as a fraction in its simplest form', dec, f],
      pf: ['Write as a fraction in its simplest form', pct, f],
      dp: ['Write as a percentage', dec, pct],
      pd: ['Write as a decimal', pct, dec],
    };
    const [ins, m, a] = map[t];
    return { q: Q(ins, m), a };
  });

  topic('negatives', 'Number', 'Negative numbers', () => {
    const op = pick(['+', M, TIMES, DIV]); let a, b;
    if (op === DIV) { b = RNZ(-9, 9); a = b * RNZ(-9, 9); }
    else { a = RNZ(-15, 15); b = RNZ(-15, 15); }
    if (a > 0 && b > 0) { if (chance(0.5)) a = -a; else b = -b; }
    const r = op === '+' ? a + b : op === M ? a - b : op === TIMES ? a * b : a / b;
    return { q: Q('Work out', `${num(a)} ${op} ${nb(b)}`), a: num(r) };
  });

  topic('bidmas', 'Number', 'Order of operations', () => {
    const a = R(2, 12), b = R(2, 9), c = R(2, 9), d = R(2, 6);
    const t = pick([
      () => [`${a} + ${b} ${TIMES} ${c}`, a + b * c],
      () => [`(${a} + ${b}) ${TIMES} ${c}`, (a + b) * c],
      () => [`${a} ${TIMES} ${b} ${M} ${sq(c)}`, a * b - c * c],
      () => [`${a * b} ${DIV} ${b} + ${c} ${TIMES} ${d}`, a + c * d],
      () => [`${sq(b)} ${M} ${c} ${TIMES} ${d}`, b * b - c * d],
      () => [`${d} ${TIMES} ${sq(`(${a} ${M} ${b})`)}`, d * (a - b) ** 2],
      () => [`${a * c + b * c} ${DIV} (${a} + ${b})`, c],
    ]);
    const [m, r] = t();
    return { q: Q('Work out', m), a: num(r) };
  });

  topic('hcfLcm', 'Number', 'HCF & LCM', () => {
    let g, m1, m2;
    do {
      g = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15]);
      m1 = R(2, 9); m2 = R(2, 9);
    } while (m1 === m2 || gcd(m1, m2) !== 1 || g * Math.max(m1, m2) > 180);
    const [a, b] = [g * m1, g * m2].sort((x, y) => x - y);
    return { q: Q('Find the HCF and LCM of', `${a} and ${b}`), a: `HCF = ${g}, LCM = ${g * m1 * m2}` };
  });

  topic('primeFactors', 'Number', 'Prime factorisation', () => {
    let fs, N;
    do {
      const k = R(3, 5); fs = [];
      for (let i = 0; i < k; i++) fs.push(pick([2, 2, 2, 3, 3, 3, 5, 5, 7, 11]));
      N = fs.reduce((a, b) => a * b, 1);
    } while (N < 30 || N > 800);
    const counts = {};
    fs.forEach((p) => { counts[p] = (counts[p] || 0) + 1; });
    const ans = Object.keys(counts).map(Number).sort((a, b) => a - b)
      .map((p) => (counts[p] > 1 ? `${p}<sup>${counts[p]}</sup>` : `${p}`)).join(` ${TIMES} `);
    return { q: Q('Write as a product of prime factors in index form', `${N}`), a: ans };
  });

  topic('rounding', 'Number', 'Rounding (decimal places & sig figs)', () => {
    let N; do { N = R(1000, 99999); } while (N % 10 === 0);
    const k = R(0, 6), D = String(N).length;
    const xStr = k === 0 ? String(N) : (N / 10 ** k).toFixed(k);
    if (k >= 2 && chance(0.5)) {
      const d = R(0, Math.min(3, k - 1));
      const q = Math.round(N / 10 ** (k - d));
      const desc = d === 0 ? 'the nearest whole number' : `${plural(d, 'decimal place')}`;
      return { q: Q(`Round to ${desc}`, xStr), a: (q / 10 ** d).toFixed(d) };
    }
    const s = Math.min(R(1, 3), D - 1);
    const q = Math.round(N / 10 ** (D - s));
    const e = D - s - k;
    const ans = e >= 0 ? String(q * 10 ** e) : (q / 10 ** -e).toFixed(-e);
    return { q: Q(`Round to ${plural(s, 'significant figure')}`, xStr), a: ans };
  });

  topic('errorIntervals', 'Number', 'Error intervals', () => {
    const L = it(pick(['x', 'l', 'm', 'h', 'w']));
    const t = pick(['dp1', 'dp2', 'dp0', '10', '100']);
    let val, lo, hi, desc;
    if (t === 'dp1') { const V = R(11, 999); val = (V / 10).toFixed(1); lo = ((2 * V - 1) / 20).toFixed(2); hi = ((2 * V + 1) / 20).toFixed(2); desc = '1 decimal place'; }
    else if (t === 'dp2') { const V = R(101, 999); val = (V / 100).toFixed(2); lo = ((2 * V - 1) / 200).toFixed(3); hi = ((2 * V + 1) / 200).toFixed(3); desc = '2 decimal places'; }
    else if (t === 'dp0') { const V = R(2, 200); val = num(V); lo = num(V - 0.5); hi = num(V + 0.5); desc = 'the nearest whole number'; }
    else if (t === '10') { const V = R(2, 99) * 10; val = num(V); lo = num(V - 5); hi = num(V + 5); desc = 'the nearest 10'; }
    else { const V = R(2, 99) * 100; val = num(V); lo = num(V - 50); hi = num(V + 50); desc = 'the nearest 100'; }
    return {
      q: Q(`${L} = ${val}, correct to ${desc}.`, '', `Write down the error interval for ${L}.`),
      a: `${lo} ${LE} ${L} &lt; ${hi}`,
    };
  });

  topic('standardForm', 'Number', 'Standard form (converting)', () => {
    const md = pick([1, 1, 2]); let mi;
    do { mi = R(10 ** md + 1, 10 ** (md + 1) - 1); } while (mi % 10 === 0);
    const mStr = (mi / 10 ** md).toFixed(md);
    const big = chance(0.5);
    const e = big ? R(3, 8) : -R(1, 6);
    const ord = big ? (mi * 10 ** (e - md)).toLocaleString('en-GB') : (mi / 10 ** (md - e)).toFixed(md - e);
    const sf = `${mStr} ${TIMES} 10<sup>${num(e)}</sup>`;
    return chance(0.5)
      ? { q: Q('Write in standard form', ord), a: sf }
      : { q: Q('Write as an ordinary number', sf), a: ord };
  });

  topic('sfCalc', 'Number', 'Calculating with standard form', () => {
    let a = R(2, 9), b; const p = R(-4, 8), q = R(-4, 8);
    const mult = chance(0.6);
    let r, e;
    if (mult) { b = R(2, 9); r = a * b; e = p + q; }
    else { do { b = pick([2, 4, 5, 8]); } while (b === a); r = a / b; e = p - q; }
    while (r >= 10) { r /= 10; e++; }
    while (r < 1) { r *= 10; e--; }
    return {
      q: Q('Work out, giving your answer in standard form',
        `(${a} ${TIMES} 10<sup>${num(p)}</sup>) ${mult ? TIMES : DIV} (${b} ${TIMES} 10<sup>${num(q)}</sup>)`),
      a: `${num(r)} ${TIMES} 10<sup>${num(e)}</sup>`,
    };
  });

  topic('indexNumbers', 'Number', 'Zero, negative & fractional indices', () => {
    const t = pick(['zero', 'neg', 'frac', 'fracpos', 'fracneg']);
    if (t === 'zero') { const k = R(2, 99); return { q: Q('Evaluate', `${k}<sup>0</sup>`), a: '1' }; }
    if (t === 'neg') {
      let k, p; do { k = R(2, 5); p = R(1, 3); } while (k ** p > 125);
      return { q: Q('Evaluate', `${k}<sup>${M}${p}</sup>`), a: fr(1, k ** p) };
    }
    const r = R(2, 3);
    if (t === 'frac') {
      const k = R(2, r === 2 ? 12 : 5);
      return { q: Q('Evaluate', `${k ** r}<sup>1/${r}</sup>`), a: num(k) };
    }
    let p; do { p = R(1, 3); } while (p % r === 0 || (t === 'fracpos' && p === 1));
    const k = R(2, r === 2 ? 6 : 4);
    if (t === 'fracpos') return { q: Q('Evaluate', `${k ** r}<sup>${p}/${r}</sup>`), a: num(k ** p) };
    return { q: Q('Evaluate', `${k ** r}<sup>${M}${p}/${r}</sup>`), a: fr(1, k ** p) };
  }, 'H');

  topic('surds', 'Number', 'Surds', () => {
    const t = pick(['simp', 'simp', 'add', 'expand']);
    if (t === 'simp') {
      let a, b; do { b = pick([2, 3, 5, 6, 7, 10, 11]); a = R(2, 7); } while (a * a * b > 300);
      return { q: Q('Simplify', surd(a * a * b)), a: `${a}${surd(b)}` };
    }
    if (t === 'add') {
      const b = pick([2, 3, 5, 7]); let a1, a2;
      do { a1 = R(1, 5); a2 = R(2, 5); } while (a1 === a2);
      const s = (a) => surd(a * a * b);
      return { q: Q('Simplify', `${s(a1)} + ${s(a2)}`), a: `${a1 + a2}${surd(b)}` };
    }
    const a = R(2, 9), b = pick([2, 3, 5, 6, 7, 11]);
    return { q: Q('Expand and simplify', `(${a} + ${surd(b)})(${a} ${M} ${surd(b)})`), a: num(a * a - b) };
  }, 'H');

  // ===== ALGEBRA =====
  topic('collectLike', 'Algebra', 'Collecting like terms', () => {
    let terms, ans;
    do {
      const c = [RNZ(-9, 9), RNZ(-9, 9), RNZ(-9, 9), RNZ(-9, 9)];
      const vars = chance(0.65) ? [X, Y] : [sq(X), X];
      terms = shuffle([[c[0], vars[0]], [c[1], vars[1]], [c[2], vars[0]], [c[3], vars[1]]]);
      ans = [[c[0] + c[2], vars[0]], [c[1] + c[3], vars[1]]];
    } while (ans[0][0] === 0 || ans[1][0] === 0);
    return { q: Q('Simplify', poly(terms)), a: poly(ans) };
  });

  topic('substitution', 'Algebra', 'Substitution', () => {
    const a = RNZ(-5, 6), b = RNZ(-5, 6), A = it('a'), B = it('b');
    const t = pick([
      () => { const p = RNZ(-6, 7), q = RNZ(-6, 7); return [poly([[p, A], [q, B]]), p * a + q * b]; },
      () => { const q = RNZ(-6, 7); return [poly([[1, sq(A)], [q, B]]), a * a + q * b]; },
      () => { const p = R(2, 6); return [`${p}${it('ab')}`, p * a * b]; },
      () => { const p = R(2, 5), q = RNZ(-9, 9); return [poly([[p, sq(A)], [q, '']]), p * a * a + q]; },
      () => [sq(`(${A} + ${B})`), (a + b) ** 2],
      () => { const p = R(2, 5); return [poly([[p, A], [-1, sq(B)]]), p * a - b * b]; },
    ]);
    const [expr, val] = t();
    return { q: Q('Find the value of', expr, `when ${A} = ${num(a)} and ${B} = ${num(b)}`), a: num(val) };
  });

  topic('expandSingle', 'Algebra', 'Expanding single brackets', () => {
    const a = R(1, 6), b = RNZ(-9, 9), inner = poly([[a, X], [b, '']]);
    const t = R(1, 3);
    if (t === 1) {
      const k = pick([2, 3, 4, 5, 6, 7, 8, 9, -2, -3, -4, -5]);
      return { q: Q('Expand', `${num(k)}(${inner})`), a: poly([[k * a, X], [k * b, '']]) };
    }
    if (t === 2) {
      const k = pick([1, 2, 3, 4, 5, -1, -2, -3]);
      const pre = k === 1 ? X : k === -1 ? M + X : num(k) + X;
      return { q: Q('Expand', `${pre}(${inner})`), a: poly([[k * a, sq(X)], [k * b, X]]) };
    }
    const k = R(2, 6), j = pick([2, 3, 4, 5, -2, -3, -4]), c = R(1, 5), d = RNZ(-9, 9);
    return {
      q: Q('Expand and simplify', `${k}(${inner}) ${j < 0 ? M : '+'} ${Math.abs(j)}(${poly([[c, X], [d, '']])})`),
      a: poly([[k * a + j * c, X], [k * b + j * d, '']]),
    };
  });

  topic('expandDouble', 'Algebra', 'Expanding double brackets', () => {
    const p = pick([1, 1, 1, 1, 2, 3]), q = pick([1, 1, 1, 2, 3]), a = RNZ(-9, 9), b = RNZ(-9, 9);
    const f1 = poly([[p, X], [a, '']]);
    if (chance(0.2)) return { q: Q('Expand and simplify', sq(`(${f1})`)), a: poly([[p * p, sq(X)], [2 * p * a, X], [a * a, '']]) };
    return {
      q: Q('Expand and simplify', `(${f1})(${poly([[q, X], [b, '']])})`),
      a: poly([[p * q, sq(X)], [p * b + q * a, X], [a * b, '']]),
    };
  });

  topic('factoriseSingle', 'Algebra', 'Factorising into a single bracket', () => {
    let h, b, c; const withX = chance(0.4);
    do { h = R(withX ? 1 : 2, 9); b = R(1, 9); c = RNZ(-9, 9); } while (gcd(b, c) !== 1);
    const inner = poly([[b, X], [c, '']]);
    if (withX) return { q: Q('Factorise fully', poly([[h * b, sq(X)], [h * c, X]])), a: `${co(h)}${X}(${inner})` };
    return { q: Q('Factorise fully', poly([[h * b, X], [h * c, '']])), a: `${h}(${inner})` };
  });

  topic('factoriseQuad', 'Algebra', 'Factorising quadratics', () => {
    if (chance(0.2)) {
      const k = R(1, 12);
      return { q: Q('Factorise', poly([[1, sq(X)], [-k * k, '']])), a: `(${X} + ${k})(${X} ${M} ${k})` };
    }
    let a, b; do { a = RNZ(-9, 9); b = RNZ(-9, 9); } while (a + b === 0);
    return {
      q: Q('Factorise', poly([[1, sq(X)], [a + b, X], [a * b, '']])),
      a: `(${poly([[1, X], [Math.max(a, b), '']])})(${poly([[1, X], [Math.min(a, b), '']])})`,
    };
  });

  topic('solveLinear', 'Algebra', 'Solving linear equations', () => {
    const t = R(1, 3);
    if (t === 1) {
      const x = RNZ(-5, 12), a = R(2, 9), b = RNZ(-15, 15);
      return { q: Q('Solve', `${poly([[a, X], [b, '']])} = ${num(a * x + b)}`), a: `${X} = ${num(x)}` };
    }
    if (t === 2) {
      const x = RNZ(-5, 12), a = R(2, 6), b = RNZ(-8, 8);
      return { q: Q('Solve', `${a}(${poly([[1, X], [b, '']])}) = ${num(a * (x + b))}`), a: `${X} = ${num(x)}` };
    }
    const a = R(2, 6), x = a * RNZ(-3, 6), b = RNZ(-9, 9);
    return { q: Q('Solve', `${fracHTML(X, a)}${signed(b)} = ${num(x / a + b)}`), a: `${X} = ${num(x)}` };
  });

  topic('solveBothSides', 'Algebra', 'Equations with unknowns on both sides', () => {
    const x = RNZ(-5, 10); let a, c;
    if (chance(0.3)) {
      const k = R(2, 5), b = RNZ(-6, 6);
      do { c = R(1, 9); } while (c === k);
      const d = k * (x + b) - c * x;
      return { q: Q('Solve', `${k}(${poly([[1, X], [b, '']])}) = ${poly([[c, X], [d, '']])}`), a: `${X} = ${num(x)}` };
    }
    do { a = R(1, 9); c = R(1, 9); } while (a === c);
    const b = RNZ(-12, 12), d = (a - c) * x + b;
    return { q: Q('Solve', `${poly([[a, X], [b, '']])} = ${poly([[c, X], [d, '']])}`), a: `${X} = ${num(x)}` };
  });

  topic('inequalities', 'Algebra', 'Inequalities', () => {
    if (chance(0.35)) {
      const lo = R(-6, 3), hi = lo + R(2, 5), s1 = pick(['&lt;', LE]), s2 = pick(['&lt;', LE]);
      const vals = [];
      for (let n = lo; n <= hi; n++) {
        if ((s1 === LE ? n >= lo : n > lo) && (s2 === LE ? n <= hi : n < hi)) vals.push(num(n));
      }
      const N = it('n');
      return {
        q: Q(`${N} is an integer.`, `${num(lo)} ${s1} ${N} ${s2} ${num(hi)}`, `List the possible values of ${N}.`),
        a: vals.join(', '),
      };
    }
    const k = R(-5, 10), a = R(2, 9), b = RNZ(-12, 12), s = pick(['&lt;', '&gt;', LE, GE]);
    return { q: Q('Solve', `${poly([[a, X], [b, '']])} ${s} ${num(a * k + b)}`), a: `${X} ${s} ${num(k)}` };
  });

  topic('rearrange', 'Algebra', 'Changing the subject', () => {
    const t = pick([
      () => { const a = R(2, 9), b = RNZ(-9, 9); return [X, `${Y} = ${poly([[a, X], [b, '']])}`, `${X} = ${fracHTML(poly([[1, Y], [-b, '']]), a)}`]; },
      () => { const a = R(2, 9), b = RNZ(-9, 9); return [X, `${Y} = ${fracHTML(X, a)}${signed(b)}`, `${X} = ${a}(${poly([[1, Y], [-b, '']])})`]; },
      () => { const a = R(2, 9), b = RNZ(-9, 9); return [X, `${Y} = ${a}(${poly([[1, X], [b, '']])})`, `${X} = ${fracHTML(Y, a)}${signed(-b)}`]; },
      () => { const a = R(2, 9); return [X, `${Y} = ${a}${sq(X)}`, `${X} = ${surd(fracHTML(Y, a))}`]; },
      () => [it('t'), `${it('v')} = ${it('u')} + ${it('at')}`, `${it('t')} = ${fracHTML(`${it('v')} ${M} ${it('u')}`, it('a'))}`],
      () => [it('r'), `${it('A')} = π${sq(it('r'))}`, `${it('r')} = ${surd(fracHTML(it('A'), 'π'))}`],
      () => [it('d'), `${it('s')} = ${fracHTML(it('d'), it('t'))}`, `${it('d')} = ${it('st')}`],
      () => [it('w'), `${it('P')} = 2${it('l')} + 2${it('w')}`, `${it('w')} = ${fracHTML(`${it('P')} ${M} 2${it('l')}`, '2')}`],
    ]);
    const [v, f, a] = t();
    return { q: Q(`Make ${v} the subject of`, f), a };
  });

  topic('nthTerm', 'Algebra', 'nth term of linear sequences', () => {
    const d = RNZ(-7, 9), a = R(-10, 20);
    const seq = [0, 1, 2, 3, 4].map((i) => num(a + i * d)).join(', ');
    return { q: Q('Find the <i>n</i>th term of', `${seq}, …`), a: poly([[d, it('n')], [a - d, '']]) };
  });

  topic('straightLines', 'Algebra', 'Straight line graphs', () => {
    const t = R(1, 3);
    if (t === 1) {
      const x1 = R(-6, 6), y1 = R(-6, 8); let x2;
      do { x2 = R(-6, 8); } while (x2 === x1);
      const y2 = y1 + RNZ(-10, 10);
      return {
        q: Q('Find the gradient of the line through', `(${num(x1)}, ${num(y1)}) and (${num(x2)}, ${num(y2)})`),
        a: fr(y2 - y1, x2 - x1),
      };
    }
    if (t === 2) {
      const m = RNZ(-4, 5), c = R(-8, 8), x1 = R(-3, 3), x2 = x1 + R(1, 4);
      return {
        q: Q('Find the equation of the line through', `(${num(x1)}, ${num(m * x1 + c)}) and (${num(x2)}, ${num(m * x2 + c)})`),
        a: `${Y} = ${poly([[m, X], [c, '']])}`,
      };
    }
    const k = R(2, 4), m = RNZ(-5, 5), c = RNZ(-6, 6);
    return {
      q: Q('Write down the gradient and <i>y</i>-intercept of', `${k}${Y} = ${poly([[k * m, X], [k * c, '']])}`),
      a: `gradient = ${num(m)}, <i>y</i>-intercept = (0, ${num(c)})`,
    };
  });

  topic('indexLaws', 'Algebra', 'Laws of indices', () => {
    const L = it(pick(['x', 'y', 'a', 'm', 'p']));
    const t = pick(['mult', 'div', 'pow', 'num']);
    if (t === 'mult') {
      const c1 = R(1, 6), c2 = R(1, 6), a = R(2, 9), b = R(2, 9);
      return { q: Q('Simplify', `${co(c1)}${pw(L, a)} ${TIMES} ${co(c2)}${pw(L, b)}`), a: `${co(c1 * c2)}${pw(L, a + b)}` };
    }
    if (t === 'div') {
      const c1 = R(1, 5), c2 = R(1, 6), a = R(2, 7), b = R(1, 6);
      return { q: Q('Simplify', `${co(c1 * c2)}${pw(L, a + b)} ${DIV} ${co(c1)}${pw(L, a)}`), a: `${co(c2)}${pw(L, b)}` };
    }
    if (t === 'pow') {
      const c = R(1, 3), a = R(2, 6), b = R(2, 4);
      return { q: Q('Simplify', `(${co(c)}${pw(L, a)})<sup>${b}</sup>`), a: `${co(c ** b)}${pw(L, a * b)}` };
    }
    const k = R(2, 9), a = R(2, 12), b = R(2, 9), mult = chance(0.5);
    return {
      q: Q(`Write as a single power of ${k}`, `${pw(k, a + (mult ? 0 : b))} ${mult ? TIMES : DIV} ${pw(k, b)}`),
      a: pw(k, a),
    };
  });

  topic('solveQuad', 'Algebra', 'Solving quadratics by factorising', () => {
    if (chance(0.3)) {
      const p = R(2, 3); let a; do { a = RNZ(-7, 7); } while (gcd(a, p) !== 1);
      const b = RNZ(-6, 6);
      return {
        q: Q('Solve', `${poly([[p, sq(X)], [p * b + a, X], [a * b, '']])} = 0`),
        a: `${X} = ${fr(-a, p)} or ${X} = ${num(-b)}`,
      };
    }
    let r1, r2; do { r1 = RNZ(-9, 9); r2 = RNZ(-9, 9); } while (r1 === r2);
    return {
      q: Q('Solve', `${poly([[1, sq(X)], [-(r1 + r2), X], [r1 * r2, '']])} = 0`),
      a: `${X} = ${num(Math.min(r1, r2))} or ${X} = ${num(Math.max(r1, r2))}`,
    };
  }, 'H');

  topic('simultaneous', 'Algebra', 'Simultaneous equations', () => {
    const x = RNZ(-5, 8), y = RNZ(-5, 8); let a, b, d, e;
    do { a = R(1, 6); d = R(1, 6); b = RNZ(-5, 6); e = RNZ(-5, 6); } while (a * e - b * d === 0 || (a === d && b === e));
    return {
      q: Q('Solve the simultaneous equations',
        `<span class="eqs">${poly([[a, X], [b, Y]])} = ${num(a * x + b * y)}<br>${poly([[d, X], [e, Y]])} = ${num(d * x + e * y)}</span>`),
      a: `${X} = ${num(x)}, ${Y} = ${num(y)}`,
    };
  });

  // ===== RATIO, PROPORTION & RATES OF CHANGE =====
  topic('percentOf', 'Ratio & proportion', 'Percentage of an amount', () => {
    const p = pick([1, 2, 3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 55, 60, 65, 70, 75, 80, 85, 90]);
    const amt = R(3, 60) * 10;
    return { q: Q('Work out', `${p}% of ${money(amt)}`), a: money((amt * p) / 100) };
  });

  topic('percentChange', 'Ratio & proportion', 'Percentage increase & decrease', () => {
    const amt = R(4, 50) * 10, p = pick([3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40]), up = chance(0.5);
    return {
      q: Q(`${up ? 'Increase' : 'Decrease'}`, `${money(amt)} by ${p}%`),
      a: money(amt * (1 + ((up ? 1 : -1) * p) / 100)),
    };
  });

  topic('percentChangeFind', 'Ratio & proportion', 'Finding the percentage change', () => {
    const a = R(2, 25) * 20, up = chance(0.5), p = up ? R(1, 12) * 5 : R(1, 12) * 5;
    const b = a * (1 + ((up ? 1 : -1) * p) / 100);
    return {
      q: Q('A price changes from', `${money(a)} to ${money(b)}`, 'Work out the percentage change.'),
      a: `${p}% ${up ? 'increase' : 'decrease'}`,
    };
  });

  topic('reversePercent', 'Ratio & proportion', 'Reverse percentages', () => {
    const a = R(2, 30) * 20, p = pick([5, 10, 15, 20, 25, 30, 35, 40, 45]), up = chance(0.5);
    const b = a * (1 + ((up ? 1 : -1) * p) / 100);
    return {
      q: Q(`After a ${p}% ${up ? 'increase' : 'decrease'}, a price is`, money(b), 'Work out the original price.'),
      a: money(a),
    };
  });

  topic('compoundInterest', 'Ratio & proportion', 'Compound interest & depreciation', () => {
    const n = R(2, 6);
    if (chance(0.5)) {
      const P = R(5, 50) * 100, r = pick([1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6]);
      return {
        q: Q(`${money(P)} is invested at ${num(r)}% compound interest per year.`, '', `Work out its value after ${n} years.`),
        a: '£' + dp(P * (1 + r / 100) ** n, 2),
      };
    }
    const P = R(6, 30) * 1000, r = pick([5, 8, 10, 12, 15, 20]);
    return {
      q: Q(`A car worth ${money(P)} depreciates by ${r}% per year.`, '', `Work out its value after ${n} years.`),
      a: '£' + dp(P * (1 - r / 100) ** n, 2),
    };
  });

  topic('ratioShare', 'Ratio & proportion', 'Sharing in a ratio', () => {
    let parts;
    do { parts = Array.from({ length: chance(0.7) ? 2 : 3 }, () => R(1, 9)); } while (parts.reduce(gcd) !== 1);
    const k = R(2, 15) * pick([1, 1, 5, 10]), total = k * sum(parts);
    return {
      q: Q('Share', `${money(total)} in the ratio ${parts.join(' : ')}`),
      a: parts.map((p) => money(p * k)).join(', '),
    };
  });

  topic('ratioSimplify', 'Ratio & proportion', 'Simplifying ratios', () => {
    let parts;
    do { parts = Array.from({ length: chance(0.75) ? 2 : 3 }, () => R(1, 9)); } while (parts.reduce(gcd) !== 1);
    const k = R(2, 12);
    return { q: Q('Write in its simplest form', parts.map((p) => p * k).join(' : ')), a: parts.join(' : ') };
  });

  topic('compoundMeasures', 'Ratio & proportion', 'Speed, density & compound measures', () => {
    if (chance(0.6)) {
      const s = R(3, 18) * 5, t = pick([0.5, 1.5, 2, 2.5, 3, 4, 5]), d = s * t;
      const w = pick(['A car', 'A train', 'A cyclist', 'A coach']);
      const v = pick(['speed', 'distance', 'time']);
      if (v === 'speed') return { q: Q(`${w} travels ${num(d)} km in ${hrsStr(t)}.`, '', 'Work out its average speed.'), a: `${s} km/h` };
      if (v === 'distance') return { q: Q(`${w} travels at ${s} km/h for ${hrsStr(t)}.`, '', 'How far does it travel?'), a: `${num(d)} km` };
      return { q: Q(`${w} travels ${num(d)} km at ${s} km/h.`, '', 'How long does the journey take?'), a: hrsStr(t) };
    }
    const den = R(2, 12), vol = R(3, 40), m = den * vol;
    const v = pick(['mass', 'density', 'volume']);
    if (v === 'mass') return { q: Q(`An object has density ${den} g/cm³ and volume ${vol} cm³.`, '', 'Work out its mass.'), a: `${m} g` };
    if (v === 'density') return { q: Q(`An object has mass ${m} g and volume ${vol} cm³.`, '', 'Work out its density.'), a: `${den} g/cm³` };
    return { q: Q(`An object has mass ${m} g and density ${den} g/cm³.`, '', 'Work out its volume.'), a: `${vol} cm³` };
  });

  // ===== GEOMETRY & MEASURES =====
  topic('angleFacts', 'Geometry & measures', 'Angle facts', () => {
    const t = R(1, 5);
    if (t === 1) {
      let a, b; do { a = R(20, 100); b = R(20, 100); } while (a + b > 165);
      return { q: Q(`Two angles in a triangle are ${a}° and ${b}°.`, '', 'Work out the size of the third angle.'), a: `${180 - a - b}°` };
    }
    if (t === 2) {
      let a, b; do { a = R(20, 110); b = R(20, 110); } while (a + b > 165);
      return { q: Q(`Three angles on a straight line are ${a}°, ${b}° and ${X}.`, '', `Work out ${X}.`), a: `${X} = ${180 - a - b}°` };
    }
    if (t === 3) {
      let a, b, c; do { a = R(40, 130); b = R(40, 130); c = R(40, 130); } while (a + b + c > 330);
      return { q: Q(`Four angles around a point are ${a}°, ${b}°, ${c}° and ${X}.`, '', `Work out ${X}.`), a: `${X} = ${360 - a - b - c}°` };
    }
    if (t === 4) {
      const a = 2 * R(10, 70);
      return {
        q: Q(`In an isosceles triangle, the angle between the two equal sides is ${a}°.`, '', 'Work out the size of each of the other two angles.'),
        a: `${(180 - a) / 2}° and ${(180 - a) / 2}°`,
      };
    }
    let a, b, c; do { a = R(50, 130); b = R(50, 130); c = R(50, 130); } while (a + b + c > 320);
    return { q: Q(`Three angles in a quadrilateral are ${a}°, ${b}° and ${c}°.`, '', 'Work out the size of the fourth angle.'), a: `${360 - a - b - c}°` };
  });

  topic('polygons', 'Geometry & measures', 'Angles in polygons', () => {
    const names = { 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' };
    const nm = (n) => names[n] || `${n}-sided polygon`;
    const an = (n) => (/^[aeiou8]/.test(nm(n)) || n === 18 ? 'an' : 'a');
    const t = pick(['sum', 'ext', 'int', 'sidesExt', 'sidesInt']);
    if (t === 'sum') { const n = R(5, 12); return { q: Q(`Work out the sum of the interior angles of ${an(n)} ${nm(n)}.`, ''), a: `${(n - 2) * 180}°` }; }
    const n = pick([5, 6, 8, 9, 10, 12, 15, 18, 20]), e = 360 / n;
    if (t === 'ext') return { q: Q(`Work out the size of each exterior angle of a regular ${nm(n)}.`, ''), a: `${e}°` };
    if (t === 'int') return { q: Q(`Work out the size of each interior angle of a regular ${nm(n)}.`, ''), a: `${180 - e}°` };
    if (t === 'sidesExt') return { q: Q(`Each exterior angle of a regular polygon is ${e}°.`, '', 'How many sides does it have?'), a: `${n}` };
    return { q: Q(`Each interior angle of a regular polygon is ${180 - e}°.`, '', 'How many sides does it have?'), a: `${n}` };
  });

  topic('area', 'Geometry & measures', 'Area of 2D shapes', () => {
    const t = pick(['rect', 'tri', 'para', 'trap']);
    let s, area;
    if (t === 'rect') {
      const l = R(3, 15), w = R(2, 12); area = l * w;
      s = `<rect x="40" y="35" width="180" height="100" ${stroke}/>` + lbl(130, 160, `${l} cm`) + lbl(230, 91, `${w} cm`, 'start');
    } else if (t === 'tri') {
      const b = R(3, 16), h = R(2, 12); area = (b * h) / 2;
      s = `<polygon points="30,145 220,145 160,30" ${stroke}/><line x1="160" y1="30" x2="160" y2="145" ${dash}/>`
        + `<polyline points="160,133 172,133 172,145" fill="none" stroke="currentColor" stroke-width="1.5"/>`
        + lbl(125, 170, `${b} cm`) + lbl(152, 100, `${h} cm`, 'end');
    } else if (t === 'para') {
      const b = R(3, 15), h = R(2, 12); area = b * h;
      s = `<polygon points="70,35 235,35 190,145 25,145" ${stroke}/><line x1="70" y1="35" x2="70" y2="145" ${dash}/>`
        + `<polyline points="70,133 82,133 82,145" fill="none" stroke="currentColor" stroke-width="1.5"/>`
        + lbl(108, 170, `${b} cm`) + lbl(78, 100, `${h} cm`, 'start');
    } else {
      let a, b; do { a = R(2, 12); b = R(4, 16); } while (b <= a);
      const h = R(2, 10); area = ((a + b) * h) / 2;
      s = `<polygon points="80,40 180,40 230,145 30,145" ${stroke}/><line x1="80" y1="40" x2="80" y2="145" ${dash}/>`
        + `<polyline points="80,133 92,133 92,145" fill="none" stroke="currentColor" stroke-width="1.5"/>`
        + lbl(130, 30, `${a} cm`) + lbl(130, 170, `${b} cm`) + lbl(88, 100, `${h} cm`, 'start');
    }
    return { q: Q('Work out the area', svg(s, 'Shape diagram'), 'Not drawn accurately'), a: `${num(area)} cm²` };
  });

  topic('circles', 'Geometry & measures', 'Area & circumference of circles', () => {
    const useD = chance(0.4), r = R(2, 15), val = useD ? 2 * r : r;
    const s = `<circle cx="130" cy="88" r="72" ${stroke}/><circle cx="130" cy="88" r="3" fill="currentColor"/>`
      + (useD ? `<line x1="58" y1="88" x2="202" y2="88" stroke="currentColor" stroke-width="2"/>`
        : `<line x1="130" y1="88" x2="202" y2="88" stroke="currentColor" stroke-width="2"/>`)
      + lbl(useD ? 130 : 166, 80, `${val} cm`);
    const area = chance(0.5), exact = chance(0.3);
    const what = area ? 'area' : 'circumference';
    let ans;
    if (exact) ans = area ? `${r * r}π cm²` : `${2 * r}π cm`;
    else ans = area ? `${dp(Math.PI * r * r, 1)} cm²` : `${dp(2 * Math.PI * r, 1)} cm`;
    return {
      q: Q(`Work out the ${what} of the circle`, svg(s, 'Circle'), exact ? 'Give your answer in terms of π.' : 'Give your answer to 1 d.p.'),
      a: ans,
    };
  });

  topic('volume', 'Geometry & measures', 'Volume of prisms & cylinders', () => {
    const t = pick(['cuboid', 'cyl', 'tri', 'prism']);
    if (t === 'cuboid') {
      const l = R(2, 12), w = R(2, 10), h = R(2, 10);
      return { q: Q(`A cuboid measures ${l} cm by ${w} cm by ${h} cm.`, '', 'Work out its volume.'), a: `${l * w * h} cm³` };
    }
    if (t === 'cyl') {
      const r = R(2, 10), h = R(3, 20), exact = chance(0.3);
      return {
        q: Q(`A cylinder has radius ${r} cm and height ${h} cm.`, '', `Work out its volume${exact ? ', in terms of π.' : ' to 1 d.p.'}`),
        a: exact ? `${r * r * h}π cm³` : `${dp(Math.PI * r * r * h, 1)} cm³`,
      };
    }
    if (t === 'tri') {
      const b = R(2, 12), h = R(2, 10), L = R(3, 20);
      return {
        q: Q(`A triangular prism has a cross-section with base ${b} cm and height ${h} cm. It is ${L} cm long.`, '', 'Work out its volume.'),
        a: `${num((b * h * L) / 2)} cm³`,
      };
    }
    const A = R(5, 40), L = R(3, 25);
    return { q: Q(`A prism has a cross-sectional area of ${A} cm² and a length of ${L} cm.`, '', 'Work out its volume.'), a: `${A * L} cm³` };
  });

  topic('pythagoras', 'Geometry & measures', "Pythagoras' theorem", () => {
    const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [20, 21, 29], [12, 16, 20]];
    let a, b, c;
    if (chance(0.4)) { [a, b, c] = pick(triples); if (chance(0.5)) [a, b] = [b, a]; }
    else { a = R(3, 15); b = R(3, 15); c = null; }
    const note = 'Give your answer to 1 d.p. where necessary.';
    const show = (v) => (Number.isInteger(Math.round(v * 1e9) / 1e9) ? num(v) : dp(v, 1));
    if (chance(0.5)) {
      const h = Math.sqrt(a * a + b * b);
      return { q: Q(`Work out the length ${X}`, rightTri({ adj: `${a} cm`, opp: `${b} cm`, hyp: 'x' }), note), a: `${X} = ${show(h)} cm` };
    }
    let hyp = c, side = b;
    if (!hyp) { hyp = R(Math.max(a, 5) + 1, 20); side = a; }
    const known = c ? a : side;
    const ans = Math.sqrt(hyp * hyp - known * known);
    return { q: Q(`Work out the length ${X}`, rightTri({ adj: `${known} cm`, opp: 'x', hyp: `${hyp} cm` }), note), a: `${X} = ${show(ans)} cm` };
  });

  topic('trig', 'Geometry & measures', 'Right-angled trigonometry', () => {
    const th = R(20, 70), s = R(5, 20), rad = (th * Math.PI) / 180;
    const t = pick(['sinO', 'cosA', 'tanO', 'hypO', 'hypA', 'adjO', 'ang']);
    const note = 'Give your answer to 1 d.p.';
    const side = (labels, v) => ({ q: Q(`Work out the length ${X}`, rightTri({ ...labels, ang: `${th}°` }), note), a: `${X} = ${dp(v, 1)} cm` });
    const S = `${s} cm`;
    if (t === 'sinO') return side({ hyp: S, opp: 'x' }, s * Math.sin(rad));
    if (t === 'cosA') return side({ hyp: S, adj: 'x' }, s * Math.cos(rad));
    if (t === 'tanO') return side({ adj: S, opp: 'x' }, s * Math.tan(rad));
    if (t === 'hypO') return side({ opp: S, hyp: 'x' }, s / Math.sin(rad));
    if (t === 'hypA') return side({ adj: S, hyp: 'x' }, s / Math.cos(rad));
    if (t === 'adjO') return side({ opp: S, adj: 'x' }, s / Math.tan(rad));
    const k = pick(['oa', 'oh', 'ah']);
    let labels, deg;
    if (k === 'oa') { const o = R(3, 15), a = R(3, 15); labels = { opp: `${o} cm`, adj: `${a} cm` }; deg = Math.atan(o / a); }
    else { const h = R(8, 20), o = R(3, h - 2); labels = k === 'oh' ? { opp: `${o} cm`, hyp: `${h} cm` } : { adj: `${o} cm`, hyp: `${h} cm` }; deg = k === 'oh' ? Math.asin(o / h) : Math.acos(o / h); }
    return {
      q: Q(`Work out the size of angle ${X}`, rightTri({ ...labels, ang: 'x' }), note),
      a: `${X} = ${dp((deg * 180) / Math.PI, 1)}°`,
    };
  });

  // ===== STATISTICS & PROBABILITY =====
  topic('averages', 'Statistics & probability', 'Mean, median, mode & range', () => {
    const t = pick(['mean', 'median', 'mode', 'range']), len = R(5, 9);
    const gen = () => Array.from({ length: len }, () => R(1, 20));
    let list;
    if (t === 'mean') { let tries = 0; do { list = gen(); tries++; } while ((sum(list) * 10) % len !== 0 && tries < 500); }
    else if (t === 'mode') {
      let modes;
      do {
        list = gen(); list[R(0, len - 1)] = list[0]; list[R(0, len - 1)] = list[0];
        const c = {}; list.forEach((v) => { c[v] = (c[v] || 0) + 1; });
        const mx = Math.max(...Object.values(c));
        modes = Object.keys(c).filter((k) => c[k] === mx);
        if (mx < 2) modes = [];
      } while (modes.length !== 1);
    } else list = gen();
    const sorted = list.slice().sort((a, b) => a - b);
    let ans;
    if (t === 'mean') ans = num(sum(list) / len);
    else if (t === 'median') ans = num(len % 2 ? sorted[(len - 1) / 2] : (sorted[len / 2 - 1] + sorted[len / 2]) / 2);
    else if (t === 'range') ans = num(sorted[len - 1] - sorted[0]);
    else {
      const c = {}; list.forEach((v) => { c[v] = (c[v] || 0) + 1; });
      ans = Object.keys(c).reduce((a, b) => (c[b] > c[a] ? b : a));
    }
    return { q: Q(`Find the ${t} of`, list.join(', ')), a: ans };
  });

  topic('probability', 'Statistics & probability', 'Probability', () => {
    const t = R(1, 4);
    if (t === 1) {
      const p = R(5, 95);
      return { q: Q(`The probability that it rains tomorrow is ${num(p / 100)}.`, '', 'Work out the probability that it does not rain tomorrow.'), a: num((100 - p) / 100) };
    }
    if (t === 2) {
      const cols = shuffle(['red', 'blue', 'green', 'yellow']).slice(0, 3), counts = cols.map(() => R(1, 9));
      const i = R(0, 2), tot = sum(counts);
      return {
        q: Q(`A bag contains ${counts.map((c, j) => `${c} ${cols[j]}`).join(', ').replace(/, ([^,]*)$/, ' and $1')} counters. One is taken at random.`, '', `Work out P(${cols[i]}).`),
        a: fr(counts[i], tot),
      };
    }
    if (t === 3) {
      let p; do { p = [R(1, 7), R(1, 7), R(1, 7)]; } while (sum(p) > 19);
      p.push(20 - sum(p));
      const cols = ['Red', 'Blue', 'Green', 'Yellow'], miss = R(0, 3);
      const table = `<table class="ptable"><tr><th>Colour</th>${cols.map((c) => `<th>${c}</th>`).join('')}</tr>`
        + `<tr><th>Probability</th>${p.map((v, j) => `<td>${j === miss ? X : num(v / 20)}</td>`).join('')}</tr></table>`;
      return { q: Q(`A spinner is spun. Work out ${X}.`, table), a: `${X} = ${num(p[miss] / 20)}` };
    }
    const p = pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.15, 0.35, 0.6, 0.05]), n = pick([40, 60, 80, 100, 120, 200, 300, 400, 500]);
    return { q: Q(`The probability that a biased coin lands on heads is ${num(p)}. It is thrown ${n} times.`, '', 'How many heads would you expect?'), a: num(p * n) };
  });

  const api = { TOPICS };
  global.GCSE_TOPICS = TOPICS;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
