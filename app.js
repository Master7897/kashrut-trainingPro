// =========================
// CONFIG
// =========================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlp-QnTsRIs2WJryZvAdBrwe1yVkzfEt8jAwWtPB4LqaIG__2vDH2XXHTyRr4TDsOomg/exec"; // חובה

const $ = (id) => document.getElementById(id);
const el = {
  // screens
  sStart: $("screen-start"),
  sQuiz: $("screen-quiz"),
  sResult: $("screen-result"),

  // start
  fullName: $("fullName"),
  personalId: $("personalId"),
  kitchen: $("kitchen"),
  btnStart: $("btnStart"),
  startError: $("startError"),

  // quiz
  progress: $("progress"),
  title: $("questionTitle"),
  feedback: $("feedback"),
  btnNext: $("btnNext"),

  // lead
  leadWrap: $("leadWrap"),
  leadImg: $("leadImg"),
  leadCap: $("leadCap"),

  // two
  twoWrap: $("twoWrap"),
  imgA: $("imgA"),
  imgB: $("imgB"),
  capA: $("capA"),
  capB: $("capB"),

  // hotspot
  hotspotWrap: $("hotspotWrap"),
  hotspotImg: $("hotspotImg"),
  hotspotOverlay: $("hotspotOverlay"),
  hotspotStatus: $("hotspotStatus"),
  hotspotMarks: $("hotspotMarks"),

  // mc
  mcWrap: $("mcWrap"),
  mcHint: $("mcHint"),
  mcOptions: $("mcOptions"),

  // img multi 10
  imgMultiWrap: $("imgMultiWrap"),
  imgMultiGrid: $("imgMultiGrid"),
  imgMultiFeedback: $("imgMultiFeedback"),

  // drag
  dragWrap: $("dragWrap"),
  dragIntro: $("dragIntro"),
  dragIntroImg: $("dragIntroImg"),
  dragPlay: $("dragPlay"),
  btnShowChart: $("btnShowChart"),
  dragStage: $("dragStage"),
  dragBg: $("dragBg"),
  dragZones: $("dragZones"),
  dragItem: $("dragItem"),
  dragItemImg: $("dragItemImg"),
  dragItemCap: $("dragItemCap"),
  dragFeedback: $("dragFeedback"),

  // result
  sendStatus: $("sendStatus"),
  btnResend: $("btnResend"),
};

const state = {
  user: null,
  idx: 0,
  answers: [],
  sentThisRun: false,
  runtime: {
    two: { choice: "" },
    mc: { selected: [] },
    imgMulti: { selected: [] },
    hotspot: { marks: [] },
    drag: { ok: false, chosenSide: "" },
  },
};

// =========================
// SPECIAL TEXT FORMATTER
// =========================
function formatSpecial(text){
  let s = String(text ?? "");
  s = s.replace(/\[P\](.*?)\[\/P\]/g, '<span class="hl-parve">$1</span>');
  s = s.replace(/\[B\](.*?)\[\/B\]/g, '<span class="hl-meat">$1</span>');
  s = s.replace(/\[H\](.*?)\[\/H\]/g, '<span class="hl-dairy">$1</span>');
  s = s.replace(/(^|[^\u0590-\u05FF])([הכמוש])\s+(<span class="hl-(?:parve|dairy|meat)">)/g, "$1$2$3");
  return s;
}

// =========================
// UTILS
// =========================
const DIGITS = /^[0-9]+$/;
function isDigitsOnly(s){ return DIGITS.test(String(s||"")); }

function isFullNameValid(name){
  const parts = String(name||"").trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}
function isIsraeliIdValid(id){
  const s = String(id||"").trim();
  if (!/^\d{9}$/.test(s)) return false;
  let sum = 0;
  for (let i=0;i<9;i++){
    let n = +s[i] * ((i%2)+1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

function showScreen(which){
  el.sStart.hidden = which !== "start";
  el.sQuiz.hidden = which !== "quiz";
  el.sResult.hidden = which !== "result";
}

function setFeedback(msg, isErr=false){
  el.feedback.hidden = !msg;
  el.feedback.classList.toggle("errorbox", !!isErr);
  el.feedback.innerHTML = msg ? formatSpecial(msg) : ""; // innerHTML חובה
}

// =========================
// JSONP API
// =========================
function apiCall(path, payload){
  return new Promise((resolve) => {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_")){
      resolve({ ok:false, error:"SERVER_NOT_CONFIGURED" });
      return;
    }
    const cb = `__jsonp_cb_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement("script");
    window[cb] = (data) => {
      try { delete window[cb]; } catch {}
      script.remove();
      resolve(data || { ok:false });
    };
    const req = encodeURIComponent(JSON.stringify({ path, payload }));
    script.src = `${APPS_SCRIPT_URL}?callback=${cb}&req=${req}`;
    script.onerror = () => {
      try { delete window[cb]; } catch {}
      script.remove();
      resolve({ ok:false, error:"NETWORK_ERROR" });
    };
    document.body.appendChild(script);
  });
}

// =========================
// LOAD KITCHENS
// =========================
function setKitchenOptions(kitchens){
  const list = Array.isArray(kitchens) ? kitchens : [];
  el.kitchen.innerHTML = `<option value="">בחר/י מטבח</option>`;
  for (const k of list){
    const opt = document.createElement("option");
    opt.value = String(k||"").trim();
    opt.textContent = String(k||"").trim();
    el.kitchen.appendChild(opt);
  }
}
async function loadKitchens(){
  const r = await apiCall("public/getKitchens", {});
  if (!r || !r.ok){
    el.kitchen.innerHTML = `<option value="">שגיאה בטעינת מטבחים</option>`;
    return;
  }
  setKitchenOptions(r.kitchens);
}

// =========================
// QUESTIONS (עדכון קל: רק לערוך את המערך)
// =========================
const QUESTIONS = [
  if (!Array.isArray(QUESTIONS) || QUESTIONS.length === 0){
    showScreen("start");
    el.startError.hidden = false;
    el.startError.textContent = "אין שאלות במערכת (QUESTIONS ריק). החזר/י את מערך השאלות לקובץ app.js.";
  }

  // דוגמאות — תשאיר/י את שלך כאן (אותו פורמט)
  // two:
  // { type:"two", title:"...", A:{img:"...",caption:"..."}, B:{img:"...",caption:"..."}, correct:"A", wrongMsg:"..." }

  // mc_single:
  // { type:"mc_single", title:"...", options:["..."], correctIndex:0, wrongMsg:"..." }

  // mc_multi:
  // { type:"mc_multi", title:"...", options:["..."], correctIndexes:[0,2], wrongMsg:"..." }

  // img_multi10:
  // { type:"img_multi10", title:"...", items:[{img:"",caption:""}], correctIndexes:[...], wrongMsgByIndex:{}, okMsg:"..." }

  // hotspot:
  // { type:"hotspot", title:"...", img:"images/x.jpg", max:5, boxes:[{x1:10,y1:10,x2:20,y2:20}], okMsg:"...", wrongMsg:"..." }

  // drag:
  // { type:"drag", title:"...", bg:"...", introImg:"...", item:{img:"",caption:"..."}, zones:[{side:"L",left:6,top:24,w:22,h:9},...], correctSide:"L", wrongMsg:"..." }
];

// =========================
// PRELOAD (non-blocking)
// =========================
function preload(urls){
  const seen = new Set();
  urls.filter(Boolean).forEach(u=>{
    if (seen.has(u)) return;
    seen.add(u);
    const im = new Image();
    im.decoding = "async";
    im.loading = "eager";
    im.src = u;
  });
}
function collectImageUrls(){
  const urls = [];
  for (const q of QUESTIONS){
    if (q?.leadImg) urls.push(q.leadImg);
    if (q?.A?.img) urls.push(q.A.img);
    if (q?.B?.img) urls.push(q.B.img);
    if (q?.img) urls.push(q.img);
    if (q?.bg) urls.push(q.bg);
    if (q?.introImg) urls.push(q.introImg);
    if (q?.item?.img) urls.push(q.item.img);
    if (Array.isArray(q?.items)) q.items.forEach(it=>urls.push(it?.img));
  }
  return urls;
}

// =========================
// RENDER HELPERS
// =========================
function hideAllTypes(){
  el.leadWrap.hidden = true;
  el.twoWrap.hidden = true;
  el.hotspotWrap.hidden = true;
  el.mcWrap.hidden = true;
  el.imgMultiWrap.hidden = true;
  el.dragWrap.hidden = true;

  el.leadCap.hidden = true;
  el.leadCap.innerHTML = "";
  el.mcHint.textContent = "";
  el.mcOptions.innerHTML = "";
  el.imgMultiGrid.innerHTML = "";
  el.imgMultiFeedback.hidden = true;
  el.imgMultiFeedback.textContent = "";
  el.hotspotMarks.innerHTML = "";
  el.hotspotStatus.textContent = "";
  el.dragZones.innerHTML = "";
  el.dragFeedback.hidden = true;
  el.dragFeedback.textContent = "";

  setFeedback("", false);
}

function renderLead(q){
  if (!q?.leadImg) return;
  el.leadWrap.hidden = false;
  el.leadImg.src = q.leadImg;
  if (q.leadCaption){
    el.leadCap.hidden = false;
    el.leadCap.innerHTML = formatSpecial(q.leadCaption); // innerHTML חובה
  }
}

function setProgress(){
  el.progress.textContent = `${state.idx + 1} / ${QUESTIONS.length}`;
}

const TYPE = {
  two: {
    render(q){
      el.twoWrap.hidden = false;
      state.runtime.two.choice = "";
      el.btnNext.disabled = true;

      el.imgA.src = q.A.img; el.capA.innerHTML = formatSpecial(q.A.caption || ""); // innerHTML חובה
      el.imgB.src = q.B.img; el.capB.innerHTML = formatSpecial(q.B.caption || ""); // innerHTML חובה

      el.twoWrap.querySelectorAll(".img-choice").forEach(btn=>{
        btn.classList.remove("selected");
        btn.onclick = () => {
          const c = btn.dataset.two;
          state.runtime.two.choice = c;
          el.twoWrap.querySelectorAll(".img-choice").forEach(b=>b.classList.toggle("selected", b.dataset.two===c));
          el.btnNext.disabled = false;
        };
      });
    },
    validate(q){
      return state.runtime.two.choice === q.correct;
    }
  },

  mc_single: {
    render(q){
      el.mcWrap.hidden = false;
      state.runtime.mc.selected = [];
      el.btnNext.disabled = true;
      el.mcHint.textContent = "";
      el.mcOptions.innerHTML = "";

      q.options.forEach((opt, i)=>{
        const row = document.createElement("label");
        row.className = "mc-option";

        const inp = document.createElement("input");
        inp.type = "radio";
        inp.name = "mc";
        inp.value = String(i);

        const txt = document.createElement("div");
        txt.className = "txt";
        txt.innerHTML = formatSpecial(opt); // innerHTML חובה

        row.appendChild(inp);
        row.appendChild(txt);
        row.addEventListener("click", ()=>{
          inp.checked = true;
          state.runtime.mc.selected = [i];
          el.btnNext.disabled = false;
        });

        el.mcOptions.appendChild(row);
      });
    },
    validate(q){
      return state.runtime.mc.selected[0] === q.correctIndex;
    }
  },

  mc_multi: {
    render(q){
      el.mcWrap.hidden = false;
      state.runtime.mc.selected = [];
      el.btnNext.disabled = true;

      el.mcHint.textContent = "שימו ❤️: יש יותר מתשובה אחת נכונה.";
      el.mcOptions.innerHTML = "";

      q.options.forEach((opt, i)=>{
        const row = document.createElement("label");
        row.className = "mc-option";

        const inp = document.createElement("input");
        inp.type = "checkbox";
        inp.value = String(i);

        const txt = document.createElement("div");
        txt.className = "txt";
        txt.innerHTML = formatSpecial(opt); // innerHTML חובה

        row.appendChild(inp);
        row.appendChild(txt);

        row.addEventListener("click", (e)=>{
          if (e.target !== inp) inp.checked = !inp.checked;
          if (inp.checked){
            if (!state.runtime.mc.selected.includes(i)) state.runtime.mc.selected.push(i);
          } else {
            state.runtime.mc.selected = state.runtime.mc.selected.filter(x=>x!==i);
          }
          el.btnNext.disabled = state.runtime.mc.selected.length === 0;
        });

        el.mcOptions.appendChild(row);
      });
    },
    validate(q){
      const chosen = state.runtime.mc.selected.slice().sort((a,b)=>a-b);
      const correct = q.correctIndexes.slice().sort((a,b)=>a-b);
      return chosen.length === correct.length && chosen.every((v,i)=>v===correct[i]);
    }
  },

  img_multi10: {
    render(q){
      el.imgMultiWrap.hidden = false;
      state.runtime.imgMulti.selected = [];
      el.btnNext.disabled = true;
      el.imgMultiGrid.innerHTML = "";
      el.imgMultiFeedback.hidden = true;
      el.imgMultiFeedback.textContent = "";

      q.items.forEach((it, idx)=>{
        const card = document.createElement("button");
        card.type = "button";
        card.className = "img-multi-card";
        card.dataset.idx = String(idx);

        const im = document.createElement("img");
        im.src = it.img;
        im.alt = it.alt || `תמונה ${idx+1}`;
        if (it.fit === "contain"){ im.style.objectFit = "contain"; im.style.background = "#fff"; }

        const cap = document.createElement("div");
        cap.className = "img-multi-caption";
        cap.innerHTML = formatSpecial(it.caption || it.alt || ""); // innerHTML חובה

        card.appendChild(im);
        card.appendChild(cap);

        card.addEventListener("click",(e)=>{
          e.preventDefault();
          const sel = state.runtime.imgMulti.selected;
          const exists = sel.includes(idx);
          if (exists) state.runtime.imgMulti.selected = sel.filter(x=>x!==idx);
          else sel.push(idx);

          card.classList.toggle("selected", !exists);
          card.classList.remove("wrong");

          el.imgMultiFeedback.hidden = true;
          el.imgMultiFeedback.textContent = "";
          el.btnNext.disabled = state.runtime.imgMulti.selected.length === 0;
        });

        el.imgMultiGrid.appendChild(card);
      });
    },
    validate(q){
      const chosen = state.runtime.imgMulti.selected.slice().sort((a,b)=>a-b);
      const correct = q.correctIndexes.slice().sort((a,b)=>a-b);

      const wrongPicked = chosen.filter(i => !correct.includes(i));
      if (wrongPicked.length){
        const firstWrong = wrongPicked[0];
        const card = el.imgMultiGrid.querySelector(`.img-multi-card[data-idx="${firstWrong}"]`);
        if (card) card.classList.add("wrong");

        const msg = (q.wrongMsgByIndex && q.wrongMsgByIndex[firstWrong]) || q.wrongMsg || "❌ יש בחירה שגויה.";
        el.imgMultiFeedback.hidden = false;
        el.imgMultiFeedback.textContent = msg;
        return false;
      }

      const ok = chosen.length === correct.length && chosen.every((v,i)=>v===correct[i]);
      if (ok && q.okMsg){
        el.imgMultiFeedback.hidden = false;
        el.imgMultiFeedback.textContent = q.okMsg;
      }
      return ok;
    }
  },

  hotspot: {
    render(q){
      el.hotspotWrap.hidden = false;
      state.runtime.hotspot.marks = [];
      el.btnNext.disabled = true;

      el.hotspotImg.src = q.img;
      el.hotspotMarks.innerHTML = "";
      el.hotspotStatus.textContent = `נשארו ${q.max ?? 5} סימונים`;

      el.hotspotOverlay.onclick = (ev)=>{
        const max = q.max ?? 5;
        if (state.runtime.hotspot.marks.length >= max) return;

        const rect = el.hotspotOverlay.getBoundingClientRect();
        const x = ((ev.clientX - rect.left) / rect.width) * 100;
        const y = ((ev.clientY - rect.top) / rect.height) * 100;
        const mark = { x, y };
        state.runtime.hotspot.marks.push(mark);
        renderHotspotMarkRow(mark, state.runtime.hotspot.marks.length - 1, max);
        el.hotspotStatus.textContent = `נשארו ${max - state.runtime.hotspot.marks.length} סימונים`;
        el.btnNext.disabled = state.runtime.hotspot.marks.length === 0;
      };

      // render overlay markers
      requestAnimationFrame(()=>syncHotspotOverlay());
    },
    validate(q){
      const boxes = Array.isArray(q.boxes) ? q.boxes : [];
      const marks = state.runtime.hotspot.marks;

      // הצלחה: כל mark בתוך אחד ה-boxes (לא חייב אחד-לאחד)
      const inside = (m,b)=>m.x>=b.x1 && m.x<=b.x2 && m.y>=b.y1 && m.y<=b.y2;
      const ok = marks.length>0 && marks.every(m=>boxes.some(b=>inside(m,b)));
      return ok;
    }
  },

  drag: {
    render(q){
      el.dragWrap.hidden = false;
      state.runtime.drag.ok = false;
      state.runtime.drag.chosenSide = "";
      el.btnNext.disabled = true;

      // chart toggle
      el.dragIntro.hidden = false;
      el.dragPlay.hidden = true;

      el.dragIntroImg.src = q.introImg;
      el.dragBg.src = q.bg;

      el.dragItemImg.src = q.item.img;
      el.dragItemCap.innerHTML = formatSpecial(q.item.caption || ""); // innerHTML חובה

      // zones
      el.dragZones.innerHTML = "";
      const zones = Array.isArray(q.zones) ? q.zones : [];
      zones.forEach((z, i)=>{
        const d = document.createElement("div");
        d.className = "drag-zone";
        d.dataset.side = z.side;
        d.style.left = z.left + "%";
        d.style.top = z.top + "%";
        d.style.width = z.w + "%";
        d.style.height = z.h + "%";
        el.dragZones.appendChild(d);
      });

      // DnD
      el.dragItem.ondragstart = (e)=>{
        e.dataTransfer.setData("text/plain","drag");
        el.dragFeedback.hidden = true;
        el.dragFeedback.textContent = "";
      };

      el.dragStage.ondragover = (e)=>e.preventDefault();
      el.dragStage.ondrop = (e)=>{
        e.preventDefault();
        const target = e.target.closest(".drag-zone");
        if (!target) return;
        const side = target.dataset.side || "";
        state.runtime.drag.chosenSide = side;
        const ok = side === q.correctSide;
        state.runtime.drag.ok = ok;
        el.btnNext.disabled = !ok;
        el.dragFeedback.hidden = ok;
        if (!ok){
          el.dragFeedback.hidden = false;
          el.dragFeedback.textContent = q.wrongMsg || "❌ לא נכון. נסה/י שוב.";
        }
      };
    },
    validate(){
      return !!state.runtime.drag.ok;
    }
  }
};

function syncHotspotOverlay(){
  // מצייר נקודות על האוברליי (כדי שיהיה מיידי)
  const overlay = el.hotspotOverlay;
  overlay.querySelectorAll(".hotspot-marker").forEach(x=>x.remove());
  state.runtime.hotspot.marks.forEach((m)=>{
    const dot = document.createElement("div");
    dot.className = "hotspot-marker";
    dot.style.left = m.x + "%";
    dot.style.top = m.y + "%";
    overlay.appendChild(dot);
  });
}

function renderHotspotMarkRow(mark, idx, max){
  syncHotspotOverlay();
  const row = document.createElement("div");
  row.className = "mark-row";

  const txt = document.createElement("div");
  txt.className = "txt";
  txt.textContent = `סימון ${idx+1}`;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-del";
  btn.textContent = "מחק";
  btn.onclick = ()=>{
    state.runtime.hotspot.marks.splice(idx, 1);
    el.hotspotMarks.innerHTML = "";
    state.runtime.hotspot.marks.forEach((m,i)=>renderHotspotMarkRow(m,i,max));
    el.hotspotStatus.textContent = `נשארו ${max - state.runtime.hotspot.marks.length} סימונים`;
    el.btnNext.disabled = state.runtime.hotspot.marks.length === 0;
    syncHotspotOverlay();
  };

  row.appendChild(txt);
  row.appendChild(btn);
  el.hotspotMarks.appendChild(row);
}

function renderQuestion(){
  hideAllTypes();
  const q = QUESTIONS[state.idx];
  setProgress();
  el.title.innerHTML = formatSpecial(q.title || ""); // innerHTML חובה
  renderLead(q);

  const type = q.type || "two";
  const h = TYPE[type];
  if (!h) throw new Error("Unknown type: " + type);
  h.render(q);
}

function onNext(){
  const q = QUESTIONS[state.idx];
  const h = TYPE[q.type || "two"];
  const ok = h.validate(q);

  if (!ok){
    setFeedback(q.wrongMsg || "❌ לא נכון. נסה/י שוב.", true);
    el.btnNext.disabled = true;
    return;
  }

  setFeedback(q.okMsg || "✅ נכון!", false);
  state.answers.push({ i: state.idx, ok:true });

  state.idx++;
  if (state.idx >= QUESTIONS.length){
    finishQuiz();
  } else {
    // רינדור שאלה הבאה אחרי “טאץ” קטן ל-UX
    setTimeout(()=>renderQuestion(), 150);
    el.btnNext.disabled = true;
  }
}

function startFromBeginning(){
  state.idx = 0;
  state.answers = [];
  state.sentThisRun = false;
  showScreen("quiz");
  renderQuestion();
}

async function finishQuiz(){
  showScreen("result");
  el.sendStatus.textContent = "שולח תוצאה…";
  el.btnResend.hidden = true;
  await sendResult(false);
}

async function sendResult(isRetry){
  try{
    el.btnResend.hidden = true;
    const payload = {
      fullName: state.user.fullName,
      personalId: state.user.personalId,
      kitchen: state.user.kitchen,
      score: state.answers.length,
      total: QUESTIONS.length,
      ts: Date.now()
    };

    const r = await apiCall("public/submit", payload);
    if (!r || !r.ok) throw new Error(r?.error || "SERVER_ERROR");

    state.sentThisRun = true;
    el.sendStatus.textContent = "התוצאה נשלחה בהצלחה ✅";
  }catch(e){
    state.sentThisRun = false;
    const msg = e?.message ? `(${e.message})` : "";
    el.sendStatus.textContent = `שליחה נכשלה ❌ ${msg}`;
    el.btnResend.hidden = false;
    el.btnResend.disabled = false;
  }
}

// =========================
// EVENTS
// =========================
el.btnStart.addEventListener("click", async ()=>{
  const fullName = el.fullName.value.trim();
  const personalId = el.personalId.value.trim();
  const kitchen = el.kitchen.value.trim();

  const err = (m)=>{ el.startError.hidden=false; el.startError.textContent=m; };

  if (!fullName) return err("נא למלא שם.");
  if (!personalId) return err("נא למלא ת.ז/מספר אישי.");
  if (!kitchen) return err("נא לבחור מטבח.");
  if (!isFullNameValid(fullName)) return err("נא להזין שם מלא (לפחות שתי מילים).");
  if (!isDigitsOnly(personalId) || !(personalId.length===7 || personalId.length===9)) return err("ת.ז/מ.א חייב להיות 9 או 7 ספרות.");
  if (personalId.length===9 && !isIsraeliIdValid(personalId)) return err("תעודת הזהות לא תקינה.");

  el.startError.hidden = true;
  el.btnStart.disabled = true;
  const old = el.btnStart.textContent;
  el.btnStart.textContent = "טוען…";

  try{
    state.user = { fullName, personalId, kitchen };
    startFromBeginning();
  }finally{
    el.btnStart.disabled = false;
    el.btnStart.textContent = old;
  }
});

el.btnNext.addEventListener("click", onNext);
el.btnResend.addEventListener("click", ()=>sendResult(true));

el.btnShowChart?.addEventListener("click", ()=>{
  const showing = !el.dragIntro.hidden;
  el.dragIntro.hidden = showing;
  el.dragPlay.hidden = !showing;
});

// init
(async ()=>{
  showScreen("start");
  await loadKitchens();

  // preload images idle
  const urls = collectImageUrls();
  if ("requestIdleCallback" in window) requestIdleCallback(()=>preload(urls), { timeout: 2000 });
  else setTimeout(()=>preload(urls), 300);
})();
