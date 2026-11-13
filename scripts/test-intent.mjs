import { parseShopkeeperVoiceIntent, parseCustomerSearchQuery } from "../lib/voice-intent-parser.js";
import { INITIAL_INVENTORY } from "../lib/demo-data.js";

const testShopInventory = INITIAL_INVENTORY.filter(i => i.shopId === "shop-valluvanad");

console.log("=== RUNNING DETERMINISTIC INTENT PARSER TESTS ===");

const testCases = [
  {
    input: "Ente kada-yil 10 kg Ponni rice undu.",
    expectedAction: "SET",
    expectedProduct: "Ponni Rice",
    expectedQty: 10,
    expectedProposedStock: 10,
  },
  {
    input: "Add 10 kg Ponni rice.",
    expectedAction: "ADD",
    expectedProduct: "Ponni Rice",
    expectedQty: 10,
    expectedProposedStock: 55, // 45 + 10
  },
  {
    input: "Ente kada-yil 5 packet sugar undu.",
    expectedAction: "SET",
    expectedProduct: "White Sugar",
    expectedQty: 5,
    expectedProposedStock: 5,
  },
  {
    input: "Reduce milk stock by 3.",
    expectedAction: "REDUCE",
    expectedProduct: "Milma Milk (Blue Toned)",
    expectedQty: 3,
    expectedProposedStock: 1, // 4 - 3
  },
  {
    input: "Kada-yil 10 litre Kera coconut oil vannu",
    expectedAction: "ADD",
    expectedProduct: "Kera Coconut Oil",
    expectedQty: 10,
    expectedProposedStock: 28, // 18 + 10
  }
];

let passed = 0;

for (const tc of testCases) {
  const result = parseShopkeeperVoiceIntent(tc.input, testShopInventory);
  const ok =
    result.success &&
    result.action === tc.expectedAction &&
    result.product?.name === tc.expectedProduct &&
    result.quantity === tc.expectedQty &&
    result.proposedStock === tc.expectedProposedStock;

  if (ok) {
    console.log(`[PASS] "${tc.input}" -> ${result.action} ${result.product.name}: ${result.proposedStock} ${result.unit}`);
    passed++;
  } else {
    console.error(`[FAIL] "${tc.input}"`);
    console.error("  Got:", result);
    console.error("  Expected:", tc);
  }
}

console.log(`\n=== Customer Search Query Parser Tests ===`);
const searchTests = [
  "Where can I get Ponni rice?",
  "Milma milk unda?",
  "പഞ്ചസാര എവിടെ കിട്ടും?"
];

for (const query of searchTests) {
  const parsed = parseCustomerSearchQuery(query);
  console.log(`Query: "${query}" -> Clean: "${parsed.cleanQuery}", Lang: ${parsed.detectedLanguage}`);
}

console.log(`\nResult: ${passed}/${testCases.length} tests passed.`);
if (passed === testCases.length) {
  console.log("All intent tests verified successfully!");
  process.exit(0);
} else {
  process.exit(1);
}
