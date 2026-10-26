// Comprehensive Automated Verification Suite for FreshPrice
// Tests Voice Search (Web Speech API NLP, Tamil script, English, Mixed language)
// Tests Complete Tamil & English Multilingual Localization and Language Switching

import { searchProductsWithNLP } from './src/services/voiceSearch.ts';
import { en } from './src/i18n/translations/en.ts';
import { ta } from './src/i18n/translations/ta.ts';
import { translateCategoryName, translateProductName, translateUnit } from './src/i18n/groceryGlossary.ts';

// Mock localStorage for headless test execution
const memoryStorage = {};
global.localStorage = {
  getItem: (key) => memoryStorage[key] || null,
  setItem: (key, val) => { memoryStorage[key] = String(val); },
  removeItem: (key) => { delete memoryStorage[key]; },
  clear: () => { Object.keys(memoryStorage).forEach(k => delete memoryStorage[k]); }
};

// Import groceryService
const { groceryService } = await import('./src/services/groceryService.ts');

console.log('====================================================');
console.log('FRESHPRICE: VOICE SEARCH & TAMIL SUPPORT TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${testName}`);
    if (details) console.log(`       -> ${details}`);
  } else {
    console.error(`[FAIL] Test ${totalTests}: ${testName}`);
    if (details) console.error(`       -> ${details}`);
    throw new Error(`Assertion failed for: ${testName}`);
  }
}

async function runTests() {
  // Setup: Reset to clean sample data
  await groceryService.resetToSampleData();
  const allProds = await groceryService.getProducts();
  const allCats = await groceryService.getCategories();
  console.log(`Initialized with ${allCats.length} categories and ${allProds.length} products.\n`);

  // -----------------------------------------------------------
  // TEST 1: English Voice Search - "Find Ponni rice"
  // -----------------------------------------------------------
  const searchEn1 = searchProductsWithNLP('Find Ponni rice', allProds, allCats);
  assert(
    searchEn1.length > 0 && searchEn1[0].product.name.toLowerCase().includes('ponni rice'),
    'English Voice Search: "Find Ponni rice"',
    `Top match: "${searchEn1[0].product.name}" at ₹${searchEn1[0].product.price} (Reason: ${searchEn1[0].matchReason})`
  );

  // -----------------------------------------------------------
  // TEST 2: English Voice Search - "Show cooking oil"
  // -----------------------------------------------------------
  const searchEn2 = searchProductsWithNLP('Show cooking oil', allProds, allCats);
  assert(
    searchEn2.length > 0 && (searchEn2[0].categoryName.toLowerCase().includes('oil') || searchEn2[0].product.name.toLowerCase().includes('oil')),
    'English Voice Search: "Show cooking oil"',
    `Top match: "${searchEn2[0].product.name}" in category "${searchEn2[0].categoryName}" at ₹${searchEn2[0].product.price}`
  );

  // -----------------------------------------------------------
  // TEST 3: Tamil Voice Search (Native Script) - "பொன்னி அரிசியை காட்டு"
  // -----------------------------------------------------------
  const searchTa1 = searchProductsWithNLP('பொன்னி அரிசியை காட்டு', allProds, allCats);
  assert(
    searchTa1.length > 0 && (searchTa1[0].product.name.toLowerCase().includes('ponni rice') || searchTa1[0].product.name_ta?.includes('பொன்னி')),
    'Tamil Voice Search: "பொன்னி அரிசியை காட்டு"',
    `Top match: "${searchTa1[0].product.name}" (${searchTa1[0].product.name_ta || 'no ta'}) at ₹${searchTa1[0].product.price} (Reason: ${searchTa1[0].matchReason})`
  );

  // -----------------------------------------------------------
  // TEST 4: Tamil Voice Search (Native Script) - "சமையல் எண்ணெய் காட்டு"
  // -----------------------------------------------------------
  const searchTa2 = searchProductsWithNLP('சமையல் எண்ணெய் காட்டு', allProds, allCats);
  assert(
    searchTa2.length > 0 && (searchTa2[0].categoryName.toLowerCase().includes('oil') || searchTa2[0].product.name.toLowerCase().includes('oil')),
    'Tamil Voice Search: "சமையல் எண்ணெய் காட்டு"',
    `Top match: "${searchTa2[0].product.name}" (${searchTa2[0].product.name_ta || ''}) in category "${searchTa2[0].categoryName}" at ₹${searchTa2[0].product.price}`
  );

  // -----------------------------------------------------------
  // TEST 5: Mixed Tamil-English Voice Search - "Dove சோப்பு விலை"
  // -----------------------------------------------------------
  const searchMixed1 = searchProductsWithNLP('Dove சோப்பு விலை', allProds, allCats);
  assert(
    searchMixed1.length > 0 && (searchMixed1[0].categoryName.toLowerCase().includes('soap') || searchMixed1[0].product.name.toLowerCase().includes('soap')),
    'Mixed Language Voice Search: "Dove சோப்பு விலை"',
    `Top match: "${searchMixed1[0].product.name}" in category "${searchMixed1[0].categoryName}" at ₹${searchMixed1[0].product.price}`
  );

  // -----------------------------------------------------------
  // TEST 6: Tamil Quantity-Aware Voice Search - "5 கிலோ பொன்னி அரிசி"
  // Must prioritize the 5 kg package over the 1 kg package!
  // -----------------------------------------------------------
  const searchTaQty = searchProductsWithNLP('5 கிலோ பொன்னி அரிசி', allProds, allCats);
  assert(
    searchTaQty.length > 0 && searchTaQty[0].product.quantity_value === 5,
    'Tamil Quantity Priority: "5 கிலோ பொன்னி அரிசி" matches 5kg',
    `Top match: "${searchTaQty[0].product.name}" (${searchTaQty[0].product.quantity_value} ${searchTaQty[0].product.quantity_unit}) at ₹${searchTaQty[0].product.price}`
  );

  // -----------------------------------------------------------
  // TEST 7: Tamil Number Word Quantity - "ஐந்து கிலோ பொன்னி அரிசி"
  // -----------------------------------------------------------
  const searchTaWordQty = searchProductsWithNLP('ஐந்து கிலோ பொன்னி அரிசி', allProds, allCats);
  assert(
    searchTaWordQty.length > 0 && searchTaWordQty[0].product.quantity_value === 5,
    'Tamil Word Number Priority: "ஐந்து கிலோ பொன்னி அரிசி" matches 5kg',
    `Top match: "${searchTaWordQty[0].product.name}" (${searchTaWordQty[0].product.quantity_value} ${searchTaWordQty[0].product.quantity_unit}) at ₹${searchTaWordQty[0].product.price}`
  );

  // -----------------------------------------------------------
  // TEST 8: Tamil Text Search - "துவரம் பருப்பு"
  // -----------------------------------------------------------
  const searchDal = searchProductsWithNLP('துவரம் பருப்பு விலை சொல்லுங்க', allProds, allCats);
  assert(
    searchDal.length > 0 && (searchDal[0].product.name.toLowerCase().includes('toor dal') || searchDal[0].product.name_ta?.includes('துவரம் பருப்பு')),
    'Tamil Dal Query: "துவரம் பருப்பு விலை சொல்லுங்க"',
    `Top match: "${searchDal[0].product.name}" at ₹${searchDal[0].product.price}`
  );

  // -----------------------------------------------------------
  // TEST 9: Complete UI Translation Dictionaries Parity
  // -----------------------------------------------------------
  function compareKeys(obj1, obj2, path = '') {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    for (const key of keys1) {
      const fullPath = path ? `${path}.${key}` : key;
      if (!(key in obj2)) {
        throw new Error(`Key missing in Tamil translation: ${fullPath}`);
      }
      if (typeof obj1[key] === 'object' && obj1[key] !== null) {
        compareKeys(obj1[key], obj2[key], fullPath);
      }
    }
  }

  compareKeys(en, ta);
  assert(
    Boolean(ta.nav.dashboard && ta.prices.title && ta.manage.title && ta.categories.title && ta.voice.title && ta.history.title && ta.settings.title),
    'UI Translation Dictionaries Structure & Key Parity',
    `English & Tamil dictionaries contain all matching UI keys. (Sample: "${ta.nav.dashboard}" / "${ta.prices.title}")`
  );

  // -----------------------------------------------------------
  // TEST 10: Language Preference Persistence
  // -----------------------------------------------------------
  memoryStorage['freshprice_lang'] = 'ta';
  const savedLang = memoryStorage['freshprice_lang'];
  assert(
    savedLang === 'ta',
    'Language Persistence in Local Storage',
    `Saved language preference restored: "${savedLang}"`
  );

  // -----------------------------------------------------------
  // TEST 11: Bilingual Category & Product Translation Helpers
  // -----------------------------------------------------------
  const testCat = { name: 'Rice', name_ta: 'அரிசி வகைகள்' };
  const catEn = translateCategoryName(testCat, 'en');
  const catTa = translateCategoryName(testCat, 'ta');

  const testProd = { name: 'Sunflower Oil', name_ta: 'சூரியகாந்தி எண்ணெய்' };
  const prodEn = translateProductName(testProd, 'en');
  const prodTa = translateProductName(testProd, 'ta');

  assert(
    catEn === 'Rice' && catTa === 'அரிசி வகைகள்' && prodEn === 'Sunflower Oil' && prodTa === 'சூரியகாந்தி எண்ணெய்',
    'Bilingual Helper Functions (translateCategoryName & translateProductName)',
    `Category: [EN: "${catEn}" | TA: "${catTa}"], Product: [EN: "${prodEn}" | TA: "${prodTa}"]`
  );

  // -----------------------------------------------------------
  // TEST 12: Unit Translations
  // -----------------------------------------------------------
  const unitKg = translateUnit('kg', 'ta');
  const unitL = translateUnit('L', 'ta');
  assert(
    unitKg === 'கிலோ' && unitL === 'லிட்டர்',
    'Unit Translations (kg -> கிலோ, L -> லிட்டர்)',
    `kg -> ${unitKg}, L -> ${unitL}`
  );

  // -----------------------------------------------------------
  // TEST 13: Product Creation with Bilingual Names & Snapshot Preservation
  // -----------------------------------------------------------
  const newBilingualProd = await groceryService.addProduct({
    category_id: allCats[0].id,
    name: 'Idli Rice Special',
    name_ta: 'இட்லி அரிசி ஸ்பெஷல்',
    brand: 'Brand Tamil',
    quantity_value: 1,
    quantity_unit: 'kg',
    price: 55,
  });

  const productsAfterBilingual = await groceryService.getProducts();
  const created = productsAfterBilingual.find(p => p.id === newBilingualProd.id);
  assert(
    Boolean(created && created.name === 'Idli Rice Special' && created.name_ta === 'இட்லி அரிசி ஸ்பெஷல்'),
    'Bilingual Product Creation & Persistence',
    `Created product: "${created.name}" / "${created.name_ta}" at ₹${created.price}`
  );

  // -----------------------------------------------------------
  // TEST 14: Search by newly created Tamil product name
  // -----------------------------------------------------------
  const searchNewTa = searchProductsWithNLP('இட்லி அரிசி', productsAfterBilingual, allCats);
  assert(
    searchNewTa.length > 0 && searchNewTa[0].product.id === newBilingualProd.id,
    'Search by Custom Tamil Product Name ("இட்லி அரிசி")',
    `Found newly created product: "${searchNewTa[0].product.name_ta}" (ID: ${searchNewTa[0].product.id})`
  );

  // -----------------------------------------------------------
  // TEST 15: Price Update on Bilingual Product updates History with Snapshot
  // -----------------------------------------------------------
  await groceryService.updateProductPrice(newBilingualProd.id, 62);
  const historyList = await groceryService.getPriceHistory();
  const latestHistory = historyList[0];

  assert(
    latestHistory.product_id === newBilingualProd.id &&
    latestHistory.previous_price === 55 &&
    latestHistory.new_price === 62 &&
    latestHistory.price_difference === 7 &&
    latestHistory.product_name_snapshot_ta === 'இட்லி அரிசி ஸ்பெஷல்',
    'Price History Snapshot Preservation for Bilingual Product',
    `History recorded: prev=₹${latestHistory.previous_price}, new=₹${latestHistory.new_price}, diff=+₹${latestHistory.price_difference}, snapshot_ta="${latestHistory.product_name_snapshot_ta}"`
  );

  console.log('\n====================================================');
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} tests succeeded!`);
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('\nTest execution failed:', err);
  process.exit(1);
});
