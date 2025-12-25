// =========================
// REGISTER FRONTEND (Connected)
// =========================

// ✅ הדבק כאן את כתובת ה-Web App (…/exec)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlp-QnTsRIs2WJryZvAdBrwe1yVkzfEt8jAwWtPB4LqaIG__2vDH2XXHTyRr4TDsOomg/exec";

const $ = (id) => document.getElementById(id);

const el = {
  step1: $("step1"),
  step2: $("step2"),
  step3: $("step3"),

  fullName: $("fullName"),
  personalId: $("personalId"),
  unit: $("unit"),
  email: $("email"),
  phone: $("phone"),

  btnSendOtp: $("btnSendOtp"),
  btnSkipOtp: $("btnSkipOtp"),

  step1Error: $("step1Error"),
  step1Info: $("step1Info"),

  otpCode: $("otpCode"),
  btnVerifyOtp: $("btnVerifyOtp"),
  btnResendOtp: $("btnResendOtp"),
  step2Error: $("step2Error"),
  step2Info: $("step2Info"),

  kitchensGrid: $("kitchensGrid"),
  btnAddKitchen: $("btnAddKitchen"),
  btnFinishRegister: $("btnFinishRegister"),
  step3Error: $("step3Error"),
  step3Success: $("step3Success"),
  adminLinkBox: $("adminLinkBox"),
};

function setErr(node, msg){ node.hidden = !msg; node.textContent = msg || ""; }
function setInfo(node, msg){ node.hidden = !msg; node.textContent = msg || ""; }

function isDigitsOnly(s){ return /^[0-9]+$/.test(String(s||"")); }
function isEmailValid(s){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s||"")); }
function isRabbiIdValid7(s){ return /^\d{7}$/.test(String(s||"")); }

// ---------- JSONP API ----------
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
// ------------------------------

const state = {
  otpSession: "",
  verified: false,
  saving: false,
};

function showStep(step){
  el.step1.hidden = step !== 1;
  el.step2.hidden = step !== 2;
  el.step3.hidden = step !== 3;
}

function lockStep1(disabled){
  [el.fullName, el.personalId, el.unit, el.email, el.phone].forEach(x => x.disabled = disabled);
  el.btnSendOtp.disabled = disabled;
  if (el.btnSkipOtp) el.btnSkipOtp.disabled = disabled;
}

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
function updateFinishEnabled(){
  const can =
    state.verified &&
    !state.saving &&
    kitchensAllFilled();
  el.btnFinishRegister.disabled = !can;
}

function createKitchenRow(value=""){
  const wrap = document.createElement("div");
  wrap.className = "kitchen-item";

  const inp = document.createElement("input");
  inp.placeholder = "שם מטבח";
  inp.value = value;
  inp.addEventListener("input", updateFinishEnabled);

  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn-del";
  del.textContent = "מחק";
  del.onclick = () => { wrap.remove(); updateFinishEnabled(); };

  wrap.appendChild(inp);
  wrap.appendChild(del);
  return wrap;
}

function initKitchenGrid(){
  el.kitchensGrid.innerHTML = "";
  el.kitchensGrid.appendChild(createKitchenRow(""));
  updateFinishEnabled();
}

// =========================
// Step 1: Send OTP
// =========================
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

  if (!r || !r.ok){
    setInfo(el.step1Info, "");
    return setErr(el.step1Error, "שליחת קוד נכשלה (בדוק APPS_SCRIPT_URL / Deploy).");
  }

  state.otpSession = r.otpSession || state.otpSession;
  // שמירת פרטי הרב בצד שרת תעשה בסיום (finish)
  setInfo(el.step1Info, "הקוד נשלח. בדוק/י את המייל.");
  showStep(2);
};

// Skip OTP (for local testing only)
if (el.btnSkipOtp){
  el.btnSkipOtp.onclick = () => {
    setErr(el.step1Error, "");
    setInfo(el.step1Info, "מצב בדיקה: דילוג אימות.");
    state.verified = true;
    initKitchenGrid();
    showStep(3);
  };
}

// =========================
// Step 2: Verify OTP
// =========================
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

  if (!r || !r.ok){
    setInfo(el.step2Info, "");
    return setErr(el.step2Error, "קוד שגוי או פג תוקף. נסה שוב.");
  }

  state.verified = true;
  setInfo(el.step2Info, "אומת בהצלחה ✅");
  initKitchenGrid();
  showStep(3);
};

el.btnResendOtp.onclick = async () => {
  setErr(el.step2Error, "");
  setInfo(el.step2Info, "שולח קוד שוב…");

  const email = el.email.value.trim().toLowerCase();
  const r = await apiCall("register/resendOtp", { email, otpSession: state.otpSession });

  if (!r || !r.ok){
    setInfo(el.step2Info, "");
    return setErr(el.step2Error, "שליחת קוד שוב נכשלה.");
  }
  state.otpSession = r.otpSession || state.otpSession;
  setInfo(el.step2Info, "נשלח ✅");
};

// =========================
// Step 3: Kitchens + Finish
// =========================
el.btnAddKitchen.onclick = () => {
  el.kitchensGrid.appendChild(createKitchenRow(""));
  updateFinishEnabled();
};

el.btnFinishRegister.onclick = async () => {
  setErr(el.step3Error, "");
  el.step3Success.hidden = true;

  if (!state.verified) return setErr(el.step3Error, "יש לבצע אימות לפני שמירה.");

  // חובה: כל השדות מלאים
  if (!kitchensAllFilled()){
    updateFinishEnabled();
    return setErr(el.step3Error, "יש למלא את כל שמות המטבחים לפני שמירה.");
  }

  const kitchens = listKitchensTrimmed();
  if (kitchens.length === 0) return setErr(el.step3Error, "נא להזין לפחות מטבח אחד.");

  const payload = {
    fullName: el.fullName.value.trim(),
    personalId: el.personalId.value.trim(),
    unit: el.unit.value.trim(),
    email: el.email.value.trim().toLowerCase(),
    phone: el.phone.value.trim(),
    kitchens
  };

  state.saving = true;
  updateFinishEnabled();
  el.btnFinishRegister.textContent = "שומר…";

  const r = await apiCall("register/finish", payload);

  state.saving = false;
  el.btnFinishRegister.textContent = "סיום הרשמה";
  updateFinishEnabled();

  if (!r || !r.ok){
    return setErr(el.step3Error, "שמירה נכשלה. נסה שוב.");
  }

  // מציג לינק ניהול
  el.step3Success.hidden = false;
  if (el.adminLinkBox && r.adminUrl){
    el.adminLinkBox.textContent = r.adminUrl;
  }
};

// INIT
showStep(1);
if (el.btnFinishRegister) el.btnFinishRegister.disabled = true;
