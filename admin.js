const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlp-QnTsRIs2WJryZvAdBrwe1yVkzfEt8jAwWtPB4LqaIG__2vDH2XXHTyRr4TDsOomg/exec"; // TODO: paste your GAS Web App URL
const $ = (id)=>document.getElementById(id);
const el = {
  hello: $("adminHello"),
  tabKitchens: $("tabKitchens"),
  tabSubs: $("tabSubs"),
  tabFb: $("tabFb"),
  panelKitchens: $("panelKitchens"),
  panelSubs: $("panelSubs"),
  panelFb: $("panelFb"),
  kitchensGrid: $("kitchensGrid"),
  btnAddKitchen: $("btnAddKitchen"),
  btnSaveKitchens: $("btnSaveKitchens"),
  kitchensError: $("kitchensError"),
  kitchensInfo: $("kitchensInfo"),
  timeFilter: $("timeFilter"),
  btnRefreshSubs: $("btnRefreshSubs"),
  subsBody: $("subsBody"),
  subsError: $("subsError"),
  subsInfo: $("subsInfo"),
  fbSubject: $("fbSubject"),
  fbMessage: $("fbMessage"),
  btnSendFeedback: $("btnSendFeedback"),
  btnCopyQuizLink: $("btnCopyQuizLink"),
  fbError: $("fbError"),
  fbInfo: $("fbInfo"),
};
const qs = new URLSearchParams(location.search);
const rid = qs.get("rid") || "";
const token = qs.get("token") || "";
const state = {
  profile: null,
  kitchens: { dirty:false, saving:false }
};
function setErr(node,msg){ node.hidden=!msg; node.textContent=msg||""; }
function setInfo(node,msg){ node.hidden=!msg; node.textContent=msg||""; }
function apiCall(path,payload){
  return new Promise((resolve)=>{
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_")){
      resolve({ok:false,error:"SERVER_NOT_CONFIGURED"}); return;
    }
    const cb = `__jsonp_cb_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement("script");
    window[cb] = (data)=>{
      try{ delete window[cb]; }catch{}
      script.remove();
      resolve(data||{ok:false});
    };
    const req = encodeURIComponent(JSON.stringify({ path, payload }));
    script.src = `${APPS_SCRIPT_URL}?callback=${cb}&req=${req}`;
    script.onerror = ()=>{
      try{ delete window[cb]; }catch{}
      script.remove();
      resolve({ok:false,error:"NETWORK_ERROR"});
    };
    document.body.appendChild(script);
  });
}
function baseUrl(){
  const { origin, pathname } = window.location;
  const parts = pathname.split("/").filter(Boolean);
  parts.pop(); // admin.html
  return `${origin}/${parts.join("/")}/`;
}
function quizLink(){
  return `${baseUrl()}?rid=${encodeURIComponent(rid)}`;
}
function showTab(name){
  el.panelKitchens.hidden = name!=="k";
  el.panelSubs.hidden = name!=="s";
  el.panelFb.hidden = name!=="f";
}
function normalizeKitchenName(s){
  return String(s ?? "").trim().replace(/\s+/g," ").toLowerCase();
}
function kitchenInputs(){
  return Array.from(el.kitchensGrid.querySelectorAll("input"));
}
function kitchensAllFilled(){
  const ins = kitchenInputs();
  return ins.length>0 && ins.every(i=>i.value.trim().length>0);
}
function kitchensNoDuplicates(){
  const names = kitchenInputs().map(i=>normalizeKitchenName(i.value)).filter(Boolean);
  const set = new Set();
  for (const n of names){ if (set.has(n)) return false; set.add(n); }
  return true;
}
function listKitchens(){
  return kitchenInputs().map(i=>i.value.trim()).filter(Boolean);
}
function updateSaveEnabled(){
  if (state.kitchens.saving) return (el.btnSaveKitchens.disabled = true);
  if (!kitchensNoDuplicates()) setErr(el.kitchensError,"יש כפילות בשמות המטבחים.");
  else if (el.kitchensError.textContent==="יש כפילות בשמות המטבחים.") setErr(el.kitchensError,"");
  el.btnSaveKitchens.disabled = !(state.kitchens.dirty && kitchensAllFilled() && kitchensNoDuplicates());
}
function setDirty(on){
  state.kitchens.dirty = !!on;
  updateSaveEnabled();
}
function createKitchenRow(val=""){
  const wrap = document.createElement("div");
  wrap.style.display="flex";
  wrap.style.gap="10px";
  wrap.style.marginTop="10px";
  const inp = document.createElement("input");
  inp.placeholder="שם מטבח";
  inp.value = val;
  inp.addEventListener("input", ()=>{
    setInfo(el.kitchensInfo,"");
    setErr(el.kitchensError,"");
    setDirty(true);
  });
  const del = document.createElement("button");
  del.type="button";
  del.className="secondary";
  del.textContent="מחק";
  del.onclick = ()=>{
    wrap.remove();
    setDirty(true);
  };
  wrap.appendChild(inp);
  wrap.appendChild(del);
  return wrap;
}
// ---------- quarters ----------
function getQuarterKey(d){
  const y = d.getFullYear();
  const q = Math.floor(d.getMonth()/3)+1;
  return { y,q };
}
function quarterLabel(y,q){
  const map={1:"א׳",2:"ב׳",3:"ג׳",4:"ד׳"};
  return `${y} רבעון ${map[q]}`;
}
function quarterStartMs(y,q){
  const m=(q-1)*3;
  return new Date(y,m,1,0,0,0,0).getTime();
}
function nextQuarter(y,q){ return (q===4)?{y:y+1,q:1}:{y,q:q+1}; }
function quarterEndMs(y,q){
  const nq = nextQuarter(y,q);
  return quarterStartMs(nq.y,nq.q);
}
function buildQuarterOptions(){
  const prev = el.timeFilter.value || "";
  const now = new Date();
  let { y, q } = getQuarterKey(now);
  const opts=[];
  for (let i=0;i<8;i++){
    opts.push({ y,q, label:quarterLabel(y,q), start:quarterStartMs(y,q), end:quarterEndMs(y,q) });
    q--; if (q===0){ q=4; y--; }
  }
  el.timeFilter.innerHTML="";
  for (const o of opts){
    const op=document.createElement("option");
    op.value=String(o.start);
    op.dataset.endMs=String(o.end);
    op.textContent=o.label;
    el.timeFilter.appendChild(op);
  }
  if (prev && Array.from(el.timeFilter.options).some(o=>o.value===prev)) el.timeFilter.value=prev;
  else el.timeFilter.value=String(opts[0].start);
}
function escapeHtml(s){
  return String(s??"")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function formatDateDDMMYYYY(s){
  const str = String(s||"").trim();
  const part = str.split(" ")[0];
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(part);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(part);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return part;
}
function rowToDateMs(row){
  if (Number.isFinite(row?.dateMs)) return +row.dateMs;
  const iso = String(row?.dateISO||"").trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (m) return new Date(+m[1],+m[2]-1,+m[3],0,0,0,0).getTime();
  const s = String(row?.dateStr||"").trim();
  const part = s.split(" ")[0];
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(part);
  if (m) return new Date(+m[1],+m[2]-1,+m[3],0,0,0,0).getTime();
  m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(part);
  if (m) return new Date(+m[3],+m[2]-1,+m[1],0,0,0,0).getTime();
  return NaN;
}
// ---------- API actions ----------
async function loadProfile(){
  if (!rid || !token) return setErr(el.kitchensError,"קישור ניהול לא תקין (חסר rid/token).");
  const r = await apiCall("admin/getProfile", { rid, token });
  if (!r?.ok) return;
  state.profile = r.profile || null;
  if (state.profile?.fullName) el.hello.textContent = `שלום, ${state.profile.fullName}`;
}
function getRidFromUrl(){
  const qs = new URLSearchParams(location.search);
  return (qs.get("rid") || "").trim();
}

async function loadKitchens(){
  const rid = getRidFromUrl();
  const r = await apiCall("public/getKitchens", { rid });
  if (!r || !r.ok){
    el.kitchen.innerHTML = `<option value="">שגיאה בטעינת מטבחים</option>`;
    return;
  }
  setKitchenOptions(r.kitchens);
}
el.btnAddKitchen.onclick = ()=>{
  el.kitchensGrid.appendChild(createKitchenRow(""));
  setDirty(true);
};
el.btnSaveKitchens.onclick = async ()=>{
  setErr(el.kitchensError,""); setInfo(el.kitchensInfo,"");
  if (!rid || !token) return setErr(el.kitchensError,"קישור ניהול לא תקין (חסר rid/token).");
  if (!kitchensAllFilled()) return setErr(el.kitchensError,"יש שדה מטבח ריק.");
  if (!kitchensNoDuplicates()) return setErr(el.kitchensError,"יש כפילות בשמות המטבחים.");
  const kitchens = listKitchens();
  if (!kitchens.length) return setErr(el.kitchensError,"נא להזין לפחות מטבח אחד.");
  state.kitchens.saving = true;
  el.btnSaveKitchens.textContent="שומר…";
  updateSaveEnabled();
  try{
    const r = await apiCall("admin/updateKitchens", { rid, token, kitchens });
    if (!r?.ok) throw new Error("SAVE_FAILED");
    setInfo(el.kitchensInfo,"נשמר ✅");
    state.kitchens.dirty = false;
  }catch{
    setErr(el.kitchensError,"שמירה נכשלה.");
  }finally{
    state.kitchens.saving = false;
    el.btnSaveKitchens.textContent="שמור מטבחים";
    updateSaveEnabled();
  }
};
async function refreshSubmissions(){
  setErr(el.subsError,""); setInfo(el.subsInfo,""); el.subsBody.innerHTML="";
  if (!rid || !token) return setErr(el.subsError,"קישור ניהול לא תקין (חסר rid/token).");
  const opt = el.timeFilter.selectedOptions[0];
  const startMs = Number(el.timeFilter.value);
  const endMs = Number(opt?.dataset?.endMs || 0);
  el.btnRefreshSubs.disabled = true;
  el.btnRefreshSubs.textContent="טוען…";
  const r = await apiCall("admin/listSubmissions", { rid, token, sinceMs: startMs });
  el.btnRefreshSubs.disabled = false;
  el.btnRefreshSubs.textContent="רענן";
  if (!r?.ok) return setErr(el.subsError,"טעינה נכשלה.");
  let rows = Array.isArray(r.rows) ? r.rows : [];
  if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs>startMs){
    rows = rows.filter(row=>{
      const ms = rowToDateMs(row);
      return Number.isFinite(ms) && ms>=startMs && ms<endMs;
    });
  }
  if (!rows.length) return setInfo(el.subsInfo,"אין תשובות ברבעון שנבחר.");
  for (const row of rows){
    const raw = row.dateISO ? row.dateISO : (String(row.dateStr||"").split(" ")[0] || "");
    const ddmmyyyy = formatDateDDMMYYYY(raw);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(row.fullName||"")}</td>
      <td>${escapeHtml(row.personalId||"")}</td>
      <td>${escapeHtml(row.kitchen||"")}</td>
      <td>${escapeHtml(ddmmyyyy)}</td>
    `;
    el.subsBody.appendChild(tr);
  }
}
async function sendFeedback(){
  setErr(el.fbError,""); setInfo(el.fbInfo,"");
  if (!rid || !token) return setErr(el.fbError,"קישור ניהול לא תקין (חסר rid/token).");
  const subject = el.fbSubject.value.trim();
  const message = el.fbMessage.value.trim();
  if (!subject) return setErr(el.fbError,"נא למלא נושא.");
  if (!message) return setErr(el.fbError,"נא למלא תוכן.");
  el.btnSendFeedback.disabled = true;
  el.btnSendFeedback.textContent="שולח…";
  const r = await apiCall("admin/sendFeedback", {
    rid, token,
    subject,
    email: state.profile?.email || "",
    message
  });
  el.btnSendFeedback.disabled = false;
  el.btnSendFeedback.textContent="שלח משוב";
  if (!r?.ok) return setErr(el.fbError,"שליחה נכשלה.");
  el.fbSubject.value="";
  el.fbMessage.value="";
  setInfo(el.fbInfo,"נשלח ✅");
}
el.btnRefreshSubs.onclick = refreshSubmissions;
let subsRefreshing=false;
el.timeFilter.onchange = async ()=>{
  if (subsRefreshing) return;
  subsRefreshing=true;
  try{ await refreshSubmissions(); }finally{ subsRefreshing=false; }
};
el.btnSendFeedback.onclick = sendFeedback;
el.btnCopyQuizLink.onclick = async ()=>{
  setErr(el.fbError,""); setInfo(el.fbInfo,"");
  const link = quizLink();
  try{
    await navigator.clipboard.writeText(link);
    setInfo(el.fbInfo,"הקישור הועתק ✅");
  }catch{
    setInfo(el.fbInfo,link);
  }
};
// tabs
el.tabKitchens.onclick = async ()=>{ showTab("k"); await loadKitchens(); };
el.tabSubs.onclick = async ()=>{ showTab("s"); buildQuarterOptions(); await refreshSubmissions(); };
el.tabFb.onclick = ()=>{ showTab("f"); };
// init
(async ()=>{
  buildQuarterOptions();
  await loadProfile();
  showTab("k");
  await loadKitchens();
})();
