import React, { useState, useEffect, useRef } from 'react';
import { useGrocery } from '../context/GroceryContext';
import { useTranslation } from '../i18n/LanguageContext';
import { VoiceSearchEngine, isSpeechRecognitionSupported, searchProductsWithNLP } from '../services/voiceSearch';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { QuickPriceModal } from '../components/products/QuickPriceModal';
import { Product, VoiceSearchResult } from '../types';
import {
  Mic,
  MicOff,
  Search,
  Sparkles,
  Volume2,
  Tag,
  Edit3,
  Languages,
} from 'lucide-react';

export const VoiceSearchPage: React.FC = () => {
  const { products, categories, settings } = useGrocery();
  const { language, setLanguage, t, getProductName, getCategoryName } = useTranslation();

  const [selectedLang, setSelectedLang] = useState<'en-IN' | 'ta-IN'>(
    language === 'ta' ? 'ta-IN' : 'en-IN'
  );
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [searchResults, setSearchResults] = useState<VoiceSearchResult[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Quick price edit from voice search results
  const [productForPriceEdit, setProductForPriceEdit] = useState<Product | null>(null);

  const engineRef = useRef<VoiceSearchEngine | null>(null);

  // Sync recognition language with website language by default
  useEffect(() => {
    setSelectedLang(language === 'ta' ? 'ta-IN' : 'en-IN');
  }, [language]);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
    engineRef.current = new VoiceSearchEngine();

    return () => {
      if (engineRef.current) {
        engineRef.current.stopListening();
      }
    };
  }, []);

  const executeSearch = (queryText: string) => {
    if (!queryText.trim()) {
      setSearchResults([]);
      return;
    }
    const results = searchProductsWithNLP(queryText, products, categories);
    setSearchResults(results);
    if (results.length > 0) {
      setStatusMessage(t('voice.foundCount', { count: results.length }));
    } else {
      setStatusMessage(t('voice.noMatches'));
    }
  };

  const handleStartListening = () => {
    setErrorMessage(null);
    if (!engineRef.current) {
      setErrorMessage(
        selectedLang === 'ta-IN'
          ? 'குரல் அறிதல் கருவி தயாராக இல்லை.'
          : 'Speech recognition engine is not ready.'
      );
      return;
    }

    setStatusMessage(
      selectedLang === 'ta-IN' ? t('voice.listeningTamil') : t('voice.listeningEnglish')
    );

    const started = engineRef.current.startListening(
      selectedLang,
      (spokenText, isFinal) => {
        setTranscript(spokenText);
        executeSearch(spokenText);
        if (isFinal) {
          setIsListening(false);
        }
      },
      (error) => {
        setIsListening(false);
        setErrorMessage(error);
        setStatusMessage(t('voice.listeningStopped'));
      },
      () => {
        setIsListening(false);
      },
      () => {
        setIsListening(true);
      }
    );

    if (!started) {
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    if (engineRef.current) {
      engineRef.current.stopListening();
    }
    setIsListening(false);
    setStatusMessage(t('voice.listeningPaused'));
  };

  const englishExamples = [
    'Find Ponni rice',
    'Show cooking oil',
    'Find five kilogram Ponni Rice',
    'Show sunflower oil one litre',
    'Search Lux soap',
    'Show wheat flour 1 kg',
    'Find coconut oil',
  ];

  const tamilExamples = [
    'பொன்னி அரிசியை காட்டு',
    'சமையல் எண்ணெய் காட்டு',
    'Dove சோப்பு விலை',
    '5 கிலோ பொன்னி அரிசி',
    'துவரம் பருப்பு விலை சொல்லுங்க',
    'தேங்காய் எண்ணெய் இருக்கா?',
    'கோதுமை மாவு விலை காட்டு',
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Mic className="h-4 w-4" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('voice.title')}</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('voice.subtitle')}
        </p>
      </div>

      {/* Main Voice Center Card */}
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 p-6 sm:p-10 text-center shadow-md shadow-emerald-950/5">
        {/* Language selector controls */}
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white p-1.5 border border-slate-200 shadow-sm text-xs mb-6">
          <Languages className="w-4 h-4 text-emerald-600 ml-2" />
          <span className="font-semibold text-slate-500 mr-1">{t('voice.spokenLanguage')}</span>
          <button
            type="button"
            onClick={() => {
              setSelectedLang('en-IN');
            }}
            className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
              selectedLang === 'en-IN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English (India)
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedLang('ta-IN');
            }}
            className={`rounded-xl px-3 py-1.5 font-bold transition-all font-sans ${
              selectedLang === 'ta-IN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            தமிழ் (Tamil)
          </button>
        </div>

        {/* Large Pulse Voice Trigger Button */}
        <div className="flex justify-center my-4">
          <div className="relative">
            {isListening && (
              <>
                <div className="absolute -inset-4 rounded-full bg-emerald-400/30 animate-ping duration-1000" />
                <div className="absolute -inset-8 rounded-full bg-emerald-300/20 animate-pulse duration-1500" />
              </>
            )}
            <button
              type="button"
              onClick={isListening ? handleStopListening : handleStartListening}
              className={`relative flex h-28 w-28 items-center justify-center rounded-full shadow-2xl transition-all duration-300 focus:outline-none ${
                isListening
                  ? 'bg-rose-500 text-white shadow-rose-300 scale-105'
                  : 'bg-emerald-600 text-white shadow-emerald-400/40 hover:bg-emerald-700 hover:scale-105'
              }`}
              title={isListening ? t('voice.clickToStop') : t('voice.clickToSpeak')}
            >
              {isListening ? <MicOff className="h-12 w-12" /> : <Mic className="h-12 w-12" />}
            </button>
          </div>
        </div>

        {/* Status Text & Visual Waveform Indicator */}
        <h4 className="text-lg font-bold text-slate-900 mt-4">{statusMessage || t('voice.clickToSpeak')}</h4>
        {isListening && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {[40, 70, 30, 90, 50, 80, 45, 65, 35].map((height, i) => (
              <span
                key={i}
                className="w-1 bg-emerald-500 rounded-full animate-pulse"
                style={{ height: `${height * 0.3}px`, animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        )}

        {/* Live Search Input / Recognized speech fallback */}
        <div className="mt-6 max-w-xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                executeSearch(e.target.value);
              }}
              placeholder={t('voice.inputPlaceholder')}
              className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-14 text-center text-sm font-semibold text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
            />
            <Search className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
            {transcript && (
              <button
                type="button"
                onClick={() => {
                  setTranscript('');
                  setSearchResults([]);
                  setStatusMessage(t('voice.clickToSpeak'));
                }}
                className="absolute right-4 top-4 text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                {t('voice.clear')}
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Example Voice Commands */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 text-left">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('voice.trySaying')}</span>
          </h5>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-600 block mb-1.5">{t('voice.tamilCommands')}</span>
              <div className="flex flex-wrap gap-1.5">
                {tamilExamples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setTranscript(ex);
                      setSelectedLang('ta-IN');
                      executeSearch(ex);
                    }}
                    className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 shadow-2xs transition-all font-sans"
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-600 block mb-1.5">{t('voice.englishCommands')}</span>
              <div className="flex flex-wrap gap-1.5">
                {englishExamples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setTranscript(ex);
                      setSelectedLang('en-IN');
                      executeSearch(ex);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:border-emerald-400 hover:text-emerald-700 shadow-2xs transition-all"
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matching Results Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">
            {t('voice.searchResults', { count: searchResults.length })}
          </h3>
          {searchResults.length > 0 && (
            <span className="text-xs font-semibold text-emerald-600">
              {t('voice.livePricesNotice')}
            </span>
          )}
        </div>

        {searchResults.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            <Volume2 className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">{t('voice.noActiveQuery')}</p>
            <p className="text-xs text-slate-400 mt-1">
              {t('voice.noActiveQueryHint')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map(({ product, categoryName, categoryName_ta, matchReason }) => {
              const displayProdName = getProductName(product);
              const displayCategory = language === 'ta' && categoryName_ta ? categoryName_ta : categoryName;

              return (
                <div
                  key={product.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                        {displayCategory}
                      </span>
                      <span className="text-xl font-black text-emerald-600">
                        {formatCurrency(product.price, settings.currency_symbol)}
                      </span>
                    </div>

                    <h4 className="mt-2 text-base font-bold text-slate-900">{displayProdName}</h4>
                    {language === 'ta' && product.name !== displayProdName && (
                      <p className="text-xs text-slate-400">{product.name}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {product.brand ? `${product.brand} • ` : ''}
                      <span className="font-bold text-slate-700">
                        {product.quantity_value} {product.quantity_unit}
                      </span>
                    </p>

                    {matchReason && (
                      <div className="mt-2.5 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500">
                        <Tag className="w-3 h-3 inline mr-1 text-slate-400" />
                        <span>{matchReason}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {formatDateTime(product.last_price_changed_at)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setProductForPriceEdit(product)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t('voice.changePrice')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Embedded Quick Price Modal */}
      {productForPriceEdit && (
        <QuickPriceModal
          product={productForPriceEdit}
          isOpen={Boolean(productForPriceEdit)}
          onClose={() => setProductForPriceEdit(null)}
        />
      )}
    </div>
  );
};
