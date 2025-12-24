// =========================
// REGISTER FRONTEND (Step 1)
// Backend will be added next step (Apps Script)
// =========================

// ✅ בשלב הזה ה-UI עובד.
// כדי לחבר לשרת: נגדיר APPS_SCRIPT_URL בהמשך.
const APPS_SCRIPT_URL = ""; // TODO: נשים כאן Web App URL של Apps Script

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
  // server will return these later:
  rid: "",
  token: "",
  otpSession: "",

  verified: false,
};

function setErr(node, msg){
  node.hidden = !msg;
  node.textContent = msg || "";
}
function setInfo(node, msg){
  node.hidden = !msg;
  node.textContent = msg || "";
}

function isEmailValid(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function isDigitsOnly(s){ return /^[0-9]+$/.test(s); }

function getBaseUrl(){
  // e.g. https://master7897.github.io/kashrut-trainingPro/
  const { origin, pathname } = window.location;
  const parts = pathname.split("/").filter(Boolean);
  // last part is file name (register.html), so remove it
  parts.pop();
  return `${origin}/${parts.join("/")}/`;
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

function initKitchenGrid(){
  el.kitchensGrid.innerHTML = "";
  // 4 שדות התחלתיים
  el.kitchensGrid.appendChild(createKitchenRow(""));
  el.kitchensGrid.appendChild(createKitchenRow(""));
  el.kitchensGrid.appendChild(createKitchenRow(""));
  el.kitchensGrid.appendChild(createKitchenRow(""));
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

// ---------- Backend stubs (will be real next step) ----------
async function apiCall(path, payload){
  if (!APPS_SCRIPT_URL){
    // demo mode (no server)
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
// ----------------------------------------------------------

// Step 1: Send OTP
el.btnSendOtp.onclick = async () => {
  setErr(el.step1Error, "");
  setInfo(el.step1Info, "");

  const fullName = el.fullName.value.trim();
  const personalId = el.personalId.value.trim();
  const unit = el.unit.value.trim();
  const email = el.email.value.trim();
  const phone = el.phone.value.trim();

  if (!fullName) return setErr(el.step1Error, "נא למלא שם מלא.");
  if (!personalId) return setErr(el.step1Error, "נא למלא מספר אישי.");
  if (!isDigitsOnly(personalId)) return setErr(el.step1Error, "מספר אישי חייב להיות ספרות בלבד.");
  if (!unit) return setErr(el.step1Error, "נא למלא יחידה.");
  if (!email || !isEmailValid(email)) return setErr(el.step1Error, "נא להזין אימייל תקין.");

  lockStep1(true);
  setInfo(el.step1Info, "שולח קוד אימות למייל…");

  const result = await apiCall("register/sendOtp", { fullName, personalId, unit, email, phone });

  if (!result.ok){
    lockStep1(false);

    if (result.error === "SERVER_NOT_CONFIGURED"){
      // Demo: allow continue
      setInfo(el.step1Info, "מצב בדיקה: השרת עדיין לא מחובר. ניתן לדלג לאימות כדי להמשיך בניית UI.");
      showStep(2);
      return;
    }

    setErr(el.step1Error, "שליחת קוד נכשלה. נסה שוב.");
    setInfo(el.step1Info, "");
    return;
  }

  state.otpSession = result.otpSession || "";
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

  const email = el.email.value.trim();

  const result = await apiCall("register/verifyOtp", { email, otpSession: state.otpSession, code });

  el.btnVerifyOtp.disabled = false;
  el.btnResendOtp.disabled = false;

  if (!result.ok){
    if (result.error === "SERVER_NOT_CONFIGURED"){
      // demo mode: accept any code
      state.verified = true;
      initKitchenGrid();
      showStep(3);
      return;
    }
    setErr(el.step2Error, "קוד שגוי או פג תוקף. נסה שוב.");
    setInfo(el.step2Info, "");
    return;
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
  const email = el.email.value.trim();

  const result = await apiCall("register/resendOtp", { email, otpSession: state.otpSession });

  if (!result.ok){
    if (result.error === "SERVER_NOT_CONFIGURED"){
      setInfo(el.step2Info, "מצב בדיקה: אין שרת מחובר.");
      return;
    }
    setErr(el.step2Error, "שליחת קוד שוב נכשלה.");
    setInfo(el.step2Info, "");
    return;
  }

  setInfo(el.step2Info, "הקוד נשלח שוב.");
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

  // Demo link generation (real rid/token will come from server)
  const base = getBaseUrl();

  // If server connected, request rid/token + save kitchens
  const fullName = el.fullName.value.trim();
  const personalId = el.personalId.value.trim();
  const unit = el.unit.value.trim();
  const email = el.email.value.trim();
  const phone = el.phone.value.trim();

  el.btnFinishRegister.disabled = true;
  el.btnFinishRegister.textContent = "שומר…";

  const result = await apiCall("register/finish", {
    fullName, personalId, unit, email, phone, kitchens
  });

  el.btnFinishRegister.disabled = false;
  el.btnFinishRegister.textContent = "שמירה והרשמה";

  if (!result.ok){
    if (result.error === "SERVER_NOT_CONFIGURED"){
      // demo fallback
      state.rid = "DEMO_RID";
      state.token = "DEMO_TOKEN";
    } else {
      return setErr(el.step3Error, "שמירה נכשלה. נסה שוב.");
    }
  } else {
    state.rid = result.rid;
    state.token = result.token;
  }

  const adminLink = `${base}admin.html?rid=${encodeURIComponent(state.rid)}&token=${encodeURIComponent(state.token)}`;
  const quizLink  = `${base}index.html?rid=${encodeURIComponent(state.rid)}`;

  el.adminLinkBox.textContent = adminLink;
  el.quizLinkBox.textContent = quizLink;

  el.step3Success.hidden = false;
};

// initial UI
showStep(1);
initKitchenGrid();
