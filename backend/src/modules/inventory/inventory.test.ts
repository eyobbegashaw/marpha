import request from 'supertest';
import { createApp } from '../../app';
import { db } from '../../database/connection';

const app = createApp();

describe('Inventory & Multi-Location Stock Rules', () => {
  let token: string;

  beforeAll(async () => {
    // Reset Omeprazole stock to baseline (Shelf = 0, Warehouse = 80)
    await db.query(`
      UPDATE inventory i
      SET quantity = CASE 
        WHEN l.code = 'SHELF-01' THEN 0 
        WHEN l.code = 'WH-01' THEN 80 
        ELSE quantity 
      END
      FROM locations l, products p
      WHERE i.location_id = l.id AND i.product_id = p.id AND p.generic_name = 'Omeprazole'
    `);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pharmacist@selampharmacy.com', password: 'Password123!' });
    token = loginRes.body.data.token;
  });

  it('should return location-aware stock overview distinguishing Sales Shelf and Warehouse', async () => {
    const res = await request(app)
      .get('/api/v1/inventory/overview')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    // Find Paracetamol
    const para = res.body.data.find((p: any) => p.genericName === 'Paracetamol');
    expect(para).toBeDefined();
    expect(para.shelfStock).toBeGreaterThanOrEqual(0);
    expect(para.warehouseStock).toBeGreaterThanOrEqual(100);
    expect(['AVAILABLE', 'SHELF_LOW']).toContain(para.status);

    // Find Omeprazole (Shelf = 0, Warehouse = 80 -> SHELF_EMPTY, NOT OUT_OF_STOCK)
    const omep = res.body.data.find((p: any) => p.genericName === 'Omeprazole');
    expect(omep).toBeDefined();
    expect(omep.shelfStock).toBe(0);
    expect(omep.warehouseStock).toBe(80);
    expect(omep.status).toBe('SHELF_EMPTY');
    expect(omep.systemAction).toContain('Recommend transfer from warehouse; do NOT request a purchase');

    // Find Ceftriaxone (0 everywhere -> COMPLETELY_OUT_OF_STOCK)
    const ceft = res.body.data.find((p: any) => p.genericName === 'Ceftriaxone');
    expect(ceft).toBeDefined();
    expect(ceft.totalStock).toBe(0);
    expect(ceft.status).toBe('COMPLETELY_OUT_OF_STOCK');
  });

  it('should execute a stock TRANSFER from Warehouse to Sales Shelf without changing total stock', async () => {
    // 1. Get location IDs and batch for Omeprazole
    const prodsRes = await request(app)
      .get('/api/v1/products')
      .query({ search: 'Omeprazole' })
      .set('Authorization', `Bearer ${token}`);

    const omepId = prodsRes.body.data[0].id;

    const locsRes = await request(app)
      .get('/api/v1/locations')
      .set('Authorization', `Bearer ${token}`);

    const shelf = locsRes.body.data.find((l: any) => l.code === 'SHELF-01');
    const wh = locsRes.body.data.find((l: any) => l.code === 'WH-01');

    const batchesRes = await request(app)
      .get('/api/v1/batches')
      .query({ productId: omepId })
      .set('Authorization', `Bearer ${token}`);

    const batchId = batchesRes.body.data[0].id;

    // 2. Perform transfer of 30 units
    const transferRes = await request(app)
      .post('/api/v1/inventory/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: omepId,
        batchId,
        sourceLocationId: wh.id,
        destinationLocationId: shelf.id,
        quantity: 30,
        notes: 'Refill sales shelf',
      });

    expect(transferRes.status).toBe(200);
    expect(transferRes.body.success).toBe(true);

    // 3. Check updated overview: Shelf is now 30, Warehouse is now 50, Total is still 80
    const overviewRes = await request(app)
      .get('/api/v1/inventory/overview')
      .set('Authorization', `Bearer ${token}`);

    const updatedOmep = overviewRes.body.data.find((p: any) => p.genericName === 'Omeprazole');
    expect(updatedOmep.shelfStock).toBe(30);
    expect(updatedOmep.warehouseStock).toBe(50);
    expect(updatedOmep.totalStock).toBe(80);
    expect(updatedOmep.status).toBe('AVAILABLE');
  });
});
