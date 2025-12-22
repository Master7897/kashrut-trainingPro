// =========================
// HOTSPOT CALIBRATION MODE
// Toggle: Ctrl+K
// In calibration: 4 clicks => box {x1,y1,x2,y2} (percent)
// =========================
const CAL = {
  enabled: false,
  points: [],   // נקודות שמחכות להשלים רביעייה
  boxes: [],    // כל המרובעים שנוצרו
  panelEl: null,
};
function toggleCalibration(){
  CAL.enabled = !CAL.enabled;
  CAL.points = [];
  CAL.boxes = [];
  ensureCalPanel();
  updateCalPanel();
}
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && (e.key === "k" || e.key === "K")) {
    e.preventDefault();
    toggleCalibration();
    // אם אנחנו כרגע במסך שאלה - נרנדר מחדש כדי לראות את מצב הכיול
    if (!el.screenQuiz.hidden) renderQuestion();
  }
});

function ensureCalPanel(){
  if (CAL.panelEl) return;

  const panel = document.createElement("div");
  panel.id = "calPanel";
  panel.style.cssText = `
    margin-top:10px;padding:10px;border:1px solid var(--border);
    border-radius:12px;background:#fff;display:grid;gap:8px
  `;
  panel.innerHTML = `
    <div class="muted" id="calState"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button type="button" id="calUndo" class="secondary" style="width:auto;margin-top:0">בטל נקודה</button>
      <button type="button" id="calClearPts" class="secondary" style="width:auto;margin-top:0">נקה נקודות (רביעייה)</button>
      <button type="button" id="calClearAll" class="secondary" style="width:auto;margin-top:0">נקה הכל</button>
      <button type="button" id="calCopyLast" class="secondary" style="width:auto;margin-top:0">העתק מרובע אחרון</button>
      <button type="button" id="calCopyAll" class="secondary" style="width:auto;margin-top:0">העתק ALL BOXES</button>
    </div>
    <pre id="calOut" style="margin:0;direction:ltr;text-align:left;white-space:pre-wrap;background:#f8fafc;border:1px solid var(--border);padding:10px;border-radius:10px"></pre>
    <div class="muted">כיול פעיל רק לשאלות hotspot. כל 4 לחיצות = מרובע. Toggle: Ctrl+K</div>
  `;

  el.hotspotWrap.appendChild(panel);
  CAL.panelEl = panel;

  panel.querySelector("#calUndo").onclick = () => {
    CAL.points.pop();
    removeLastCalMarker();
    updateCalPanel();
  };

  panel.querySelector("#calClearPts").onclick = () => {
    CAL.points = [];
    clearCalMarkers();
    updateCalPanel();
  };

  panel.querySelector("#calClearAll").onclick = () => {
    CAL.points = [];
    CAL.boxes = [];
    clearCalMarkers();
    updateCalPanel();
  };

  panel.querySelector("#calCopyLast").onclick = async () => {
    const last = CAL.boxes[CAL.boxes.length - 1];
    if (!last) return;
    const txt = `{ x1: ${last.x1}, y1: ${last.y1}, x2: ${last.x2}, y2: ${last.y2} }`;
    try { await navigator.clipboard.writeText(txt); } catch {}
    updateCalPanel("הועתק ✅");
  };

  panel.querySelector("#calCopyAll").onclick = async () => {
    const txt = renderBoxesArray(CAL.boxes);
    if (!txt) return;
    try { await navigator.clipboard.writeText(txt); } catch {}
    updateCalPanel("הועתק ✅");
  };
}
function updateCalPanel(statusText=""){
  if (!CAL.panelEl) return;

  const st = CAL.panelEl.querySelector("#calState");
  const out = CAL.panelEl.querySelector("#calOut");

  st.textContent = CAL.enabled
    ? `כיול: פעיל ✅ | נקודות ברביעייה: ${CAL.points.length}/4 | מרובעים: ${CAL.boxes.length}${statusText ? " | " + statusText : ""}`
    : `כיול: כבוי`;

  const boxesTxt = renderBoxesArray(CAL.boxes);
  const pending = buildBoxFromPoints(CAL.points);

  out.textContent =
    (boxesTxt ? `boxes:\n${boxesTxt}\n\n` : "boxes: []\n\n") +
    (pending ? `pending box (from current 4):\n{ x1: ${pending.x1}, y1: ${pending.y1}, x2: ${pending.x2}, y2: ${pending.y2} }`
             : "לחץ/י נקודות… כל 4 נקודות ייצרו מרובע חדש.");
}
function buildBoxFromPoints(points){
  if (!points || points.length < 4) return null;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const x1 = round2(Math.min(...xs));
  const x2 = round2(Math.max(...xs));
  const y1 = round2(Math.min(...ys));
  const y2 = round2(Math.max(...ys));
  return { x1, y1, x2, y2 };
}
function round2(n){ return Math.round(n * 100) / 100; }
function renderBoxesArray(boxes){
  if (!boxes || boxes.length === 0) return "";
  const lines = boxes.map(b => `  { x1: ${b.x1}, y1: ${b.y1}, x2: ${b.x2}, y2: ${b.y2} }`);
  return `[\n${lines.join(",\n")}\n]`;
}

// markers (calibration)
function addCalMarker(xPct, yPct){
  const m = document.createElement("div");
  m.className = "hotspot-marker cal";
  m.style.left = `${xPct}%`;
  m.style.top = `${yPct}%`;
  el.hotspotOverlay.appendChild(m);
}
function clearCalMarkers(){
  el.hotspotOverlay.querySelectorAll(".hotspot-marker.cal").forEach(n => n.remove());
}
function removeLastCalMarker(){
  const all = el.hotspotOverlay.querySelectorAll(".hotspot-marker.cal");
  if (all.length) all[all.length - 1].remove();
}

// =========================
// CONFIG
// =========================
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzQxCavHELnbrTkeRRV-cmVEENZXW8eKhySjmmttu-QyM9ZsPT5M6JOyhaHnYo4TVhGCg/exec";

const HOTSPOT_MAX_CLICKS = 5;

// דוגמה: איזורי hotspot (אם לכל שאלה יש boxes משלה – אפשר להכניס בתוך השאלה ולהפסיק להשתמש בקבוע)
/*const HOTSPOT_BOXES = [
  { x1: 37.01, y1: 21.68, x2: 77.71, y2: 27.35 },
  { x1: 16.45, y1: 58.05, x2: 52.63, y2: 68.11 },
  { x1: 12.54, y1: 67.92, x2: 48.93, y2: 77.40 },
  { x1: 46.88, y1: 53.70, x2: 83.47, y2: 64.68 },
  { x1: 49.14, y1: 72.66, x2: 83.68, y2: 83.06 }
];*/

const DRAG_ZONES_4x2 = [
  { side:"L", left: 6,  top: 24, w: 22, h: 9 },
  { side:"L", left: 6,  top: 38, w: 22, h: 9 },
  { side:"L", left: 6,  top: 52, w: 22, h: 9 },
  { side:"L", left: 6,  top: 66, w: 22, h: 9 },
  { side:"R", left: 72, top: 24, w: 22, h: 9 },
  { side:"R", left: 72, top: 38, w: 22, h: 9 },
  { side:"R", left: 72, top: 52, w: 22, h: 9 },
  { side:"R", left: 72, top: 66, w: 22, h: 9 },
];

// =========================
// SPECIAL TEXT FORMATTER
// =========================
function formatSpecial(text) {
  let s = String(text ?? "");

  s = s.replace(/\[P\](.*?)\[\/P\]/g, '<span class="hl-parve">$1</span>');
  s = s.replace(/\[B\](.*?)\[\/B\]/g, '<span class="hl-meat">$1</span>');
  s = s.replace(/\[H\](.*?)\[\/H\]/g, '<span class="hl-dairy">$1</span>');

  // מחיקת רווח אחרי אות יחס לפני תגית
  s = s.replace(
    /(^|[^\u0590-\u05FF])([הלבכמוש])\s+(<span class="hl-(?:parve|dairy|meat)">)/g,
    "$1$2$3"
  );

  return s;
}

// =========================
// QUESTIONS (DATA ONLY)
// ✅ תוספת חדשה: leadImg / leadCaption
// אפשר לשים בכל שאלה (במיוחד mc_single/mc_multi)
// =========================
const QUESTIONS = [
  {
    type: "hotspot5",
    title: "לחץ/י על מקום התקלות בתמונה (עד 5 לחיצות)",
    img: "images/q3_hotspot.jpeg",
    boxes: [
      {
        x1: 37.01, y1: 21.68, x2: 77.71, y2: 27.35,
        label: "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P] וגם מעל [P]פרווה[/P] פתוח"
      },
      {
        x1: 16.45, y1: 58.05, x2: 52.63, y2: 68.11,
        label: "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P]"
      },
      {
        x1: 12.54, y1: 67.92, x2: 48.93, y2: 77.40,
        label: "תבנית [B]בשרית[/B] על עגלה [P]פרווה[/P]"
      },
      {
        x1: 46.88, y1: 53.70, x2: 83.47, y2: 64.68,
        label: "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P] ומעל תבנית [B]בשרית[/B]"
      },
      {
        x1: 49.14, y1: 72.66, x2: 83.68, y2: 83.06,
        label: "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P]"
      }
    ],
    wrongMsg: "❌ שימו לב לצבע של העגלה, מה בטעות שמו עליה?"
  },

  {
    type: "mc_single",
    title: "מצאת תבנית כזו, מה תעשה איתה?",
    leadImg: "images/tavnit.jpg",
    options: [
      "תבנית בלי חורים יכולה לשמש ל[B]בשרי[/B]",
      "ניתן להשתמש בה כבסיס לתבניות אחרות בתנור",
      "היא לא מסומנת, יש לפנות למשגיח",
      "היא לא מסומנת אבל ניתן להשתמש בכל זאת"
    ],
    correctIndex: 2,
    wrongMsg: "❌ לא נכון. כשהתבנית לא מסומנת – לא משתמשים ופונים למשגיח."
  },

  {
    type: "two",
    title: "בחר את הכף [H]החלבית[/H]",
    A: { img: "images/q1_a1.jpg", caption: "כף עם חור" },
    B: { img: "images/q1_a2.png", caption: "כף בלי חור" },
    correct: "A",
    wrongMsg: "❌ זו לא הכף [H]החלבית[/H]. שימו לב לאות הראשונה של המילים: חור / בלי חור."
  },
  {
    type: "drag_shelves",
    title: "גררו כל מוצר למדף הנכון לפי התרשים שראיתם",
    introTitle: "התבוננו בתרשים ואז לחצו המשך.",
    introImg: "images/intro_chart.png",
    bgImg: "images/roomshelves.png",
    zones: DRAG_ZONES_4x2,
    items: [
      { img:"images/prod1.jpg", caption:"חלב", side:"R", wrongMsg:"❌ חלב הוא [H]חלבי[/H]. צריך לשים בצד ימין." },
      { img:"images/prod2.jpg", caption:"שתיה", side:"L", wrongMsg:"❌ בקבוקי שתיה מתוקה הם [P]פרווה[/P]. צריך לשים בצד שמאל." },
      { img:"images/prod3.jpg", caption:"חומוס", side:"L", wrongMsg:"❌ חומוס, טחינה וסלטים הם [P]פרווה[/P]. יש לשים בצד שמאל." },
      { img:"images/prod4.jpg", caption:"קוטג'", side:"R", wrongMsg:"❌ קוטג' הוא [H]חלבי[/H]. לשים בצד ימין." },
      { img:"images/prod5.jpg", caption:"חלב סויה", side:"L", wrongMsg:"❌למרות שזה נקרא חלב סויה, הסויה היא [P]פרווה[/P]. יש לשים בצד שמאל." },
      { img:"images/prod6.jpg", caption:"מילקי", side:"R", wrongMsg:"❌ המילקי הוא מעדן המכיל חלב, ולכן הוא [H]חלבי[/H]. ושייך לצד ימין." },
      { img:"images/prod7.jpg", caption:"גבינה צהובה", side:"R", wrongMsg:"❌ גבינה צהובה מכילה חלב היא [H]חלבית[/H]. יש לשים בצד ימין." },
      { img:"images/prod8.jpg", caption:"מעדן סויה", side:"L", wrongMsg:"❌ סויה הוא [P]פרווה[/P]. לא להתבלבל עם מעדן חלבי.. לשים בצד שמאל." },
    ]
  },
  {
    type: "two",
    title: "איזה גסטרונום שייך ל[P]פרווה[/P]?",
    A: { img: "images/q2_a.jpg", caption: "3 חורים" },
    B: { img: "images/q2_b.jpg", caption: "2 חורים" },
    correct: "B",
    wrongMsg: "❌ זה לא הגסטרונום ה[P]פרווה[/P]. רמז - תמיד יש הפרדה בין [B]בשרי[/B] (3 חורים) [H]לחלבי[/H] (חור 1)."
  },
    // ✅ דוגמה: תמונה לפני רב-ברירה
  {
    type: "mc_single",
    title: "איך ניתן להכניס כלים [B]בשריים[/B] לחדר [P]פרווה[/P]?",
    //leadImg: "images/mc_intro.jpg",
    //leadCaption: "תסתכל/י על הסיטואציה ואז ענה/י",
    options: [
      "אסור להכניס כלים [B]בשריים[/B] לחדר [P]פרווה[/P]",
      "על עגלה [B]בשרית[/B] בלבד",
      "רק כאשר מניחים על הרצפה",
      "רק על משטחים נקיים אחרי ווידוא שגם הכלי נקי ויבש"
    ],
    correctIndex: 1,
    wrongMsg: "❌ לא נכון. הכנסת כלי [B]בשרי[/B] לחדר [P]פרווה[/P] מותרת רק על עגלה בשרית."
  },

  {
    type: "mc_multi",
    title: "האם מותר שיהיה במקרר אחד גם [H]חלבי[/H] וגם [P]פרווה[/P]?",
    //leadImg: "images/fridge.png",
    options: [
      "לא, אסור בשום אופן",
      "לא אלא אם כן המשגיח אישר",
      "כן, אם יש תרשים על המקרר ומסדרים לפיו.",
      "כן, אם ה[P]פרווה[/P] תמיד למעלה וסגור היטב."
    ],
    correctIndexes: [2, 3],
    wrongMsg: "❌ לא נכון. מותר לשלב במקרר רק אם יש הפרדה ברורה וסידור קבוע שמונע טפטוף/מגע."
  },

  {
    type: "img_multi10",
    title: "בחר/י את כל המוצרים שניתן להכניס למקרר [P]פרווה[/P]",
    items: [
      { img: "images/pp1.jpg", alt: "מילקי", caption: "מילקי"},
      { img: "images/pp2.jpg", alt: "מלפפונים", caption: "מלפפונים" },
      { img: "images/pp3.jpg", alt: "חלב סויה", caption: "חלב סויה" },
      { img: "images/pp4.jpg", alt: "קוטג'", caption: "קוטג'" },
      { img: "images/pp5.jpg", alt: "גבינה צהובה", caption: "גבינה צהובה" },
      { img: "images/pp6.jpg", alt: "שתיה מתוקה", caption: "שתיה מתוקה" },
      { img: "images/pp7.jpg", alt: "חלב", caption: "חלב" },
      { img: "images/pp8.jpg", alt: "חומוס", caption: "חומוס" },
      { img: "images/pp9.jpg", alt: "מעדן סויה", caption: "מעדן סויה" },
      { img: "images/pp10.jpg", alt: "ביצים", caption: "ביצים" }
    ],
    correctIndexes: [1, 2, 5, 7, 8, 9],
    wrongMsgByIndex: {
      0: "❌ אסור להכניס מעדנים חלביים!",
      3: "❌ אסור להכניס קוטג' או גבינה לבנה!",
      4: "❌ אסור להכניס מוצרי חלב מכל סוג!",
      6: "❌ אסור להכניס חלב!"
    },
    wrongMsg: "❌ יש בחירה לא נכונה. נסו שוב."
  }
];

// =========================
// DOM
// =========================
const el = {
  screenStart: document.getElementById("screen-start"),
  screenQuiz: document.getElementById("screen-quiz"),
  screenResult: document.getElementById("screen-result"),

  fullName: document.getElementById("fullName"),
  personalId: document.getElementById("personalId"),
  kitchen: document.getElementById("kitchen"),
  btnStart: document.getElementById("btnStart"),
  startError: document.getElementById("startError"),

  progress: document.getElementById("progress"),
  questionTitle: document.getElementById("questionTitle"),

  leadWrap: document.getElementById("leadWrap"),
  leadImg: document.getElementById("leadImg"),
  leadCap: document.getElementById("leadCap"),

  twoWrap: document.getElementById("twoWrap"),
  imgA: document.getElementById("imgA"),
  imgB: document.getElementById("imgB"),
  capA: document.getElementById("capA"),
  capB: document.getElementById("capB"),

  hotspotWrap: document.getElementById("hotspotWrap"),
  hotspotImg: document.getElementById("hotspotImg"),
  hotspotOverlay: document.getElementById("hotspotOverlay"),
  hotspotStatus: document.getElementById("hotspotStatus"),
  hotspotMarks: document.getElementById("hotspotMarks"),

  mcWrap: document.getElementById("mcWrap"),
  mcHint: document.getElementById("mcHint"),
  mcOptions: document.getElementById("mcOptions"),

  imgMultiWrap: document.getElementById("imgMultiWrap"),
  imgMultiGrid: document.getElementById("imgMultiGrid"),
  imgMultiFeedback: document.getElementById("imgMultiFeedback"),

  dragWrap: document.getElementById("dragWrap"),
  dragIntro: document.getElementById("dragIntro"),
  dragPlay: document.getElementById("dragPlay"),
  dragIntroImg: document.getElementById("dragIntroImg"),
  dragStage: document.getElementById("dragStage"),
  dragBg: document.getElementById("dragBg"),
  dragZones: document.getElementById("dragZones"),
  dragItem: document.getElementById("dragItem"),
  dragItemImg: document.getElementById("dragItemImg"),
  dragItemCap: document.getElementById("dragItemCap"),
  dragFeedback: document.getElementById("dragFeedback"),

  btnNext: document.getElementById("btnNext"),
  feedback: document.getElementById("feedback"),

  sendStatus: document.getElementById("sendStatus"),
};

// =========================
// STATE
// =========================
const state = {
  user: { fullName:"", personalId:"", kitchen:"" },
  idx: 0,
  sentThisRun: false,

  // per-question runtime
  runtime: {
    two: { selected: null },
    hotspot: { attempts: [], hit: [] },
    mc: { selected: [] },
    imgMulti: { selected: [] },
    drag: { phase: "intro", qIdx: -1, itemIndex: 0, placed: [], filled: {L:0,R:0} }
  }
};

// =========================
// IMAGE PRELOAD (REAL)
// =========================
const IMG_CACHE = new Map(); // url -> Image

async function preloadImage(url){
  if (!url) return;
  if (IMG_CACHE.has(url)) return;

  const img = new Image();
  img.decoding = "async";
  img.loading = "eager";
  img.src = url;
  IMG_CACHE.set(url, img);

  try { await img.decode(); }
  catch {
    await new Promise((res) => { img.onload = () => res(); img.onerror = () => res(); });
  }
}

function collectAllImageUrls(){
  const urls = new Set();

  for (const q of QUESTIONS){
    if (q.leadImg) urls.add(q.leadImg);

    if (!q.type || q.type === "two"){
      if (q.A?.img) urls.add(q.A.img);
      if (q.B?.img) urls.add(q.B.img);
    }

    if (q.type === "hotspot5" && q.img) urls.add(q.img);

    if (q.type === "img_multi10" && Array.isArray(q.items)){
      q.items.forEach(it => it?.img && urls.add(it.img));
    }

    if (q.type === "drag_shelves"){
      if (q.introImg) urls.add(q.introImg);
      if (q.bgImg) urls.add(q.bgImg);
      if (Array.isArray(q.items)) q.items.forEach(it => it?.img && urls.add(it.img));
    }
  }

  return Array.from(urls);
}

async function preloadAllQuestionImages(){
  const urls = collectAllImageUrls();
  for (const url of urls){
    await preloadImage(url);
    await new Promise(r => setTimeout(r, 0));
  }
  console.log("Preloaded+decoded:", urls.length);
}

// =========================
// VALIDATIONS (START)
// =========================
function isFullNameValid(fullName){
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}
function isDigitsOnly(s){ return /^[0-9]+$/.test(s); }

function isIsraeliIdValid(id){
  if (!/^\d{9}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++){
    let n = Number(id[i]) * ((i % 2) + 1);
    if (n > 9) n = Math.floor(n / 10) + (n % 10);
    sum += n;
  }
  return sum % 10 === 0;
}

// =========================
// UI HELPERS
// =========================
function hideAllQuestionUIs(){
  el.leadWrap.hidden = true;

  el.twoWrap.hidden = true;
  el.hotspotWrap.hidden = true;
  el.mcWrap.hidden = true;
  el.imgMultiWrap.hidden = true;
  el.dragWrap.hidden = true;

  el.feedback.hidden = true;
  el.feedback.classList.remove("errorbox");
  el.feedback.innerHTML = "";

  el.btnNext.disabled = true;

  // ניקוי hotspot
  el.hotspotOverlay.innerHTML = "";
  el.hotspotMarks.innerHTML = "";
  el.hotspotStatus.textContent = "";

  // ניקוי mc/imgmulti
  el.mcHint.textContent = "";
  el.mcOptions.innerHTML = "";
  el.imgMultiGrid.innerHTML = "";
  el.imgMultiFeedback.hidden = true;
  el.imgMultiFeedback.textContent = "";

  // ניקוי drag
  el.dragZones.innerHTML = "";
  el.dragFeedback.hidden = true;
  el.dragFeedback.innerHTML = "";

  // Force hide & wipe (aggressive)
  [el.twoWrap, el.hotspotWrap, el.mcWrap, el.imgMultiWrap, el.dragWrap].forEach(w => {
    w.hidden = true;
    w.style.display = "none";
    requestAnimationFrame(() => { w.style.display = ""; }); // חוזר לברירת המחדל של CSS
  });
  
  // wipe images (prevents old frames flashing)
  [el.leadImg, el.imgA, el.imgB, el.hotspotImg, el.dragIntroImg, el.dragBg, el.dragItemImg].forEach(im => {
    if (im) im.removeAttribute("src");
  });
  // calibration panel visibility + markers
  if (CAL.enabled) ensureCalPanel();
  if (CAL.panelEl) CAL.panelEl.style.display = (CAL.enabled ? "" : "none");
  clearCalMarkers();
  CAL.points = [];
  updateCalPanel();

}

function renderLead(q){
  if (!q.leadImg){
    el.leadWrap.hidden = true;
    return;
  }
  el.leadWrap.hidden = false;
  el.leadImg.src = q.leadImg;

  const cap = (q.leadCaption ?? "").trim();
  if (cap){
    el.leadCap.hidden = false;
    el.leadCap.innerHTML = formatSpecial(cap); // innerHTML חובה
  } else {
    el.leadCap.hidden = true;
    el.leadCap.innerHTML = "";
  }
}

function failAndRetry(q, fallbackMsg){
  const msg = q?.wrongMsg || fallbackMsg || "לא נכון ❌ נסו שוב.";

  el.feedback.classList.add("errorbox");
  el.feedback.hidden = false;
  el.feedback.innerHTML = `
    <div>${formatSpecial(msg)}</div>
    <div style="margin-top:10px;">
      <button type="button" id="btnRetryNow" class="secondary">נסו שוב</button>
    </div>
  `;

  el.btnNext.disabled = true;

  const btn = document.getElementById("btnRetryNow");
  if (btn){
    btn.onclick = () => {
      el.feedback.hidden = true;
      el.feedback.classList.remove("errorbox");
      renderQuestion();
    };
  }
}

// =========================
// QUESTION TYPE ENGINE
// =========================
const TYPE = {
  two: {
    render(q){
      el.twoWrap.hidden = false;
      const runtime = state.runtime.two;
      runtime.selected = null;
      el.btnNext.disabled = true;

      // reset selected border
      el.twoWrap.querySelectorAll(".img-choice").forEach(b => b.classList.remove("selected"));

      el.imgA.src = q.A.img;
      el.imgB.src = q.B.img;
      el.capA.textContent = q.A.caption || "";
      el.capB.textContent = q.B.caption || "";
    },
    onChoice(letter){
      const runtime = state.runtime.two;
      runtime.selected = letter;
      el.btnNext.disabled = false;

      el.twoWrap.querySelectorAll(".img-choice").forEach(b => b.classList.remove("selected"));
      const btn = el.twoWrap.querySelector(`[data-two="${letter}"]`);
      if (btn) btn.classList.add("selected");
    },
    validate(q){
      return state.runtime.two.selected === q.correct;
    }
  },

  hotspot5: {
    render(q){
      el.hotspotWrap.hidden = false;
      el.hotspotImg.src = q.img;

      const boxes = q.boxes || [];
      state.runtime.hotspot.attempts = [];
      state.runtime.hotspot.hit = Array(boxes.length).fill(false);

      updateHotspotUI(q);

      el.hotspotOverlay.onclick = (ev) => {
      const rect = el.hotspotOverlay.getBoundingClientRect();
      const xPct = ((ev.clientX - rect.left) / rect.width) * 100;
      const yPct = ((ev.clientY - rect.top) / rect.height) * 100;
    
      // =========================
      // CALIBRATION MODE (MULTI BOXES)
      // =========================
      if (CAL.enabled){
        ensureCalPanel();
    
        CAL.points.push({ x: xPct, y: yPct });
        addCalMarker(xPct, yPct);
    
        // כל 4 נקודות -> מרובע חדש
        if (CAL.points.length === 4){
          const box = buildBoxFromPoints(CAL.points);
          CAL.boxes.push(box);
          CAL.points = [];
          clearCalMarkers(); // מתחילים רביעייה חדשה
        }
    
        updateCalPanel();
        return;
      }
    
      // =========================
      // NORMAL QUIZ MODE
      // =========================
      const rt = state.runtime.hotspot;
    
      if (rt.attempts.length >= HOTSPOT_MAX_CLICKS){
        el.feedback.hidden = false;
        el.feedback.textContent = "הגעת למספר הלחיצות המקסימלי.";
        return;
      }
    
      const marker = document.createElement("div");
      marker.className = "hotspot-marker";
      marker.style.left = `${xPct}%`;
      marker.style.top = `${yPct}%`;
      el.hotspotOverlay.appendChild(marker);
    
      const boxes = q.boxes || [];
      let hitIndex = null;
    
      for (let i = 0; i < boxes.length; i++){
        if (rt.hit[i]) continue;
        const b = boxes[i];
        if (xPct >= b.x1 && xPct <= b.x2 && yPct >= b.y1 && yPct <= b.y2){
          hitIndex = i;
          rt.hit[i] = true;
          break;
        }
      }
    
      rt.attempts.push({ hitIndex, markerEl: marker });
    
      el.feedback.hidden = false;
      el.feedback.textContent = (hitIndex !== null) ? "נכון ✅" : "לא נכון ❌";
    
      el.btnNext.disabled = rt.attempts.length === 0;
      updateHotspotUI(q);
    };

    },
    validate(q){
      const boxes = q.boxes || [];
      const hits = state.runtime.hotspot.hit.filter(Boolean).length;
      return hits === boxes.length;
    }
  },

  mc_single: {
    render(q){
      el.mcWrap.hidden = false;
      state.runtime.mc.selected = [];
      el.btnNext.disabled = true;

      el.mcHint.textContent = "";
      el.mcOptions.innerHTML = "";

      q.options.forEach((opt, i) => {
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

        row.addEventListener("click", () => {
          inp.checked = true;
          state.runtime.mc.selected = [i];
          el.btnNext.disabled = false;
        });

        el.mcOptions.appendChild(row);
      });
    },
    validate(q){
      const chosen = state.runtime.mc.selected[0];
      return chosen === q.correctIndex;
    }
  },

  mc_multi: {
    render(q){
      el.mcWrap.hidden = false;
      state.runtime.mc.selected = [];
      el.btnNext.disabled = true;

      el.mcHint.textContent = "שימו לב: יש יותר מתשובה אחת נכונה.";
      el.mcOptions.innerHTML = "";

      q.options.forEach((opt, i) => {
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

        row.addEventListener("click", (e) => {
          if (e.target !== inp) inp.checked = !inp.checked;

          if (inp.checked){
            if (!state.runtime.mc.selected.includes(i)) state.runtime.mc.selected.push(i);
          } else {
            state.runtime.mc.selected = state.runtime.mc.selected.filter(x => x !== i);
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

      q.items.forEach((it, idx) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "img-multi-card";
        card.dataset.idx = String(idx);

        const im = document.createElement("img");
        im.src = it.img;
        im.alt = it.alt || `תמונה ${idx+1}`;

        const cap = document.createElement("div");
        cap.className = "img-multi-caption";
        cap.innerHTML = formatSpecial(it.caption || it.alt || "");

        card.appendChild(im);
        card.appendChild(cap);

        card.addEventListener("click", (e) => {
          e.preventDefault();

          const selected = state.runtime.imgMulti.selected;
          const exists = selected.includes(idx);
          if (exists) state.runtime.imgMulti.selected = selected.filter(x => x !== idx);
          else selected.push(idx);

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
      if (wrongPicked.length > 0){
        const firstWrong = wrongPicked[0];
        const card = el.imgMultiGrid.querySelector(`.img-multi-card[data-idx="${firstWrong}"]`);
        if (card) card.classList.add("wrong");

        const msg = (q.wrongMsgByIndex && q.wrongMsgByIndex[firstWrong])
          ? q.wrongMsgByIndex[firstWrong]
          : "❌ יש מוצר שנבחר לא נכון. נסו שוב.";

        failAndRetry({ wrongMsg: msg }, msg);
        return null; // אומר: אל תתקדם, כבר הראינו failAndRetry
      }

      const missing = correct.filter(i => !chosen.includes(i));
      if (missing.length > 0) return false;

      return true;
    }
  },

  drag_shelves: {
    render(q){
      el.dragWrap.hidden = false;

      // init state once per question index
      if (state.runtime.drag.qIdx !== state.idx){
        state.runtime.drag = {
          qIdx: state.idx,
          phase: "intro",
          itemIndex: 0,
          placed: Array(q.items.length).fill(false),
          filled: { L:0, R:0 }
        };
      }

      const rt = state.runtime.drag;

      if (rt.phase === "intro"){
        el.dragIntro.hidden = false;
        el.dragPlay.hidden = true;

        el.questionTitle.innerHTML = formatSpecial(q.introTitle || "התבוננו בתרשים ואז לחצו המשך.");
        el.dragIntroImg.src = q.introImg;

        el.btnNext.disabled = false;
        return;
      }

      // play
      el.dragIntro.hidden = true;
      el.dragPlay.hidden = false;
      el.dragBg.src = q.bgImg;

      buildDragZonesOnce(q);
      showCurrentDragItem(q);
      enablePointerDrag();
      el.btnNext.disabled = true;
    },
    validate(q){
      const rt = state.runtime.drag;
      const done = rt.itemIndex >= q.items.length && rt.placed.every(Boolean);
      return done;
    },
    advancePhase(){
      state.runtime.drag.phase = "play";
    }
  }
};

// =========================
// HOTSPOT UI
// =========================
function updateHotspotUI(q){
  const rt = state.runtime.hotspot;
  const hits = rt.hit.filter(Boolean).length;
  const boxes = q.boxes || [];
  const attempts = rt.attempts.length;

  el.hotspotStatus.textContent = `פגיעות: ${hits}/${boxes.length} | לחיצות: ${attempts}/${HOTSPOT_MAX_CLICKS}`;

  el.hotspotMarks.innerHTML = "";
  rt.attempts.forEach((a, idx) => {
    const row = document.createElement("div");
    row.className = "mark-row";

    const txt = document.createElement("div");
    txt.className = "txt";
    const s = (a.hitIndex !== null) ? "✅" : "❌";

    let label = "לא תקלה";
    if (a.hitIndex !== null) {
      const box = (q.boxes || [])[a.hitIndex];
      label = box?.label || `תקלה ${a.hitIndex + 1}`;
    }
    
    txt.innerHTML = `${idx + 1}) ${s} ${formatSpecial(label)}`;


    const del = document.createElement("button");
    del.className = "btn-del";
    del.type = "button";
    del.textContent = "מחק";
    del.onclick = () => deleteAttempt(q, idx);

    row.appendChild(txt);
    row.appendChild(del);
    el.hotspotMarks.appendChild(row);
  });
}

function deleteAttempt(q, idx){
  const rt = state.runtime.hotspot;
  const a = rt.attempts[idx];
  if (!a) return;

  try { a.markerEl.remove(); } catch {}
  if (a.hitIndex !== null) rt.hit[a.hitIndex] = false;

  rt.attempts.splice(idx, 1);

  el.btnNext.disabled = rt.attempts.length === 0;
  el.feedback.hidden = false;
  el.feedback.textContent = "נמחק. אפשר ללחוץ שוב.";
  updateHotspotUI(q);
}

// =========================
// DRAG LOGIC
// =========================
function buildDragZonesOnce(q){
  if (el.dragZones.childElementCount > 0) return;

  q.zones.forEach((z, zi) => {
    const dz = document.createElement("div");
    dz.className = "drag-zone";
    dz.dataset.side = z.side;
    dz.dataset.zi = String(zi);

    dz.style.left = z.left + "%";
    dz.style.top = z.top + "%";
    dz.style.width = z.w + "%";
    dz.style.height = z.h + "%";

    dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("over"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("over"));
    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.classList.remove("over");
      onDropToZone(dz.dataset.side, dz);
    });

    el.dragZones.appendChild(dz);
  });

  // desktop dragstart
  el.dragItem.ondragstart = (e) => {
    e.dataTransfer.setData("text/plain", "dragItem");
  };
}

function showCurrentDragItem(q){
  const rt = state.runtime.drag;

  while (rt.itemIndex < q.items.length && rt.placed[rt.itemIndex]) rt.itemIndex++;

  if (rt.itemIndex >= q.items.length){
    el.dragItem.style.display = "none";
    el.btnNext.disabled = false;
    return;
  }

  const it = q.items[rt.itemIndex];
  el.dragItem.style.display = "block";
  el.dragItemImg.src = it.img;
  el.dragItemCap.innerHTML = formatSpecial(it.caption || "");

  el.dragFeedback.hidden = true;
  el.dragFeedback.innerHTML = "";
}

function onDropToZone(side, zoneEl){
  const q = QUESTIONS[state.idx];
  const rt = state.runtime.drag;
  const it = q.items[rt.itemIndex];
  if (!it) return;

  const correctSide = it.side;

  if (side !== correctSide){
    el.dragFeedback.hidden = false;
    el.dragFeedback.innerHTML = formatSpecial(it.wrongMsg || "❌ לא נכון. נסו שוב.");
    zoneEl.classList.add("wrong");
    setTimeout(()=> zoneEl.classList.remove("wrong"), 600);
    return;
  }

  zoneEl.classList.add("filled");
  zoneEl.classList.remove("over");
  zoneEl.innerHTML = `<img src="${it.img}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:10px;background:#fff;" />`;

  rt.placed[rt.itemIndex] = true;
  rt.filled[side]++;

  rt.itemIndex++;
  showCurrentDragItem(q);
}

function enablePointerDrag(){
  if (!el.dragItem || !el.dragStage) return;

  let dragging = false;
  let offsetX = 0, offsetY = 0;

  function resetToCenter(){
    el.dragItem.style.left = "50%";
    el.dragItem.style.top = "55%";
    el.dragItem.style.transform = "translate(-50%, -50%)";
  }

  resetToCenter();

  el.dragItem.onpointerdown = (e) => {
    dragging = true;
    el.dragItem.setPointerCapture(e.pointerId);

    const r = el.dragItem.getBoundingClientRect();
    offsetX = e.clientX - r.left;
    offsetY = e.clientY - r.top;

    el.dragItem.style.transform = "none";
  };

  el.dragItem.onpointermove = (e) => {
    if (!dragging) return;

    const stage = el.dragStage.getBoundingClientRect();
    const left = e.clientX - stage.left - offsetX;
    const top  = e.clientY - stage.top  - offsetY;

    el.dragItem.style.left = left + "px";
    el.dragItem.style.top  = top + "px";
  };

  el.dragItem.onpointerup = (e) => {
    if (!dragging) return;
    dragging = false;

    const cx = e.clientX;
    const cy = e.clientY;

    const zones = Array.from(el.dragZones.querySelectorAll(".drag-zone"));
    const hit = zones.find(z => {
      const zr = z.getBoundingClientRect();
      return cx >= zr.left && cx <= zr.right && cy >= zr.top && cy <= zr.bottom;
    });

    if (hit) onDropToZone(hit.dataset.side, hit);
    resetToCenter();
  };
}

// =========================
// FLOW
// =========================
function startFromBeginning(){
  state.idx = 0;
  state.sentThisRun = false;

  // reset runtimes
  state.runtime.two.selected = null;
  state.runtime.hotspot = { attempts: [], hit: [] };
  state.runtime.mc.selected = [];
  state.runtime.imgMulti.selected = [];
  state.runtime.drag = { phase:"intro", qIdx:-1, itemIndex:0, placed:[], filled:{L:0,R:0} };

  el.screenStart.hidden = true;
  el.screenResult.hidden = true;
  el.screenQuiz.hidden = false;

  renderQuestion();
}

function renderQuestion(){
  const q = QUESTIONS[state.idx];

  hideAllQuestionUIs();

  el.progress.textContent = `שאלה ${state.idx + 1} מתוך ${QUESTIONS.length}`;
  el.questionTitle.innerHTML = formatSpecial(q.title); // innerHTML חובה

  // lead image optional
  renderLead(q);

  // normalize type default
  const type = q.type || "two";
  const handler = TYPE[type];
  if (!handler) {
    el.feedback.hidden = false;
    el.feedback.textContent = `Type לא מוכר: ${type}`;
    return;
  }

  handler.render(q);
}

function goNext(){
  state.idx++;
  if (state.idx >= QUESTIONS.length) finish();
  else renderQuestion();
}

// =========================
// EVENTS
// =========================
el.btnStart.addEventListener("click", onStart);

el.twoWrap.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-two]");
  if (!btn) return;
  TYPE.two.onChoice(btn.dataset.two);
});

el.btnNext.addEventListener("click", onNext);

window.addEventListener("DOMContentLoaded", () => {
  // preload בזמן טעינת דף (לא חוסם)
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => preloadAllQuestionImages(), { timeout: 2000 });
  } else {
    setTimeout(() => preloadAllQuestionImages(), 300);
  }
});

// =========================
// START
// =========================
async function onStart(){
  const fullName = el.fullName.value.trim();
  const personalId = el.personalId.value.trim();
  const kitchen = el.kitchen.value.trim();

  if (!fullName){
    el.startError.hidden = false;
    el.startError.textContent = "נא למלא שם.";
    return;
  }
  if (!personalId){
    el.startError.hidden = false;
    el.startError.textContent = "נא למלא ת.ז/מספר אישי.";
    return;
  }
  if (!kitchen){
    el.startError.hidden = false;
    el.startError.textContent = "נא לבחור מטבח.";
    return;
  }
  if (!isFullNameValid(fullName)){
    el.startError.hidden = false;
    el.startError.textContent = "נא להזין שם מלא (לפחות שתי מילים).";
    return;
  }
  if (!isDigitsOnly(personalId) || !(personalId.length === 7 || personalId.length === 9)){
    el.startError.hidden = false;
    el.startError.textContent = "ת.ז/מ.א חייב להיות 9 או 7 ספרות (ספרות בלבד).";
    return;
  }
  if (personalId.length === 9 && !isIsraeliIdValid(personalId)){
    el.startError.hidden = false;
    el.startError.textContent = "תעודת הזהות לא תקינה!";
    return;
  }

  el.startError.hidden = true;

  el.btnStart.disabled = true;
  const oldTxt = el.btnStart.textContent;
  el.btnStart.textContent = "טוען תמונות…";

  try {
    await preloadAllQuestionImages();

    state.user = { fullName, personalId, kitchen };
    startFromBeginning();
  } finally {
    el.btnStart.disabled = false;
    el.btnStart.textContent = oldTxt;
  }
}

// =========================
// NEXT
// =========================
function onNext(){
  const q = QUESTIONS[state.idx];
  const type = q.type || "two";
  const handler = TYPE[type];

  // drag intro -> play (לא מתקדם שאלה)
  if (type === "drag_shelves" && state.runtime.drag.phase === "intro"){
    handler.advancePhase();
    renderQuestion();
    return;
  }

  // validate
  const result = handler.validate(q);

  // null = כבר טיפלנו ב-failAndRetry בתוך validate (img_multi10)
  if (result === null) return;

  if (!result){
    return failAndRetry(q, "לא נכון ❌ נסו שוב.");
  }

  goNext();
}

// =========================
// FINISH + SEND
// =========================
async function finish(){
  el.screenQuiz.hidden = true;
  el.screenResult.hidden = false;

  el.sendStatus.textContent = "ההדרכה הושלמה בהצלחה!!!";

  if (state.sentThisRun){
    el.sendStatus.textContent = "הציון כבר נשלח בניסיון הזה.";
    return;
  }

  if (!GOOGLE_SHEETS_WEBAPP_URL){
    el.sendStatus.textContent = "לא הוגדרה כתובת של Google Sheets Web App עדיין.";
    return;
  }

  el.sendStatus.textContent = "שולח תוצאה…";

  try {
    const payload = {
      fullName: state.user.fullName,
      personalId: state.user.personalId,
      kitchen: state.user.kitchen,
    };

    const res = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    state.sentThisRun = true;
    el.sendStatus.textContent = "התוצאה נשלחה בהצלחה ✅";
  } catch (e) {
    el.sendStatus.textContent = "שליחה נכשלה ❌ (בדוק הרשאות Deploy / Anyone)";
    console.error(e);
  }
}
