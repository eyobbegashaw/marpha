import request from 'supertest';
import { createApp } from '../../app';

const app = createApp();

describe('Platform Admin & Multi-Tenant Configuration API', () => {
  let platformAdminToken: string;
  let abuOwnerToken: string;
  let pharmacistToken: string;
  let abuOrgId: string;
  let butuOrgId: string;

  beforeAll(async () => {
    // 1. Platform Admin login
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@pharmaplatform.com', password: 'PlatformAdmin123!' });

    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.data.user.role).toBe('PLATFORM_ADMIN');
    platformAdminToken = adminLogin.body.data.token;

    // 2. Abu Pharmacy Owner login
    const ownerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@selampharmacy.com', password: 'Password123!' });
    expect(ownerLogin.status).toBe(200);
    expect(ownerLogin.body.data.user.role).toBe('PHARMACY_OWNER');
    abuOwnerToken = ownerLogin.body.data.token;

    // 3. Pharmacist login
    const pharmaLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pharmacist@selampharmacy.com', password: 'Password123!' });
    expect(pharmaLogin.status).toBe(200);
    expect(pharmaLogin.body.data.user.role).toBe('PHARMACIST');
    pharmacistToken = pharmaLogin.body.data.token;

    // Fetch initial Org IDs
    const orgsRes = await request(app)
      .get('/api/v1/platform/pharmacies')
      .set('Authorization', `Bearer ${platformAdminToken}`);
    const abu = orgsRes.body.data.find((p: any) => p.code === 'SELAM-01');
    const butu = orgsRes.body.data.find((p: any) => p.code === 'BUTU-01');
    abuOrgId = abu.id;
    butuOrgId = butu.id;
  });

  it('should allow PLATFORM_ADMIN to list all pharmacy tenants', async () => {
    const res = await request(app)
      .get('/api/v1/platform/pharmacies')
      .set('Authorization', `Bearer ${platformAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    const abu = res.body.data.find((p: any) => p.code === 'SELAM-01');
    const butu = res.body.data.find((p: any) => p.code === 'BUTU-01');

    expect(abu).toBeDefined();
    expect(abu.primary_color).toBeDefined();
    expect(butu).toBeDefined();
    expect(butu.primary_color).toBeDefined();
  });

  it('should allow PLATFORM_ADMIN to onboard a new pharmacy tenant', async () => {
    const uniqueCode = `HABESHA_${Date.now().toString().slice(-4)}`;
    const res = await request(app)
      .post('/api/v1/platform/pharmacies')
      .set('Authorization', `Bearer ${platformAdminToken}`)
      .send({
        name: 'Habesha Care Pharmacy',
        code: uniqueCode,
        taxId: 'TIN-55667788',
        phone: '+251118889900',
        email: 'info@habeshapharmacy.com',
        address: 'Piazza, Addis Ababa',
        currency: 'ETB',
        branding: {
          primaryColor: '#7C3AED', // Purple
          secondaryColor: '#6D28D9',
          accentColor: '#10B981',
          welcomeMessage: 'Welcome to Habesha Care Pharmacy',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.organization.code).toBe(uniqueCode);
    expect(res.body.data.configuration.primary_color).toBe('#7C3AED');
  });

  it('should allow PLATFORM_ADMIN to get and update tenant branding without modifying code', async () => {
    // 1. Get current configuration for Butu Pharmacy
    const configRes = await request(app)
      .get(`/api/v1/platform/pharmacies/${butuOrgId}/configuration`)
      .set('Authorization', `Bearer ${platformAdminToken}`);

    expect(configRes.status).toBe(200);
    expect(configRes.body.data.primary_color).toBeDefined();
    expect(configRes.body.data.pharmacy_name).toBe('Butu Community Pharmacy');

    // 2. Update branding (e.g. change accent color, update welcome message & footer)
    const updateRes = await request(app)
      .patch(`/api/v1/platform/pharmacies/${butuOrgId}/branding`)
      .set('Authorization', `Bearer ${platformAdminToken}`)
      .send({
        displayName: 'Butu Family Pharmacy & Wellness',
        primaryColor: '#1E3A8A',
        accentColor: '#F59E0B',
        welcomeMessage: 'Welcome to Butu Family Pharmacy — Quality Medicines for Every Generation.',
        footerText: '© 2026 Butu Family Pharmacy. Licensed Community Dispensary.',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.display_name).toBe('Butu Family Pharmacy & Wellness');
    expect(updateRes.body.data.primary_color).toBe('#1E3A8A');
    expect(updateRes.body.data.accent_color).toBe('#F59E0B');
  });

  it('should allow PLATFORM_ADMIN to update structured bilingual CMS content keys', async () => {
    const contentPayload = {
      content: {
        'home.welcome_message': {
          en: 'Welcome to Butu Modern Dispensary',
          am: 'ወደ ቡቱ ዘመናዊ መድሃኒት ቤት እንኳን በደህና መጡ',
        },
        'catalog.title': {
          en: 'Verified Quality Pharmaceuticals',
          am: 'ጥራታቸው የተረጋገጠ የመድሃኒት ዝርዝር',
        },
      },
    };

    const updateRes = await request(app)
      .patch(`/api/v1/platform/pharmacies/${butuOrgId}/content`)
      .set('Authorization', `Bearer ${platformAdminToken}`)
      .send(contentPayload);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.content['home.welcome_message'].en).toBe('Welcome to Butu Modern Dispensary');
    expect(updateRes.body.data.content['home.welcome_message'].am).toBe('ወደ ቡቱ ዘመናዊ መድሃኒት ቤት እንኳን በደህና መጡ');
  });

  it('should allow PLATFORM_ADMIN to configure modular feature flags per pharmacy', async () => {
    // Disable public catalog and enable offline sync for Butu Pharmacy
    const featuresPayload = {
      public_catalog: false,
      offline_sync: true,
      barcode_lookup: true,
    };

    const updateRes = await request(app)
      .patch(`/api/v1/platform/pharmacies/${butuOrgId}/features`)
      .set('Authorization', `Bearer ${platformAdminToken}`)
      .send(featuresPayload);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.feature_flags.public_catalog).toBe(false);
    expect(updateRes.body.data.feature_flags.offline_sync).toBe(true);
  });

  it('should allow PLATFORM_ADMIN to generate configuration live previews', async () => {
    const previewRes = await request(app)
      .post(`/api/v1/platform/pharmacies/${butuOrgId}/preview`)
      .set('Authorization', `Bearer ${platformAdminToken}`)
      .send({
        primaryColor: '#DC2626', // Test red theme preview
        welcomeMessage: 'Previewing Holiday Promotion Theme',
      });

    expect(previewRes.status).toBe(200);
    expect(previewRes.body.data.branding.primaryColor).toBe('#DC2626');
    expect(previewRes.body.data.welcome_message).toBe('Previewing Holiday Promotion Theme');
  });

  it('should allow frontend and mobile apps to bootstrap dynamic tenant configuration via public endpoint', async () => {
    // 1. Resolve Butu Pharmacy configuration dynamically by code (BUTU-01)
    const butuPublicRes = await request(app)
      .get('/api/v1/platform/config/public')
      .query({ tenantCode: 'BUTU-01' });

    expect(butuPublicRes.status).toBe(200);
    expect(butuPublicRes.body.data.organization_code).toBe('BUTU-01');
    expect(butuPublicRes.body.data.primary_color).toBe('#1E3A8A');
    expect(butuPublicRes.body.data.feature_flags.public_catalog).toBe(false);

    // 2. Resolve Abu Central Pharmacy configuration dynamically by header (x-organization-code: SELAM-01)
    const abuPublicRes = await request(app)
      .get('/api/v1/platform/config/public')
      .set('x-organization-code', 'SELAM-01');

    expect(abuPublicRes.status).toBe(200);
    expect(abuPublicRes.body.data.organization_code).toBe('SELAM-01');
    expect(abuPublicRes.body.data.primary_color).toBe('#0D9488');
    expect(abuPublicRes.body.data.feature_flags.public_catalog).toBe(true);
  });

  it('should STRICTLY BLOCK Pharmacy Owners and Pharmacists from platform administration endpoints (403 Forbidden)', async () => {
    // 1. Pharmacy Owner attempts to access Platform Admin pharmacies list -> 403 Forbidden
    const ownerRes = await request(app)
      .get('/api/v1/platform/pharmacies')
      .set('Authorization', `Bearer ${abuOwnerToken}`);

    expect(ownerRes.status).toBe(403);
    expect(ownerRes.body.message).toContain('Access denied');

    // 2. Pharmacist attempts to alter tenant branding -> 403 Forbidden
    const pharmaRes = await request(app)
      .patch(`/api/v1/platform/pharmacies/${abuOrgId}/branding`)
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({ primaryColor: '#000000' });

    expect(pharmaRes.status).toBe(403);
  });
});
