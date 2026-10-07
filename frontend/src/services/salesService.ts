import { ApiClient } from './apiClient';

export interface SaleItemRequest {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
}

export interface CheckoutRequest {
  branchId: string;
  locationId: string;
  buyerId?: string;
  offlineSyncId?: string;
  discountAmount?: number;
  items: SaleItemRequest[];
}

export const salesService = {
  async checkout(payload: CheckoutRequest) {
    const res = await ApiClient.post<any>('/api/v1/sales/checkout', payload);
    return res.data;
  },

  async listSales(filters?: { branchId?: string; startDate?: string; endDate?: string }) {
    const res = await ApiClient.get<any[]>('/api/v1/sales', filters);
    return res.data;
  },

  async getSaleById(id: string) {
    const res = await ApiClient.get<any>(`/api/v1/sales/${id}`);
    return res.data;
  },

  async getMyPurchases() {
    const res = await ApiClient.get<any[]>('/api/v1/sales/my-purchases');
    return res.data;
  },

  async getMyPurchaseById(id: string) {
    const res = await ApiClient.get<any>(`/api/v1/sales/my-purchases/${id}`);
    return res.data;
  },
};
