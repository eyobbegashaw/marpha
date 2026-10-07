import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import { productService, Product } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { salesService } from '../../services/salesService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  Clock,
  Printer,
  Sparkles,
  Zap,
  Building2,
  Receipt,
  AlertTriangle,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  availableShelfStock: number;
}

export const PosTerminalPage: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load locations
    inventoryService.getLocations().then((locs) => {
      setLocations(locs);
      const shelf = locs.find((l) => l.is_sales_point) || locs[0];
      if (shelf) {
        setSelectedLocationId(shelf.id);
        setSelectedBranchId(shelf.branch_id);
      }
    });

    // Auto focus search for fast barcode scanner input
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      productService.getProducts(search.trim()).then(setProducts).catch(console.warn);
    } else {
      productService.getProducts().then((p) => setProducts(p.slice(0, 8))).catch(console.warn);
    }
  }, [search]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: parseFloat(String(product.unit_price || 0)),
            availableShelfStock: 50, // default shelf representation
          },
        ];
      }
    });
    setSearch('');
    searchInputRef.current?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * 0.15;
  const total = Math.max(0, subtotal + tax - discountAmount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const result = await salesService.checkout({
        branchId: selectedBranchId,
        locationId: selectedLocationId,
        discountAmount,
        offlineSyncId: `POS_SYNC_${Date.now()}`,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      setCompletedSale(result);
      setCart([]);
      setDiscountAmount(0);
      toast.success('Sale completed successfully! Receipt generated.', 'Checkout Success');
    } catch (e: any) {
      toast.error(e.message || 'Checkout failed. Please check stock.', 'Checkout Error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top operational bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-surface-border shadow-soft-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary text-white">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary leading-tight">{t('pos.title', 'Fast POS Terminal')}</h1>
            <p className="text-xs text-text-muted">FEFO Batch Prioritization & Live Dispensation</p>
          </div>
        </div>

        {/* Location selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-secondary">Dispense From:</span>
          <select
            value={selectedLocationId}
            onChange={(e) => {
              setSelectedLocationId(e.target.value);
              const match = locations.find((l) => l.id === e.target.value);
              if (match) setSelectedBranchId(match.branch_id);
            }}
            className="px-3 py-1.5 text-xs bg-surface-subtle border border-surface-border rounded-xl font-semibold text-text-primary focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {locations
              .filter((l) => l.location_type === 'SALES_SHELF')
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.code})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Main Terminal Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Search & Fast Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barcode & Search Input */}
          <div className="relative">
            <Barcode className="w-5 h-5 text-text-muted absolute left-3.5 top-3.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Scan barcode or type medicine generic / brand name..."
              className="w-full pl-11 pr-4 py-3 text-sm bg-surface border border-surface-border rounded-2xl shadow-soft-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-text-primary font-medium"
            />
          </div>

          {/* Product Items Table / Grid */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-border shadow-soft-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Available Shelf Inventory
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="p-3.5 rounded-xl border border-surface-border bg-surface-subtle hover:bg-primary-light/40 hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between space-y-2 select-none active:scale-[0.98]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-sm font-bold text-text-primary leading-snug">{prod.generic_name}</h4>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface border border-surface-border text-text-secondary shrink-0">
                        {prod.dosage_form}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">{prod.brand_name} ({prod.strength})</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-surface-border/50">
                    <span className="text-xs font-bold text-primary">
                      {parseFloat(String(prod.unit_price || 0)).toFixed(2)} ETB
                    </span>
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      + Add to Cart
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Cart & Fast Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-soft-sm flex flex-col justify-between min-h-[520px]">
            <div className="space-y-4">
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-text-primary">Dispensary Cart</h3>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-bold">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-16 text-center text-xs text-text-muted space-y-2">
                    <ShoppingCart className="w-10 h-10 text-text-muted mx-auto opacity-40" />
                    <p>{t('pos.cartEmpty', 'Cart is empty. Scan barcode or tap items to dispense.')}</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-text-primary truncate">{item.product.generic_name}</p>
                        <p className="text-[11px] text-text-muted">
                          {item.product.brand_name} • {item.unitPrice.toFixed(2)} ETB
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 bg-surface border border-surface-border rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-1 rounded hover:bg-surface-muted text-text-secondary"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-xs px-1.5 min-w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-1 rounded hover:bg-surface-muted text-text-secondary"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-bold text-sm text-text-primary min-w-16 text-right">
                          {(item.quantity * item.unitPrice).toFixed(2)} ETB
                        </span>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-text-muted hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Financial Summary & Checkout button */}
            <div className="pt-4 border-t border-surface-border space-y-3">
              <div className="space-y-1.5 text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-text-primary">{subtotal.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (15%):</span>
                  <span>{tax.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Discount (ETB):</span>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-20 px-2 py-0.5 text-right bg-surface-subtle border border-surface-border rounded text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-between text-base font-extrabold text-text-primary pt-2 border-t border-surface-border">
                  <span>Total Amount:</span>
                  <span className="text-primary text-xl">{total.toFixed(2)} ETB</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold text-sm shadow-soft-md"
                disabled={cart.length === 0}
                isLoading={isProcessing}
                onClick={handleCheckout}
                icon={<Zap className="w-4 h-4" />}
              >
                {t('btn.checkout', 'Complete Sale & Dispense (FEFO)')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sale Success & Receipt Print Modal */}
      <Modal
        isOpen={!!completedSale}
        onClose={() => setCompletedSale(null)}
        title="Sale Completed Successfully!"
        subtitle={`Invoice #${completedSale?.sale?.invoice_number} • Receipt #${completedSale?.sale?.receipt_number}`}
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCompletedSale(null)}>
              New Transaction
            </Button>
            <Button variant="primary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
              Print Receipt
            </Button>
          </div>
        }
      >
        {completedSale && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Dispensed & Stock Adjusted</p>
                <p className="text-xs">
                  FEFO deduction executed automatically. Unit cost & price snapshots frozen.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border space-y-1">
              <div className="flex justify-between font-semibold text-text-primary">
                <span>Total Received:</span>
                <span className="text-primary font-bold text-sm">{parseFloat(completedSale.sale.total_amount).toFixed(2)} ETB</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Cost of Goods Sold (COGS):</span>
                <span>{parseFloat(completedSale.sale.total_cogs).toFixed(2)} ETB</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Gross Profit Margin:</span>
                <span>{parseFloat(completedSale.sale.gross_profit).toFixed(2)} ETB</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
