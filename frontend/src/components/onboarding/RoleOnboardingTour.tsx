import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nContext';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../ui/Button';
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle, ShieldCheck, Compass, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface TourStep {
  title: string;
  description: string;
  badge: string;
  targetArea?: string;
}

export const RoleOnboardingTour: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const role: string = user?.role || 'CUSTOMER';
  const isDashboard =
    location.pathname.startsWith('/owner') ||
    location.pathname.startsWith('/pharmacist') ||
    location.pathname.startsWith('/platform-admin') ||
    role === 'PHARMACY_OWNER' ||
    role === 'PHARMACIST' ||
    role === 'PLATFORM_ADMIN';

  // Do not render the "How It Works" / Guide button on pharmacy owner and pharmacist dashboards
  if (isDashboard) {
    return null;
  }

  const storageKey = `onboarding_completed_${role}_v2`;

  useEffect(() => {
    const hasCompleted = localStorage.getItem(storageKey);
    if (!hasCompleted) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [role]);

  const getSteps = (): TourStep[] => {
    if (role === 'PHARMACY_OWNER') {
      return [
        {
          badge: 'Stage 1 of 4: Financial Governance',
          title: t('onboard.ownerStep1Title', '1. Executive Performance KPIs'),
          description: t(
            'onboard.ownerStep1Desc',
            'Track Revenue, Cost of Goods Sold (COGS), Net Profit, and overall stock valuation with real-time financial accuracy.'
          ),
        },
        {
          badge: 'Stage 2 of 4: Physical Location Rules',
          title: t('onboard.ownerStep2Title', '2. Multi-Location Stock Rules'),
          description: t(
            'onboard.ownerStep2Desc',
            'Sales shelf stock is separated from warehouse reserve. Shelf empty triggers an internal refill recommendation, not a duplicate purchase.'
          ),
        },
        {
          badge: 'Stage 3 of 4: Automated Intelligence',
          title: t('onboard.ownerStep3Title', '3. Smart Demand & Restock'),
          description: t(
            'onboard.ownerStep3Desc',
            'Transparent calculations based on Average Daily Sales (ADS) and lead times help maintain optimal safety stock.'
          ),
        },
        {
          badge: 'Stage 4 of 4: Governance & Compliance',
          title: '4. Staff Lifecycle & Price Governance',
          description:
            'Create, activate, or deactivate Pharmacist accounts in real time. Adjust selling prices with audited historical logging.',
        },
      ];
    } else if (role === 'PHARMACIST') {
      return [
        {
          badge: 'Stage 1 of 4: Fast Point of Sale',
          title: t('onboard.pharmaStep1Title', '1. Fast POS Checkout'),
          description: t(
            'onboard.pharmaStep1Desc',
            'Search by generic/brand name or barcode. The system automatically prioritizes the nearest expiry batch (FEFO).'
          ),
        },
        {
          badge: 'Stage 2 of 4: Internal Inventory Movements',
          title: t('onboard.pharmaStep2Title', '2. Warehouse Refill Workflow'),
          description: t(
            'onboard.pharmaStep2Desc',
            'Easily transfer reserve units from warehouse storage to customer-facing shelves with a single click.'
          ),
        },
        {
          badge: 'Stage 3 of 4: FEFO Batch Safety',
          title: '3. Expiry Date & FEFO Monitoring',
          description:
            'Near-expiry medicines are highlighted with color tokens. Expired batches are locked from dispensation automatically.',
        },
        {
          badge: 'Stage 4 of 4: Goods Receipt',
          title: '4. Purchasing & Shipment Receiving',
          description:
            'Receiving purchase order items automatically creates batch records and populates reserve warehouse inventory.',
        },
      ];
    } else {
      // Customer
      return [
        {
          badge: 'Discovery & Live Stock',
          title: t('onboard.custStep1Title', '1. Real-Time Medicine Availability'),
          description: t(
            'onboard.custStep1Desc',
            'Check live availability and dosage instructions across branches before visiting the pharmacy.'
          ),
        },
        {
          badge: 'Receipt History',
          title: '2. Digital Receipts & Purchase Tracking',
          description:
            'Sign in to view your past purchases, medicine names, strengths, quantities, and verify purchase timestamps.',
        },
      ];
    }
  };

  const steps = getSteps();
  const currentStep = steps[currentStepIndex] || steps[0];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleRestart}
        className="fixed bottom-5 right-5 z-40 p-3 bg-surface text-text-primary rounded-full shadow-soft-lg border border-surface-border hover:bg-surface-subtle hover:scale-105 transition-all flex items-center gap-2 text-xs font-semibold"
        title="Interactive System Guide"
      >
        <Compass className="w-4 h-4 text-primary animate-spin-slow" />
        <span className="hidden md:inline">{t('btn.howItWorks', 'Guide & Tour')}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-surface rounded-2xl shadow-soft-xl border border-surface-border overflow-hidden p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{currentStep.badge}</span>
          </div>
          <button
            onClick={handleComplete}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-text-primary">{currentStep.title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{currentStep.description}</p>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-1.5 pt-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={clsx(
                'h-1.5 rounded-full transition-all duration-300',
                idx === currentStepIndex ? 'w-8 bg-primary' : 'w-2 bg-surface-border'
              )}
            />
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-border">
          <button
            onClick={handleComplete}
            className="text-xs text-text-muted hover:text-text-primary font-medium"
          >
            {t('btn.skip', 'Skip Tour')}
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                {t('btn.prev', 'Previous')}
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              icon={currentStepIndex === steps.length - 1 ? <CheckCircle className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            >
              {currentStepIndex === steps.length - 1 ? t('btn.finishTour', 'Get Started') : t('btn.next', 'Next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
