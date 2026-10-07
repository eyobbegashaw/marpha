import { ApiClient } from './apiClient';

export interface Product {
  id: string;
  generic_name: string;
  brand_name: string;
  strength: string;
  dosage_form: string;
  category_name?: string;
  category_name_am?: string;
  unit_price: string | number;
  barcode?: string;
  sku?: string;
  min_shelf_quantity: number;
  min_warehouse_quantity: number;
  is_prescription_required: boolean;
  is_active: boolean;
  created_at: string;
}

export interface StockAvailabilityResponse {
  product: {
    id: string;
    genericName: string;
    brandName: string;
    strength: string;
    dosageForm: string;
    unitPrice: number;
  };
  overallAvailability: {
    isAvailable: boolean;
    totalStock: number;
    status: string;
    systemAction: string;
  };
  branches: Array<{
    branchId: string;
    branchName: string;
    city: string;
    shelfStock: number;
    warehouseStock: number;
    totalStock: number;
    status: string;
  }>;
}

export const productService = {
  async getProducts(search?: string, categoryId?: string) {
    const res = await ApiClient.get<Product[]>('/api/v1/products', { search, categoryId });
    return res.data;
  },

  async getProductById(id: string) {
    const res = await ApiClient.get<any>(`/api/v1/products/${id}`);
    return res.data;
  },

  async getProductAvailability(id: string) {
    const res = await ApiClient.get<StockAvailabilityResponse>(`/api/v1/products/${id}/availability`);
    return res.data;
  },

  async getCategories() {
    const res = await ApiClient.get<any[]>('/api/v1/categories');
    return res.data;
  },

  async updatePrice(id: string, newPrice: number, reason: string) {
    const res = await ApiClient.patch<any>(`/api/v1/products/${id}/price`, { newPrice, reason });
    return res.data;
  },

  async getPriceHistory(id: string) {
    const res = await ApiClient.get<any[]>(`/api/v1/products/${id}/price-history`);
    return res.data;
  },
};
