import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGrocery } from '../context/GroceryContext';
import { useTranslation } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Category } from '../types';
import { Modal } from '../components/common/Modal';
import {
  FolderTree,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Package,
  ArrowRight,
  AlertTriangle,
  Lock,
  ShieldAlert,
} from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories, products, addCategory, updateCategory, deleteCategory, reorderCategories } = useGrocery();
  const { language, t, getCategoryName } = useTranslation();
  const { isOwner, openLoginModal } = useAuth();

  // Add / Edit Category Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categoryNameTaInput, setCategoryNameTaInput] = useState('');
  const [categoryOrderInput, setCategoryOrderInput] = useState<number>(0);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Category Protection state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignTargetCatId, setReassignTargetCatId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate product counts per category
  const productCountMap = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((c) => map.set(c.id, 0));
    products.forEach((p) => {
      const current = map.get(p.category_id) || 0;
      map.set(p.category_id, current + 1);
    });
    return map;
  }, [categories, products]);

  // Open Edit Modal
  const openEditModal = (cat: Category) => {
    if (!isOwner) {
      openLoginModal();
      return;
    }
    setCategoryToEdit(cat);
    setCategoryNameInput(cat.name);
    setCategoryNameTaInput(cat.name_ta || '');
    setCategoryOrderInput(cat.display_order);
    setModalError(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      openLoginModal();
      return;
    }
    const name = categoryNameInput.trim();
    if (!name) {
      setModalError(language === 'ta' ? 'வகையின் பெயர் காலியாக இருக்கக்கூடாது.' : 'Category name cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);

      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, {
          name,
          name_ta: categoryNameTaInput.trim() || undefined,
          display_order: categoryOrderInput,
        });
        setCategoryToEdit(null);
      } else {
        const newCat = await addCategory(name, categoryOrderInput || undefined);
        if (categoryNameTaInput.trim()) {
          await updateCategory(newCat.id, { name_ta: categoryNameTaInput.trim() });
        }
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move Category Up or Down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (!isOwner) {
      openLoginModal();
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const copy = [...categories];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const reorderedIds = copy.map((c) => c.id);
    await reorderCategories(reorderedIds);
  };

  // Open Delete Safety Dialog
  const openDeleteDialog = (cat: Category) => {
    if (!isOwner) {
      openLoginModal();
      return;
    }
    setCategoryToDelete(cat);
    const candidate = categories.find((c) => c.id !== cat.id);
    setReassignTargetCatId(candidate ? candidate.id : '');
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    const count = productCountMap.get(categoryToDelete.id) || 0;

    if (count > 0 && !reassignTargetCatId) {
      setModalError(language === 'ta' ? 'தயவுசெய்து மற்றொரு வகையைத் தேர்ந்தெடுக்கவும்.' : 'Please choose a destination category to reassign existing products.');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteCategory(categoryToDelete.id, count > 0 ? reassignTargetCatId : undefined);
      setCategoryToDelete(null);
    } catch {
      // handled in context
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <FolderTree className="h-4 w-4" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('categories.title')}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('categories.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isOwner) {
              openLoginModal();
              return;
            }
            setCategoryNameInput('');
            setCategoryNameTaInput('');
            setCategoryOrderInput(categories.length + 1);
            setModalError(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors self-start sm:self-auto font-sans"
        >
          <Plus className="h-4 w-4" />
          <span>{t('categories.addCategory')}</span>
        </button>
      </div>

      {/* Viewer Warning Banner if not logged in as Owner */}
      {!isOwner && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 flex-shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 font-sans">
                {language === 'ta' ? 'பார்வையாளர் முறை (வாசிப்பு மட்டும்)' : 'Viewer Mode (Read-Only)'}
              </h4>
              <p className="text-xs text-amber-700 font-sans mt-0.5">
                {language === 'ta'
                  ? 'வகைகளைச் சேர்க்க, திருத்த அல்லது வரிசைப்படுத்த கடை உரிமையாளராக உள்நுழையவும்.'
                  : 'To add, edit, or reorder categories, please unlock Shop Owner mode.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openLoginModal}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors flex-shrink-0 font-sans"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>{language === 'ta' ? 'உரிமையாளராக உள்நுழை' : 'Unlock Owner Access'}</span>
          </button>
        </div>
      )}

      {/* Categories List Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {categories.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FolderTree className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h4 className="text-base font-bold text-slate-800">{t('categories.noCategories')}</h4>
            <p className="text-xs text-slate-400 mt-1">{t('categories.noCategoriesHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-3.5 w-20 text-center">{t('categories.order')}</th>
                  <th scope="col" className="px-6 py-3.5">{t('categories.categoryName')}</th>
                  <th scope="col" className="px-6 py-3.5">{t('categories.assignedProducts')}</th>
                  <th scope="col" className="px-6 py-3.5 text-right">{t('categories.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {categories.map((cat, index) => {
                  const prodCount = productCountMap.get(cat.id) || 0;
                  const isFirst = index === 0;
                  const isLast = index === categories.length - 1;
                  const displayCatName = getCategoryName(cat);

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Order and Up/Down Reordering Buttons */}
                      <td className="px-6 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <span className="w-6 text-xs font-bold text-slate-500">{index + 1}</span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(index, 'up')}
                              disabled={isFirst}
                              className="rounded p-0.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                              title={t('categories.moveUp')}
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(index, 'down')}
                              disabled={isLast}
                              className="rounded p-0.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                              title={t('categories.moveDown')}
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900 text-base font-sans">{displayCatName}</div>
                        {language === 'ta' && cat.name !== displayCatName && (
                          <div className="text-xs text-slate-400">{cat.name}</div>
                        )}
                        {language === 'en' && cat.name_ta && (
                          <div className="text-xs text-slate-400">{cat.name_ta}</div>
                        )}
                      </td>

                      {/* Product Count & Jump */}
                      <td className="px-6 py-3.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/prices?category=${encodeURIComponent(cat.id)}`)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
                        >
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t('dashboard.productsCount', { count: prodCount })}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{t('categories.rename')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteDialog(cat)}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t('categories.delete')}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isAddModalOpen || Boolean(categoryToEdit)}
        onClose={() => {
          setIsAddModalOpen(false);
          setCategoryToEdit(null);
        }}
        title={categoryToEdit ? t('categories.editCategory') : t('categories.addCategory')}
        subtitle={t('categories.categorySubtitle')}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          {modalError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('categories.nameLabel')} (English) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={categoryNameInput}
              onChange={(e) => setCategoryNameInput(e.target.value)}
              placeholder="e.g. Organic Millet, Cold Pressed Oils"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('categories.nameLabel')} (தமிழ் - விருப்பத்தேர்வு)
            </label>
            <input
              type="text"
              value={categoryNameTaInput}
              onChange={(e) => setCategoryNameTaInput(e.target.value)}
              placeholder="எ.கா. சிறுதானியங்கள், மரச்செக்கு எண்ணெய்"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('categories.displayOrderPriority')}
            </label>
            <input
              type="number"
              min="1"
              value={categoryOrderInput}
              onChange={(e) => setCategoryOrderInput(parseInt(e.target.value) || 0)}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {t('categories.displayOrderHint')}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setCategoryToEdit(null);
              }}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              {isSubmitting ? t('common.saving') : categoryToEdit ? t('categories.saveChanges') : t('categories.createCategory')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Safety & Reassignment Modal */}
      {categoryToDelete && (
        <Modal
          isOpen={Boolean(categoryToDelete)}
          onClose={() => setCategoryToDelete(null)}
          title={t('categories.deleteCategoryTitle')}
          subtitle={`Are you sure you want to remove "${getCategoryName(categoryToDelete)}"?`}
          maxWidth="md"
        >
          <div className="space-y-4">
            {(productCountMap.get(categoryToDelete.id) || 0) > 0 ? (
              <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-amber-900 text-sm font-sans">
                      {t('categories.deleteContainsProducts', { count: productCountMap.get(categoryToDelete.id) || 0 })}
                    </h5>
                    <p className="text-xs text-amber-800 mt-1">
                      {t('categories.reassignWarning', { name: getCategoryName(categoryToDelete) })}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                    {t('categories.reassignTo')}
                  </label>
                  <select
                    value={reassignTargetCatId}
                    onChange={(e) => setReassignTargetCatId(e.target.value)}
                    className="w-full rounded-xl border border-amber-300 bg-white py-2 px-3 text-sm font-semibold text-slate-800 font-sans"
                  >
                    {categories
                      .filter((c) => c.id !== categoryToDelete.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {getCategoryName(c)}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                {language === 'ta'
                  ? 'இவ்வகையில் 0 பொருட்கள் உள்ளன, இதை பாதுகாப்பாக நீக்கலாம்.'
                  : 'This category contains 0 products and can be safely deleted.'}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting || ((productCountMap.get(categoryToDelete.id) || 0) > 0 && !reassignTargetCatId)}
                className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? t('common.deleting') : t('categories.confirmDelete')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
