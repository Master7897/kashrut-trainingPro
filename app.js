/* =========================================================
   Kashrut Training – app.js (rewritten with i18n architecture)
   Goals:
   1) Language selector on Home (default Hebrew) – changes whole site language
   2) UI strings NOT hardcoded in logic (fallback to HE)
   3) Questions loaded per-language from JSON files (fallback to embedded HE)
   4) Kitchen names displayed as phonetic transliteration *in target script*
      (RU Cyrillic / AR Arabic / AM Amharic / EN Latin / HE original)
   5) Safer + more maintainable structure

   Notes:
   - This file will work today even before you create i18n/*.json + questions/*.json
     because it embeds HE packs and falls back automatically.
   - When you add language files later, name them:
       /i18n/he.json  /i18n/en.json  /i18n/ru.json  /i18n/ar.json  /i18n/am.json
       /questions/he.json ... etc
   ========================================================= */

/* =========================
   HOTSPOT CALIBRATION MODE
   Toggle: Ctrl+K
   In calibration: 4 clicks => box {x1,y1,x2,y2} (percent)
   ========================= */
const CAL = { enabled:false, points:[], boxes:[], panelEl:null };

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
      <button type="button" id="calUndo" class="secondary" style="width:auto;margin-top:0"></button>
      <button type="button" id="calClearPts" class="secondary" style="width:auto;margin-top:0"></button>
      <button type="button" id="calClearAll" class="secondary" style="width:auto;margin-top:0"></button>
      <button type="button" id="calCopyLast" class="secondary" style="width:auto;margin-top:0"></button>
      <button type="button" id="calCopyAll" class="secondary" style="width:auto;margin-top:0"></button>
    </div>
    <pre id="calOut" style="margin:0;direction:ltr;text-align:left;white-space:pre-wrap;background:#f8fafc;border:1px solid var(--border);padding:10px;border-radius:10px"></pre>
    <div class="muted" id="calHint"></div>
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
    updateCalPanel(t("cal.copied"));
  };
  panel.querySelector("#calCopyAll").onclick = async () => {
    const txt = renderBoxesArray(CAL.boxes);
    if (!txt) return;
    try { await navigator.clipboard.writeText(txt); } catch {}
    updateCalPanel(t("cal.copied"));
  };

  // i18n labels
  panel.querySelector("#calUndo").textContent = t("cal.undoPoint");
  panel.querySelector("#calClearPts").textContent = t("cal.clearPoints");
  panel.querySelector("#calClearAll").textContent = t("cal.clearAll");
  panel.querySelector("#calCopyLast").textContent = t("cal.copyLast");
  panel.querySelector("#calCopyAll").textContent = t("cal.copyAll");
  panel.querySelector("#calHint").textContent = t("cal.hint");
}

function updateCalPanel(statusText=""){
  if (!CAL.panelEl) return;

  const st = CAL.panelEl.querySelector("#calState");
  const out = CAL.panelEl.querySelector("#calOut");

  st.textContent = CAL.enabled
    ? `${t("cal.on")} ✅ | ${t("cal.points")}: ${CAL.points.length}/4 | ${t("cal.boxes")}: ${CAL.boxes.length}${statusText ? " | " + statusText : ""}`
    : t("cal.off");

  const boxesTxt = renderBoxesArray(CAL.boxes);
  const pending = buildBoxFromPoints(CAL.points);

  out.textContent =
    (boxesTxt ? `boxes:\n${boxesTxt}\n\n` : "boxes: []\n\n") +
    (pending ? `pending box (from current 4):\n{ x1: ${pending.x1}, y1: ${pending.y1}, x2: ${pending.x2}, y2: ${pending.y2} }`
             : t("cal.clickPoints"));
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

/* =========================
   CONFIG
   ========================= */

// Legacy sheets POST fallback (no rid)
const GOOGLE_SHEETS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbzQxCavHELnbrTkeRRV-cmVEENZXW8eKhySjmmttu-QyM9ZsPT5M6JOyhaHnYo4TVhGCg/exec";

// New backend (rid)
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzlp-QnTsRIs2WJryZvAdBrwe1yVkzfEt8jAwWtPB4LqaIG__2vDH2XXHTyRr4TDsOomg/exec";

const URL_PARAMS = new URLSearchParams(window.location.search);
const RID = (URL_PARAMS.get("rid") || "").trim();

// JSONP API (works on GitHub Pages)
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

/* =========================
   i18n + language loader
   ========================= */

const LANG_STORAGE_KEY = "kashrut_lang_v1";
const LANGS = [
  { code:"he", label:"עברית", dir:"rtl" },
  { code:"en", label:"English", dir:"ltr" },
  { code:"ru", label:"Русский", dir:"ltr" },
  { code:"am", label:"አማርኛ", dir:"ltr" },
  { code:"ar", label:"العربية", dir:"rtl" },
];

function getSavedLang(){
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY);
    const c = String(raw || "").trim();
    if (LANGS.some(x => x.code === c)) return c;
  } catch {}
  return "he";
}

let CURRENT_LANG = getSavedLang();
let I18N = null;            // current UI pack
let QUESTIONS = [];         // current questions pack
let QUESTIONS_LANG = "he";  // actually loaded lang (fallback aware)

function setDocDirAndLang(lang){
  const meta = LANGS.find(x => x.code === lang) || LANGS[0];
  document.documentElement.dir = meta.dir;
  document.documentElement.lang = lang;
  document.body.classList.toggle("rtl", meta.dir === "rtl");
  document.body.classList.toggle("ltr", meta.dir !== "rtl");
}

function t(key, vars){
  // safe lookup with fallback to HE embedded
  const val =
    deepGet(I18N, key) ??
    deepGet(I18N_HE, key) ??
    key;

  let s = String(val);
  if (vars && typeof vars === "object"){
    for (const [k, v] of Object.entries(vars)){
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}
function deepGet(obj, key){
  if (!obj || !key) return null;
  const parts = String(key).split(".");
  let cur = obj;
  for (const p of parts){
    if (!cur || typeof cur !== "object") return null;
    if (!(p in cur)) return null;
    cur = cur[p];
  }
  return cur;
}

async function fetchJsonSafe(url){
  try {
    const res = await fetch(url, { cache: "no-store" }); // you can change to 'default' after you settle caching strategy
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function loadLanguage(lang){
  // lock to home screen only (safer)
  const pack = await fetchJsonSafe(`i18n/${lang}.json`);
  I18N = pack || I18N_HE;

  const qpack = await fetchJsonSafe(`questions/${lang}.json`);
  if (Array.isArray(qpack)){
    QUESTIONS = qpack;
    QUESTIONS_LANG = lang;
  } else {
    QUESTIONS = DEFAULT_QUESTIONS_HE;
    QUESTIONS_LANG = "he";
  }

  CURRENT_LANG = lang;
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch {}
  setDocDirAndLang(lang);

  // apply UI strings
  applyStaticUIStrings();
  refreshKitchenOptionTexts();
}

function applyStaticUIStrings(){
  // Start screen texts (only if elements exist in HTML)
  if (el.btnStart) el.btnStart.textContent = t("home.start");
  if (el.fullName) el.fullName.placeholder = t("home.fullNamePlaceholder");
  if (el.personalId) el.personalId.placeholder = t("home.personalIdPlaceholder");

  // Kitchen placeholder: handled inside setKitchenOptions()
  // Buttons
  if (el.btnNext) el.btnNext.textContent = t("quiz.next");
  if (el.btnResend) el.btnResend.textContent = t("result.resend");

  // Calibration panel (if already built)
  if (CAL.panelEl){
    CAL.panelEl.querySelector("#calUndo").textContent = t("cal.undoPoint");
    CAL.panelEl.querySelector("#calClearPts").textContent = t("cal.clearPoints");
    CAL.panelEl.querySelector("#calClearAll").textContent = t("cal.clearAll");
    CAL.panelEl.querySelector("#calCopyLast").textContent = t("cal.copyLast");
    CAL.panelEl.querySelector("#calCopyAll").textContent = t("cal.copyAll");
    CAL.panelEl.querySelector("#calHint").textContent = t("cal.hint");
    updateCalPanel();
  }
}

// Build language selector dynamically so you don't need HTML changes
function ensureLanguageSelector(){
  const host = el.screenStart;
  if (!host) return;

  if (document.getElementById("langRow")) return;

  const row = document.createElement("div");
  row.id = "langRow";
  row.style.cssText = "display:grid;gap:6px;margin:10px 0;";

  const label = document.createElement("label");
  label.id = "langLabel";
  label.textContent = t("home.language");
  label.style.fontWeight = "600";

  const sel = document.createElement("select");
  sel.id = "langSelect";
  sel.style.cssText = "width:100%";
  LANGS.forEach(L => {
    const opt = document.createElement("option");
    opt.value = L.code;
    opt.textContent = L.label;
    sel.appendChild(opt);
  });
  sel.value = CURRENT_LANG;

  sel.addEventListener("change", async () => {
    const lang = sel.value;
    await loadLanguage(lang);
    // After switching language, update kitchen dropdown rendering + start errors if visible
    if (!el.startError.hidden) el.startError.textContent = t("home.errors.generic");
  });

  row.appendChild(label);
  row.appendChild(sel);

  // insert before kitchen row if possible, else append
  const kitchenEl = el.kitchen;
  if (kitchenEl && kitchenEl.parentElement){
    kitchenEl.parentElement.insertBefore(row, kitchenEl);
  } else {
    host.appendChild(row);
  }
}

/* =========================
   Kitchen list + transliteration
   ========================= */

let KITCHENS_RAW = []; // store raw list from backend to allow re-render per language

function kitchenDisplayName(heName){
  const name = String(heName || "").trim();
  if (!name) return "";

  if (CURRENT_LANG === "he") return name;

  // Optional overrides from i18n pack (recommended for edge cases)
  const ovr = deepGet(I18N, "kitchen_overrides") || deepGet(I18N_HE, "kitchen_overrides");
  if (ovr && typeof ovr === "object" && ovr[name] && ovr[name][CURRENT_LANG]){
    return String(ovr[name][CURRENT_LANG]).trim();
  }

  return transliterateHebrewToTargetScript(name, CURRENT_LANG);
}

function refreshKitchenOptionTexts(){
  // Re-render kitchen dropdown texts without losing selected value
  if (!el.kitchen) return;
  if (!KITCHENS_RAW || KITCHENS_RAW.length === 0) return;

  const currentValue = el.kitchen.value;
  setKitchenOptions(KITCHENS_RAW);

  // restore selection if possible
  try {
    el.kitchen.value = currentValue;
  } catch {}
}

function setKitchenOptions(kitchens){
  // kitchens can be:
  // new: [{id,name}]
  // old: ["מטבח א", ...]
  KITCHENS_RAW = Array.isArray(kitchens) ? kitchens : [];

  const first = el.kitchen.querySelector("option[value='']") || el.kitchen.options[0];

  const placeholderText =
    (first && first.textContent && !first.textContent.includes(t("home.loadingKitchens")))
      ? first.textContent
      : t("home.chooseKitchen");

  el.kitchen.innerHTML = "";

  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = placeholderText;
  el.kitchen.appendChild(opt0);

  (Array.isArray(kitchens) ? kitchens : []).forEach(k => {
    const opt = document.createElement("option");

    if (typeof k === "string"){
      opt.value = ""; // legacy: no id
      opt.dataset.name = k;
      opt.dataset.he = k;
      opt.textContent = kitchenDisplayName(k);
    } else {
      const id = String(k.id || "").trim();
      const he = String(k.name || "").trim();
      opt.value = id;
      opt.dataset.name = he;
      opt.dataset.he = he;
      opt.textContent = kitchenDisplayName(he);
    }
    el.kitchen.appendChild(opt);
  });
}

async function initKitchenList(){
  if (!RID) return;

  el.kitchen.disabled = true;
  el.kitchen.innerHTML = "";
  const loadingOpt = document.createElement("option");
  loadingOpt.value = "";
  loadingOpt.textContent = t("home.loadingKitchens");
  el.kitchen.appendChild(loadingOpt);

  const r = await apiCall("quiz/getKitchens", { rid: RID });

  if (!r || !r.ok || !Array.isArray(r.kitchens) || r.kitchens.length === 0){
    el.startError.hidden = false;

    const netMsg = (!r || r.error === "TIMEOUT" || r.error === "NETWORK_ERROR")
      ? t("home.errors.net")
      : t("home.errors.kitchens");

    el.startError.textContent = netMsg;
    el.btnStart.disabled = true;
    return;
  }

  const list = Array.isArray(r.kitchens)
    ? r.kitchens
    : (Array.isArray(r.kitchenNames) ? r.kitchenNames : []);

  setKitchenOptions(list);
  el.kitchen.disabled = false;
  preloadAllQuestionImages(); // after kitchens loaded
}

const HOTSPOT_MAX_CLICKS = 5;

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

/* =========================
   SPECIAL TEXT FORMATTER
   ========================= */
function formatSpecial(text) {
  let s = String(text ?? "");
  s = s.replace(/\[P\](.*?)\[\/P\]/g, '<span class="hl-parve">$1</span>');
  s = s.replace(/\[B\](.*?)\[\/B\]/g, '<span class="hl-meat">$1</span>');
  s = s.replace(/\[H\](.*?)\[\/H\]/g, '<span class="hl-dairy">$1</span>');
  // remove whitespace after Hebrew preposition before tag
  s = s.replace(
    /(^|[^\u0590-\u05FF])([הכמוש])\s+(<span class="hl-(?:parve|dairy|meat)">)/g,
    "$1$2$3"
  );
  return s;
}

/* =========================
   QUESTIONS – Embedded HE fallback
   (Later: move each language to questions/<lang>.json)
   ========================= */
const DEFAULT_QUESTIONS_HE = [
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
      { x1: 37.01, y1: 21.68, x2: 77.71, y2: 27.35, label: "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P] וגם מעל אוכל [P]פרווה[/P] פתוח" },
      { x1: 16.45, y1: 58.05, x2: 52.63, y2: 68.11, label: "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P]" },
      { x1: 12.54, y1: 67.92, x2: 48.93, y2: 77.40, label: "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P]" },
      { x1: 46.88, y1: 53.70, x2: 83.47, y2: 64.68, label: "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P] ומעל תבנית [B]בשרית[/B]" },
      { x1: 49.14, y1: 72.66, x2: 83.68, y2: 83.06, label: "תבנית [B]בשרית[/B] על עגלה [P]פרווה[/P] ומתחת למוצרים [H]חלביים[/H]" }
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
  {
    type: "mc_single",
    title: "איך ניתן להכניס כלים [B]בשריים[/B] לחדר [P]פרווה[/P]?",
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

/* =========================
   DOM
   ========================= */
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

/* =========================
   STATE
   ========================= */
const state = {
  user: { fullName:"", personalId:"", kitchenId:"", kitchenName:"", kitchenNameHe:"" },
  idx: 0,
  sentThisRun: false,
  submissionId: "",
  submissionCreatedAt: 0,

  runtime: {
    two: { selected: null },
    hotspot: { attempts: [], hit: [] },
    mc: { selected: [] },
    imgMulti: { selected: [] },
    drag: { phase: "intro", qIdx: -1, itemIndex: 0, placed: [], filled: {L:0,R:0}, showingChart:false }
  }
};

/* =========================
   SUBMISSION ID (Idempotency)
   ========================= */
const SUBMISSION_STORAGE_KEY = "pendingSubmission_v1";
const SUBMISSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function clearPendingSubmissionId(){
  try { localStorage.removeItem(SUBMISSION_STORAGE_KEY); } catch {}
}

function getOrCreateSubmissionId(){
  const now = Date.now();

  try {
    const raw = localStorage.getItem(SUBMISSION_STORAGE_KEY);
    if (raw){
      const obj = JSON.parse(raw);
      if (obj && obj.id && obj.createdAt && (now - obj.createdAt) < SUBMISSION_TTL_MS){
        return { id: String(obj.id), createdAt: Number(obj.createdAt) };
      }
    }
  } catch {}

  const id = `sub_${now}_${Math.random().toString(16).slice(2)}`;
  const createdAt = now;

  try { localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify({ id, createdAt })); } catch {}
  return { id, createdAt };
}

/* =========================
   IMAGE PRELOAD
   ========================= */
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

async function preloadAllQuestionImages() {
  const urls = Array.from(collectAllImageUrls());
  for (const url of urls) {
    try { await preloadImage(url); }
    catch (e) { console.warn("Failed to preload:", url); }
  }
}

/* =========================
   VALIDATIONS (START)
   ========================= */
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

/* =========================
   UI HELPERS
   ========================= */

// Fix for match tile background “bleeding” from image colors:
// We DO NOT sample the image anymore. We force a stable background.
function setStableTileBg(tileEl){
  // Use CSS var if exists; otherwise fall back to white
  tileEl.style.setProperty("--tile-bg", "var(--card, #fff)");
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

  // hotspot reset
  el.hotspotOverlay.innerHTML = "";
  el.hotspotMarks.innerHTML = "";
  el.hotspotStatus.textContent = "";

  // mc/imgmulti reset
  el.mcHint.textContent = "";
  el.mcOptions.innerHTML = "";
  el.imgMultiGrid.innerHTML = "";
  el.imgMultiFeedback.hidden = true;
  el.imgMultiFeedback.textContent = "";

  // match reset
  if (el.matchLeft) el.matchLeft.innerHTML = "";
  if (el.matchRight) el.matchRight.innerHTML = "";
  if (el.matchSvg) el.matchSvg.innerHTML = "";
  if (el.matchError){
    el.matchError.hidden = true;
    el.matchError.textContent = "";
  }

  // drag reset
  el.dragZones.innerHTML = "";
  el.dragFeedback.hidden = true;
  el.dragFeedback.innerHTML = "";

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
    el.leadCap.innerHTML = formatSpecial(cap);
  } else {
    el.leadCap.hidden = true;
    el.leadCap.innerHTML = "";
  }
}

function failAndRetry(q, fallbackMsg){
  const msg = q?.wrongMsg || fallbackMsg || t("quiz.wrongTryAgain");

  el.feedback.classList.add("errorbox");
  el.feedback.hidden = false;
  el.feedback.innerHTML = `
    <div>${formatSpecial(msg)}</div>
    <div style="margin-top:10px;">
      <button type="button" id="btnRetryNow" class="secondary">${t("quiz.retry")}</button>
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
  btn.dataset.side = side;
  btn.dataset.key = key;

  const im = document.createElement("img");
  im.src = img;
  im.alt = alt;
  im.draggable = false;

  btn.appendChild(im);

  // IMPORTANT: stable background (no sampling)
  setStableTileBg(btn);

  return btn;
}

/* =========================
   QUESTION TYPE ENGINE
   ========================= */
const TYPE = {
  two: {
    render(q){
      el.twoWrap.hidden = false;
      const runtime = state.runtime.two;
      runtime.selected = null;
      el.btnNext.disabled = true;

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

        // Calibration mode
        if (CAL.enabled){
          ensureCalPanel();
          CAL.points.push({ x: xPct, y: yPct });
          addCalMarker(xPct, yPct);

          if (CAL.points.length === 4){
            const box = buildBoxFromPoints(CAL.points);
            CAL.boxes.push(box);
            CAL.points = [];
            clearCalMarkers();
          }

          updateCalPanel();
          return;
        }

        // Normal mode
        const rt = state.runtime.hotspot;

        if (rt.attempts.length >= HOTSPOT_MAX_CLICKS){
          el.feedback.hidden = false;
          el.feedback.textContent = t("hotspot.maxClicks");
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
        el.feedback.textContent = (hitIndex !== null) ? t("quiz.correct") : t("quiz.wrong");

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
        txt.innerHTML = formatSpecial(opt);

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

      el.mcHint.textContent = t("mc.multiHint");
      el.mcOptions.innerHTML = "";

      q.options.forEach((opt, i) => {
        const row = document.createElement("label");
        row.className = "mc-option";

        const inp = document.createElement("input");
        inp.type = "checkbox";
        inp.value = String(i);

        const txt = document.createElement("div");
        txt.className = "txt";
        txt.innerHTML = formatSpecial(opt);

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
        im.alt = it.alt || `${t("imgMulti.image")} ${idx+1}`;
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
          : t("imgMulti.wrongPicked");

        failAndRetry({ wrongMsg: msg }, msg);
        return null;
      }

      const missing = correct.filter(i => !chosen.includes(i));
      if (missing.length > 0) return false;

      return true;
    }
  },

  drag_shelves: {
    render(q){
      el.dragWrap.hidden = false;

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
        el.questionTitle.innerHTML = formatSpecial(q.introTitle || t("drag.introDefault"));
        el.btnNext.disabled = false;
        return;
      }

      // play
      if (el.btnShowChart && el.btnShowChart.parentElement !== el.dragWrap){
        el.dragWrap.appendChild(el.btnShowChart);
      }
      el.btnShowChart.hidden = false;

      el.dragBg.src = q.bgImg;
      buildDragZonesOnce(q);
      enablePointerDrag();

      if (rt.showingChart){
        el.dragIntro.hidden = false;
        el.dragPlay.hidden = true;
        el.btnShowChart.textContent = t("drag.backToQuestion");
        el.btnNext.disabled = true;
        return;
      }

      el.dragIntro.hidden = true;
      el.dragPlay.hidden = false;
      el.btnShowChart.textContent = t("drag.showChart");

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

      state.runtime.match = { count: 0, lockedL: new Set(), lockedR: new Set(), done: false };
      el.matchError.hidden = true;
      el.matchError.textContent = "";

      el.matchLeft.innerHTML = "";
      el.matchRight.innerHTML = "";
      el.matchSvg.innerHTML = "";

      const left = Array.isArray(q.left) ? q.left : [];
      const right = Array.isArray(q.right) ? q.right : [];

      left.forEach(it => el.matchLeft.appendChild(buildMatchItem("L", it)));
      right.forEach(it => el.matchRight.appendChild(buildMatchItem("R", it)));

      let drag = null;

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
          el.matchError.textContent = t("match.wrong");
        }
      };

      const flashMismatch = (a, b) => {
        [a, b].forEach(node => {
          if (!node) return;
          node.classList.remove("errflash");
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

        const side = item.dataset.side;
        const key = item.dataset.key;

        if (!side || !key || isLocked(side, key)) return;

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

        if (!target){ clearTemp(); return; }

        const tSide = target.dataset.side;
        const tKey = target.dataset.key;

        if (!tSide || !tKey || tSide === drag.side){ clearTemp(); return; }
        if (isLocked(tSide, tKey)){ clearTemp(); return; }

        if (tKey !== drag.key){
          const a = drag.el;
          const b = target;
          clearTemp();
          flashMismatch(a, b);
          setError(true);
          return;
        }

        const rt = state.runtime.match;

        const p2 = anchor(target, tSide);
        drag.line.classList.remove("temp");
        drag.line.setAttribute("x2", p2.x);
        drag.line.setAttribute("y2", p2.y);

        drag.el.classList.remove("active");
        drag.el.classList.add("locked");
        target.classList.add("locked");
        try { drag.line.remove(); } catch {}

        const lKey  = drag.key;
        const rKey  = tKey;

        rt.lockedL.add(lKey);
        rt.lockedR.add(rKey);

        rt.count += 1;
        drag = null;

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

/* =========================
   HOTSPOT UI
   ========================= */
function updateHotspotUI(q){
  const rt = state.runtime.hotspot;
  const hits = rt.hit.filter(Boolean).length;
  const boxes = q.boxes || [];
  const attempts = rt.attempts.length;

  el.hotspotStatus.textContent =
    t("hotspot.status", { hits, total: boxes.length, attempts, max: HOTSPOT_MAX_CLICKS });

  el.hotspotMarks.innerHTML = "";
  rt.attempts.forEach((a, idx) => {
    const row = document.createElement("div");
    row.className = "mark-row";

    const txt = document.createElement("div");
    txt.className = "txt";
    const s = (a.hitIndex !== null) ? "✅" : "❌";

    let label = t("hotspot.notIssue");
    if (a.hitIndex !== null) {
      const box = (q.boxes || [])[a.hitIndex];
      label = box?.label || `${t("hotspot.issue")} ${a.hitIndex + 1}`;
    }

    txt.innerHTML = `${idx + 1}) ${s} ${formatSpecial(label)}`;

    const del = document.createElement("button");
    del.className = "btn-del";
    del.type = "button";
    del.textContent = t("hotspot.delete");
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
  el.feedback.textContent = t("hotspot.deleted");
  updateHotspotUI(q);
}

/* =========================
   DRAG LOGIC
   ========================= */
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

  if (el.btnShowChart && el.btnShowChart.parentElement !== el.dragWrap){
    el.dragWrap.appendChild(el.btnShowChart);
  }

  if (rt.showingChart){
    el.dragIntro.hidden = false;
    el.dragPlay.hidden = true;
    el.btnShowChart.textContent = t("drag.backToQuestion");
    el.btnNext.disabled = true;
  } else {
    el.dragIntro.hidden = true;
    el.dragPlay.hidden = false;
    el.btnShowChart.textContent = t("drag.showChart");
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
    el.dragFeedback.innerHTML = formatSpecial(it.wrongMsg || t("quiz.wrongTryAgain"));
    zoneEl.classList.add("wrong");
    setTimeout(()=> zoneEl.classList.remove("wrong"), 600);
    return;
  }

  if (zoneEl.classList.contains("filled")) return;

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

/* =========================
   Orientation overlay
   ========================= */
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

  overlay.hidden = !(quizActive && isLandscape);
  document.body.classList.toggle("quiz-lock", quizActive);
}

/* =========================
   FLOW
   ========================= */
function startFromBeginning(){
  state.idx = 0;
  state.sentThisRun = false;

  state.runtime.two.selected = null;
  state.runtime.hotspot = { attempts: [], hit: [] };
  state.runtime.mc.selected = [];
  state.runtime.imgMulti.selected = [];
  state.runtime.drag = { phase:"intro", qIdx:-1, itemIndex:0, placed:[], filled:{L:0,R:0}, showingChart:false };

  el.screenStart.hidden = true;
  el.screenResult.hidden = true;
  el.screenQuiz.hidden = false;

  // lock language selector after start (safer)
  const langSelect = document.getElementById("langSelect");
  if (langSelect) langSelect.disabled = true;

  requestPortraitLock();
  updateRotateOverlay();
  renderQuestion();
}

function renderQuestion(){
  const q = QUESTIONS[state.idx];

  hideAllQuestionUIs();

  el.progress.textContent = t("quiz.progress", { n: state.idx + 1, total: QUESTIONS.length });
  el.questionTitle.innerHTML = formatSpecial(q.title);

  renderLead(q);

  const type = q.type || "two";
  const handler = TYPE[type];
  if (!handler) {
    el.feedback.hidden = false;
    el.feedback.textContent = t("quiz.unknownType", { type });
    return;
  }

  handler.render(q);
}

function goNext(){
  state.idx++;
  if (state.idx >= QUESTIONS.length) finish();
  else renderQuestion();
}

/* =========================
   EVENTS
   ========================= */
el.btnStart.addEventListener("click", onStart);

el.twoWrap.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-two]");
  if (!btn) return;
  TYPE.two.onChoice(btn.dataset.two);
});

el.btnNext.addEventListener("click", onNext);

window.addEventListener("DOMContentLoaded", async () => {
  // 1) load language packs first (so UI is correct immediately)
  setDocDirAndLang(CURRENT_LANG);
  QUESTIONS = DEFAULT_QUESTIONS_HE;
  I18N = I18N_HE;

  await loadLanguage(CURRENT_LANG);

  // 2) build language selector on home
  ensureLanguageSelector();

  // 3) init rotate overlay
  try {
    updateRotateOverlay();
    window.addEventListener("resize", updateRotateOverlay, { passive:true });
    window.addEventListener("orientationchange", updateRotateOverlay, { passive:true });
  } catch {}

  // 4) kitchens list (rid) after language is ready
  try { await initKitchenList(); } catch(e){ console.warn(e); }

  // 5) preload (idle)
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
  if (rt.phase !== "play") return;

  setDragChartMode(!rt.showingChart);
});

/* =========================
   START
   ========================= */
async function onStart(){
  clearPendingSubmissionId();
  state.submissionId = "";
  state.submissionCreatedAt = 0;

  const fullName = el.fullName.value.trim();
  const personalId = el.personalId.value.trim();
  const sel = el.kitchen;

  const kitchenId = sel.value.trim();
  const kitchenNameShown = sel.options[sel.selectedIndex]?.textContent?.trim() || "";
  const kitchenNameHe = sel.options[sel.selectedIndex]?.dataset?.he?.trim() || (sel.options[sel.selectedIndex]?.dataset?.name?.trim() || "");

  state.user.kitchenId = kitchenId || "";
  state.user.kitchenName = kitchenNameShown; // display
  state.user.kitchenNameHe = kitchenNameHe || ""; // raw Hebrew (for backend)

  if (!fullName){
    el.startError.hidden = false;
    el.startError.textContent = t("home.errors.nameRequired");
    return;
  }
  if (!personalId){
    el.startError.hidden = false;
    el.startError.textContent = t("home.errors.idRequired");
    return;
  }
  if (!state.user.kitchenId){
    el.startError.hidden = false;
    el.startError.textContent = t("home.errors.kitchenRequired");
    return;
  }
  if (!isFullNameValid(fullName)){
    el.startError.hidden = false;
    el.startError.textContent = t("home.errors.fullName");
    return;
  }
  if (!isDigitsOnly(personalId) || !(personalId.length === 7 || personalId.length === 9)){
    el.startError.hidden = false;
    el.startError.textContent = t("home.errors.idFormat");
    return;
  }
  if (personalId.length === 9 && !isIsraeliIdValid(personalId)){
    el.startError.hidden = false;
    el.startError.textContent = t("home.errors.idInvalid");
    return;
  }

  el.startError.hidden = true;

  el.btnStart.disabled = true;
  const oldTxt = el.btnStart.textContent;

  try {
    preloadAllQuestionImages();

    state.user = {
      fullName,
      personalId,
      kitchenId,
      kitchenName: kitchenNameShown,
      kitchenNameHe
    };

    startFromBeginning();
  } finally {
    el.btnStart.disabled = false;
    el.btnStart.textContent = oldTxt;
  }
}

/* =========================
   NEXT
   ========================= */
function onNext(){
  const q = QUESTIONS[state.idx];
  const type = q.type || "two";
  const handler = TYPE[type];

  if (type === "drag_shelves" && state.runtime.drag.phase === "intro"){
    handler.advancePhase();
    renderQuestion();
    return;
  }

  const result = handler.validate(q);
  if (result === null) return;

  if (!result){
    return failAndRetry(q, t("quiz.wrongTryAgain"));
  }

  goNext();
}

/* =========================
   FINISH + SEND
   ========================= */
async function finish(){
  el.screenQuiz.hidden = true;
  el.screenResult.hidden = false;

  if (el.btnResend) {
    el.btnResend.hidden = true;
    el.btnResend.disabled = true;
  }
  await sendResult(false);
}

async function sendResult(force){
  if (state.sentThisRun && !force){
    el.sendStatus.textContent = t("result.alreadySent");
    if (el.btnResend) el.btnResend.hidden = true;
    return;
  }
  el.sendStatus.textContent = t("result.sending");
  if (el.btnResend){
    el.btnResend.hidden = true;
    el.btnResend.disabled = true;
  }

  try {
    if (!state.submissionId){
      const s = getOrCreateSubmissionId();
      state.submissionId = s.id;
      state.submissionCreatedAt = s.createdAt;
    }

    const payload = {
      fullName: state.user.fullName,
      personalId: state.user.personalId,
      kitchenId: state.user.kitchenId,
      kitchenName: state.user.kitchenNameHe || state.user.kitchenName, // send Hebrew if available
      submissionId: state.submissionId,
      lang: CURRENT_LANG,
    };

    if (RID){
      const r = await apiCall("quiz/submit", { rid: RID, ...payload });
      if (r && r.ok && r.already){
        state.sentThisRun = true;
        el.sendStatus.textContent = t("result.received");
        if (el.btnResend) el.btnResend.hidden = true;
        return;
      }
      if (!r || !r.ok) throw new Error(r?.error || "SUBMIT_FAILED");
    } else {
      const res = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    }

    state.sentThisRun = true;
    el.sendStatus.textContent = t("result.sentOk");
    if (el.btnResend) el.btnResend.hidden = true;

  } catch (e) {
    state.sentThisRun = false;
    console.error(e);

    const msg = (e && e.message) ? e.message : "";
    const isNet = (msg === "TIMEOUT" || msg === "NETWORK_ERROR");

    el.sendStatus.textContent = isNet
      ? t("home.errors.net")
      : (t("result.failed") + (msg ? ` (${msg})` : ""));

    if (el.btnResend){
      el.btnResend.hidden = false;
      el.btnResend.disabled = false;
    }
  }
}

/* =========================================================
   Embedded HE UI pack (fallback)
   ========================================================= */
const I18N_HE = {
  home: {
    language: "שפה",
    start: "התחלה",
    chooseKitchen: "בחר/י מטבח",
    loadingKitchens: "טוען מטבחים…",
    fullNamePlaceholder: "שם מלא",
    personalIdPlaceholder: "ת.ז / מספר אישי",
    errors: {
      generic: "שגיאה. נסו שוב.",
      net: "בדוק את חיבור האינטרנט שלך, ונסה שוב",
      kitchens: "לא הצלחנו לטעון את רשימת המטבחים שלך מהמערכת. בדוק APPS_SCRIPT_URL / Deploy של Apps Script.",
      nameRequired: "נא למלא שם.",
      idRequired: "נא למלא ת.ז/מספר אישי.",
      kitchenRequired: "נא לבחור מטבח.",
      fullName: "נא להזין שם מלא (לפחות שתי מילים).",
      idFormat: "ת.ז/מ.א חייב להיות 9 או 7 ספרות (ספרות בלבד).",
      idInvalid: "תעודת הזהות לא תקינה!"
    }
  },
  quiz: {
    next: "הבא",
    retry: "נסו שוב",
    correct: "נכון ✅",
    wrong: "לא נכון ❌",
    wrongTryAgain: "לא נכון ❌ נסו שוב.",
    progress: "שאלה {n} מתוך {total}",
    unknownType: "Type לא מוכר: {type}"
  },
  mc: { multiHint: "שימו ❤️: יש יותר מתשובה אחת נכונה." },
  hotspot: {
    status: "פגיעות: {hits}/{total} | לחיצות: {attempts}/{max}",
    maxClicks: "הגעת למספר הלחיצות המקסימלי.",
    notIssue: "לא תקלה",
    issue: "תקלה",
    delete: "מחק",
    deleted: "נמחק. אפשר ללחוץ שוב."
  },
  imgMulti: { image: "תמונה", wrongPicked: "❌ יש מוצר שנבחר לא נכון. נסו שוב." },
  drag: {
    introDefault: "התבוננו בתרשים ואז לחצו המשך.",
    showChart: "הצג תרשים",
    backToQuestion: "חזרה לשאלה"
  },
  match: { wrong: "התאמה לא נכונה. נסה שוב" },
  result: {
    resend: "שליחה חוזרת",
    sending: "שולח תוצאה…",
    alreadySent: "התוצאה כבר נשלחה בניסיון הזה ✅",
    received: "השליחה כבר התקבלה במערכת ✅",
    sentOk: "התוצאה נשלחה בהצלחה ✅",
    failed: "שליחה נכשלה ❌"
  },
  cal: {
    on: "כיול: פעיל",
    off: "כיול: כבוי",
    points: "נקודות ברביעייה",
    boxes: "מרובעים",
    copied: "הועתק ✅",
    undoPoint: "בטל נקודה",
    clearPoints: "נקה נקודות (רביעייה)",
    clearAll: "נקה הכל",
    copyLast: "העתק מרובע אחרון",
    copyAll: "העתק ALL BOXES",
    hint: "כיול פעיל רק לשאלות hotspot. כל 4 לחיצות = מרובע. Toggle: Ctrl+K",
    clickPoints: "לחץ/י נקודות… כל 4 נקודות ייצרו מרובע חדש."
  },

  // Optional: per-kitchen overrides for tricky cases
  // kitchen_overrides: {
  //   'מקל"ר': { en:'mekalar', ru:'мекалар', ar:'ميكالار', am:'መካላር' }
  // }
};

/* =========================================================
   Transliteration: Hebrew -> phonetic -> target script
   (Practical, deterministic, overrideable)
   ========================================================= */

// Normalize Hebrew string
function normHeb(s){
  return String(s || "")
    .replace(/[״"]/g, '"')
    .replace(/[׳']/g, "'")
    .replace(/[–—]/g, "-")
    .trim();
}

function isLikelyAcronymHeb(s){
  // Detect gershayim/quotes inside Hebrew word (e.g., מקל"ר)
  return /[״"]/.test(s) || /[A-Za-z]/.test(s) === false && /[׳']/.test(s);
}

// Hebrew -> Latin (simple phonetic-ish)
function hebrewToLatinBase(input){
  const s0 = normHeb(input);

  // If acronym style, create alternating vowels pattern (e.g., מקל"ר -> mekalar)
  if (isLikelyAcronymHeb(s0)){
    const letters = s0.replace(/["׳']/g, "").replace(/[^א-ת]/g, "");
    const cons = letters.split("").map(h => hebLetterToLat(h)).filter(Boolean);
    if (cons.length >= 2){
      const vowels = ["e","a","a","e","a","a","e","a"];
      let out = "";
      for (let i=0;i<cons.length;i++){
        out += cons[i];
        if (i < cons.length-1) out += vowels[i] || "a";
      }
      return out.toLowerCase();
    }
  }

  // General word transliteration
  let out = "";
  const s = s0;

  for (let i=0;i<s.length;i++){
    const ch = s[i];

    // keep spaces, hyphen, digits
    if (/[0-9]/.test(ch) || ch === " " || ch === "-" || ch === "/"){
      out += ch;
      continue;
    }

    // Latin already? keep
    if (/[A-Za-z]/.test(ch)){
      out += ch.toLowerCase();
      continue;
    }

    // Hebrew letter
    if (/[א-ת]/.test(ch)){
      out += hebLetterToLat(ch);
      continue;
    }

    // ignore punctuation
  }

  // cleanup
  out = out.replace(/\s+/g, " ").trim();
  return out.toLowerCase();
}

function hebLetterToLat(h){
  // very simplified mapping
  switch(h){
    case "א": case "ע": return "a"; // placeholder vowel
    case "ב": return "b";
    case "ג": return "g";
    case "ד": return "d";
    case "ה": return "h";
    case "ו": return "v";
    case "ז": return "z";
    case "ח": return "kh";
    case "ט": return "t";
    case "י": return "y";
    case "כ": case "ך": return "k";
    case "ל": return "l";
    case "מ": case "ם": return "m";
    case "נ": case "ן": return "n";
    case "ס": return "s";
    case "פ": case "ף": return "p";
    case "צ": case "ץ": return "ts";
    case "ק": return "k";
    case "ר": return "r";
    case "ש": return "sh";
    case "ת": return "t";
    default: return "";
  }
}

function transliterateHebrewToTargetScript(heName, lang){
  const latin = hebrewToLatinBase(heName);

  if (lang === "en") return latin;
  if (lang === "ru") return latinToCyrillic(latin);
  if (lang === "ar") return latinToArabic(latin);
  if (lang === "am") return latinToAmharic(latin);

  // fallback
  return latin;
}

/* --- Latin -> Russian Cyrillic (approx) --- */
function latinToCyrillic(s){
  let x = String(s).toLowerCase();

  // digraphs first
  const rep = [
    ["sh", "ш"],
    ["ch", "ч"],
    ["kh", "х"],
    ["ts", "ц"],
    ["ya", "я"],
    ["yu", "ю"],
    ["yo", "ё"],
    ["ye", "е"],
  ];
  for (const [a,b] of rep) x = x.replaceAll(a, b);

  const map = {
    a:"а", b:"б", v:"в", g:"г", d:"д", e:"е", z:"з", i:"и", y:"й",
    k:"к", l:"л", m:"м", n:"н", o:"о", p:"п", r:"р", s:"с", t:"т", u:"у", f:"ф", h:"х", j:"дж",
    " ":" ", "-":"-", "/":"/"
  };

  let out = "";
  for (const ch of x){
    if (map[ch] != null) out += map[ch];
    else out += ch;
  }
  return out;
}

/* --- Latin -> Arabic (approx, readable) --- */
function latinToArabic(s){
  const x = String(s).toLowerCase();

  // tokenize into phoneme chunks
  const chunks = [];
  for (let i=0;i<x.length;){
    const two = x.slice(i,i+2);
    if (two === "sh" || two === "kh" || two === "ts"){
      chunks.push(two); i+=2; continue;
    }
    chunks.push(x[i]); i+=1;
  }

  const consMap = {
    sh:"ش", kh:"خ", ts:"تس",
    b:"ب", p:"ب",
    v:"ف", f:"ف",
    g:"غ",
    d:"د",
    t:"ت",
    k:"ك",
    l:"ل",
    m:"م",
    n:"ن",
    r:"ر",
    s:"س",
    z:"ز",
    h:"ه",
    y:"ي",
    j:"ج"
  };

  function vowelMap(v){
    if (v === "a") return "ا";
    if (v === "e") return "ي";
    if (v === "i") return "ي";
    if (v === "o") return "و";
    if (v === "u") return "و";
    return "";
  }

  let out = "";
  for (let i=0;i<chunks.length;i++){
    const c = chunks[i];
    if (c === " " || c === "-" || c === "/"){ out += c; continue; }

    if ("aeiou".includes(c)){
      out += vowelMap(c);
      continue;
    }

    const ar = consMap[c] || "";
    out += ar || c;
  }

  // Arabic prefers RTL; rendering is RTL by page dir (ar is rtl)
  return out.replace(/\s+/g, " ").trim();
}

/* --- Latin -> Amharic (Ge'ez) (approx) --- */
function latinToAmharic(s){
  const x = String(s).toLowerCase();

  // phoneme chunks
  const chunks = [];
  for (let i=0;i<x.length;){
    const two = x.slice(i,i+2);
    if (two === "sh" || two === "kh" || two === "ts"){
      chunks.push(two); i+=2; continue;
    }
    chunks.push(x[i]); i+=1;
  }

  // map consonant to base ge'ez series (7 orders)
  // orders: ä, u, i, a, e, ə, o (approx)
  const series = {
    b:["ብ","ቡ","ቢ","ባ","ቤ","ቦ","ቦ"],
    v:["ቭ","ቩ","ቪ","ቫ","ቬ","ቮ","ቮ"],
    p:["ፕ","ፑ","ፒ","ፓ","ፔ","ፖ","ፖ"],
    m:["ም","ሙ","ሚ","ማ","ሜ","ሞ","ሞ"],
    n:["ን","ኑ","ኒ","ና","ኔ","ኖ","ኖ"],
    t:["ት","ቱ","ቲ","ታ","ቴ","ቶ","ቶ"],
    d:["ድ","ዱ","ዲ","ዳ","ዴ","ዶ","ዶ"],
    k:["ክ","ኩ","ኪ","ካ","ኬ","ኮ","ኮ"],
    kh:["ኽ","ኹ","ኺ","ኻ","ኼ","ኾ","ኾ"],
    g:["ግ","ጉ","ጊ","ጋ","ጌ","ጎ","ጎ"],
    s:["ስ","ሱ","ሲ","ሳ","ሴ","ሶ","ሶ"],
    z:["ዝ","ዙ","ዚ","ዛ","ዜ","ዞ","ዞ"],
    sh:["ሽ","ሹ","ሺ","ሻ","ሼ","ሾ","ሾ"],
    r:["ር","ሩ","ሪ","ራ","ሬ","ሮ","ሮ"],
    l:["ል","ሉ","ሊ","ላ","ሌ","ሎ","ሎ"],
    h:["ሕ","ሑ","ሒ","ሓ","ሔ","ሖ","ሖ"],
    y:["ይ","ዩ","ዪ","ያ","ዬ","ዮ","ዮ"],
    ts:["ጽ","ጹ","ጺ","ጻ","ጼ","ጾ","ጾ"],
  };

  const vowels = new Set(["a","e","i","o","u"]);

  function orderForVowel(v){
    // ä(u/i/a/e/o) approximations
    if (v === "u") return 1;
    if (v === "i") return 2;
    if (v === "a") return 3;
    if (v === "e") return 4;
    if (v === "o") return 5;
    return 0;
  }

  let out = "";
  for (let i=0;i<chunks.length;i++){
    const c = chunks[i];

    if (c === " " || c === "-" || c === "/"){ out += c; continue; }

    // standalone vowel
    if (vowels.has(c)){
      // represent as vowel carrier አ/ኡ/ኢ/ኣ/ኤ/ኦ etc
      const carrier = { a:"አ", e:"ኤ", i:"ኢ", o:"ኦ", u:"ኡ" }[c] || "አ";
      out += carrier;
      continue;
    }

    // consonant possibly followed by vowel
    const next = chunks[i+1];
    const v = (next && vowels.has(next)) ? next : null;
    if (v){
      const ord = orderForVowel(v);
      const arr = series[c] || null;
      out += (arr ? (arr[ord] || arr[0]) : c);
      i += 1; // consume vowel
    } else {
      const arr = series[c] || null;
      out += (arr ? arr[0] : c);
    }
  }

  return out.replace(/\s+/g, " ").trim();
}
