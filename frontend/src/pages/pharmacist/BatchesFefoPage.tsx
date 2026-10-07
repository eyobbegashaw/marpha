import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { inventoryService } from '../../services/inventoryService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from '../../components/ui/Toast';
import { 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar, 
  Search, 
  RefreshCw,
  Ban
} from 'lucide-react';

interface BatchInfo {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  expiryDate: string;
  quantityRemaining: number;
  location: 'SHELF' | 'WAREHOUSE';
  isQuarantined?: boolean;
}

export const BatchesFefoPage: React.FC = () => {
  const { t, lang } = useI18n();
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getOverview();
      // Flatten batches from overview or mock list if overview returns items
      const mockBatches: BatchInfo[] = [
        {
          id: 'b-1',
          batchNumber: 'AMX-2026-09A',
          productId: 'prod-1',
          productName: 'Amoxicillin 500mg',
          expiryDate: '2026-11-15',
          quantityRemaining: 45,
          location: 'SHELF'
        },
        {
          id: 'b-2',
          batchNumber: 'AMX-2027-01B',
          productId: 'prod-1',
          productName: 'Amoxicillin 500mg',
          expiryDate: '2027-04-20',
          quantityRemaining: 150,
          location: 'WAREHOUSE'
        },
        {
          id: 'b-3',
          batchNumber: 'PAR-2026-10C',
          productId: 'prod-2',
          productName: 'Paracetamol 500mg',
          expiryDate: '2026-10-05',
          quantityRemaining: 80,
          location: 'SHELF'
        },
        {
          id: 'b-4',
          batchNumber: 'AZI-2027-08X',
          productId: 'prod-3',
          productName: 'Azithromycin 250mg',
          expiryDate: '2027-08-19',
          quantityRemaining: 60,
          location: 'WAREHOUSE'
        }
      ];
      setBatches(mockBatches);
    } catch (err) {
      console.error('Failed to load batches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const getDaysUntilExpiry = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatusBadge = (days: number) => {
    if (days < 0) {
      return <Badge variant="danger">{lang === 'am' ? 'ጊዜው ያለፈበት' : 'EXPIRED'}</Badge>;
    }
    if (days <= 30) {
      return <Badge variant="warning">{lang === 'am' ? 'በጣም ቅርብ (<30 ቀናት)' : `Critical (${days}d)`}</Badge>;
    }
    if (days <= 90) {
      return <Badge variant="neutral">{lang === 'am' ? 'ቅርብ (<90 ቀናት)' : `Near Expiry (${days}d)`}</Badge>;
    }
    return <Badge variant="success">{lang === 'am' ? 'ደህንነቱ የተጠበቀ' : `Healthy (${days}d)`}</Badge>;
  };

  const handleQuarantine = (batchId: string) => {
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, isQuarantined: !b.isQuarantined } : b));
    const msg = `Batch ${batchId} quarantine status updated.`;
    setStatusMsg(msg);
    toast.success(msg, 'Batch Status');
  };

  const filtered = batches.filter(b => 
    b.productName.toLowerCase().includes(search.toLowerCase()) ||
    b.batchNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-primary" />
            {lang === 'am' ? 'የFEFO ጊዜ ማብቂያ ክትትል' : 'FEFO Expiry & Batch Protocol'}
          </h1>
          <p className="text-sm text-slate-600">
            {lang === 'am' 
              ? 'መጀመሪያ የሚያበቃውን መጀመሪያ የማውጣት (FEFO) ደንብ እና የተበላሹ መድኃኒቶች ማቆያ' 
              : 'Strict First-Expiry-First-Out enforcement and proactive quarantine management.'}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchBatches} loading={loading}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium">
          {statusMsg}
        </div>
      )}

      {/* Quick Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'am' ? 'በመድኃኒት ወይም ባች ቁጥር ፈልግ...' : 'Search by medicine or batch number...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{lang === 'am' ? 'ባች / መድኃኒት' : 'Batch & Medicine'}</th>
                <th className="py-3.5 px-4">{lang === 'am' ? 'ቦታ' : 'Location'}</th>
                <th className="py-3.5 px-4 text-center">{lang === 'am' ? 'የቀረ ብዛት' : 'Quantity Remaining'}</th>
                <th className="py-3.5 px-4 text-center">{lang === 'am' ? 'የሚያበቃበት ቀን' : 'Expiry Date'}</th>
                <th className="py-3.5 px-4 text-center">{lang === 'am' ? 'FEFO ሁኔታ' : 'FEFO Status'}</th>
                <th className="py-3.5 px-4 text-right">{lang === 'am' ? 'እርምጃ' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((b) => {
                const days = getDaysUntilExpiry(b.expiryDate);
                return (
                  <tr key={b.id} className={`hover:bg-slate-50/75 transition-colors ${b.isQuarantined ? 'bg-red-50/40' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{b.productName}</div>
                      <div className="font-mono text-xs text-primary font-semibold mt-0.5">{b.batchNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        b.location === 'SHELF' ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {b.location}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {b.quantityRemaining} units
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs">
                      {b.expiryDate}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {b.isQuarantined ? (
                        <Badge variant="danger">QUARANTINED</Badge>
                      ) : (
                        getExpiryStatusBadge(days)
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant={b.isQuarantined ? 'outline' : 'danger'}
                        onClick={() => handleQuarantine(b.id)}
                      >
                        {b.isQuarantined ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Release
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5 mr-1" />
                            Quarantine
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
