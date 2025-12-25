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
  inp.addEventListener("input", () => setKitchensDirty(true));
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
  const q = Math.floor(d.getMonth() / 3) + 1;
  return { y, q };
}

function quarterLabel(y, q){
  const map = {1:"א",2:"ב",3:"ג",4:"ד"};
  return `${y} רבעון ${map[q]}`;
}

function quarterStartMs(y, q){
  const m = (q - 1) * 3; // 0,3,6,9
  return new Date(y, m, 1, 0, 0, 0, 0).getTime();
}

function buildQuarterOptions(){
  // 8 רבעונים כולל הנוכחי (אחורה)
  const now = new Date();
  const { y: nowY, q: nowQ } = getQuarterKey(now);

  const opts = [];
  let y = nowY, q = nowQ;

  for (let i = 0; i < 8; i++){
    opts.push({ y, q, label: quarterLabel(y, q), startMs: quarterStartMs(y, q) });
    q--;
    if (q === 0){ q = 4; y--; }
  }

  // ממלא select (האחרון = הרבעון האחרון? אצלך "ברירת מחדל - הרבעון האחרון" = הרבעון הנוכחי/האחרון שעדיין קיים)
  el.timeFilter.innerHTML = "";
  for (const o of opts){
    const op = document.createElement("option");
    op.value = String(o.startMs); // נשמור startMs ב-value
    op.textContent = o.label;
    el.timeFilter.appendChild(op);
  }

  // ברירת מחדל: הרבעון האחרון (האופציה הראשונה ברשימה = הרבעון הנוכחי/האחרון)
  el.timeFilter.value = String(opts[0].startMs);
}
function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function setKitchensDirty(on){
  state.kitchens.dirty = !!on;
  // שמור מופיע רק אחרי טעינה, ומופעל רק אם יש שינוי
  el.btnSaveKitchens.disabled = !state.kitchens.dirty;
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

// ====== LOADERS ======
const { rid, token } = getParams();
const state = {
  profile: { fullName: "", email: "" }
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
async function refreshSubmissions(){
  setErr(el.subsError, "");
  setInfo(el.subsInfo, "");
  el.subsBody.innerHTML = "";

  if (!rid || !token) return setErr(el.subsError, "קישור ניהול לא תקין (חסר rid/token).");
  const sinceMs = Number(el.timeFilter.value) || quarterStartMs(new Date().getFullYear(), Math.floor(new Date().getMonth()/3)+1);
  el.btnRefreshSubs.disabled = true;
  el.btnRefreshSubs.textContent = "טוען…";

  const r = await apiCall("admin/listSubmissions", { rid, token, sinceMs });

  el.btnRefreshSubs.disabled = false;
  el.btnRefreshSubs.textContent = "רענן";

  if (!r.ok){
    return setErr(el.subsError, "טעינה נכשלה.");
  }

  const rows = Array.isArray(r.rows) ? r.rows : [];
  if (rows.length === 0){
    setInfo(el.subsInfo, "אין תשובות בטווח הזמן שנבחר.");
    return;
  }

  for (const row of rows){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(row.fullName || "")}</td>
      <td>${escapeHtml(row.personalId || "")}</td>
      <td>${escapeHtml(row.kitchen || "")}</td>
      <td class="date-cell" dir="ltr">${escapeHtml((row.dateStr || "").split(" ")[0])}</td>
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
  // לא טוען אוטומטית בלי רענן? אפשר כן/לא.
  // אני משאיר קל: נטען מיד.
  await refreshSubmissions();
};

el.tabFeedback.onclick = async () => {
  showTab("fb");
  // email נטען בפתיחה בכל מקרה
};

el.btnAddKitchen.onclick = () => {
  el.kitchensGrid.appendChild(createKitchenRow(""));
  setKitchensDirty(true);
};
el.btnSaveKitchens.onclick = async () => {
  setErr(el.kitchensError, "");
  setInfo(el.kitchensInfo, "");

  if (!rid || !token) return setErr(el.kitchensError, "קישור ניהול לא תקין (חסר rid/token).");

  const kitchens = listKitchens();
  if (kitchens.length === 0) return setErr(el.kitchensError, "נא להזין לפחות מטבח אחד.");

  el.btnSaveKitchens.disabled = true;
  el.btnSaveKitchens.textContent = "שומר…";

  const r = await apiCall("admin/updateKitchens", { rid, token, kitchens });

  el.btnSaveKitchens.disabled = false;
  el.btnSaveKitchens.textContent = "שמור מטבחים";

  if (!r.ok) return setErr(el.kitchensError, "שמירה נכשלה.");

  setInfo(el.kitchensInfo, "נשמר ✅");
  // verify: טוען שוב מהשרת כדי לוודא שזה נשמר באמת
  const v = await apiCall("admin/getKitchens", { rid, token });
  if (v && v.ok){
    const serverList = (Array.isArray(v.kitchens) ? v.kitchens : []).join("||");
    const localList = kitchens.join("||");
    if (serverList !== localList){
      setErr(el.kitchensError, "נשמר חלקית/לא עודכן בשרת. נסה שוב.");
    }
  }
  setKitchensDirty(false);
};

el.btnRefreshSubs.onclick = refreshSubmissions;
el.btnSendFeedback.onclick = sendFeedback;

// ====== INIT ======

hideAllPanels();       // ✅ אין ברירת מחדל
clearActiveTabs();     // ✅ אין כפתור לחוץ
buildQuarterOptions();
loadProfile();         // ✅ ימלא אימייל בטופס משוב
