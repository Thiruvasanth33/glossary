import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { useGrocery } from '../../context/GroceryContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { VoiceSearchEngine, isSpeechRecognitionSupported, searchProductsWithNLP } from '../../services/voiceSearch';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Mic, MicOff, Search, Sparkles, Tag, Edit3, Languages } from 'lucide-react';
import { VoiceSearchResult, Product } from '../../types';
import { QuickPriceModal } from '../products/QuickPriceModal';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const { products, categories, settings } = useGrocery();
  const { language, t, getProductName, getCategoryName } = useTranslation();

  // Selected recognition language follows the website language by default
  const [selectedLang, setSelectedLang] = useState<'en-IN' | 'ta-IN'>(
    language === 'ta' ? 'ta-IN' : 'en-IN'
  );
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<VoiceSearchResult[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  
  // Selected product for quick price edit directly from voice search
  const [productForPriceEdit, setProductForPriceEdit] = useState<Product | null>(null);

  const engineRef = useRef<VoiceSearchEngine | null>(null);

  // Sync default speech recognition language with website language whenever modal opens or website language changes
  useEffect(() => {
    setSelectedLang(language === 'ta' ? 'ta-IN' : 'en-IN');
  }, [language, isOpen]);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
    engineRef.current = new VoiceSearchEngine();

    return () => {
      if (engineRef.current) {
        engineRef.current.stopListening();
      }
    };
  }, []);

  const executeSearch = (text: string) => {
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    const results = searchProductsWithNLP(text, products, categories);
    setSearchResults(results);
    if (results.length > 0) {
      setStatusMessage(t('voice.foundCount', { count: results.length }));
    } else {
      setStatusMessage(t('voice.noMatches'));
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setTranscript(initialQuery);
        executeSearch(initialQuery);
      } else {
        setTranscript('');
        setSearchResults([]);
        setErrorMessage(null);
        setStatusMessage(t('voice.clickToSpeak'));
      }
    } else {
      if (engineRef.current) {
        engineRef.current.stopListening();
      }
      setIsListening(false);
    }
  }, [isOpen, initialQuery, t]);

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

  const sampleCommands = selectedLang === 'ta-IN' ? [
    { label: 'பொன்னி அரிசி காட்டு', query: 'பொன்னி அரிசியை காட்டு' },
    { label: 'சமையல் எண்ணெய் காட்டு', query: 'சமையல் எண்ணெய் காட்டு' },
    { label: 'Dove சோப்பு விலை', query: 'Dove சோப்பு விலை' },
    { label: '5 கிலோ அரிசி', query: '5 கிலோ பொன்னி அரிசி' },
    { label: 'துவரம் பருப்பு விலை', query: 'துவரம் பருப்பு விலை சொல்லுங்க' },
    { label: 'தேங்காய் எண்ணெய் இருக்கா?', query: 'தேங்காய் எண்ணெய் இருக்கா?' },
  ] : [
    { label: 'Find Ponni rice', query: 'Find Ponni rice' },
    { label: 'Show cooking oil', query: 'Show cooking oil' },
    { label: 'Ponni rice 5 kg', query: 'Find five kilogram Ponni Rice' },
    { label: 'Sunflower oil 1 L', query: 'Show sunflower oil one litre' },
    { label: 'Lux soap', query: 'Search Lux soap' },
    { label: 'Wheat flour 1kg', query: 'Show wheat flour 1 kg' },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('voice.modalTitle')}
        subtitle={t('voice.modalSubtitle')}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {/* Language selector & browser support bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('voice.spokenLanguage')}</span>
              </span>
              <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-2xs text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedLang('en-IN')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                    selectedLang === 'en-IN' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English (India)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLang('ta-IN')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                    selectedLang === 'ta-IN' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  தமிழ் (Tamil)
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${isSupported ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isSupported ? t('voice.micReady') : t('voice.textOnly')}</span>
            </div>
          </div>

          {/* Voice Input Core UI */}
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-gradient-to-b from-emerald-50/60 to-white p-6 text-center">
            {/* Pulsing Mic Button */}
            <div className="relative mb-4">
              {isListening && (
                <>
                  <div className="absolute -inset-3 rounded-full bg-emerald-400/30 animate-ping duration-1000" />
                  <div className="absolute -inset-6 rounded-full bg-emerald-300/20 animate-pulse duration-1500" />
                </>
              )}
              <button
                type="button"
                onClick={isListening ? handleStopListening : handleStartListening}
                className={`relative flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all duration-300 focus:outline-none ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-rose-200 scale-110'
                    : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700 hover:scale-105'
                }`}
                title={isListening ? t('voice.clickToStop') : t('voice.clickToSpeak')}
              >
                {isListening ? <MicOff className="h-9 w-9" /> : <Mic className="h-9 w-9" />}
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-800">{statusMessage || t('voice.clickToSpeak')}</p>

            {/* Live Transcript / Search input fallback */}
            <div className="mt-4 w-full max-w-lg">
              <div className="relative">
                <input
                  type="text"
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    executeSearch(e.target.value);
                  }}
                  placeholder={t('voice.inputPlaceholder')}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-12 text-center text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                {transcript && (
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript('');
                      setSearchResults([]);
                      setStatusMessage(t('voice.clickToSpeak'));
                    }}
                    className="absolute right-3 top-3 text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    {t('voice.clear')}
                  </button>
                )}
              </div>
            </div>

            {/* Error banner if permission denied or failure */}
            {errorMessage && (
              <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 max-w-lg">
                {errorMessage}
              </div>
            )}

            {/* Sample voice command chips */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 max-w-xl">
              <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> {t('voice.trySaying')}
              </span>
              {sampleCommands.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setTranscript(sample.query);
                    executeSearch(sample.query);
                  }}
                  className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-emerald-400 hover:text-emerald-700 transition-colors shadow-2xs"
                >
                  "{sample.label}"
                </button>
              ))}
            </div>
          </div>

          {/* Search Results Display */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('voice.searchResults', { count: searchResults.length })}
              </h4>
              {searchResults.length > 0 && (
                <span className="text-xs text-emerald-600 font-medium">{t('voice.livePricesNotice')}</span>
              )}
            </div>

            {searchResults.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-8 text-center text-slate-500">
                <p className="text-sm font-medium">{t('voice.noActiveQuery')}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {t('voice.trySuggest')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {searchResults.map(({ product, categoryName, categoryName_ta, matchReason }) => {
                  const displayProdName = getProductName(product);
                  const displayCategory = language === 'ta' && categoryName_ta ? categoryName_ta : categoryName;

                  return (
                    <div
                      key={product.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-emerald-300 hover:shadow-sm transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                              {displayCategory}
                            </span>
                            <h5 className="font-bold text-slate-900 text-sm">{displayProdName}</h5>
                            {language === 'ta' && product.name !== displayProdName && (
                              <p className="text-[10px] text-slate-400">{product.name}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-0.5">
                              {product.brand ? `${product.brand} • ` : ''}
                              <span className="font-semibold text-slate-700">
                                {product.quantity_value} {product.quantity_unit}
                              </span>
                            </p>
                          </div>

                          {/* Price Badge */}
                          <div className="text-right flex-shrink-0">
                            <span className="text-lg font-extrabold text-emerald-600">
                              {formatCurrency(product.price, settings.currency_symbol)}
                            </span>
                          </div>
                        </div>

                        {matchReason && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md inline-block">
                            <Tag className="w-3 h-3 text-slate-400 inline" />
                            <span>{t('voice.matched')} {matchReason}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(product.last_price_changed_at)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setProductForPriceEdit(product)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 p-1 rounded-md hover:bg-emerald-50 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{t('voice.changePrice')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Embedded Quick Price Modal if user clicks 'Edit Price' in voice results */}
      {productForPriceEdit && (
        <QuickPriceModal
          product={productForPriceEdit}
          isOpen={Boolean(productForPriceEdit)}
          onClose={() => setProductForPriceEdit(null)}
        />
      )}
    </>
  );
};
