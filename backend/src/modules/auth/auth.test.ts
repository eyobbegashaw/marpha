import request from 'supertest';
import { createApp } from '../../app';

const app = createApp();

describe('Auth & Consolidated Role Management API', () => {
  let ownerToken: string;
  let createdPharmacistId: string;
  const pharmacistEmail = `test_pharma_${Date.now()}@selampharmacy.com`;

  it('should authenticate Pharmacy Owner successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'owner@selampharmacy.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('owner@selampharmacy.com');
    expect(res.body.data.user.role).toBe('PHARMACY_OWNER');

    ownerToken = res.body.data.token;
  });

  it('should allow Pharmacy Owner to CREATE a new Pharmacist employee', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        roleName: 'PHARMACIST',
        firstName: 'Dawit',
        lastName: 'Tadesse',
        email: pharmacistEmail,
        password: 'PharmaPassword123!',
        phone: '+251911998877',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(pharmacistEmail);
    expect(res.body.data.role).toBe('PHARMACIST');
    expect(res.body.data.is_active).toBe(true);

    createdPharmacistId = res.body.data.id;
  });

  it('should allow newly created Pharmacist to log in', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: pharmacistEmail,
        password: 'PharmaPassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('PHARMACIST');
  });

  it('should allow Pharmacy Owner to DEACTIVATE the Pharmacist account', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${createdPharmacistId}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(false);
  });

  it('should BLOCK deactivated Pharmacist from logging in with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: pharmacistEmail,
        password: 'PharmaPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('deactivated');
  });

  it('should allow Pharmacy Owner to RE-ACTIVATE the Pharmacist account', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${createdPharmacistId}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ isActive: true });

    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(true);
  });

  it('should allow Pharmacy Owner to GET and PATCH user details by ID', async () => {
    // 1. GET /users/:id
    const getRes = await request(app)
      .get(`/api/v1/users/${createdPharmacistId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(createdPharmacistId);
    expect(getRes.body.data.email).toBe(pharmacistEmail);

    // 2. PATCH /users/:id
    const patchRes = await request(app)
      .patch(`/api/v1/users/${createdPharmacistId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        firstName: 'Dawit-Updated',
        phone: '+251911000111',
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.first_name).toBe('Dawit-Updated');
    expect(patchRes.body.data.phone).toBe('+251911000111');
  });

  it('should ALLOW CUSTOMER public access to check REAL-TIME stock availability without login and BLOCK unauthenticated access to /inventory/overview', async () => {
    // 1. Search for Paracetamol to get productId
    const prodsRes = await request(app)
      .get('/api/v1/products')
      .query({ search: 'Paracetamol' });

    expect(prodsRes.status).toBe(200);
    const paraId = prodsRes.body.data[0].id;

    // 2. Query real-time availability without token (PUBLIC)
    const availRes = await request(app).get(`/api/v1/products/${paraId}/availability`);
    expect(availRes.status).toBe(200);
    expect(availRes.body.success).toBe(true);
    expect(availRes.body.data.product.genericName).toBe('Paracetamol');
    expect(availRes.body.data.overallAvailability.isAvailable).toBe(true);
    expect(availRes.body.data.overallAvailability.totalStock).toBeGreaterThan(0);
    expect(Array.isArray(availRes.body.data.branches)).toBe(true);
    expect(availRes.body.data.branches[0].shelfStock).toBeDefined();

    // 3. Unauthenticated access to /inventory/overview must be BLOCKED with 401 (PRIVATE)
    const unauthOverviewRes = await request(app).get('/api/v1/inventory/overview');
    expect(unauthOverviewRes.status).toBe(401);

    // 4. Authenticated staff access to /inventory/overview must SUCCEED with 200
    const authOverviewRes = await request(app)
      .get('/api/v1/inventory/overview')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(authOverviewRes.status).toBe(200);
    expect(Array.isArray(authOverviewRes.body.data)).toBe(true);

    // 5. Query product details without token and verify internal purchase_cost is not leaked
    const detailRes = await request(app).get(`/api/v1/products/${paraId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.product.generic_name).toBe('Paracetamol');
    if (detailRes.body.data.inventoryLocations.length > 0) {
      expect(detailRes.body.data.inventoryLocations[0].purchase_cost).toBeUndefined();
    }
  });
});
