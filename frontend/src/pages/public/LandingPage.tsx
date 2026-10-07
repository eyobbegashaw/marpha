import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nContext';
import { useTenantConfig } from '../../theme/TenantThemeProvider';
import { Button } from '../../components/ui/Button';
import {
  Search,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Pill,
  Phone,
  Send,
  ExternalLink,
  Info,
  FileText,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { config, getCmsText } = useTenantConfig();

  const pharmacyName =
    config?.branding?.display_name ||
    config?.branding?.pharmacy_name ||
    config?.display_name ||
    config?.pharmacy_name ||
    'Abu Central Pharmacy';

  const pharmacyDesc =
    config?.content?.description ||
    config?.description ||
    'Premier licensed community healthcare dispensary dedicated to providing genuine prescription medicines, patient counseling, cold-chain preservation, and verified pharmaceutical care for your family.';

  const pharmacyImage =
    config?.content?.image_url ||
    (config?.branding as any)?.image_url ||
    'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1200&q=80';

  const pharmacyAddress =
    config?.content?.address ||
    config?.address ||
    'Bole Road, Next to Edna Mall, Addis Ababa, Ethiopia';

  const pharmacyPhone =
    config?.content?.support_phone ||
    config?.contact_phone ||
    '+251 911 234 567';

  const pharmacyTelegram =
    config?.content?.telegram ||
    config?.telegram ||
    '@AbuCentralPharmacy';

  const cleanTelegram = pharmacyTelegram.replace('@', '');

  return (
    <div className="space-y-16 pb-12 animate-in fade-in duration-300">
      {/* Hero & Pharmacy Showcase Section */}
      <section className="relative py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Pharmacy Info & Description */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('hero.badge', 'Licensed Community Pharmacy & Dispensary')}</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary leading-[1.15]">
                {pharmacyName}
              </h1>
              <p className="text-sm font-semibold text-primary">
                {config?.welcome_message ||
                  getCmsText('home.welcome_message', 'Trusted Healthcare Partner & Live Medicine Intelligence')}
              </p>
            </div>

            {/* Pharmacy Description */}
            <p className="text-base text-text-secondary leading-relaxed">
              {pharmacyDesc}
            </p>

            {/* Quick trust badges */}
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-text-secondary">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% Genuine Medicines
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                Licensed Clinical Pharmacists
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Open 7 Days a Week
              </span>
            </div>

            {/* Direct Action to Catalog */}
            <div className="pt-2">
              <Link to="/catalog">
                <Button variant="primary" size="lg" className="rounded-xl font-semibold shadow-soft-md" icon={<ArrowRight className="w-4 h-4" />}>
                  {t('nav.catalog', 'Browse Medicine Catalog')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Pharmacy Image & Contact Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-soft-lg border border-surface-border group">
              <img
                src={pharmacyImage}
                alt={pharmacyName}
                className="w-full h-72 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-5 text-white">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">
                  Licensed Clinical Dispensary
                </span>
                <h3 className="text-lg font-bold text-white">{pharmacyName}</h3>
                <p className="text-xs text-slate-200 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary-light shrink-0" />
                  <span className="truncate">{pharmacyAddress}</span>
                </p>
              </div>
            </div>

            {/* Quick Direct Connect Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${pharmacyPhone}`}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface border border-surface-border hover:border-primary hover:text-primary text-text-primary text-xs font-semibold shadow-soft-xs transition-colors"
              >
                <Phone className="w-4 h-4 text-primary" />
                <span>Call Pharmacist</span>
              </a>
              <a
                href={`https://t.me/${cleanTelegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-700 text-xs font-semibold shadow-soft-xs transition-colors"
              >
                <Send className="w-4 h-4 text-sky-600" />
                <span>Telegram Chat</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Medicine Information Guide */}
      <section className="py-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customer Medicine Guide</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            {t('home.howToGetMedicineInfo', 'How Customers Can Get Information About Medicines')}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {t(
              'home.howToGetMedicineInfoSubtitle',
              'Follow these steps to find authentic medications, explore verified clinical indications, active ingredients, dosage forms, and medicine imagery.'
            )}
          </p>
        </div>

        {/* 3 Step Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Search & Browse */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border hover:border-primary/40 hover:shadow-soft-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-text-primary">1. Search & Browse</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Browse our verified catalog by generic chemical name, brand name, dosage form, or therapeutic category.
              </p>
            </div>
            <Link to="/catalog">
              <Button variant="outline" size="sm" className="w-full text-xs rounded-xl" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Open Medicine Catalog
              </Button>
            </Link>
          </div>

          {/* Step 2: Get Information About Medicine with Image */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border hover:border-primary/40 hover:shadow-soft-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-text-primary">2. Medicine Info & Image</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                View verified medicine details including clinical photo, active ingredients, strength, dosage instructions, and therapeutic indications.
              </p>
            </div>
            <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
              ✓ Clinical Data & Image • No price or shelf stock displayed
            </div>
          </div>

          {/* Step 3: Consult Our Licensed Pharmacists */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border hover:border-primary/40 hover:shadow-soft-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-lg">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-text-primary">3. Consult Our Pharmacists</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Need guidance on prescriptions, interactions, or dosage? Reach out directly via Phone or Telegram for licensed assistance.
              </p>
            </div>
            <div className="space-y-2">
              <a
                href={`https://t.me/${cleanTelegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-soft-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Telegram Support
              </a>
              <a
                href={`tel:${pharmacyPhone}`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-surface-border hover:bg-surface-subtle text-text-primary text-xs font-semibold transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-primary" />
                {pharmacyPhone}
              </a>
            </div>
          </div>
        </div>

        {/* Live Example: Medicine Information Preview */}
        <div className="pt-8 border-t border-surface-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Live Example Showcase</span>
              <h3 className="text-lg font-bold text-text-primary">
                Sample Medicine Information Card
              </h3>
              <p className="text-xs text-text-muted">
                Showing how customers get clinical information and medicine imagery without commercial price, in-stock, or shelf data.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Clinical Specification</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Medicine Image */}
            <div className="md:col-span-4">
              <div className="relative rounded-xl overflow-hidden border border-surface-border bg-surface shadow-soft-sm group">
                <img
                  src="https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80"
                  alt="Amoxicillin Oral Capsule"
                  className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-surface/90 backdrop-blur-sm text-[11px] font-semibold text-text-primary border border-surface-border">
                  Oral Capsule
                </div>
              </div>
            </div>

            {/* Medicine Clinical Details */}
            <div className="md:col-span-8 space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    Antibacterial / Anti-infective
                  </span>
                  <span className="text-xs text-text-muted">EFDA Approved</span>
                </div>
                <h4 className="text-xl font-bold text-text-primary">Amoxicillin 500mg</h4>
                <p className="text-xs text-text-secondary font-medium">Brand Name: Amoxil®</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1">
                  <span className="font-bold text-text-primary block flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-primary" /> Active Ingredient (API):
                  </span>
                  <p className="text-text-secondary">Amoxicillin Trihydrate 500 mg</p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1">
                  <span className="font-bold text-text-primary block flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" /> Primary Indications:
                  </span>
                  <p className="text-text-secondary">Bacterial respiratory, ear, dental, and skin infections</p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1">
                  <span className="font-bold text-text-primary block flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-primary" /> How to Take / Administration:
                  </span>
                  <p className="text-text-secondary">Take orally with water at evenly spaced intervals; complete prescribed course.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1">
                  <span className="font-bold text-text-primary block flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Storage & Precautions:
                  </span>
                  <p className="text-text-secondary">Store below 25°C in a dry place. Check with pharmacist if allergic to penicillins.</p>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-text-muted">
                <span>Clinical information provided for patient education. Consult our pharmacists for prescriptions.</span>
                <Link to="/catalog" className="text-primary font-semibold hover:underline flex items-center gap-1">
                  <span>Explore More Medicines</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pharmacy Contact, Address, Phone, Telegram & Hours */}
      <section className="py-6 space-y-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {t('home.contactTitle', 'Pharmacy Contact, Location & Hours')}
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              We are open every day to provide professional dispensary care, consultations, and verified medicines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Address */}
            <div className="p-5 rounded-2xl bg-surface border border-surface-border space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-text-primary">Dispensary Address</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                {pharmacyAddress}
              </p>
              <div className="pt-2 text-[11px] font-semibold text-primary">
                Addis Ababa, Ethiopia
              </div>
            </div>

            {/* Direct Phone & Hours */}
            <div className="p-5 rounded-2xl bg-surface border border-surface-border space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-text-primary">Phone & Working Hours</h4>
              <p className="text-xs text-text-secondary">
                <a href={`tel:${pharmacyPhone}`} className="font-bold text-primary hover:underline text-sm block">
                  {pharmacyPhone}
                </a>
              </p>
              <div className="pt-1 text-xs text-text-secondary space-y-1">
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  <span>Mon – Sun: 8:00 AM – 10:00 PM</span>
                </p>
                <p className="text-[11px] text-emerald-600 font-medium">On-Duty Clinical Pharmacists</p>
              </div>
            </div>

            {/* Telegram Channel & Support */}
            <div className="p-5 rounded-2xl bg-surface border border-surface-border space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-text-primary">Telegram Community</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Ask about medicine availability, prescription updates, or order questions on Telegram.
              </p>
              <div className="pt-2">
                <a
                  href={`https://t.me/${cleanTelegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-soft-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{pharmacyTelegram}</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
