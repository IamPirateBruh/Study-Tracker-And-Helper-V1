const STORAGE_KEY = "alStudyTrack.v1";

const defaultState = {
  profile: { name: "Student", year: 2027, examDate: "2027-08-01", goal: 20 },
  subjects: [
    { id: crypto.randomUUID(), name: "Combined Mathematics", code: "CM", progress: 32, confidence: 45 },
    { id: crypto.randomUUID(), name: "Physics", code: "PH", progress: 26, confidence: 40 },
    { id: crypto.randomUUID(), name: "Chemistry", code: "CH", progress: 21, confidence: 35 }
  ],
  tasks: [
    { id: crypto.randomUUID(), title: "Finish Trigonometry revision set", subject: "Combined Mathematics", due: todayISO(), priority: "high", done: false, notes: "Complete questions 1–25." },
    { id: crypto.randomUUID(), title: "Revise Mechanics formulas", subject: "Physics", due: addDaysISO(1), priority: "medium", done: false, notes: "" },
    { id: crypto.randomUUID(), title: "Organic Chemistry flash review", subject: "Chemistry", due: addDaysISO(3), priority: "low", done: false, notes: "" }
  ],
  schedule: [
    { id: crypto.randomUUID(), day: 1, time: "06:30", end: "07:30", subject: "Combined Mathematics", title: "Theory + worked examples" },
    { id: crypto.randomUUID(), day: 1, time: "17:00", end: "18:30", subject: "Physics", title: "Mechanics problems" },
    { id: crypto.randomUUID(), day: 1, time: "19:30", end: "20:15", subject: "Chemistry", title: "Organic revision" },
    { id: crypto.randomUUID(), day: 2, time: "06:30", end: "07:30", subject: "Physics", title: "Formula recall" },
    { id: crypto.randomUUID(), day: 2, time: "17:30", end: "19:00", subject: "Combined Mathematics", title: "Past paper" },
    { id: crypto.randomUUID(), day: 3, time: "06:30", end: "07:15", subject: "Chemistry", title: "Reaction revision" },
    { id: crypto.randomUUID(), day: 3, time: "18:00", end: "19:30", subject: "Combined Mathematics", title: "Differentiation practice" },
    { id: crypto.randomUUID(), day: 4, time: "17:00", end: "18:30", subject: "Physics", title: "Structured questions" },
    { id: crypto.randomUUID(), day: 5, time: "06:30", end: "07:30", subject: "Chemistry", title: "Timed questions" },
    { id: crypto.randomUUID(), day: 6, time: "09:00", end: "11:00", subject: "Combined Mathematics", title: "Weekly past paper" }
  ],
  studyLog: {},
  focus: { sessionsToday: 0, minutesToday: 0, lastDate: todayISO() },
  theme: "light"
};

let state = loadState();
let selectedDay = new Date().getDay() || 7;
let taskFilter = "all";
let timer = { running: false, seconds: 1500, modeMinutes: 25, interval: null };

function todayISO() { return new Date().toISOString().slice(0,10); }
function addDaysISO(days) { const d = new Date(); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); }
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultState);
    return {...structuredClone(defaultState), ...saved,
      profile:{...defaultState.profile,...saved.profile},
      focus:{...defaultState.focus,...saved.focus},
      subjects:saved.subjects || defaultState.subjects,
      tasks:saved.tasks || [],
      schedule:saved.schedule || [],
      studyLog:saved.studyLog || {}
    };
  } catch { return structuredClone(defaultState); }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function escapeHtml(v="") {
  return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-LK",{month:"short",day:"numeric"}).format(new Date(iso+"T00:00:00"));
}
function weekdayName(day) {
  return ["","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][day];
}
function durationMinutes(start,end) {
  const [h1,m1]=start.split(":").map(Number), [h2,m2]=end.split(":").map(Number);
  let mins=(h2*60+m2)-(h1*60+m1); if(mins<0) mins += 1440; return mins;
}
function minutesForDay(iso) { return Number(state.studyLog[iso] || 0); }
function startOfWeek(d=new Date()) {
  const copy=new Date(d); const day=copy.getDay()||7; copy.setDate(copy.getDate()-day+1); copy.setHours(0,0,0,0); return copy;
}
function notify(msg) {
  const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2200);
}
function navigate(page) {
  $$(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));
  $$(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
  const titles = {dashboard:"Dashboard",tasks:"Tasks & assignments",timetable:"Your timetable",subjects:"Subject tracker",focus:"Focus room",analytics:"Study analytics",settings:"Settings"};
  $("#pageTitle").textContent = page==="dashboard" ? `Good ${new Date().getHours()<12?"morning":new Date().getHours()<18?"afternoon":"evening"}, ${state.profile.name} 👋` : titles[page];
  if (page==="dashboard") renderDashboard();
  if (page==="tasks") renderTasks();
  if (page==="timetable") renderTimetable();
  if (page==="subjects") renderSubjects();
  if (page==="analytics") renderAnalytics();
  if (page==="settings") fillSettings();
  $("#sidebar").classList.remove("open");
}

$$("[data-page]").forEach(btn => btn.addEventListener("click",()=>navigate(btn.dataset.page)));

function renderTop() {
  const d = new Date();
  $("#todayLabel").textContent = new Intl.DateTimeFormat("en-LK",{weekday:"long",month:"long",day:"numeric"}).format(d);
  $("#pageTitle").textContent = `Good ${d.getHours()<12?"morning":d.getHours()<18?"afternoon":"evening"}, ${state.profile.name} 👋`;
  const exam = new Date(state.profile.examDate+"T00:00:00");
  const days = Math.max(0, Math.ceil((exam-new Date())/86400000));
  $("#statExam").textContent = days>999 ? "999+" : `${days}d`;
  $("#statExamLabel").textContent = `to A/L ${state.profile.year}`;
  $("#heroTitle").textContent = days>0 ? `${days} days to your A/L goal.` : "Your A/L journey starts here.";
  $("#todayMinutes").textContent = `${minutesForDay(todayISO())} min`;
  $("#statToday").textContent = `${minutesForDay(todayISO())}m`;
}

function renderDashboard() {
  renderTop();
  const today = new Date().getDay() || 7;
  const todayTasks = state.tasks.filter(t=>t.due===todayISO());
  const completedToday = todayTasks.filter(t=>t.done).length;
  $("#statTasks").textContent = `${completedToday}/${todayTasks.length}`;
  const completion = state.tasks.length ? Math.round(state.tasks.filter(t=>t.done).length/state.tasks.length*100) : 0;
  $("#statProgress").textContent = `${completion}%`;

  const weekStart = startOfWeek();
  let weekMinutes=0;
  for(let i=0;i<7;i++){ const d=new Date(weekStart); d.setDate(d.getDate()+i); weekMinutes+=minutesForDay(d.toISOString().slice(0,10)); }
  $("#weeklyGoalLabel").textContent = `${state.profile.goal}h`;
  $("#weeklyGoalBar").style.width = `${Math.min(100, weekMinutes/(state.profile.goal*60)*100)}%`;
  $("#weeklyGoalSub").textContent = `${Math.floor(weekMinutes/60)}h ${weekMinutes%60}m studied`;

  const sessions = state.schedule.filter(s=>s.day===today).sort((a,b)=>a.time.localeCompare(b.time));
  $("#todayPlanSub").textContent = sessions.length ? `${sessions.length} scheduled session${sessions.length===1?"":"s"}` : "Nothing scheduled yet";
  $("#todaySchedule").innerHTML = sessions.length ? sessions.slice(0,5).map(s=>`
    <div class="schedule-row"><div class="time">${s.time}–${s.end}</div><div class="schedule-dot"></div><div><strong>${escapeHtml(s.subject)}</strong><small>${escapeHtml(s.title)}</small></div><div class="duration">${durationMinutes(s.time,s.end)}m</div></div>`).join("") : `<div class="empty">No sessions for today. Add one to make the day intentional.</div>`;

  const total = state.tasks.length, done=state.tasks.filter(t=>t.done).length, deg=total?Math.round(done/total*360):0;
  $("#taskChart").innerHTML = `<div class="donut" style="--deg:${deg}deg"><div class="donut-center"><strong>${total?Math.round(done/total*100):0}%</strong><small>done</small></div></div><div class="legend"><div class="legend-item"><i class="legend-dot" style="background:var(--primary)"></i>${done} completed</div><div class="legend-item"><i class="legend-dot" style="background:#dbe4ef"></i>${total-done} remaining</div></div>`;

  $("#subjectProgress").innerHTML = state.subjects.map(s=>`
    <div class="subject-line"><div><div class="subject-line-top"><strong>${escapeHtml(s.name)}</strong><span>${s.progress}%</span></div><div class="progress-track"><div class="progress-bar" style="width:${s.progress}%"></div></div></div><span></span></div>
  `).join("") || `<div class="empty">Add your A/L subjects first.</div>`;

  const deadlines = [...state.tasks].filter(t=>!t.done).sort((a,b)=>(a.due||"").localeCompare(b.due||"")).slice(0,4);
  $("#upcomingDeadlines").innerHTML = deadlines.length ? deadlines.map(t=>`<div class="deadline"><div><strong>${escapeHtml(t.title)}</strong><small>${escapeHtml(t.subject)}</small></div><span class="date-badge">${formatDate(t.due)}</span></div>`).join("") : `<div class="empty">No pending deadlines 🎉</div>`;
}

function populateSubjectFilter() {
  $("#taskSubjectFilter").innerHTML = `<option value="all">All subjects</option>` + state.subjects.map(s=>`<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("");
}
function renderTasks() {
  populateSubjectFilter();
  const selectedSub=$("#taskSubjectFilter").value || "all";
  let tasks=[...state.tasks];
  const now=todayISO();
  if(taskFilter==="today") tasks=tasks.filter(t=>t.due===now);
  if(taskFilter==="upcoming") tasks=tasks.filter(t=>t.due>now && !t.done);
  if(taskFilter==="done") tasks=tasks.filter(t=>t.done);
  if(selectedSub!=="all") tasks=tasks.filter(t=>t.subject===selectedSub);
  tasks.sort((a,b)=>Number(a.done)-Number(b.done) || (a.due||"").localeCompare(b.due||""));
  $("#tasksList").innerHTML=tasks.length ? tasks.map(t=>`
    <div class="task-item ${t.done?"done":""}" data-id="${t.id}">
      <button class="task-check" onclick="toggleTask('${t.id}')">${t.done?"✓":""}</button>
      <div class="task-main"><strong>${escapeHtml(t.title)}</strong><small>${escapeHtml(t.subject)} · Due ${formatDate(t.due)}${t.notes?` · ${escapeHtml(t.notes)}`:""}</small></div>
      <div class="task-meta"><span class="priority ${t.priority}">${t.priority}</span><div class="task-actions"><button class="small-icon" onclick="editTask('${t.id}')">✎</button><button class="small-icon" onclick="deleteTask('${t.id}')">×</button></div></div>
    </div>`).join("") : `<div class="empty">No tasks in this view. Your future self approves. ✨</div>`;
}
window.toggleTask = (id)=>{const t=state.tasks.find(x=>x.id===id);if(t){t.done=!t.done;save();renderTasks();renderDashboard();notify(t.done?"Task completed!":"Task reopened.");}};
window.deleteTask = (id)=>{state.tasks=state.tasks.filter(x=>x.id!==id);save();renderTasks();renderDashboard();notify("Task deleted.");};
window.editTask = (id)=>openTaskModal(state.tasks.find(x=>x.id===id));

function openTaskModal(existing=null) {
  const subjects=state.subjects.map(s=>`<option value="${escapeHtml(s.name)}" ${existing?.subject===s.name?"selected":""}>${escapeHtml(s.name)}</option>`).join("");
  openModal(existing?"Edit task":"Add task", `
    <form id="taskForm">
      <div class="form-grid">
        <div class="form-field full"><label>Task title<input name="title" required value="${escapeHtml(existing?.title||"")}" placeholder="e.g. Finish 20 differentiation questions" /></label></div>
        <div class="form-field"><label>Subject<select name="subject">${subjects || `<option>General</option>`}</select></label></div>
        <div class="form-field"><label>Due date<input name="due" type="date" required value="${existing?.due||todayISO()}" /></label></div>
        <div class="form-field"><label>Priority<select name="priority"><option ${existing?.priority==="high"?"selected":""}>high</option><option ${existing?.priority==="medium"?"selected":""}>medium</option><option ${existing?.priority==="low"?"selected":""}>low</option></select></label></div>
        <div class="form-field full"><label>Notes<textarea name="notes" placeholder="Optional details">${escapeHtml(existing?.notes||"")}</textarea></label></div>
      </div>
      <div class="form-actions"><button type="button" class="secondary-btn" onclick="closeModal()">Cancel</button><button class="primary-btn">Save task</button></div>
    </form>`);
  $("#taskForm").addEventListener("submit",e=>{
    e.preventDefault(); const fd=new FormData(e.target); const data=Object.fromEntries(fd.entries());
    if(existing) Object.assign(existing,data); else state.tasks.push({id:crypto.randomUUID(),...data,done:false});
    save(); closeModal(); renderTasks(); renderDashboard(); notify(existing?"Task updated.":"Task added.");
  });
}

function renderWeekStrip() {
  const ws=startOfWeek(); const now=new Date(); const today = new Date().getDay()||7;
  $("#weekStrip").innerHTML = Array.from({length:7},(_,i)=>{
    const d=new Date(ws); d.setDate(d.getDate()+i); const day=i+1;
    return `<button class="day-chip ${day===selectedDay?"active":""}" onclick="selectDay(${day})"><small>${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}</small><strong>${d.getDate()}</strong></button>`;
  }).join("");
}
window.selectDay=(day)=>{selectedDay=day;renderTimetable();};
function renderTimetable() {
  renderWeekStrip();
  const sessions=state.schedule.filter(s=>s.day===selectedDay).sort((a,b)=>a.time.localeCompare(b.time));
  const total=sessions.reduce((sum,s)=>sum+durationMinutes(s.time,s.end),0);
  $("#daySummary").innerHTML=`<strong>${weekdayName(selectedDay)} · ${sessions.length} session${sessions.length===1?"":"s"}</strong><span>${Math.floor(total/60)}h ${total%60}m planned</span>`;
  $("#timetableGrid").innerHTML=sessions.length ? sessions.map(s=>`<article class="slot-card"><span class="slot-time">${s.time} — ${s.end}</span><h4>${escapeHtml(s.subject)}</h4><p>${escapeHtml(s.title)}</p><div class="slot-actions"><button class="small-icon" onclick="editSchedule('${s.id}')">✎</button><button class="small-icon" onclick="deleteSchedule('${s.id}')">×</button></div></article>`).join(""):`<div class="empty" style="grid-column:1/-1">No sessions planned for ${weekdayName(selectedDay)}.</div>`;
}
window.deleteSchedule=(id)=>{state.schedule=state.schedule.filter(x=>x.id!==id);save();renderTimetable();renderDashboard();notify("Session removed.");};
window.editSchedule=(id)=>openScheduleModal(state.schedule.find(x=>x.id===id));

function openScheduleModal(existing=null) {
  const subjects=state.subjects.map(s=>`<option value="${escapeHtml(s.name)}" ${existing?.subject===s.name?"selected":""}>${escapeHtml(s.name)}</option>`).join("");
  openModal(existing?"Edit session":"Add study session", `
    <form id="scheduleForm">
      <div class="form-grid">
        <div class="form-field"><label>Day<select name="day">${Array.from({length:7},(_,i)=>`<option value="${i+1}" ${Number(existing?.day||selectedDay)===i+1?"selected":""}>${weekdayName(i+1)}</option>`).join("")}</select></label></div>
        <div class="form-field"><label>Subject<select name="subject">${subjects || `<option>General</option>`}</select></label></div>
        <div class="form-field"><label>Start<input name="time" type="time" required value="${existing?.time||"17:00"}"/></label></div>
        <div class="form-field"><label>End<input name="end" type="time" required value="${existing?.end||"18:00"}"/></label></div>
        <div class="form-field full"><label>Session goal<input name="title" required value="${escapeHtml(existing?.title||"")}" placeholder="e.g. Past paper / theory / revision" /></label></div>
      </div>
      <div class="form-actions"><button type="button" class="secondary-btn" onclick="closeModal()">Cancel</button><button class="primary-btn">Save session</button></div>
    </form>`);
  $("#scheduleForm").addEventListener("submit",e=>{
    e.preventDefault(); const data=Object.fromEntries(new FormData(e.target).entries()); data.day=Number(data.day);
    if(existing) Object.assign(existing,data); else state.schedule.push({id:crypto.randomUUID(),...data});
    selectedDay=data.day; save(); closeModal(); renderTimetable(); renderDashboard(); notify(existing?"Session updated.":"Session added.");
  });
}

function renderSubjects() {
  $("#subjectsGrid").innerHTML = state.subjects.length ? state.subjects.map(s=>`
    <article class="subject-card">
      <div class="subject-header"><div><span class="subject-code">${escapeHtml(s.code)}</span><h3>${escapeHtml(s.name)}</h3><p>Confidence ${s.confidence}%</p></div><div class="score">${s.progress}%</div></div>
      <div class="progress-track"><div class="progress-bar" style="width:${s.progress}%"></div></div>
      <div class="subject-footer"><span>Syllabus completion</span><button class="text-btn" onclick="editSubject('${s.id}')">Edit</button></div>
    </article>`).join("") : `<div class="empty" style="grid-column:1/-1">Add your first subject.</div>`;
}
window.editSubject=(id)=>openSubjectModal(state.subjects.find(s=>s.id===id));
window.deleteSubject=(id)=>{const s=state.subjects.find(x=>x.id===id); state.subjects=state.subjects.filter(x=>x.id!==id); state.tasks=state.tasks.map(t=>t.subject===s.name?{...t,subject:"General"}:t); state.schedule=state.schedule.filter(x=>x.subject!==s.name); save();renderSubjects();renderDashboard();notify("Subject removed.");};

function openSubjectModal(existing=null) {
  openModal(existing?"Edit subject":"Add subject",`
    <form id="subjectForm"><div class="form-grid">
      <div class="form-field full"><label>Subject name<input name="name" required value="${escapeHtml(existing?.name||"")}" placeholder="e.g. ICT" /></label></div>
      <div class="form-field"><label>Short code<input name="code" required value="${escapeHtml(existing?.code||"SUB")}" maxlength="5" /></label></div>
      <div class="form-field"><label>Syllabus completed (%)<input name="progress" type="number" min="0" max="100" value="${existing?.progress??0}" /></label></div>
      <div class="form-field full"><label>Confidence (%)<input name="confidence" type="number" min="0" max="100" value="${existing?.confidence??0}" /></label></div>
    </div>
    <div class="form-actions">${existing?`<button type="button" class="danger-btn" onclick="deleteSubject('${existing.id}');closeModal()">Delete</button>`:""}<span style="flex:1"></span><button type="button" class="secondary-btn" onclick="closeModal()">Cancel</button><button class="primary-btn">Save subject</button></div></form>`);
  $("#subjectForm").addEventListener("submit",e=>{
    e.preventDefault(); const fd=Object.fromEntries(new FormData(e.target).entries()); fd.progress=Math.max(0,Math.min(100,Number(fd.progress)));fd.confidence=Math.max(0,Math.min(100,Number(fd.confidence)));
    if(existing){Object.assign(existing,fd)} else state.subjects.push({id:crypto.randomUUID(),...fd});
    save();closeModal();renderSubjects();renderTasks();renderDashboard();notify("Subject saved.");
  });
}

function renderAnalytics() {
  const ws=startOfWeek(); let arr=[];
  for(let i=0;i<7;i++){const d=new Date(ws);d.setDate(d.getDate()+i);arr.push({iso:d.toISOString().slice(0,10),label:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],min:minutesForDay(d.toISOString().slice(0,10))});}
  const total=arr.reduce((a,b)=>a+b.min,0), avg=Math.round(total/(arr.filter(x=>x.min>0).length||1));
  $("#analyticsWeek").textContent=`${Math.floor(total/60)}h ${total%60}m`; $("#analyticsAvg").textContent=`${avg}m`;
  const completion=state.tasks.length?Math.round(state.tasks.filter(t=>t.done).length/state.tasks.length*100):0; $("#analyticsCompletion").textContent=`${completion}%`;
  const best=arr.reduce((a,b)=>b.min>a.min?b:a,{min:0}); $("#analyticsBest").textContent=best.min?best.label:"—";
  const max=Math.max(60,...arr.map(x=>x.min));
  $("#barChart").innerHTML=arr.map(x=>`<div class="bar-col"><span>${x.min}m</span><div class="bar" style="height:${Math.max(3,x.min/max*85)}%"></div><small>${x.label}</small></div>`).join("");
  const priorities=[...state.subjects].sort((a,b)=>a.progress-b.progress).slice(0,5);
  $("#focusPriority").innerHTML=priorities.length?priorities.map(s=>`<div class="priority-item"><strong>${escapeHtml(s.name)}</strong><span>${s.progress}% complete · ${s.confidence}% confidence</span></div>`).join(""):`<div class="empty">Add subjects to see priorities.</div>`;
}

function setupFocus() {
  if(state.focus.lastDate!==todayISO()){state.focus={sessionsToday:0,minutesToday:0,lastDate:todayISO()};save();}
  $("#focusSessions").textContent=state.focus.sessionsToday;$("#focusMinutes").textContent=state.focus.minutesToday;
}
function updateTimerDisplay(){const m=Math.floor(timer.seconds/60).toString().padStart(2,"0"),s=(timer.seconds%60).toString().padStart(2,"0");$("#timerValue").textContent=`${m}:${s}`;}
function setTimer(minutes){clearInterval(timer.interval);timer.running=false;timer.modeMinutes=minutes;timer.seconds=minutes*60;$("#startTimer").textContent="Start focus";$("#timerStatus").textContent="Ready when you are";updateTimerDisplay();}
function startTimer(){
  if(timer.running){clearInterval(timer.interval);timer.running=false;$("#startTimer").textContent="Resume";$("#timerStatus").textContent="Paused";return;}
  timer.running=true;$("#startTimer").textContent="Pause";$("#timerStatus").textContent="In focus";
  timer.interval=setInterval(()=>{
    timer.seconds--; if(timer.seconds<=0){clearInterval(timer.interval);timer.running=false;
      if(timer.modeMinutes>=20){state.focus.sessionsToday++;state.focus.minutesToday+=timer.modeMinutes;state.studyLog[todayISO()]=minutesForDay(todayISO())+timer.modeMinutes;save();setupFocus();notify("Focus session complete. Nice work!");}
      $("#timerStatus").textContent="Session complete";$("#startTimer").textContent="Start again";timer.seconds=timer.modeMinutes*60;
    } updateTimerDisplay();
  },1000);
}

function openModal(title, body){$("#modalTitle").textContent=title;$("#modalBody").innerHTML=body;$("#modalBackdrop").classList.add("open");}
function closeModal(){$("#modalBackdrop").classList.remove("open");}
window.closeModal=closeModal;

function fillSettings(){ $("#settingsName").value=state.profile.name;$("#settingsYear").value=state.profile.year;$("#settingsExamDate").value=state.profile.examDate;$("#settingsGoal").value=state.profile.goal; }

$("#addTaskBtn").addEventListener("click",()=>openTaskModal());
$("#addScheduleBtn").addEventListener("click",()=>openScheduleModal());
$("#addSubjectBtn").addEventListener("click",()=>openSubjectModal());
$("#closeModal").addEventListener("click",closeModal);
$("#modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal();});
$("#taskSubjectFilter").addEventListener("change",renderTasks);
$$("[data-filter]").forEach(btn=>btn.addEventListener("click",()=>{$$("[data-filter]").forEach(b=>b.classList.remove("active"));btn.classList.add("active");taskFilter=btn.dataset.filter;renderTasks();}));

$("#startTimer").addEventListener("click",startTimer);$("#resetTimer").addEventListener("click",()=>setTimer(timer.modeMinutes));
$$("#focusModeTabs button").forEach(btn=>btn.addEventListener("click",()=>{$$("#focusModeTabs button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");setTimer(Number(btn.dataset.min));}));
$("#saveSettings").addEventListener("click",()=>{state.profile.name=$("#settingsName").value.trim()||"Student";state.profile.year=Number($("#settingsYear").value)||2027;state.profile.examDate=$("#settingsExamDate").value||addDaysISO(365);state.profile.goal=Math.max(1,Number($("#settingsGoal").value)||20);save();renderTop();renderDashboard();notify("Settings saved.");});
$("#themeToggle").addEventListener("click",()=>{state.theme=state.theme==="dark"?"light":"dark";document.body.classList.toggle("dark",state.theme==="dark");save();});
$("#profileButton").addEventListener("click",()=>navigate("settings"));
$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#exportData").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="al-studytrack-backup.json";a.click();URL.revokeObjectURL(a.href);});
$("#resetData").addEventListener("click",()=>{if(confirm("Reset all locally stored study data?")){localStorage.removeItem(STORAGE_KEY);state=loadState();renderAll();notify("Data reset.");}});
function renderAll(){document.body.classList.toggle("dark",state.theme==="dark");renderTop();renderDashboard();renderTasks();renderTimetable();renderSubjects();renderAnalytics();setupFocus();fillSettings();}
renderAll();
