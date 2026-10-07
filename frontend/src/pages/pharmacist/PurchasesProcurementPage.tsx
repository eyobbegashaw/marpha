import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { purchaseService, PurchaseOrder } from '../../services/purchaseService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { 
  Truck, 
  PlusCircle, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  FileText, 
  AlertCircle,
  RefreshCw,
  Boxes,
  Send
} from 'lucide-react';

export const PurchasesProcurementPage: React.FC = () => {
  const { t, lang } = useI18n();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Goods Receiving Modal state
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [receivingLines, setReceivingLines] = useState<any[]>([]);
  const [receiveNotes, setReceiveNotes] = useState('');
  const [submittingReceive, setSubmittingReceive] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await purchaseService.getOrders();
      setOrders(res.data.purchaseOrders || []);
    } catch (err) {
      console.error('Failed to load purchase orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openReceiveModal = (po: PurchaseOrder) => {
    setReceivingPO(po);
    const initialLines = (po.items || []).map((it) => ({
      purchaseOrderItemId: it.id,
      productId: it.productId,
      productName: it.productName || 'Medicine',
      quantityReceived: it.quantityOrdered - (it.quantityReceived || 0),
      batchNumber: `BATCH-${Date.now().toString().slice(-4)}`,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      manufactureDate: new Date().toISOString().split('T')[0]
    }));
    setReceivingLines(initialLines);
  };

  const handleExecuteReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPO) return;
    setSubmittingReceive(true);
    setStatusMsg(null);

    try {
      await purchaseService.receiveGoods(receivingPO.id, {
        items: receivingLines.map(l => ({
          purchaseOrderItemId: l.purchaseOrderItemId,
          quantityReceived: Number(l.quantityReceived),
          batchNumber: l.batchNumber,
          expiryDate: l.expiryDate,
          manufactureDate: l.manufactureDate
        })),
        notes: receiveNotes || 'Standard warehouse receiving verification'
      });
      const successText = `Goods successfully received into Warehouse inventory for PO #${receivingPO.poNumber}`;
      setStatusMsg({
        type: 'success',
        text: successText
      });
      toast.success(successText, 'PO Received');
      setReceivingPO(null);
      fetchOrders();
    } catch (err: any) {
      const errorText = err?.response?.data?.message || 'Failed to receive goods';
      setStatusMsg({
        type: 'error',
        text: errorText
      });
      toast.error(errorText, 'Procurement Error');
    } finally {
      setSubmittingReceive(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="neutral">Draft</Badge>;
      case 'SUBMITTED': return <Badge variant="info">Submitted</Badge>;
      case 'APPROVED': return <Badge variant="primary">Approved</Badge>;
      case 'ORDERED': return <Badge variant="warning">Ordered</Badge>;
      case 'PARTIALLY_RECEIVED': return <Badge variant="warning">Partially Received</Badge>;
      case 'RECEIVED': return <Badge variant="success">Fully Received</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-7 h-7 text-primary" />
            {lang === 'am' ? 'የግዥ እና አቅርቦት ማስተባበሪያ' : 'Procurement & Purchase Lifecycle'}
          </h1>
          <p className="text-sm text-slate-600">
            {lang === 'am' 
              ? 'የግዥ ትዕዛዞች፣ የማጽደቅ ሂደት እና የእቃ መቀበያ ወደ መጋዘን' 
              : 'End-to-end procurement order workflow and physical batch receiving into warehouse reserve.'}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchOrders} loading={loading}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-medium">{statusMsg.text}</p>
        </div>
      )}

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-sm">Active & Past Purchase Orders</span>
          <span className="text-xs text-slate-500">{orders.length} total orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">PO Number</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Order Date</th>
                <th className="py-3.5 px-4 text-right">Total Cost</th>
                <th className="py-3.5 px-4 text-center">Lifecycle Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading purchase orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {po.poNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {po.supplierName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs font-mono">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ${Number(po.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(po.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => openReceiveModal(po)}
                        >
                          <Boxes className="w-3.5 h-3.5 mr-1" />
                          Receive Goods
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goods Receiving Modal */}
      <Modal
        isOpen={!!receivingPO}
        onClose={() => setReceivingPO(null)}
        title={`Receive Goods - PO #${receivingPO?.poNumber}`}
      >
        {receivingPO && (
          <form onSubmit={handleExecuteReceive} className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 text-xs">
              <strong>Warehouse Inbound:</strong> Incoming stock will create new batches in the <strong>Warehouse</strong> reserve and update product cost basis.
            </div>

            <div className="space-y-3">
              {receivingLines.map((line, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm">{line.productName}</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Received Qty</label>
                      <input
                        type="number"
                        min={1}
                        value={line.quantityReceived}
                        onChange={(e) => {
                          const updated = [...receivingLines];
                          updated[idx].quantityReceived = e.target.value;
                          setReceivingLines(updated);
                        }}
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-primary font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Batch / Lot #</label>
                      <input
                        type="text"
                        value={line.batchNumber}
                        onChange={(e) => {
                          const updated = [...receivingLines];
                          updated[idx].batchNumber = e.target.value;
                          setReceivingLines(updated);
                        }}
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-primary font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Expiry Date</label>
                      <input
                        type="date"
                        value={line.expiryDate}
                        onChange={(e) => {
                          const updated = [...receivingLines];
                          updated[idx].expiryDate = e.target.value;
                          setReceivingLines(updated);
                        }}
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Inbound Receiving Notes</label>
              <input
                type="text"
                value={receiveNotes}
                onChange={(e) => setReceiveNotes(e.target.value)}
                placeholder="Inspected packaging, cold-chain verified"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setReceivingPO(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submittingReceive}>
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Commit to Warehouse Stock
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
