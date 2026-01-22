{
  "meta": { "lang": "en", "dir": "ltr", "name": "English" },

  "ui": {
    "appTitle": "Kashrut Training – Kitchen Staff",
    "startTitle": "Kashrut Training – Kitchen Staff",
    "startSubtitle": "Fill in your details to begin.",
    "fullNameLabel": "Full name",
    "fullNamePlaceholder": "Your name...",
    "personalIdLabel": "ID / Personal number",
    "personalIdPlaceholder": "ID / Personal no.",
    "languageLabel": "Language",
    "kitchenLabel": "Kitchen",
    "kitchenPlaceholder": "Select a kitchen",
    "kitchensLoading": "Loading kitchens…",
    "startButton": "Start",
    "nextButton": "Next",
    "retryButton": "Try again",
    "deleteButton": "Delete",
    "showChartButton": "Show chart",
    "backToQuestionButton": "Back to question",
    "finishTitle": "Done",
    "resendButton": "Send again"
  },

  "rotate": {
    "title": "Please rotate back to portrait",
    "subtitle": "The quiz works in portrait only"
  },

  "errors": {
    "fillName": "Please enter your name.",
    "fillId": "Please enter your ID / personal number.",
    "chooseKitchen": "Please select a kitchen.",
    "fullNameInvalid": "Please enter a full name (at least two words).",
    "idDigitsOnly": "ID / personal number must be 7 or 9 digits (digits only).",
    "idInvalid": "Invalid Israeli ID number.",
    "loadKitchensNet": "Check your internet connection and try again",
    "loadKitchensFail": "We couldn’t load your kitchen list. Check APPS_SCRIPT_URL / Apps Script Deploy settings.",
    "unknownType": "Unknown type: {type}"
  },

  "quiz": {
    "progress": "Question {n} of {total}",
    "genericWrong": "Incorrect ❌ Try again.",
    "maxHotspotClicks": "You reached the maximum number of clicks.",
    "hotspotInstructions": "You can delete a specific marker and try again.",
    "hotspotStatus": "Hits: {hits}/{total} | Clicks: {attempts}/{max}",
    "correct": "Correct ✅",
    "incorrect": "Incorrect ❌",
    "deletedTryAgain": "Deleted. You can click again.",
    "mcMultiHint": "Note: There is more than one correct answer.",
    "matchWrong": "Wrong match. Try again"
  },

  "send": {
    "sending": "Sending result…",
    "sentOk": "Result sent successfully ✅",
    "alreadySentThisRun": "The result was already sent in this run ✅",
    "alreadyAccepted": "The submission was already accepted ✅",
    "sendFailNet": "Check your internet connection and try again",
    "sendFail": "Send failed ❌ ({msg})"
  },

  "kitchens": {
    "mode": "translit",
    "translitMap": {
      "מקל\"ר": "mekalar",
      "מקרפ\"ר ב": "makrapar b",
      "חט\"ל": "khatal",
      "מש\"א תל השומר": "masha tel hashomer",
      "בסיס ציוד": "basis tsiyud",
      "מצר\"פ": "matsarap",
      "מש\"א צריפין": "masha tsrifin",
      "דקל": "dekel",
      "מרלו\"ג": "merlog",
      "מפקדת מרה\"ס": "mifkedet merhas",
      "סביון": "savyon",
      "גדוד הובלה 6920": "gdud hovala 6920",
      "בית סרודי": "beit serodi"
    }
  },

  "questions": [
    {
      "type": "match_lines",
      "title": "Match the tape to the correct utensil",
      "left": [
        { "alt": "Red tape" },
        { "alt": "Yellow tape" },
        { "alt": "Blue tape" }
      ],
      "right": [
        { "alt": "Tray" },
        { "alt": "Plate" },
        { "alt": "Knife" }
      ],
      "wrongMsg": "❌ Wrong match. Try again."
    },
    {
      "type": "two",
      "title": "How should meat and fish be served?",
      "A": { "caption": "In separate pans" },
      "B": { "caption": "With a carb separator" },
      "wrongMsg": "❌ It is forbidden to place meat and fish next to each other or in the same warming cabinet."
    },
    {
      "type": "hotspot5",
      "title": "Tap the problem areas in the picture (up to 5 taps)",
      "wrongMsg": "❌ Pay attention to the cart color — what was placed on it by mistake?",
      "boxes": [
        { "label": "[H]Dairy[/H] product on a [P]parve[/P] cart, and also above open [P]parve[/P] food" },
        { "label": "[H]Dairy[/H] product on a [P]parve[/P] cart" },
        { "label": "[H]Dairy[/H] product on a [P]parve[/P] cart" },
        { "label": "[H]Dairy[/H] product on a [P]parve[/P] cart, above a [B]meat[/B] pan" },
        { "label": "[B]Meat[/B] pan on a [P]parve[/P] cart, underneath [H]dairy[/H] products" }
      ]
    },
    {
      "type": "mc_single",
      "title": "You found a pan like this. What do you do?",
      "options": [
        "A pan without holes can be used for [B]meat[/B]",
        "It can be used as a base for other pans in the oven",
        "It is not labeled — contact the supervisor",
        "It is not labeled but you can still use it"
      ],
      "wrongMsg": "❌ Incorrect. If a pan isn’t labeled — don’t use it. Contact the supervisor."
    },
    {
      "type": "mc_multi",
      "title": "Which markings are required for a [B]meat[/B] pan?",
      "options": [
        "The entire bottom must be painted red",
        "3 holes in the corner",
        "Both color and a sticker",
        "4 holes in the corner",
        "A sticker that says '[B]Meat[/B]'"
      ],
      "wrongMsg": "❌ Incorrect. You must have holes and the label '[B]Meat[/B]'."
    },
    {
      "type": "two",
      "title": "Choose the [H]dairy[/H] spoon",
      "A": { "caption": "Spoon with a hole" },
      "B": { "caption": "Spoon without a hole" },
      "wrongMsg": "❌ That’s not the [H]dairy[/H] spoon. Hint: Hole / No hole."
    },
    {
      "type": "drag_shelves",
      "title": "Drag each item to the correct shelf side (based on the chart)",
      "introTitle": "Look at the chart, then press Next.",
      "items": [
        { "caption": "Milk", "wrongMsg": "❌ Milk is [H]dairy[/H]. It must go on the right." },
        { "caption": "Drink", "wrongMsg": "❌ Sweet drinks are [P]parve[/P]. They must go on the left." },
        { "caption": "Hummus", "wrongMsg": "❌ Hummus, tahini and salads are [P]parve[/P]. Put them on the left." },
        { "caption": "Cottage cheese", "wrongMsg": "❌ Cottage cheese is [H]dairy[/H]. Put it on the right." },
        { "caption": "Soy milk", "wrongMsg": "❌ Even though it’s called soy milk, soy is [P]parve[/P]. Put it on the left." },
        { "caption": "Milky dessert", "wrongMsg": "❌ This dessert contains milk, so it is [H]dairy[/H] and belongs on the right." },
        { "caption": "Yellow cheese", "wrongMsg": "❌ Yellow cheese contains milk. It is [H]dairy[/H]. Put it on the right." },
        { "caption": "Soy dessert", "wrongMsg": "❌ Soy is [P]parve[/P]. Don’t confuse it with dairy desserts — put it on the left." }
      ]
    },
    {
      "type": "two",
      "title": "Which gastronorm belongs to [P]parve[/P]?",
      "A": { "caption": "3 holes" },
      "B": { "caption": "2 holes" },
      "wrongMsg": "❌ That’s not the [P]parve[/P] gastronorm. Hint: [B]Meat[/B] (3 holes), [H]dairy[/H] (1 hole)."
    },
    {
      "type": "mc_single",
      "title": "How can you bring [B]meat[/B] utensils into a [P]parve[/P] room?",
      "options": [
        "It’s forbidden to bring [B]meat[/B] utensils into a [P]parve[/P] room",
        "Only on a [B]meat[/B] cart",
        "Only when placing them on the floor",
        "Only on clean surfaces after verifying the utensil is clean and dry"
      ],
      "wrongMsg": "❌ Incorrect. Bringing a [B]meat[/B] utensil into a [P]parve[/P] room is allowed only on a meat cart."
    },
    {
      "type": "img_multi10",
      "title": "Select all products that may be placed in a [P]parve[/P] fridge",
      "items": [
        { "caption": "Milky dessert" },
        { "caption": "Cucumbers" },
        { "caption": "Soy milk" },
        { "caption": "Sandwich spread" },
        { "caption": "Yellow cheese" },
        { "caption": "Soft drink" },
        { "caption": "Carlo dessert" },
        { "caption": "Jelly dessert" },
        { "caption": "Teriyaki sauce" },
        { "caption": "Eggs" }
      ],
      "wrongMsgByIndex": {
        "0": "❌ Dairy desserts are not allowed!",
        "3": "❌ Check what’s inside the sandwich — it’s dairy!",
        "4": "❌ No dairy products are allowed!",
        "6": "❌ Carlo dessert is dairy!"
      },
      "wrongMsg": "❌ One of the selections is incorrect. Try again."
    },
    {
      "type": "mc_multi",
      "title": "May the same fridge contain both [H]dairy[/H] and [P]parve[/P]?",
      "options": [
        "No, never",
        "No, unless a supervisor approves",
        "On separate sides, provided there is a fridge chart and everyone follows it",
        "On the same side, with [P]parve[/P] always on top and sealed well"
      ],
      "wrongMsg": "❌ Incorrect. Mixing is allowed only with clear separation and a fixed arrangement that prevents dripping/contact."
    }
  ]
}
