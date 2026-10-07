import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import { salesService } from '../../services/salesService';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Receipt, Calendar, Building2, Eye, Printer, PackageCheck, Activity } from 'lucide-react';

export const CustomerPurchasesPage: React.FC = () => {
  const { t } = useTranslation();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);

  const loadPurchases = async () => {
    setIsLoading(true);
    try {
      const data = await salesService.getMyPurchases();
      setPurchases(data);
    } catch (e) {
      console.error('Failed to load purchases', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const openReceipt = async (id: string) => {
    setIsReceiptLoading(true);
    try {
      const receipt = await salesService.getMyPurchaseById(id);
      setSelectedReceipt(receipt);
    } catch (e) {
      console.error(e);
    } finally {
      setIsReceiptLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          {t('cust.purchasesTitle', 'My Medicine Purchase Receipts')}
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Review past verified medicine purchases, dispensing details, and printable receipts.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-text-muted space-y-2">
          <Activity className="w-8 h-8 text-primary mx-auto animate-spin" />
          <p>Loading your purchase receipts...</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface border border-surface-border text-center space-y-3">
          <Receipt className="w-10 h-10 text-text-muted mx-auto opacity-50" />
          <h3 className="text-base font-semibold text-text-primary">No purchase receipts found</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            When you purchase medicines from any connected pharmacy branch, your verified receipts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-surface border border-surface-border shadow-soft-sm hover:shadow-soft-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-text-primary">Receipt #{p.receipt_number || p.invoice_number}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 flex items-center gap-1">
                    <PackageCheck className="w-3 h-3 text-emerald-600" />
                    Dispensed
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                    {new Date(p.created_at || p.sale_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-text-muted" />
                    {p.branch_name || 'Main Branch'}
                  </span>
                  <span>• {p.total_items} items</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-surface-border">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-text-muted block">Total Paid</span>
                  <span className="text-lg font-extrabold text-primary">
                    {parseFloat(p.total_amount).toFixed(2)} ETB
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  icon={<Eye className="w-4 h-4" />}
                  onClick={() => openReceipt(p.id)}
                  className="rounded-xl text-xs"
                >
                  View Receipt
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title={`Official Receipt #${selectedReceipt?.receipt_number || selectedReceipt?.invoice_number}`}
        subtitle={`Dispensed on ${selectedReceipt?.sale_date ? new Date(selectedReceipt.sale_date).toLocaleDateString() : ''}`}
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(null)}>
              Close
            </Button>
            <Button variant="primary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
              Print Receipt
            </Button>
          </div>
        }
      >
        {isReceiptLoading ? (
          <div className="py-8 text-center text-xs text-text-muted">Loading receipt breakdown...</div>
        ) : selectedReceipt ? (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between">
              <div>
                <p className="font-semibold text-text-primary">{selectedReceipt.branch_name || 'Central Pharmacy'}</p>
                <p className="text-text-muted text-[11px]">Authorized Pharmaceutical Dispensation</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-text-secondary text-xs">{selectedReceipt.invoice_number}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-surface-border rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-surface-subtle border-b border-surface-border text-text-secondary font-semibold text-[11px]">
                  <tr>
                    <th className="p-2.5">Medicine Name</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/60">
                  {selectedReceipt.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-surface-subtle/50">
                      <td className="p-2.5">
                        <p className="font-bold text-text-primary">{item.generic_name}</p>
                        <p className="text-[11px] text-text-muted">
                          {item.brand_name} ({item.strength})
                        </p>
                      </td>
                      <td className="p-2.5 text-center font-medium">{item.quantity}</td>
                      <td className="p-2.5 text-right">{parseFloat(item.unit_price).toFixed(2)} ETB</td>
                      <td className="p-2.5 text-right font-semibold text-text-primary">
                        {parseFloat(item.total_price).toFixed(2)} ETB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-3 bg-surface-subtle rounded-xl border border-surface-border space-y-1.5 text-right">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal:</span>
                <span>{parseFloat(selectedReceipt.subtotal).toFixed(2)} ETB</span>
              </div>
              {parseFloat(selectedReceipt.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-{parseFloat(selectedReceipt.discount_amount).toFixed(2)} ETB</span>
                </div>
              )}
              <div className="flex justify-between text-text-muted">
                <span>Tax (15%):</span>
                <span>{parseFloat(selectedReceipt.tax_amount).toFixed(2)} ETB</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-text-primary pt-1.5 border-t border-surface-border">
                <span>Total Amount Paid:</span>
                <span className="text-primary">{parseFloat(selectedReceipt.total_amount).toFixed(2)} ETB</span>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
