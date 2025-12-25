// =========================
// ADMIN FRONTEND (Connected)
// =========================

// ✅ הדבק כאן את כתובת ה-Web App (…/exec)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlp-QnTsRIs2WJryZvAdBrwe1yVkzfEt8jAwWtPB4LqaIG__2vDH2XXHTyRr4TDsOomg/exec";

const $ = (id) => document.getElementById(id);

const el = {
  adminNote: $("adminNote"),

  tabKitchens: $("tabKitchens"),
  tabSubmissions: $("tabSubmissions"),
  tabFeedback: $("tabFeedback"),

  panelKitchens: $("panelKitchens"),
  panelSubmissions: $("panelSubmissions"),
  panelFeedback: $("panelFeedback"),

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
  fbEmail: $("fbEmail"),
  fbMessage: $("fbMessage"),
  btnSendFeedback: $("btnSendFeedback"),
  fbError: $("fbError"),
  fbInfo: $("fbInfo"),
};

function setErr(node, msg){ node.hidden = !msg; node.textContent = msg || ""; }
function setInfo(node, msg){ node.hidden = !msg; node.textContent = msg || ""; }

function getParams(){
  const p = new URLSearchParams(window.location.search);
  return { rid: p.get("rid") || "", token: p.get("token") || "" };
}

// ---------- JSONP API (works on GitHub Pages) ----------
function apiCall(path, payload){
  return new Promise((resolve) => {
    if (!APPS_SCRIPT_URL) return resolve({ ok:false, error:"SERVER_NOT_CONFIGURED" });

    const cb = `__jsonp_cb_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement("script");

    const cleanup = (data) => {
      try { delete window[cb]; } catch {}
      script.remove();
      resolve(data);
    };

    window[cb] = (data) => cleanup(data);

    const req = encodeURIComponent(JSON.stringify({ path, payload }));
    script.src = `${APPS_SCRIPT_URL}?callback=${cb}&req=${req}`;
    script.onerror = () => cleanup({ ok:false, error:"NETWORK_ERROR" });

    document.body.appendChild(script);
  });
}
// -----------------------------------------------------

const { rid, token } = getParams();

const state = {
  profile: { fullName: "", email: "" },
  kitchens: { dirty: false, saving: false },
  activeTab: null,
};

function clearActiveTabs(){
  [el.tabKitchens, el.tabSubmissions, el.tabFeedback].forEach(b => b.classList.remove("active"));
}
function hideAllPanels(){
  el.panelKitchens.hidden = true;
  el.panelSubmissions.hidden = true;
  el.panelFeedback.hidden = true;
}
function showTab(name){
  clearActiveTabs();
  hideAllPanels();
  state.activeTab = name;

  el.tabKitchens.disabled = (name === "kitchens");
  el.tabSubmissions.disabled = (name === "subs");
  el.tabFeedback.disabled = (name === "fb");

  if (name === "kitchens"){
    el.tabKitchens.classList.add("active");
    el.panelKitchens.hidden = false;
  } else if (name === "subs"){
    el.tabSubmissions.classList.add("active");
    el.panelSubmissions.hidden = false;
  } else {
    el.tabFeedback.classList.add("active");
    el.panelFeedback.hidden = false;
  }
}

// =========================
// Kitchens logic (FIX #1)
// =========================

function kitchenInputs(){
  return Array.from(el.kitchensGrid.querySelectorAll("input"));
}
function kitchensAllFilled(){
  const inputs = kitchenInputs();
  return inputs.length > 0 && inputs.every(i => i.value.trim().length > 0);
}
function listKitchensTrimmed(){
  return kitchenInputs().map(i => i.value.trim());
}
function setKitchensDirty(on){
  state.kitchens.dirty = !!on;
  updateSaveEnabled();
}
function updateSaveEnabled(){
  const canSave = !state.kitchens.saving && state.kitchens.dirty && kitchensAllFilled();
  el.btnSaveKitchens.disabled = !canSave;
}

function createKitchenRow(value=""){
  const wrap = document.createElement("div");
  wrap.className = "kitchen-item";

  const inp = document.createElement("input");
  inp.placeholder = "שם מטבח";
  inp.value = value;

  inp.addEventListener("input", () => {
    setKitchensDirty(true);      // יש שינוי
    // updateSaveEnabled() נקרא מבפנים
  });

  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn-del";
  del.textContent = "מחק";
  del.onclick = () => {
    wrap.remove();
    setKitchensDirty(true);
  };

  wrap.appendChild(inp);
  wrap.appendChild(del);
  return wrap;
}

// =========================
// Load profile
// =========================
async function loadProfile(){
  if (!rid || !token) return;

  const r = await apiCall("admin/getProfile", { rid, token });
  if (r && r.ok && r.profile){
    state.profile.fullName = r.profile.fullName || "";
    state.profile.email = r.profile.email || "";

    const meta = $("adminMeta");
    if (meta){
      meta.textContent = `שלום הרב ${state.profile.fullName || ""}`;
      meta.hidden = false;
    }
    if (el.fbEmail) el.fbEmail.value = state.profile.email || "";
  }
}

// =========================
// Kitchens load/save
// =========================
async function loadKitchens(){
  setErr(el.kitchensError, "");
  setInfo(el.kitchensInfo, "");
  el.kitchensGrid.innerHTML = "";

  // בזמן טעינה: מסתירים הוספה+שמירה
  el.btnAddKitchen.hidden = true;
  el.btnAddKitchen.disabled = true;
  el.btnSaveKitchens.hidden = true;
  el.btnSaveKitchens.disabled = true;

  if (!rid || !token){
    el.btnAddKitchen.hidden = false;
    el.btnAddKitchen.disabled = true;
    el.btnSaveKitchens.hidden = false;
    el.btnSaveKitchens.disabled = true;
    return setErr(el.kitchensError, "קישור ניהול לא תקין (חסר rid/token).");
  }

  const r = await apiCall("admin/getKitchens", { rid, token });
  if (!r || !r.ok){
    el.btnAddKitchen.hidden = false;
    el.btnAddKitchen.disabled = false;
    el.btnSaveKitchens.hidden = false;
    el.btnSaveKitchens.disabled = true;
    return setErr(el.kitchensError, "טעינת מטבחים נכשלה.");
  }

  const kitchens = Array.isArray(r.kitchens) ? r.kitchens : [];
  if (kitchens.length){
    kitchens.forEach(k => el.kitchensGrid.appendChild(createKitchenRow(String(k || ""))));
  } else {
    el.kitchensGrid.appendChild(createKitchenRow(""));
  }

  state.kitchens.dirty = false;
  state.kitchens.saving = false;

  el.btnAddKitchen.hidden = false;
  el.btnAddKitchen.disabled = false;

  el.btnSaveKitchens.hidden = false;
  el.btnSaveKitchens.textContent = "שמור מטבחים";
  updateSaveEnabled(); // <- יישאר disabled עד שינוי + הכל מלא
}

async function saveKitchens(){
  setErr(el.kitchensError, "");
  setInfo(el.kitchensInfo, "");

  if (!rid || !token) return setErr(el.kitchensError, "קישור ניהול לא תקין (חסר rid/token).");

  // חובה: כל השדות מלאים
  if (!kitchensAllFilled()){
    el.btnSaveKitchens.disabled = true;
    return setErr(el.kitchensError, "יש למלא את כל שמות המטבחים לפני שמירה.");
  }

  const kitchens = listKitchensTrimmed();
  if (kitchens.length === 0) return setErr(el.kitchensError, "נא להזין לפחות מטבח אחד.");

  state.kitchens.saving = true;
  el.btnSaveKitchens.disabled = true;
  el.btnSaveKitchens.textContent = "שומר…";

  try {
    const r = await apiCall("admin/updateKitchens", { rid, token, kitchens });
    if (!r || !r.ok){
      state.kitchens.saving = false;
      el.btnSaveKitchens.textContent = "שמור מטבחים";
      updateSaveEnabled(); // מאפשר ניסיון חוזר רק אם עדיין עומד בתנאים
      return setErr(el.kitchensError, "שמירה נכשלה.");
    }

    setInfo(el.kitchensInfo, "נשמר ✅");
    state.kitchens.dirty = false;
    state.kitchens.saving = false;
    el.btnSaveKitchens.textContent = "שמור מטבחים";
    updateSaveEnabled(); // יישאר disabled עד שינוי הבא
  } catch (e){
    state.kitchens.saving = false;
    el.btnSaveKitchens.textContent = "שמור מטבחים";
    updateSaveEnabled();
    setErr(el.kitchensError, "שמירה נכשלה.");
  }
}

// =========================
// Submissions
// =========================
function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[m]);
}
function rowToDateMs(row){
  // מנסה dateISO (YYYY-MM-DD...) או dateStr
  const raw = row && (row.dateISO || row.dateStr || "");
  const d = new Date(String(raw));
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : NaN;
}
function formatDateDDMMYYYY(raw){
  // raw יכול להיות YYYY-MM-DD או תאריך מלא; נשמור על DD-MM-YYYY
  const d = new Date(String(raw));
  if (!Number.isFinite(d.getTime())) return String(raw || "");
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

function buildQuarterOptions(){
  const sel = el.timeFilter;
  if (!sel) return;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0..11
  const q = Math.floor(m/3) + 1;

  sel.innerHTML = "";
  // 8 רבעונים אחרונים
  for (let i=0;i<8;i++){
    const idx = (q-1) - i;
    const yy = y + Math.floor(idx/4);
    const qq = ((idx%4)+4)%4 + 1;
    const opt = document.createElement("option");
    opt.value = `${yy}-Q${qq}`;
    opt.textContent = `${qq}/${yy}`;
    sel.appendChild(opt);
  }
}

function quarterRangeMs(quarterValue){
  // "2025-Q3"
  const m = /^(\d{4})-Q([1-4])$/.exec(String(quarterValue||""));
  if (!m) return { startMs: NaN, endMs: NaN };
  const yy = +m[1];
  const qq = +m[2];
  const startMonth = (qq-1)*3;
  const start = new Date(yy, startMonth, 1, 0,0,0,0).getTime();
  const end = new Date(yy, startMonth+3, 1, 0,0,0,0).getTime();
  return { startMs: start, endMs: end };
}

async function refreshSubmissions(){
  setErr(el.subsError, "");
  setInfo(el.subsInfo, "");
  el.subsBody.innerHTML = "";

  if (!rid || !token) return setErr(el.subsError, "קישור ניהול לא תקין (חסר rid/token).");

  const qv = el.timeFilter ? el.timeFilter.value : "";
  const { startMs, endMs } = quarterRangeMs(qv);

  const r = await apiCall("admin/getSubmissions", { rid, token });
  if (!r || !r.ok){
    return setErr(el.subsError, "טעינת תשובות נכשלה.");
  }

  let rows = Array.isArray(r.rows) ? r.rows : [];
  if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs){
    rows = rows.filter(row => {
      const ms = rowToDateMs(row);
      return Number.isFinite(ms) && ms >= startMs && ms < endMs;
    });
  }

  if (rows.length === 0){
    setInfo(el.subsInfo, "אין תשובות ברבעון שנבחר.");
    return;
  }

  for (const row of rows){
    const raw = row.dateISO ? row.dateISO : (String(row.dateStr || "").split(" ")[0] || "");
    const dateDDMMYYYY = formatDateDDMMYYYY(raw);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(row.fullName || "")}</td>
      <td>${escapeHtml(row.personalId || "")}</td>
      <td>${escapeHtml(row.kitchen || "")}</td>
      <td class="date-cell">${escapeHtml(dateDDMMYYYY)}</td>
    `;
    el.subsBody.appendChild(tr);
  }
}

// =========================
// Feedback
// =========================
async function sendFeedback(){
  setErr(el.fbError, "");
  setInfo(el.fbInfo, "");

  if (!rid || !token) return setErr(el.fbError, "קישור ניהול לא תקין (חסר rid/token).");

  const subject = el.fbSubject.value.trim();
  const message = el.fbMessage.value.trim();

  if (!subject) return setErr(el.fbError, "נא למלא נושא.");
  if (!message) return setErr(el.fbError, "נא למלא תוכן פנייה.");

  el.btnSendFeedback.disabled = true;
  el.btnSendFeedback.textContent = "שולח…";

  const r = await apiCall("admin/sendFeedback", {
    rid, token,
    subject,
    email: state.profile.email,
    message
  });

  el.btnSendFeedback.disabled = false;
  el.btnSendFeedback.textContent = "שלח משוב";

  if (!r || !r.ok) return setErr(el.fbError, "שליחה נכשלה.");

  el.fbSubject.value = "";
  el.fbMessage.value = "";
  setInfo(el.fbInfo, "נשלח ✅");
}

// =========================
// Events
// =========================
el.tabKitchens.onclick = async () => { showTab("kitchens"); await loadKitchens(); };
el.tabSubmissions.onclick = async () => { showTab("subs"); buildQuarterOptions(); await refreshSubmissions(); };
el.tabFeedback.onclick = async () => { showTab("fb"); };

el.btnAddKitchen.onclick = () => {
  el.kitchensGrid.appendChild(createKitchenRow(""));
  setKitchensDirty(true);
};

el.btnSaveKitchens.onclick = saveKitchens;

el.btnRefreshSubs.onclick = refreshSubmissions;

// ✅ רענון אוטומטי כשמשנים רבעון
let subsRefreshing = false;
el.timeFilter.onchange = async () => {
  if (subsRefreshing) return;
  subsRefreshing = true;
  try { await refreshSubmissions(); } finally { subsRefreshing = false; }
};

el.btnSendFeedback.onclick = sendFeedback;

// ====== INIT ======
hideAllPanels();
clearActiveTabs();
buildQuarterOptions();
loadProfile();
