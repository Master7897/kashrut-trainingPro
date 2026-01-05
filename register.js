// =========================
// REGISTER FRONTEND (Connected)
// =========================

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlp-QnTsRIs2WJryZvAdBrwe1yVkzfEt8jAwWtPB4LqaIG__2vDH2XXHTyRr4TDsOomg/exec"; // TODO: paste your GAS Web App URL

const $ = (id) => document.getElementById(id);

const el = {
  step1: $("step1"),
  step2: $("step2"),
  step3: $("step3"),

  btnGoAdmin: $("btnGoAdmin"),
  btnInstallAdmin: $("btnInstallAdmin"),
  btnCopyQuizLink: $("btnCopyQuizLink"),
  installHint: $("installHint"),

  fullName: $("rabbiFullName"),
  personalId: $("rabbiPersonalId"),
  unit: $("rabbiUnit"),
  email: $("rabbiEmail"),
  phone: $("rabbiPhone"),

  btnSendOtp: $("btnSendOtp"),

  otpCode: $("otpCode"),
  btnVerifyOtp: $("btnVerifyOtp"),
  btnResendOtp: $("btnResendOtp"),

  kitchensGrid: $("kitchensGrid"),
  btnAddKitchen: $("btnAddKitchen"),
  btnFinishRegister: $("btnFinishRegister"),

  step1Error: $("step1Error"),
  step2Error: $("step2Error"),
  step3Error: $("step3Error"),

  step1Info: $("step1Info"),
  step2Info: $("step2Info"),

  step3Success: $("step3Success"),
};
const state = {
  rid: "",
  token: "",
  otpSession: "",
  verified: false,

  step3: { dirty:false, saving:false }
};
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

function setErr(node, msg){ node.hidden = !msg; node.textContent = msg || ""; }
function setInfo(node, msg){ node.hidden = !msg; node.textContent = msg || ""; }

function isEmailValid(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function isDigitsOnly(s){ return /^[0-9]+$/.test(s); }
function isRabbiIdValid7(s){ return /^[0-9]{7}$/.test(s); }
function normalizePhoneIL(raw){
  let d = String(raw || "").replace(/\D/g, ""); // רק ספרות
  if (!d) return "";
  // +9725XXXXXXXX  -> 05XXXXXXXX
  if (d.startsWith("972") && d.length === 12 && d[3] === "5") d = "0" + d.slice(3);
  // 5XXXXXXXX -> 05XXXXXXXX
  if (d.length === 9 && d[0] === "5") d = "0" + d;
  return d;
}
function isPhoneILValidDigits(d){
  return /^05\d{8}$/.test(String(d || ""));
}

function getBaseUrl(){
  const { origin, pathname } = window.location;
  const parts = pathname.split("/").filter(Boolean);
  parts.pop(); // remove register.html
  return `${origin}/${parts.join("/")}/`;
}

// ---------- JSONP API ----------
function apiCall(path, payload){
  const TIMEOUT_MS = 15000;

  return new Promise((resolve) => {
    if (!APPS_SCRIPT_URL){
      resolve({ ok:false, error:"SERVER_NOT_CONFIGURED" });
      return;
    }

    const cb = `__jsonp_cb_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    let done = false;
    let timerId = null;
    let script = null;

    const cleanup = () => {
      try { delete window[cb]; } catch {}
      if (timerId) { clearTimeout(timerId); timerId = null; }
      if (script && script.parentNode) script.parentNode.removeChild(script);
      script = null;
    };

    window[cb] = (data) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(data);
    };

    const req = encodeURIComponent(JSON.stringify({ path, payload }));
    const src = `${APPS_SCRIPT_URL}?callback=${cb}&req=${req}`;

    script = document.createElement("script");
    script.src = src;

    script.onerror = () => {
      if (done) return;
      done = true;
      cleanup();
      resolve({ ok:false, error:"NETWORK_ERROR" });
    };

    timerId = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      resolve({ ok:false, error:"TIMEOUT" });
    }, TIMEOUT_MS);

    document.body.appendChild(script);
  });
}
// ------------------------------
function kitchensAllFilled(){
  const inputs = Array.from(el.kitchensGrid.querySelectorAll("input"));
  return inputs.length > 0 && inputs.every(i => i.value.trim().length > 0);
}
function kitchensNoDuplicates(){
  const names = Array.from(el.kitchensGrid.querySelectorAll("input"))
    .map(i => i.value.trim())
    .filter(Boolean)
    .map(s => s.toLowerCase());
  return new Set(names).size === names.length;
}
function updateFinishEnabled(){
  if (state.step3.saving){
    el.btnFinishRegister.disabled = true;
    return;
  }
  const filled = kitchensAllFilled();
  const nodup = kitchensNoDuplicates();
  const can = state.step3.dirty && filled && nodup;
  el.btnFinishRegister.disabled = !can;

  if (!nodup) setErr(el.step3Error, "יש שמות מטבח כפולים. תקן/י לפני שמירה.");
  else if (el.step3Error.textContent.includes("כפולים")) setErr(el.step3Error, "");
}
function setStep3Dirty(on){
  state.step3.dirty = !!on;
  updateFinishEnabled();
}

function createKitchenRow(value=""){
  const wrap = document.createElement("div");
  wrap.className = "kitchen-item";

  const inp = document.createElement("input");
  inp.placeholder = "שם מטבח";
  inp.value = value;

  inp.addEventListener("input", () => {
    setStep3Dirty(true);
  });

  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn-del";
  del.textContent = "מחק";
  del.onclick = () => {
    wrap.remove();
    setStep3Dirty(true);
  };
  wrap.appendChild(inp);
  wrap.appendChild(del);
  return wrap;
}
function initKitchenGrid(){
  el.kitchensGrid.innerHTML = "";
  for (let i = 0; i < 4; i++) el.kitchensGrid.appendChild(createKitchenRow(""));
  state.step3.dirty = false;
  updateFinishEnabled(); // מכבה
}
function listKitchens(){
  const inputs = Array.from(el.kitchensGrid.querySelectorAll("input"));
  return inputs.map(i => i.value.trim()).filter(Boolean);
}

function lockStep1(disabled){
  [el.fullName, el.personalId, el.unit, el.email, el.phone].forEach(x => x.disabled = disabled);
  el.btnSendOtp.disabled = disabled;
}

function showStep(step){
  el.step1.hidden = step !== 1;
  el.step2.hidden = step !== 2;
  el.step3.hidden = step !== 3;
}

// Step 1: Send OTP
el.btnSendOtp.onclick = async () => {
  setErr(el.step1Error, "");
  setInfo(el.step1Info, "");

  const fullName = el.fullName.value.trim();
  const personalId = el.personalId.value.trim();
  const unit = el.unit.value.trim();
  const email = el.email.value.trim().toLowerCase();
  const phoneRaw = el.phone.value.trim();
  const phone = normalizePhoneIL(phoneRaw);

  if (!fullName) return setErr(el.step1Error, "נא למלא שם מלא.");
  if (!personalId) return setErr(el.step1Error, "נא למלא מספר אישי.");
  if (!isDigitsOnly(personalId)) return setErr(el.step1Error, "מספר אישי חייב להיות ספרות בלבד.");
  if (!isRabbiIdValid7(personalId)) return setErr(el.step1Error, "מספר אישי חייב להיות בדיוק 7 ספרות.");
  if (!unit) return setErr(el.step1Error, "נא למלא יחידה.");
  if (!email || !isEmailValid(email)) return setErr(el.step1Error, "נא להזין אימייל תקין.");
  if (phoneRaw && !isPhoneILValidDigits(phone)) return setErr(el.step1Error, "טלפון חייב להיות בפורמט 05X-XXXXXXX (אפשר גם בלי מקף).");
   

  lockStep1(true);
  setInfo(el.step1Info, "שולח קוד אימות למייל…");
  const r = await apiCall("register/sendOtp", {
    email,
    phone,
    personalId,
    otpSession: state.otpSession
  });
  lockStep1(false);
  if (!r.ok){
    setInfo(el.step1Info, "");
    if (r.error === "EMAIL_ALREADY_REGISTERED") return setErr(el.step1Error, "המייל כבר רשום במערכת.");
    if (r.error === "DUP_PHONE") return setErr(el.step1Error, "מספר הטלפון כבר קיים במערכת.");
    if (r.error === "DUP_PERSONAL_ID") return setErr(el.step1Error, "המספר האישי כבר קיים במערכת.");
    if (r.error === "BAD_PERSONAL_ID_7DIGITS") return setErr(el.step1Error, "מספר אישי חייב להיות בדיוק 7 ספרות.");
    if (r.error === "BAD_PHONE_FORMAT") return setErr(el.step1Error, "מספר הטלפון לא תקין. חובה 05X-XXXXXXX.");
    if (r.error === "TIMEOUT" || r.error === "NETWORK_ERROR")
      return setErr(el.step1Error, "בדוק את חיבור האינטרנט שלך, ונסה שוב");
    return setErr(el.step1Error, "שליחת קוד נכשלה (בדוק APPS_SCRIPT_URL / Deploy).");
  }
  state.otpSession = r.otpSession;
  setInfo(el.step1Info, "הקוד נשלח. בדוק/י את המייל.");
  showStep(2);
};
// Step 2: Verify OTP
el.btnVerifyOtp.onclick = async () => {
  setErr(el.step2Error, "");
  setInfo(el.step2Info, "");

  const code = el.otpCode.value.trim();
  if (!code || !isDigitsOnly(code)) return setErr(el.step2Error, "נא להזין קוד ספרות בלבד.");

  el.btnVerifyOtp.disabled = true;
  el.btnResendOtp.disabled = true;
  setInfo(el.step2Info, "מאמת קוד…");

  const email = el.email.value.trim().toLowerCase();

  const r = await apiCall("register/verifyOtp", { email, otpSession: state.otpSession, code });

  el.btnVerifyOtp.disabled = false;
  el.btnResendOtp.disabled = false;

  if (!r.ok){
    setInfo(el.step2Info, "");
    if (r.error === "TIMEOUT" || r.error === "NETWORK_ERROR")
      return setErr(el.step2Error, "בדוק את חיבור האינטרנט שלך, ונסה שוב");
    return setErr(el.step2Error, "קוד שגוי או פג תוקף. נסה שוב.");
  }

  state.verified = true;
  setInfo(el.step2Info, "אומת בהצלחה ✅");
  initKitchenGrid();
  showStep(3);
};

// Resend OTP
el.btnResendOtp.onclick = async () => {
  setErr(el.step2Error, "");
  setInfo(el.step2Info, "שולח קוד שוב…");

  const email = el.email.value.trim().toLowerCase();
  const r = await apiCall("register/resendOtp", { email, otpSession: state.otpSession });

  if (!r.ok){
    setInfo(el.step2Info, "");
    return setErr(el.step2Error, "שליחת קוד שוב נכשלה.");
  }
  state.otpSession = r.otpSession || state.otpSession;
  setInfo(el.step2Info, "נשלח ✅");
};
// Step 3: Add kitchen
el.btnAddKitchen.onclick = () => {
  el.kitchensGrid.appendChild(createKitchenRow(""));
  setStep3Dirty(true);
  updateFinishEnabled();
};
el.btnFinishRegister.onclick = async () => {
  setErr(el.step3Error, "");
  el.step3Success.hidden = true;

  if (!state.verified) return setErr(el.step3Error, "יש לבצע אימות לפני שמירה.");
  if (!kitchensAllFilled()) return setErr(el.step3Error, "נא למלא את כל שמות המטבחים (לא להשאיר ריק).");
  if (!kitchensNoDuplicates()) return setErr(el.step3Error, "יש שמות מטבח כפולים. תקן/י לפני שמירה.");

  if (state.step3.saving) return;
  state.step3.saving = true;

  const oldTxt = el.btnFinishRegister.textContent;
  el.btnFinishRegister.disabled = true;
  el.btnFinishRegister.textContent = "שומר…";

  try {
    const fullName = el.fullName.value.trim();
    const personalId = el.personalId.value.trim();
    const unit = el.unit.value.trim();
    const email = el.email.value.trim().toLowerCase();
    const phone = el.phone.value.trim();

    const kitchens = listKitchens();

    const r = await apiCall("register/finish", {
      fullName,
      personalId,
      unit,
      email,
      phone,
      kitchens,
      otpSession: state.otpSession,
      baseUrl: getBaseUrl()
    });

    if (!r || !r.ok){
      // הודעות שגיאה מדויקות
      if (r && r.error === "DUP_EMAIL") return setErr(el.step3Error, "המייל כבר רשום במערכת.");
      if (r && r.error === "DUP_PHONE") return setErr(el.step3Error, "מספר הטלפון כבר קיים במערכת.");
      if (r && r.error === "DUP_KITCHEN_NAME") return setErr(el.step3Error, "יש שמות מטבח כפולים. תקן/י לפני שמירה.");
      if (r && r.error === "OTP_NOT_VERIFIED") return setErr(el.step3Error, "האימות פג תוקף. חזר/י לשלב האימות.");
      if (r && (r.error === "TIMEOUT" || r.error === "NETWORK_ERROR"))
        return setErr(el.step3Error, "בדוק את חיבור האינטרנט שלך, ונסה שוב");
      return setErr(el.step3Error, "השמירה נכשלה. בדוק/י Deploy של Apps Script ונסו שוב.");
    }

    // הצלחה: לנעול עד שינוי הבא ולהציג אינדיקציה ברורה
    state.step3.dirty = false;
    updateFinishEnabled();

    el.step3Success.hidden = false;

    // לינקים (בהנחה שהשרת מחזיר rid/token)
    const rid = r.rid || "";
    const token = r.token || "";

    if (rid && token){
      const base = getBaseUrl();
      const adminLink = `${base}admin.html?rid=${encodeURIComponent(rid)}#token=${encodeURIComponent(token)}`;
      const quizLink  = `${base}index.html?rid=${encodeURIComponent(rid)}`;
    
      // כפתור: פתח ניהול
      el.btnGoAdmin.onclick = () => {
        window.location.href = adminLink;
      };
    
      // כפתור: העתק קישור לשאלון
      el.btnCopyQuizLink.onclick = async () => {
        const old = el.btnCopyQuizLink.textContent;
        try{
          await navigator.clipboard.writeText(quizLink);
          el.btnCopyQuizLink.textContent = "הועתק ✅";
        } catch {
          el.btnCopyQuizLink.textContent = "שגיאה בהעתקה ❌";
        }
        setTimeout(() => (el.btnCopyQuizLink.textContent = old), 2000);
      };
    
      // כפתור: התקנת קיצור דרך לניהול (PWA אם אפשר, אחרת הוראות)
      el.btnInstallAdmin.onclick = async () => {
        el.installHint.hidden = true;
    
        if (deferredInstallPrompt){
          deferredInstallPrompt.prompt();
          deferredInstallPrompt = null;
          return;
        }
    
        // אין install prompt → להציג הוראות קצרות
        el.installHint.hidden = false;
        el.installHint.textContent =
          "כדי ליצור קיצור דרך: " +
          "באנדרואיד (Chrome) לחצ/י ⋮ > הוסף למסך הבית. " +
          "באייפון (Safari) לחצ/י שיתוף ⤴︎ > Add to Home Screen. " +
          "העתקתי לך את הקישור ללוח.";
    
        try { await navigator.clipboard.writeText(adminLink); } catch {}
      };
    }
  } finally {
    state.step3.saving = false;
    el.btnFinishRegister.textContent = oldTxt;
    // אם הצליח – updateFinishEnabled ישאיר disabled כי dirty=false
    // אם נכשל – הכפתור יחזור לפי התנאים
    updateFinishEnabled();
  }
};
// initial UI
showStep(1);
initKitchenGrid();
