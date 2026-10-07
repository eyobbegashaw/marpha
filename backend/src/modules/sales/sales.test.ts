import request from 'supertest';
import { createApp } from '../../app';

const app = createApp();

describe('Sales & POS Engine with FEFO, Historical Cost Snapshots, and Buyer History', () => {
  let pharmacistToken: string;
  let customerToken: string;
  let branchId: string;
  let shelfId: string;
  let paraId: string;
  let customerUserId: string;

  beforeAll(async () => {
    // 1. Pharmacist login
    const pharmaLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pharmacist@selampharmacy.com', password: 'Password123!' });
    pharmacistToken = pharmaLogin.body.data.token;

    // 2. Customer login
    const custLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@gmail.com', password: 'Password123!' });
    customerToken = custLogin.body.data.token;
    customerUserId = custLogin.body.data.user.id;

    const locsRes = await request(app)
      .get('/api/v1/locations')
      .set('Authorization', `Bearer ${pharmacistToken}`);
    const shelf = locsRes.body.data.find((l: any) => l.code === 'SHELF-01');
    shelfId = shelf.id;
    branchId = shelf.branch_id;

    const prodsRes = await request(app)
      .get('/api/v1/products')
      .query({ search: 'Paracetamol' })
      .set('Authorization', `Bearer ${pharmacistToken}`);
    paraId = prodsRes.body.data[0].id;
  });

  it('should process a POS checkout sale, freeze historical price and cost snapshots, and calculate COGS & gross profit', async () => {
    const syncId = `SYNC_TEST_${Date.now()}`;
    // Sell 10 units of Paracetamol (Unit Price = 100 ETB, Unit Cost = 80 ETB) linked to registered customer buyer
    const saleRes = await request(app)
      .post('/api/v1/sales/checkout')
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        branchId,
        locationId: shelfId,
        buyerId: customerUserId,
        offlineSyncId: syncId,
        items: [
          {
            productId: paraId,
            quantity: 10,
          },
        ],
      });

    expect(saleRes.status).toBe(201);
    expect(saleRes.body.success).toBe(true);

    const sale = saleRes.body.data.sale;
    expect(parseFloat(sale.subtotal)).toBe(1000);
    expect(parseFloat(sale.total_amount)).toBe(1000);
    expect(parseFloat(sale.total_cogs)).toBe(800); // 10 * 80 ETB
    expect(parseFloat(sale.gross_profit)).toBe(200); // 1000 - 800

    const items = saleRes.body.data.items;
    expect(items.length).toBe(1);
    expect(items[0].unitPrice).toBe(100);
    expect(items[0].unitCost).toBe(80);
    expect(items[0].cogs).toBe(800);
    expect(items[0].grossProfit).toBe(200);

    // Test idempotency for offline sync replay
    const replayRes = await request(app)
      .post('/api/v1/sales/checkout')
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        branchId,
        locationId: shelfId,
        buyerId: customerUserId,
        offlineSyncId: syncId,
        items: [{ productId: paraId, quantity: 10 }],
      });

    expect(replayRes.status).toBe(201);
    expect(replayRes.body.data.isIdempotentReplay).toBe(true);
  });

  it('should allow logged-in customer to view their own purchase history and receipts', async () => {
    const myPurchasesRes = await request(app)
      .get('/api/v1/sales/my-purchases')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(myPurchasesRes.status).toBe(200);
    expect(myPurchasesRes.body.success).toBe(true);
    expect(Array.isArray(myPurchasesRes.body.data)).toBe(true);
    expect(myPurchasesRes.body.data.length).toBeGreaterThan(0);

    const purchaseId = myPurchasesRes.body.data[0].id;

    // Get specific purchase detail
    const detailRes = await request(app)
      .get(`/api/v1/sales/my-purchases/${purchaseId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data.items).toBeDefined();
    expect(detailRes.body.data.items.length).toBeGreaterThan(0);
    expect(detailRes.body.data.items[0].generic_name).toBeDefined();
  });

  it('should block Pharmacist/Owner from /sales/my-purchases and allow staff access via /sales', async () => {
    // 1. Staff calling /sales/my-purchases -> 403 Forbidden
    const staffMyPurchasesRes = await request(app)
      .get('/api/v1/sales/my-purchases')
      .set('Authorization', `Bearer ${pharmacistToken}`);

    expect(staffMyPurchasesRes.status).toBe(403);

    // 2. Staff calling /sales -> 200 OK
    const staffSalesRes = await request(app)
      .get('/api/v1/sales')
      .set('Authorization', `Bearer ${pharmacistToken}`);

    expect(staffSalesRes.status).toBe(200);
    expect(Array.isArray(staffSalesRes.body.data)).toBe(true);
  });
});
