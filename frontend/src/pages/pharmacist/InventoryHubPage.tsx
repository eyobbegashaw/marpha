import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { inventoryService, InventoryItem } from '../../services/inventoryService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';
import { 
  Package, 
  ArrowRightLeft, 
  SlidersHorizontal, 
  AlertTriangle, 
  History, 
  Search, 
  Warehouse, 
  Store,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export const InventoryHubPage: React.FC = () => {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Transfer Modal
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [transferQty, setTransferQty] = useState<number>(10);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // Adjust Modal
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustLocation, setAdjustLocation] = useState<'SHELF' | 'WAREHOUSE'>('SHELF');
  const [adjustType, setAdjustType] = useState<'CYCLE_COUNT_GAIN' | 'CYCLE_COUNT_LOSS' | 'DAMAGED_EXPIRED_SCRAP'>('CYCLE_COUNT_GAIN');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Feedback Notification
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getOverview();
      setItems(res.data.items || []);
    } catch (err: any) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferItem || transferQty <= 0) return;
    setTransferSubmitting(true);
    setStatusMsg(null);
    try {
      await inventoryService.transferWarehouseToShelf({
        productId: transferItem.productId,
        quantity: transferQty,
        notes: transferNotes || 'Routine shelf refill'
      });
      const successMsg = `Transferred ${transferQty} units of ${transferItem.productName} to Sales Shelf.`;
      setStatusMsg({
        type: 'success',
        text: successMsg
      });
      toast.success(successMsg, 'Stock Transfer');
      setTransferItem(null);
      setTransferQty(10);
      setTransferNotes('');
      fetchInventory();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to execute transfer.';
      setStatusMsg({
        type: 'error',
        text: errorMsg
      });
      toast.error(errorMsg, 'Transfer Error');
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || adjustQty <= 0) return;
    setAdjustSubmitting(true);
    setStatusMsg(null);
    try {
      await inventoryService.adjustStock({
        productId: adjustItem.productId,
        location: adjustLocation,
        adjustmentType: adjustType,
        quantity: adjustQty,
        reason: adjustReason || 'Physical cycle count discrepancy'
      });
      const successMsg = `Adjusted ${adjustItem.productName} (${adjustLocation}) successfully.`;
      setStatusMsg({
        type: 'success',
        text: successMsg
      });
      toast.success(successMsg, 'Stock Adjustment');
      setAdjustItem(null);
      setAdjustQty(1);
      setAdjustReason('');
      fetchInventory();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to adjust stock.';
      setStatusMsg({
        type: 'error',
        text: errorMsg
      });
      toast.error(errorMsg, 'Adjustment Error');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const filteredItems = items.filter(it => {
    const matchesSearch = it.productName.toLowerCase().includes(search.toLowerCase()) ||
                          it.sku.toLowerCase().includes(search.toLowerCase()) ||
                          it.genericName.toLowerCase().includes(search.toLowerCase());
    const matchesLow = filterLowStock ? it.isLowStock : true;
    return matchesSearch && matchesLow;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" />
            {lang === 'am' ? 'የመድኃኒት ክምችትና ሽግግር ማዕከል' : 'Inventory & Physical Refill Hub'}
          </h1>
          <p className="text-sm text-slate-600">
            {lang === 'am' 
              ? 'የሽያጭ መደርደሪያ እና የመጋዘን ክምችት ቁጥጥር እና የውስጥ ሽግግር' 
              : 'Physical segregation between Sales Shelf and Warehouse reserve stocks.'}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchInventory} loading={loading}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          {lang === 'am' ? 'አድስ' : 'Refresh'}
        </Button>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
          <p className="text-sm font-medium">{statusMsg.text}</p>
        </div>
      )}

      {/* Controls & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'am' ? 'በመድኃኒት ስም፣ ጄኔሪክ ወይም SKU ፈልግ...' : 'Search by medicine, generic name, or SKU...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-all ${
              filterLowStock 
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {lang === 'am' ? 'አነስተኛ ክምችት ብቻ' : 'Low Stock Only'}
          </button>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{lang === 'am' ? 'መድኃኒት' : 'Medicine / Generic'}</th>
                <th className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center gap-1 text-teal-700">
                    <Store className="w-3.5 h-3.5" /> {lang === 'am' ? 'የሽያጭ መደርደሪያ' : 'Sales Shelf'}
                  </span>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center gap-1 text-indigo-700">
                    <Warehouse className="w-3.5 h-3.5" /> {lang === 'am' ? 'መጋዘን' : 'Warehouse'}
                  </span>
                </th>
                <th className="py-3.5 px-4 text-center">{lang === 'am' ? 'ድምር ክምችት' : 'Total Units'}</th>
                <th className="py-3.5 px-4 text-center">{lang === 'am' ? 'ሁኔታ' : 'Status'}</th>
                <th className="py-3.5 px-4 text-right">{lang === 'am' ? 'እርምጃዎች' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading inventory records...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No matching inventory items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-xs text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                        <span>{item.genericName}</span>
                        <span className="text-slate-300">•</span>
                        <span>SKU: {item.sku}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md font-bold text-sm ${
                        item.shelfQuantity <= (item.reorderLevel || 10) ? 'bg-amber-100 text-amber-900' : 'bg-teal-50 text-teal-800'
                      }`}>
                        {item.shelfQuantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-md font-semibold text-sm bg-indigo-50 text-indigo-800">
                        {item.warehouseQuantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {item.totalStock}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.isLowStock ? (
                        <Badge variant="warning">{lang === 'am' ? 'አነስተኛ' : 'Low Stock'}</Badge>
                      ) : (
                        <Badge variant="success">{lang === 'am' ? 'በቂ' : 'In Stock'}</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTransferItem(item);
                          setTransferQty(Math.min(20, item.warehouseQuantity || 10));
                        }}
                        disabled={item.warehouseQuantity <= 0}
                        title="Transfer from Warehouse to Shelf"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 mr-1 text-primary" />
                        {lang === 'am' ? 'ወደ መደርደሪያ አንቀሳቅስ' : 'Refill Shelf'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAdjustItem(item)}
                        title="Cycle Count Stock Adjustment"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                        {lang === 'am' ? 'አስተካክል' : 'Adjust'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      <Modal
        isOpen={!!transferItem}
        onClose={() => setTransferItem(null)}
        title={lang === 'am' ? 'ከመጋዘን ወደ ሽያጭ መደርደሪያ ማዘዋወሪያ' : 'Transfer Warehouse Reserve to Shelf'}
      >
        {transferItem && (
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900">{transferItem.productName}</div>
              <div className="text-xs text-slate-600 mt-1 flex justify-between">
                <span>Warehouse Available: <strong>{transferItem.warehouseQuantity} units</strong></span>
                <span>Current Shelf: <strong>{transferItem.shelfQuantity} units</strong></span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {lang === 'am' ? 'የሚዘዋወር ብዛት (Units)' : 'Quantity to Transfer'}
              </label>
              <input
                type="number"
                min={1}
                max={transferItem.warehouseQuantity}
                value={transferQty}
                onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {lang === 'am' ? 'ማስታወሻ / ምክንያት' : 'Transfer Note'}
              </label>
              <input
                type="text"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="e.g. Weekly routine front shelf replenishment"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setTransferItem(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={transferSubmitting}>
                <ArrowRightLeft className="w-4 h-4 mr-1.5" />
                Confirm Transfer
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Adjust Modal */}
      <Modal
        isOpen={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        title={lang === 'am' ? 'የክምችት ማስተካከያ (Cycle Count Adjustment)' : 'Stock Count Discrepancy Adjustment'}
      >
        {adjustItem && (
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
              <strong>Audit Notice:</strong> All physical stock adjustments are recorded in the audit trail and tracked against your user ID.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Target Location</label>
                <select
                  value={adjustLocation}
                  onChange={(e) => setAdjustLocation(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="SHELF">Sales Shelf ({adjustItem.shelfQuantity})</option>
                  <option value="WAREHOUSE">Warehouse Reserve ({adjustItem.warehouseQuantity})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="CYCLE_COUNT_GAIN">+ Count Gain (Found stock)</option>
                  <option value="CYCLE_COUNT_LOSS">- Count Loss (Missing stock)</option>
                  <option value="DAMAGED_EXPIRED_SCRAP">- Damaged / Broken scrap</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Audited Reason</label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Reason for discrepancy (required for audit)"
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setAdjustItem(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" loading={adjustSubmitting}>
                Save Audited Adjustment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
