import React, { useState, useEffect } from 'react';
import { Product, QuantityUnit } from '../../types';
import { Modal } from '../common/Modal';
import { QUANTITY_UNITS } from '../../lib/constants';
import { useGrocery } from '../../context/GroceryContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { Plus } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { categories, addProduct, updateProduct, settings } = useGrocery();
  const { language, t, getCategoryName, getUnitName } = useTranslation();

  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [brand, setBrand] = useState('');
  const [quantityValue, setQuantityValue] = useState<string>('1');
  const [quantityUnit, setQuantityUnit] = useState<QuantityUnit>('kg');
  const [price, setPrice] = useState<string>('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setCategoryId(productToEdit.category_id);
      setName(productToEdit.name);
      setNameTa(productToEdit.name_ta || '');
      setBrand(productToEdit.brand || '');
      setQuantityValue(productToEdit.quantity_value.toString());
      setQuantityUnit(productToEdit.quantity_unit);
      setPrice(productToEdit.price.toString());
      setSku(productToEdit.sku || '');
      setDescription(productToEdit.description || '');
      setErrors({});
    } else {
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setName('');
      setNameTa('');
      setBrand('');
      setQuantityValue('1');
      setQuantityUnit('kg');
      setPrice('');
      setSku('');
      setDescription('');
      setErrors({});
    }
  }, [productToEdit, isOpen, categories]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = language === 'ta' ? 'தயாரிப்பு பெயர் அவசியம்' : 'Product name is required';
    }
    if (!categoryId) {
      errs.categoryId = language === 'ta' ? 'வகை தேர்வு அவசியம்' : 'Category is required';
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      errs.price = language === 'ta' ? 'சரியான பூஜ்ஜியம் அல்லது அதற்கு மேற்பட்ட விலை தேவை' : 'Valid non-negative price is required';
    }
    const numQty = parseFloat(quantityValue);
    if (isNaN(numQty) || numQty <= 0) {
      errs.quantity = language === 'ta' ? 'அளவு பூஜ்ஜியத்தை விட அதிகமாக இருக்க வேண்டும்' : 'Quantity must be greater than 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const parsedPrice = parseFloat(price);
      const parsedQty = parseFloat(quantityValue);

      if (productToEdit) {
        await updateProduct(productToEdit.id, {
          category_id: categoryId,
          name: name.trim(),
          name_ta: nameTa.trim() || undefined,
          brand: brand.trim(),
          quantity_value: parsedQty,
          quantity_unit: quantityUnit,
          price: parsedPrice,
          sku: sku.trim() || undefined,
          description: description.trim() || undefined,
        });
      } else {
        await addProduct({
          category_id: categoryId,
          name: name.trim(),
          name_ta: nameTa.trim() || undefined,
          brand: brand.trim(),
          quantity_value: parsedQty,
          quantity_unit: quantityUnit,
          price: parsedPrice,
          sku: sku.trim() || undefined,
          description: description.trim() || undefined,
        });
      }

      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? t('productModal.editTitle') : t('productModal.addTitle')}
      subtitle={productToEdit ? t('productModal.editSubtitle') : t('productModal.addSubtitle')}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
            {errors.form}
          </div>
        )}

        {/* Category & Brand row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('productModal.category')} <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {getCategoryName(cat)}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-rose-500">{errors.categoryId}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('productModal.brand')}
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Brand A, Tata, Parachute"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Product Names: English and Tamil */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('productModal.nameEn')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ponni Rice, Sunflower Oil"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('productModal.nameTa')}
            </label>
            <input
              type="text"
              value={nameTa}
              onChange={(e) => setNameTa(e.target.value)}
              placeholder="எ.கா. பொன்னி அரிசி, சூரியகாந்தி எண்ணெய்"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
            />
          </div>
        </div>

        {/* Quantity Value & Unit & Price row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('productModal.quantityValue')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              value={quantityValue}
              onChange={(e) => setQuantityValue(e.target.value)}
              placeholder="1"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {errors.quantity && <p className="mt-1 text-xs text-rose-500">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('productModal.quantityUnit')} <span className="text-rose-500">*</span>
            </label>
            <select
              value={quantityUnit}
              onChange={(e) => setQuantityUnit(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
            >
              {QUANTITY_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit} ({getUnitName(unit)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('productModal.sellingPrice')} ({settings.currency_symbol}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold">
                {settings.currency_symbol}
              </div>
              <input
                type="number"
                step="any"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="65"
                className="block w-full rounded-xl border border-slate-300 py-2.5 pl-8 pr-3 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {errors.price && <p className="mt-1 text-xs text-rose-500">{errors.price}</p>}
          </div>
        </div>

        {/* SKU & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('productModal.sku')}
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. RICE-PONNI-1KG"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('productModal.description')}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Aged boiled rice, smooth texture"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              t('common.saving')
            ) : productToEdit ? (
              t('productModal.saveChanges')
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>{t('productModal.createProduct')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
