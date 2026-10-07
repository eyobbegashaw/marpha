import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nContext';
import { useTenantConfig } from '../../theme/TenantThemeProvider';
import { productService, Product } from '../../services/productService';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Search,
  Filter,
  Pill,
  Activity,
  CheckCircle2,
  Info,
  FileText,
  ShieldCheck,
  Phone,
  Send,
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { config } = useTenantConfig();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
  const [prescriptionOnly, setPrescriptionOnly] = useState(false);

  // Selected product detail modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetails, setProductDetails] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await productService.getProducts(search || undefined, selectedCategory || undefined);
      setProducts(data);
    } catch (e) {
      console.error('Failed to fetch products', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    productService.getCategories().then(setCategories).catch(console.warn);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory]);

  const openProductDetail = async (prod: Product) => {
    setSelectedProduct(prod);
    setIsDetailLoading(true);
    try {
      const detailData = await productService.getProductById(prod.id);
      setProductDetails(detailData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (prescriptionOnly && !p.is_prescription_required) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
          {t('nav.catalog', 'Medicine Information Catalog')}
        </h1>
        <p className="text-sm text-text-secondary max-w-3xl">
          Search and browse verified clinical details, active ingredients, dosage forms, and imagery for prescription and over-the-counter medications.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-surface-border shadow-soft-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchParams((prev) => {
                  if (e.target.value) prev.set('search', e.target.value);
                  else prev.delete('search');
                  return prev;
                });
              }}
              placeholder="Search by generic name, brand, or active ingredient..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-surface-subtle border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSearchParams((prev) => {
                  if (e.target.value) prev.set('categoryId', e.target.value);
                  else prev.delete('categoryId');
                  return prev;
                });
              }}
              className="w-full px-3 py-2 rounded-xl text-sm bg-surface-subtle border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            >
              <option value="">All Therapeutic Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === 'am' && c.name_am ? c.name_am : c.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Prescription Filter Toggle */}
          <div className="sm:col-span-2 flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-secondary select-none">
              <input
                type="checkbox"
                checked={prescriptionOnly}
                onChange={(e) => setPrescriptionOnly(e.target.checked)}
                className="rounded border-surface-border text-primary focus:ring-primary"
              />
              <span>Rx Required Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-text-muted space-y-3">
          <Activity className="w-8 h-8 text-primary mx-auto animate-spin" />
          <p className="text-sm">Loading verified medicine information...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-surface border border-surface-border space-y-2">
          <Pill className="w-10 h-10 text-text-muted mx-auto" />
          <h4 className="text-base font-bold text-text-primary">No medicines found</h4>
          <p className="text-xs text-text-muted">Try adjusting your search criteria or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="p-5 rounded-2xl bg-surface border border-surface-border shadow-soft-sm hover:shadow-soft-md hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-xl bg-primary-light text-primary">
                    <Pill className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary">
                    {prod.dosage_form} • {prod.strength}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-text-primary leading-snug">{prod.generic_name}</h3>
                  <p className="text-xs text-text-muted">{prod.brand_name || 'Generic Formulation'}</p>
                </div>

                {prod.category_name && (
                  <span className="inline-block text-[11px] text-text-secondary bg-surface-subtle px-2 py-0.5 rounded border border-surface-border">
                    {language === 'am' && prod.category_name_am ? prod.category_name_am : prod.category_name}
                  </span>
                )}
              </div>

              {/* Card Footer: View Medicine Info without price */}
              <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between">
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Verified Medicine
                </span>

                <Button size="sm" variant="outline" onClick={() => openProductDetail(prod)} className="text-xs rounded-xl">
                  {t('btn.viewDetails', 'Medicine Info')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal (Medicine Information with Image, without Price/Stock/Shelf) */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => {
          setSelectedProduct(null);
          setProductDetails(null);
        }}
        title="Medicine Information"
        subtitle={`${selectedProduct?.generic_name} (${selectedProduct?.strength || ''})`}
        maxWidth="2xl"
      >
        {isDetailLoading ? (
          <div className="py-12 text-center text-xs text-text-muted space-y-2">
            <Activity className="w-6 h-6 text-primary mx-auto animate-spin" />
            <p>Fetching clinical specifications & medicine details...</p>
          </div>
        ) : selectedProduct ? (
          <div className="space-y-6">
            {/* Medicine Image & Identity Banner */}
            <div className="flex flex-col sm:flex-row gap-5 items-start bg-surface-subtle p-4 rounded-2xl border border-surface-border">
              <div className="w-full sm:w-44 h-40 rounded-xl overflow-hidden border border-surface-border bg-surface shrink-0 group">
                <img
                  src={
                    (selectedProduct as any).image_url ||
                    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={selectedProduct.generic_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {selectedProduct.dosage_form} • {selectedProduct.strength}
                  </span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified Formulation
                  </span>
                </div>

                <h3 className="text-xl font-bold text-text-primary leading-tight">
                  {selectedProduct.generic_name}
                </h3>
                <p className="text-sm font-semibold text-text-secondary">
                  Brand Name: {selectedProduct.brand_name || 'Standard Dispensation'}
                </p>

                {selectedProduct.category_name && (
                  <p className="text-xs text-text-muted">
                    Therapeutic Category:{' '}
                    <span className="font-semibold text-text-secondary">
                      {language === 'am' && selectedProduct.category_name_am
                        ? selectedProduct.category_name_am
                        : selectedProduct.category_name}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Clinical & Safety Information (No Price, No Stock, No Shelf) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Clinical & Usage Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1">
                  <span className="font-bold text-text-primary block flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-primary" /> Active Ingredient (API):
                  </span>
                  <p className="text-text-secondary">
                    {selectedProduct.generic_name} ({selectedProduct.strength})
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1">
                  <span className="font-bold text-text-primary block flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" /> Primary Indications:
                  </span>
                  <p className="text-text-secondary">
                    {productDetails?.medicalInfo?.indications ||
                      'Treatment and management as directed by licensed healthcare practitioners.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1">
                  <span className="font-bold text-text-primary block flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-primary" /> Administration Guidelines:
                  </span>
                  <p className="text-text-secondary">
                    Take as prescribed by your physician or consult our clinical pharmacists.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1">
                  <span className="font-bold text-text-primary block flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Precautions & Storage:
                  </span>
                  <p className="text-text-secondary">
                    {productDetails?.medicalInfo?.side_effects ||
                      'Store below 25°C in a dry place protected from direct sunlight. Keep out of reach of children.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Consult Pharmacist Support Bar */}
            <div className="p-4 rounded-xl bg-primary-light/40 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-text-primary block">Questions about this medicine?</span>
                <span className="text-text-secondary">Speak directly with our on-duty licensed clinical pharmacists.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`tel:${config?.content?.support_phone || '+251911234567'}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-surface-border hover:border-primary text-xs font-semibold text-text-primary transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>Call Pharmacist</span>
                </a>
                <a
                  href={`https://t.me/${(config?.content?.telegram || '@AbuCentralPharmacy').replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
