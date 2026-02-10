export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
  createdAt: Date;
  updatedAt: Date;
};
