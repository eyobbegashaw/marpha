import request from 'supertest';
import { createApp } from '../../app';

const app = createApp();

describe('Purchase Lifecycle, Batch Receiving, Price History, and Expense Voiding', () => {
  let ownerToken: string;
  let pharmacistToken: string;
  let branchId: string;
  let whId: string;
  let supplierId: string;
  let paraId: string;

  beforeAll(async () => {
    // 1. Owner Login
    const ownerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@selampharmacy.com', password: 'Password123!' });
    ownerToken = ownerLogin.body.data.token;

    // 2. Pharmacist Login
    const pharmaLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pharmacist@selampharmacy.com', password: 'Password123!' });
    pharmacistToken = pharmaLogin.body.data.token;

    // Fetch master IDs
    const locsRes = await request(app)
      .get('/api/v1/locations')
      .set('Authorization', `Bearer ${ownerToken}`);
    const wh = locsRes.body.data.find((l: any) => l.code === 'WH-01');
    whId = wh.id;
    branchId = wh.branch_id;

    const suppRes = await request(app)
      .get('/api/v1/suppliers')
      .set('Authorization', `Bearer ${ownerToken}`);
    supplierId = suppRes.body.data[0].id;

    const prodRes = await request(app)
      .get('/api/v1/products')
      .query({ search: 'Paracetamol' });
    paraId = prodRes.body.data[0].id;
  });

  it('should transition purchase order through full lifecycle: DRAFT -> SUBMITTED -> APPROVED -> ORDERED -> RECEIVED with batch creation', async () => {
    // 1. Create DRAFT purchase order
    const draftRes = await request(app)
      .post('/api/v1/purchases')
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        branchId,
        supplierId,
        destinationLocationId: whId,
        invoiceNumber: `PO-TEST-${Date.now()}`,
        status: 'DRAFT',
        items: [
          {
            productId: paraId,
            batchNumber: `BATCH-TEST-${Date.now().toString().slice(-4)}`,
            manufacturingDate: '2026-01-01',
            expiryDate: '2028-01-01',
            quantityOrdered: 50,
            unitCost: 85.0,
            unitSellingPrice: 110.0,
          },
        ],
      });

    expect(draftRes.status).toBe(201);
    expect(draftRes.body.data.status).toBe('DRAFT');
    const poId = draftRes.body.data.id;

    // 2. Submit DRAFT -> SUBMITTED
    const submitRes = await request(app)
      .patch(`/api/v1/purchases/${poId}/submit`)
      .set('Authorization', `Bearer ${pharmacistToken}`);
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.status).toBe('SUBMITTED');

    // 3. Approve SUBMITTED -> APPROVED (Owner only)
    const approveRes = await request(app)
      .patch(`/api/v1/purchases/${poId}/approve`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('APPROVED');

    // 4. Mark ORDERED
    const orderRes = await request(app)
      .patch(`/api/v1/purchases/${poId}/order`)
      .set('Authorization', `Bearer ${pharmacistToken}`);
    expect(orderRes.status).toBe(200);
    expect(orderRes.body.data.status).toBe('ORDERED');

    // 5. Receive goods into warehouse -> RECEIVED & populates batch
    const receiveRes = await request(app)
      .post(`/api/v1/purchases/${poId}/receive`)
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({});
    expect(receiveRes.status).toBe(200);
    expect(receiveRes.body.data.status).toBe('RECEIVED');
  });

  it('should update product price and maintain audited price history', async () => {
    const updatePriceRes = await request(app)
      .patch(`/api/v1/products/${paraId}/price`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        sellingPrice: 125.0,
        reason: 'Inflation adjustment and operational cost increase',
      });

    expect(updatePriceRes.status).toBe(200);
    expect(updatePriceRes.body.success).toBe(true);
    expect(parseFloat(updatePriceRes.body.data.newPrice)).toBe(125.0);

    // Verify history
    const historyRes = await request(app)
      .get(`/api/v1/products/${paraId}/price-history`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(historyRes.status).toBe(200);
    expect(Array.isArray(historyRes.body.data)).toBe(true);
    expect(historyRes.body.data.length).toBeGreaterThan(0);
    expect(parseFloat(historyRes.body.data[0].new_price)).toBe(125.0);
  });

  it('should record an expense and allow Pharmacy Owner to VOID it with audited reason', async () => {
    // 1. Record expense
    const createExpRes = await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        branchId,
        expenseCategory: 'Maintenance',
        description: 'AC filter cleaning service',
        amount: 500.0,
      });

    expect(createExpRes.status).toBe(201);
    const expId = createExpRes.body.data.id;

    // 2. Void expense
    const voidRes = await request(app)
      .patch(`/api/v1/expenses/${expId}/void`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ reason: 'Incorrect duplicate invoice submitted by technician' });

    expect(voidRes.status).toBe(200);
    expect(voidRes.body.data.is_voided).toBe(true);
    expect(voidRes.body.data.void_reason).toContain('duplicate invoice');
  });

  it('should mark notification as RESOLVED separately from READ', async () => {
    const notifsRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(notifsRes.status).toBe(200);
    if (notifsRes.body.data.length > 0) {
      const notifId = notifsRes.body.data[0].id;

      // Mark resolved
      const resolveRes = await request(app)
        .patch(`/api/v1/notifications/${notifId}/resolve`)
        .set('Authorization', `Bearer ${pharmacistToken}`);

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.is_resolved).toBe(true);
      expect(resolveRes.body.data.is_read).toBe(true);
    }
  });
});
