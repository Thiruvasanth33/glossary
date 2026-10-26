/**
 * Grocery bilingual dictionary for natural Tamil display and voice search normalization.
 */

export const CATEGORY_TRANSLATIONS: Record<string, string> = {
  'Rice': 'அரிசி வகைகள்',
  'Soap': 'சோப்புகள்',
  'Oil': 'சமையல் எண்ணெய்கள்',
  'Flour': 'மாவு வகைகள்',
  'Pulses and Dal': 'பருப்பு வகைகள்',
  'Sugar and Salt': 'சர்க்கரை மற்றும் உப்பு',
  'Spices and Masala': 'மசாலாப் பொருட்கள்',
  'Snacks and Biscuits': 'சிற்றுண்டி மற்றும் பிஸ்கட்',
  'Beverages': 'பானங்கள்',
  'Other Grocery Items': 'இதர மளிகைப் பொருட்கள்',
  'Household Products': 'வீட்டு உபயோகப் பொருட்கள்',
  'Grains': 'தானியங்கள்',
  'Dairy': 'பால் பொருட்கள்',
};

export const PRODUCT_TRANSLATIONS: Record<string, string> = {
  'Ponni Rice': 'பொன்னி அரிசி',
  'Basmati Rice': 'பாசுமதி அரிசி',
  'Idli Rice': 'இட்லி அரிசி',
  'Boiled Rice': 'புழுங்கல் அரிசி',
  'Raw Rice': 'பச்சரிசி',
  'Sunflower Oil': 'சூரியகாந்தி எண்ணெய்',
  'Coconut Oil': 'தேங்காய் எண்ணெய்',
  'Groundnut Oil': 'கடலை எண்ணெய்',
  'Gingelly Oil': 'நல்லெண்ணெய்',
  'Sesame Oil': 'எள்ளெண்ணெய்',
  'Palm Oil': 'பாமாயில்',
  'Bathing Soap': 'குளியல் சோப்பு',
  'Lux Beauty Soap': 'லக்ஸ் அழகு சோப்பு',
  'Laundry Soap': 'துணி சோப்பு',
  'Dishwashing Soap': 'பாத்திரம் கழுவும் சோப்பு',
  'Wheat Flour': 'கோதுமை மாவு',
  'Rice Flour': 'அரிசி மாவு',
  'Gram Flour': 'கடலை மாவு',
  'Maida': 'மைதா மாவு',
  'Toor Dal': 'துவரம் பருப்பு',
  'Moong Dal': 'பாசிப் பருப்பு',
  'Urad Dal': 'உளுத்தம் பருப்பு',
  'Chana Dal': 'கடலைப் பருப்பு',
  'Iodized Salt': 'அயோடின் கலந்த உப்பு',
  'Crystal Salt': 'கல் உப்பு',
  'Refined Sugar': 'வெள்ளை சர்க்கரை',
  'Brown Sugar': 'நாட்டுச் சர்க்கரை',
  'Red Label Tea': 'ரெட் லேபிள் தேநீர்',
  'Tea Powder': 'தேயிலைத் தூள்',
  'Filter Coffee': 'பில்டர் காபித் தூள்',
};

export const UNIT_TRANSLATIONS: Record<string, string> = {
  'kg': 'கிலோ',
  'g': 'கிராம்',
  'L': 'லிட்டர்',
  'ml': 'மில்லி',
  'Piece': 'துண்டு',
  'Packet': 'பாக்கெட்',
  'Box': 'பெட்டி',
  'Bottle': 'பாட்டில்',
  'Dozen': 'டஜன்',
  'Bundle': 'கட்டு',
  'Tin': 'டின்',
};

/**
 * Returns the translated category name based on language.
 * Checks for explicit category.name_ta first, then glossary dictionary, then original name.
 */
export function translateCategoryName(category: { name: string; name_ta?: string }, lang: 'en' | 'ta'): string {
  if (lang === 'ta') {
    if (category.name_ta && category.name_ta.trim()) {
      return category.name_ta.trim();
    }
    return CATEGORY_TRANSLATIONS[category.name] || category.name;
  }
  return category.name;
}

/**
 * Returns the translated product name based on language.
 * Checks for explicit product.name_ta first, then glossary dictionary, then original name.
 */
export function translateProductName(product: { name: string; name_ta?: string }, lang: 'en' | 'ta'): string {
  if (lang === 'ta') {
    if (product.name_ta && product.name_ta.trim()) {
      return product.name_ta.trim();
    }
    return PRODUCT_TRANSLATIONS[product.name] || product.name;
  }
  return product.name;
}

/**
 * Returns the translated quantity unit based on language.
 */
export function translateUnit(unit: string, lang: 'en' | 'ta'): string {
  if (lang === 'ta') {
    return UNIT_TRANSLATIONS[unit] || unit;
  }
  return unit;
}
