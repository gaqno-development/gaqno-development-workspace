export type Sale = {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
};
