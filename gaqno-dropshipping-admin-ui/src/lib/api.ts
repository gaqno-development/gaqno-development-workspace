import { coreAxiosClient } from "@gaqno-development/frontcore";

const BASE = "/dropshipping/v1/admin";

export const adminApi = {
  getCategories: () => coreAxiosClient.sso.get(`${BASE}/categories`),

  createCategory: (data: Record<string, unknown>) =>
    coreAxiosClient.sso.post(`${BASE}/categories`, data),

  updateCategory: (id: string, data: Record<string, unknown>) =>
    coreAxiosClient.sso.put(`${BASE}/categories/${id}`, data),

  deleteCategory: (id: string) =>
    coreAxiosClient.sso.delete(`${BASE}/categories/${id}`),

  getProducts: (params?: Record<string, string>) =>
    coreAxiosClient.sso.get(`${BASE}/products`, { params }),

  getImportableProducts: () =>
    coreAxiosClient.sso.get(`${BASE}/products/importable`),

  publishProduct: (data: Record<string, unknown>) =>
    coreAxiosClient.sso.post(`${BASE}/products/publish`, data),

  updateProduct: (id: string, data: Record<string, unknown>) =>
    coreAxiosClient.sso.put(`${BASE}/products/${id}`, data),

  updateProductStatus: (id: string, status: string) =>
    coreAxiosClient.sso.patch(`${BASE}/products/${id}/status`, { status }),

  getOrders: (params?: Record<string, string>) =>
    coreAxiosClient.sso.get(`${BASE}/orders`, { params }),

  getOrderDetail: (id: string) =>
    coreAxiosClient.sso.get(`${BASE}/orders/${id}`),
};
