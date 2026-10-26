import { Product, Category, VoiceSearchResult } from '../types/index.ts';
import { CATEGORY_TRANSLATIONS, PRODUCT_TRANSLATIONS, UNIT_TRANSLATIONS } from '../i18n/groceryGlossary.ts';

// Web Speech API interface declarations for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export class VoiceSearchEngine {
  private recognition: any = null;
  private isListening = false;

  public getIsListening(): boolean {
    return this.isListening;
  }

  public startListening(
    lang: 'en-IN' | 'ta-IN' | 'en-US',
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void,
    onStart?: () => void
  ): boolean {
    if (!isSpeechRecognitionSupported()) {
      const msg = lang === 'ta-IN'
        ? 'உங்கள் உலாவியில் குரல் அறிதல் ஆதரிக்கப்படவில்லை. Chrome, Edge அல்லது Android உலாவியைப் பயன்படுத்தவும்.'
        : 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or a supported Android browser.';
      onError(msg);
      return false;
    }

    // Stop and clean up any existing session
    this.stopListening();

    try {
      const win = window as unknown as IWindow;
      const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      
      // Create a fresh instance for every session to avoid browser state corruption
      this.recognition = new SpeechClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      this.recognition.lang = lang;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (onStart) onStart();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const transcript = (finalTranscript || interimTranscript).trim();
        if (transcript) {
          onResult(transcript, Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        if (event.error === 'aborted') {
          // User aborted or navigated away, quiet stop
          return;
        }

        let message = 'Speech recognition error occurred.';
        if (event.error === 'not-allowed') {
          message = lang === 'ta-IN'
            ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்புகளில் அனுமதியை இயக்கவும்.'
            : 'Microphone access was denied. Please allow microphone permissions in your browser settings.';
        } else if (event.error === 'no-speech') {
          message = lang === 'ta-IN'
            ? 'பேச்சு எதுவும் கேட்கவில்லை. மைக்ரோஃபோனுக்கு அருகில் தெளிவாகப் பேசவும்.'
            : 'No speech was detected. Please try speaking again closer to the microphone.';
        } else if (event.error === 'network') {
          message = lang === 'ta-IN'
            ? 'குரல் அறிதலில் பிணையப் பிழை. இணைய இணைப்பைச் சரிபார்க்கவும்.'
            : 'Network error occurred during speech recognition. Please check your connection.';
        } else if (event.error === 'audio-capture') {
          message = lang === 'ta-IN'
            ? 'மைக்ரோஃபோன் சாதனம் கண்டறியப்படவில்லை.'
            : 'No microphone was found on your device.';
        }
        onError(message);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.recognition = null;
        onEnd();
      };

      this.recognition.start();
      return true;
    } catch (e: any) {
      this.isListening = false;
      this.recognition = null;
      onError(e?.message || 'Failed to start microphone session.');
      return false;
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        try {
          this.recognition.stop();
        } catch {
          // ignore
        }
      }
      this.recognition = null;
    }
    this.isListening = false;
  }
}

/**
 * Normalizes Tamil words by stripping accusative and case suffixes
 * e.g., 'அரிசியை' -> 'அரிசி', 'எண்ணெயை' -> 'எண்ணெய்', 'சோப்பை' -> 'சோப்பு'
 */
function normalizeTamilToken(word: string): string {
  let cleaned = word.trim();
  // Strip common Tamil case suffixes
  cleaned = cleaned.replace(/(யை|ஐ|க்கு|இல்|உடைய|ஆல்|கள்)$/, '');
  return cleaned;
}

/**
 * Intelligent NLP grocery search matching algorithm.
 * Handles English, Tamil (Script), and Tanglish phrases.
 */
export function searchProductsWithNLP(
  query: string,
  products: Product[],
  categories: Category[]
): VoiceSearchResult[] {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return [];

  // Tamil & English stopwords / action verbs removal
  const actionFillers = [
    // Tamil script fillers
    'காட்டு', 'காட்டுங்க', 'சொல்லு', 'சொல்லுங்க', 'விலை', 'வில',
    'இருக்கா', 'இருக்கிறதா', 'இருக்கா?', 'வேண்டுமா', 'வேண்டும்',
    'எடு', 'தேடு', 'போடு', 'பார்க்கலாம்', 'தயவுசெய்து', 'எல்லாம்',
    // Tanglish / Transliterated fillers
    'kaattunga', 'kattunga', 'kaattu', 'kattu',
    'sollunga', 'solunga', 'sollu', 'sol',
    'vilai', 'vila', 'price',
    'irukka', 'iruka', 'kudukka', 'kudu',
    'ennaku', 'enakku', 'oru', 'paarpom',
    // English fillers
    'please', 'show', 'find', 'search', 'get', 'give',
    'all', 'ellam', 'the', 'in', 'category', 'item', 'items', 'products'
  ];

  // Number words mapping (English & Tamil)
  const numberWords: Record<string, number> = {
    // English
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'twenty': 20, 'twenty five': 25, 'half': 0.5, 'quarter': 0.25,
    // Tamil Script
    'ஒரு': 1, 'ஒன்று': 1, 'இரண்டு': 2, 'ரெண்டு': 2, 'மூன்று': 3,
    'நான்கு': 4, 'ஐந்து': 5, 'அஞ்சு': 5, 'பத்து': 10, 'இருபது': 20,
    'அரை': 0.5, 'கால்': 0.25,
    // Tanglish
    'oru': 1, 'ondru': 1, 'irandu': 2, 'rendu': 2, 'moondru': 3,
    'naangu': 4, 'aindhu': 5, 'anchu': 5, 'patthu': 10,
    'arai': 0.5, 'kaal': 0.25,
  };

  // Unit aliases (English, Tamil Script, and Tanglish)
  const unitAliases: Record<string, string> = {
    // English
    'kilo': 'kg', 'kilogram': 'kg', 'kg': 'kg', 'kilos': 'kg',
    'litre': 'L', 'liter': 'L', 'litru': 'L', 'liters': 'L', 'l': 'L',
    'gram': 'g', 'grams': 'g', 'g': 'g', 'gm': 'g',
    'milli': 'ml', 'millilitre': 'ml', 'milliliter': 'ml', 'ml': 'ml',
    'packet': 'Packet', 'pkt': 'Packet', 'pack': 'Packet',
    'bottle': 'Bottle', 'bot': 'Bottle',
    'piece': 'Piece', 'pcs': 'Piece', 'pc': 'Piece',
    // Tamil Script
    'கிலோ': 'kg', 'கிலோகிராம்': 'kg', 'கிலோஸ்': 'kg',
    'லிட்டர்': 'L', 'லிட்': 'L',
    'கிராம்': 'g',
    'மில்லி': 'ml',
    'பாக்கெட்': 'Packet',
    'துண்டு': 'Piece', 'பீஸ்': 'Piece',
  };

  // Category name map
  const catMap = new Map(categories.map(c => [c.id, c]));

  // Detect explicit quantity request, e.g. "5 kg", "five kilogram", "5 கிலோ", "1 லிட்டர்"
  let targetQuantityValue: number | null = null;
  let targetQuantityUnit: string | null = null;

  // 1. Check word numbers + units: e.g. "ஐந்து கிலோ", "five kilogram"
  for (const [word, num] of Object.entries(numberWords)) {
    const pattern = `(?:^|\\s)${word}\\s+(kilo|kilogram|kg|litre|liter|litru|l|gram|gm|g|ml|கிலோ|கிலோகிராம்|லிட்டர்|கிராம்|மில்லி)(?:\\s|$)`;
    const regex = new RegExp(pattern, 'i');
    const match = cleanQuery.match(regex);
    if (match) {
      targetQuantityValue = num;
      const unitKey = match[1].toLowerCase();
      targetQuantityUnit = unitAliases[unitKey] || unitKey;
      break;
    }
  }

  // 2. Check numeric digits: e.g. "5kg", "5 kg", "5 கிலோ", "1 L"
  if (targetQuantityValue === null) {
    const digitMatch = cleanQuery.match(/\b(\d+(?:\.\d+)?)\s*(kg|kilo|kilogram|l|litre|liter|litru|g|gram|gm|ml|piece|packet|கிலோ|கிலோகிராம்|லிட்டர்|கிராம்|மில்லி)\b/i);
    if (digitMatch) {
      targetQuantityValue = parseFloat(digitMatch[1]);
      const unitKey = digitMatch[2].toLowerCase();
      targetQuantityUnit = unitAliases[unitKey] || unitKey;
    }
  }

  // Strip action words and punctuation to get search tokens
  const queryWords = cleanQuery
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'–—]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && !actionFillers.includes(w));

  const results: VoiceSearchResult[] = [];

  for (const product of products) {
    const category = catMap.get(product.category_id);
    const categoryName = category?.name || 'General';
    const categoryName_ta = category?.name_ta || CATEGORY_TRANSLATIONS[categoryName] || categoryName;

    const prodNameEn = (product.name || '').toLowerCase();
    const prodNameTa = (product.name_ta || PRODUCT_TRANSLATIONS[product.name] || '').toLowerCase();
    const prodBrandEn = (product.brand || '').toLowerCase();
    const prodBrandTa = (product.brand_ta || '').toLowerCase();
    const catNameEn = categoryName.toLowerCase();
    const catNameTa = categoryName_ta.toLowerCase();

    let score = 0;
    const matchReasons: string[] = [];

    const fullText = `${prodNameEn} ${prodNameTa} ${prodBrandEn} ${prodBrandTa} ${catNameEn} ${catNameTa} ${product.quantity_value} ${product.quantity_unit}`.toLowerCase();

    // 1. Direct query match
    if (fullText.includes(cleanQuery)) {
      score += 100;
      matchReasons.push('Full query match');
    }

    // 2. Exact product name match (English or Tamil)
    if (
      cleanQuery.includes(prodNameEn) || prodNameEn.includes(cleanQuery) ||
      (prodNameTa && (cleanQuery.includes(prodNameTa) || prodNameTa.includes(cleanQuery)))
    ) {
      score += 85;
      matchReasons.push('Product name match');
    }

    // 3. Category match (English or Tamil)
    if (cleanQuery.includes(catNameEn) || (catNameTa && cleanQuery.includes(catNameTa))) {
      score += 45;
      matchReasons.push(`Category: ${categoryName}`);
    }

    // 4. Brand match (English or Tamil)
    if (
      (prodBrandEn && cleanQuery.includes(prodBrandEn)) ||
      (prodBrandTa && cleanQuery.includes(prodBrandTa))
    ) {
      score += 40;
      matchReasons.push(`Brand: ${product.brand}`);
    }

    // 5. Quantity match boost (Prioritizes exact package size match!)
    if (targetQuantityValue !== null) {
      if (product.quantity_value === targetQuantityValue) {
        score += 55;
        matchReasons.push(`Exact size: ${targetQuantityValue} ${product.quantity_unit}`);
      }
      if (targetQuantityUnit && product.quantity_unit.toLowerCase() === targetQuantityUnit.toLowerCase()) {
        score += 25;
      }
    }

    // 6. Token-by-token matching with Tamil normalization
    let tokenMatches = 0;
    for (const rawToken of queryWords) {
      const token = normalizeTamilToken(rawToken);
      if (!token) continue;

      if (prodNameEn.includes(token) || (prodNameTa && prodNameTa.includes(token))) {
        score += 25;
        tokenMatches++;
      } else if (prodBrandEn.includes(token) || (prodBrandTa && prodBrandTa.includes(token))) {
        score += 20;
        tokenMatches++;
      } else if (catNameEn.includes(token) || (catNameTa && catNameTa.includes(token))) {
        score += 20;
        tokenMatches++;
      }
    }

    if (tokenMatches > 0 && matchReasons.length === 0) {
      matchReasons.push('Keyword match');
    }

    if (score > 10) {
      results.push({
        product,
        categoryName,
        categoryName_ta,
        matchScore: score,
        matchReason: matchReasons.join(', '),
      });
    }
  }

  // Sort by match score descending (highest relevance first)
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
