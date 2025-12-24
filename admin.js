// =========================
// ADMIN FRONTEND (Step 1)
// Backend will be added next step (Apps Script)
// =========================

const APPS_SCRIPT_URL = ""; // TODO next step

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

function showTab(name){
  // buttons
  [el.tabKitchens, el.tabSubmissions, el.tabFeedback].forEach(b => b.classList.remove("active"));
  // panels
  el.panelKitchens.hidden = true;
  el.panelSubmissions.hidden = true;
  el.panelFeedback.hidden = true;

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

async function apiCall(path, payload){
  if (!APPS_SCRIPT_URL){
    return { ok:false, error:"SERVER_NOT_CONFIGURED" };
  }
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type":"text/plain;charset=utf-8" },
    body: JSON.stringify({ path, payload })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok:false, error:`HTTP_${res.status}`, data };
  return data;
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

// -------- init note
const { rid, token } = getParams();
el.adminNote.textContent = rid
  ? `מזהה רב: ${rid}  |  קישור זה אישי – שמרו עליו.`
  : `חסר rid בקישור. צריך לפתוח דרך קישור הניהול שנשלח במייל.`;

// -------- tabs
el.tabKitchens.onclick = () => showTab("kitchens");
el.tabSubmissions.onclick = () => showTab("subs");
el.tabFeedback.onclick = () => showTab("fb");

// -------- kitchens
el.btnAddKitchen.onclick = () => el.kitchensGrid.appendChild(createKitchenRow(""));

el.btnSaveKitchens.onclick = async () => {
  setErr(el.kitchensError, "");
  setInfo(el.kitchensInfo, "");

  if (!rid || !token) return setErr(el.kitchensError, "קישור ניהול לא תקין (חסר rid/token).");

  const kitchens = listKitchens();
  if (kitchens.length === 0) return setErr(el.kitchensError, "נא להזין לפחות מטבח אחד.");

  el.btnSaveKitchens.disabled = true;
  el.btnSaveKitchens.textContent = "שומר…";

  const result = await apiCall("admin/updateKitchens", { rid, token, kitchens });

  el.btnSaveKitchens.disabled = false;
  el.btnSaveKitchens.textContent = "שמור מטבחים";

  if (!result.ok){
    if (result.error === "SERVER_NOT_CONFIGURED"){
      setInfo(el.kitchensInfo, "מצב בדיקה: אין שרת מחובר עדיין (שלב הבא נחבר).");
      return;
    }
    return setErr(el.kitchensError, "שמירה נכשלה.");
  }

  setInfo(el.kitchensInfo, "נשמר ✅");
};

// -------- submissions
el.btnRefreshSubs.onclick = async () => {
  setErr(el.subsError, "");
  setInfo(el.subsInfo, "");
  el.subsBody.innerHTML = "";

  if (!rid || !token) return setErr(el.subsError, "קישור ניהול לא תקין (חסר rid/token).");

  const sinceMs = msFromFilter(el.timeFilter.value);

  el.btnRefreshSubs.disabled = true;
  el.btnRefreshSubs.textContent = "טוען…";

  const result = await apiCall("admin/listSubmissions", { rid, token, sinceMs });

  el.btnRefreshSubs.disabled = false;
  el.btnRefreshSubs.textContent = "רענן";

  if (!result.ok){
    if (result.error === "SERVER_NOT_CONFIGURED"){
      setInfo(el.subsInfo, "מצב בדיקה: אין שרת מחובר עדיין (שלב הבא נחבר).");
      return;
    }
    return setErr(el.subsError, "טעינה נכשלה.");
  }

  const rows = Array.isArray(result.rows) ? result.rows : [];
  if (rows.length === 0){
    setInfo(el.subsInfo, "אין תשובות בטווח הזמן שנבחר.");
    return;
  }

  for (const r of rows){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(r.fullName || "")}</td>
      <td>${escapeHtml(r.personalId || "")}</td>
      <td>${escapeHtml(r.kitchen || "")}</td>
      <td>${escapeHtml(r.dateStr || "")}</td>
    `;
    el.subsBody.appendChild(tr);
  }
};

// -------- feedback
el.btnSendFeedback.onclick = async () => {
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

  const result = await apiCall("admin/sendFeedback", { rid, token, subject, email, message });

  el.btnSendFeedback.disabled = false;
  el.btnSendFeedback.textContent = "שלח משוב";

  if (!result.ok){
    if (result.error === "SERVER_NOT_CONFIGURED"){
      setInfo(el.fbInfo, "מצב בדיקה: אין שרת מחובר עדיין (שלב הבא נחבר).");
      return;
    }
    return setErr(el.fbError, "שליחה נכשלה.");
  }

  el.fbSubject.value = "";
  el.fbMessage.value = "";
  setInfo(el.fbInfo, "נשלח ✅");
};

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// initial UI
showTab("kitchens");

// prefill kitchens grid with 4 rows for now (server will load later)
el.kitchensGrid.innerHTML = "";
el.kitchensGrid.appendChild(createKitchenRow(""));
el.kitchensGrid.appendChild(createKitchenRow(""));
el.kitchensGrid.appendChild(createKitchenRow(""));
el.kitchensGrid.appendChild(createKitchenRow(""));
