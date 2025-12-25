const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlp-QnTsRIs2WJryZvAdBrwe1yVkzfEt8jAwWtPB4LqaIG__2vDH2XXHTyRr4TDsOomg/exec"; // חובה

const $ = (id)=>document.getElementById(id);
const el = {
  step1: $("step1"), step2: $("step2"), step3: $("step3"),

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
  btnFinish: $("btnFinishRegister"),

  step1Error: $("step1Error"),
  step2Error: $("step2Error"),
  step3Error: $("step3Error"),
  step1Info: $("step1Info"),
  step2Info: $("step2Info"),

  success: $("step3Success"),
  adminLinkBox: $("adminLinkBox"),
  quizLinkBox: $("quizLinkBox"),
};

const state = { otpSession:"", verified:false };

function setErr(node,msg){ node.hidden=!msg; node.textContent=msg||""; }
function setInfo(node,msg){ node.hidden=!msg; node.textContent=msg||""; }

function isEmailValid(s){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s||"").trim()); }
function isDigitsOnly(s){ return /^[0-9]+$/.test(String(s||"")); }
function isRabbiIdValid7(s){ return /^[0-9]{7}$/.test(String(s||"")); }

function apiCall(path,payload){
  return new Promise((resolve)=>{
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_")){
      resolve({ok:false,error:"SERVER_NOT_CONFIGURED"}); return;
    }
    const cb = `__jsonp_cb_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement("script");
    window[cb] = (data)=>{
      try{ delete window[cb]; }catch{}
      script.remove();
      resolve(data||{ok:false});
    };
    const req = encodeURIComponent(JSON.stringify({ path, payload }));
    script.src = `${APPS_SCRIPT_URL}?callback=${cb}&req=${req}`;
    script.onerror = ()=>{
      try{ delete window[cb]; }catch{}
      script.remove();
      resolve({ok:false,error:"NETWORK_ERROR"});
    };
    document.body.appendChild(script);
  });
}

function showStep(n){
  el.step1.hidden = n!==1;
  el.step2.hidden = n!==2;
  el.step3.hidden = n!==3;
}

function kitchenInputs(){
  return Array.from(el.kitchensGrid.querySelectorAll("input"));
}
function kitchensAllFilled(){
  const ins = kitchenInputs();
  return ins.length>0 && ins.every(i=>i.value.trim().length>0);
}
function listKitchens(){
  return kitchenInputs().map(i=>i.value.trim()).filter(Boolean);
}
function updateFinishEnabled(){
  el.btnFinish.disabled = !kitchensAllFilled();
}
function createKitchenRow(val=""){
  const wrap = document.createElement("div");
  wrap.style.display="flex";
  wrap.style.gap="10px";
  wrap.style.marginTop="10px";

  const inp = document.createElement("input");
  inp.placeholder = "שם מטבח";
  inp.value = val;
  inp.addEventListener("input", ()=>{
    setErr(el.step3Error,"");
    updateFinishEnabled();
  });

  const del = document.createElement("button");
  del.type="button";
  del.className="secondary";
  del.textContent="מחק";
  del.onclick = ()=>{
    wrap.remove();
    updateFinishEnabled();
  };

  wrap.appendChild(inp);
  wrap.appendChild(del);
  return wrap;
}

function baseUrl(){
  const { origin, pathname } = window.location;
  const parts = pathname.split("/").filter(Boolean);
  parts.pop(); // register.html
  return `${origin}/${parts.join("/")}/`;
}

// Step 1: Send OTP
el.btnSendOtp.onclick = async ()=>{
  setErr(el.step1Error,""); setInfo(el.step1Info,"");

  const fullName = el.fullName.value.trim();
  const personalId = el.personalId.value.trim();
  const unit = el.unit.value.trim();
  const email = el.email.value.trim().toLowerCase();
  const phone = el.phone.value.trim();

  if (!fullName) return setErr(el.step1Error,"נא למלא שם מלא.");
  if (!personalId) return setErr(el.step1Error,"נא למלא מספר אישי.");
  if (!isDigitsOnly(personalId) || !isRabbiIdValid7(personalId)) return setErr(el.step1Error,"מספר אישי חייב להיות בדיוק 7 ספרות.");
  if (!unit) return setErr(el.step1Error,"נא למלא יחידה.");
  if (!email || !isEmailValid(email)) return setErr(el.step1Error,"נא להזין אימייל תקין.");

  el.btnSendOtp.disabled = true;
  setInfo(el.step1Info,"שולח קוד אימות…");

  const r = await apiCall("register/sendOtp", { email, otpSession: state.otpSession });

  el.btnSendOtp.disabled = false;

  if (!r?.ok){
    setInfo(el.step1Info,"");
    if (r?.error === "ALREADY_REGISTERED") return setErr(el.step1Error,"האימייל הזה כבר רשום. השתמש/י בקישור הניהול שנשלח למייל.");
    return setErr(el.step1Error,"שליחת קוד נכשלה.");
  }

  state.otpSession = r.otpSession || "";
  setInfo(el.step1Info,"הקוד נשלח. בדוק/י את המייל.");
  showStep(2);
};

// Step 2: Verify OTP
el.btnVerifyOtp.onclick = async ()=>{
  setErr(el.step2Error,""); setInfo(el.step2Info,"");

  const code = el.otpCode.value.trim();
  const email = el.email.value.trim().toLowerCase();
  if (!code || !isDigitsOnly(code)) return setErr(el.step2Error,"נא להזין קוד ספרות בלבד.");

  el.btnVerifyOtp.disabled = true;
  el.btnResendOtp.disabled = true;
  setInfo(el.step2Info,"מאמת…");

  const r = await apiCall("register/verifyOtp", { email, otpSession: state.otpSession, code });

  el.btnVerifyOtp.disabled = false;
  el.btnResendOtp.disabled = false;

  if (!r?.ok){
    setInfo(el.step2Info,"");
    return setErr(el.step2Error,"קוד שגוי או פג תוקף. נסה שוב.");
  }

  state.verified = true;
  setInfo(el.step2Info,"אומת ✅");
  showStep(3);

  el.kitchensGrid.innerHTML = "";
  el.kitchensGrid.appendChild(createKitchenRow(""));
  el.kitchensGrid.appendChild(createKitchenRow(""));
  updateFinishEnabled();
};

el.btnResendOtp.onclick = async ()=>{
  setErr(el.step2Error,""); setInfo(el.step2Info,"שולח שוב…");
  const email = el.email.value.trim().toLowerCase();
  const r = await apiCall("register/sendOtp", { email, otpSession: state.otpSession });
  if (!r?.ok) return setInfo(el.step2Info,"שליחה נכשלה.");
  state.otpSession = r.otpSession || state.otpSession;
  setInfo(el.step2Info,"נשלח ✅");
};

el.btnAddKitchen.onclick = ()=>{
  el.kitchensGrid.appendChild(createKitchenRow(""));
  updateFinishEnabled();
};

el.btnFinish.onclick = async ()=>{
  setErr(el.step3Error,"");
  if (!state.verified) return setErr(el.step3Error,"אימות לא הושלם.");
  if (!kitchensAllFilled()) return setErr(el.step3Error,"יש שדה מטבח ריק.");

  const payload = {
    fullName: el.fullName.value.trim(),
    personalId: el.personalId.value.trim(),
    unit: el.unit.value.trim(),
    email: el.email.value.trim().toLowerCase(),
    phone: el.phone.value.trim(),
    kitchens: listKitchens(),
    otpSession: state.otpSession
  };

  el.btnFinish.disabled = true;
  el.btnFinish.textContent = "שומר…";

  const r = await apiCall("register/finish", payload);

  el.btnFinish.disabled = false;
  el.btnFinish.textContent = "שמירה והרשמה";

  if (!r?.ok){
    if (r?.error === "ALREADY_REGISTERED") return setErr(el.step3Error,"האימייל כבר רשום. בדוק/י את המייל לקישור ניהול.");
    return setErr(el.step3Error,"שמירה נכשלה.");
  }

  const base = baseUrl();
  const adminUrl = `${base}admin.html?rid=${encodeURIComponent(r.rid)}&token=${encodeURIComponent(r.token)}`;
  const quizUrl  = `${base}?rid=${encodeURIComponent(r.rid)}`;

  el.adminLinkBox.textContent = adminUrl;
  el.quizLinkBox.textContent  = quizUrl;
  el.success.hidden = false;
};
showStep(1);
