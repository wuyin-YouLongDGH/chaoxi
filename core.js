/* ============================================================
   潮汐 Tide · 核心层
   工具函数 / 本地存储 / 统计归因 / 洞察文案生成
   ============================================================ */

/* ---------- 工具 ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, m =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const DAY = 86400000;
const EMO_MAP = {};   EMOTIONS.forEach(c => { EMO_MAP[c.key] = c; c.items.forEach(i => EMO_MAP[i.key] = { ...i, parent: c }); });
const TRIG_MAP = {};  TRIGGERS.forEach(g => g.items.forEach(i => TRIG_MAP[i.key] = { ...i, group: g.group }));
const SPARK_MAP = {}; SPARKS.forEach(g => g.items.forEach(i => SPARK_MAP[i.key] = { ...i, group: g.group }));
const BODY_MAP = {};  BODY_SIGNS.forEach(b => BODY_MAP[b.key] = b);
const METHOD_MAP = {}; METHODS.forEach(m => METHOD_MAP[m.id] = m);

const startOfDay = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
const dayKey = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/* 大类对象带 items 数组，细分情绪带 parent 指针 */
const catOf  = k => { const e = EMO_MAP[k]; return e ? (e.items ? e : e.parent) : undefined; };
/* 情绪极性三态。细分情绪可以覆盖所在大类——例如「平静」是正面，但同类的「空」是中性。
   只分「负面 / 非负面」会让中性情绪混进正面统计里（正向来源出现负面标签就是这么来的）。 */
const toneOf = k => { const e = EMO_MAP[k]; if (!e) return 'neg'; return e.tone || (e.parent ? e.parent.tone : 'neg'); };
const isNeg  = k => toneOf(k) === 'neg';
const isPos  = k => toneOf(k) === 'pos';
const isNeu  = k => toneOf(k) === 'neutral';
/* 中性情绪不参与情绪曲线的正负计算 */
const moodScore = r => { const t = toneOf(r.e); return (t === 'pos' ? 1 : t === 'neg' ? -1 : 0) * r.i; };

/* ---- 标签（压力源 / 滋养源两套）----
   TRIGGERS 回答「什么在压着你」，SPARKS 回答「什么在托着你」。key 刻意不重复，故可共用查找表。 */
const facetOf   = k => TRIG_MAP[k] || SPARK_MAP[k];
const facetName = k => (facetOf(k) || {}).name || k;
/* 正面情绪用滋养源；其余（含中性）用压力源——「是什么引起的」这个问法本身是中性表述 */
const facetPool = emoKey => isPos(emoKey) ? SPARKS : TRIGGERS;
const facetKeys = emoKey => new Set(facetPool(emoKey).flatMap(g => g.items.map(i => i.key)));

function fmtTime(ts) {
  const d = new Date(ts), now = new Date();
  const same = dayKey(ts) === dayKey(now.getTime());
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (same) return `今天 ${hm}`;
  if (dayKey(ts) === dayKey(now.getTime() - DAY)) return `昨天 ${hm}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`;
}
const HOUR_SLOTS = [
  { k: 'morning',   name: '早晨', r: [5, 9],   color: '#E0A03C' },
  { k: 'noon',      name: '上午', r: [9, 12],  color: '#D7B25E' },
  { k: 'midday',    name: '中午', r: [12, 14], color: '#8FB486' },
  { k: 'afternoon', name: '下午', r: [14, 18], color: '#6E9FC0' },
  { k: 'evening',   name: '晚间', r: [18, 22], color: '#8A7EBB' },
  { k: 'night',     name: '深夜', r: [22, 29], color: '#6A6A8E' }
];
const slotOf = ts => {
  const h = new Date(ts).getHours();
  return HOUR_SLOTS.find(s => (h >= s.r[0] && h < s.r[1])) || HOUR_SLOTS[5];
};

/* ---------- 存储 ---------- */
const STORE_KEY = 'tide.records.v1';
const Store = {
  load() {
    try { const raw = localStorage.getItem(STORE_KEY); const a = raw ? JSON.parse(raw) : []; return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  },
  save(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }
};

/* ---------- 统计与归因 ---------- */
function dist(records, keyFn) {
  const m = new Map();
  records.forEach(r => {
    const ks = keyFn(r);
    (Array.isArray(ks) ? ks : [ks]).filter(Boolean).forEach(k => m.set(k, (m.get(k) || 0) + 1));
  });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function calcStats(records) {
  const list = [...records].sort((a, b) => a.ts - b.ts);
  const now = Date.now();
  const t7 = now - 7 * DAY, t30 = now - 30 * DAY;

  const last7  = list.filter(r => r.ts >= t7);
  const last30 = list.filter(r => r.ts >= t30);
  const neg7   = last7.filter(r => isNeg(r.e));
  const negAll = list.filter(r => isNeg(r.e));

  /* 情绪大类分布 */
  const byCat = dist(list, r => r.c).filter(([k]) => EMO_MAP[k]).map(([k, v]) => ({ key: k, n: v, ...EMO_MAP[k] }));
  /* 具体情绪分布 */
  const byEmo = dist(list, r => r.e).filter(([k]) => EMO_MAP[k])
    .map(([k, v]) => ({ key: k, n: v, name: EMO_MAP[k].name, cat: (catOf(k) || {}).key }));

  /* 触发因素（分负面/全部） */
  const trigNeg = dist(negAll, r => r.tg).map(([k, v]) => ({ key: k, n: v, name: facetName(k), group: (facetOf(k) || {}).group || '' }));
  const trigAll = dist(list, r => r.tg).map(([k, v]) => ({ key: k, n: v, name: facetName(k) }));

  /* 身体信号与负面的共现 */
  const negBody = dist(negAll, r => r.bd).map(([k, v]) => ({ key: k, n: v, name: (BODY_MAP[k] || {}).name || k }));

  /* 时段分布 */
  const hours = HOUR_SLOTS.map(s => {
    const rows = list.filter(r => slotOf(r.ts).k === s.k);
    return { ...s, total: rows.length, neg: rows.filter(r => isNeg(r.e)).length };
  });

  /* 近 14 天情绪曲线 */
  const series = [];
  for (let i = 13; i >= 0; i--) {
    const ds = startOfDay(now - i * DAY), de = ds + DAY;
    const rows = list.filter(r => r.ts >= ds && r.ts < de);
    series.push({
      date: new Date(ds),
      avg: rows.length ? rows.reduce((a, r) => a + moodScore(r), 0) / rows.length : null,
      n: rows.length
    });
  }

  /* 近 56 天热力图（8 列 × 7 行，行=周一..周日） */
  const today = startOfDay(now);
  const todayDow = (new Date(today).getDay() + 6) % 7;          // 周一=0
  const gridStart = today - todayDow * DAY - 7 * 7 * DAY;
  const heat = [];
  for (let i = 0; i < 56; i++) {
    const ds = gridStart + i * DAY, de = ds + DAY;
    const rows = list.filter(r => r.ts >= ds && r.ts < de);
    const dom = rows.length ? rows.reduce((a, r) => (r.i > a.i ? r : a), rows[0]) : null;
    heat.push({
      ds, count: rows.length, future: ds > today,
      color: dom ? (catOf(dom.e) || {}).color : null,
      avgI: rows.length ? rows.reduce((a, r) => a + r.i, 0) / rows.length : 0,
      neg: rows.filter(r => isNeg(r.e)).length
    });
  }

  /* 干预有效性：某个方法做完后情绪平均回升 */
  const reliefs = list.filter(r => r.relief && typeof r.relief.delta === 'number');
  const byMethod = new Map();
  reliefs.forEach(r => {
    const arr = byMethod.get(r.relief.id) || [];
    arr.push(r.relief.delta); byMethod.set(r.relief.id, arr);
  });
  const methodRank = [...byMethod.entries()]
    .map(([id, ds]) => ({ id, name: (METHOD_MAP[id] || {}).name || id, n: ds.length, avg: ds.reduce((a, b) => a + b, 0) / ds.length }))
    .sort((a, b) => b.avg - a.avg);

  /* 连续记录天数 */
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const ds = startOfDay(now) - i * DAY, de = ds + DAY;
    const hit = list.some(r => r.ts >= ds && r.ts < de);
    if (hit) streak++;
    else if (i > 0) break;
  }

  return {
    list, last7, last30, neg7, negAll, byCat, byEmo, trigNeg, trigAll, negBody,
    hours, series, heat, methodRank, streak,
    total: list.length,
    negRatio7: last7.length ? Math.round(neg7.length / last7.length * 100) : 0,
    avgI: list.length ? list.reduce((a, r) => a + r.i, 0) / list.length : 0
  };
}

/* ---------- 洞察文案生成 ---------- */
function buildInsights(s) {
  const out = [];
  if (s.total < 3) return out;

  /* 1. 负面占比 */
  if (s.last7.length >= 3) {
    const p = s.negRatio7;
    if (p >= 55) out.push({ ic: '🌧', t: `最近 7 天你记录了 <b>${s.last7.length}</b> 次，其中 <b>${s.neg7.length}</b> 次是负面情绪，占 <i>${p}%</i>。这个比例偏高——它说明的是这段时间负荷确实大，不是你「太脆弱」。` });
    else if (p <= 30 && s.last7.length >= 4) out.push({ ic: '🌤', t: `最近 7 天你的负面记录只占 <b>${p}%</b>，大部分时候是稳的。可以在下面看看，是什么在托住你。` });
  }

  /* 2. 触发因素 TOP1（在负面记录中） */
  if (s.trigNeg[0] && s.negAll.length >= 3) {
    const t = s.trigNeg[0];
    const share = Math.round(t.n / s.negAll.length * 100);
    out.push({ ic: '🎯', t: `<i>${t.name}</i> 在你的负面情绪里出现了 <b>${t.n}</b> 次（${share}%），是最频繁的触发点。反复出现说明它是<b>持续存在的压力源</b>，不是某一次偶然的事——处理它的方式，也应当和「一次性的坏心情」不同。` });
  }

  /* 3. 时段规律 */
  const nightNeg = s.hours.find(h => h.k === 'night');
  const daySlots = s.hours.filter(h => !['night', 'morning'].includes(h.k));
  const dayNeg = daySlots.reduce((a, h) => a + h.neg, 0);
  if (nightNeg && nightNeg.neg >= 3 && nightNeg.neg > dayNeg * 0.5) {
    out.push({ ic: '🌙', t: `你的情绪低谷集中在 <i>22:00 之后</i>（${nightNeg.neg} 次）。深夜的自我评价通常比白天苛刻得多——那是疲惫在说话。如果深夜的想法让你难受，可以试着<b>不在这时候做任何关于自己的结论</b>。` });
  } else if (s.hours.length) {
    const worst = [...s.hours].sort((a, b) => b.neg - a.neg)[0];
    if (worst && worst.neg >= 2) out.push({ ic: '🕐', t: `<i>${worst.name}</i> 是你情绪最容易下沉的时段（${worst.neg} 次负面记录）。提前知道「什么时候容易」本身就有用——可以在那个时段之前，先把休息和吃饭安排好。` });
  }

  /* 4. 身体信号共现 */
  if (s.negBody[0] && s.negAll.length >= 4) {
    const b = s.negBody[0];
    if (b.n >= 3) out.push({ ic: '🫀', t: `<i>${b.name}</i> 和你的负面情绪同时出现了 <b>${b.n}</b> 次。身体状态和情绪是互相喂养的——下次情绪来的时候，可以先问一句：<b>我是不是只是没睡够 / 没吃好？</b>` });
  }

  /* 5. 高频情绪（优先解读负面，正面单独成句，避免语意错位） */
  const topNeg = s.byEmo.find(e => isNeg(e.key) && e.n >= 3);
  const topAny = s.byEmo[0];
  if (topNeg) {
    const parent = catOf(topNeg.key) || {};
    const hint = {
      anxious: '焦虑几乎总是指向一件还没发生的事。把它写成一句具体的话（我在怕的具体是什么），它就失去一半的力气。',
      selfhate: '自我厌恶不等于事实，它是情绪在最累的时候对自己下的判决。此刻先不辩论，只把它记下来就好。',
      annoyed: '烦躁常常是「过度承载」的信号，而不是脾气问题。',
      powerless: '无力感出现时，最难的是开始。把要做的事缩小到 3 分钟内能做完的程度，会更容易动起来。',
      down: '低落像潮水，会涨也会退。它的存在不需要你立刻解决它。',
      lonely: '孤独最有效的解药不是热闹，是「被某个人具体地看见」。'
    }[topNeg.key] || '情绪反复出现时，先别急着改，先看清它出现的条件——触发点、时段、身体状态，三者凑齐时，它几乎必然出现。';
    out.push({ ic: parent.icon || '◍', t: `<i>${topNeg.name}</i> 是你最常出现的负面情绪（<b>${topNeg.n}</b> 次）。${hint}` });
  } else if (topAny && topAny.n >= 3) {
    out.push({ ic: '◍', t: `<i>${topAny.name}</i> 是你记录最多的情绪（<b>${topAny.n}</b> 次）。这在情绪日记里其实是好消息——说明你的基线是稳的，有余力去处理具体的事。` });
  }

  /* 6. 正面来源 */
  const posTg = dist(s.list.filter(r => isPos(r.e)), r => r.tg).map(([k, v]) => ({ n: v, name: facetName(k) }));
  if (posTg[0] && posTg[0].n >= 2) {
    out.push({ ic: '🌱', t: `你的好情绪里有 <b>${posTg[0].n}</b> 次和 <i>${posTg[0].name}</i> 有关。这是你的<b>能量来源</b>——如果最近状态差，可以主动多做一点这件事，它比硬扛更有效。` });
  }

  /* 7. 干预有效性（闭环） */
  if (s.methodRank.length && s.methodRank[0].n >= 2) {
    const m = s.methodRank[0];
    out.push({ ic: '🛠', t: `在你自己试过的调节方式里，<i>${m.name}</i> 之后情绪平均回升 <b>${m.avg.toFixed(1)}</b> 分（${m.n} 次），是目前对你最有效的。以后状态不好的时候，可以先从它开始。` });
  }

  return out.slice(0, 5);
}

/* ---------- 方案匹配（按情绪 + 唤醒度） ---------- */
function matchMethods(emotionKey, intensity, limit = 6) {
  const cat = catOf(emotionKey) || { key: 'sad' };
  /* 正面与中性都走「保持」：状态不差时不需要干预，需要的是留住它、或者把模糊的感受看清 */
  const keep = isPos(emotionKey) || isNeu(emotionKey);
  const scored = METHODS.map(m => {
    let sc = 0;
    if (keep) {
      /* 状态好的时候不需要「干预」，需要的是「留住」 */
      sc = m.for.includes('pos') ? 70 : 3;
    } else {
      if (m.for.includes(cat.key)) sc += 60;
      if (intensity >= m.lv[0] && intensity <= m.lv[1]) sc += 25;
      else sc -= Math.min(20, (Math.min(Math.abs(intensity - m.lv[0]), Math.abs(intensity - m.lv[1]))) * 4);
    }
    if (m.dur <= 5) sc += 6;                       // 低门槛优先
    if (m.anim) sc += 4;
    return { m, sc };
  }).sort((a, b) => b.sc - a.sc);
  return scored.slice(0, limit).map(x => x.m);
}

/* ---------- 体验数据（仅演示，可一键清除） ---------- */
function genDemoData() {
  const out = [];
  const now = new Date();
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  for (let d = 29; d >= 0; d--) {
    const day = new Date(now.getTime() - d * DAY);
    const dow = day.getDay();
    const weekend = dow === 0 || dow === 6;
    const count = weekend ? rnd(1, 2) : rnd(1, 3);
    for (let k = 0; k < count; k++) {
      const bucket = pick(['morning', 'noon', 'afternoon', 'night', 'night']);   // 深夜加权，贴合真实
      if (weekend && Math.random() < .35) continue;
      const src = pick(DEMO_POOL[bucket]);
      if (!catOf(src.e)) continue;                       // 情绪 key 必须能被识别
      const h = { morning: rnd(6, 8), noon: rnd(9, 13), afternoon: rnd(14, 19), night: rnd(22, 26) }[bucket];
      const ts = startOfDay(day.getTime()) + (h % 24) * 3600000 + rnd(0, 59) * 60000;
      if (ts > Date.now()) continue;
      const okTg = src.tg.filter(k => facetOf(k));      // 防止误用分组 key 或拼错
      const okBd = src.bd.filter(k => BODY_MAP[k]);
      const rec = {
        id: 'demo_' + d + '_' + k, ts,
        e: src.e, c: catOf(src.e).key, i: rnd(src.i[0], src.i[1]),
        tg: okTg.slice(0, rnd(1, Math.max(1, okTg.length))),
        bd: okBd.slice(),
        n: src.n,
        demo: true
      };
      /* 部分记录带上干预反馈，形成效果闭环 */
      if (isNeg(rec.e) && rec.i >= 5 && Math.random() < .45) {
        const ms = matchMethods(rec.e, rec.i, 8);
        const m = pick(ms);
        const delta = rnd(1, 4);
        rec.relief = { id: m.id, before: rec.i, after: Math.max(1, rec.i - delta), delta, ts: ts + 12 * 60000 };
      }
      out.push(rec);
    }
  }
  return out.sort((a, b) => a.ts - b.ts);
}
