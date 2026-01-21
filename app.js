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

// (ישן) שליחה ישנה לשיטס – נשארת לגיבוי כשאין rid
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzQxCavHELnbrTkeRRV-cmVEENZXW8eKhySjmmttu-QyM9ZsPT5M6JOyhaHnYo4TVhGCg/exec";

// (חדש) Backend של המערכת (אותו URL שהדבקת ב-admin/register)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlp-QnTsRIs2WJryZvAdBrwe1yVkzfEt8jAwWtPB4LqaIG__2vDH2XXHTyRr4TDsOomg/exec"; // ← הדבק כאן את ה-…/exec של Apps Script החדש

const URL_PARAMS = new URLSearchParams(window.location.search);
const RID = (URL_PARAMS.get("rid") || "").trim();

// ---------- JSONP API (works on GitHub Pages) ----------
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
// -----------------------------------------------------

function setKitchenOptions(kitchens){
  // kitchens יכול להיות:
  // חדש: [{id,name}]
  // ישן: ["מטבח א", "מטבח ב"]

  const first = el.kitchen.querySelector("option[value='']") || el.kitchen.options[0];

  // אם ה-placeholder הנוכחי הוא "טוען..." — מחזירים לברירת מחדל
  const placeholderText =
    (first && first.textContent && !first.textContent.includes("טוען"))
      ? first.textContent
      : "בחר/י מטבח";

  el.kitchen.innerHTML = "";

  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = placeholderText;
  el.kitchen.appendChild(opt0);

  (Array.isArray(kitchens) ? kitchens : []).forEach(k => {
    const opt = document.createElement("option");

    if (typeof k === "string"){
      opt.value = "";             // אין ID בישן
      opt.dataset.name = k;
      opt.textContent = k;
    } else {
      opt.value = String(k.id || "").trim();
      opt.dataset.name = String(k.name || "").trim();
      opt.textContent = String(k.name || "").trim();
    }

    el.kitchen.appendChild(opt);
  });
}
async function initKitchenList(){
  if (!RID) return;

  // נועל את הבחירה בזמן טעינה
  el.kitchen.disabled = true;
  el.kitchen.innerHTML = "";
  const loadingOpt = document.createElement("option");
  loadingOpt.value = "";
  loadingOpt.textContent = "טוען מטבחים…";
  el.kitchen.appendChild(loadingOpt);

  const r = await apiCall("quiz/getKitchens", { rid: RID });

  if (!r || !r.ok || !Array.isArray(r.kitchens) || r.kitchens.length === 0){
    el.startError.hidden = false;
        const netMsg = (!r || r.error === "TIMEOUT" || r.error === "NETWORK_ERROR")
      ? "בדוק את חיבור האינטרנט שלך, ונסה שוב"
      : "לא הצלחנו לטעון את רשימת המטבחים שלך מהמערכת. בדוק APPS_SCRIPT_URL / Deploy של Apps Script.";
    el.startError.textContent = netMsg;
    el.btnStart.disabled = true;
    return;
  }
  const list = Array.isArray(r.kitchens)
    ? r.kitchens
    : (Array.isArray(r.kitchenNames) ? r.kitchenNames : []);
  setKitchenOptions(list);
  el.kitchen.disabled = false;
  preloadAllQuestionImages();// פותח בחזרה אחרי הצלחה
}
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
    /(^|[^\u0590-\u05FF])([הכמוש])\s+(<span class="hl-(?:parve|dairy|meat)">)/g,
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
    type: "match_lines",
    title: "התאימו בין הסקוטש לכלי",
    left: [
      { key:"red",   img:"images/tape_red.webp",   alt:"סקוטש אדום" },
      { key:"yellow", img:"images/tape_yellow.webp", alt:"סקוטש צהוב" },
      { key:"blue",  img:"images/tape_blue.webp",  alt:"סקוטש כחול" },
    ],
    right: [
      { key:"blue",  img:"images/knife_blue.webp",  alt:"מגש" },
      { key:"red",   img:"images/knife_red.webp",   alt:"צלחת" },
      { key:"yellow", img:"images/knife_yellow.webp", alt:"סכין" },
    ],
    wrongMsg: "❌ התאמה לא נכונה. נסו שוב."
  },
  {
    type: "two",
    title: "איך צריך להגיש בשר ודגים",
    A: { img: "images/fishandmeatplateW.webp", caption: "בתבניות נפרדות" },
    B: { img: "images/fishandmeatplate.webp", caption: "עם הפרדה של פחמימה" },
    correct: "B",
    wrongMsg: "❌ אסור לשים בשר ודגים אחד ליד השני או באותו ארון חימום."
  },
  {
    type: "hotspot5",
    title: "לחץ/י על מקום התקלות בתמונה (עד 5 לחיצות)",
    img: "images/q3_hotspot.webp",
    boxes: [
      {
        x1: 37.01, y1: 21.68, x2: 77.71, y2: 27.35,
        label: "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P] וגם מעל אוכל [P]פרווה[/P] פתוח"
      },
      {
        x1: 16.45, y1: 58.05, x2: 52.63, y2: 68.11,
        label: "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P]"
      },
      {
        x1: 12.54, y1: 67.92, x2: 48.93, y2: 77.40,
        label: "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P]"
      },
      {
        x1: 46.88, y1: 53.70, x2: 83.47, y2: 64.68,
        label: "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P] ומעל תבנית [B]בשרית[/B]"
      },
      {
        x1: 49.14, y1: 72.66, x2: 83.68, y2: 83.06,
        label: "תבנית [B]בשרית[/B] על עגלה [P]פרווה[/P] ומתחת למוצרים [H]חלביים[/H]"
      }
    ],
    wrongMsg: "❌ שימו לב לצבע של העגלה, מה בטעות שמו עליה?"
  },

  {
    type: "mc_single",
    title: "מצאת תבנית כזו, מה תעשה איתה?",
    leadImg: "images/tavnit.webp",
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
    type: "mc_multi",
    title: "אילו סימונים חייבים להיות לתבנית [B]בשרית[/B]?",
    //leadImg: "images/fridge.webp",
    options: [
      "שכל התחתית תהיה צבועה באדום",
      "3 חורים בפינה",
      "גם צבע וגם מדבקה",
      "4 חורים בפינה",
      "מדבקה עם כיתוב '[B]בשרי[/B]'"
    ],
    correctIndexes: [1, 4],
    wrongMsg: "❌ לא נכון. חייבים גם חורים וגם כיתוב '[B]בשרי[/B]'."
  },
  {
    type: "two",
    title: "בחר את הכף [H]החלבית[/H]",
    A: { img: "images/q1_a1.webp", caption: "כף עם חור" },
    B: { img: "images/q1_a2.webp", caption: "כף בלי חור" },
    correct: "A",
    wrongMsg: "❌ זו לא הכף [H]החלבית[/H]. שימו לב לאות הראשונה של המילים: חור / בלי חור."
  },
  {
    type: "drag_shelves",
    title: "גררו כל מוצר למדף הנכון לפי התרשים שראיתם",
    introTitle: "התבוננו בתרשים ואז לחצו המשך.",
    introImg: "images/intro_chart.webp",
    bgImg: "images/roomshelves.webp",
    zones: DRAG_ZONES_4x2,
    items: [
      { img:"images/prod1.webp", caption:"חלב", side:"R", wrongMsg:"❌ חלב הוא [H]חלבי[/H]. צריך לשים בצד ימין." },
      { img:"images/prod2.webp", caption:"שתיה", side:"L", wrongMsg:"❌ בקבוקי שתיה מתוקה הם [P]פרווה[/P]. צריך לשים בצד שמאל." },
      { img:"images/prod3.webp", caption:"חומוס", side:"L", wrongMsg:"❌ חומוס, טחינה וסלטים הם [P]פרווה[/P]. יש לשים בצד שמאל." },
      { img:"images/prod4.webp", caption:"קוטג'", side:"R", wrongMsg:"❌ קוטג' הוא [H]חלבי[/H]. לשים בצד ימין." },
      { img:"images/prod5.webp", caption:"חלב סויה", side:"L", wrongMsg:"❌למרות שזה נקרא חלב סויה, הסויה היא [P]פרווה[/P]. יש לשים בצד שמאל." },
      { img:"images/prod6.webp", caption:"מילקי", side:"R", wrongMsg:"❌ המילקי הוא מעדן המכיל חלב, ולכן הוא [H]חלבי[/H]. ושייך לצד ימין." },
      { img:"images/prod7.webp", caption:"גבינה צהובה", side:"R", wrongMsg:"❌ גבינה צהובה מכילה חלב היא [H]חלבית[/H]. יש לשים בצד ימין." },
      { img:"images/prod8.webp", caption:"מעדן סויה", side:"L", wrongMsg:"❌ סויה הוא [P]פרווה[/P]. לא להתבלבל עם מעדן חלבי.. לשים בצד שמאל." },
    ]
  },
  {
    type: "two",
    title: "איזה גסטרונום שייך ל[P]פרווה[/P]?",
    A: { img: "images/q2_a.webp", caption: "3 חורים" },
    B: { img: "images/q2_b.webp", caption: "2 חורים" },
    correct: "B",
    wrongMsg: "❌ זה לא הגסטרונום ה[P]פרווה[/P]. רמז - תמיד יש הפרדה בין [B]בשרי[/B] (3 חורים) [H]לחלבי[/H] (חור 1)."
  },
    // ✅ דוגמה: תמונה לפני רב-ברירה
  {
    type: "mc_single",
    title: "איך ניתן להכניס כלים [B]בשריים[/B] לחדר [P]פרווה[/P]?",
    //leadImg: "images/mc_intro.webp",
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
    type: "img_multi10",
    title: "בחר/י את כל המוצרים שניתן להכניס למקרר [P]פרווה[/P]",
    items: [
      { img: "images/pp1.webp", alt: "מילקי", caption: "מילקי"},
      { img: "images/pp2.webp", alt: "מלפפונים", caption: "מלפפונים" },
      { img: "images/pp3.webp", alt: "חלב סויה", caption: "חלב סויה", fit: "contain"},
      { img: "images/pp4.webp", alt: "לורד סנדויץ'", caption: "לורד סנדויץ'" },
      { img: "images/pp5.webp", alt: "גבינה צהובה", caption: "גבינה צהובה" },
      { img: "images/pp6.webp", alt: "שתיה מתוקה", caption: "שתיה מתוקה" },
      { img: "images/pp7.webp", alt: "מעדן קרלו", caption: "מעדן קרלו" },
      { img: "images/pp8.webp", alt: "מעדן ג'לי", caption: "מעדן ג'לי" },
      { img: "images/pp9.webp", alt: "רוטב טריאקי", caption: "רוטב טריאקי" },
      { img: "images/pp10.webp", alt: "ביצים", caption: "ביצים" }
    ],
    correctIndexes: [1, 2, 5, 7, 8, 9],
    wrongMsgByIndex: {
      0: "❌ אסור להכניס מעדנים חלביים!",
      3: "❌ שימו לב מה יש בסנדוויץ', הוא חלבי!",
      4: "❌ אסור להכניס מוצרי חלב מכל סוג!",
      6: "❌ מעדן קרלו הוא חלבי!"
    },
    wrongMsg: "❌ יש בחירה לא נכונה. נסו שוב."
  },
  {
    type: "mc_multi",
    title: "האם מותר שיהיה במקרר אחד גם [H]חלבי[/H] וגם [P]פרווה[/P]?",
    //leadImg: "images/fridge.webp",
    options: [
      "לא, אסור בשום אופן",
      "לא אלא אם כן המשגיח אישר",
      "על מדפים בצדדים שונים, בתנאי שיש תרשים על המקרר ומסדרים לפיו.",
      "במדפים באותו צד, כשה[P]פרווה[/P] תמיד למעלה וסגור היטב."
    ],
    correctIndexes: [2, 3],
    wrongMsg: "❌ לא נכון. מותר לשלב במקרר רק אם יש הפרדה ברורה וסידור קבוע שמונע טפטוף/מגע."
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
  btnShowChart: document.getElementById("btnShowChart"),

  btnNext: document.getElementById("btnNext"),
  feedback: document.getElementById("feedback"),

  sendStatus: document.getElementById("sendStatus"),
  btnResend: document.getElementById("btnResend"),

  matchWrap: document.getElementById("matchWrap"),
  matchStage: document.getElementById("matchStage"),
  matchSvg: document.getElementById("matchSvg"),
  matchLeft: document.getElementById("matchLeft"),
  matchRight: document.getElementById("matchRight"),
  matchError: document.getElementById("matchError"),

};

// =========================
// STATE
// =========================
const state = {
  user: { fullName:"", personalId:"", kitchenId:"", kitchenName:"" },
  idx: 0,
  sentThisRun: false,
  submissionId: "",
  submissionCreatedAt: 0,

  // per-question runtime
  runtime: {
    two: { selected: null },
    hotspot: { attempts: [], hit: [] },
    mc: { selected: [] },
    imgMulti: { selected: [] },
    drag: { phase: "intro", qIdx: -1, itemIndex: 0, placed: [], filled: {L:0,R:0}, showingChart:false }
  }
};
// =========================
// SUBMISSION ID (Idempotency)
// =========================
const SUBMISSION_STORAGE_KEY = "pendingSubmission_v1";
const SUBMISSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 ימים

function clearPendingSubmissionId(){
  try { localStorage.removeItem(SUBMISSION_STORAGE_KEY); } catch {}
}

function getOrCreateSubmissionId(){
  const now = Date.now();

  // נסה לקחת מה-storage אם עדיין בתוקף
  try {
    const raw = localStorage.getItem(SUBMISSION_STORAGE_KEY);
    if (raw){
      const obj = JSON.parse(raw);
      if (obj && obj.id && obj.createdAt && (now - obj.createdAt) < SUBMISSION_TTL_MS){
        return { id: String(obj.id), createdAt: Number(obj.createdAt) };
      }
    }
  } catch {}

  // אחרת מייצרים חדש
  const id = `sub_${now}_${Math.random().toString(16).slice(2)}`;
  const createdAt = now;

  try {
    localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify({ id, createdAt }));
  } catch {}

  return { id, createdAt };
}

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
    if (q.type === "match_lines"){
      (q.left || []).forEach(it => it?.img && urls.add(it.img));
      (q.right || []).forEach(it => it?.img && urls.add(it.img));
    }
  }
  return Array.from(urls);
}

// שינוי בסביבות שורה 1980 (באזור ה-Image Preload)
async function preloadAllQuestionImages() {
  const urls = Array.from(collectAllImageUrls());
  // טעינה הדרגתית אחד אחרי השני כדי לא להעמיס על הדפדפן
  for (const url of urls) {
    try {
      await preloadImage(url); 
      // זה רץ ברקע ולא חוסם את המשתמש
    } catch (e) {
      console.warn("Failed to preload:", url);
    }
  }
  console.log("All images loaded in background");
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
function sampleEdgeColor(imgEl){
  // דוגם רק את המיתאר החיצוני של התמונה (בלי להיכנס פנימה)
  // מחזיר "rgb(r,g,b)" או null אם לא ניתן לדגום
  try{
    const w = 32, h = 32;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(imgEl, 0, 0, w, h);

    const data = ctx.getImageData(0, 0, w, h).data;

    const isNearWhite = (r,g,b) => (r > 245 && g > 245 && b > 245);

    // אוספים רק פיקסלים מהמסגרת החיצונית (2 פיקסלים עובי כדי להתגבר על אנטיאליאס)
    const collect = (ignoreWhite) => {
      let rSum=0, gSum=0, bSum=0, n=0;

      const push = (x,y) => {
        const i = (y*w + x) * 4;
        const a = data[i+3];
        if (a < 200) return; // שקוף/חצי שקוף
        const r = data[i], g = data[i+1], b = data[i+2];
        if (ignoreWhite && isNearWhite(r,g,b)) return;
        rSum += r; gSum += g; bSum += b; n++;
      };

      // טבעת 0
      for (let x=0; x<w; x++){ push(x,0); push(x,h-1); }
      for (let y=0; y<h; y++){ push(0,y); push(w-1,y); }

      // טבעת 1 (עדיין מיתאר, רק עובי נוסף)
      for (let x=0; x<w; x++){ push(x,1); push(x,h-2); }
      for (let y=0; y<h; y++){ push(1,y); push(w-2,y); }

      if (!n) return null;
      return {
        r: Math.round(rSum/n),
        g: Math.round(gSum/n),
        b: Math.round(bSum/n),
        n
      };
    };

    // קודם מנסים ממוצע מיתאר בלי לבן (כדי להעדיף צבע מסגרת)
    const noWhite = collect(true);

    // אם אין מספיק דגימות צבע (כלומר הכל לבן/שקוף) – לוקחים ממוצע רגיל של המיתאר כולל לבן
    const best = (noWhite && noWhite.n >= 10) ? noWhite : collect(false);
    if (!best) return null;

    return `rgb(${best.r},${best.g},${best.b})`;
  } catch {
    return null;
  }
}


function applyTileBgFromImage(tileEl, imgEl){
  const set = () => {
    const c = sampleEdgeColor(imgEl);
    if (c) tileEl.style.setProperty("--tile-bg", c);
  };

  // אם כבר נטענה
  if (imgEl.complete && imgEl.naturalWidth > 0) set();
  else imgEl.addEventListener("load", set, { once: true });
}

function hideAllQuestionUIs(){
  el.leadWrap.hidden = true;

  el.twoWrap.hidden = true;
  el.hotspotWrap.hidden = true;
  el.mcWrap.hidden = true;
  el.imgMultiWrap.hidden = true;
  el.dragWrap.hidden = true;
  el.matchWrap.hidden = true;
  
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
  
  // ניקוי match
  if (el.matchLeft) el.matchLeft.innerHTML = "";
  if (el.matchRight) el.matchRight.innerHTML = "";
  if (el.matchSvg) el.matchSvg.innerHTML = "";
  if (el.matchError){
    el.matchError.hidden = true;
    el.matchError.textContent = "";
  }

  // ניקוי drag
  el.dragZones.innerHTML = "";
  el.dragFeedback.hidden = true;
  el.dragFeedback.innerHTML = "";

  /* Force hide & wipe (aggressive)
  [el.twoWrap, el.hotspotWrap, el.mcWrap, el.imgMultiWrap, el.dragWrap].forEach(w => {
    w.hidden = true;
    w.style.display = "none";
    requestAnimationFrame(() => { w.style.display = ""; }); // חוזר לברירת המחדל של CSS
  });*/
  
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
function buildMatchItem(side, it){
  const key = String(it?.key ?? "").trim();
  const img = String(it?.img ?? "").trim();
  const alt = String(it?.alt ?? key).trim();

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "match-item";
  btn.dataset.side = side; // "L" / "R"
  btn.dataset.key = key;

  const im = document.createElement("img");
  im.src = img;
  im.alt = alt;
  im.draggable = false;

  btn.appendChild(im);
  applyTileBgFromImage(btn, im);
  return btn;
}

// CSS.escape לא תמיד קיים
function cssEsc(s){
  try { return CSS.escape(String(s)); } catch { return String(s).replace(/"/g,'\\"'); }
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
  match: { pairs: [], lockedL: new Set(), lockedR: new Set(), done: false },
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

      el.mcHint.textContent = "שימו ❤️: יש יותר מתשובה אחת נכונה.";
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
        if (it.fit === "contain") {
          im.style.objectFit = "contain";
          im.style.background = "#fff";
        }


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
          filled: { L:0, R:0 },
          showingChart: false
        };
      }

      const rt = state.runtime.drag;
      el.dragIntroImg.src = q.introImg;
      if (rt.phase === "intro"){
        el.dragIntro.hidden = false;
        el.dragPlay.hidden = true;
        el.questionTitle.innerHTML = formatSpecial(q.introTitle || "התבוננו בתרשים ואז לחצו המשך.");
        el.btnNext.disabled = false;
        return;
      }

            // play
      // הכפתור חייב להיות בתוך dragWrap כדי שישאר זמין גם כשמציגים תרשים
      if (el.btnShowChart && el.btnShowChart.parentElement !== el.dragWrap){
        el.dragWrap.appendChild(el.btnShowChart);
      }
      el.btnShowChart.hidden = false;

      // בונים את play (גם אם כרגע מציגים תרשים) כדי שלא “נאבד” את השאלה
      el.dragBg.src = q.bgImg;
      buildDragZonesOnce(q);
      enablePointerDrag();

      // אם במצב “תרשים” – נציג intro ונעצור כאן
      if (rt.showingChart){
        el.dragIntro.hidden = false;
        el.dragPlay.hidden = true;
        el.btnShowChart.textContent = "חזרה לשאלה";
        el.btnNext.disabled = true;
        return;
      }

      // מצב רגיל (שאלה)
      el.dragIntro.hidden = true;
      el.dragPlay.hidden = false;
      el.btnShowChart.textContent = "הצג תרשים";

      showCurrentDragItem(q);
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
  },

  match_lines: {
    render(q){
      el.matchWrap.hidden = false;
      el.btnNext.disabled = true;

      // reset runtime
      state.runtime.match = { count: 0, lockedL: new Set(), lockedR: new Set(), done: false };
      el.matchError.hidden = true;
      el.matchError.textContent = "";

      // build columns (3 items each)
      el.matchLeft.innerHTML = "";
      el.matchRight.innerHTML = "";
      el.matchSvg.innerHTML = "";

      const left = Array.isArray(q.left) ? q.left : [];
      const right = Array.isArray(q.right) ? q.right : [];

      left.forEach(it => el.matchLeft.appendChild(buildMatchItem("L", it)));
      right.forEach(it => el.matchRight.appendChild(buildMatchItem("R", it)));

      // pointer line state
      let drag = null; // { side, key, el, line, pid, x1,y1 }

      const stage = el.matchStage;
      const svg = el.matchSvg;

      const clearTemp = () => {
        if (!drag) return;
        try { drag.el.classList.remove("active"); } catch {}
        try { drag.line?.remove(); } catch {}
        drag = null;
      };

      const setError = (on) => {
        if (!on){
          el.matchError.hidden = true;
          el.matchError.textContent = "";
        } else {
          el.matchError.hidden = false;
          el.matchError.textContent = "התאמה לא נכונה. נסה שוב";
        }
      };
      const flashMismatch = (a, b) => {
        [a, b].forEach(node => {
          if (!node) return;
          node.classList.remove("errflash"); // אם נשאר משגיאה קודמת
          // force reflow קטן כדי שהאנימציה תורגש גם ברצף מהיר
          void node.offsetWidth;
          node.classList.add("errflash");
          setTimeout(() => node.classList.remove("errflash"), 1000);
        });
      };

      const stageRect = () => stage.getBoundingClientRect();

      const anchor = (itemEl, side) => {
        const s = stageRect();
        const r = itemEl.getBoundingClientRect();
        const y = (r.top + r.height/2) - s.top;

        // תמיד מהשול הקרוב למרכז המסך:
        // צד שמאל -> x בקצה ימין, צד ימין -> x בקצה שמאל
        const x = (side === "L") ? (r.right - s.left) : (r.left - s.left);
        return { x, y };
      };

      const makeLine = (x1,y1,x2,y2, temp) => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.classList.add("match-line");
        if (temp) line.classList.add("temp");
        svg.appendChild(line);
        return line;
      };

      const isLocked = (side, key) => {
        const rt = state.runtime.match;
        return (side === "L") ? rt.lockedL.has(key) : rt.lockedR.has(key);
      };

        stage.onpointerdown = (ev) => {
        const item = ev.target.closest(".match-item");
        if (!item) return;

        const side = item.dataset.side; // "L"/"R"
        const key = item.dataset.key;

        // אם כבר נעול — לא מתחילים
        if (!side || !key || isLocked(side, key)) return;

        // מתחילים drag
        setError(false);
        clearTemp();

        stage.setPointerCapture(ev.pointerId);

        const p1 = anchor(item, side);
        const line = makeLine(p1.x, p1.y, p1.x, p1.y, true);

        item.classList.add("active");
        drag = { pid: ev.pointerId, side, key, el: item, line, x1: p1.x, y1: p1.y };
      };

      stage.onpointermove = (ev) => {
        if (!drag || ev.pointerId !== drag.pid) return;
        const s = stageRect();
        const x2 = ev.clientX - s.left;
        const y2 = ev.clientY - s.top;
        drag.line.setAttribute("x2", x2);
        drag.line.setAttribute("y2", y2);
      };

      stage.onpointerup = (ev) => {
        if (!drag || ev.pointerId !== drag.pid) return;

        const under = document.elementFromPoint(ev.clientX, ev.clientY);
        const target = under ? under.closest(".match-item") : null;

        // אם לא נחת על תמונה -> מוחקים שקט
        if (!target){ clearTemp(); return; }

        const tSide = target.dataset.side;
        const tKey = target.dataset.key;

        // חייב צד אחר
        if (!tSide || !tKey || tSide === drag.side){ clearTemp(); return; }

        // יעד נעול -> מוחקים שקט (לפי הדרישה)
        if (isLocked(tSide, tKey)){ clearTemp(); return; }

        // בדיקת התאמה: key חייב להיות זהה
        if (tKey !== drag.key){
          const a = drag.el;
          const b = target;
          clearTemp();
          flashMismatch(a, b);
          setError(true);
          return;
        }


        // נכון -> מקבעים
        const rt = state.runtime.match;

        // קיבוע קו לפי עוגנים (לא לפי נקודת שחרור)
        const p2 = anchor(target, tSide);
        drag.line.classList.remove("temp");
        drag.line.setAttribute("x2", p2.x);
        drag.line.setAttribute("y2", p2.y);

        // נועלים UI
        drag.el.classList.remove("active");
        drag.el.classList.add("locked");
        target.classList.add("locked");
        try { drag.line.remove(); } catch {}

        // שומרים pair לציור מחדש אם צריך (ריסייז)
        const lSide = (drag.side === "L") ? "L" : "R";
        const rSide = (drag.side === "L") ? "R" : "L";
        const lKey  = (drag.side === "L") ? drag.key : tKey;
        const rKey  = (drag.side === "L") ? tKey : drag.key;

        // בפועל: drag.key === tKey, אבל שומרים ברור
        rt.lockedL.add(lKey);
        rt.lockedR.add(rKey);

        rt.count += 1;
        // ניקוי drag זמני בלי למחוק את הקו
        drag = null;

        // אחרי 3 התאמות -> מאפשרים המשך
        if (rt.count >= 3){
          rt.done = true;
          el.btnNext.disabled = false;
          setError(false);
        }
      };

      stage.onpointercancel = () => { clearTemp(); };
    },

    validate(){
      return !!state.runtime.match?.done;
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
function setDragChartMode(show){
  const q = QUESTIONS[state.idx];
  if (!q || q.type !== "drag_shelves") return;

  const rt = state.runtime.drag;
  if (rt.phase !== "play") return;

  rt.showingChart = !!show;

  // חשוב: הכפתור חייב להיות בתוך dragWrap (ולא בתוך dragPlay שמוסתר)
  if (el.btnShowChart && el.btnShowChart.parentElement !== el.dragWrap){
    el.dragWrap.appendChild(el.btnShowChart);
  }

  if (rt.showingChart){
    el.dragIntro.hidden = false;
    el.dragPlay.hidden = true;
    el.btnShowChart.textContent = "חזרה לשאלה";
    el.btnNext.disabled = true; // שלא “יתקע” על ולידציה בזמן צפייה בתרשים
  } else {
    el.dragIntro.hidden = true;
    el.dragPlay.hidden = false;
    el.btnShowChart.textContent = "הצג תרשים";

    // מחזיר את מצב Next לפי התקדמות אמיתית
    showCurrentDragItem(q);
  }
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
  if (zoneEl.classList.contains("filled")) {
    // התא תפוס – לא מאפשרים דריסה
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
function requestPortraitLock(){
  try {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock("portrait").catch(()=>{});
    }
  } catch {}
}

function updateRotateOverlay(){
  const overlay = document.getElementById("rotateOverlay");
  if (!overlay) return;

  const isLandscape = window.matchMedia && window.matchMedia("(orientation: landscape)").matches;
  const quizActive = !el.screenQuiz.hidden;

  // overlay רק בתוך השאלון
  overlay.hidden = !(quizActive && isLandscape);

  // class לצורך CSS media
  document.body.classList.toggle("quiz-lock", quizActive);
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
  state.runtime.drag = { phase:"intro", qIdx:-1, itemIndex:0, placed:[], filled:{L:0,R:0}, showingChart:false };
  el.screenStart.hidden = true;
  el.screenResult.hidden = true;
  el.screenQuiz.hidden = false;
  requestPortraitLock();
  updateRotateOverlay();
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

window.addEventListener("DOMContentLoaded", async () => {
  // קודם כל: אם יש rid – להביא מטבחים מהשיטס ולהחליף את ה-HTML
  try { 
    updateRotateOverlay();
    window.addEventListener("resize", updateRotateOverlay, { passive:true });
    window.addEventListener("orientationchange", updateRotateOverlay, { passive:true });
    await initKitchenList();
  } catch(e){ console.warn(e); }

  // preload בזמן טעינת דף (לא חוסם)
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => preloadAllQuestionImages(), { timeout: 2000 });
  } else {
    setTimeout(() => preloadAllQuestionImages(), 300);
  }
});

el.btnResend.addEventListener("click", async () => {
  await sendResult(true);
});
el.btnShowChart.addEventListener("click", () => {
  const q = QUESTIONS[state.idx];
  if (!q || q.type !== "drag_shelves") return;

  const rt = state.runtime.drag;
  if (rt.phase !== "play") return; // רק אחרי שהתחילו את השאלה

  setDragChartMode(!rt.showingChart);
});

// =========================
// START
// =========================
async function onStart(){
    // התחלת ניסיון חדש -> מזהה שליחה חדש
  clearPendingSubmissionId();
  state.submissionId = "";
  state.submissionCreatedAt = 0;

  const fullName = el.fullName.value.trim();
  const personalId = el.personalId.value.trim();
  const sel = el.kitchen;
  const kitchenId = sel.value.trim();
  const kitchenName = sel.options[sel.selectedIndex]?.textContent?.trim() || "";
  
  state.user.kitchenId = kitchenId || "";
  state.user.kitchenName = kitchenName;


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
  if (!state.user.kitchenId){
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
  //el.btnStart.textContent = "טוען תמונות…";

  try {
    preloadAllQuestionImages();

    state.user = { fullName, personalId, kitchenId, kitchenName };
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

  // כפתור שליחה חוזרת - נעלם כברירת מחדל
  if (el.btnResend) {
    el.btnResend.hidden = true;
    el.btnResend.disabled = true;
  }
  await sendResult(false);
}

async function sendResult(force){
  // אם כבר נשלח בהצלחה באותו ריצה ולא ביקשו force — לא שולחים שוב
  if (state.sentThisRun && !force){
    el.sendStatus.textContent = "התוצאה כבר נשלחה בניסיון הזה ✅";
    if (el.btnResend) el.btnResend.hidden = true;
    return;
  }
  el.sendStatus.textContent = "שולח תוצאה…";
  if (el.btnResend){
    el.btnResend.hidden = true;
    el.btnResend.disabled = true;
  }

  try {
        // יצירה/שליפה של מזהה שליחה יציב (כדי למנוע כפילויות ב-resend/timeout)
    if (!state.submissionId){
      const s = getOrCreateSubmissionId();
      state.submissionId = s.id;
      state.submissionCreatedAt = s.createdAt;
    }

    const payload = {
      fullName: state.user.fullName,
      personalId: state.user.personalId,
      kitchenId: state.user.kitchenId,
      kitchenName: state.user.kitchenName,
      submissionId: state.submissionId,
    };
    // אם יש rid – שולחים למערכת החדשה (שיטס מרכזי)
    if (RID){
      const r = await apiCall("quiz/submit", { rid: RID, ...payload });
      if (r && r.ok && r.already){
      // כבר התקבל בעבר (ניסיון חוזר/timeout) -> זה עדיין הצלחה מבחינת המשתמש
      state.sentThisRun = true;
      el.sendStatus.textContent = "השליחה כבר התקבלה במערכת ✅";
      if (el.btnResend) el.btnResend.hidden = true;
      return;
      }
    if (!r || !r.ok) throw new Error(r?.error || "SUBMIT_FAILED");
    } else {
      // אין rid – ממשיכים בשיטה הישנה (כמו היום)
      const res = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    }
    state.sentThisRun = true;
    el.sendStatus.textContent = "התוצאה נשלחה בהצלחה ✅";
    if (el.btnResend) el.btnResend.hidden = true;
  } catch (e) {
    state.sentThisRun = false; // מאפשר ניסיון חוזר
    console.error(e);

    // אם יש לנו סטטוס HTTP — נציג אותו כדי להבין למה
    const msg = (e && e.message) ? e.message : "";
    const isNet = (msg === "TIMEOUT" || msg === "NETWORK_ERROR");
    el.sendStatus.textContent = isNet
      ? "בדוק את חיבור האינטרנט שלך, ונסה שוב"
      : ("שליחה נכשלה ❌ " + (msg ? `(${msg})` : "(בדוק הרשאות Deploy / Anyone)"));

    if (el.btnResend){
      el.btnResend.hidden = false;
      el.btnResend.disabled = false;
    }
  }
}
