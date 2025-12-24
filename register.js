// =========================
// REGISTER FRONTEND (Connected)
// =========================

// ✅ הדבק כאן את כתובת ה-Web App (…/exec)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyBen-H8xo8Xk0udXW2K9Ivpa8iP7ygVrWZX0pnFglU6FAi9cAMkZuSFirU00J6PEnLew/exec"; // TODO: paste your GAS Web App URL

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
  btnSkipOtp: $("btnSkipOtp"),

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
};

function setErr(node, msg){ node.hidden = !msg; node.textContent = msg || ""; }
function setInfo(node, msg){ node.hidden = !msg; node.textContent = msg || ""; }

function isEmailValid(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function isDigitsOnly(s){ return /^[0-9]+$/.test(s); }

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

function initKitchenGrid(){
  el.kitchensGrid.innerHTML = "";
  for (let i = 0; i < 4; i++) el.kitchensGrid.appendChild(createKitchenRow(""));
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
  if (!unit) return setErr(el.step1Error, "נא למלא יחידה.");
  if (!email || !isEmailValid(email)) return setErr(el.step1Error, "נא להזין אימייל תקין.");

  lockStep1(true);
  setInfo(el.step1Info, "שולח קוד אימות למייל…");

  const r = await apiCall("register/sendOtp", { email, otpSession: state.otpSession });

  lockStep1(false);

  if (!r.ok){
    setInfo(el.step1Info, "");
    return setErr(el.step1Error, "שליחת קוד נכשלה (בדוק APPS_SCRIPT_URL / Deploy).");
  }

  state.otpSession = r.otpSession;
  setInfo(el.step1Info, "הקוד נשלח. בדוק/י את המייל.");
  showStep(2);
};

// Skip OTP (for local testing only)
el.btnSkipOtp.onclick = () => {
  setErr(el.step1Error, "");
  setInfo(el.step1Info, "מצב בדיקה: דילוג אימות.");
  state.verified = true;
  initKitchenGrid();
  showStep(3);
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
};

// Step 3: Finish register
el.btnFinishRegister.onclick = async () => {
  setErr(el.step3Error, "");
  el.step3Success.hidden = true;

  if (!state.verified) return setErr(el.step3Error, "יש לבצע אימות לפני שמירה.");

  const kitchens = listKitchens();
  if (kitchens.length === 0) return setErr(el.step3Error, "נא להזין לפחות מטבח אחד.");

  const fullName = el.fullName.value.trim();
  const personalId = el.personalId.value.trim();
  const unit = el.unit.value.trim();
  const email = el.email.value.trim().toLowerCase();
  const phone = el.phone.value.trim();
  const baseUrl = getBaseUrl();

  el.btnFinishRegister.disabled = true;
  el.btnFinishRegister.textContent = "שומר…";

  const r = await apiCall("register/finish", {
    fullName, personalId, unit, email, phone, kitchens, baseUrl
  });

  el.btnFinishRegister.disabled = false;
  el.btnFinishRegister.textContent = "שמירה והרשמה";

  if (!r.ok){
    return setErr(el.step3Error, "שמירה נכשלה (בדוק Deploy/ID של השיטס).");
  }

  state.rid = r.rid;
  state.token = r.token;

  const adminLink = `${baseUrl}admin.html?rid=${encodeURIComponent(state.rid)}&token=${encodeURIComponent(state.token)}`;
  const quizLink  = `${baseUrl}index.html?rid=${encodeURIComponent(state.rid)}`;

  el.adminLinkBox.textContent = adminLink;
  el.quizLinkBox.textContent = quizLink;

  el.step3Success.hidden = false;
};

// initial UI
showStep(1);
initKitchenGrid();
