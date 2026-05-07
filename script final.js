
// ══════════════════════════════════════════════════════
//   KIND PLANNER — FULL VERSION WITH REAL CLAUDE AI
// ══════════════════════════════════════════════════════
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DK=['mon','tue','wed','thu','fri','sat','sun'];

let S={
  settings:{name:'friend',theme:'light',password:null,apiKey:''},
  tasks:[],
  wellbeing:{energy:null,streak:0,logs:[],habit:'',notes:''},
  schedule:{mon:{},tue:{},wed:{},thu:{},fri:{},sat:{},sun:{},weekly:{}},
  focus:{sessions:0,mins:0,best:0},
  xp:0,
  goals:[],
  setupDone:false,
  chatHistory:[],
  pendingFilter:'all'
};

function saveData() {
  localStorage.setItem('kpv5', JSON.stringify(S));
}
function loadData(){try{const d=localStorage.getItem('kpv5');if(d)Object.assign(S,JSON.parse(d));}catch(e){}}

// ── TOAST ──
function toast(msg,type='ok'){
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const d=Object.assign(document.createElement('div'),{className:`toast ${type}`,textContent:msg});
  document.body.appendChild(d);
  setTimeout(()=>{d.style.opacity='0';d.style.transition='opacity .4s'},2600);
  setTimeout(()=>d.remove(),3100);
}

// ── CONFETTI ──
function celebrate(){
  const emojis=['🎉','✨','⭐','🌟','💫','🎊','🌸'];
  for(let i=0;i<18;i++)setTimeout(()=>{
    const d=document.createElement('div');
    d.className='cpp';
    d.textContent=emojis[Math.floor(Math.random()*emojis.length)];
    d.style.cssText=`left:${8+Math.random()*84}%;top:${15+Math.random()*35}%;animation-duration:${.75+Math.random()*.9}s`;
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),1700);
  },i*70);
}

// ── XP & LEVELS ──
const LEVELS=[
  {min:0,name:'🌱 Seedling'},{min:100,name:'🌿 Sprout'},
  {min:300,name:'🍃 Growing'},{min:600,name:'🌳 Grounded'},
  {min:1000,name:'🌲 Rooted'},{min:1500,name:'🌴 Flourishing'},
  {min:2500,name:'⭐ Thriving'}
];
function addXP(amount){
  S.xp=(S.xp||0)+amount;saveData();updateXP();
}
function updateXP(){
  const xp=S.xp||0;
  let lv=LEVELS[0];
  for(const l of LEVELS){if(xp>=l.min)lv=l;}
  const idx=LEVELS.indexOf(lv);
  const next=LEVELS[idx+1];
  const pct=next?Math.round((xp-lv.min)/(next.min-lv.min)*100):100;
  const el1=document.getElementById('levelBadge');
  const el2=document.getElementById('xpTxt');
  const el3=document.getElementById('xpBar');
  if(el1)el1.textContent=lv.name;
  if(el2)el2.textContent=xp+' XP';
  if(el3)el3.style.width=pct+'%';
}

// ── DIALOGS ──
const openDlg=id=>document.getElementById(id).classList.remove('h');
const closeDlg=id=>document.getElementById(id).classList.add('h');

// ── BOOT ──
window.addEventListener('DOMContentLoaded',()=>{
  loadData();applyTheme();
  document.getElementById('homeDateLbl').textContent=
    new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  document.getElementById('todayDateLbl').textContent=
    new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  if(!S.settings.password){
    document.getElementById('passLbl').textContent='Create a password (4+ characters)';
    document.getElementById('loginPass').placeholder='Choose a password';
  }
  openDlg('loginScreen');
  setTimeout(()=>document.getElementById('loginPass').focus(),280);
});

// ── LOGIN ──
function doLogin(){
  const v=document.getElementById('loginPass').value.trim();
  const msg=document.getElementById('loginMsg');
  if(!S.settings.password){
    if(v.length<4){msg.textContent='Please use at least 4 characters';return;}
    S.settings.password=v;saveData();
    closeDlg('loginScreen');toast('Welcome to Kind Planner! 🌱','ok');
    if(!S.setupDone){openDlg('schedDlg');renderSchedForm();}else{afterLogin();}
  }else{
    if(v===S.settings.password){closeDlg('loginScreen');afterLogin();}
    else{msg.textContent='Incorrect password';document.getElementById('loginPass').value='';}
  }
}
function afterLogin(){updateAll();go(0);setTimeout(loadDailyFeedback,600);checkApiKeyBanner();}

function checkApiKeyBanner(){
  const b=document.getElementById('keyBanner');
  if(!S.settings.apiKey){b.style.display='flex';}
  else{b.style.display='none';}
}

function saveQuickKey(){
  const v=document.getElementById('quickKeyIn').value.trim();
  if(!v.startsWith('sk-')){toast('Key should start with sk-ant...','err');return;}
  S.settings.apiKey=v;saveData();
  document.getElementById('keyBanner').style.display='none';
  document.getElementById('aiStatusDot').textContent='● Live Claude AI ✓';
  toast('API key saved! Sage is live 🌱','ok');
  loadDailyFeedback();
}

// ── RESET ──
function openReset(){openDlg('resetDlg');}
function doReset(){
  if(document.getElementById('resetIn').value.trim().toUpperCase()!=='RESET'){toast('Type RESET exactly','err');return;}
  localStorage.removeItem('kpv5');
  S={settings:{name:'friend',theme:'light',password:null,apiKey:''},tasks:[],wellbeing:{energy:null,streak:0,logs:[],habit:'',notes:''},schedule:{mon:{},tue:{},wed:{},thu:{},fri:{},sat:{},sun:{},weekly:{}},focus:{sessions:0,mins:0,best:0},xp:0,goals:[],setupDone:false,chatHistory:[],pendingFilter:'all'};
  saveData();closeDlg('resetDlg');
  document.getElementById('loginPass').value='';
  document.getElementById('passLbl').textContent='Create a new password (4+ characters)';
  document.getElementById('loginMsg').textContent='';
  openDlg('loginScreen');toast('Fresh start! 🌱','ok');
}

// ── SCHEDULE ──
function renderSchedForm(){
  document.getElementById('schedDays').innerHTML=DK.map((k,i)=>{
    const d=S.schedule[k]||{};
    return`<div style="margin:.65rem 0">
      <div style="font-weight:600;font-size:.84rem;color:var(--ink-s);margin-bottom:.28rem">${DAYS[i]}</div>
      <div style="display:flex;gap:.38rem;flex-wrap:wrap">
        <input style="flex:1;min-width:90px" id="ss_${k}_s" value="${d.sleep||''}" placeholder="Sleep e.g. 23:00–07:00">
        <input style="flex:1;min-width:90px" id="ss_${k}_b" value="${d.busy||''}" placeholder="School/Work e.g. 09–15">
        <input style="flex:1;min-width:90px" id="ss_${k}_f" value="${d.free||''}" placeholder="Free e.g. 16–21">
      </div></div>`;
  }).join('');
}
function saveSchedule(){
  DK.forEach(k=>{
    S.schedule[k]={
      sleep:document.getElementById(`ss_${k}_s`)?.value||'',
      busy:document.getElementById(`ss_${k}_b`)?.value||'',
      free:document.getElementById(`ss_${k}_f`)?.value||''
    };
  });
  S.setupDone=true;saveData();closeDlg('schedDlg');
  toast('Schedule saved! Sage will use this 🗓','ok');afterLogin();
}
function skipSchedule(){S.setupDone=true;saveData();closeDlg('schedDlg');afterLogin();}

// ── NAVIGATION ──
function go(n){
  document.querySelectorAll('.pg').forEach((p,i)=>p.classList.toggle('on',i===n));
  document.querySelectorAll('.nb').forEach((b,i)=>b.classList.toggle('on',i===n));
  const fns=[updateHome,updatePendingPage,updateToday,updateTasks,initChat,updateWellbeing,updateFocusPage,updateSchedView];
  if(fns[n])setTimeout(fns[n],40);
}

// ── TASK CRUD ──
function addTask(){
  const nm=document.getElementById('tName').value.trim();
  if(!nm){toast('Task name required','err');return;}
  S.tasks.unshift({
    id:Date.now(),name:nm,
    level:document.getElementById('tLevel').value,
    duration:parseFloat(document.getElementById('tDur').value),
    deadline:document.getElementById('tDate').value,
    done:false,doneDate:null,
    created:new Date().toISOString(),
    suggestedStart:''
  });
  document.getElementById('tName').value='';
  saveData();closeDlg('taskDlg');updateAll();
  addXP(10);
  toast(`"${nm}" added 🌱`,'ok');updatePendingBadge();
}

function toggle(id){
  const t=S.tasks.find(x=>x.id===id);if(!t)return;
  t.done=!t.done;
  t.doneDate=t.done?new Date().toISOString().split('T')[0]:null;
  if(t.done){
    S.wellbeing.streak++;
    const xpMap={hard:50,medium:25,easy:15};
    addXP(xpMap[t.level]||20);
    celebrate();
    showCelebration(t.name);
  }else{
    S.wellbeing.streak=Math.max(0,S.wellbeing.streak-1);
  }
  saveData();updateAll();updatePendingBadge();
}

function showCelebration(taskName){
  const msgs=[
    [`🎉`,`Task Complete!`,`"${taskName}" is done! You earned XP for that! Keep going!`],
    [`⭐`,`Brilliant!`,`You finished "${taskName}"! Every completed task is a win.`],
    [`🌟`,`You did it!`,`"${taskName}" — checked off! Sage is proud of you.`],
    [`✨`,`Amazing work!`,`"${taskName}" complete! One step at a time, you're making progress.`],
  ];
  const [em,title,msg]=msgs[Math.floor(Math.random()*msgs.length)];
  document.getElementById('celEmoji').textContent=em;
  document.getElementById('celTitle').textContent=title;
  document.getElementById('celMsg').textContent=msg;
  openDlg('celDlg');
  setTimeout(()=>closeDlg('celDlg'),3500);
}

function rescheduleAll(){
  let c=0;
  S.tasks.forEach(t=>{
    if(!t.done&&t.deadline){
      const d=new Date(t.deadline);d.setDate(d.getDate()+2);
      t.deadline=d.toISOString().split('T')[0];c++;
    }
  });
  saveData();updateAll();
  toast(c?`${c} tasks rescheduled +2 days 🌿`:'No deadlined tasks','ok');
}

function splitHeavy(){
  let c=0;
  for(let i=S.tasks.length-1;i>=0;i--){
    const t=S.tasks[i];
    if(!t.done&&t.duration>=2){
      const h=t.duration/2;
      S.tasks.splice(i+1,0,{...t,id:Date.now()+Math.random(),name:`Part 2: ${t.name}`,duration:h,suggestedStart:''});
      t.name=`Part 1: ${t.name}`;t.duration=h;c++;
    }
  }
  saveData();updateAll();toast(c?`Split ${c} heavy tasks ✂️`:'No 2h+ tasks to split');
}

function clearDone(){
  const b=S.tasks.length;S.tasks=S.tasks.filter(t=>!t.done);
  saveData();updateAll();toast(`Cleared ${b-S.tasks.length} done tasks 🗑`,'ok');
}

// ── HELPERS ──
function deadlineChip(t){
  if(!t.deadline)return'';
  const diff=Math.round((new Date(t.deadline)-new Date())/86400000);
  if(diff<0)return`<span class="chip co">Overdue ${Math.abs(diff)}d</span>`;
  if(diff<=2)return`<span class="chip cu">Due in ${diff}d</span>`;
  return`<span class="chip ck">Due ${new Date(t.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>`;
}

function computeStarts(){
  const di=new Date().getDay();
  const dk=DK[di===0?6:di-1];
  const free=S.schedule[dk]?.free||'';
  let sh=16;
  if(free){const m=free.match(/(\d{1,2})/);if(m)sh=parseInt(m[1]);}
  let cur=sh;
  S.tasks.filter(t=>!t.done).forEach(t=>{
    t.suggestedStart=`${cur.toString().padStart(2,'0')}:00`;
    cur=Math.min(23,cur+t.duration);
  });
}

function taskHTML(t,showStart=false){
  const start=showStart&&t.suggestedStart
    ?`<span class="st-tag">⏰ Start ${t.suggestedStart}</span>`:'';
  return`<div class="ti ${t.level} ${t.done?'done':''}" id="ti${t.id}">
    <button class="tck ${t.done?'on':''}" onclick="toggle(${t.id})"></button>
    <div class="tinf">
      <div class="tin">${t.name}${deadlineChip(t)}</div>
      <div class="tmt">${t.duration}h · ${t.level}${t.deadline?' · '+new Date(t.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'}):''}</div>
      ${start}
    </div>
  </div>`;
}

// ── PRIORITY MATRIX ──
function renderPriorityMatrix(){
  const p=S.tasks.filter(t=>!t.done);
  const now=new Date();
  // Q1: urgent+hard, Q2: urgent+easy, Q3: not urgent+easy, Q4: not urgent+hard
  const q1=[],q2=[],q3=[],q4=[];
  p.forEach(t=>{
    const urgent=t.deadline&&(new Date(t.deadline)-now)<864e5*3;
    const hard=t.level==='hard';
    if(urgent&&hard)q1.push(t);
    else if(urgent&&!hard)q2.push(t);
    else if(!urgent&&!hard)q3.push(t);
    else q4.push(t);
  });
  const renderQ=(el,tasks)=>{
    document.getElementById(el).innerHTML=tasks.map(t=>`<span class="mq-task">${t.name}</span>`).join('')||'<span style="color:var(--ink-f);font-size:.7rem">None</span>';
  };
  renderQ('mq1',q1);renderQ('mq2',q2);renderQ('mq3',q3);renderQ('mq4',q4);
}

// ══════════════════════════════════════
//   PENDING PAGE
// ══════════════════════════════════════
function setFilter(f,el){
  S.pendingFilter=f;
  document.querySelectorAll('.fb-pill').forEach(b=>b.classList.remove('act'));
  el.classList.add('act');
  renderPending();
}

function getFilteredPending(){
  const now=new Date();
  let tasks=S.tasks.filter(t=>!t.done);
  const sort=document.getElementById('sortSel')?.value||'deadline';
  switch(S.pendingFilter){
    case'overdue':  tasks=tasks.filter(t=>t.deadline&&new Date(t.deadline)<now);break;
    case'today':    tasks=tasks.filter(t=>t.deadline&&(new Date(t.deadline)-now)<864e5*3);break;
    case'easy':     tasks=tasks.filter(t=>t.level==='easy');break;
    case'medium':   tasks=tasks.filter(t=>t.level==='medium');break;
    case'hard':     tasks=tasks.filter(t=>t.level==='hard');break;
  }
  const lvlMap={hard:3,medium:2,easy:1};
  switch(sort){
    case'deadline':tasks.sort((a,b)=>(a.deadline?new Date(a.deadline):new Date('9999'))-(b.deadline?new Date(b.deadline):new Date('9999')));break;
    case'level':tasks.sort((a,b)=>(lvlMap[b.level]||1)-(lvlMap[a.level]||1));break;
    case'duration':tasks.sort((a,b)=>b.duration-a.duration);break;
    case'added':tasks.sort((a,b)=>new Date(b.created)-new Date(a.created));break;
  }
  return tasks;
}

function updatePendingPage(){
  computeStarts();
  const all=S.tasks;
  const pending=all.filter(t=>!t.done);
  const done=all.filter(t=>t.done);
  const overdue=pending.filter(t=>t.deadline&&new Date(t.deadline)<new Date());
  const soon=pending.filter(t=>t.deadline&&new Date(t.deadline)-new Date()<864e5*2&&new Date(t.deadline)>new Date());

  const total=all.length;
  const donePct=total>0?Math.round(done.length/total*100):0;
  const circumference=226.2;
  const offset=circumference-(donePct/100)*circumference;
  const arc=document.getElementById('arcFill');
  if(arc){arc.style.strokeDashoffset=offset;arc.setAttribute('stroke',donePct>60?'var(--sage)':donePct>30?'var(--amber)':'var(--rose)');}
  document.getElementById('arcNum').textContent=donePct+'%';
  document.getElementById('pndPendingCount').textContent=pending.length;
  document.getElementById('pndDoneCount').textContent=done.length;
  document.getElementById('pndOverdueCount').textContent=overdue.length;

  const ob=document.getElementById('overdueBanner');
  if(overdue.length>0){
    ob.style.display='';
    document.getElementById('overdueText').innerHTML=`You have <strong>${overdue.length} overdue task${overdue.length>1?'s':''}</strong>. That's okay — things come up. The kindest next step is picking just <strong>one</strong> to start, even for 10 minutes.`;
  }else{ob.style.display='none';}

  const ub=document.getElementById('upcomingBanner');
  if(soon.length>0&&overdue.length===0){
    ub.style.display='';
    document.getElementById('upcomingText').innerHTML=`⏰ <strong>${soon.length} task${soon.length>1?'s':''}</strong> due within 2 days: ${soon.map(t=>`<strong>${t.name}</strong>`).join(', ')}.`;
  }else{ub.style.display='none';}

  renderPending();
  renderPriorityMatrix();
  updatePendingBadge();
  if(document.getElementById('pndAITxt').querySelector('.shimmer')){loadPendingAdvice();}
}

function renderPending(){
  const filtered=getFilteredPending();
  const el=document.getElementById('pendingList');
  document.getElementById('pndShowCount').textContent=filtered.length;
  if(filtered.length===0){
    el.innerHTML=`<div class="pnd-empty">
      <span class="pe-icon">${S.pendingFilter==='all'?'🎉':'🔍'}</span>
      <p>${S.pendingFilter==='all'?'All clear! No pending tasks.':'No tasks match this filter.'}</p>
    </div>`;
    return;
  }
  el.innerHTML=filtered.map(t=>taskHTML(t,true)).join('');
}

async function loadPendingAdvice(){
  const el=document.getElementById('pndAITxt');
  el.innerHTML='<div class="shimmer" style="height:.85rem;margin-bottom:.4rem;width:82%"></div><div class="shimmer" style="height:.85rem;width:64%"></div>';
  try{
    const pending=S.tasks.filter(t=>!t.done);
    const overdue=pending.filter(t=>t.deadline&&new Date(t.deadline)<new Date());
    const reply=await callAI(null,`I have ${pending.length} pending tasks, ${overdue.length} overdue. Give a warm, practical 3-4 sentence note: which task should I start with and why? Name my actual tasks.`);
    el.innerHTML=reply.replace(/\n/g,'<br>');
  }catch(e){
    el.innerHTML='<em>Add your Claude API key in Settings to get personalised AI advice here. 🌱</em>';
  }
}

// ── UPDATE ALL PAGES ──
function updateHome(){
  const p=S.tasks.filter(t=>!t.done).length;
  const td=new Date().toISOString().split('T')[0];
  const done=S.tasks.filter(t=>t.done&&t.doneDate===td).length;
  document.getElementById('sPending').textContent=p;
  document.getElementById('sStreak').textContent=S.wellbeing.streak;
  document.getElementById('sDone').textContent=done;
  document.getElementById('homeName').textContent=S.settings.name;
  const gs=['Take a breath. Let\'s plan kindly.','You\'re doing better than you think.','One step at a time is enough.','Progress, not perfection.','Be gentle with yourself today.'];
  document.getElementById('homeGreet').textContent=gs[new Date().getDay()%gs.length];
  renderImpact();renderWeekChart();updateXP();checkApiKeyBanner();
}

function renderImpact(){
  const p=S.tasks.filter(t=>!t.done);
  const heavy=p.filter(t=>t.level==='hard').length;
  const bars=[
    {lbl:'Today',    pct:Math.min(100,p.filter(t=>!t.deadline||new Date(t.deadline)-new Date()<864e5*1.5).length*20)},
    {lbl:'Tomorrow', pct:Math.min(100,p.length*12+heavy*10)},
    {lbl:'This week',pct:Math.min(100,p.length*8+heavy*6)},
    {lbl:'Next week',pct:Math.max(5,100-p.length*10)}
  ];
  const cl=v=>v>65?'ib':v>40?'im':'ig';
  document.getElementById('impactBars').innerHTML=bars.map(b=>`
    <div class="imp-row">
      <span class="imp-lbl">${b.lbl}</span>
      <div class="imp-bg"><div class="imp-fill ${cl(b.pct)}" style="width:0%" data-w="${b.pct}%"></div></div>
      <span class="imp-pct">${b.pct}%</span>
    </div>`).join('');
  setTimeout(()=>document.querySelectorAll('.imp-fill').forEach(el=>el.style.width=el.dataset.w),50);
  const total=p.length;
  document.getElementById('impactMsg').textContent=total===0
    ?'🎉 Your week looks light and free. Great job staying on top of things.'
    :bars[0].pct>65
    ?`⚠️ ${total} pending tasks — starting even one today lightens tomorrow significantly.`
    :`You have ${total} task${total>1?'s':''} pending. Spread across the week, this feels manageable.`;
}

function renderWeekChart(){
  const logs=S.wellbeing.logs||[];
  const today=new Date();
  const mp={low:20,medium:58,high:92};
  const bars=DAYS.map((_,i)=>{
    const d=new Date(today);d.setDate(today.getDate()-today.getDay()+i+1);
    const ds=d.toISOString().split('T')[0];
    const log=logs.slice().reverse().find(l=>l.date&&l.date.startsWith(ds));
    return{h:log?mp[log.energy]:7,today:ds===today.toISOString().split('T')[0]};
  });
  document.getElementById('weekChart').innerHTML=bars.map((b,i)=>`
    <div class="wk-bw">
      <div class="wk-b" style="height:${b.h}%;background:${b.today?'var(--sage)':'var(--sage-l)'}"></div>
      <span class="wk-dl">${DAYS[i].slice(0,1)}</span>
    </div>`).join('');
}

function updateToday(){
  computeStarts();
  const p=S.tasks.filter(t=>!t.done);
  const el=document.getElementById('todayList');
  if(!p.length){
    el.innerHTML='<div style="text-align:center;padding:3rem;color:var(--ink-f)"><div style="font-size:2.3rem">🎉</div><p style="margin-top:.7rem;font-family:var(--fd);font-size:1rem">All clear! No pending tasks.</p></div>';
    return;
  }
  el.innerHTML=p.slice(0,6).map(t=>taskHTML(t,true)).join('');
  if(p.length>6)el.innerHTML+=`<p style="text-align:center;color:var(--ink-f);font-size:.8rem;margin-top:.7rem">+${p.length-6} more in Tasks</p>`;
  const overdue=p.filter(t=>t.deadline&&new Date(t.deadline)<new Date());
  const kc=document.getElementById('kindNoteCard');
  if(overdue.length){
    kc.style.display='';
    document.getElementById('kindNoteTxt').innerHTML=`You have ${overdue.length} task${overdue.length>1?'s':''} past their deadline — and that's okay. Even starting <strong>${overdue[0].name}</strong> for just 10 minutes counts as real progress today.`;
  }else{kc.style.display='none';}
}

function updateTasks(){
  const el=document.getElementById('taskList');
  if(!S.tasks.length){
    el.innerHTML='<div style="text-align:center;padding:3rem;color:var(--ink-f)"><div style="font-size:2.3rem">✨</div><p style="margin-top:.7rem">No tasks yet. Add something!</p></div>';
    return;
  }
  el.innerHTML=S.tasks.map(t=>taskHTML(t)).join('');
  populateTimerTasks();
}

function updateWellbeing(){
  document.getElementById('wStr').textContent=S.wellbeing.streak;
  document.getElementById('wLogs').textContent=S.wellbeing.logs.length;
  if(S.wellbeing.logs.length){
    const mp={low:1,medium:2,high:3};
    const avg=S.wellbeing.logs.reduce((s,l)=>s+(mp[l.energy]||2),0)/S.wellbeing.logs.length;
    document.getElementById('wAvg').textContent=avg<1.6?'😴':avg>2.3?'🔥':'⚡';
  }
  if(S.wellbeing.energy){
    document.querySelectorAll('.mb').forEach(b=>b.classList.remove('on'));
    document.getElementById('m-'+S.wellbeing.energy)?.classList.add('on');
  }
  document.getElementById('habitIn').value=S.wellbeing.habit||'';
  renderWbInsights();
}

function renderWbInsights(){
  const logs=S.wellbeing.logs,el=document.getElementById('wbInsights');
  if(!el)return;
  if(logs.length<2){el.innerHTML='<p style="color:var(--ink-f);font-size:.84rem">Log a few check-ins to see your patterns.</p>';return;}
  const recent=logs.slice(-7);
  const mp={low:1,medium:2,high:3};
  const avg=recent.reduce((s,l)=>s+(mp[l.energy]||2),0)/recent.length;
  const trend=logs.length>=2?(mp[logs.at(-1).energy]||2)-(mp[logs.at(-2).energy]||2):0;
  const items=[
    {icon:'📊',text:`Average energy (last 7 days): ${avg<1.6?'Low 😴 — rest is a priority right now':avg>2.3?'High 🔥 — great momentum!':'Moderate ⚡ — steady and consistent'}`},
    {icon:'📈',text:`Recent trend: ${trend>0?'Rising ↑ — keep going!':trend<0?'Dipping ↓ — be gentle with your task load':'Stable — consistency is underrated'}`},
    {icon:'💚',text:`You've checked in ${logs.length} times. ${logs.length>5?'You\'re building real self-awareness.':'Keep logging to see your patterns.'}`},
    {icon:'⭐',text:`Total XP earned: ${S.xp||0} — every task completed adds to your level!`}
  ];
  el.innerHTML=items.map(i=>`<div class="ins"><span class="ii">${i.icon}</span><span>${i.text}</span></div>`).join('');
}

function updateSchedView(){
  document.getElementById('schedView').innerHTML=DK.map((k,i)=>{
    const d=S.schedule[k]||{};
    return`<div class="db">
      <div class="dh">${DAYS[i]}</div>
      ${d.sleep?`<div class="ai"><span class="at">😴 Sleep</span><span>${d.sleep}</span></div>`:''}
      ${d.busy?`<div class="ai"><span class="at">📚 Busy</span><span>${d.busy}</span></div>`:''}
      ${d.free?`<div class="ai"><span class="at">🌿 Free</span><span>${d.free}</span></div>`:''}
      ${!d.sleep&&!d.busy&&!d.free?'<p style="color:var(--ink-f);font-size:.82rem">No schedule set</p>':''}
    </div>`;
  }).join('');
  renderGoals();
}

function updateAll(){
  updateHome();updateTasks();updateToday();updateWellbeing();updateSchedView();updatePendingBadge();
}

function updatePendingBadge(){
  const n=S.tasks.filter(t=>!t.done).length;
  const overdue=S.tasks.filter(t=>!t.done&&t.deadline&&new Date(t.deadline)<new Date()).length;
  const btn=document.querySelectorAll('.nb')[1];
  btn.querySelectorAll('.bdg').forEach(b=>b.remove());
  if(n>0){
    const b=document.createElement('span');
    b.className='bdg';
    b.textContent=overdue>0?`${overdue}!`:n;
    if(overdue>0)b.style.background='var(--rose)';
    btn.appendChild(b);
  }
}

// ── WELLBEING ──
function setMood(m){
  S.wellbeing.energy=m;
  document.querySelectorAll('.mb').forEach(b=>b.classList.remove('on'));
  document.getElementById('m-'+m)?.classList.add('on');
}
function logWellbeing(){
  if(!S.wellbeing.energy){toast('Pick an energy level first','err');return;}
  S.wellbeing.logs.push({energy:S.wellbeing.energy,date:new Date().toISOString()});
  S.wellbeing.streak++;
  const n=document.getElementById('wbNote').value;
  if(n)S.wellbeing.notes=n;
  addXP(20);
  saveData();updateWellbeing();toast('Check-in logged 💚 +1 streak +20XP','ok');loadWbNote();
}
function saveHabit(){S.wellbeing.habit=document.getElementById('habitIn').value.trim();saveData();toast('Habit saved 🌿','ok');}

// ── BREATHE WIDGET ──
let breatheTimer=null;
function startBreathe(){
  if(breatheTimer){clearInterval(breatheTimer);breatheTimer=null;
    const c=document.getElementById('breatheCircle');
    c.className='breathe-circle';c.textContent='Tap to start';
    document.getElementById('breatheLabel').textContent='';return;}
  const phases=[
    {t:4000,txt:'Breathe in...',cls:'in'},
    {t:7000,txt:'Hold...',cls:'in'},
    {t:8000,txt:'Breathe out slowly...',cls:'ex'}
  ];
  let idx=0;
  function runPhase(){
    const ph=phases[idx%phases.length];
    const c=document.getElementById('breatheCircle');
    c.className='breathe-circle '+ph.cls;
    c.textContent=ph.txt;
    document.getElementById('breatheLabel').textContent=`Cycle ${Math.floor(idx/3)+1} of 3`;
    idx++;
    if(idx>=9){setTimeout(()=>{c.className='breathe-circle';c.textContent='Done ✓';document.getElementById('breatheLabel').textContent='Great job! Feel calmer?';breatheTimer=null;addXP(5);},phases[(idx-1)%3].t);return;}
    breatheTimer=setTimeout(runPhase,ph.t);
  }
  runPhase();
}

// ── GOALS ──
function addGoal(){
  const v=document.getElementById('goalIn').value.trim();
  if(!v)return;
  S.goals=S.goals||[];
  S.goals.push({id:Date.now(),title:v,progress:0});
  document.getElementById('goalIn').value='';
  saveData();renderGoals();addXP(15);toast('Goal added! 🎯 +15XP','ok');
}
function renderGoals(){
  const el=document.getElementById('goalsList');if(!el)return;
  S.goals=S.goals||[];
  if(!S.goals.length){el.innerHTML='<p style="color:var(--ink-f);font-size:.84rem">No goals yet. Add one above!</p>';return;}
  el.innerHTML=S.goals.map(g=>`
    <div class="goal-card">
      <span class="goal-icon">🎯</span>
      <div class="goal-txt">
        <div class="goal-title">${g.title}</div>
        <div class="goal-prog"><div class="goal-bar" style="width:${g.progress}%"></div></div>
        <div style="font-size:.7rem;color:var(--ink-f);margin-top:.2rem">${g.progress}% complete</div>
        <div style="display:flex;gap:.3rem;margin-top:.4rem;flex-wrap:wrap">
          <button class="btn bg bxs" onclick="nudgeGoal(${g.id},-10)">−10%</button>
          <button class="btn bp bxs" onclick="nudgeGoal(${g.id},10)">+10%</button>
          <button class="btn ba bxs" onclick="nudgeGoal(${g.id},25)">+25%</button>
          <button class="btn br bxs" onclick="deleteGoal(${g.id})">✕</button>
        </div>
      </div>
    </div>`).join('');
}
function nudgeGoal(id,amt){
  const g=S.goals.find(x=>x.id===id);if(!g)return;
  g.progress=Math.max(0,Math.min(100,g.progress+amt));
  if(g.progress===100){celebrate();addXP(100);toast('Goal completed! 🎉 +100XP','ok');}
  saveData();renderGoals();
}
function deleteGoal(id){S.goals=S.goals.filter(x=>x.id!==id);saveData();renderGoals();}

// ── SETTINGS ──
function openSettings(){
  document.getElementById('sName').value=S.settings.name;
  document.getElementById('sApiKey').value=S.settings.apiKey||'';
  document.getElementById('thTgl').classList.toggle('on',S.settings.theme==='dark');
  openDlg('settingsDlg');
}
function saveSettings(){
  const n=document.getElementById('sName').value.trim();if(n)S.settings.name=n;
  const p=document.getElementById('sPass').value.trim();if(p.length>=4)S.settings.password=p;
  const k=document.getElementById('sApiKey').value.trim();if(k)S.settings.apiKey=k;
  saveData();closeDlg('settingsDlg');
  document.getElementById('homeName').textContent=S.settings.name;
  checkApiKeyBanner();toast('Settings saved ✅','ok');
}
function toggleTheme(){
  S.settings.theme=S.settings.theme==='light'?'dark':'light';
  applyTheme();saveData();
  document.getElementById('thTgl').classList.toggle('on',S.settings.theme==='dark');
}
function applyTheme(){document.documentElement.setAttribute('data-theme',S.settings.theme);}
function exportData(){
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'})),download:'kind-planner-backup.json'});
  a.click();toast('Data exported 📤','ok');
}
function clearAll(){if(confirm('Delete all data permanently?')){localStorage.removeItem('kpv5');location.reload();}}

// ── FOCUS TIMER ──
let TR={running:false,mode:'work',secs:25*60,iv:null,total:25*60};
function setMode(m){
  clearInterval(TR.iv);TR.running=false;TR.mode=m;
  const durations={work:25*60,break:5*60,long:15*60};
  TR.secs=TR.total=durations[m]||25*60;
  renderTimer();
  document.getElementById('tRing').classList.toggle('brk',m!=='work');
}
function renderTimer(){
  const m=Math.floor(TR.secs/60),s=TR.secs%60;
  document.getElementById('tNum').textContent=`${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  document.getElementById('tLbl').textContent=TR.running?(TR.mode==='work'?'Focus! 🎯':'Rest ☕'):'Tap to start';
  const pct=1-(TR.secs/TR.total);
  const color=TR.mode==='work'?'var(--sage)':TR.mode==='break'?'var(--amber)':'var(--lav)';
  document.getElementById('tRing').style.background=
    `conic-gradient(${color} ${pct*360}deg, var(--w2) ${pct*360}deg)`;
}
function toggleTimer(){
  if(TR.running){
    clearInterval(TR.iv);TR.running=false;
    document.getElementById('tLbl').textContent='Paused';
  }else{
    TR.running=true;
    TR.iv=setInterval(()=>{
      TR.secs--;renderTimer();
      if(TR.secs<=0){
        clearInterval(TR.iv);TR.running=false;
        if(TR.mode==='work'){
          S.focus.sessions++;S.focus.mins+=25;
          S.focus.best=Math.max(S.focus.best,S.focus.sessions);
          addXP(30);saveData();celebrate();
          toast('🎉 Session done! +30XP — take a break.','ok');
          getTimerInsight();
        }else{toast('Break over! Ready to focus 🎯','ok');}
        updateFocusPage();setMode(TR.mode==='work'?'break':'work');
      }
    },1000);
  }
  renderTimer();
}
function resetTimer(){clearInterval(TR.iv);TR.running=false;setMode(TR.mode);}
function updateFocusPage(){
  document.getElementById('fSess').textContent=S.focus.sessions;
  document.getElementById('fMins').textContent=S.focus.mins;
  document.getElementById('fBest').textContent=S.focus.best;
  populateTimerTasks();
}
function populateTimerTasks(){
  const sel=document.getElementById('tTaskSel');if(!sel)return;
  const p=S.tasks.filter(t=>!t.done);
  sel.innerHTML='<option value="">— Select a task —</option>'+p.map(t=>`<option value="${t.id}">${t.name} (${t.duration}h)</option>`).join('');
}

// ══════════════════════════════════════
//   REAL CLAUDE AI — LIVE API CALLS
// ══════════════════════════════════════
function buildCtx(){
  const p=S.tasks.filter(t=>!t.done);
  const done=S.tasks.filter(t=>t.done);
  const dk=DK[new Date().getDay()===0?6:new Date().getDay()-1];
  const sched=S.schedule[dk]||{};
  const logs=S.wellbeing.logs.slice(-7);
  const mp={low:1,medium:2,high:3};
  const avgE=logs.length?logs.reduce((s,l)=>s+(mp[l.energy]||2),0)/logs.length:2;
  const overdue=p.filter(t=>t.deadline&&new Date(t.deadline)<new Date());
  return`You are Sage, a warm and kind AI planning coach inside "Kind Planner". You speak like a caring, emotionally-aware friend — never scolding, never harsh, always honest. Keep responses concise (3-6 sentences) unless a detailed plan is requested. Use line breaks for readability. 

USER:
- Name: ${S.settings.name}
- Today: ${new Date().toDateString()}
- Schedule today: sleep=${sched.sleep||'not set'}, busy=${sched.busy||'not set'}, free=${sched.free||'not set'}
- Energy today: ${S.wellbeing.energy||'not logged yet'}
- Avg energy (7 days): ${avgE<1.6?'Low':avgE>2.3?'High':'Normal'}
- Streak: ${S.wellbeing.streak} days | XP: ${S.xp||0} | Focus sessions: ${S.focus.sessions}
- Habit to protect: ${S.wellbeing.habit||'none set'}

PENDING TASKS (${p.length}):
${p.slice(0,12).map(t=>`- "${t.name}" [${t.level}, ${t.duration}h${t.deadline?', due '+new Date(t.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'}):''}]`).join('\n')}
Overdue: ${overdue.length} | Completed total: ${done.length}

GOALS: ${(S.goals||[]).map(g=>`${g.title} (${g.progress}%)`).join(', ')||'none'}

PRINCIPLES:
- Never blame for missed tasks
- Reference actual task names when advising
- Suggest start times based on their free time window
- Be warm, practical and specific
- Celebrate wins and XP milestones`.trim();
}

async function callAI(inputMsgs, singlePrompt=null){
  const apiKey=S.settings.apiKey;
  if(!apiKey){
    return `Hi! 🌱 I'm Sage — your Kind Planner coach.\n\nTo unlock live AI advice, add your **free Claude API key**:\n1. Get one at console.anthropic.com (free tier available)\n2. Go to ⚙️ Settings → Claude API Key → paste it in\n3. I'll then give you real personalised coaching!\n\nFor now: be kind to yourself, and start with the smallest task on your list. You've got this. 🌿`;
  }
  // Build messages array — always ensure it's a valid non-empty array
  let messages;
  if(singlePrompt){
    messages=[{role:'user',content:singlePrompt}];
  }else if(Array.isArray(inputMsgs)&&inputMsgs.length>0){
    messages=inputMsgs;
  }else{
    messages=[{role:'user',content:'Hello, give me a brief warm greeting.'}];
  }
  const res=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-api-key':apiKey,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    },
    body:JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens:1024,
      system:buildCtx(),
      messages
    })
  });
  if(!res.ok){
    const err=await res.json().catch(()=>({}));
    if(res.status===401)throw new Error('Invalid API key — check Settings ⚙️');
    if(res.status===429)throw new Error('Rate limited — wait a moment and try again');
    throw new Error(err.error?.message||'API error '+res.status);
  }
  const data=await res.json();
  return data.content?.map(b=>b.text||'').join('')||'I had trouble responding. Please try again.';
}

// ── AI STREAMING helper for chat ──
async function callAIStream(inputMsgs, onChunk){
  const apiKey=S.settings.apiKey;
  if(!apiKey) return callAI(inputMsgs);
  // Ensure messages is always a valid array
  const messages=(Array.isArray(inputMsgs)&&inputMsgs.length>0)
    ? inputMsgs
    : [{role:'user',content:'Hello'}];
  const res=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-api-key':apiKey,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    },
    body:JSON.stringify({model: 'claude-sonnet-4-5-20250929',max_tokens:1024,stream:true,system:buildCtx(),messages})
  });
  if(!res.ok){
    const err=await res.json().catch(()=>({}));
    if(res.status===401)throw new Error('Invalid API key — check Settings ⚙️');
    throw new Error('API error '+res.status);
  }
  const reader=res.body.getReader();
  const dec=new TextDecoder();
  let full='';
  while(true){
    const{done,value}=await reader.read();
    if(done)break;
    const chunk=dec.decode(value);
    const lines=chunk.split('\n');
    for(const line of lines){
      if(line.startsWith('data:')){
        try{
          const d=JSON.parse(line.slice(5));
          if(d.type==='content_block_delta'&&d.delta?.text){
            full+=d.delta.text;
            onChunk(full);
          }
        }catch(e){}
      }
    }
  }
  return full;
}

// ── AI CALLS ──
async function loadDailyFeedback(){
  const el=document.getElementById('aiFeedTxt');
  el.innerHTML='<div class="shimmer" style="height:.85rem;margin-bottom:.42rem;width:88%"></div><div class="shimmer" style="height:.85rem;margin-bottom:.42rem;width:72%"></div><div class="shimmer" style="height:.85rem;width:56%"></div>';
  try{
    const reply=await callAI(null,`Give me a short warm daily note (4-5 sentences). Cover: how my current task load and energy look, one specific encouragement based on my actual tasks, and one gentle practical suggestion for today. Make it personal and mention my actual task names.`);
    el.innerHTML=reply.replace(/\n/g,'<br>');
    document.getElementById('aiStatusDot').textContent='● Live Claude AI ✓';
  }catch(e){
    el.innerHTML=`<em style="color:var(--ink-f)">${e.message||'Could not connect. Check your API key in Settings.'}</em>`;
  document.getElementById('aiStatusDot').textContent = '● Live Claude AI ✓';
  }
}

async function loadWbNote(){
  const el=document.getElementById('wbFeedTxt');
  el.innerHTML='<div class="shimmer" style="height:.85rem;margin-bottom:.4rem;width:84%"></div><div class="shimmer" style="height:.85rem;width:62%"></div>';
  try{
    const reply=await callAI(null,`My energy today is "${S.wellbeing.energy||'not set'}". Give me one warm sentence of encouragement and one very gentle, practical suggestion tailored to my energy level and pending tasks. Be specific and personal.`);
    el.innerHTML=reply.replace(/\n/g,'<br>');
  }catch(e){el.innerHTML='You\'re doing your best, and that\'s enough. 🌱';}
}

async function getTimerInsight(){
  const el=document.getElementById('timerIns');if(!el)return;
  try{
    const sel=document.getElementById('tTaskSel')?.value;
    const nm=sel?S.tasks.find(t=>t.id==sel)?.name||'your task':'a task';
    const reply=await callAI(null,`I just finished a 25-minute focus session working on "${nm}". I've done ${S.focus.sessions} sessions (${S.focus.mins} mins total). Give me 2 warm sentences: celebrate this win and tell me whether to take a break or continue based on my task load.`);
    el.innerHTML=reply.replace(/\n/g,'<br>');
  }catch(e){el.innerHTML='Great session! Take a 5-minute break — you\'ve earned it. 🌟';}
}

// ── BRAIN DUMP ──
async function processBrainDump(){
  const txt=document.getElementById('brainTxt').value.trim();
  if(!txt){toast('Write something first!','err');return;}
  const el=document.getElementById('brainResult');
  el.innerHTML='<div class="typ"><div class="dot"></div><div class="dot"></div><div class="dot"></div> Sage is sorting your thoughts…</div>';
  try{
    const reply=await callAI(null,`The user brain-dumped these thoughts: "${txt}"\n\nIdentify distinct tasks from this dump. For each task, determine: name (clear action), level (easy/medium/hard), duration in hours (0.5, 1, 1.5, 2, or 3). Respond ONLY with a JSON array like: [{"name":"task name","level":"easy","duration":0.5},...]. No explanation, just JSON.`);
    let tasks;
    try{
      const clean=reply.replace(/```json|```/g,'').trim();
      tasks=JSON.parse(clean);
    }catch(e){throw new Error('Could not parse tasks — try being more specific in your dump.');}
    tasks.forEach(t=>{
      S.tasks.unshift({id:Date.now()+Math.random(),name:t.name,level:t.level||'medium',duration:t.duration||1,deadline:'',done:false,doneDate:null,created:new Date().toISOString(),suggestedStart:''});
    });
    addXP(tasks.length*10);saveData();updateAll();
    el.innerHTML=`<div style="background:var(--sage-ghost);border:1px solid var(--sage-l);border-radius:var(--rs);padding:.9rem;margin-top:.5rem"><strong>✅ Sage added ${tasks.length} tasks from your brain dump!</strong><br><span style="font-size:.82rem;color:var(--ink-f)">+${tasks.length*10} XP earned</span></div>`;
    setTimeout(()=>{closeDlg('brainDlg');el.innerHTML='';document.getElementById('brainTxt').value='';},2500);
  }catch(e){
    el.innerHTML=`<span style="color:var(--rose);font-size:.84rem">Error: ${e.message}</span>`;
  }
}

// ── AI GENERATE DAY PLAN ──
async function aiGeneratePlan(){
  const card=document.getElementById('dayPlanCard');
  const el=document.getElementById('dayPlanTxt');
  card.style.display='';
  el.innerHTML='<div class="typ"><div class="dot"></div><div class="dot"></div><div class="dot"></div> Sage is building your personalized day plan…</div>';
  try{
    const dk=DK[new Date().getDay()===0?6:new Date().getDay()-1];
    const free=S.schedule[dk]?.free||'not set';
    const reply=await callAI(null,`Create a detailed, kind day plan for today. My free time: ${free}. Include: exact start times for each task, breaks, and my habit (${S.wellbeing.habit||'none'}). Format it as a clear hour-by-hour schedule. Be warm and realistic — don't overload me.`);
    el.innerHTML=reply.replace(/\n/g,'<br>');
    card.scrollIntoView({behavior:'smooth'});
  }catch(e){el.innerHTML=`<em style="color:var(--rose)">${e.message}</em>`;}
}

// ── CHAT ──
function initChat(){
  const el=document.getElementById('chatMsgs');
  if(el.children.length===0)
    addBubble('a',`Hi ${S.settings.name}! 🌱 I'm Sage. I know your schedule, tasks, energy, and even your XP level — so I can give you real, personalised advice.\n\nWhat's on your mind today?`);
  document.getElementById('chatStatusDot').textContent=S.settings.apiKey?'● Claude AI · live coaching':'● Add API key for live AI';
}
function addBubble(role,text){
  const el=document.getElementById('chatMsgs');if(!el)return;
  const d=document.createElement('div');
  d.className=`bbl ${role}`;
  d.innerHTML=text.replace(/\n/g,'<br>');
  el.appendChild(d);el.scrollTop=el.scrollHeight;
  return d;
}
async function sendMsg(){
  const input=document.getElementById('chatIn');
  const text=input.value.trim();if(!text)return;
  input.value='';addBubble('u',text);
  S.chatHistory.push({role:'user',content:text});
  
  // Streaming bubble
  const bubble=addBubble('a','');
  bubble.classList.add('streaming');
  
  try{
    if(S.settings.apiKey){
      await callAIStream(S.chatHistory.slice(-12),(partial)=>{
        bubble.innerHTML=partial.replace(/\n/g,'<br>');
        document.getElementById('chatMsgs').scrollTop=99999;
      });
      bubble.classList.remove('streaming');
      S.chatHistory.push({role:'assistant',content:bubble.textContent});
    }else{
      const reply=await callAI(S.chatHistory.slice(-12));
      bubble.classList.remove('streaming');
      bubble.innerHTML=reply.replace(/\n/g,'<br>');
      S.chatHistory.push({role:'assistant',content:reply});
    }
    if(S.chatHistory.length>24)S.chatHistory=S.chatHistory.slice(-24);
    saveData();
  }catch(e){
    bubble.classList.remove('streaming');
    bubble.innerHTML=`<em style="color:var(--rose)">Error: ${e.message}</em>`;
  }
}
function qa(text){document.getElementById('chatIn').value=text;go(4);setTimeout(sendMsg,80);}

async function aiPrioritise(){
  const p=S.tasks.filter(t=>!t.done);if(!p.length){toast('No tasks to prioritise!');return;}
  toast('Sage is thinking… 🌱');
  try{
    const dk=DK[new Date().getDay()===0?6:new Date().getDay()-1];
    const free=S.schedule[dk]?.free||'not set';
    const reply=await callAI(null,`My free time today is: ${free}. Which 2-3 specific tasks should I focus on today, in what order, and why? Be warm, practical, and name my actual tasks.`);
    S.tasks.sort((a,b)=>{
      const da=a.deadline?new Date(a.deadline)-Date.now():9e10;
      const db=b.deadline?new Date(b.deadline)-Date.now():9e10;
      const dm={hard:3,medium:2,easy:1};
      return da-db||(dm[b.level]||1)-(dm[a.level]||1);
    });
    saveData();updateToday();updateTasks();
    document.getElementById('kindNoteCard').style.display='';
    document.getElementById('kindNoteTxt').innerHTML=reply.replace(/\n/g,'<br>');
    toast('AI prioritised your tasks ✅','ok');
  }catch(e){toast(e.message||'Could not reach AI','err');}
}

async function aiAnalyseTasks(){
  const el=document.getElementById('aiRevCard');
  const ct=document.getElementById('aiRevTxt');
  el.style.display='';
  ct.innerHTML='<div class="typ"><div class="dot"></div><div class="dot"></div><div class="dot"></div> Sage is reviewing…</div>';
  try{
    const reply=await callAI(null,`Review all my tasks holistically. In 5-6 warm sentences: How heavy is my overall load? Which tasks might cause stress? Which 1-2 should I tackle first? Is anything worth breaking down or removing? Be honest but kind.`);
    ct.innerHTML=reply.replace(/\n/g,'<br>');el.scrollIntoView({behavior:'smooth'});
  }catch(e){ct.innerHTML=`<em style="color:var(--rose)">${e.message||'Could not reach AI right now.'}</em>`;}
}

async function weeklyReview(){
  const el=document.getElementById('wkRevTxt');
  el.innerHTML='<div class="typ"><div class="dot"></div><div class="dot"></div><div class="dot"></div> Generating your weekly review…</div>';
  try{
    const done=S.tasks.filter(t=>t.done).length;
    const pending=S.tasks.filter(t=>!t.done).length;
    const logs7=S.wellbeing.logs.slice(-7);
    const mp={low:1,medium:2,high:3};
    const avgE=logs7.length?logs7.reduce((s,l)=>s+(mp[l.energy]||2),0)/Math.max(1,logs7.length):2;
    const reply=await callAI(null,`My week: completed ${done} tasks, ${pending} still pending, ${logs7.length} wellbeing check-ins, average energy ${avgE<1.6?'low':avgE>2.3?'high':'normal'}, streak ${S.wellbeing.streak} days, ${S.xp} total XP.\n\nWrite a warm, honest weekly review (6-8 sentences):\n1. Celebrate what went well\n2. Gently note what could improve\n3. One specific focus for next week\n4. A kind closing thought\n\nBe genuinely helpful — not just cheerleader positivity.`);
    el.innerHTML=`<div class="ai-box"><div class="ai-txt">${reply.replace(/\n/g,'<br>')}</div></div>`;
  }catch(e){el.innerHTML=`<em style="color:var(--rose)">${e.message||'Could not generate review. Try again.'}</em>`;}
}

// ── KEYBOARD ──
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&document.activeElement.id==='loginPass')doLogin();
});