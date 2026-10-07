import request from 'supertest';
import { createApp } from '../../app';

const app = createApp();

describe('Business Intelligence & Analytics API', () => {
  let ownerToken: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@selampharmacy.com', password: 'Password123!' });
    ownerToken = loginRes.body.data.token;
  });

  it('should retrieve full dashboard KPIs including Revenue, COGS, Net Profit, and Stock Valuation', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/dashboard')
      .query({ period: '30days' })
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.financialSummary).toBeDefined();
    expect(typeof data.financialSummary.revenue).toBe('number');
    expect(typeof data.financialSummary.cogs).toBe('number');
    expect(typeof data.financialSummary.grossProfit).toBe('number');
    expect(typeof data.financialSummary.netProfit).toBe('number');

    expect(data.stockValuation).toBeDefined();
    expect(data.stockValuation.totalStockCostValue).toBeGreaterThan(0);
    expect(data.stockValuation.shelfStockCostValue).toBeGreaterThan(0);
    expect(data.stockValuation.warehouseStockCostValue).toBeGreaterThan(0);

    expect(data.inventoryHealth).toBeDefined();
    expect(typeof data.inventoryHealth.totalProducts).toBe('number');
  });

  it('should return transparent demand and reorder recommendations based on ADS & lead times', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/demand-restock')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    const para = res.body.data.find((p: any) => p.genericName === 'Paracetamol');
    expect(para).toBeDefined();
    expect(typeof para.averageDailySales).toBe('number');
    expect(typeof para.estimatedDemandDuringLeadTime).toBe('number');
    expect(typeof para.suggestedReorderQuantity).toBe('number');
    expect(para.daysOfInventoryRemaining).toBeDefined();
  });
});
