// Run with: node tests/generators.test.js
const { TOPICS } = require('../js/questions.js');
let failures = 0;
const ids = new Set();
for (const t of TOPICS) {
  if (ids.has(t.id)) { console.error(`Duplicate id ${t.id}`); failures++; }
  ids.add(t.id);
  for (let i = 0; i < 2000; i++) {
    let r;
    try { r = t.gen(); } catch (e) { console.error(`${t.id} threw: ${e.message}`); failures++; break; }
    const bad = [r && r.q, r && r.a].some((s) => typeof s !== 'string' || !s || /NaN|undefined|Infinity|null/.test(s));
    if (bad) { console.error(`${t.id} produced bad output:`, r); failures++; break; }
  }
}
console.log(`${TOPICS.length} topics checked, ${failures} failure(s).`);
process.exit(failures ? 1 : 0);
