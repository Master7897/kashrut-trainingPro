// =========================
// REGISTER FRONTEND (Connected)
// =========================

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlp-QnTsRIs2WJryZvAdBrwe1yVkzfEt8jAwWtPB4LqaIG__2vDH2XXHTyRr4TDsOomg/exec"; // TODO: paste your GAS Web App URL

const $ = (id) => document.getElementById(id);

const el = {
  step1: $("step1"),
  step2: $("step2"),
  step3: $("step3"),

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
  adminLinkBox: $("adminLinkBox"),
  quizLinkBox: $("quizLinkBox"),
};
const state = {
  rid: "",
  token: "",
  otpSession: "",
  verified: false,

  step3: { dirty:false, saving:false }
};
function setErr(node, msg){ node.hidden = !msg; node.textContent = msg || ""; }
function setInfo(node, msg){ node.hidden = !msg; node.textContent = msg || ""; }

function isEmailValid(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function isDigitsOnly(s){ return /^[0-9]+$/.test(s); }
function isRabbiIdValid7(s){ return /^[0-9]{7}$/.test(s); }

function getBaseUrl(){
  const { origin, pathname } = window.location;
  const parts = pathname.split("/").filter(Boolean);
  parts.pop(); // remove register.html
  return `${origin}/${parts.join("/")}/`;
}

// ---------- JSONP API ----------
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
  const phone = el.phone.value.trim();

  if (!fullName) return setErr(el.step1Error, "נא למלא שם מלא.");
  if (!personalId) return setErr(el.step1Error, "נא למלא מספר אישי.");
  if (!isDigitsOnly(personalId)) return setErr(el.step1Error, "מספר אישי חייב להיות ספרות בלבד.");
  if (!isRabbiIdValid7(personalId)) return setErr(el.step1Error, "מספר אישי חייב להיות בדיוק 7 ספרות.");
  if (!unit) return setErr(el.step1Error, "נא למלא יחידה.");
  if (!email || !isEmailValid(email)) return setErr(el.step1Error, "נא להזין אימייל תקין.");

  lockStep1(true);
  setInfo(el.step1Info, "שולח קוד אימות למייל…");

  const r = await apiCall("register/sendOtp", { email, otpSession: state.otpSession });

  lockStep1(false);
  if (!r.ok){
    setInfo(el.step1Info, "");
    if (r.error === "EMAIL_ALREADY_REGISTERED") {
      return setErr(el.step1Error, "המייל כבר רשום במערכת. אם צריך לשחזר גישה – פנה/י לתמיכה.");
    }
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
      otpSession: state.otpSession
    });

    if (!r || !r.ok){
      // הודעות שגיאה מדויקות
      if (r && r.error === "DUP_EMAIL") return setErr(el.step3Error, "המייל כבר רשום במערכת.");
      if (r && r.error === "DUP_PHONE") return setErr(el.step3Error, "מספר הטלפון כבר קיים במערכת.");
      if (r && r.error === "DUP_KITCHEN_NAME") return setErr(el.step3Error, "יש שמות מטבח כפולים. תקן/י לפני שמירה.");
      if (r && r.error === "OTP_NOT_VERIFIED") return setErr(el.step3Error, "האימות פג תוקף. חזר/י לשלב האימות.");
      return setErr(el.step3Error, "השמירה נכשלה. בדוק/י Deploy של Apps Script ונסו שוב.");
    }

    // הצלחה: לנעול עד שינוי הבא ולהציג אינדיקציה ברורה
    state.step3.dirty = false;
    updateFinishEnabled();

    el.step3Success.hidden = false;
    el.step3Success.textContent = "נרשמת בהצלחה ✅";

    // לינקים (בהנחה שהשרת מחזיר rid/token)
    const rid = r.rid || "";
    const token = r.token || "";

    if (rid && token){
      const base = getBaseUrl();
      el.adminLinkBox.value = `${base}admin.html?rid=${encodeURIComponent(rid)}&token=${encodeURIComponent(token)}`;
      el.quizLinkBox.value = `${base}index.html?rid=${encodeURIComponent(rid)}`;
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
