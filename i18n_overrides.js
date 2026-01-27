/*
  i18n_overrides.js
  -----------------
  קובץ זה מאפשר לעקוף תרגומים בעייתיים בצורה מקומית וקלה, בלי לגעת ב-app.js.

  כללים:
  - KEY = הטקסט המקורי בעברית (בדיוק כפי שהוא מופיע בשאלון).
  - VALUE = תרגום מדויק בשפה הרצויה.
  - VALUE יכול לכלול תגיות צבע [B]/[H]/[P] והן יעבדו כמו בעברית.

  דוגמה:
    "אילו סימונים חייבים להיות לתבנית [B]בשרית[/B]?":
      "Which markings must a [B]meat[/B] tray have?"
*/

// 1) Override מלא למשפטים בעייתיים (מומלץ)
window.I18N_OVERRIDES = {
  en: {
    // Q1
  "איפה אסור לאחסן דגים בזמן הארוחה כדי לשמור על חומם?":
    "Where is it forbidden to keep fish warm during the meal?",
  "בתרמופורט נפרד.": "In a separate thermoport.",
  "על פלטה או משטח חימום.": "On a hot plate or warming surface.",
  "בתנור המקורי.": "In the same oven.",
  "בארון חימום הרגיל.": "In the regular warming cabinet.",
  "❌ לא נכון. ניתן לאחסן בכל מקום שאין בו מזון [B]בשרי[/B].":
    "❌ Not correct. You may store fish anywhere that has no [B]meat[/B] food.",

  // Q2
  "איך צריך להגיש בשר ודגים":
    "How should meat and fish be served?",
  "בתבניות נפרדות": "On separate trays.",
  "עם הפרדה של פחמימה": "With a divider (starch in between).",
  "❌ אסור לשים בשר ודגים אחד ליד השני או באותו ארון חימום.":
    "❌ Meat and fish must not be placed next to each other or in the same warming cabinet.",

  // Q3
  "התאימו בין הסקוטש לכלי!":
    "Match the Velcro color to the correct utensil!",
  "סקוטש אדום": "Red Velcro",
  "סקוטש צהוב": "Yellow Velcro",
  "סקוטש כחול": "Blue Velcro",
  "מגש": "Tray",
  "צלחת": "Plate",
  "סכין": "Knife",
  "❌ התאמה לא נכונה. נסו שוב.":
    "❌ Incorrect match. Try again.",

  // Q4
  "האם ניתן להוציא כלים מהמטבח?":
    "Can utensils be taken out of the kitchen?",
  "כן, רק כשהאוכל כשר.":
    "Yes, only when the food is kosher.",
  "אסור תמיד, אלא אם כן מעבירים איתו מזון ממטבח ראשי למטבח משנה.":
    "No—never, unless it is used to transport food from a main kitchen to a secondary kitchen.",
  "כן, באישור רב היחידה למרות שאין פיקוח על הכלים.":
    "Yes, with the unit rabbi’s approval, even though the utensils are not supervised.",
  "תשובות א ו-ג נכונות.":
    "Answers A and C are correct.",
  "❌ לא נכון. ניתן להוציא כלים רק לצורך הובלת מזון ממטבח אחד למשנהו.":
    "❌ Not correct. Utensils may be taken out only to transport food from one kitchen to another.",

  // Q5
  "מה צריך לעשות עם הכלים האלה?":
    "What should be done with these utensils?",
  "הם מסומנים באדום, יש להשתמש בהם למזון בשרי.":
    "They are marked in red, so they are for [B]meat[/B] food.",
  "צריך לזרוק לפח וליידע את מנהל המטבח.":
    "Throw them in the trash and inform the kitchen manager.",
  "לפי המדבקה והתווית אלו כלים חדשים, יש ליידע את המשגיח.":
    "The sticker shows these are new utensils—inform the kashrut supervisor.",
  "אלו כלים חדשים, לכן ניתן להשתמש גם לחלבי עד שיסומן אחרת.":
    "These are new utensils, so they may be used for [H]dairy[/H] until marked otherwise.",
  "❌ לא נכון. אסור להשתמש בכלים חדשים עד שמשגיח הכשרות יטבול אותם במקווה.":
    "❌ Not correct. New utensils may not be used until the kashrut supervisor immerses them in a mikveh.",

  // Q6
  "לחץ/י על מקום התקלות בתמונה (עד 5 לחיצות)":
    "Click the problem areas in the picture (up to 5 clicks).",
  "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P] וגם מעל אוכל [P]פרווה[/P] פתוח":
    "[H]Dairy[/H] product on a [P]parve[/P] cart, and above uncovered [P]parve[/P] food",
  "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P]":
    "[H]Dairy[/H] product on a [P]parve[/P] cart",
  "מוצר [H]חלבי[/H] על עגלה [P]פרווה[/P] ומעל תבנית [B]בשרית[/B]":
    "[H]Dairy[/H] product on a [P]parve[/P] cart, above a [B]meat[/B] tray",
  "תבנית [B]בשרית[/B] על עגלה [P]פרווה[/P] ומתחת למוצרים [H]חלביים[/H]":
    "[B]Meat[/B] tray on a [P]parve[/P] cart, under [H]dairy[/H] products",
  "❌ שימו לב לצבע של העגלה, מה בטעות שמו עליה?":
    "❌ Look at the cart color—what was placed on it by mistake?",

  // Q7
  "מצאת תבנית כזו, מה תעשה איתה?":
    "You found a tray like this—what will you do?",
  "תבנית בלי חורים יכולה לשמש ל-[B]בשרי[/B].":
    "A tray without holes can be used for [B]meat[/B].",
  "ניתן להשתמש בה כבסיס לתבניות אחרות בתנור.":
    "It can be used as a base for other trays in the oven.",
  "היא לא מסומנת, יש לפנות למשגיח.":
    "It is not marked—contact the supervisor.",
  "היא לא מסומנת אבל ניתן להשתמש בכל זאת.":
    "It is not marked, but you can still use it.",
  "❌ לא נכון. כשהתבנית לא מסומנת – לא משתמשים ופונים למשגיח.":
    "❌ Not correct. If a tray is not marked—do not use it and contact the supervisor.",

  // Q8
  "אילו סימונים חייבים להיות לתבנית [B]בשרית[/B]?":
    "Which markings must a [B]meat[/B] tray have?",
  "שכל התחתית תהיה צבועה באדום":
    "The entire bottom is painted red",
  "3 חורים בפינה":
    "3 holes in the corner",
  "גם צבע וגם מדבקה":
    "Both paint and a sticker",
  "4 חורים בפינה":
    "4 holes in the corner",
  "מדבקה עם כיתוב '[B]בשרי[/B]'":
    "A sticker that says “[B]meat[/B]”",
  "❌ לא נכון. חייבים גם חורים וגם כיתוב '[B]בשרי[/B]'.":
    "❌ Not correct. You must have both holes and a label that says “[B]meat[/B]”.",

  // Q9
  "אילו מוצרים צריכים טיפול כשרותי?":
    "Which products require kosher checking?",
  "קטניות": "Legumes",
  "פסטה": "Pasta",
  "תבלינים": "Spices",
  "תפוחי אדמה": "Potatoes",
  "גזר": "Carrot",
  "חציל": "Eggplant",
  "פלפל צהוב": "Yellow pepper",
  "פלפל חריף": "Hot pepper",
  "עגבניה": "Tomato",
  "קישוא": "Zucchini",
  "❌ ניתן להשתמש ללא טיפול כשרותי":
    "❌ Can be used without kosher checking",
  "❌ יש בחירה לא נכונה. נסו שוב.":
    "❌ One of your choices is incorrect. Try again.",

  // Q10
  "בחר את הכף [H]החלבית[/H]":
    "Choose the [H]dairy[/H] spoon.",
  "כף עם חור": "Spoon with a hole",
  "כף בלי חור": "Spoon without a hole",
  "❌ זו לא הכף [H]החלבית[/H]. שימו לב לאות הראשונה של המילים: חור / בלי חור.":
    "❌ This is not the [H]dairy[/H] spoon. Pay attention: with a hole / without a hole.",

  // Q11
  "איזה בישול/חימום/אידוי/טיגון חלבי מותר במטבח?":
    "Which [H]dairy[/H] cooking/heating/steaming/frying is allowed in the kitchen?",
  "אסור חלב ניגר אבל מותר חמאה ושמנת.":
    "Liquid milk is not allowed, but butter and cream are allowed.",
  "רק בורקסים בצורת משולש.":
    "Only triangle-shaped bourekas.",
  "רק באישור מנהל המטבח.":
    "Only with the kitchen manager’s approval.",
  "אף תשובה אינה נכונה.":
    "None of the answers is correct.",
  "❌ לא נכון. אסור לבשל / לחמם כל סוג של מזון חלבי במטבח.":
    "❌ Not correct. It is forbidden to cook or heat any [H]dairy[/H] food in the kitchen.",

  // Q12
  "לאיפה מותר להכניס אוכל וכלים פרטיים?":
    "Where are private food and utensils allowed?",
  "למטבח בהתאם לאפיון (בשר לבשרי וכו').":
    "Into the kitchen according to the classification (meat with meat, etc.).",
  "רק לחדר האוכל, ובהתאם לאפיון.":
    "Only into the dining room, and according to the classification.",
  "רק אוכל כשר ועם מפית הפרדה מהשולחן.":
    "Only kosher food, and only with a napkin separating it from the table.",
  "אסור להכניס כלים / אוכל פרטי למטבח או לחדר אוכל צבאי.":
    "You may not bring private utensils or food into the kitchen or a military dining room.",
  "❌ לא נכון. אסור להכניס דברים פרטיים למטבחים או חדרי אוכל בצבא":
    "❌ Not correct. Private items are not allowed in military kitchens or dining rooms.",

  // Q13
  "התבוננו בתרשים ואז לחצו המשך.":
    "Look at the diagram, then click Continue.",
  "גררו כל מוצר למדף הנכון לפי התרשים שראיתם":
    "Drag each product to the correct shelf according to the diagram.",
  "חלב": "Milk",
  "שתיה": "Drink",
  "חומוס": "Hummus",
  "קוטג'": "Cottage cheese",
  "חלב סויה": "Soy milk",
  "מילקי": "Milky",
  "גבינה צהובה": "Yellow cheese",
  "מעדן סויה": "Soy dessert",
  "❌ חלב הוא [H]חלבי[/H]. צריך לשים בצד ימין.":
    "❌ Milk is [H]dairy[/H]. Put it on the right.",
  "❌ בקבוקי שתיה מתוקה הם [P]פרווה[/P]. צריך לשים בצד שמאל.":
    "❌ Sweet drinks are [P]parve[/P]. Put them on the left.",
  "❌ חומוס, טחינה וסלטים הם [P]פרווה[/P]. יש לשים בצד שמאל.":
    "❌ Hummus, tahini, and salads are [P]parve[/P]. Put them on the left.",
  "❌ קוטג' הוא [H]חלבי[/H]. לשים בצד ימין.":
    "❌ Cottage cheese is [H]dairy[/H]. Put it on the right.",
  "❌למרות שזה נקרא חלב סויה, הסויה היא [P]פרווה[/P]. יש לשים בצד שמאל.":
    "❌ Even though it is called soy milk, soy is [P]parve[/P]. Put it on the left.",
  "❌ המילקי הוא מעדן המכיל חלב, ולכן הוא [H]חלבי[/H]. ושייך לצד ימין.":
    "❌ Milky contains milk, so it is [H]dairy[/H]. Put it on the right.",
  "❌ גבינה צהובה מכילה חלב היא [H]חלבית[/H]. יש לשים בצד ימין.":
    "❌ Yellow cheese contains milk, so it is [H]dairy[/H]. Put it on the right.",
  "❌ סויה הוא [P]פרווה[/P]. לא להתבלבל עם מעדן חלבי.. לשים בצד שמאל.":
    "❌ Soy is [P]parve[/P]. Don’t confuse it with a dairy dessert—put it on the left.",

  // Q14
  "איזה גסטרונום שייך ל[P]פרווה[/P]?":
    "Which gastronorm pan belongs to [P]parve[/P]?",
  "3 חורים": "3 holes",
  "2 חורים": "2 holes",
  "❌ זה לא הגסטרונום ה[P]פרווה[/P]. רמז - תמיד יש הפרדה בין [B]בשרי[/B] (3 חורים) [H]לחלבי[/H] (חור 1).":
    "❌ This is not the [P]parve[/P] pan. Hint: there is always separation between [B]meat[/B] (3 holes) and [H]dairy[/H] (1 hole).",

  // Q15
  "איך ניתן להכניס כלים [B]בשריים[/B] לחדר [P]פרווה[/P]?":
    "How may [B]meat[/B] utensils be brought into a [P]parve[/P] room?",
  "אסור להכניס כלים [B]בשריים[/B] לחדר [P]פרווה[/P].":
    "It is forbidden to bring [B]meat[/B] utensils into a [P]parve[/P] room.",
  "על עגלה [B]בשרית[/B] בלבד.":
    "Only on a [B]meat[/B] cart.",
  "רק כאשר מניחים על הרצפה.":
    "Only if placed on the floor.",
  "רק על משטחים נקיים אחרי ווידוא שגם הכלי נקי ויבש.":
    "Only on clean surfaces, after making sure the utensil is also clean and dry.",
  "❌ לא נכון. הכנסת כלי [B]בשרי[/B] לחדר [P]פרווה[/P] מותרת רק על עגלה בשרית.":
    "❌ Not correct. A [B]meat[/B] utensil may be brought into a [P]parve[/P] room only on a [B]meat[/B] cart.",

  // Q16
  "איזה משימות רשאי לבצע עובד מטבח שאינו יהודי":
    "Which tasks may a non-Jewish kitchen worker perform?",
  "חיתוך ירקות": "Cutting vegetables",
  "הדלקת תנורים, ארונות חימום, מטגנות":
    "Turning on ovens, warming cabinets, and fryers",
  "עירבוב סיר על האש": "Stirring a pot on the fire",
  "הכנת טחינה": "Preparing tahini",
  "הגשת מזון לפס": "Serving food at the serving line",
  "הדלקת איש וכיריים": "Lighting a fire and turning on a stove",
  "סגירת דלת תנור עם מזון": "Closing an oven door with food inside",
  "הדלקת סיר קיטור": "Turning on the steamer",
  "שטיפת כלים והחזרה למדפי ייבוש":
    "Washing utensils and returning them to drying racks",
  "צליית / טיגון מזון על אש או פלאנצ'ה":
    "Grilling/frying food on a flame or flat-top griddle",
  "הנחת סירים עם מזון על אש או מקור חום":
    "Placing pots with food on a flame or heat source",
  "❌ לא נכון. מותרות רק עבודות שאינן קשורות לבישול/חימום/טיגון.":
    "❌ Not correct. Only tasks that are not cooking/heating/frying are allowed.",

  // Q17
  "בחר/י את כל המוצרים שניתן להכניס למקרר [P]פרווה[/P]":
    "Choose all products that may be put in a [P]parve[/P] refrigerator",
  "מלפפונים": "Cucumbers",
  "לורד סנדויץ'": "Lord sandwich",
  "שתיה מתוקה": "Sweet drink",
  "מעדן קרלו": "Carlo dessert",
  "מעדן ג'לי": "Jelly dessert",
  "רוטב טריאקי": "Teriyaki sauce",
  "ביצים": "Eggs",
  "❌ אסור להכניס מעדנים חלביים!":
    "❌ Dairy desserts are not allowed!",
  "❌ שימו לב מה יש בסנדוויץ', הוא חלבי!":
    "❌ Check what’s in the sandwich—it’s [H]dairy[/H]!",
  "❌ אסור להכניס מוצרי חלב מכל סוג!":
    "❌ No dairy products of any kind are allowed!",
  "❌ מעדן קרלו הוא חלבי!":
    "❌ The Carlo dessert is [H]dairy[/H]!",

  // Q18
  "האם מותר שיהיה במקרר אחד גם [H]חלבי[/H] וגם [P]פרווה[/P]?":
    "Is it allowed to have both [H]dairy[/H] and [P]parve[/P] in the same refrigerator?",
  "לא, אסור בשום אופן.": "No, absolutely not.",
  "לא אלא אם כן המשגיח אישר.":
    "No—unless the supervisor approved.",
  "על מדפים בצדדים שונים, בתנאי שיש תרשים על המקרר ומסדרים לפיו.":
    "On shelves on different sides, as long as there is a diagram on the refrigerator and you arrange according to it.",
  "במדפים באותו צד, כשה[P]פרווה[/P] תמיד למעלה וסגור היטב.":
    "On shelves on the same side, with [P]parve[/P] always on top and tightly closed.",
  "❌ לא נכון. מותר לשלב במקרר רק אם יש הפרדה ברורה וסידור קבוע שמונע טפטוף/מגע.":
    "❌ Not correct. It is allowed only with clear separation and a fixed arrangement that prevents dripping/contact."

  },
  ru: {
    // "<טקסט בעברית>": "<תרגום ברוסית>",
  },
  ar: {
    // "<טקסט בעברית>": "<תרגום בערבית>",
  },
  am: {
    // "<טקסט בעברית>": "<תרגום באמהרית>",
  }
};

// 2) Glossary קבוע למונחי כשרות נפוצים – כדי למנוע טעויות כמו parve/fur וכו'
//    ניתן להרחיב/לתקן כאן.
window.I18N_GLOSSARY = {
  // English
  en: {
    MEAT: "meat",
    DAIRY: "dairy",
    PARVE: "parve",
    // צירופים נפוצים עם תחילית בעברית (ל...)
    FOR_MEAT: "for meat",
    FOR_DAIRY: "for dairy",
    FOR_PARVE: "for parve"
  },
  // Russian (בסיסי; כדאי לתת לדובר שפת אם לאשר)
  ru: {
    MEAT: "мясное",
    DAIRY: "молочное",
    PARVE: "парве",
    FOR_MEAT: "для мясного",
    FOR_DAIRY: "для молочного",
    FOR_PARVE: "для парве"
  },
  // Arabic (בסיסי; מומלץ אימות ע"י דובר)
  ar: {
    MEAT: "لحمي",
    DAIRY: "حليبي",
    PARVE: "باريف",
    FOR_MEAT: "للاستخدام اللحمي",
    FOR_DAIRY: "للاستخدام الحليبي",
    FOR_PARVE: "للاستخدام الباريف"
  },
  // Amharic (השאירי ריק והשלימי ידנית עם דובר/ת שפת אם)
  am: {
    MEAT: "",
    DAIRY: "",
    PARVE: "",
    FOR_MEAT: "",
    FOR_DAIRY: "",
    FOR_PARVE: ""
  }
};
