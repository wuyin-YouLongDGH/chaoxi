/* ============================================================
   潮汐 Tide · 视图与交互
   ============================================================ */

const state = {
  tab: 'record',
  records: [],
  draft: { c: null, e: null, i: 5, tg: [], bd: [], n: '' },
  careEmo: null,
  careI: null,          // null = 跟随最近一次记录的强度；用户动过滑杆后以此为准
  open: new Set(),
  openRec: new Set(),
  diaryFilter: 'all',
  timers: [],
  careTimer: null,
  pendingRelief: null
};

const WELCOME_KEY = 'tide.welcomed.v1';
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

const persist = () => Store.save(state.records);
const clearTimers = () => { state.timers.forEach(t => { clearTimeout(t); clearInterval(t); }); state.timers = []; };
const iWord = v => v <= 2 ? '很轻微' : v <= 4 ? '有一点' : v <= 6 ? '比较明显' : v <= 8 ? '很强' : '非常强烈';

/* ---------------- Toast ---------------- */
let toastTimer;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---------------- Sheet ---------------- */
function openSheet(html, cls = '') {
  const root = $('#sheetRoot'), sheet = $('#sheet');
  sheet.className = 'sheet ' + cls;
  sheet.innerHTML = `<div class="sheet-grip"></div>` + html;
  sheet.scrollTop = 0;
  root.classList.add('open'); root.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => root.classList.add('show'));
}
function closeSheet() {
  const root = $('#sheetRoot');
  root.classList.remove('show');
  clearTimers();
  setTimeout(() => { root.classList.remove('open'); $('#sheet').innerHTML = ''; }, 380);
}

/* ---------------- 文案 ---------------- */
function empathy(rec) {
  const c = catOf(rec.e) || {};
  const tone = toneOf(rec.e);
  if (tone === 'pos') {
    return { e: '🌤', l: '记下了，这是个好时刻。', s: '好情绪也值得被记录——它以后会告诉你，什么在真的托住你。' };
  }
  if (tone === 'neutral') {
    return { e: '◍', l: '说不清，也没关系。', s: '不是每个时刻都有明确的名字。先把它扔进这里，它以后可能会自己变清楚。' };
  }
  const map = {
    sad:     { e: '🌧', l: '这会儿不太好受吧。', s: '不用急着让自己好起来。先把它放在这儿，我们已经记下了。' },
    fear:    { e: '🌀', l: '脑子里是不是还在转。', s: '焦虑通常指向一件还没发生的事。我们先做一件让身体安静下来的小事。' },
    anger:   { e: '⚡', l: '这股气是有道理的。', s: '生气说明你在意的东西被碰到了。先让它有出口，再谈怎么办。' },
    disgust: { e: '🌫', l: '听起来你已经很累了。', s: '对自己失望的时候，最不需要的就是再骂自己一句。' },
    calm:    { e: '◍', l: '嗯，这样挺好的。', s: '平静也是值得留意的状态，它说明此刻你是安全的。' }
  };
  const base = map[c.key] || map.sad;
  if (rec.i >= 8) base.s = '这次强度不低（' + rec.i + '/10）。先不解决任何事，只做一件让身体缓下来的事就好。';
  return base;
}

/* ---------------- 顶栏 ---------------- */
function renderTop() {
  $('#topbar').innerHTML = `
    <div class="brand">
      <span class="brand-mark">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M4 20c3.2-4.4 5.4-4.4 8.6 0s5.4 4.4 8.6 0 4.2-4.4 6.4-1.2"
                stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
          <circle cx="16" cy="11" r="3" fill="#F0C26B"/>
        </svg>
      </span>
      <span class="brand-txt">
        <span class="brand-name">潮汐</span>
        <span class="brand-sub">情绪日记 · 自我关怀</span>
      </span>
    </div>
    <button class="icon-btn urgent" data-act="emergency" title="情绪急救" aria-label="情绪急救">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">
        <path d="M12 21s-7.5-4.7-9.3-9A5.3 5.3 0 0 1 12 6.2 5.3 5.3 0 0 1 21.3 12c-1.8 4.3-9.3 9-9.3 9z"/>
        <path d="M12 9v4M12 16h.01"/>
      </svg>
    </button>`;
}

/* ---------------- 底部导航 ---------------- */
const TABS = [
  { k: 'record',   n: '记录', svg: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>' },
  { k: 'diary',    n: '日记', svg: '<circle cx="4.6" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.6" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.6" cy="18" r="1.1" fill="currentColor" stroke="none"/><path d="M9.5 6h11M9.5 12h11M9.5 18h7"/>' },
  { k: 'insights', n: '洞察', svg: '<path d="M3 3v18h18"/><path d="M7 14l3.5-4 3 3L20 6"/>' },
  { k: 'care',     n: '关怀', svg: '<path d="M12 21s-7.5-4.7-9.3-9A5.3 5.3 0 0 1 12 6.2 5.3 5.3 0 0 1 21.3 12c-1.8 4.3-9.3 9-9.3 9z"/>' },
  { k: 'me',       n: '我的', svg: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>' }
];
function renderTabs() {
  $('#tabbar').innerHTML = TABS.map(t => `
    <button class="tab ${state.tab === t.k ? 'on' : ''}" data-act="tab" data-tab="${t.k}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${t.svg}</svg>
      <span>${t.n}</span>
    </button>`).join('');
}

/* ============================================================
   视图一：记录
   ============================================================ */
/* 情绪极性决定用哪套标签库；切换情绪后要剔掉不属于新标签库的已选标签，
   否则会出现"选了『开心』却挂着『睡眠不足』"这种矛盾组合。 */
function pruneDraftTags() {
  const keys = facetKeys(state.draft.e);
  state.draft.tg = state.draft.tg.filter(k => keys.has(k));
}

function renderRecord() {
  const d = state.draft;
  const selCat = d.c ? EMO_MAP[d.c] : null;
  const selEmo = d.e ? EMO_MAP[d.e] : null;
  const h = new Date().getHours();
  const greet = h < 6 ? '还没睡' : h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : h < 23 ? '晚上好' : '夜深了';
  const note = DAILY_NOTES[new Date().getDay()];

  return `
  <div class="hello fade-in">
    <div class="hello-h">${greet}，此刻感觉<em>怎么样</em>？</div>
    <div class="hello-p">不用组织语言，点一下就行 · 大约 30 秒</div>
  </div>

  <button class="tip-bar fade-in" data-act="about">
    <span class="tb-ic">✦</span>
    <span class="tb-tx">
      <span class="tb-t">这个产品为什么这么设计？</span>
      <span class="tb-d">4 个设计决策，30 秒看完</span>
    </span>
    <span class="tb-ar">›</span>
  </button>

  <div class="card fade-in">
    <div class="card-h"><span class="card-t">1 · 选择情绪</span><span class="card-x">${d.c ? '已选' : '点一下就好'}</span></div>
    <div class="emo-grid">
      ${EMOTIONS.map(c => `
        <button class="emo-cell ${d.c === c.key ? 'on' : ''}" data-act="pick-cat" data-c="${c.key}"
                style="color:${c.color};${d.c === c.key ? `background:${c.soft};border-color:${c.color}` : ''}">
          <span class="ic" style="background:${c.soft};color:${c.color}">${c.icon}</span>
          <span class="nm">${c.name}</span>
        </button>`).join('')}
    </div>

    ${selCat ? `
      <div class="divider"></div>
      <div class="card-h"><span class="card-t">再具体一点</span><span class="card-x">选一个最贴近的</span></div>
      <div class="chips">
        ${selCat.items.map(i => `
          <button class="chip ${d.e === i.key ? 'on' : ''}" data-act="pick-emo" data-e="${i.key}">${i.name}</button>`).join('')}
      </div>` : ''}
  </div>

  ${selEmo ? `
  <div class="card fade-in">
    <div class="card-h"><span class="card-t">2 · 强度</span><span class="card-x">1 轻微 · 10 极强</span></div>
    <div class="inten-head">
      <span class="inten-val" id="intenVal" style="color:${selCat.color}">${d.i}</span>
      <span class="inten-unit">/ 10</span>
      <span class="inten-word" id="intenWord" style="background:${selCat.soft};color:${selCat.color}">${iWord(d.i)}</span>
    </div>
    <input type="range" min="1" max="10" step="1" value="${d.i}" data-act="intensity">
    <div class="inten-scale"><span>1</span><span>5</span><span>10</span></div>
  </div>

  <div class="card fade-in">
    <div class="card-h">
      <span class="card-t">3 · ${facetPool(d.e) === SPARKS ? '什么让你状态好' : '是什么引起的'}</span>
      <span class="card-x">可多选 · 可不选</span>
    </div>
    ${facetPool(d.e).map(g => `
      <div class="trig-group">
        <div class="trig-gt">${g.group}</div>
        <div class="chips">
          ${g.items.map(i => `<button class="chip sm ${d.tg.includes(i.key) ? 'on' : ''}" data-act="tog-trig" data-t="${i.key}">${i.name}</button>`).join('')}
        </div>
      </div>`).join('')}
  </div>

  <div class="card fade-in">
    <div class="card-h"><span class="card-t">4 · 身体的反应</span><span class="card-x">可多选</span></div>
    <div class="chips">
      ${BODY_SIGNS.map(b => `<button class="chip sm ${d.bd.includes(b.key) ? 'on' : ''}" data-act="tog-body" data-b="${b.key}">${b.name}</button>`).join('')}
    </div>
  </div>

  <div class="card fade-in">
    <div class="card-h"><span class="card-t">5 · 想说点什么吗</span><span class="card-x">不想写就跳过</span></div>
    <textarea rows="3" data-act="note" placeholder="不用写完整，几个词也行……">${esc(d.n)}</textarea>
  </div>` : ''}

  <button class="btn btn-primary" data-act="save-rec" ${selEmo ? '' : 'disabled'}>
    ${selEmo ? '记下这一刻' : '先选一个情绪'}
  </button>

  <div class="card tight fade-in" style="background:linear-gradient(135deg,#F4F6FC,#FBF7F2);border-color:#E7EAF4">
    <div class="row" style="align-items:flex-start;gap:10px">
      <span style="font-size:17px">🕊</span>
      <div>
        <div style="font-size:13px;font-weight:640;margin-bottom:3px">${note.t}</div>
        <div style="font-size:12.2px;color:var(--ink-2);line-height:1.7">${note.d}</div>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   视图二：日记（历史记录时间线）
   ============================================================ */
const WEEK_CN = '日一二三四五六';
const hm = ts => { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function dayLabel(ts) {
  const t = startOfDay(ts), today = startOfDay(Date.now());
  const d = new Date(ts), w = '周' + WEEK_CN[d.getDay()];
  if (t === today) return '今天 · ' + w;
  if (t === today - DAY) return '昨天 · ' + w;
  const sameYear = new Date(today).getFullYear() === d.getFullYear();
  return (sameYear ? '' : d.getFullYear() + '年') + (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + w;
}

function recCard(r) {
  const c = catOf(r.e) || {}, em = EMO_MAP[r.e] || {};
  const on = state.openRec.has(r.id);
  const tags = r.tg.filter(t => facetOf(t));
  return `
  <div class="rec">
    <span class="rec-bar" style="background:${c.color || '#DCD6CD'}"></span>
    <div class="rec-main">
      <button class="rec-head" data-act="rec-toggle" data-id="${r.id}">
        <span class="rec-top">
          <span class="rec-emo" style="color:${c.color}">${esc(em.name || '—')}</span>
          <span class="rec-i" style="background:${c.soft};color:${c.color}">${r.i}</span>
          ${r.demo ? '<span class="rec-i" style="background:#F3EFE9;color:#A09A92">示例</span>' : ''}
          <span class="rec-time">${hm(r.ts)}</span>
        </span>
        ${tags.length ? `<span class="rec-tags">${tags.map(t => `<span>${esc(facetName(t))}</span>`).join('')}</span>` : ''}
      </button>
      ${on ? `
        ${r.bd.length ? `<div class="rec-more"><b>身体反应：</b>${r.bd.map(b => esc((BODY_MAP[b] || {}).name || '')).filter(Boolean).join('、')}</div>` : ''}
        ${r.n ? `<div class="rec-note">${esc(r.n)}</div>` : ''}
        ${r.relief ? `<div class="rec-relief">做过「${esc((METHOD_MAP[r.relief.id] || {}).name || '')}」后，强度 ${r.relief.before} → ${r.relief.after}（${r.relief.delta > 0 ? '降了 ' + r.relief.delta : '没有变化'}）</div>` : ''}
        <button class="rec-del" data-act="rec-del" data-id="${r.id}">删除这条</button>
      ` : `<div class="rec-more" style="color:var(--ink-3);font-size:11.5px;margin-top:7px">点击展开</div>`}
    </div>
  </div>`;
}

function renderDiary() {
  const s = calcStats(state.records);
  if (!state.records.length) {
    return `
    <div class="hello fade-in"><div class="hello-h">日记</div>
      <div class="hello-p">这里会按时间倒序排好你的每一条记录</div></div>
    <div class="card"><div class="empty">
      <div class="empty-ico">📓</div>
      <div class="empty-t">还没有记录</div>
      <div class="empty-d">记下第一条之后，这里会变成一条能回看的时间线——你能翻回某个具体的下午，当时发生了什么、身体是什么反应。</div>
      <button class="btn btn-primary btn-sm" data-act="tab-jump" data-tab="record">去记一条</button>
    </div></div>`;
  }

  const f = state.diaryFilter;
  let list = [...state.records].sort((a, b) => b.ts - a.ts);
  if (f === 'neg') list = list.filter(r => isNeg(r.e));
  if (f === 'neu') list = list.filter(r => isNeu(r.e));
  if (f === 'pos') list = list.filter(r => isPos(r.e));

  const groups = []; let cur = null;
  list.forEach(r => {
    const k = dayKey(r.ts);
    if (!cur || cur.k !== k) { cur = { k, ts: r.ts, items: [] }; groups.push(cur); }
    cur.items.push(r);
  });

  return `
  <div class="hello fade-in">
    <div class="hello-h">情绪<em>日记</em></div>
    <div class="hello-p">共 ${s.total} 条 · 点任意一条展开详情</div>
  </div>

  <div class="kpis fade-in">
    <div class="kpi"><div class="kpi-n">${s.total}<small>条</small></div><div class="kpi-l">全部记录</div></div>
    <div class="kpi"><div class="kpi-n">${s.streak}<small>天</small></div><div class="kpi-l">连续记录</div></div>
    <div class="kpi"><div class="kpi-n">${s.negAll.length}</div><div class="kpi-l">负面记录</div></div>
  </div>

  <div class="chips fade-in">
    ${[['all', '全部'], ['neg', '负面'], ['neu', '中性'], ['pos', '正面']].map(x =>
      `<button class="chip sm ${f === x[0] ? 'on' : ''}" data-act="diary-filter" data-f="${x[0]}">${x[1]}</button>`).join('')}
  </div>

  ${groups.length ? groups.map(g => `
    <div class="day">
      <div class="day-label">${dayLabel(g.ts)} <em>${g.items.length} 条</em></div>
      ${g.items.map(recCard).join('')}
    </div>`).join('') : `
    <div class="card"><div class="empty">
      <div class="empty-ico">◍</div>
      <div class="empty-t">这个筛选下没有记录</div>
      <div class="empty-d">换个筛选条件看看。</div>
    </div></div>`}

  <div class="card tight" style="background:var(--surface-2);border-color:var(--line)">
    <div class="card-x" style="line-height:1.78">
      这些记录只保存在当前浏览器里。你可以随时导出成 JSON 带走——如果哪天想和咨询师聊聊，把这份记录给他看，比自己回忆准确得多。
    </div>
  </div>`;
}

/* ============================================================
   视图三：洞察
   ============================================================ */
function renderInsights() {
  const s = calcStats(state.records);
  if (s.total < 3) {
    return `
    <div class="hello"><div class="hello-h">洞察</div>
      <div class="hello-p">记录满 3 条后，这里会开始说话</div></div>
    <div class="card">
      <div class="empty">
        <div class="empty-ico">📊</div>
        <div class="empty-t">还没有足够的数据</div>
        <div class="empty-d">情绪日记的价值不在「记」，而在「看见模式」——什么在反复触发你、哪个时段最危险、哪种方式对你真的有用。<br>先去记几条，或直接用体验数据看看它会变成什么样。</div>
        <button class="btn btn-ghost btn-sm" data-act="demo">一键载入 30 天体验数据</button>
      </div>
    </div>`;
  }

  const insights = buildInsights(s);
  const maxTrig = Math.max(1, ...s.trigNeg.slice(0, 6).map(t => t.n));
  const maxHour = Math.max(1, ...s.hours.map(h => h.total));

  /* 环形图 */
  const totalCat = s.byCat.reduce((a, c) => a + c.n, 0) || 1;
  let acc = 0; const R = 42, C = 2 * Math.PI * R;
  const arcs = s.byCat.map(c => {
    const frac = c.n / totalCat;
    const seg = `<circle cx="56" cy="56" r="${R}" fill="none" stroke="${c.color}" stroke-width="15"
      stroke-dasharray="${(frac * C - 2).toFixed(2)} ${C}" stroke-dashoffset="${(-acc * C).toFixed(2)}"
      transform="rotate(-90 56 56)" stroke-linecap="butt"/>`;
    acc += frac; return seg;
  }).join('');

  /* 情绪曲线 */
  const W = 300, H = 120, pad = 8;
  const pts = s.series.map((d, i) => ({
    x: pad + i * (W - pad * 2) / 13,
    y: d.avg === null ? null : H / 2 - (Math.max(-10, Math.min(10, d.avg)) / 10) * (H / 2 - 14),
    d
  }));
  const segs = []; let cur = [];
  pts.forEach(p => { if (p.y === null) { if (cur.length > 1) segs.push(cur); cur = []; } else cur.push(p); });
  if (cur.length > 1) segs.push(cur);
  const paths = segs.map(sg => `<path d="M${sg.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}"
      fill="none" stroke="#8892BC" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const dots = pts.filter(p => p.y !== null).map(p =>
    `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.4"
       fill="${p.d.avg >= 0 ? '#4F9E86' : '#C4685A'}" stroke="#fff" stroke-width="1.6"/>`).join('');

  /* 热力图 */
  const heatHtml = s.heat.map(c => {
    if (c.future) return `<div class="heat-c empty"></div>`;
    if (!c.count) return `<div class="heat-c" title="无记录"></div>`;
    const op = (0.32 + Math.min(0.68, c.avgI / 10 * 0.68)).toFixed(2);
    return `<div class="heat-c" style="background:${c.color};opacity:${op}"
      title="${dayKey(c.ds)}：${c.count} 条记录"></div>`;
  }).join('');

  return `
  <div class="hello fade-in">
    <div class="hello-h">你的情绪<em>模式</em></div>
    <div class="hello-p">基于全部 ${s.total} 条记录自动归因</div>
  </div>

  <div class="kpis fade-in">
    <div class="kpi"><div class="kpi-n">${s.total}<small>条</small></div><div class="kpi-l">累计记录</div></div>
    <div class="kpi"><div class="kpi-n">${s.streak}<small>天</small></div><div class="kpi-l">连续记录</div></div>
    <div class="kpi"><div class="kpi-n" style="color:${s.negRatio7 > 60 ? '#C4685A' : '#4F9E86'}">${s.negRatio7}<small>%</small></div><div class="kpi-l">近 7 天负面占比</div></div>
  </div>

  ${insights.length ? `
  <div class="card fade-in">
    <div class="card-h"><span class="card-t">✦ 对话式洞察</span><span class="card-x">自动生成</span></div>
    ${insights.map(i => `
      <div class="insight">
        <span class="ib">${i.ic}</span>
        <div class="itx">${i.t}</div>
      </div>`).join('')}
  </div>` : ''}

  <button class="tip-bar fade-in" data-act="about">
    <span class="tb-ic">◎</span>
    <span class="tb-tx">
      <span class="tb-t">这些结论是怎么算出来的？</span>
      <span class="tb-d">推荐逻辑与设计取舍</span>
    </span>
    <span class="tb-ar">›</span>
  </button>

  <div class="card fade-in">
    <div class="card-h"><span class="card-t">情绪日历</span><span class="card-x">近 8 周 · 颜色深浅 = 强度</span></div>
    <div class="heat-wrap">
      <div class="heat-days"><span>一</span><span>三</span><span>五</span><span>日</span></div>
      <div class="heat-grid">${heatHtml}</div>
    </div>
    <div class="row" style="margin-top:12px;flex-wrap:wrap;gap:9px">
      ${EMOTIONS.map(c => `<span class="row" style="gap:4px;font-size:10.5px;color:var(--ink-3)">
        <i class="legend-d" style="background:${c.color}"></i>${c.name}</span>`).join('')}
    </div>
  </div>

  <div class="card fade-in">
    <div class="card-h"><span class="card-t">触发因素排行</span><span class="card-x">只看负面情绪</span></div>
    ${s.trigNeg.length ? `<div class="rank">
      ${s.trigNeg.slice(0, 6).map(t => `
        <div class="rank-i">
          <span class="rank-n" title="${esc(t.group)}">${esc(t.name)}</span>
          <span class="rank-bar"><i class="rank-fill" style="width:${(t.n / maxTrig * 100).toFixed(0)}%;background:linear-gradient(90deg,#C4685A,#E0A03C)"></i></span>
          <span class="rank-v">${t.n}</span>
        </div>`).join('')}
    </div>` : `<div class="card-x">还没有带标签的负面记录</div>`}
    <div class="divider"></div>
    <div class="card-h"><span class="card-t">正向来源</span><span class="card-x">好情绪和什么有关</span></div>
    ${(() => {
      const pos = dist(s.list.filter(r => isPos(r.e)), r => r.tg)
        .map(([k, v]) => ({ n: v, name: facetName(k) }));
      return pos.length ? `<div class="rank">${pos.slice(0, 4).map(t => `
        <div class="rank-i">
          <span class="rank-n">${esc(t.name)}</span>
          <span class="rank-bar"><i class="rank-fill" style="width:${(t.n / Math.max(1, pos[0].n) * 100).toFixed(0)}%;background:linear-gradient(90deg,#4F9E86,#8FC7B4)"></i></span>
          <span class="rank-v">${t.n}</span>
        </div>`).join('')}</div>` : `<div class="card-x">暂无</div>`;
    })()}
  </div>

  <div class="card fade-in">
    <div class="card-h"><span class="card-t">一天里的情绪节律</span><span class="card-x">柱高 = 记录量 · 红 = 负面</span></div>
    <div class="hours">
      ${s.hours.map(h => `
        <div class="hour-col">
          <div class="hour-stack">
            ${h.total - h.neg > 0 ? `<i class="hour-seg" style="height:${((h.total - h.neg) / maxHour * 100).toFixed(0)}%;background:#BFD4CB"></i>` : ''}
            ${h.neg > 0 ? `<i class="hour-seg" style="height:${(h.neg / maxHour * 100).toFixed(0)}%;background:#E5A79A"></i>` : ''}
            ${h.total === 0 ? `<i class="hour-seg" style="height:3px;background:#EDE8E1"></i>` : ''}
          </div>
          <span class="hour-l">${h.name}</span>
        </div>`).join('')}
    </div>
  </div>

  <div class="card fade-in">
    <div class="card-h"><span class="card-t">情绪构成</span><span class="card-x">全部记录</span></div>
    <div class="donut-row">
      <svg class="donut" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r="42" fill="none" stroke="#F3EFE9" stroke-width="15"/>
        ${arcs}
        <text x="56" y="52" text-anchor="middle" font-size="19" font-weight="680" fill="#2A2825">${s.negAll.length}</text>
        <text x="56" y="68" text-anchor="middle" font-size="9.5" fill="#A09A92">次负面</text>
      </svg>
      <div class="legend">
        ${s.byCat.map(c => `
          <div class="legend-i">
            <i class="legend-d" style="background:${c.color}"></i>
            <span class="legend-n">${c.name}</span>
            <span class="legend-v">${Math.round(c.n / totalCat * 100)}%</span>
          </div>`).join('')}
      </div>
    </div>
  </div>

  <div class="card fade-in">
    <div class="card-h"><span class="card-t">近 14 天情绪曲线</span><span class="card-x">0 线以上为正</span></div>
    <div class="line-wrap">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" stroke="#EBE6DF" stroke-width="1" stroke-dasharray="4 4"/>
        ${paths}${dots}
      </svg>
    </div>
    <div class="row" style="justify-content:space-between;font-size:10px;color:var(--ink-3);margin-top:2px">
      <span>14 天前</span><span>${state.records.length ? '' : ''}今天</span>
    </div>
  </div>

  ${s.methodRank.length ? `
  <div class="card fade-in">
    <div class="card-h"><span class="card-t">什么方式对你真的有用</span><span class="card-x">做完后情绪回升</span></div>
    <div class="rank">
      ${s.methodRank.slice(0, 5).map(m => `
        <div class="rank-i">
          <span class="rank-n" style="width:104px">${esc(m.name)}</span>
          <span class="rank-bar"><i class="rank-fill" style="width:${Math.min(100, m.avg / 5 * 100).toFixed(0)}%;background:linear-gradient(90deg,#5B6FB5,#9AA9DB)"></i></span>
          <span class="rank-v">+${m.avg.toFixed(1)}</span>
        </div>`).join('')}
    </div>
    <div class="card-x" style="margin-top:11px;line-height:1.7">
      这是潮汐的闭环：每次做完调节后记一次感受，系统就会慢慢知道——<b style="color:var(--ink-2)">哪种方法对「你」有效</b>，而不是对所有人生效。
    </div>
  </div>` : ''}`;
}

/* ============================================================
   视图三：关怀
   ============================================================ */
function careCtx() {
  const last = state.records.length ? [...state.records].sort((a, b) => b.ts - a.ts)[0] : null;
  const emoKey = state.careEmo || (last ? last.e : 'anxious');
  /* 优先级: 用户手动拖过滑杆 > 最近一次记录的强度 > 默认 6 */
  const inten = state.careI != null ? state.careI : (last ? last.i : 6);
  return { last, emoKey, inten, cat: catOf(emoKey) || EMO_MAP.anxious };
}

const METHOD_BADGE = {
  呼吸: ['🫁', '#EDF0FA'], 冥想: ['🧘', '#E9F2EE'], 运动: ['🏃', '#FBF0E4'], 音乐: ['🎧', '#EFEAF8'],
  书写: ['✎', '#FDF0EC'], 感官: ['🖐', '#E8F1F6'], 连接: ['💬', '#F0F5EA'], 保持: ['🌿', '#EAF5EC']
};

/* 注意: 方案卡不加 fade-in——局部更新时重播入场动画会造成"整页刷新"的错觉 */
function methodCard(m, idx) {
  const on = state.open.has(m.id);
  const badge = METHOD_BADGE[m.cat] || ['○', '#F3EFE9'];
  return `
  <div class="method">
    <button class="m-top" data-act="tog-method" data-id="${m.id}" style="width:100%;text-align:left">
      <span class="m-badge" style="background:${badge[1]}">${badge[0]}</span>
      <span class="m-main">
        <span class="m-name">${esc(m.name)}
          ${idx === 0 ? '<span class="m-tag hot">最匹配</span>' : ''}
          ${m.anim ? '<span class="m-tag">可引导</span>' : ''}
        </span>
        <span class="m-meta">${m.cat} · 约 ${m.dur} 分钟 · 适合 ${m.for.map(k => (EMO_MAP[k] || {}).name).join(' / ')}</span>
      </span>
      <span style="color:var(--ink-3);font-size:13px;transition:.3s;transform:rotate(${on ? 90 : 0}deg)">›</span>
    </button>
    ${on ? `
      <div class="m-why"><b>为什么有用：</b>${esc(m.why)}</div>
      <div class="m-steps">
        ${m.steps.map((st, i) => `<div class="m-step"><i>${i + 1}</i><span>${esc(st)}</span></div>`).join('')}
        <button class="btn ${m.anim ? 'btn-primary' : 'btn-ghost'}" style="margin-top:12px"
                data-act="start-method" data-id="${m.id}">
          ${m.anim ? '开始呼吸引导' : '开始 · 跟着做就好'}
        </button>
      </div>` : ''}
  </div>`;
}

function careListHtml(emoKey, inten) {
  const list = matchMethods(emoKey, inten, 6);
  return `
  <div class="sec-label">为你匹配的 ${list.length} 个方案</div>
  ${list.map(methodCard).join('')}
  <div class="card tight" style="background:linear-gradient(135deg,#F4F6FC,#FBF7F2);border-color:#E7EAF4;margin-top:2px">
    <div style="font-size:12.4px;color:var(--ink-2);line-height:1.78">
      <b style="color:var(--ink)">关于推荐逻辑：</b>潮汐不用「随机给你推个冥想」。它按<b>情绪类型 + 唤醒度</b>匹配——
      高唤醒的负面情绪（焦虑、愤怒、恐慌）先降生理唤醒，低唤醒的（低落、无力、自我厌恶）先激活行为和联结。
      方向反了，会越做越糟。
    </div>
  </div>`;
}

/* 只换列表区域的内容，不重建整页 —— 拖动强度时滑杆 DOM 必须原封不动 */
function updateCareList() {
  const box = $('#careList');
  if (!box) return;
  const { emoKey, inten } = careCtx();
  box.innerHTML = careListHtml(emoKey, inten);
}

function renderCare() {
  const { last, emoKey, inten, cat } = careCtx();

  return `
  <div class="hello fade-in">
    <div class="hello-h">现在<em>需要</em>点什么？</div>
    <div class="hello-p">按你此刻的情绪和强度匹配 · 都能在 15 分钟内做完</div>
  </div>

  <div class="card fade-in">
    <div class="card-h"><span class="card-t">当前状态</span><span class="card-x">${state.careEmo ? '手动选择' : (last ? '取自最近一次记录' : '默认')}</span></div>
    <div class="chips">
      ${EMOTIONS.map(c => `<button class="chip sm ${cat.key === c.key ? 'on' : ''}"
        data-act="care-cat" data-c="${c.key}"
        style="${cat.key === c.key ? `background:${c.color};border-color:${c.color}` : ''}">${c.icon} ${c.name}</button>`).join('')}
    </div>
    ${cat.items ? `
    <div class="chips" style="margin-top:9px">
      ${cat.items.map(i => `<button class="chip sm ${emoKey === i.key ? 'on' : ''}" data-act="care-emo" data-e="${i.key}">${i.name}</button>`).join('')}
    </div>` : ''}
    <div class="divider"></div>
    <div class="inten-head">
      <span class="inten-val" id="careVal" style="color:${cat.color}">${inten}</span>
      <span class="inten-unit">/ 10 强度</span>
      <span class="inten-word" id="careWord" style="background:${cat.soft};color:${cat.color}">${
        inten <= 3 ? '轻度' : inten <= 6 ? '中度' : inten <= 8 ? '较强' : '很强'}</span>
    </div>
    <input type="range" min="1" max="10" step="1" value="${inten}" data-act="care-i">
    <div class="inten-scale"><span>1</span><span>5</span><span>10</span></div>
  </div>

  <div id="careList">${careListHtml(emoKey, inten)}</div>`;
}

/* ============================================================
   视图四：我的
   ============================================================ */
function renderMe() {
  const s = calcStats(state.records);
  return `
  <div class="hello fade-in">
    <div class="hello-h">我的</div>
    <div class="hello-p">数据只存在这台设备的浏览器里</div>
  </div>

  <div class="kpis fade-in">
    <div class="kpi"><div class="kpi-n">${s.total}</div><div class="kpi-l">条记录</div></div>
    <div class="kpi"><div class="kpi-n">${s.streak}</div><div class="kpi-l">连续天数</div></div>
    <div class="kpi"><div class="kpi-n">${s.avgI.toFixed(1)}</div><div class="kpi-l">平均强度</div></div>
  </div>

  <div class="card fade-in">
    <div class="card-h"><span class="card-t">数据</span></div>
    <button class="set-i" data-act="demo">
      <span class="set-ic">✦</span>
      <span class="set-t"><span class="set-n">载入 30 天体验数据</span>
        <span class="set-d">用于快速了解洞察页的完整形态，不影响真实记录</span></span>
      <span class="set-arrow">›</span>
    </button>
    <button class="set-i" data-act="export">
      <span class="set-ic">↓</span>
      <span class="set-t"><span class="set-n">导出全部记录</span>
        <span class="set-d">JSON 格式，可带走去和咨询师聊</span></span>
      <span class="set-arrow">›</span>
    </button>
    <button class="set-i" data-act="clear">
      <span class="set-ic" style="background:#FBE9E5;color:#B85A4C">⌫</span>
      <span class="set-t"><span class="set-n" style="color:#B85A4C">清空所有数据</span>
        <span class="set-d">不可恢复，请谨慎操作</span></span>
      <span class="set-arrow">›</span>
    </button>
  </div>

  <div class="card fade-in">
    <div class="card-h"><span class="card-t">关于潮汐</span><span class="card-x">v1.1</span></div>
    <div style="font-size:12.8px;color:var(--ink-2);line-height:1.82">
      潮汐解决的不是「没地方记日记」，而是三个更具体的问题：<b style="color:var(--ink)">说不清、记不下、不知道做什么</b>。
    </div>
    <button class="set-i" data-act="about">
      <span class="set-ic">✦</span>
      <span class="set-t"><span class="set-n">设计逻辑与取舍</span>
        <span class="set-d">4 个设计决策 · 推荐算法依据 · 后续规划</span></span>
      <span class="set-arrow">›</span>
    </button>
  </div>

  <div class="card tight fade-in">
    <div class="card-x" style="line-height:1.75">
      ⚠️ 潮汐是自助工具，不能替代专业帮助。如果持续两周以上情绪低落、影响睡眠与进食，或出现伤害自己的念头，
      请尽快联系学校心理中心或拨打 24 小时心理援助热线 <b style="color:var(--ink-2)">12356</b>。
    </div>
  </div>`;
}

/* ============================================================
   渲染总入口
   ============================================================ */
function render(resetScroll = false) {
  renderTop(); renderTabs();
  const v = $('#view');
  const html = { record: renderRecord, diary: renderDiary, insights: renderInsights, care: renderCare, me: renderMe }[state.tab]();
  v.innerHTML = html;
  if (resetScroll) window.scrollTo({ top: 0 });
}

/* ============================================================
   Sheet：记录反馈
   ============================================================ */
function showFeedback(rec) {
  const em = empathy(rec);
  const neg = isNeg(rec.e), neu = isNeu(rec.e);
  const recs = neg ? matchMethods(rec.e, rec.i, 3) : matchMethods(rec.e, rec.i, 2);
  openSheet(`
    <div class="fb-emoji pop">${em.e}</div>
    <div class="fb-line">${em.l}</div>
    <div class="fb-sub">${em.s}</div>
    <div class="btn-row">
      <button class="btn btn-ghost" data-act="close-sheet">先放着</button>
      <button class="btn btn-primary" data-act="fb-go" data-id="${recs[0] ? recs[0].id : ''}">
        ${neg ? '做点什么' : (neu ? '梳理一下' : '留住它')}
      </button>
    </div>
    ${neg ? `
      <div class="divider"></div>
      <div class="card-x" style="margin-bottom:10px">现在最省力的两个选择</div>
      ${recs.slice(0, 2).map(m => `
        <button class="set-i" data-act="start-method" data-id="${m.id}">
          <span class="set-ic">◷</span>
          <span class="set-t"><span class="set-n">${esc(m.name)}</span>
            <span class="set-d">约 ${m.dur} 分钟 · ${esc(m.cat)}</span></span>
          <span class="set-arrow">›</span>
        </button>`).join('')}
    ` : ''}
  `);
}

/* ============================================================
   Sheet：方案引导 + 呼吸动画
   ============================================================ */
const BREATH = {
  '478': { label: '4-7-8 呼吸', rounds: 4, phases: [['吸气', 4, 1.16], ['屏住', 7, 1.16], ['呼气', 8, 0.80]] },
  box:   { label: '方块呼吸',   rounds: 6, phases: [['吸气', 4, 1.16], ['停', 4, 1.16], ['呼气', 4, 0.80], ['停', 4, 0.80]] },
  sigh:  { label: '生理性叹息', rounds: 5, phases: [['吸一口', 2, 1.12], ['再吸一小口', 1, 1.26], ['长长呼出去', 6, 0.80]] }
};

function openMethod(id) {
  const m = METHOD_MAP[id]; if (!m) return;
  state.pendingRelief = id;
  const last = [...state.records].sort((a, b) => b.ts - a.ts)[0];
  const before = last ? last.i : 6;

  openSheet(`
    <div class="sheet-h">${esc(m.name)}</div>
    <div class="sheet-d">${esc(m.why)}</div>

    ${m.anim ? `
      <div class="breath-stage">
        <span class="breath-ring"></span>
        <span class="breath-core" id="breathCore"><span class="breath-num" id="breathNum">4</span></span>
      </div>
      <div class="breath-phase" id="breathPhase">准备好就开始</div>
      <div class="breath-count" id="breathCount">共 ${BREATH[m.anim].rounds} 轮</div>
      <button class="btn btn-primary" style="margin-top:16px" data-act="breath-toggle" data-anim="${m.anim}">
        开始引导
      </button>
    ` : `
      <div class="m-steps" style="padding:14px 0 0">
        ${m.steps.map((st, i) => `<div class="m-step"><i>${i + 1}</i><span>${esc(st)}</span></div>`).join('')}
      </div>
      <div class="card-x" style="margin:14px 0 6px">大概 ${m.dur} 分钟。不用做得标准，做完就算。</div>
    `}

    <div class="btn-row" style="margin-top:14px">
      <button class="btn btn-ghost" data-act="close-sheet">先不用</button>
      <button class="btn btn-warm" data-act="finish-method" data-id="${m.id}" data-before="${before}">
        我做完了
      </button>
    </div>
  `);
}

function runBreath(kind, btn) {
  const cfg = BREATH[kind]; if (!cfg) return;
  clearTimers();
  const core = $('#breathCore'), num = $('#breathNum'), ph = $('#breathPhase'), cnt = $('#breathCount');
  if (!core) return;
  btn.textContent = '进行中…'; btn.disabled = true;
  let pi = 0, round = 1;

  const step = () => {
    const [name, secs, scale] = cfg.phases[pi];
    ph.textContent = name;
    cnt.textContent = `第 ${round} / ${cfg.rounds} 轮`;
    core.style.transitionDuration = secs + 's';
    core.style.transform = `scale(${scale})`;
    let left = secs; num.textContent = left;
    const iv = setInterval(() => { left--; if (left > 0) num.textContent = left; }, 1000);
    state.timers.push(iv);
    const to = setTimeout(() => {
      clearInterval(iv);
      pi++;
      if (pi >= cfg.phases.length) {
        pi = 0; round++;
        if (round > cfg.rounds) {
          ph.textContent = '结束了'; num.textContent = '✓';
          core.style.transitionDuration = '1.2s'; core.style.transform = 'scale(1)';
          btn.textContent = '再来一轮'; btn.disabled = false;
          return;
        }
      }
      step();
    }, secs * 1000);
    state.timers.push(to);
  };
  step();
}

/* ============================================================
   Sheet：做完后打分（闭环）
   ============================================================ */
function openRate(id, before) {
  openSheet(`
    <div class="sheet-h">现在感觉怎么样？</div>
    <div class="sheet-d">刚才记录时是 ${before}/10。这一条会用来判断哪种方式对你真的有效——不用客气，没变化也照实填。</div>
    <div class="inten-head" style="margin-top:20px">
      <span class="inten-val" id="afterVal" style="color:var(--brand)">${Math.max(1, before - 2)}</span>
      <span class="inten-unit">/ 10</span>
      <span class="inten-word" style="background:var(--brand-soft);color:var(--brand-deep)">
        比刚才低 ${before - Math.max(1, before - 2)} 分</span>
    </div>
    <input type="range" min="1" max="10" step="1" value="${Math.max(1, before - 2)}" data-act="after-range" data-before="${before}">
    <div class="inten-scale"><span>1</span><span>5</span><span>10</span></div>
    <div class="btn-row" style="margin-top:18px">
      <button class="btn btn-ghost" data-act="close-sheet">跳过</button>
      <button class="btn btn-primary" data-act="save-relief" data-id="${id}" data-before="${before}">保存</button>
    </div>
  `);
}

/* ============================================================
   Sheet：情绪急救
   ============================================================ */
function openEmergency() {
  openSheet(`
    <div class="sheet-h">情绪急救</div>
    <div class="sheet-d">如果现在很难受，先不处理任何事，按顺序做完这 4 步。全程约 3 分钟。</div>
    <div class="m-steps" style="padding-top:14px">
      <div class="m-step"><i>1</i><span><b>把手放在胸口</b>，感受掌心的温度，心里说：我现在很难受，这是真的。</span></div>
      <div class="m-step"><i>2</i><span><b>做 3 次生理性叹息</b>：吸一口 → 再补吸一小口 → 长长呼出去。</span></div>
      <div class="m-step"><i>3</i><span><b>5-4-3-2-1 着陆</b>：说出看到的 5 样、摸到的 4 样、听到的 3 种、闻到的 2 种、尝到的 1 种。</span></div>
      <div class="m-step"><i>4</i><span><b>喝一杯温水</b>，慢慢喝完，再决定接下来做什么。</span></div>
    </div>
    <div class="btn-row" style="margin-top:16px">
      <button class="btn btn-ghost" data-act="close-sheet">关闭</button>
      <button class="btn btn-primary" data-act="start-method" data-id="sigh">带我呼吸</button>
    </div>
    <div class="divider"></div>
    <div class="card-x" style="line-height:1.75">
      如果这些念头持续存在，或你有伤害自己的冲动，请立刻联系信任的人，或拨打 24 小时心理援助热线
      <b style="color:var(--ink-2)">12356</b>。求助不是软弱，是止损。
    </div>
  `);
}

/* ============================================================
   全屏页面：设计逻辑（给评审者看的那一层）
   ============================================================ */
function openPage(title, html) {
  const root = $('#pageRoot'), body = $('#pageBody');
  body.innerHTML = `
    <div class="page-head">
      <button class="icon-btn" data-act="close-page" aria-label="返回">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <span style="font-size:14.5px;font-weight:650">${esc(title)}</span>
    </div>` + html;
  root.classList.add('open');
  root.setAttribute('aria-hidden', 'false');
  body.scrollTop = 0;
}
function closePage() {
  const root = $('#pageRoot');
  root.classList.remove('open');
  root.setAttribute('aria-hidden', 'true');
}

function openAbout() {
  const block = (n, t, d) => `
    <div class="about-block">
      <div class="about-row">
        <span class="about-num">${n}</span>
        <div style="flex:1;min-width:0">
          <div class="about-t">${t}</div>
          <div class="about-d">${d}</div>
        </div>
      </div>
    </div>`;

  openPage('设计逻辑', `
    <div class="about-hero">
      <h2>潮汐的设计逻辑</h2>
      <p>情绪会涨，也会退。你不必在浪里硬撑。<br>
         这个产品只做了四件事，但每一件都对应一个明确的判断。</p>
    </div>

    ${block(1, '把记录门槛压到 30 秒，而且可以全程不打字',
      '情绪最差的时候，恰恰是最没力气组织语言的时候。传统日记要求「先写出来」，等于把最需要帮助的人挡在门外。潮汐用的是<b>点选情绪 → 拉强度 → 点标签</b>，打字是可选项，不是必需项。')}

    ${block(2, '让记录产生反馈，而不是沉进抽屉',
      '只记录不分析，等于给自己加了一份作业。潮汐把每条记录拆成「情绪 + 强度 + 触发因素 + 身体信号 + 时段」五个维度，再自动归因成对话式洞察——你看到的是「<b>你的低谷集中在 22 点后，那是疲惫在说话</b>」，而不是一个冷冰冰的图。')}

    ${block(3, '推荐按「情绪 + 唤醒度」匹配，而不是按心情随机',
      '焦虑和低落需要的是<b>相反</b>的动作：高唤醒的负面情绪要先降生理唤醒（呼吸、冷刺激、发泄），低唤醒的负面情绪要先激活行为与联结（散步、晒太阳、给人发消息）。方向搞反，人会更糟。这就是为什么推荐不是随机抽一个冥想音频。')}

    ${block(4, '建立闭环：让系统学会「什么对你有效」',
      '每次做完调节后记一次强度变化，累积起来就能算出——<b>在你身上</b>，哪种方法平均回升最多。这是通用建议和个性化建议的分界线，也是「自我关怀」从一句口号变成一项能力的地方。')}

    <div class="about-block">
      <div class="about-t" style="margin-bottom:11px">两个刻意的取舍</div>
      <div class="about-d"><b>不做社交。</b>情绪记录一旦有观众，人就会开始表演。所以这里没有点赞、没有排行榜、没有分享按钮。</div>
      <div class="about-d"><b>不要手机号。</b>所有记录只存在这台设备的浏览器本地（localStorage），不上传服务器、不需要注册登录。情绪是最敏感的数据之一——一个情绪日记产品如果先问你要手机号，就已经输了一半。</div>
    </div>

    <div class="about-block">
      <div class="about-t" style="margin-bottom:11px">技术实现</div>
      <div class="about-d">纯静态站点，<b>零依赖、零构建</b>——没有框架、没有 CDN、没有后端。统计与归因全部在浏览器里完成，数据不离开你的设备。</div>
    </div>

    <div class="about-block">
      <div class="about-t" style="margin-bottom:11px">接下来会做什么</div>
      <div class="about-d"><b>① 记录时间可调。</b>现在只能记「此刻」，但真实场景多是晚上补记白天的事——这会让时段分析失真，所有人最后都变成「深夜最危险」，结论就假了。</div>
      <div class="about-d"><b>② 周报。</b>把闭环从「单次」拉长到「一周」：本周概览 + 触发因素 TOP3 + 哪种方法对你有效。</div>
      <div class="about-d"><b>③ 被动触发。</b>真正需要这个产品的人，往往状态差到不想打开任何 App。所以需要软回访——连续几天没记录时，先问一句「最近还好吗」，而不是催他打卡。</div>
    </div>

    <div class="about-quote" style="margin-top:14px">
      潮汐是自助工具，不能替代专业帮助。如果持续两周以上情绪低落、影响睡眠与进食，或出现伤害自己的念头，
      请尽快联系学校心理中心，或拨打 24 小时心理援助热线 <b>12356</b>。
    </div>
  `);
}

/* ============================================================
   首屏欢迎引导
   ============================================================ */
function showWelcome() {
  const root = $('#welcomeRoot'), card = $('#welcomeCard');
  card.innerHTML = `
    <span class="wc-mark">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M4 20c3.2-4.4 5.4-4.4 8.6 0s5.4 4.4 8.6 0 4.2-4.4 6.4-1.2"
              stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="16" cy="11" r="3" fill="#F0C26B"/>
      </svg>
    </span>
    <div class="wc-t">潮汐 · 情绪日记与自我关怀</div>
    <div class="wc-lead">情绪会涨，也会退。<br>你不必在浪里硬撑。</div>
    <div class="wc-points">
      <div class="wc-point"><i></i><span><b>30 秒记一次</b>　点选情绪、拉强度、点标签，可以全程不打字</span></div>
      <div class="wc-point"><i></i><span><b>看见触发模式</b>　自动归因出是什么在反复触发你、哪个时段最危险</span></div>
      <div class="wc-point"><i></i><span><b>知道做什么有用</b>　按情绪匹配调节方案，并记录哪种方式对你真的有效</span></div>
    </div>
    <div class="btn-row">
      <button class="btn btn-ghost" data-act="welcome-self">我自己记一条</button>
      <button class="btn btn-primary" data-act="welcome-demo">看完整演示</button>
    </div>
    <button class="btn btn-ghost" style="margin-top:9px" data-act="about">先看看设计逻辑</button>
    <div class="wc-foot">数据只保存在当前浏览器，不上传、不需要注册</div>
  `;
  root.classList.add('open');
  root.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => root.classList.add('show'));
}
function hideWelcome() {
  const root = $('#welcomeRoot');
  root.classList.remove('show');
  lsSet(WELCOME_KEY, '1');
  setTimeout(() => { root.classList.remove('open'); root.setAttribute('aria-hidden', 'true'); }, 380);
}

/* ============================================================
   事件分发
   ============================================================ */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act, d = state.draft;

  switch (a) {
    case 'tab':
    case 'tab-jump':
      state.tab = el.dataset.tab; render(true); break;

    case 'diary-filter':
      state.diaryFilter = el.dataset.f; render(); break;

    case 'rec-toggle': {
      const id = el.dataset.id;
      state.openRec.has(id) ? state.openRec.delete(id) : state.openRec.add(id);
      render(); break;
    }

    case 'rec-del': {
      const id = el.dataset.id;
      if (!state.records.some(r => r.id === id)) return;
      if (!confirm('删除这条记录？删除后无法恢复。')) return;
      state.records = state.records.filter(r => r.id !== id);
      state.openRec.delete(id);
      persist(); render(); toast('已删除');
      break;
    }

    case 'close-page': closePage(); break;

    case 'welcome-self':
      hideWelcome(); state.tab = 'record'; render(true);
      break;

    case 'welcome-demo': {
      if (state.records.some(r => !r.demo) &&
          !confirm('当前已有你自己的记录，继续会追加一批示例数据（可随时清空）。确定吗？')) return;
      state.records = state.records.concat(genDemoData());
      persist(); hideWelcome();
      state.tab = 'insights';
      setTimeout(() => render(true), 220);
      toast('已载入 30 天体验数据');
      break;
    }

    case 'pick-cat':
      d.c = el.dataset.c; d.e = null;
      if (EMO_MAP[d.c].items.length === 1) d.e = EMO_MAP[d.c].items[0].key;
      pruneDraftTags(); render(); break;

    case 'pick-emo':
      d.e = el.dataset.e; pruneDraftTags(); render(); break;

    case 'tog-trig': {
      const k = el.dataset.t, i = d.tg.indexOf(k);
      i < 0 ? d.tg.push(k) : d.tg.splice(i, 1); render(); break;
    }
    case 'tog-body': {
      const k = el.dataset.b, i = d.bd.indexOf(k);
      i < 0 ? d.bd.push(k) : d.bd.splice(i, 1); render(); break;
    }

    case 'save-rec': {
      if (!d.e) return;
      const rec = {
        id: 'r' + Date.now() + Math.random().toString(36).slice(2, 6),
        ts: Date.now(), e: d.e, c: (catOf(d.e) || {}).key, i: d.i,
        tg: [...d.tg], bd: [...d.bd], n: d.n.trim()
      };
      state.records.push(rec); persist();
      state.draft = { c: null, e: null, i: 5, tg: [], bd: [], n: '' };
      render(); showFeedback(rec);
      break;
    }

    case 'care-cat':
      state.careEmo = EMO_MAP[el.dataset.c].items[0].key; render(); break;
    case 'care-emo':
      state.careEmo = el.dataset.e; render(); break;

    case 'tog-method': {
      const id = el.dataset.id;
      state.open.has(id) ? state.open.delete(id) : state.open.add(id);
      updateCareList(); break;
    }

    case 'start-method': openMethod(el.dataset.id); break;
    case 'emergency': openEmergency(); break;
    case 'about': openAbout(); break;
    case 'close-sheet': closeSheet(); break;

    case 'fb-go': {
      const last = [...state.records].sort((a, b) => b.ts - a.ts)[0];
      if (!last) { closeSheet(); return; }
      closeSheet();
      setTimeout(() => {
        state.tab = 'care'; state.careEmo = last.e; state.careI = last.i; render(true);
        toast(isNeg(last.e) ? '已按你刚才的情绪匹配好方案' : '状态不差的时候，也值得被照顾');
      }, 300);
      break;
    }

    case 'breath-toggle':
      runBreath(el.dataset.anim, el); break;

    case 'finish-method':
      openRate(el.dataset.id, +el.dataset.before); break;

    case 'save-relief': {
      const id = el.dataset.id, before = +el.dataset.before;
      const after = +($('#afterVal') ? $('#afterVal').textContent : before);
      const target = [...state.records].sort((a, b) => b.ts - a.ts)[0];
      if (target) {
        target.relief = { id, before, after, delta: before - after, ts: Date.now() };
        persist();
      }
      closeSheet();
      toast(after < before ? `比刚才低 ${before - after} 分，已记下` : '已记下。这条数据同样有意义');
      break;
    }

    case 'demo': {
      const hasReal = state.records.some(r => !r.demo);
      if (hasReal && !confirm('当前已有真实记录，继续会追加体验数据（可随时清空）。确定吗？')) return;
      state.records = state.records.concat(genDemoData()); persist();
      state.tab = 'insights'; render(true); toast('已载入 30 天体验数据');
      break;
    }

    case 'export': {
      if (!state.records.length) { toast('还没有记录'); return; }
      const blob = new Blob([JSON.stringify(state.records, null, 2)], { type: 'application/json' });
      const a2 = document.createElement('a');
      a2.href = URL.createObjectURL(blob);
      a2.download = `潮汐-情绪记录-${dayKey(Date.now())}.json`;
      a2.click(); URL.revokeObjectURL(a2.href); toast('已导出');
      break;
    }

    case 'clear':
      if (!state.records.length) { toast('本来就是空的'); return; }
      if (confirm('将删除全部 ' + state.records.length + ' 条记录，且无法恢复。确定吗？')) {
        state.records = []; persist(); state.open.clear(); render(); toast('已清空');
      }
      break;
  }
});

/* 滑杆：拖动时只局部更新文字，松手后才重算方案（避免 DOM 重建打断拖动） */
document.addEventListener('input', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act;

  if (a === 'intensity') {
    const v = +el.value; state.draft.i = v;
    const c = catOf(state.draft.e) || {};
    const nv = $('#intenVal'), wd = $('#intenWord');
    if (nv) nv.textContent = v;
    if (wd) { wd.textContent = iWord(v); wd.style.background = c.soft; wd.style.color = c.color; }
  }

  if (a === 'care-i') {
    const v = +el.value; state.careI = v;
    const nv = $('#careVal'), wd = $('#careWord');
    if (nv) nv.textContent = v;
    if (wd) wd.textContent = v <= 3 ? '轻度' : v <= 6 ? '中度' : v <= 8 ? '较强' : '很强';
    /* 拖动过程中绝不重建 DOM：滑杆一旦被替换，拖动就断了，手感就像"页面被刷新"。
       停手 220ms 后只替换方案列表的内容。 */
    clearTimeout(state.careTimer);
    state.careTimer = setTimeout(updateCareList, 220);
  }

  if (a === 'note') state.draft.n = el.value;

  if (a === 'after-range') {
    const v = +el.value, before = +el.dataset.before;
    const val = $('#afterVal'); if (val) val.textContent = v;
    const word = el.parentElement.querySelector('.inten-word');
    if (word) word.textContent = v < before ? `比刚才低 ${before - v} 分`
      : v === before ? '和刚才差不多' : `比刚才高 ${v - before} 分`;
  }
});

/* 松手时立刻结算（不必等 debounce），同样只替换列表内容，不碰滑杆本身 */
document.addEventListener('change', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  if (el.dataset.act === 'care-i') { clearTimeout(state.careTimer); updateCareList(); }
});

/* 遮罩关闭 / ESC */
$('#sheetRoot').addEventListener('click', e => { if (e.target.dataset.close) closeSheet(); });
$('#welcomeRoot').addEventListener('click', e => { if (e.target === $('#welcomeRoot')) hideWelcome(); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const w = $('#welcomeRoot'), p = $('#pageRoot');
  if (w.classList.contains('open')) { hideWelcome(); return; }
  if (p.classList.contains('open')) { closePage(); return; }
  closeSheet();
});

/* ============================================================
   启动
   ============================================================ */
state.records = Store.load();
render();
if (!lsGet(WELCOME_KEY)) setTimeout(showWelcome, 420);
