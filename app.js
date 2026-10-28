(function(){
/* ---------- Dates ---------- */
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const TODAY=new Date();TODAY.setHours(0,0,0,0);
const TODAY_ISO=iso(TODAY);
const off=n=>{const d=new Date(TODAY);d.setDate(d.getDate()+n);return iso(d)};
const span=(a,b)=>Math.round((parse(b)-parse(a))/86400000)+1;
const fmt=(s,opt={})=>{const d=parse(s);const o={weekday:'short',day:'numeric',month:'short'};if(d.getFullYear()!==TODAY.getFullYear()||opt.year)o.year='numeric';return d.toLocaleDateString('en-GB',o)};
const fmtShort=s=>parse(s).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const range=(a,b)=>a===b?fmt(a):`${fmt(a)} → ${fmt(b)}`;
const rangeShort=(a,b)=>{if(a===b)return fmtShort(a);const A=parse(a),B=parse(b);return A.getMonth()===B.getMonth()?`${A.getDate()}–${fmtShort(b)}`:`${fmtShort(a)} – ${fmtShort(b)}`};
const HOUR=3600000;
const ago=t=>{const s=(Date.now()-t)/1000;if(s<60)return'Just now';const m=s/60;if(m<60)return`${Math.floor(m)} min ago`;const h=m/60;if(h<24)return`${Math.floor(h)} h ago`;const d=Math.floor(h/24);return d===1?'Yesterday':`${d} days ago`};
const dayAgo=s=>{const d=span(s,TODAY_ISO)-1;return d<=0?'today':d===1?'yesterday':`${d} days ago`};
const plural=(n,w)=>`${n} ${w}${n===1?'':'s'}`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cap=s=>s[0].toUpperCase()+s.slice(1);

/* ---------- Leave types ---------- */
const TYPES={
  annual:{label:'Annual leave',short:'Annual'},
  sick:{label:'Sick leave',short:'Sick'},
  family:{label:'Family care leave',short:'Family care'},
  childcare:{label:'Childcare leave',short:'Childcare'}
};
const tl=r=>TYPES[r.type].label.toLowerCase();
const SICK_BACKDATE=30;

/* ---------- Sample data (in memory only) ---------- */
const people=[
  {id:'maya',name:'Maya Lim',role:'Team lead'},
  {id:'daniel',name:'Daniel Tan',role:'Engineer'},
  {id:'priya',name:'Priya Nair',role:'Designer'},
  {id:'arjun',name:'Arjun Rao',role:'Engineer'},
  {id:'sofia',name:'Sofia Chen',role:'QA analyst'},
  {id:'weiling',name:'Wei Ling Goh',role:'Data analyst'}
];
const LEAD='maya';
const P=id=>people.find(p=>p.id===id);
const initials=id=>P(id).name.split(' ').map(w=>w[0]).slice(0,2).join('');
const first=id=>P(id).name.split(' ')[0];

let seq=1;
const mk=(who,type,applied,s,e,status,reason,decided)=>({id:'r'+(seq++),who,type,applied:off(applied),start:off(s),end:off(e),days:span(off(s),off(e)),status,reason,decided:decided==null?null:off(decided)});
const requests=[
  mk('priya','family',-14,-9,-8,'approved','Sister’s wedding',-12),
  mk('weiling','annual',-6,1,2,'approved','Moving house',-4),
  mk('daniel','annual',-10,6,10,'approved','Trip to Hokkaido',-7),
  mk('priya','annual',-3,8,12,'pending','Family trip to Penang'),
  mk('arjun','sick',-2,19,21,'pending','Dental surgery and recovery'),
  mk('sofia','family',-1,20,23,'pending','Caring for my mother after her operation'),
  mk('arjun','annual',-5,27,29,'rejected','Long weekend',-1),
  mk('maya','annual',-8,59,66,'approved','Year-end break',-8),
  mk('daniel','annual',0,55,64,'pending','Christmas with family'),
  mk('weiling','childcare',-1,12,13,'pending','School closure, no cover for my son')
];
let nseq=1;
const notes=[];
const note=(to,kind,text,t,read)=>{const n={id:'n'+(nseq++),to,kind,text,t,read:!!read};notes.unshift(n);return n};
const R=i=>requests[i];
const asked=r=>`${P(r.who).name} requested ${plural(r.days,'day')} of ${tl(r)}, ${rangeShort(r.start,r.end)}.`;
note('priya','approved',`Your ${tl(R(0))} for ${rangeShort(R(0).start,R(0).end)} was approved by Maya Lim.`,Date.now()-12*24*HOUR,true);
note('weiling','approved',`Your ${tl(R(1))} for ${rangeShort(R(1).start,R(1).end)} was approved by Maya Lim.`,Date.now()-4*24*HOUR,false);
note('daniel','approved',`Your ${tl(R(2))} for ${rangeShort(R(2).start,R(2).end)} was approved by Maya Lim.`,Date.now()-7*24*HOUR,true);
note('maya','pending',asked(R(3)),Date.now()-3*24*HOUR,true);
note('maya','pending',asked(R(4)),Date.now()-2*24*HOUR,false);
note('maya','pending',asked(R(5)),Date.now()-26*HOUR,false);
note('arjun','rejected',`Your ${tl(R(6))} for ${rangeShort(R(6).start,R(6).end)} was rejected by Maya Lim. Talk to Maya if you’d like to discuss other dates.`,Date.now()-20*HOUR,false);
note('weiling','pending',`Your ${tl(R(9))} request for ${rangeShort(R(9).start,R(9).end)} was sent to Maya Lim for review.`,Date.now()-22*HOUR,true);
note('maya','pending',asked(R(9)),Date.now()-22*HOUR,false);
note('daniel','pending',`Your ${tl(R(8))} request for ${rangeShort(R(8).start,R(8).end)} was sent to Maya Lim for review.`,Date.now()-3*HOUR,true);
note('maya','pending',asked(R(8)),Date.now()-3*HOUR,false);
notes.sort((a,b)=>b.t-a.t);

/* ---------- State ---------- */
const firstPending=requests.filter(r=>r.status==='pending').sort((a,b)=>a.start<b.start?-1:1)[0];
const startMonth=firstPending?parse(firstPending.start):new Date(TODAY);
const state={viewer:LEAD,view:'review',year:startMonth.getFullYear(),month:startMonth.getMonth(),pinned:null,sheet:null};
const isLead=()=>state.viewer===LEAD;

/* ---------- Logic ---------- */
const active=r=>r.status==='approved'||r.status==='pending';
const overlaps=(a,b)=>a.start<=b.end&&b.start<=a.end;
const clashesFor=r=>requests.filter(o=>o.id!==r.id&&o.who!==r.who&&active(o)&&overlaps(r,o)).sort((a,b)=>a.start<b.start?-1:1);
const onDay=d=>requests.filter(r=>active(r)&&r.start<=d&&d<=r.end);

/* ---------- Icons ---------- */
const ICON={
  warn:'<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8L15 14H1L8 1.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 6.3v3.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.8" r=".95" fill="currentColor"/></svg>',
  ok:'<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x:'<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  prev:'<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next:'<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  calm:'<svg width="64" height="56" viewBox="0 0 64 56" aria-hidden="true"><rect x="6" y="8" width="52" height="44" rx="10" fill="var(--accent-soft)"/><rect x="6" y="8" width="52" height="12" rx="6" fill="var(--accent-line)"/><path d="M22 36l7 6 14-14" fill="none" stroke="var(--accent)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bell:'<svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="26" fill="var(--accent-soft)"/><path d="M19 34h18l-2-3v-7a7 7 0 0 0-14 0v7z" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round"/><path d="M25 38a3 3 0 0 0 6 0" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round"/></svg>',
  plane:'<svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="26" fill="var(--accent-soft)"/><path d="M15 30l26-11-8 21-5-7-8 4 3-6z" fill="none" stroke="var(--accent)" stroke-width="2.3" stroke-linejoin="round"/></svg>'
};

/* ---------- Header ---------- */
const viewerSel=document.getElementById('viewer');
viewerSel.innerHTML=people.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.role)}</option>`).join('');
viewerSel.value=state.viewer;
viewerSel.addEventListener('change',()=>{state.viewer=viewerSel.value;state.view=isLead()?'review':'status';state.pinned=null;state.sm=null;closeSheet();render()});

function renderTabs(){
  const unread=notes.filter(n=>n.to===state.viewer&&!n.read).length;
  const pend=requests.filter(r=>r.status==='pending').length;
  const tabs=[];
  if(isLead())tabs.push(['review','Review',pend]);
  tabs.push(['apply','Request leave',0]);
  tabs.push(['status',isLead()?'My requests':'My status',unread]);
  document.getElementById('tabs').innerHTML=tabs.map(([id,label,n])=>`<button class="tab" role="tab" data-tab="${id}" aria-selected="${state.view===id}">${label}${n?`<span class="badge" aria-label="${n} new">${n}</span>`:''}</button>`).join('');
}

/* ---------- Review screen ---------- */
function renderReview(){
  const el=document.getElementById('v-review');
  const pending=requests.filter(r=>r.status==='pending').sort((a,b)=>a.start<b.start?-1:1);
  const decided=requests.filter(r=>r.status!=='pending'&&r.decided&&r.end>=TODAY_ISO).sort((a,b)=>a.start<b.start?-1:1);
  const clashing=pending.filter(r=>clashesFor(r).length).length;
  el.innerHTML=`
  <section class="s-hero r-hero" aria-label="Review summary">
    <div class="s-hero-text">
      <div class="s-hi">Hi ${esc(first(state.viewer))}</div>
      <div class="s-num">${pending.length}</div>
      <div class="s-head">${pending.length===1?'request waiting for you':pending.length?'requests waiting for you':'requests waiting. All caught up'}</div>
      <p class="s-sub">${pending.length?`${clashing?`${plural(clashing,'request')} overlap${clashing===1?'s':''} with someone else’s leave. `:'No overlaps to worry about. '}Click any name on the calendar to approve, reject or reopen it.`:'New requests will appear here and on the calendar the moment someone applies.'}</p>
    </div>
    ${ART_REVIEW}
  </section>
  <div class="review">
    <div class="card cal" id="cal"></div>
    <div class="r-side">
      <div class="panel-title"><h3>Waiting for you</h3><span class="eyebrow">${plural(pending.length,'request')}</span></div>
      <div class="queue">${pending.length?pending.map(qcard).join(''):`
        <div class="card empty">${ICON.calm}<h4>You’re all caught up</h4><p>New leave requests will show up here the moment someone applies.</p></div>`}
      </div>
      <section class="card sv r-sv" aria-label="Decided, upcoming">
        <div class="sv-text"><div class="sv-title">Decided <span class="ok">×${decided.length}</span></div><p>Upcoming leave you’ve already decided. You can change any of these until the leave ends.</p></div>
        <div class="sv-div" aria-hidden="true"></div>
        <div class="sv-badges">${decided.slice(0,2).map(r=>`<span class="tok ${r.status==='approved'?'appr':'rej'}" title="${esc(P(r.who).name+', '+r.status)}"><b>${initials(r.who)}</b><small>${r.days}d</small></span>`).join('')}${decided.length>2?`<span class="tok more"><b>+${decided.length-2}</b></span>`:''}</div>
      </section>
      <div class="card dlist">${decided.length?decided.map(r=>`
          <div class="drow"><span class="avatar sm">${initials(r.who)}</span>
            <div class="who"><div>${esc(P(r.who).name)}</div><div>${TYPES[r.type].label} · ${rangeShort(r.start,r.end)} · ${plural(r.days,'day')}</div></div>
            <span class="pill ${r.status}">${cap(r.status)}</span>
            <div class="dacts">
              <button class="btn ghost small" data-act="${r.status==='approved'?'reject':'approve'}" data-id="${r.id}">${r.status==='approved'?'Change to rejected':'Change to approved'}</button>
              <button class="linkbtn" data-act="reopen" data-id="${r.id}">Back to pending</button>
            </div></div>`).join(''):`<div class="empty"><p>Approved or rejected leave that hasn’t ended yet will be listed here, so you can change your mind.</p></div>`}
      </div>
    </div>
  </div>`;
  renderCal();
}
const ART_REVIEW=`<svg class="s-art" viewBox="0 0 140 140" aria-hidden="true">
  <circle cx="106" cy="34" r="20" fill="var(--sun)"/>
  <rect x="26" y="30" width="80" height="98" rx="20" fill="var(--sun-2)"/>
  <rect x="48" y="22" width="36" height="18" rx="9" fill="var(--accent)"/>
  <path d="M44 74l11 10 22-22" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="44" y="98" width="44" height="8" rx="4" fill="var(--accent)" opacity=".45"/>
</svg>`;
function clashList(r){
  const c=clashesFor(r);
  return c.length?`<div class="overlap">${ICON.warn}<ul>${c.map(o=>{const s=o.start>r.start?o.start:r.start,e=o.end<r.end?o.end:r.end;return`<li>Overlaps <b>${esc(P(o.who).name)}</b> (${o.status}, ${TYPES[o.type].short.toLowerCase()}) on ${rangeShort(s,e)}</li>`}).join('')}</ul></div>`
    :`<div class="clear">${ICON.ok}No one else is off on these dates</div>`;
}

function qcard(r){
  return `<article class="card qcard${state.pinned===r.id?' pinned':''}" data-req="${r.id}" tabindex="0" aria-label="${esc(P(r.who).name)}, ${TYPES[r.type].label}, ${range(r.start,r.end)}">
    <div class="qhead"><span class="avatar">${initials(r.who)}</span><div><div class="qname">${esc(P(r.who).name)}</div><div class="qmeta">Applied ${dayAgo(r.applied)} · ${fmt(r.applied)}</div></div>
      <div class="qdays">${r.days}<small>${r.days===1?'day':'days'}</small></div></div>
    <div class="qline"><span class="tag">${TYPES[r.type].label}</span><span class="qdates">${range(r.start,r.end)}</span></div>
    ${r.reason?`<p class="qreason">${esc(r.reason)}</p>`:''}
    ${clashList(r)}
    <div class="qactions">
      <button class="btn primary small" data-act="approve" data-id="${r.id}">${ICON.ok} Approve</button>
      <button class="btn ghost small" data-act="reject" data-id="${r.id}">Reject</button>
      <button class="linkbtn" data-act="show" data-id="${r.id}">Show on calendar</button>
    </div>
  </article>`;
}

function renderCal(){
  const el=document.getElementById('cal');if(!el)return;
  const y=state.year,m=state.month;
  const firstDay=new Date(y,m,1);
  const lead=(firstDay.getDay()+6)%7;
  const gridStart=new Date(y,m,1-lead);
  const daysInMonth=new Date(y,m+1,0).getDate();
  const weeks=Math.ceil((lead+daysInMonth)/7);
  let html='',clashDays=0;
  for(let w=0;w<weeks;w++){
    const ws=new Date(gridStart);ws.setDate(gridStart.getDate()+w*7);
    const we=new Date(ws);we.setDate(ws.getDate()+6);
    const wsI=iso(ws),weI=iso(we);
    const segs=requests.filter(r=>active(r)&&r.start<=weI&&r.end>=wsI)
      .sort((a,b)=>a.start<b.start?-1:a.start>b.start?1:b.days-a.days)
      .map(r=>{const s=r.start<wsI?wsI:r.start,e=r.end>weI?weI:r.end;return{r,c0:span(wsI,s),c1:span(wsI,e),cl:r.start<wsI,cr:r.end>weI}});
    const lanes=[];
    segs.forEach(sg=>{let l=lanes.findIndex(end=>end<sg.c0);if(l===-1){l=lanes.length;lanes.push(0)}lanes[l]=sg.c1;sg.lane=l});
    let cells='';
    for(let i=0;i<7;i++){
      const d=new Date(ws);d.setDate(ws.getDate()+i);
      const di=iso(d),inMonth=d.getMonth()===m;
      const who=[...new Set(onDay(di).map(r=>r.who))];
      const clash=who.length>=2;if(clash&&inMonth)clashDays++;
      const wk=i>=5;
      const label=`${d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}: ${who.length?plural(who.length,'person')+' off':'no one off'}`;
      cells+=`<div class="day${inMonth?'':' out'}${wk?' wkend':''}${di===TODAY_ISO?' today':''}${clash?' clash':''}" data-date="${di}" style="grid-column:${i+1}" title="${esc(label)}">
        <div class="num"><span>${d.getDate()}</span>${clash?`<span class="warn-ico" aria-label="${who.length} people off">${ICON.warn}</span>`:''}</div></div>`;
    }
    const bars=segs.map(({r,c0,c1,cl,cr,lane})=>{
      const t=`${P(r.who).name} · ${TYPES[r.type].label} · ${plural(r.days,'day')} (${rangeShort(r.start,r.end)}) · ${cap(r.status)}. Click to review.`;
      return `<button class="bar ${r.status}${cl?' cl':''}${cr?' cr':''}${state.pinned===r.id?' sel':''}" data-act="open" data-id="${r.id}" style="grid-column:${c0}/${c1+1};grid-row:${lane+2}" title="${esc(t)}" aria-label="${esc(t)}"><span class="bn">${esc(first(r.who))}</span><span class="bm">${TYPES[r.type].short} · ${r.days}d</span></button>`;
    }).join('');
    html+=`<div class="week" style="grid-template-rows:28px ${lanes.length?`repeat(${lanes.length},auto) `:''}minmax(6px,1fr)">${cells}${bars}</div>`;
  }
  const monthStart=iso(new Date(y,m,1)),monthEnd=iso(new Date(y,m,daysInMonth));
  const inView=requests.filter(r=>active(r)&&r.start<=monthEnd&&r.end>=monthStart);
  const pend=inView.filter(r=>r.status==='pending').length,appr=inView.filter(r=>r.status==='approved').length;
  el.innerHTML=`
    <div class="cal-head">
      <h3>${firstDay.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</h3>
      <button class="btn ghost small" data-act="today">Today</button>
      <button class="iconbtn" data-act="prev" aria-label="Previous month">${ICON.prev}</button>
      <button class="iconbtn" data-act="next" aria-label="Next month">${ICON.next}</button>
    </div>
    <p class="cal-sum"><b>${appr}</b> approved · <b>${pend}</b> pending · <b>${clashDays}</b> ${clashDays===1?'day':'days'} with 2+ people off</p>
    <div class="grid"><div class="dows">${['M','T','W','T','F','S','S'].map(d=>`<div class="dow">${d}</div>`).join('')}</div>${html}</div>
    <div class="legend"><span><i class="sw approved"></i>Approved</span><span><i class="sw pending"></i>Pending</span><span><i class="sw clash"></i>2+ people off</span><span><i class="sw hl"></i>Selected request</span><span>Bars show name · type · days</span></div>`;
  paintHighlight(state.pinned);
}

function paintHighlight(id){
  const r=requests.find(x=>x.id===id);
  document.querySelectorAll('.day').forEach(c=>{const d=c.dataset.date;c.classList.toggle('hl',!!r&&r.start<=d&&d<=r.end)});
  document.querySelectorAll('.bar').forEach(b=>b.classList.toggle('sel',b.dataset.id===id));
}
function showOnCal(id,jump){
  const r=requests.find(x=>x.id===id);if(!r)return;
  state.pinned=id;
  const s=parse(r.start);
  if(jump&&(s.getFullYear()!==state.year||s.getMonth()!==state.month)){state.year=s.getFullYear();state.month=s.getMonth();renderCal()}
  else paintHighlight(id);
  document.querySelectorAll('.qcard').forEach(c=>c.classList.toggle('pinned',c.dataset.req===id));
  if(jump&&window.matchMedia('(max-width:980px)').matches)document.getElementById('cal').scrollIntoView({behavior:'smooth',block:'start'});
}

/* ---------- Detail sheet (from calendar) ---------- */
let sheetReturn=null;
function openSheet(id){
  const r=requests.find(x=>x.id===id);if(!r)return;
  state.sheet=id;sheetReturn=document.activeElement;
  state.pinned=id;paintHighlight(id);
  document.querySelectorAll('.qcard').forEach(c=>c.classList.toggle('pinned',c.dataset.req===id));
  const acts=r.status==='pending'
    ?`<button class="btn primary" data-act="approve" data-id="${r.id}">${ICON.ok} Approve</button><button class="btn ghost" data-act="reject" data-id="${r.id}">Reject</button>`
    :r.status==='approved'
    ?`<button class="btn ghost" data-act="reject" data-id="${r.id}">Change to rejected</button><button class="linkbtn" data-act="reopen" data-id="${r.id}">Back to pending</button>`
    :`<button class="btn primary" data-act="approve" data-id="${r.id}">${ICON.ok} Change to approved</button><button class="linkbtn" data-act="reopen" data-id="${r.id}">Back to pending</button>`;
  document.getElementById('sheet').innerHTML=`
    <div class="sheet-head"><span class="avatar">${initials(r.who)}</span><div><h3 id="sheet-title">${esc(P(r.who).name)}</h3><div class="qmeta">${esc(P(r.who).role)}</div></div>
      <button class="iconbtn" data-act="close" aria-label="Close">${ICON.x}</button></div>
    <div class="qline"><span class="pill ${r.status}">${cap(r.status)}</span><span class="tag">${TYPES[r.type].label}</span></div>
    <div class="bigdays"><b>${r.days}</b><span>${r.days===1?'calendar day':'calendar days'} · ${range(r.start,r.end)}</span></div>
    <dl class="facts">
      <dt>Applied</dt><dd>${fmt(r.applied)} (${dayAgo(r.applied)})</dd>
      ${r.decided?`<dt>Decided</dt><dd>${fmt(r.decided)}</dd>`:''}
      ${r.reason?`<dt>Note</dt><dd style="font-weight:500">${esc(r.reason)}</dd>`:''}
    </dl>
    ${clashList(r)}
    <div class="sheet-acts">${acts}</div>`;
  document.getElementById('scrim').hidden=false;
  document.querySelector('#sheet .sheet-acts .btn')?.focus();
}
function closeSheet(){
  const sc=document.getElementById('scrim');if(sc.hidden)return;
  sc.hidden=true;state.sheet=null;
  if(sheetReturn&&document.contains(sheetReturn))sheetReturn.focus();
}

/* ---------- Apply screen ---------- */
function renderApply(){
  const el=document.getElementById('v-apply');
  const me=P(state.viewer);
  el.innerHTML=`
  <div class="s-wrap">
    <section class="s-hero" aria-label="Your new request">
      <div class="s-hero-text">
        <div class="s-hi">New request</div>
        <div class="s-num" id="a-num">0</div>
        <div class="s-head" id="a-head">days selected</div>
        <p class="s-sub" id="a-sub">Pick a leave type and your dates. The days are counted for you, weekends included.</p>
      </div>
      ${ART_APPLY}
    </section>
    <form class="card a-form" id="leave-form" novalidate>
      <div class="row2">
        <div class="field"><label for="f-name">Applicant</label><input id="f-name" value="${esc(me.name)}" readonly></div>
        <div class="field"><label for="f-applied">Date of application</label><input id="f-applied" value="${fmt(TODAY_ISO,{year:1})}" readonly></div>
      </div>
      <fieldset class="field"><legend>Leave type</legend>
        <div class="types">${Object.entries(TYPES).map(([k,t],i)=>`<label><input type="radio" name="ltype" id="t-${k}" value="${k}"${i===0?' checked':''}><span>${t.label}</span></label>`).join('')}</div>
        <span class="hint" id="type-hint"></span>
      </fieldset>
      <div class="row2">
        <div class="field"><label for="f-start">First day of leave</label><input type="date" id="f-start" min="${TODAY_ISO}" required><span class="err" id="e-start"></span></div>
        <div class="field"><label for="f-end">Last day of leave</label><input type="date" id="f-end" min="${TODAY_ISO}" required><span class="err" id="e-end"></span></div>
      </div>
      <div class="field"><label for="f-days">Duration</label><input id="f-days" readonly value="Choose both dates"></div>
      <div class="field"><label for="f-reason">Note for your lead <span class="hint">(optional)</span></label><textarea id="f-reason" maxlength="140" placeholder="e.g. Family trip, medical appointment"></textarea></div>
      <div class="form-foot"><button type="reset" class="btn ghost">Clear</button><button type="submit" class="btn primary">Submit request</button></div>
    </form>
    <section class="card sv" aria-label="What happens next">
      <div class="sv-text"><div class="sv-title">What happens next</div><p>${isLead()?'Your request joins your review queue.':'Maya sees who else is off before deciding.'} The decision lands in My status & updates, so there’s no need to chase.</p></div>
      <div class="sv-div" aria-hidden="true"></div>
      <div class="sv-badges"><span class="tok step"><b>1</b><small>Sent</small></span><span class="tok step"><b>2</b><small>Review</small></span><span class="tok step"><b>3</b><small>Notified</small></span></div>
    </section>
  </div>`;
  updateType();updateDuration();
}
const ART_APPLY=`<svg class="s-art" viewBox="0 0 140 140" aria-hidden="true">
  <circle cx="104" cy="32" r="20" fill="var(--sun)"/>
  <rect x="20" y="36" width="96" height="90" rx="22" fill="var(--sun-2)"/>
  <rect x="20" y="36" width="96" height="26" rx="13" fill="var(--accent)"/>
  <rect x="40" y="26" width="9" height="20" rx="4.5" fill="var(--accent)"/>
  <rect x="87" y="26" width="9" height="20" rx="4.5" fill="var(--accent)"/>
  <rect x="38" y="80" width="62" height="22" rx="11" fill="var(--accent)" opacity=".35"/>
  <circle cx="89" cy="91" r="11" fill="var(--accent)"/>
</svg>`;
const curType=()=>document.querySelector('input[name=ltype]:checked')?.value||'annual';
function updateType(){
  const sick=curType()==='sick';
  const minS=sick?off(-SICK_BACKDATE):TODAY_ISO;
  const s=document.getElementById('f-start'),e=document.getElementById('f-end');if(!s)return;
  s.min=minS;e.min=s.value||minS;
  document.getElementById('type-hint').textContent=sick?`Sick leave can be backdated up to ${SICK_BACKDATE} days.`:'';
}
function updateDuration(){
  const s=document.getElementById('f-start')?.value,e=document.getElementById('f-end')?.value;
  const num=document.getElementById('a-num'),head=document.getElementById('a-head'),sub=document.getElementById('a-sub'),f=document.getElementById('f-days');
  if(!num)return;
  const t=TYPES[curType()].label.toLowerCase();
  if(s&&e&&e>=s){
    const n=span(s,e);
    num.textContent=n;head.textContent=`${n===1?'day':'days'} of ${t}`;
    sub.textContent=`${range(s,e)} · weekends included`;
    f.value=`${plural(n,'calendar day')}`;
  }else{
    num.textContent='0';head.textContent='days selected';
    sub.textContent='Pick a leave type and your dates. The days are counted for you, weekends included.';
    f.value='Choose both dates';
  }
}

/* ---------- Status screen ---------- */
function renderStatus(){
  const el=document.getElementById('v-status');
  const mine=requests.filter(r=>r.who===state.viewer).sort((a,b)=>a.start<b.start?1:-1);
  const myNotes=notes.filter(n=>n.to===state.viewer);
  const unread=myNotes.filter(n=>!n.read).length;
  const hero=heroFor(mine);
  if(!state.sm){const d=hero.r?parse(hero.r.start):TODAY;state.sm={y:d.getFullYear(),m:d.getMonth()}}
  const pend=mine.filter(r=>r.status==='pending').sort((a,b)=>a.start<b.start?-1:1);
  const decider=isLead()?'review':'Maya to decide';
  el.innerHTML=`
  <div class="s-wrap">
    <section class="s-hero" aria-label="Your leave at a glance">
      <div class="s-hero-text">
        <div class="s-hi">Hi ${esc(first(state.viewer))}</div>
        <div class="s-num">${hero.n}</div>
        <div class="s-head">${hero.head}</div>
        <p class="s-sub">${hero.sub}</p>
        ${hero.cta?`<button class="btn primary" data-tab="apply">Request leave</button>`:''}
      </div>
      ${ART}
    </section>

    <section class="card s-cal" aria-label="My leave calendar">${myCal(mine)}</section>

    <section class="card sv" aria-label="Pending requests">
      <div class="sv-text">
        ${pend.length?`<div class="sv-title">Pending <span>×${pend.length}</span></div><p>Waiting for ${decider}. Updates appear below as soon as there’s a decision.</p>`
          :`<div class="sv-title">All decided <span class="ok">✓</span></div><p>Nothing is waiting for a decision right now.</p>`}
      </div>
      <div class="sv-div" aria-hidden="true"></div>
      <div class="sv-badges">${pend.length?pend.slice(0,3).map(r=>`<span class="tok" title="${esc(TYPES[r.type].label+', '+rangeShort(r.start,r.end))}"><b>${r.days}d</b><small>${esc(TYPES[r.type].short)}</small></span>`).join('')+(pend.length>3?`<span class="tok more"><b>+${pend.length-3}</b></span>`:'')
        :`<span class="tok done" aria-hidden="true">${ICON.ok}</span>`}</div>
    </section>

    <section>
      <div class="panel-title"><h3>Updates</h3>${unread?`<button class="linkbtn" data-act="readall">Mark all as read</button>`:''}</div>
      <div class="card notes">${myNotes.length?myNotes.map(n=>`
        <div class="note${n.read?'':' unread'}"><span class="nd ${n.kind}"></span><div><div class="nx">${esc(n.text)}</div><div class="nt">${ago(n.t)}</div></div></div>`).join(''):`
        <div class="empty">${ICON.bell}<h4>Nothing new</h4><p>When a request is approved or rejected, you’ll see it here first.</p></div>`}
      </div>
    </section>

    <section>
      <div class="panel-title"><h3>All my requests</h3><span class="eyebrow">${plural(mine.length,'request')}</span></div>
      <div class="rlist">${mine.length?mine.map(rcard).join(''):`
        <div class="card empty">${ICON.plane}<h4>No requests yet</h4><p>When you apply for leave, you’ll be able to follow it here from pending to decided.</p><button class="btn primary" data-tab="apply">Request leave</button></div>`}
      </div>
    </section>
  </div>`;
}
function heroFor(mine){
  const byStart=(a,b)=>a.start<b.start?-1:1;
  const up=mine.filter(r=>r.status==='approved'&&r.end>=TODAY_ISO).sort(byStart)[0];
  const pend=mine.filter(r=>r.status==='pending').sort(byStart);
  if(up){
    if(up.start<=TODAY_ISO){const n=span(TODAY_ISO,up.end);return{n,head:n===1?'last day of leave':'days of leave left',sub:`You’re on ${tl(up)} until ${fmt(up.end)}. Enjoy the break.`,r:up}}
    const n=span(TODAY_ISO,up.start)-1;
    return{n,head:n===1?'day until your leave':'days until your leave',sub:`${range(up.start,up.end)} · ${TYPES[up.type].label} · ${plural(up.days,'day')}`,r:up};
  }
  if(pend.length)return{n:pend.length,head:pend.length===1?'request in review':'requests in review',sub:`No approved leave coming up yet. You’ll hear here as soon as ${isLead()?'it’s reviewed':'Maya decides'}.`,r:pend[0]};
  return{n:0,head:'days of leave booked',sub:'Nothing coming up yet. Plan a break and it will show here.',r:null,cta:true};
}
function myCal(mine){
  const {y,m}=state.sm;
  const firstDay=new Date(y,m,1),lead=(firstDay.getDay()+6)%7,dim=new Date(y,m+1,0).getDate();
  const act=mine.filter(active);
  let cells='';
  for(let i=0;i<lead;i++)cells+='<div class="sc-day blank"></div>';
  for(let d=1;d<=dim;d++){
    const di=iso(new Date(y,m,d)),col=(lead+d-1)%7;
    const r=act.find(x=>x.start<=di&&di<=x.end);
    let band='',cls='';
    if(r){
      const capL=di===r.start||col===0||d===1,capR=di===r.end||col===6||d===dim;
      band=`<span class="sc-band ${r.status}${capL?' l':''}${capR?' r':''}"></span>`;
      cls=` on ${r.status}${di===r.start||di===r.end?' edge':''}`;
    }
    const lbl=parse(di).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})+(r?`: ${TYPES[r.type].label}, ${r.status}`:'');
    cells+=`<div class="sc-day${cls}${di===TODAY_ISO?' today':''}" title="${esc(lbl)}" aria-label="${esc(lbl)}">${band}<span class="sc-n">${d}</span></div>`;
  }
  const monthStart=iso(firstDay),monthEnd=iso(new Date(y,m,dim));
  const daysOff=act.reduce((t,r)=>{if(r.status!=='approved'||r.end<monthStart||r.start>monthEnd)return t;const s=r.start<monthStart?monthStart:r.start,e=r.end>monthEnd?monthEnd:r.end;return t+span(s,e)},0);
  return `<div class="sc-head">
      <h3>${firstDay.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</h3>
      <button class="iconbtn" data-act="sprev" aria-label="Previous month">${ICON.prev}</button>
      <button class="iconbtn" data-act="snext" aria-label="Next month">${ICON.next}</button>
    </div>
    <div class="sc-grid">${['M','T','W','T','F','S','S'].map(d=>`<div class="sc-dow">${d}</div>`).join('')}${cells}</div>
    <div class="sc-foot"><span><i class="sw approved-soft"></i>Approved</span><span><i class="sw pending-dash"></i>Pending</span><span class="sc-total">${plural(daysOff,'approved day')} this month</span></div>`;
}
const ART=`<svg class="s-art" viewBox="0 0 140 140" aria-hidden="true">
  <circle cx="102" cy="36" r="22" fill="var(--sun)"/>
  <path d="M54 52V42a10 10 0 0 1 10-10h12a10 10 0 0 1 10 10v10" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round"/>
  <rect x="18" y="50" width="104" height="74" rx="22" fill="var(--sun-2)"/>
  <rect x="44" y="50" width="11" height="74" fill="var(--accent)" opacity=".8"/>
  <rect x="85" y="50" width="11" height="74" fill="var(--accent)" opacity=".8"/>
  <circle cx="70" cy="88" r="4" fill="var(--accent)" opacity=".5"/>
</svg>`;
function rcard(r){
  const decidedTxt=r.status==='pending'?'Waiting for Maya':`${cap(r.status)} ${fmt(r.decided)}`;
  return `<article class="card rcard">
    <div class="rtop"><div class="qdates">${range(r.start,r.end)}</div><span class="tag">${TYPES[r.type].label}</span><span class="pill ${r.status}">${cap(r.status)}</span></div>
    <div class="track">
      <span class="stage"><i class="dot on"></i>Submitted ${fmt(r.applied)}</span><span class="bar2"></span>
      <span class="stage cur"><i class="dot${r.status==='pending'?'':' on'}"></i>${decidedTxt}</span>
      <span style="margin-left:auto">${plural(r.days,'day')}</span>
    </div>
    ${r.reason?`<div class="qreason">${esc(r.reason)}</div>`:''}
  </article>`;
}

/* ---------- Actions ---------- */
let undoTimer,lastAction=null;
function toast(msg,undo){
  const t=document.getElementById('toast');document.getElementById('toast-msg').textContent=msg;
  const b=document.getElementById('toast-undo');b.hidden=!undo;
  t.classList.add('show');clearTimeout(undoTimer);
  undoTimer=setTimeout(()=>{t.classList.remove('show');lastAction=null},undo?6000:3200);
}
function decide(id,status){
  const r=requests.find(x=>x.id===id);if(!r||r.status===status)return;
  closeSheet();
  const prev={status:r.status,decided:r.decided};
  const when=`${tl(r)} for ${rangeShort(r.start,r.end)}`;
  const talk=status==='rejected'?' Talk to Maya if you’d like to discuss other dates.':'';
  let text,msg;
  if(status==='pending'){
    text=`Maya Lim moved your ${when} back to pending. It will be reviewed again.`;
    msg=`${first(r.who)}’s leave is back in the queue`;r.decided=null;
  }else if(prev.status==='pending'){
    text=`Your ${when} was ${status} by Maya Lim.${talk}`;
    msg=`${status==='approved'?'Approved':'Rejected'} ${first(r.who)}’s ${TYPES[r.type].short.toLowerCase()} leave`;r.decided=TODAY_ISO;
  }else{
    text=`Maya Lim changed your ${when} from ${prev.status} to ${status}.${talk}`;
    msg=`Changed ${first(r.who)}’s leave to ${status}`;r.decided=TODAY_ISO;
  }
  r.status=status;
  const n=note(r.who,status,text,Date.now(),false);
  lastAction={id,noteId:n.id,prev};
  if(state.pinned===id&&status!=='pending')state.pinned=null;
  render();
  toast(`${msg} · ${first(r.who)} has been notified`,true);
}
function undo(){
  if(!lastAction)return;
  const r=requests.find(x=>x.id===lastAction.id);r.status=lastAction.prev.status;r.decided=lastAction.prev.decided;
  const i=notes.findIndex(n=>n.id===lastAction.noteId);if(i>-1)notes.splice(i,1);
  lastAction=null;render();toast('Change undone. No notification was sent.');
}
document.getElementById('toast-undo').addEventListener('click',undo);

document.addEventListener('click',e=>{
  if(e.target.id==='scrim'){closeSheet();return}
  const tab=e.target.closest('[data-tab]');
  if(tab){state.view=tab.dataset.tab;render();window.scrollTo({top:0});return}
  const a=e.target.closest('[data-act]');
  if(a){
    const act=a.dataset.act,id=a.dataset.id;
    if(act==='approve')decide(id,'approved');
    else if(act==='reject')decide(id,'rejected');
    else if(act==='reopen')decide(id,'pending');
    else if(act==='open')openSheet(id);
    else if(act==='close')closeSheet();
    else if(act==='show')showOnCal(id,true);
    else if(act==='prev'||act==='next'){const d=new Date(state.year,state.month+(act==='next'?1:-1),1);state.year=d.getFullYear();state.month=d.getMonth();renderCal()}
    else if(act==='today'){state.year=TODAY.getFullYear();state.month=TODAY.getMonth();renderCal()}
    else if(act==='sprev'||act==='snext'){const d=new Date(state.sm.y,state.sm.m+(act==='snext'?1:-1),1);state.sm={y:d.getFullYear(),m:d.getMonth()};renderStatus()}
    else if(act==='readall'){notes.forEach(n=>{if(n.to===state.viewer)n.read=true});render()}
    return;
  }
  const q=e.target.closest('.qcard');
  if(q)showOnCal(q.dataset.req,true);
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&state.sheet){closeSheet();return}
  const q=e.target.closest&&e.target.closest('.qcard');
  if(q&&e.target===q&&(e.key==='Enter'||e.key===' ')){e.preventDefault();showOnCal(q.dataset.req,true)}
});
document.addEventListener('mouseover',e=>{const q=e.target.closest('.qcard');if(q)paintHighlight(q.dataset.req)});
document.addEventListener('mouseout',e=>{const q=e.target.closest('.qcard');if(q&&!q.contains(e.relatedTarget))paintHighlight(state.pinned)});

document.addEventListener('change',e=>{if(e.target.name==='ltype'){updateType();updateDuration()}});
document.addEventListener('input',e=>{
  if(e.target.id==='f-start'){const end=document.getElementById('f-end');end.min=e.target.value||end.min;if(!end.value||end.value<e.target.value)end.value=e.target.value}
  if(e.target.id==='f-start'||e.target.id==='f-end'){document.getElementById('e-start').textContent='';document.getElementById('e-end').textContent='';updateDuration()}
});
document.addEventListener('reset',e=>{if(e.target.id==='leave-form')setTimeout(()=>{updateType();updateDuration()})});
document.addEventListener('submit',e=>{
  if(e.target.id!=='leave-form')return;e.preventDefault();
  const type=curType();
  const s=document.getElementById('f-start').value,en=document.getElementById('f-end').value,reason=document.getElementById('f-reason').value.trim();
  let ok=true;
  const es=document.getElementById('e-start'),ee=document.getElementById('e-end');
  if(!s){es.textContent='Choose the first day of your leave.';ok=false}
  else if(type==='sick'&&s<off(-SICK_BACKDATE)){es.textContent=`Sick leave can only be backdated ${SICK_BACKDATE} days.`;ok=false}
  else if(type!=='sick'&&s<TODAY_ISO){es.textContent='Only sick leave can start before today.';ok=false}
  if(!en){ee.textContent='Choose the last day of your leave.';ok=false}
  else if(s&&en<s){ee.textContent='The last day must be on or after the first day.';ok=false}
  if(!ok)return;
  const r={id:'r'+(seq++),who:state.viewer,type,applied:TODAY_ISO,start:s,end:en,days:span(s,en),status:'pending',reason,decided:null};
  requests.push(r);
  note(state.viewer,'pending',`Your ${tl(r)} request for ${rangeShort(s,en)} (${plural(r.days,'day')}) was sent to Maya Lim for review.`,Date.now(),true);
  if(state.viewer!==LEAD)note(LEAD,'pending',asked(r),Date.now(),false);
  state.view='status';state.sm=null;render();window.scrollTo({top:0});
  toast(isLead()?'Request added to your review queue':'Request sent to Maya · status: Pending');
});

/* ---------- Render ---------- */
function render(){
  if(!isLead()&&state.view==='review')state.view='status';
  renderTabs();
  ['review','apply','status'].forEach(v=>document.getElementById('v-'+v).hidden=state.view!==v);
  if(isLead())renderReview();else document.getElementById('v-review').innerHTML='';
  renderApply();renderStatus();
}
render();
})();

/* ---------- Appearance toggle ---------- */
(function(){
  const btn=document.getElementById('theme-toggle');if(!btn)return;
  const root=document.documentElement;
  const mq=window.matchMedia('(prefers-color-scheme: dark)');
  const current=()=>root.getAttribute('data-theme')||(mq.matches?'dark':'light');
  function sync(){
    const dark=current()==='dark';
    const next=dark?'light':'dark';
    btn.classList.toggle('is-dark',dark);
    btn.setAttribute('aria-pressed',String(dark));
    btn.setAttribute('aria-label',`Switch to ${next} mode`);
    btn.title=`Switch to ${next} mode`;
    btn.querySelector('.theme-label').textContent=dark?'Light':'Dark';
  }
  btn.addEventListener('click',()=>{
    const next=current()==='dark'?'light':'dark';
    root.setAttribute('data-theme',next);
    try{localStorage.setItem('lp-theme',next)}catch(e){}
    sync();
  });
  mq.addEventListener?.('change',sync);
  sync();
})();
