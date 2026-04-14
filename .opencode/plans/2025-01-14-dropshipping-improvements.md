# Dropshipping Platform Improvements - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the dropshipping platform with real customer order processing, storefront publishing, variation selection, inventory sync, and CRM/PDV/ERP integration.

**Architecture:** Extend existing NestJS backend with missing order fulfillment logic, add storefront publishing alongside Shopee, implement variation selectors in Next.js frontend, create scheduled jobs for inventory sync, and expose webhook endpoints for CRM/PDV/ERP integration.

**Tech Stack:** NestJS (backend), Next.js (storefront), React + Vite (admin), Drizzle ORM, PostgreSQL, BullMQ, AliExpress API, Mercado Pago.

---

## Current State Summary

### Working:
- ✅ AliExpress product import with variations
- ✅ Price calculation (USD → BRL + fees + margin)
- ✅ Mercado Pago payments (PIX + Checkout Pro)
- ✅ Storefront product catalog
- ✅ Shopping cart with localStorage persistence
- ✅ Admin CRUD for products, categories, orders

### Missing:
- ❌ Order processor uses placeholder data (lines 69-77 in `order-flow.processor.ts`)
- ❌ Products only publish to Shopee, not storefront
- ❌ No variation selector on product detail page
- ❌ No inventory sync from AliExpress
- ❌ No CRM/PDV/ERP integration

---

## Phase 1: Complete Order Processor (Critical)

### Task 1.1: Update Database Schema for Order Items
**Files:** `gaqno-dropshipping-service/src/database/schema.ts`

First, add `dsProductId` to link order items to AliExpress products:

```typescript
export const sfOrderItems = pgTable(
  "sf_order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => sfOrders.id, { onDelete: "cascade" }),
    sfProductId: uuid("sf_product_id")
      .notNull()
      .references(() => sfProducts.id),
    dsProductId: uuid("ds_product_id"), // NEW: Link to ds_products for AliExpress ordering
    quantity: integer("quantity").notNull(),
    unitPriceBrl: numeric("unit_price_brl", {
      precision: 12,
      scale: 2,
    }).notNull(),
    variationLabel: varchar("variation_label", { length: 255 }),
    subtotalBrl: numeric("subtotal_brl", {
      precision: 12,
      scale: 2,
    }).notNull(),
  },
  (t) => ({
    orderIdx: index("sf_order_items_order_idx").on(t.orderId),
    productIdx: index("sf_order_items_product_idx").on(t.sfProductId),
    dsProductIdx: index("sf_order_items_ds_product_idx").on(t.dsProductId), // NEW
  }),
);
```

**Test:** Run migration and verify schema
```bash
cd gaqno-dropshipping-service && npx drizzle-kit generate && npx drizzle-kit migrate
```

### Task 1.2: Add Foreign Key Relationship
**Files:** `gaqno-dropshipping-service/src/database/schema.ts`

Add reference from sfOrderItems to ds_products:

```typescript
export const sfOrderItems = pgTable(
  "sf_order_items",
  {
    // ... existing fields
    dsProductId: uuid("ds_product_id")
      .references(() => products.id), // Add FK reference
  },
  // ... indexes
);
```

### Task 1.2: Update Order Flow Service to Include Variation Data
**Files:** `gaqno-dropshipping-service/src/order-flow/order-flow.service.ts`

Ensure `ProcessOrderJobData` includes order items with variation info:

```typescript
export interface ProcessOrderJobData {
  readonly orderId: string;
  readonly mpPaymentId: string;
  readonly items: Array<{
    readonly dsProductId: string;
    readonly skuId: string;
    readonly quantity: number;
    readonly variationSelection: Record<string, string>;
  }>;
}
```

### Task 1.3: Create Order Data Fetching Method
**Files:** `gaqno-dropshipping-service/src/messaging/order-flow.processor.ts`

Add a private method to fetch complete order data:

```typescript
private async fetchOrderData(orderId: string): Promise<{
  sfOrder: typeof sfOrders.$inferSelect;
  items: Array<typeof sfOrderItems.$inferSelect>;
} | null> {
  const [sfOrder] = await this.dbService
    .getDb()
    .select()
    .from(sfOrders)
    .where(eq(sfOrders.id, orderId))
    .limit(1);

  if (!sfOrder) {
    this.logger.error(`Order ${orderId} not found in sf_orders`);
    return null;
  }

  const items = await this.dbService
    .getDb()
    .select()
    .from(sfOrderItems)
    .where(eq(sfOrderItems.orderId, orderId));

  return { sfOrder, items };
}
```

**Test:** Verify method returns correct data structure

### Task 1.4: Update AliExpress Order DTO
**Files:** `gaqno-dropshipping-service/src/aliexpress/dto/aliexpress-order.dto.ts`

Extend DTO with all required fields:

```typescript
export interface CreateAliExpressOrderDto {
  productId: string;
  quantity: number;
  skuId: string;
  shippingAddress: string;
  contactName: string;
  phoneNumber: string;
  country: string;
  zipCode?: string;
  city?: string;
  province?: string;
}
```

### Task 1.5: Rewrite Order Processor Process Method
**Files:** `gaqno-dropshipping-service/src/messaging/order-flow.processor.ts`

Replace placeholder implementation:

```typescript
private async processOrder(job: Job<ProcessOrderJobData>): Promise<void> {
  const { orderId, mpPaymentId } = job.data;
  this.logger.log(`Processing order ${orderId} for payment ${mpPaymentId}`);

  try {
    const orderData = await this.fetchOrderData(orderId);
    if (!orderData) {
      throw new Error(`Order ${orderId} not found`);
    }

    const { sfOrder, items } = orderData;
    const shippingAddress = sfOrder.shippingAddress as Record<string, string> | null;
    
    if (!shippingAddress?.street) {
      throw new Error(`Order ${orderId} has incomplete shipping address`);
    }

    const aliExpressOrderIds: string[] = [];
    
    for (const item of items) {
      if (!item.dsProductId) {
        this.logger.warn(`Skipping item ${item.id} - no dsProductId`);
        continue;
      }

      const orderResult = await this.aliExpressService.createDropshippingOrder({
        productId: item.dsProductId,
        quantity: item.quantity,
        skuId: "default", // Will be enhanced with variation support in Phase 3
        shippingAddress: shippingAddress.street,
        contactName: sfOrder.customerName,
        phoneNumber: sfOrder.customerPhone ?? "",
        country: "BR",
        zipCode: shippingAddress.zipCode,
        city: shippingAddress.city,
        province: shippingAddress.state,
      });

      if (!orderResult.success) {
        const errorMsg = `AliExpress order failed: ${orderResult.errorCode} - ${orderResult.errorMessage}`;
        await this.markOrderError(orderId, errorMsg);
        throw new Error(errorMsg);
      }

      aliExpressOrderIds.push(...orderResult.orderIds);
    }

    // Update ds_orders with AliExpress order IDs
    await this.dbService
      .getDb()
      .update(orders)
      .set({
        aliexpressOrderId: aliExpressOrderIds.join(","),
        status: "supplier_ordered",
        updatedAt: new Date(),
      })
      .where(eq(orders.mpExternalReference, orderId));

    // Update sf_orders status
    await this.dbService
      .getDb()
      .update(sfOrders)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(sfOrders.id, orderId));

    // Log success
    await this.dbService.getDb().insert(syncLogs).values({
      action: "order_create",
      referenceId: orderId,
      responsePayload: { 
        orderIds: aliExpressOrderIds,
        itemCount: items.length 
      } as unknown as Record<string, unknown>,
      success: "true",
    });

    this.logger.log(
      `Order ${orderId} successfully processed with ${aliExpressOrderIds.length} AliExpress orders`,
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await this.markOrderError(orderId, message);
    throw error;
  }
}
```

**Test:** 
1. Create test order with shipping address
2. Verify processor fetches correct data
3. Verify AliExpress API receives correct parameters

### Task 1.6: Update AliExpress Service with Full Address
**Files:** `gaqno-dropshipping-service/src/aliexpress/aliexpress.service.ts`

Update `createDropshippingOrder` method:

```typescript
async createDropshippingOrder(
  dto: CreateAliExpressOrderDto,
): Promise<AliExpressOrderResult> {
  const apiName = "aliexpress.ds.order.create";

  const logisticsAddress = JSON.stringify({
    contact_person: dto.contactName,
    address: dto.shippingAddress,
    country: dto.country,
    phone_number: dto.phoneNumber,
    zip: dto.zipCode ?? "",
    city: dto.city ?? "",
    province: dto.province ?? "",
  });

  const productItems = JSON.stringify([
    {
      product_id: dto.productId,
      sku_id: dto.skuId,
      quantity: dto.quantity,
    },
  ]);

  // ... rest of implementation
}
```

### Task 1.7: Update Checkout Service to Store dsProductId
**Files:** `gaqno-dropshipping-service/src/storefront/checkout/checkout.service.ts`

Modify order item creation:

```typescript
private async createOrderItems(
  orderId: string,
  cartItems: CartItem[],
): Promise<void> {
  for (const cartItem of cartItems) {
    // Fetch dsProductId from sfProducts
    const [sfProduct] = await this.dbService
      .getDb()
      .select({ dsProductId: sfProducts.dsProductId })
      .from(sfProducts)
      .where(eq(sfProducts.id, cartItem.sfProductId))
      .limit(1);

    await this.dbService.getDb().insert(sfOrderItems).values({
      orderId,
      sfProductId: cartItem.sfProductId,
      dsProductId: sfProduct?.dsProductId ?? null,
      quantity: cartItem.quantity,
      unitPriceBrl: String(cartItem.price),
      variationLabel: cartItem.variationLabel ?? null,
      subtotalBrl: String(cartItem.price * cartItem.quantity),
    });
  }
}
```

**Test:** Verify order creation includes dsProductId in database

---

## Phase 2: Product Publishing to Storefront

### Task 2.1: Create Storefront Publishing DTO
**Files:** `gaqno-dropshipping-service/src/products/dto/publish-storefront.dto.ts`

```typescript
import { IsString, IsOptional, IsNumber, IsArray, IsObject } from "class-validator";

export class PublishStorefrontDto {
  @IsString()
  dsProductId!: string;

  @IsString()
  customTitle!: string;

  @IsString()
  @IsOptional()
  customDescription?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  sellingPriceBrl!: number;

  @IsArray()
  @IsString({ each: true })
  images!: string[];

  @IsObject()
  @IsOptional()
  variations?: Record<string, unknown>;
}
```

**Test:** Verify DTO validation works with class-validator

### Task 2.2: Add Storefront Publishing Endpoint
**Files:** `gaqno-dropshipping-service/src/products/products.controller.ts`

Add new endpoint:

```typescript
@Post("publish-storefront")
@HttpCode(201)
async publishToStorefront(@Body() dto: PublishStorefrontDto) {
  return this.previewService.publishToStorefront(dto);
}
```

Import the DTO:
```typescript
import { PublishStorefrontDto } from "./dto/publish-storefront.dto.js";
```

### Task 2.3: Implement Storefront Publishing Service
**Files:** `gaqno-dropshipping-service/src/products/product-preview.service.ts`

Add import:
```typescript
import { PublishStorefrontDto } from "./dto/publish-storefront.dto.js";
import { sfProducts } from "../database/schema.js";
```

Add the publishing method:

```typescript
async publishToStorefront(dto: PublishStorefrontDto): Promise<{ sfProductId: string }> {
  // Verify ds_product exists
  const [dsProduct] = await this.dbService
    .getDb()
    .select()
    .from(products)
    .where(eq(products.id, dto.dsProductId))
    .limit(1);

  if (!dsProduct) {
    throw new BadRequestException(`Produto importado ${dto.dsProductId} não encontrado`);
  }

  // Check if already published to storefront
  const [existingSfProduct] = await this.dbService
    .getDb()
    .select()
    .from(sfProducts)
    .where(eq(sfProducts.dsProductId, dto.dsProductId))
    .limit(1);

  if (existingSfProduct) {
    throw new BadRequestException("Produto já publicado na loja");
  }

  // Insert into sf_products
  const [sfProduct] = await this.dbService
    .getDb()
    .insert(sfProducts)
    .values({
      dsProductId: dto.dsProductId,
      customTitle: dto.customTitle,
      customDescription: dto.customDescription ?? null,
      categoryId: dto.categoryId ?? null,
      sellingPriceBrl: String(dto.sellingPriceBrl),
      images: dto.images,
      variations: dto.variations ?? null,
      status: "draft",
      featured: false,
      sortOrder: 0,
    })
    .returning();

  // Update ds_products status
  await this.dbService
    .getDb()
    .update(products)
    .set({
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(products.id, dto.dsProductId));

  // Log the publish action
  await this.dbService.getDb().insert(syncLogs).values({
    action: "product_publish",
    referenceId: dto.dsProductId,
    responsePayload: { 
      sfProductId: sfProduct.id,
      publishedAt: new Date().toISOString(),
    } as unknown as Record<string, unknown>,
    success: "true",
  });

  this.logger.log(`Product ${dto.dsProductId} published to storefront as ${sfProduct.id}`);

  return { sfProductId: sfProduct.id };
}
```

Add imports:
```typescript
import { BadRequestException } from "@nestjs/common";
import { sfProducts } from "../database/schema.js";
```

**Test:**
1. POST to `/products/publish-storefront` with valid data
2. Verify product appears in sf_products table
3. Verify ds_products status updated to "active"
4. Verify sync_logs entry created
5. Test error case: publishing same product twice should fail

### Task 2.3: Update Admin UI to Use Storefront Publishing
**Files:** `gaqno-dropshipping-admin-ui/src/hooks/use-admin-products.ts`

Update the `publish` function to call the new endpoint:

```typescript
const publish = useMutation({
  mutationFn: async (data: {
    dsProductId: string;
    customTitle: string;
    sellingPriceBrl: number;
    categoryId?: string;
    images: string[];
    variations?: Record<string, unknown> | null;
  }) => {
    const res = await fetch(`${API_URL}/products/publish-storefront`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: data.dsProductId,
        customTitle: data.customTitle,
        sellingPriceBrl: data.sellingPriceBrl,
        categoryId: data.categoryId,
        images: data.images,
        variations: data.variations,
      }),
    });
    if (!res.ok) throw new Error("Failed to publish product");
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["importable-products"] });
  },
});
```

---

## Phase 3: Variation Selector on Product Detail Page

### Task 3.1: Create Variation Selector Component
**Files:** `gaqno-dropshipping/components/store/variation-selector.tsx`

```typescript
"use client";

import { useState } from "react";

interface VariationOption {
  readonly name: string;
  readonly value: string;
  readonly imageUrl?: string;
}

interface VariationTier {
  readonly name: string;
  readonly options: VariationOption[];
}

interface SkuMapping {
  readonly skuId: string;
  readonly price: number;
  readonly stock: number;
  readonly combination: Record<string, string>;
}

interface VariationSelectorProps {
  readonly tiers: VariationTier[];
  readonly skuMappings: SkuMapping[];
  readonly basePrice: number;
  readonly onSelectionChange: (selection: {
    skuId: string;
    price: number;
    label: string;
    combination: Record<string, string>;
  } | null) => void;
}

export function VariationSelector({
  tiers,
  skuMappings,
  basePrice,
  onSelectionChange,
}: VariationSelectorProps) {
  const [selection, setSelection] = useState<Record<string, string>>({});

  const handleSelect = (tierName: string, value: string) => {
    const newSelection = { ...selection, [tierName]: value };
    setSelection(newSelection);

    // Check if all tiers are selected
    const allSelected = tiers.every((t) => newSelection[t.name]);
    
    if (allSelected) {
      const matchingSku = skuMappings.find((sku) =>
        Object.entries(sku.combination).every(
          ([key, val]) => newSelection[key] === val
        )
      );

      if (matchingSku && matchingSku.stock > 0) {
        const label = Object.entries(newSelection)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        
        onSelectionChange({
          skuId: matchingSku.skuId,
          price: matchingSku.price,
          label,
          combination: newSelection,
        });
      } else {
        onSelectionChange(null);
      }
    } else {
      onSelectionChange(null);
    }
  };

  const currentPrice = Object.keys(selection).length === tiers.length
    ? skuMappings.find((sku) =>
        Object.entries(sku.combination).every(
          ([key, val]) => selection[key] === val
        )
      )?.price ?? basePrice
    : basePrice;

  const isComplete = tiers.every((t) => selection[t.name]);
  const selectedSku = isComplete
    ? skuMappings.find((sku) =>
        Object.entries(sku.combination).every(
          ([key, val]) => selection[key] === val
        )
      )
    : null;
  const isOutOfStock = selectedSku ? selectedSku.stock <= 0 : false;

  return (
    <div className="space-y-4">
      {tiers.map((tier) => (
        <div key={tier.name}>
          <h4 className="text-sm font-medium text-neutral-700 mb-2">
            {tier.name}
          </h4>
          <div className="flex flex-wrap gap-2">
            {tier.options.map((option) => {
              const isSelected = selection[tier.name] === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(tier.name, option.value)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  {option.imageUrl ? (
                    <span className="flex items-center gap-2">
                      <img
                        src={option.imageUrl}
                        alt={option.value}
                        className="h-4 w-4 rounded object-cover"
                      />
                      {option.value}
                    </span>
                  ) : (
                    option.value
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="pt-2 border-t">
        <p className="text-lg font-semibold">
          R$ {currentPrice.toFixed(2)}
        </p>
        {isComplete && selectedSku && (
          <p className={`text-sm ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
            {isOutOfStock ? "Fora de estoque" : `${selectedSku.stock} em estoque`}
          </p>
        )}
        {isComplete && !selectedSku && (
          <p className="text-sm text-red-600">Combinação não disponível</p>
        )}
      </div>
    </div>
  );
}
```

### Task 3.2: Update Product Detail Page with Variation Selector
**Files:** `gaqno-dropshipping/app/(loja)/produto/[id]/page.tsx`

```typescript
import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductById } from "@/lib/actions/catalog-actions";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { VariationSelector } from "@/components/store/variation-selector";
import { Metadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductById(params.id).catch(() => null);
  if (!product) return { title: "Produto não encontrado" };
  
  return {
    title: String(product.customTitle ?? ""),
    description: String(product.customDescription ?? "").slice(0, 160),
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductById(params.id).catch(() => null);
  if (!product) notFound();

  const images = Array.isArray(product.images) ? (product.images as string[]) : [];
  const title = String(product.customTitle ?? "");
  const description = product.customDescription
    ? String(product.customDescription)
    : null;
  const price = Number(product.sellingPriceBrl ?? 0);
  const category = product.category as Record<string, unknown> | null;
  
  // Parse variations from product data
  const variations = product.variations as {
    tiers?: Array<{
      name: string;
      options: Array<{ name: string; value: string; imageUrl?: string }>;
    }>;
    skuMappings?: Array<{
      skuId: string;
      price: number;
      stock: number;
      combination: Record<string, string>;
    }>;
  } | null;

  const hasVariations = variations && variations.tiers && variations.tiers.length > 0;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        {images.length > 0 ? (
          <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
            <Image
              src={images[0]}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
            Sem imagem
          </div>
        )}

        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(1, 5).map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100"
              >
                <Image
                  src={img}
                  alt={`${title} - ${idx + 2}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {category && (
          <p className="text-sm text-neutral-500">
            {String(category.name)}
          </p>
        )}

        <h1 className="text-3xl font-bold">{title}</h1>

        {!hasVariations && (
          <p className="text-3xl font-bold text-primary">
            R$ {price.toFixed(2)}
          </p>
        )}

        {description && (
          <div className="prose prose-sm max-w-none text-neutral-600">
            <p>{description}</p>
          </div>
        )}

        {hasVariations ? (
          <VariationSelectorClient
            tiers={variations.tiers!}
            skuMappings={variations.skuMappings ?? []}
            basePrice={price}
            productId={params.id}
            title={title}
            image={images[0] ?? ""}
          />
        ) : (
          <AddToCartButton
            sfProductId={String(product.id)}
            title={title}
            price={price}
            image={images[0] ?? ""}
          />
        )}
      </div>
    </div>
  );
}

// Client component wrapper for variation selector
"use client";

import { useState } from "react";

function VariationSelectorClient({
  tiers,
  skuMappings,
  basePrice,
  productId,
  title,
  image,
}: {
  tiers: Array<{
    name: string;
    options: Array<{ name: string; value: string; imageUrl?: string }>;
  }>;
  skuMappings: Array<{
    skuId: string;
    price: number;
    stock: number;
    combination: Record<string, string>;
  }>;
  basePrice: number;
  productId: string;
  title: string;
  image: string;
}) {
  const [selection, setSelection] = useState<{
    skuId: string;
    price: number;
    label: string;
    combination: Record<string, string>;
  } | null>(null);

  return (
    <>
      <VariationSelector
        tiers={tiers}
        skuMappings={skuMappings}
        basePrice={basePrice}
        onSelectionChange={setSelection}
      />
      
      <AddToCartButton
        sfProductId={productId}
        title={title}
        price={selection?.price ?? basePrice}
        image={image}
        variationLabel={selection?.label}
        disabled={!selection}
      />
    </>
  );
}
```

### Task 3.3: Update AddToCartButton to Support Disabled State
**Files:** `gaqno-dropshipping/components/store/add-to-cart-button.tsx`

```typescript
"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

interface AddToCartButtonProps {
  readonly sfProductId: string;
  readonly title: string;
  readonly price: number;
  readonly image: string;
  readonly variationLabel?: string;
  readonly disabled?: boolean;
}

export function AddToCartButton({
  sfProductId,
  title,
  price,
  image,
  variationLabel,
  disabled = false,
}: AddToCartButtonProps) {
  const { addItem } = useCart();

  const handleClick = () => {
    if (disabled) return;
    addItem({ sfProductId, title, price, image, variationLabel });
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ShoppingCart className="h-4 w-4" />
      {disabled ? "Selecione as variações" : "Adicionar ao Carrinho"}
    </button>
  );
}
```

---

## Phase 4: Inventory Sync from AliExpress

### Task 4.1: Create Inventory Sync Service
**Files:** `gaqno-dropshipping-service/src/aliexpress/inventory-sync.service.ts`

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { eq, inArray } from "drizzle-orm";
import { AliExpressService } from "./aliexpress.service.js";
import { DatabaseService } from "../database/db.service.js";
import { products, sfProducts, syncLogs } from "../database/schema.js";

@Injectable()
export class InventorySyncService {
  private readonly logger = new Logger(InventorySyncService.name);

  constructor(
    private readonly aliExpressService: AliExpressService,
    private readonly dbService: DatabaseService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async syncInventory(): Promise<void> {
    this.logger.log("Starting inventory sync...");

    try {
      // Get all active products that need syncing
      const activeProducts = await this.dbService
        .getDb()
        .select()
        .from(products)
        .where(eq(products.status, "active"));

      for (const product of activeProducts) {
        try {
          await this.syncProductInventory(product);
        } catch (error) {
          this.logger.error(
            `Failed to sync inventory for product ${product.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.log(`Inventory sync completed for ${activeProducts.length} products`);
    } catch (error) {
      this.logger.error(`Inventory sync failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async syncProductInventory(product: typeof products.$inferSelect): Promise<void> {
    // Fetch current product data from AliExpress
    const aliProduct = await this.aliExpressService.getProductDetails(
      product.aliexpressId,
    );

    // Build SKU inventory map
    const skuInventory = aliProduct.skus.map((sku) => ({
      skuId: sku.skuId,
      stock: sku.stock,
      available: sku.available && sku.stock > 0,
      price: sku.price,
    }));

    // Update ds_products with new stock data
    const currentVariations = product.mappedVariations as Record<string, unknown> | null;
    
    await this.dbService
      .getDb()
      .update(products)
      .set({
        mappedVariations: {
          ...currentVariations,
          skuInventory,
          lastSyncAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));

    // Update sf_products variations with new stock
    const sfProduct = await this.dbService
      .getDb()
      .select()
      .from(sfProducts)
      .where(eq(sfProducts.dsProductId, product.id))
      .limit(1);

    if (sfProduct[0]) {
      const sfVariations = sfProduct[0].variations as Record<string, unknown> | null;
      
      await this.dbService
        .getDb()
        .update(sfProducts)
        .set({
          variations: {
            ...sfVariations,
            skuMappings: this.mapSkuInventoryToStorefront(skuInventory, sfVariations),
            lastSyncAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        })
        .where(eq(sfProducts.id, sfProduct[0].id));
    }

    // Log sync
    await this.dbService.getDb().insert(syncLogs).values({
      action: "product_fetch",
      referenceId: product.id,
      requestPayload: { aliexpressId: product.aliexpressId },
      responsePayload: { skuInventory } as unknown as Record<string, unknown>,
      success: "true",
    });

    this.logger.log(`Synced inventory for product ${product.id}`);
  }

  private mapSkuInventoryToStorefront(
    skuInventory: Array<{ skuId: string; stock: number; available: boolean; price: number }>,
    sfVariations: Record<string, unknown> | null,
  ): unknown {
    // Map the inventory data to the storefront variation format
    const existingMappings = (sfVariations?.skuMappings ?? []) as Array<{
      skuId: string;
      price: number;
      stock: number;
      combination: Record<string, string>;
    }>;

    return existingMappings.map((mapping) => {
      const inventory = skuInventory.find((s) => s.skuId === mapping.skuId);
      return {
        ...mapping,
        stock: inventory?.stock ?? 0,
        available: inventory?.available ?? false,
        price: inventory?.price ?? mapping.price,
      };
    });
  }
}
```

### Task 4.2: Register Schedule Module
**Files:** `gaqno-dropshipping-service/src/app.module.ts`

Add ScheduleModule import:

```typescript
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    // ... existing imports
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
```

### Task 4.3: Add Schedule Dependency
**Files:** `gaqno-dropshipping-service/package.json`

```json
{
  "dependencies": {
    "@nestjs/schedule": "^4.0.0"
  }
}
```

---

## Phase 5: CRM/PDV/ERP Integration

### Task 5.1: Create Webhook Service for External Integrations
**Files:** `gaqno-dropshipping-service/src/integrations/webhook.service.ts`

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { eq } from "drizzle-orm";
import { DatabaseService } from "../database/db.service.js";
import { sfOrders, sfOrderItems, orders } from "../database/schema.js";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly dbService: DatabaseService,
  ) {}

  async notifyOrderCreated(orderId: string): Promise<void> {
    const order = await this.getOrderWithItems(orderId);
    if (!order) return;

    await this.sendWebhook("order.created", order);
  }

  async notifyOrderPaid(orderId: string): Promise<void> {
    const order = await this.getOrderWithItems(orderId);
    if (!order) return;

    await this.sendWebhook("order.paid", order);
  }

  async notifyOrderShipped(orderId: string, trackingCode?: string): Promise<void> {
    const order = await this.getOrderWithItems(orderId);
    if (!order) return;

    await this.sendWebhook("order.shipped", { ...order, trackingCode });
  }

  async notifyOrderDelivered(orderId: string): Promise<void> {
    const order = await this.getOrderWithItems(orderId);
    if (!order) return;

    await this.sendWebhook("order.delivered", order);
  }

  private async getOrderWithItems(orderId: string) {
    const [order] = await this.dbService
      .getDb()
      .select()
      .from(sfOrders)
      .where(eq(sfOrders.id, orderId))
      .limit(1);

    if (!order) return null;

    const items = await this.dbService
      .getDb()
      .select()
      .from(sfOrderItems)
      .where(eq(sfOrderItems.orderId, orderId));

    const dsOrder = await this.dbService
      .getDb()
      .select()
      .from(orders)
      .where(eq(orders.mpExternalReference, orderId))
      .limit(1);

    return {
      ...order,
      items,
      aliexpressOrderId: dsOrder[0]?.aliexpressOrderId,
    };
  }

  private async sendWebhook(event: string, data: unknown): Promise<void> {
    const webhookUrls = this.getWebhookUrls();
    
    for (const url of webhookUrls) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Event": event,
            "X-Webhook-Secret": this.config.get("WEBHOOK_SECRET") ?? "",
          },
          body: JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            data,
          }),
        });

        if (!response.ok) {
          this.logger.error(`Webhook failed for ${url}: ${response.status}`);
        }
      } catch (error) {
        this.logger.error(`Webhook error for ${url}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private getWebhookUrls(): string[] {
    const urls: string[] = [];
    
    // CRM webhook
    const crmUrl = this.config.get<string>("CRM_WEBHOOK_URL");
    if (crmUrl) urls.push(crmUrl);

    // ERP webhook
    const erpUrl = this.config.get<string>("ERP_WEBHOOK_URL");
    if (erpUrl) urls.push(erpUrl);

    // PDV webhook
    const pdvUrl = this.config.get<string>("PDV_WEBHOOK_URL");
    if (pdvUrl) urls.push(pdvUrl);

    return urls;
  }
}
```

### Task 5.2: Create Integration Controller
**Files:** `gaqno-dropshipping-service/src/integrations/integration.controller.ts`

```typescript
import { Controller, Post, Body, Headers, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AdminService } from "../storefront/admin/admin.service.js";

@Controller("integrations")
export class IntegrationController {
  constructor(
    private readonly config: ConfigService,
    private readonly adminService: AdminService,
  ) {}

  @Post("orders/:id/status")
  async updateOrderStatus(
    @Param("id") orderId: string,
    @Body() dto: { status: string; trackingCode?: string },
    @Headers("x-api-key") apiKey: string,
  ) {
    this.validateApiKey(apiKey);
    
    // Update order status (implementation depends on your needs)
    return { success: true, orderId, status: dto.status };
  }

  @Post("products/sync")
  async syncProducts(
    @Headers("x-api-key") apiKey: string,
  ) {
    this.validateApiKey(apiKey);
    
    // Trigger manual inventory sync
    return { success: true, message: "Sync triggered" };
  }

  private validateApiKey(apiKey: string): void {
    const validKey = this.config.get<string>("INTEGRATION_API_KEY");
    if (!validKey || apiKey !== validKey) {
      throw new UnauthorizedException("Invalid API key");
    }
  }
}
```

### Task 5.3: Add Environment Variables
**Files:** `gaqno-dropshipping-service/.env.example`

```bash
# Webhook URLs for CRM/ERP/PDV integration
CRM_WEBHOOK_URL=https://crm.gaqno.com.br/webhooks/dropshipping
ERP_WEBHOOK_URL=https://erp.gaqno.com.br/webhooks/dropshipping
PDV_WEBHOOK_URL=https://pdv.gaqno.com.br/webhooks/dropshipping
WEBHOOK_SECRET=your-webhook-secret-here
INTEGRATION_API_KEY=your-integration-api-key-here
```

---

## Phase 6: Admin UI Enhancements

### Task 6.1: Add Order Detail View
**Files:** `gaqno-dropshipping-admin-ui/src/pages/OrderDetailPage.tsx`

```typescript
import { useParams } from "react-router-dom";
import { useOrderDetail } from "@/hooks/use-admin-orders";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrderDetail(id!);

  if (isLoading) return <p>Carregando...</p>;
  if (!order) return <p>Pedido não encontrado</p>;

  const STATUS_LABELS: Record<string, string> = {
    pending: "Pendente",
    awaiting_payment: "Aguardando Pagamento",
    paid: "Pago",
    processing: "Processando",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pedido #{id?.slice(0, 8)}</h2>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
          {STATUS_LABELS[String(order.status)]}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Cliente</h3>
          <p>{String(order.customerName)}</p>
          <p className="text-sm text-muted-foreground">{String(order.customerEmail)}</p>
          <p className="text-sm text-muted-foreground">{String(order.customerPhone)}</p>
          {order.customerCpf && (
            <p className="text-sm text-muted-foreground">CPF: {String(order.customerCpf)}</p>
          )}
        </div>

        {/* Shipping Address */}
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Endereço de Entrega</h3>
          {order.shippingAddress ? (
            <div className="text-sm">
              <p>{(order.shippingAddress as Record<string, string>).street}</p>
              <p>{(order.shippingAddress as Record<string, string>).city}, {(order.shippingAddress as Record<string, string>).state}</p>
              <p>CEP: {(order.shippingAddress as Record<string, string>).zipCode}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">Endereço não informado</p>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left">Produto</th>
              <th className="px-4 py-3 text-left">Variação</th>
              <th className="px-4 py-3 text-right">Qtd</th>
              <th className="px-4 py-3 text-right">Preço</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: Record<string, unknown>) => (
              <tr key={String(item.id)} className="border-b">
                <td className="px-4 py-3">{String(item.sfProductId).slice(0, 8)}...</td>
                <td className="px-4 py-3">{String(item.variationLabel ?? "—")}</td>
                <td className="px-4 py-3 text-right">{String(item.quantity)}</td>
                <td className="px-4 py-3 text-right">R$ {Number(item.unitPriceBrl).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">R$ {Number(item.subtotalBrl).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50">
              <td colSpan={4} className="px-4 py-3 text-right font-medium">Total:</td>
              <td className="px-4 py-3 text-right font-bold">
                R$ {Number(order.totalBrl).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* AliExpress Order Info */}
      {order.dsOrders?.[0]?.aliexpressOrderId && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-2">AliExpress</h3>
          <p className="text-sm text-muted-foreground">
            Pedido: {String(order.dsOrders[0].aliexpressOrderId)}
          </p>
        </div>
      )}
    </div>
  );
}
```

### Task 6.2: Add Hook for Order Detail
**Files:** `gaqno-dropshipping-admin-ui/src/hooks/use-admin-orders.ts`

```typescript
export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json();
    },
  });
}
```

### Task 6.3: Update App Routes
**Files:** `gaqno-dropshipping-admin-ui/src/App.tsx`

Add route for order detail:

```typescript
import { OrderDetailPage } from "./pages/OrderDetailPage";

// In routes:
<Route path="/pedidos/:id" element={<OrderDetailPage />} />
```

### Task 6.4: Update Orders List to Link to Detail
**Files:** `gaqno-dropshipping-admin-ui/src/pages/OrdersPage.tsx`

Wrap order ID in link:

```typescript
import { Link } from "react-router-dom";

// In table:
<td className="px-4 py-3 font-mono text-xs">
  <Link 
    to={`/dropshipping-admin/pedidos/${String(order.id)}`}
    className="text-primary hover:underline"
  >
    {String(order.id).slice(0, 8)}...
  </Link>
</td>
```

---

## Detailed Testing Plan

### Phase 1 Tests (Order Processor)

**Unit Test 1.1: Order Data Fetching**
```typescript
// Test fetchOrderData returns correct structure
it('should return order with items', async () => {
  const result = await processor.fetchOrderData('test-order-id');
  expect(result).toHaveProperty('sfOrder');
  expect(result).toHaveProperty('items');
  expect(result?.items.length).toBeGreaterThan(0);
});
```

**Unit Test 1.2: AliExpress Order Creation**
```typescript
// Test processOrder calls AliExpress API with correct data
it('should create AliExpress order with customer data', async () => {
  const mockOrder = {
    id: 'order-123',
    customerName: 'John Doe',
    shippingAddress: { street: '123 Main St', city: 'São Paulo', state: 'SP', zipCode: '01000-000' }
  };
  // Verify API call includes all fields
});
```

**Integration Test 1.3: End-to-End Order Flow**
1. Create cart with products
2. Complete checkout with shipping address
3. Verify sfOrderItems includes dsProductId
4. Trigger payment webhook
5. Verify order processor runs
6. Check AliExpress API called with correct data
7. Verify order status updated

### Phase 2 Tests (Storefront Publishing)

**Unit Test 2.1: DTO Validation**
```typescript
// Test PublishStorefrontDto validates required fields
it('should reject missing required fields', async () => {
  const dto = { customTitle: 'Test' }; // missing dsProductId
  await expect(validate(dto)).rejects.toThrow();
});
```

**Integration Test 2.2: Publishing Flow**
1. Import product from AliExpress
2. Call POST /products/publish-storefront
3. Verify product in sf_products table
4. Verify ds_products status = "active"
5. Verify sync_logs entry
6. Test duplicate publish returns 400

### Phase 3 Tests (Variation Selector)

**Unit Test 3.1: Variation Logic**
```typescript
// Test tier selection finds correct SKU
it('should select correct SKU for variation combination', () => {
  const tiers = [{ name: 'Color', options: [{ value: 'Red' }] }];
  const skuMappings = [{ skuId: 'sku-1', combination: { Color: 'Red' }, stock: 5 }];
  // Test selection logic
});
```

**E2E Test 3.2: Purchase with Variation**
1. Visit product page with variations
2. Select color and size
3. Verify price updates
4. Verify stock displayed
5. Add to cart
6. Complete checkout
7. Verify order includes variation data

### Phase 4 Tests (Inventory Sync)

**Unit Test 4.1: Inventory Mapping**
```typescript
// Test SKU inventory maps correctly to storefront format
it('should map AliExpress inventory to sf_products', () => {
  const aliInventory = [{ skuId: '1', stock: 10, available: true }];
  const mappings = [{ skuId: '1', combination: { Color: 'Red' } }];
  // Test mapping logic
});
```

**Integration Test 4.2: Sync Job**
1. Mock AliExpress API response
2. Run sync job
3. Verify ds_products updated
4. Verify sf_products updated
5. Verify sync_logs entry

### Phase 5 Tests (CRM/ERP/PDV Integration)

**Unit Test 5.1: Webhook Delivery**
```typescript
// Test webhook sent to all configured URLs
it('should send webhook to CRM, ERP, and PDV', async () => {
  const urls = ['https://crm.test/webhook', 'https://erp.test/webhook'];
  await webhookService.notifyOrderCreated('order-123');
  // Verify fetch called for each URL
});
```

**Integration Test 5.2: Webhook Payload**
1. Create order
2. Trigger order.paid webhook
3. Verify payload includes all order details
4. Verify headers include X-Webhook-Event
5. Verify signature/header validation

---

## Migration & Deployment Checklist

### Pre-Deployment (Staging)
- [ ] Run database migration: `npx drizzle-kit migrate`
- [ ] Verify migration applied successfully
- [ ] Install @nestjs/schedule: `npm install @nestjs/schedule`
- [ ] Update .env with new variables (WEBHOOK_SECRET, INTEGRATION_API_KEY)
- [ ] Build and test locally
- [ ] Run unit tests: `npm test`
- [ ] Run integration tests

### Deployment Order (Important!)
1. **Deploy Backend Service First** (Database changes)
   ```bash
   ./build-all.sh gaqno-dropshipping-service
   # Deploy to production
   ```

2. **Test Backend API**
   - Verify `/products/publish-storefront` endpoint
   - Test order processing with sample data
   - Verify webhook endpoints work

3. **Deploy Admin UI**
   ```bash
   ./build-all.sh gaqno-dropshipping-admin-ui
   # Deploy to production
   ```

4. **Deploy Storefront**
   ```bash
   ./build-all.sh gaqno-dropshipping
   # Deploy to production
   ```

### Post-Deployment Verification
- [ ] Import test product from AliExpress
- [ ] Publish to storefront via admin UI
- [ ] Verify product appears on storefront
- [ ] Create test order with payment
- [ ] Verify order processor runs
- [ ] Check webhook delivery logs
- [ ] Monitor inventory sync job (wait 1 hour)
- [ ] Verify sync_logs table has entries

### Production Configuration
Add to production `.env`:
```bash
# Webhook URLs
CRM_WEBHOOK_URL=https://crm.gaqno.com.br/webhooks/dropshipping
ERP_WEBHOOK_URL=https://erp.gaqno.com.br/webhooks/dropshipping
PDV_WEBHOOK_URL=https://pdv.gaqno.com.br/webhooks/dropshipping
WEBHOOK_SECRET=your-secure-random-secret
INTEGRATION_API_KEY=your-secure-api-key

# AliExpress (verify these are set)
ALIEXPRESS_APP_KEY=
ALIEXPRESS_APP_SECRET=
ALIEXPRESS_ACCESS_TOKEN=
```

---

## Rollback Plan

### Immediate Rollback (If Critical Issues)
1. Stop dropshipping-service container
2. Restore database from pre-deployment backup:
   ```bash
   pg_restore --dbname=gaqno_dropshipping_db backup_pre_deploy.sql
   ```
3. Deploy previous Docker image:
   ```bash
   docker pull gaqno/dropshipping-service:previous
   docker-compose up -d
   ```

### Feature-Specific Rollbacks

**Order Processor Issues:**
- Disable order processing queue
- Manually process orders via admin API
- Fix code and redeploy

**Storefront Publishing Issues:**
- Re-enable Shopee publishing temporarily
- Fix storefront publishing
- Switch back when ready

**Inventory Sync Issues:**
- Disable cron job:
  ```typescript
  // Comment out @Cron decorator
  ```
- Manual sync via admin endpoint

**Webhook Issues:**
- Disable webhook URLs in env
- Check webhook delivery logs
- Fix and re-enable

---

## Execution Strategy

### Option A: Sequential Implementation (Recommended)
Implement phases in order, fully testing each before moving to next.

**Timeline:** 4-5 days
- Phase 1: 1.5 days (Critical - most complex)
- Phase 2: 0.5 days
- Phase 3: 1 day
- Phase 4: 0.5 days
- Phase 5: 0.5 days
- Phase 6: 0.5 days
- Testing & Bug Fixes: 1 day

### Option B: Parallel Implementation
Implement independent phases in parallel using subagents.

**Timeline:** 2-3 days
- Subagent 1: Phase 1 (Order Processor)
- Subagent 2: Phase 2 & 3 (Publishing + Variations)
- Subagent 3: Phase 4 & 5 (Inventory + Integrations)
- Subagent 4: Phase 6 (Admin UI)

**Risk:** Higher chance of integration issues

### Option C: MVP First
Implement only critical features first.

**Timeline:** 2 days
- Phase 1 only: Working order processor
- Deploy and test
- Add other phases incrementally

---

## Recommended Priority Order

1. **Phase 1 (Order Processor)** - CRITICAL - Blocking all orders
2. **Phase 2 (Storefront Publishing)** - HIGH - Needed to add products
3. **Phase 3 (Variation Selector)** - HIGH - Improves UX
4. **Phase 6 (Admin Order Detail)** - MEDIUM - Helps support team
5. **Phase 4 (Inventory Sync)** - MEDIUM - Automation
6. **Phase 5 (CRM/ERP Integration)** - LOW - Nice to have

---

**Recommended Approach:** Start with Option C (MVP) - get order processor working first, then incrementally add features.

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Order processor fetches real customer data from sfOrders
- ✅ AliExpress API receives complete shipping address
- ✅ Orders created successfully on AliExpress
- ✅ Order status updates correctly (paid → processing)
- ✅ Error handling works (failed orders marked with error logs)

### Phase 2 Complete When:
- ✅ Admin can publish products to storefront
- ✅ Products appear in storefront catalog
- ✅ ds_products status updates to "active"
- ✅ Duplicate publish attempts are rejected

### Phase 3 Complete When:
- ✅ Customers can select product variations (size/color)
- ✅ Price updates based on selected variation
- ✅ Stock status displayed for each variation
- ✅ Variation data saved in order

### Phase 4 Complete When:
- ✅ Inventory sync runs every hour
- ✅ Stock levels update from AliExpress
- ✅ Out-of-stock products marked unavailable
- ✅ Sync history logged

### Phase 5 Complete When:
- ✅ Webhooks sent on order events
- ✅ CRM/ERP/PDV receive order data
- ✅ Webhook signatures verified
- ✅ Failed webhooks retried

### Phase 6 Complete When:
- ✅ Admin can view order details
- ✅ Customer info and shipping address visible
- ✅ Order items list with variations
- ✅ AliExpress order ID displayed

---

## File Summary

### Modified Files (Backend):
1. `gaqno-dropshipping-service/src/database/schema.ts` - Add dsProductId
2. `gaqno-dropshipping-service/src/messaging/order-flow.processor.ts` - Real order processing
3. `gaqno-dropshipping-service/src/aliexpress/aliexpress.service.ts` - Full address support
4. `gaqno-dropshipping-service/src/aliexpress/dto/aliexpress-order.dto.ts` - Extended DTO
5. `gaqno-dropshipping-service/src/storefront/checkout/checkout.service.ts` - Store dsProductId
6. `gaqno-dropshipping-service/src/products/products.controller.ts` - New endpoint
7. `gaqno-dropshipping-service/src/products/dto/publish-storefront.dto.ts` - New DTO
8. `gaqno-dropshipping-service/src/products/product-preview.service.ts` - Publishing logic
9. `gaqno-dropshipping-service/src/aliexpress/inventory-sync.service.ts` - New service
10. `gaqno-dropshipping-service/src/app.module.ts` - ScheduleModule
11. `gaqno-dropshipping-service/src/integrations/webhook.service.ts` - New service
12. `gaqno-dropshipping-service/src/integrations/integration.controller.ts` - New controller

### Modified Files (Frontend - Storefront):
1. `gaqno-dropshipping/components/store/variation-selector.tsx` - New component
2. `gaqno-dropshipping/app/(loja)/produto/[id]/page.tsx` - Add variation selector
3. `gaqno-dropshipping/components/store/add-to-cart-button.tsx` - Add disabled state

### Modified Files (Frontend - Admin):
1. `gaqno-dropshipping-admin-ui/src/hooks/use-admin-products.ts` - Update publish hook
2. `gaqno-dropshipping-admin-ui/src/pages/OrderDetailPage.tsx` - New page
3. `gaqno-dropshipping-admin-ui/src/hooks/use-admin-orders.ts` - Add detail hook
4. `gaqno-dropshipping-admin-ui/src/App.tsx` - Add route
5. `gaqno-dropshipping-admin-ui/src/pages/OrdersPage.tsx` - Add links

### New Dependencies:
- `@nestjs/schedule` ^4.0.0

---

## Quick Start Commands

```bash
# 1. Install dependencies
cd gaqno-dropshipping-service && npm install @nestjs/schedule

# 2. Run database migration
cd gaqno-dropshipping-service && npx drizzle-kit generate && npx drizzle-kit migrate

# 3. Build services
./build-all.sh gaqno-dropshipping-service gaqno-dropshipping-admin-ui gaqno-dropshipping

# 4. Run tests
cd gaqno-dropshipping-service && npm test
cd gaqno-dropshipping && npm test
cd gaqno-dropshipping-admin-ui && npm test

# 5. Deploy
# Use your deployment process (Dokploy, Docker Compose, etc.)
```
