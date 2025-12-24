// =========================
// ADMIN FRONTEND (Connected)
// =========================

// ✅ הדבק כאן את כתובת ה-Web App (…/exec)
const APPS_SCRIPT_URL = ""; // TODO: paste your GAS Web App URL

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

  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn-del";
  del.textContent = "מחק";
  del.onclick = () => wrap.remove();

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

function msFromFilter(v){
  const n = (x) => x * 1000;
  if (v === "1h") return n(60*60);
  if (v === "2h") return n(2*60*60);
  if (v === "4h") return n(4*60*60);
  if (v === "8h") return n(8*60*60);
  if (v === "1d") return n(24*60*60);
  if (v === "2d") return n(2*24*60*60);
  if (v === "1w") return n(7*24*60*60);
  if (v === "1m") return n(30*24*60*60);
  if (v === "1y") return n(365*24*60*60);
  return n(24*60*60);
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ====== LOADERS ======
const { rid, token } = getParams();

async function loadProfile(){
  if (!rid || !token) return;

  const r = await apiCall("admin/getProfile", { rid, token });
  if (r && r.ok && r.profile){
    el.fbEmail.value = r.profile.email || "";
  }
}

async function loadKitchens(){
  setErr(el.kitchensError, "");
  setInfo(el.kitchensInfo, "");
  el.kitchensGrid.innerHTML = "";

  if (!rid || !token) return setErr(el.kitchensError, "קישור ניהול לא תקין (חסר rid/token).");

  setInfo(el.kitchensInfo, "טוען מטבחים…");
  const r = await apiCall("admin/getKitchens", { rid, token });

  if (!r.ok){
    setInfo(el.kitchensInfo, "");
    return setErr(el.kitchensError, "טעינת מטבחים נכשלה.");
  }

  const kitchens = Array.isArray(r.kitchens) ? r.kitchens : [];
  if (kitchens.length === 0){
    // fallback - allow start empty
    el.kitchensGrid.appendChild(createKitchenRow(""));
    el.kitchensGrid.appendChild(createKitchenRow(""));
    setInfo(el.kitchensInfo, "לא נמצאו מטבחים — ניתן להוסיף ולשמור.");
    return;
  }

  kitchens.forEach(k => el.kitchensGrid.appendChild(createKitchenRow(k)));
  setInfo(el.kitchensInfo, "נטען ✅");
}

async function refreshSubmissions(){
  setErr(el.subsError, "");
  setInfo(el.subsInfo, "");
  el.subsBody.innerHTML = "";

  if (!rid || !token) return setErr(el.subsError, "קישור ניהול לא תקין (חסר rid/token).");

  const sinceMs = msFromFilter(el.timeFilter.value);

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
      <td>${escapeHtml(row.dateStr || "")}</td>
    `;
    el.subsBody.appendChild(tr);
  }
}

async function sendFeedback(){
  setErr(el.fbError, "");
  setInfo(el.fbInfo, "");

  if (!rid || !token) return setErr(el.fbError, "קישור ניהול לא תקין (חסר rid/token).");

  const subject = el.fbSubject.value.trim();
  const email = el.fbEmail.value.trim();
  const message = el.fbMessage.value.trim();

  if (!subject) return setErr(el.fbError, "נא למלא נושא.");
  if (!email) return setErr(el.fbError, "נא למלא אימייל.");
  if (!message) return setErr(el.fbError, "נא למלא תוכן פנייה.");

  el.btnSendFeedback.disabled = true;
  el.btnSendFeedback.textContent = "שולח…";

  const r = await apiCall("admin/sendFeedback", { rid, token, subject, email, message });

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

el.btnAddKitchen.onclick = () => el.kitchensGrid.appendChild(createKitchenRow(""));

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
};

el.btnRefreshSubs.onclick = refreshSubmissions;
el.btnSendFeedback.onclick = sendFeedback;

// ====== INIT ======
el.adminNote.textContent = rid
  ? `מזהה רב: ${rid} | קישור זה אישי – שמרו עליו.`
  : `חסר rid בקישור. צריך לפתוח דרך קישור הניהול שנשלח במייל.`;

hideAllPanels();       // ✅ אין ברירת מחדל
clearActiveTabs();     // ✅ אין כפתור לחוץ

loadProfile();         // ✅ ימלא אימייל בטופס משוב
