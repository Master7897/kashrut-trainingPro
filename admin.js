// =========================
// ADMIN FRONTEND (Connected)
// =========================

// ✅ הדבק כאן את כתובת ה-Web App (…/exec)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlp-QnTsRIs2WJryZvAdBrwe1yVkzfEt8jAwWtPB4LqaIG__2vDH2XXHTyRr4TDsOomg/exec"; // TODO: paste your GAS Web App URL

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

  btnCopyQuizLink: $("btnCopyQuizLink"),
};

function setErr(node, msg){ node.hidden = !msg; node.textContent = msg || ""; }
function setInfo(node, msg){ node.hidden = !msg; node.textContent = msg || ""; }

function getParams(){
  const p = new URLSearchParams(window.location.search);
  return {
    rid: p.get("rid") || "",
    token: p.get("token") || "",
  };
}

// ---------- JSONP API (works on GitHub Pages) ----------
function apiCall(path, payload){
  return new Promise((resolve) => {
    if (!APPS_SCRIPT_URL){
      resolve({ ok:false, error:"SERVER_NOT_CONFIGURED" });
      return;
    }
    const cb = `__jsonp_cb_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    window[cb] = (data) => {
      try { delete window[cb]; } catch {}
      script.remove();
      resolve(data);
    };

    const req = encodeURIComponent(JSON.stringify({ path, payload }));
    const src = `${APPS_SCRIPT_URL}?callback=${cb}&req=${req}`;

    const script = document.createElement("script");
    script.src = src;
    script.onerror = () => {
      try { delete window[cb]; } catch {}
      script.remove();
      resolve({ ok:false, error:"NETWORK_ERROR" });
    };
    document.body.appendChild(script);
  });
}
// -----------------------------------------------------
function createKitchenRow(value=""){
  const wrap = document.createElement("div");
  wrap.className = "kitchen-item";

  const inp = document.createElement("input");
  inp.placeholder = "שם מטבח";
  inp.value = value;

  inp.addEventListener("input", () => {
    setKitchensDirty(true);     // יש שינוי
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
function listKitchens(){
  return Array.from(el.kitchensGrid.querySelectorAll("input"))
    .map(i => i.value.trim())
    .filter(Boolean);
}
function kitchensAllFilled(){
  const inputs = Array.from(el.kitchensGrid.querySelectorAll("input"));
  return inputs.length > 0 && inputs.every(i => i.value.trim().length > 0);
}
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

  // נועל את הטאב הפעיל – לא לחיץ עד מעבר לטאב אחר
  el.tabKitchens.disabled = (name === "kitchens");
  el.tabSubmissions.disabled = (name === "subs");
  el.tabFeedback.disabled = (name === "fb");

  if (name === "kitchens"){
    el.tabKitchens.classList.add("active");
    el.panelKitchens.hidden = false;
  } else if (name === "subs"){
    el.tabSubmissions.classList.add("active");
    el.panelSubmissions.hidden = false;
  } else if (name === "fb"){
    el.tabFeedback.classList.add("active");
    el.panelFeedback.hidden = false;
  }
}
function getQuarterKey(d){
  const y = d.getFullYear();
  const q = Math.floor(d.getMonth() / 3) + 1; // 1..4
  return { y, q };
}

function nextQuarter(y, q){
  return (q === 4) ? { y: y + 1, q: 1 } : { y, q: q + 1 };
}

function quarterLabel(y, q){
  const map = {1:"א׳",2:"ב׳",3:"ג׳",4:"ד׳"};
  return `${y} רבעון ${map[q]}`;
}

function quarterStartMs(y, q){
  const m = (q - 1) * 3; // 0,3,6,9
  return new Date(y, m, 1, 0, 0, 0, 0).getTime();
}

function quarterEndMs(y, q){
  const nq = nextQuarter(y, q);
  return quarterStartMs(nq.y, nq.q);
}

// ✅ בונה 8 רבעונים אחרונים, בלי לדרוס בחירה קיימת
function buildQuarterOptions(){
  const prevValue = el.timeFilter.value || "";

  const now = new Date();
  const { y: nowY, q: nowQ } = getQuarterKey(now);

  const opts = [];
  let y = nowY, q = nowQ;

  for (let i = 0; i < 8; i++){
    opts.push({
      y, q,
      label: quarterLabel(y, q),
      startMs: quarterStartMs(y, q),
      endMs: quarterEndMs(y, q),
    });

    q--;
    if (q === 0){ q = 4; y--; }
  }

  el.timeFilter.innerHTML = "";
  for (const o of opts){
    const op = document.createElement("option");
    op.value = String(o.startMs);
    op.dataset.endMs = String(o.endMs);
    op.textContent = o.label;
    el.timeFilter.appendChild(op);
  }

  // ✅ אם הבחירה הקודמת עדיין קיימת – נשמר אותה
  if (prevValue && Array.from(el.timeFilter.options).some(o => o.value === prevValue)){
    el.timeFilter.value = prevValue;
  } else {
    // ✅ ברירת מחדל: הרבעון האחרון (הנוכחי) = הראשון ברשימה
    el.timeFilter.value = String(opts[0].startMs);
  }
}
function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function kitchensNoDuplicates(){
  const names = Array.from(el.kitchensGrid.querySelectorAll("input"))
    .map(i => i.value.trim())
    .filter(Boolean)
    .map(s => s.toLowerCase());
  return new Set(names).size === names.length;
}

function updateSaveEnabled(){
  if (state.kitchens.saving){
    el.btnSaveKitchens.disabled = true;
    return;
  }
  const canSave = state.kitchens.dirty && kitchensAllFilled() && kitchensNoDuplicates();
  el.btnSaveKitchens.disabled = !canSave;

  // הודעה בזמן אמת (רשות)
  if (!kitchensNoDuplicates()) setErr(el.kitchensError, "יש שמות מטבח כפולים — תקן/י לפני שמירה.");
  else if (el.kitchensError.textContent.includes("כפולים")) setErr(el.kitchensError, "");
}

function setKitchensDirty(on){
  state.kitchens.dirty = !!on;
  updateSaveEnabled();
}

function beginKitchensLoading(){
  state.kitchens.loading = true;
  el.btnAddKitchen.hidden = true;
  el.btnAddKitchen.disabled = true;

  el.btnSaveKitchens.hidden = true;      // לא מציגים בזמן טעינה
  el.btnSaveKitchens.disabled = true;

  el.tabKitchens.disabled = true;        // מונע ספאם קליקים בטאב עצמו
}

function endKitchensLoading(){
  state.kitchens.loading = false;

  el.btnAddKitchen.hidden = false;
  el.btnAddKitchen.disabled = false;

  // שמור מופיע אחרי טעינה אבל נשאר disabled עד שינוי
  el.btnSaveKitchens.hidden = false;
  el.btnSaveKitchens.disabled = !state.kitchens.dirty;

  el.tabKitchens.disabled = false;
}
function getBaseUrl(){
  const u = new URL(window.location.href);
  // הופך admin.html?rid=... ל"תיקייה" + index.html
  u.search = "";
  u.hash = "";
  u.pathname = u.pathname.replace(/admin\.html$/i, "");
  return u.toString();
}

el.btnCopyQuizLink.onclick = async () => {
  const old = el.btnCopyQuizLink.textContent;
  const quizUrl = `${getBaseUrl()}index.html?rid=${encodeURIComponent(rid)}`;

  try {
    await navigator.clipboard.writeText(quizUrl);
    el.btnCopyQuizLink.textContent = "הועתק ✅";
    setTimeout(() => (el.btnCopyQuizLink.textContent = old), 2000);
  } catch {
    el.btnCopyQuizLink.textContent = "לא הצלחתי להעתיק ❌";
    setTimeout(() => (el.btnCopyQuizLink.textContent = old), 2000);
  }
};

// ====== LOADERS ======
const { rid, token } = getParams();
const state = {
  profile: { fullName: "", email: "" },
  kitchens: { dirty: false, saving: false },
  activeTab: null,
};
async function loadProfile(){
  if (!rid || !token) return;

  const r = await apiCall("admin/getProfile", { rid, token });

  if (r && r.ok && r.profile){
    state.profile.fullName = r.profile.fullName || "";
    state.profile.email = r.profile.email || "";

        const meta = document.getElementById("adminMeta");
    if (meta){
      meta.textContent = `שלום הרב ${state.profile.fullName || ""}`;
      meta.hidden = false;
    }
    // אם עדיין יש לך שדה מייל ב-HTML (בינתיים) אפשר להשאיר שקט:
    if (el.fbEmail) el.fbEmail.value = state.profile.email || "";
  }
}
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
    // מחזירים UI למצב תקין גם במקרה כשל
    el.btnAddKitchen.hidden = false;
    el.btnAddKitchen.disabled = true;

    el.btnSaveKitchens.hidden = false;
    el.btnSaveKitchens.disabled = true;

    return setErr(el.kitchensError, "קישור ניהול לא תקין (חסר rid/token).");
  }

  setInfo(el.kitchensInfo, "טוען מטבחים…");

  const r = await apiCall("admin/getKitchens", { rid, token });

  if (!r || !r.ok){
    // סוף טעינה (כשל): מעלימים "טוען..."
    setInfo(el.kitchensInfo, "");

    // מאפשרים למשתמש לנסות שוב/להוסיף ידנית אם רוצים
    el.btnAddKitchen.hidden = false;
    el.btnAddKitchen.disabled = false;

    el.btnSaveKitchens.hidden = false;
    el.btnSaveKitchens.disabled = true;

    setKitchensDirty(false);
    return setErr(el.kitchensError, "טעינת מטבחים נכשלה.");
  }

  const kitchens = Array.isArray(r.kitchens) ? r.kitchens : [];

  if (kitchens.length === 0){
    el.kitchensGrid.appendChild(createKitchenRow(""));
    el.kitchensGrid.appendChild(createKitchenRow(""));
  } else {
    kitchens.forEach(k => el.kitchensGrid.appendChild(createKitchenRow(k)));
  }

  // סוף טעינה מוצלחת: מעלימים "טוען..."
  setInfo(el.kitchensInfo, "");

  // מציגים כפתורים אחרי טעינה
  el.btnAddKitchen.hidden = false;
  el.btnAddKitchen.disabled = false;

  el.btnSaveKitchens.hidden = false;
  el.btnSaveKitchens.disabled = true; // יופעל רק אחרי שינוי

  setKitchensDirty(false);
}
function parseRowDateMs(row){
  // מצפה ל-dateStr כמו "2025-12-24 10:22" או "2025-12-24"
  const s = String(row?.dateStr || "").trim();
  if (!s) return NaN;

  const datePart = s.split(" ")[0]; // yyyy-mm-dd
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!m) return NaN;

  const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
  return new Date(y, mo, d, 0, 0, 0, 0).getTime();
}
function rowToDateMs(row){
  // 1) אם השרת כבר מחזיר מספר
  if (Number.isFinite(row?.dateMs)) return Number(row.dateMs);

  // 2) אם יש dateISO "yyyy-mm-dd"
  const iso = String(row?.dateISO || "").trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (m) return new Date(+m[1], +m[2]-1, +m[3], 0, 0, 0, 0).getTime();

  // 3) dateStr "yyyy-mm-dd ..." או "dd/mm/yyyy"
  const s = String(row?.dateStr || "").trim();
  if (!s) return NaN;
  const datePart = s.split(" ")[0];

  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (m) return new Date(+m[1], +m[2]-1, +m[3], 0, 0, 0, 0).getTime();

  m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(datePart);
  if (m) return new Date(+m[3], +m[2]-1, +m[1], 0, 0, 0, 0).getTime();

  return NaN;
}

function formatDateDDMMYYYY(s){
  const str = String(s || "").trim();
  if (!str) return "";

  // אם זה ISO: yyyy-mm-dd
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  // אם זה ISO עם שעה: yyyy-mm-dd ...
  const part = str.split(" ")[0];
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(part);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  // אם כבר dd/mm/yyyy
  m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(part);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  return part; // fallback
}

async function refreshSubmissions(){
  setErr(el.subsError, "");
  setInfo(el.subsInfo, "");
  el.subsBody.innerHTML = "";

  if (!rid || !token) return setErr(el.subsError, "קישור ניהול לא תקין (חסר rid/token).");

  const opt = el.timeFilter.selectedOptions[0];
  const startMs = Number(el.timeFilter.value);
  const endMs = Number(opt?.dataset?.endMs || 0);

  el.btnRefreshSubs.disabled = true;
  el.btnRefreshSubs.textContent = "טוען…";

  const r = await apiCall("admin/listSubmissions", { rid, token, sinceMs: startMs });

  el.btnRefreshSubs.disabled = false;
  el.btnRefreshSubs.textContent = "רענן";

  if (!r || !r.ok){
    return setErr(el.subsError, "טעינה נכשלה.");
  }

  let rows = Array.isArray(r.rows) ? r.rows : [];

  // ✅ סינון רבעון אמיתי: start <= date < end
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
    const raw =
      row.dateISO ? row.dateISO :
      (String(row.dateStr || "").split(" ")[0] || "");

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
    email: state.profile.email,   // ← נמשך אוטומטית מהטבלה
    message
  });
  el.btnSendFeedback.disabled = false;
  el.btnSendFeedback.textContent = "שלח משוב";

  if (!r.ok) return setErr(el.fbError, "שליחה נכשלה.");

  el.fbSubject.value = "";
  el.fbMessage.value = "";
  setInfo(el.fbInfo, "נשלח ✅");
}

// ====== EVENTS ======
el.tabKitchens.onclick = async () => {
  showTab("kitchens");
  await loadKitchens();
};
el.tabSubmissions.onclick = async () => {
  showTab("subs");
  buildQuarterOptions();       // ✅ מתעדכן אוטומטית לפי תאריך נוכחי
  await refreshSubmissions();
};
el.tabFeedback.onclick = async () => {
  showTab("fb");
  // email נטען בפתיחה בכל מקרה
};

el.btnAddKitchen.onclick = () => {
  el.kitchensGrid.appendChild(createKitchenRow(""));
  setKitchensDirty(true);
  updateSaveEnabled();

  // פוקוס לשדה החדש
  const inputs = el.kitchensGrid.querySelectorAll("input");
  const last = inputs[inputs.length - 1];
  if (last) last.focus();
};
// ✅ SAVE: נעילה מלאה עד שינוי הבא
el.btnSaveKitchens.onclick = async () => {
  setErr(el.kitchensError, "");
  setInfo(el.kitchensInfo, "");

  if (!rid || !token) return setErr(el.kitchensError, "קישור ניהול לא תקין (חסר rid/token).");

  const kitchens = listKitchens();
  if (kitchens.length === 0) return setErr(el.kitchensError, "נא להזין לפחות מטבח אחד.");

  // ✅ LOCK מיד
  state.kitchens.saving = true;
  el.btnSaveKitchens.disabled = true;
  el.btnSaveKitchens.textContent = "שומר…";

  try {
    const r = await apiCall("admin/updateKitchens", { rid, token, kitchens });

    if (!r || !r.ok){
      setErr(el.kitchensError, "שמירה נכשלה.");
      // ✅ בכשל – מאפשרים ניסיון חוזר (בלי לחכות לשינוי)
      state.kitchens.saving = false;
      el.btnSaveKitchens.textContent = "שמור מטבחים";
      el.btnSaveKitchens.disabled = false;
      return;
    }

    setInfo(el.kitchensInfo, "נשמר ✅");

    // ✅ הצלחה: נשאר נעול עד שינוי הבא
    state.kitchens.dirty = false;
    el.btnSaveKitchens.textContent = "שמור מטבחים";
    el.btnSaveKitchens.disabled = true;
    state.kitchens.saving = false;

  } catch (e){
    setErr(el.kitchensError, "שמירה נכשלה.");
    state.kitchens.saving = false;
    el.btnSaveKitchens.textContent = "שמור מטבחים";
    el.btnSaveKitchens.disabled = false;
  }
};
el.btnRefreshSubs.onclick = refreshSubmissions;
// ✅ רענון אוטומטי כשמשנים רבעון
let subsRefreshing = false;

el.timeFilter.onchange = async () => {
  if (subsRefreshing) return;
  subsRefreshing = true;
  try {
    await refreshSubmissions();
  } finally {
    subsRefreshing = false;
  }
};

el.btnSendFeedback.onclick = sendFeedback;

// ====== INIT ======

hideAllPanels();       // ✅ אין ברירת מחדל
clearActiveTabs();     // ✅ אין כפתור לחוץ
buildQuarterOptions();
loadProfile();         // ✅ ימלא אימייל בטופס משוב
