// Deterministic Malayalam + English + Code-mixed (Manglish) Voice Intent Parser
// Built according to the specification: deterministic, zero unnecessary LLM credits, robust rules.

const NUMBER_MAP = {
  // English words
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, twentyfive: 25, thirty: 30,
  forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  // Malayalam script
  "പൂജ്യം": 0, "ഒന്ന്": 1, "രണ്ട്": 2, "മൂന്ന്": 3, "നാല്": 4, "അഞ്ച്": 5, "ആറ്": 6,
  "ഏഴ്": 7, "എട്ട്": 8, "ഒൻപത്": 9, "പത്ത്": 10, "പതിനഞ്ച്": 15, "ഇരുപത്": 20,
  "ഇരുപത്തിയഞ്ച്": 25, "മുപ്പത്": 30, "നാല്പത്": 40, "അൻപത്": 50, "നൂറ്": 100,
  // Manglish
  onnu: 1, randu: 2, moonnu: 3, naalu: 4, anju: 5, aaru: 6, ezhu: 7, ettu: 8,
  onpathu: 9, pathu: 10, pathinanchu: 15, irupathu: 20, irupathanchu: 25,
  muppathu: 30, nalpathu: 40, anpathu: 50, nooru: 100,
  half: 0.5, "അര": 0.5, ara: 0.5, quarter: 0.25, "കാൽ": 0.25, kaal: 0.25
};

const UNIT_PATTERNS = [
  { unit: "kg", regex: /\b(kg|kgs|kilo|kilos|kilogram|kilograms|കിലോ|കിലോഗ്രാം)\b/i },
  { unit: "packet", regex: /\b(packet|packets|pkt|pkts|പാക്കറ്റ്|പാക്കറ്റുകൾ|കവർ|cover|covers)\b/i },
  { unit: "L", regex: /\b(l|litre|litres|liter|liters|ലിറ്റർ|ലിറ്റര്)\b/i },
  { unit: "g", regex: /\b(g|gm|gms|gram|grams|ഗ്രാം)\b/i },
  { unit: "bottle", regex: /\b(bottle|bottles|കുപ്പി|കുപ്പികൾ)\b/i },
  { unit: "box", regex: /\b(box|boxes|പെട്ടി|ബോക്സ്)\b/i },
  { unit: "piece", regex: /\b(piece|pieces|pcs|pc|എണ്ണം|count|nos)\b/i },
];

// Product dictionary with Malayalam synonyms and Manglish pronunciations
const PRODUCT_CATALOG = [
  {
    canonicalName: "Ponni Rice",
    nameMl: "പൊന്നി അരി",
    category: "rice_grains",
    defaultUnit: "kg",
    keywords: ["ponni", "ponni rice", "പൊന്നി", "പൊന്നി അരി", "ponni ari", "ponniari", "tanjavur ponni"]
  },
  {
    canonicalName: "Kerala Matta Rice",
    nameMl: "കേരള മട്ട അരി",
    category: "rice_grains",
    defaultUnit: "kg",
    keywords: ["matta", "matta rice", "മട്ട", "മട്ട അരി", "കേരള മട്ട", "matta ari", "kerala rice", "chuvanna ari"]
  },
  {
    canonicalName: "Jaya Rice",
    nameMl: "ജയ അരി",
    category: "rice_grains",
    defaultUnit: "kg",
    keywords: ["jaya", "jaya rice", "ജയ", "ജയ അരി", "jaya ari"]
  },
  {
    canonicalName: "Kera Coconut Oil",
    nameMl: "കേര വെളിച്ചെണ്ണ",
    category: "oils_ghee",
    defaultUnit: "L",
    keywords: ["coconut oil", "velichenna", "kera", "വെളിച്ചെണ്ണ", "കേര", "kera coconut oil", "thenga enna", "cooking oil"]
  },
  {
    canonicalName: "Milma Milk (Blue Toned)",
    nameMl: "മിൽമ പാൽ (നീല)",
    category: "dairy_beverages",
    defaultUnit: "packet",
    keywords: ["milma", "milk", "paal", "പാൽ", "മിൽമ", "milma milk", "blue milma", "toned milk", "cow milk"]
  },
  {
    canonicalName: "Milma Ghee",
    nameMl: "മിൽമ നെയ്യ്",
    category: "oils_ghee",
    defaultUnit: "bottle",
    keywords: ["ghee", "neyy", "neyyu", "നെയ്യ്", "മിൽമ നെയ്യ്", "milma ghee"]
  },
  {
    canonicalName: "White Sugar",
    nameMl: "വെള്ള പഞ്ചസാര",
    category: "daily_staples",
    defaultUnit: "kg",
    keywords: ["sugar", "panjasara", "panchasara", "പഞ്ചസാര", "white sugar", "cheeni", "shakara"]
  },
  {
    canonicalName: "Aashirvaad Shudh Chakki Atta",
    nameMl: "ആശിർവാദ് ആട്ട",
    category: "daily_staples",
    defaultUnit: "packet",
    keywords: ["atta", "aashirvaad", "ashirvad", "wheat flour", "ആട്ട", "ആശിർവാദ്", "godhambu podi", "chakkia tta"]
  },
  {
    canonicalName: "Kannan Devan Strong Tea",
    nameMl: "കണ്ണൻ ദേവൻ ചായപ്പൊടി",
    category: "dairy_beverages",
    defaultUnit: "packet",
    keywords: ["tea", "kannan devan", "tea powder", "ചായപ്പൊടി", "കണ്ണൻ ദേവൻ", "chaaya podi", "chaya podi", "tata tea"]
  },
  {
    canonicalName: "Bru Instant Coffee",
    nameMl: "ബ്രൂ ഇൻസ്റ്റന്റ് കോഫി",
    category: "dairy_beverages",
    defaultUnit: "bottle",
    keywords: ["bru", "coffee", "kaapi", "കോഫി", "ബ്രൂ", "bru coffee", "instant coffee", "kaapipodi"]
  },
  {
    canonicalName: "Tata Crystal Salt",
    nameMl: "ടാറ്റ ഉപ്പ്",
    category: "daily_staples",
    defaultUnit: "packet",
    keywords: ["salt", "uppu", "ഉപ്പ്", "tata salt", "കല്ലുപ്പ്", "powder salt", "tata crystal salt"]
  },
  {
    canonicalName: "Eastern Kashmiri Chilli Powder",
    nameMl: "ഈസ്റ്റേൺ കാശ്മീരി മുളകുപൊടി",
    category: "spices_masala",
    defaultUnit: "packet",
    keywords: ["chilli powder", "mulaku podi", "മുളകുപൊടി", "kashmiri chilli", "eastern chilli", "chilli"]
  },
  {
    canonicalName: "Vim Dishwash Bar",
    nameMl: "വിം ഡിഷ് വാഷ് ബാർ",
    category: "household",
    defaultUnit: "piece",
    keywords: ["vim", "dishwash", "വിം", "dishwash bar", "soap bar", "pathram kazhukal soap"]
  },
  {
    canonicalName: "Marayoor Jaggery (ശർക്കര)",
    nameMl: "മറയൂർ ഉണ്ട ശർക്കര",
    category: "daily_staples",
    defaultUnit: "kg",
    keywords: ["jaggery", "sharkkara", "sarkkara", "ശർക്കര", "marayoor jaggery", "unda sharkara"]
  },
  {
    canonicalName: "Green Gram / Cherupayar",
    nameMl: "ചെറുപയർ",
    category: "pulses_lentils",
    defaultUnit: "kg",
    keywords: ["cherupayar", "green gram", "ചെറുപയർ", "moong", "payar"]
  }
];

export function parseShopkeeperVoiceIntent(rawTranscript, shopInventory = []) {
  if (!rawTranscript || typeof rawTranscript !== "string") {
    return {
      success: false,
      error: "Empty speech transcript received",
      transcript: ""
    };
  }

  const clean = rawTranscript.trim();
  const lower = clean.toLowerCase();

  // 1. Detect Action: ADD, REDUCE, or SET
  let action = "ADD"; // default fallback
  let actionConfidence = 0.8;

  // Patterns for REDUCE (sold, minus, remove, kuraykkuka, vittu, theernnu, cut)
  const reduceRegex = /\b(reduce|decrease|minus|sub|subtract|sold|remove|less|cut|കുറയ്ക്കുക|കുറച്ചു|കുറക്കുക|വിറ്റു|വിൽപ്പന|മാറ്റുക|തീർന്നു|theernnu|kuraykkuka|kurakkuka|kurachu|vittu|koduthu|minus cheyyuka)\b/i;

  // Patterns for SET / ABSOLUTE ("Ente kadayil 10 kg undu", "stock is 10", "undu", "aannu", "set", "irikkunnu")
  const setRegex = /\b(ente kada-yil|ente kadayil|kadayil|undu|und|ഉണ്ട്|ആണ്|aanu|aannu|irikkunnu|set|stock is|current stock|total|stock aakuka|മാറ്റി വെക്കുക)\b/i;

  // Patterns for ADD
  const addRegex = /\b(add|plus|increase|restock|load|received|got|vannu|vanna|ethi|kitti|ചേർക്കുക|കൂട്ടുക|വന്നു|കൂട്ടി|കൂട്ടുക|ചേർത്തു|add cheyyuka|kootuka|koottuka)\b/i;

  if (reduceRegex.test(lower)) {
    action = "REDUCE";
    actionConfidence = 0.95;
  } else if (setRegex.test(lower) && !addRegex.test(lower)) {
    action = "SET";
    actionConfidence = 0.92;
  } else if (addRegex.test(lower)) {
    action = "ADD";
    actionConfidence = 0.95;
  }

  // 2. Extract Quantity
  let quantity = null;

  // Check for numeric digits e.g. "10", "10.5", "5"
  const digitMatch = lower.match(/(\d+(\.\d+)?)/);
  if (digitMatch) {
    quantity = parseFloat(digitMatch[1]);
  } else {
    // Check words
    for (const [word, val] of Object.entries(NUMBER_MAP)) {
      const wordRegex = new RegExp(`\\b${word}\\b`, "i");
      if (wordRegex.test(lower)) {
        quantity = val;
        break;
      }
    }
  }

  // 3. Extract Unit
  let unit = null;
  for (const up of UNIT_PATTERNS) {
    if (up.regex.test(lower)) {
      unit = up.unit;
      break;
    }
  }

  // 4. Match Product against Catalog and Current Shop Inventory
  let matchedProduct = null;
  let highestMatchScore = 0;

  // Combine items in this shop with catalog
  const searchPool = [...shopInventory];
  for (const catItem of PRODUCT_CATALOG) {
    if (!searchPool.some(p => p.name.toLowerCase() === catItem.canonicalName.toLowerCase())) {
      searchPool.push({
        id: `cat-${catItem.canonicalName.toLowerCase().replace(/\s+/g, '-')}`,
        name: catItem.canonicalName,
        nameMl: catItem.nameMl,
        category: catItem.category,
        unit: catItem.defaultUnit,
        quantity: 0,
        price: 50,
      });
    }
  }

  for (const item of searchPool) {
    // Check item name, nameMl, and catalog keywords
    const candidateNames = [
      item.name.toLowerCase(),
      (item.nameMl || "").toLowerCase(),
    ];

    const catalogMatch = PRODUCT_CATALOG.find(c => c.canonicalName.toLowerCase() === item.name.toLowerCase());
    if (catalogMatch && catalogMatch.keywords) {
      candidateNames.push(...catalogMatch.keywords.map(k => k.toLowerCase()));
    }

    for (const nameVariant of candidateNames) {
      if (!nameVariant) continue;

      if (lower.includes(nameVariant)) {
        const score = nameVariant.length;
        if (score > highestMatchScore) {
          highestMatchScore = score;
          matchedProduct = item;
        }
      }
    }
  }

  // If no direct substring, check single-word match (e.g. "rice", "sugar", "milk", "oil", "tea", "atta")
  if (!matchedProduct) {
    const tokens = lower.split(/[\s,.-]+/);
    for (const item of searchPool) {
      const cat = PRODUCT_CATALOG.find(c => c.canonicalName.toLowerCase() === item.name.toLowerCase());
      const allWords = [
        ...item.name.toLowerCase().split(/\s+/),
        ...(cat ? cat.keywords : [])
      ];

      for (const token of tokens) {
        if (token.length < 3) continue;
        if (allWords.some(w => w.includes(token) || token.includes(w))) {
          matchedProduct = item;
          break;
        }
      }
      if (matchedProduct) break;
    }
  }

  // If quantity still not found, default to 1 with lower confidence
  const finalQuantity = quantity !== null ? quantity : 1;
  const finalUnit = unit || (matchedProduct ? matchedProduct.unit : "packet");

  // Calculate proposed stock change
  const currentStock = matchedProduct ? (matchedProduct.quantity || 0) : 0;
  let proposedStock = currentStock;

  if (action === "ADD") {
    proposedStock = currentStock + finalQuantity;
  } else if (action === "REDUCE") {
    proposedStock = Math.max(0, currentStock - finalQuantity);
  } else if (action === "SET") {
    proposedStock = finalQuantity;
  }

  // Build human-friendly explanation in Malayalam and English
  const actionLabel = action === "ADD" ? "Add to stock (+)" : action === "REDUCE" ? "Reduce stock (-)" : "Set exact stock (=)";
  const actionLabelMl = action === "ADD" ? "സ്റ്റോക്കിൽ കൂട്ടുക (+)" : action === "REDUCE" ? "സ്റ്റോക്കിൽ നിന്ന് കുറയ്ക്കുക (-)" : "നിലവിലെ സ്റ്റോക്ക് ആക്കുക (=)";

  const explanationEn = action === "ADD"
    ? `Add ${finalQuantity} ${finalUnit} to ${matchedProduct ? matchedProduct.name : 'item'} (from ${currentStock} to ${proposedStock} ${finalUnit})`
    : action === "REDUCE"
    ? `Reduce ${finalQuantity} ${finalUnit} from ${matchedProduct ? matchedProduct.name : 'item'} (from ${currentStock} to ${proposedStock} ${finalUnit})`
    : `Update ${matchedProduct ? matchedProduct.name : 'item'} stock to ${finalQuantity} ${finalUnit}`;

  const explanationMl = action === "ADD"
    ? `${matchedProduct ? matchedProduct.nameMl || matchedProduct.name : 'സാധനം'} സ്റ്റോക്കിലേക്ക് ${finalQuantity} ${finalUnit} കൂട്ടുക (${currentStock} ൽ നിന്ന് ${proposedStock} ലേക്ക്)`
    : action === "REDUCE"
    ? `${matchedProduct ? matchedProduct.nameMl || matchedProduct.name : 'സാധനം'} സ്റ്റോക്കിൽ നിന്ന് ${finalQuantity} ${finalUnit} കുറയ്ക്കുക (${currentStock} ൽ നിന്ന് ${proposedStock} ലേക്ക്)`
    : `${matchedProduct ? matchedProduct.nameMl || matchedProduct.name : 'സാധനം'} സ്റ്റോക്ക് ${finalQuantity} ${finalUnit} എന്ന് പുതുക്കുക`;

  return {
    success: matchedProduct !== null,
    transcript: clean,
    action,
    actionLabel,
    actionLabelMl,
    product: matchedProduct ? {
      id: matchedProduct.id,
      name: matchedProduct.name,
      nameMl: matchedProduct.nameMl,
      category: matchedProduct.category,
      price: matchedProduct.price,
    } : null,
    quantity: finalQuantity,
    unit: finalUnit,
    currentStock,
    proposedStock,
    explanationEn,
    explanationMl,
    confidence: matchedProduct ? (quantity !== null ? 0.96 : 0.75) : 0.40,
    requiresConfirmation: true, // Safety rule: always confirm before updating
  };
}

// Customer search query parser (supports natural language queries like "Where can I get Ponni rice?", "ചായപ്പൊടി എവിടെ കിട്ടും?", "Do you have sugar?")
export function parseCustomerSearchQuery(query) {
  if (!query || typeof query !== "string") {
    return { cleanQuery: "", searchKeywords: [], detectedLanguage: "en" };
  }

  const raw = query.trim();
  const lower = raw.toLowerCase();

  // Strip conversational filler: "where can i get", "is there", "where to buy", "evide kittum", "undu", "looking for", "need"
  const cleaned = lower
    .replace(/\b(where can i get|where can i find|where to buy|do you have|i need|looking for|search for|is there any|show me|find|give me|please)\b/gi, "")
    .replace(/\b(evide kittum|evideyannu|kadayil undu|undu|aano|kittumo|undo|ente|venam|njan nokkunnu)\b/gi, "")
    .replace(/[?.,!]+/g, "")
    .trim();

  // Detect script (Malayalam unicode range 0x0D00 - 0x0D7F)
  const isMalayalamScript = /[\u0D00-\u0D7F]/.test(raw);

  return {
    originalQuery: raw,
    cleanQuery: cleaned || raw,
    isMalayalamScript,
    detectedLanguage: isMalayalamScript ? "ml-IN" : "en-IN",
  };
}
