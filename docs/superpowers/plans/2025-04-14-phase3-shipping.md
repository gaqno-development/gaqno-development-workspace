# gaqno-shop Production Readiness - Phase 3: Shipping Integration

> **For agentic workers:** Use superpowers:subagent-driven-development to implement tasks in this phase.

**Goal:** Implement real-time shipping calculation with Correios and Jadlog APIs, shipping method management, and tracking integration.

**Estimated Duration:** 2 weeks

---

## Phase 3 Tasks

### Task 3.1: Create Shipping Database Schema

**File:** `gaqno-shop-service/src/database/schema.ts` (add to existing)

```typescript
// shipping_methods table
export const shippingMethods = pgTable(
  "shipping_methods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 50 }).notNull(),
    carrier: varchar("carrier", { length: 50 }).notNull(), // "correios", "jadlog", "dropshipping", "custom"
    serviceCode: varchar("service_code", { length: 50 }), // Correios service code
    isActive: boolean("is_active").default(true),
    isDefault: boolean("is_default").default(false),
    freeShippingThreshold: decimal("free_shipping_threshold", { precision: 10, scale: 2 }),
    flatRate: decimal("flat_rate", { precision: 10, scale: 2 }),
    handlingDays: integer("handling_days").default(1),
    estimatedDeliveryDaysMin: integer("estimated_delivery_days_min"),
    estimatedDeliveryDaysMax: integer("estimated_delivery_days_max"),
    settings: jsonb("settings").default({}),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("shipping_methods_tenant_idx").on(table.tenantId),
    tenantSlugIdx: uniqueIndex("shipping_methods_tenant_slug_idx").on(table.tenantId, table.slug),
  })
);

// shipping_rates_cache table
export const shippingRatesCache = pgTable(
  "shipping_rates_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    cacheKey: varchar("cache_key", { length: 255 }).notNull(),
    cep: varchar("cep", { length: 9 }).notNull(),
    productIds: jsonb("product_ids").notNull(),
    rates: jsonb("rates").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("shipping_cache_tenant_idx").on(table.tenantId),
    cacheKeyIdx: uniqueIndex("shipping_cache_key_idx").on(table.tenantId, table.cacheKey),
    expiresAtIdx: index("shipping_cache_expires_idx").on(table.expiresAt),
  })
);

// Type exports
export type ShippingMethod = typeof shippingMethods.$inferSelect;
export type NewShippingMethod = typeof shippingMethods.$inferInsert;
export type ShippingRatesCache = typeof shippingRatesCache.$inferSelect;
```

**Generate migration:**
```bash
cd gaqno-shop-service
npx drizzle-kit generate
npm run migrate
```

### Task 3.2: Create Correios Integration Service

**File:** `gaqno-shop-service/src/shipping/correios.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

interface CorreiosCredentials {
  usuario: string;
  senha: string;
  codigoAdministrativo: string;
}

interface ShippingDimensions {
  weight: number; // in kg
  length: number; // in cm
  width: number; // in cm
  height: number; // in cm
}

interface CorreiosRate {
  codigo: string;
  valor: string;
  prazoEntrega: string;
  valorSemAdicionais: string;
  valorMaoPropria: string;
  valorAvisoRecebimento: string;
  valorValorDeclarado: string;
  entregaDomiciliar: string;
  entregaSabado: string;
  erro?: {
    codigo: string;
    msg: string;
  };
}

@Injectable()
export class CorreiosService {
  private readonly baseUrl = 'http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx';
  private credentials: CorreiosCredentials;

  constructor(private readonly configService: ConfigService) {
    this.credentials = {
      usuario: this.configService.get('CORREIOS_USUARIO', ''),
      senha: this.configService.get('CORREIOS_SENHA', ''),
      codigoAdministrativo: this.configService.get('CORREIOS_CODIGO_ADMINISTRATIVO', ''),
    };
  }

  async calculateShipping(
    cepOrigem: string,
    cepDestino: string,
    dimensions: ShippingDimensions,
    servicos: string[] = ['40010', '41106'], // SEDEX, PAC
  ): Promise<Array<{ code: string; name: string; price: number; days: number; error?: string }>> {
    const params = {
      nCdEmpresa: this.credentials.codigoAdministrativo,
      sDsSenha: this.credentials.senha,
      nCdServico: servicos.join(','),
      sCepOrigem: cepOrigem.replace(/\D/g, ''),
      sCepDestino: cepDestino.replace(/\D/g, ''),
      nVlPeso: dimensions.weight.toString(),
      nCdFormato: '1', // Caixa/pacote
      nVlComprimento: dimensions.length.toString(),
      nVlAltura: dimensions.height.toString(),
      nVlLargura: dimensions.width.toString(),
      nVlDiametro: '0',
      sCdMaoPropria: 'N',
      nVlValorDeclarado: '0',
      sCdAvisoRecebimento: 'N',
      StrRetorno: 'xml',
    };

    try {
      const response = await axios.get(this.baseUrl, { params });
      const parsed = await parseStringPromise(response.data, { explicitArray: false });
      
      const servicosResponse = Array.isArray(parsed.Servicos.cServico)
        ? parsed.Servicos.cServico
        : [parsed.Servicos.cServico];

      return servicosResponse.map((servico: CorreiosRate) => ({
        code: servico.codigo,
        name: this.getServiceName(servico.codigo),
        price: parseFloat(servico.valor.replace(',', '.')),
        days: parseInt(servico.prazoEntrega),
        error: servico.erro?.codigo !== '0' ? servico.erro?.msg : undefined,
      }));
    } catch (error) {
      console.error('Correios API error:', error);
      throw new Error('Erro ao calcular frete dos Correios');
    }
  }

  async getTrackingEvents(trackingNumber: string): Promise<Array<{
    date: string;
    location: string;
    description: string;
    status: string;
  }>> {
    // Implement tracking via Correios API
    // Note: Correios requires specific contract for tracking API
    // For now, return placeholder
    return [];
  }

  private getServiceName(code: string): string {
    const names: Record<string, string> = {
      '40010': 'SEDEX',
      '40045': 'SEDEX a Cobrar',
      '40215': 'SEDEX 10',
      '40290': 'SEDEX Hoje',
      '41106': 'PAC',
    };
    return names[code] || `Serviço ${code}`;
  }
}
```

### Task 3.3: Create Jadlog Integration Service

**File:** `gaqno-shop-service/src/shipping/jadlog.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface JadlogCredentials {
  token: string;
  cnpj: string;
}

interface JadlogRateRequest {
  cepOrigem: string;
  cepDestino: string;
  vlMercadoria: number;
  psReal: number; // peso real em kg
}

interface JadlogRate {
  modalidade: string;
  valor: number;
  prazoEntrega: number;
  tpFrete: string;
}

@Injectable()
export class JadlogService {
  private readonly baseUrl = 'https://www.jadlog.com.br/embarcador/api';
  private credentials: JadlogCredentials;

  constructor(private readonly configService: ConfigService) {
    this.credentials = {
      token: this.configService.get('JADLOG_TOKEN', ''),
      cnpj: this.configService.get('JADLOG_CNPJ', ''),
    };
  }

  async calculateShipping(
    request: JadlogRateRequest,
  ): Promise<Array<{ code: string; name: string; price: number; days: number }>> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/frete/valor`,
        {
          cepOrigem: request.cepOrigem.replace(/\D/g, ''),
          cepDestino: request.cepDestino.replace(/\D/g, ''),
          vlMercadoria: request.vlMercadoria,
          psReal: request.psReal,
          modalidades: ['3', '4', '5', '6', '7'], // Include main modalities
        },
        {
          headers: {
            Authorization: `Bearer ${this.credentials.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const frete = response.data?.frete || [];
      
      return frete.map((rate: JadlogRate) => ({
        code: rate.modalidade,
        name: this.getModalityName(rate.modalidade),
        price: rate.valor,
        days: rate.prazoEntrega,
      }));
    } catch (error) {
      console.error('Jadlog API error:', error);
      throw new Error('Erro ao calcular frete Jadlog');
    }
  }

  async getTrackingEvents(trackingNumber: string): Promise<Array<{
    date: string;
    location: string;
    description: string;
    status: string;
  }>> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/tracking/consultar/${trackingNumber}`,
        {
          headers: {
            Authorization: `Bearer ${this.credentials.token}`,
          },
        }
      );

      const events = response.data?.eventos || [];
      
      return events.map((event: any) => ({
        date: event.dataHora,
        location: event.unidade?.nome || 'Desconhecido',
        description: event.descricao,
        status: event.status,
      }));
    } catch (error) {
      console.error('Jadlog tracking error:', error);
      return [];
    }
  }

  private getModalityName(code: string): string {
    const names: Record<string, string> = {
      '0': 'Expresso',
      '3': '.Package',
      '4': 'Rodoviario',
      '5': 'Economico',
      '6': 'Doc',
      '7': 'Corporate',
      '9': '.Com',
      '10': 'International',
      '12': 'Cargo',
      '14': 'Emergencial',
    };
    return names[code] || `Modalidade ${code}`;
  }
}
```

### Task 3.4: Create Shipping Calculation Service

**File:** `gaqno-shop-service/src/shipping/shipping-calculator.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { CorreiosService } from './correios.service';
import { JadlogService } from './jadlog.service';
import { shippingMethods, shippingRatesCache, products } from '../database/schema';
import { eq, and, gt } from 'drizzle-orm';
import { createHash } from 'crypto';

interface ShippingItem {
  productId: string;
  quantity: number;
}

interface CalculatedRate {
  methodId: string;
  name: string;
  carrier: string;
  price: number;
  originalPrice?: number;
  days: { min: number; max: number };
  isFreeShipping: boolean;
}

@Injectable()
export class ShippingCalculatorService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly correiosService: CorreiosService,
    private readonly jadlogService: JadlogService,
  ) {}

  async calculateShipping(
    tenantId: string,
    cepDestino: string,
    items: ShippingItem[],
    subtotal: number,
    customerTier?: string,
  ): Promise<CalculatedRate[]> {
    const db = this.drizzle.db;

    // Check cache first
    const cacheKey = this.generateCacheKey(tenantId, cepDestino, items);
    const cached = await db.query.shippingRatesCache.findFirst({
      where: and(
        eq(shippingRatesCache.tenantId, tenantId),
        eq(shippingRatesCache.cacheKey, cacheKey),
        gt(shippingRatesCache.expiresAt, new Date())
      ),
    });

    if (cached) {
      return cached.rates as CalculatedRate[];
    }

    // Get active shipping methods
    const methods = await db.query.shippingMethods.findMany({
      where: and(
        eq(shippingMethods.tenantId, tenantId),
        eq(shippingMethods.isActive, true)
      ),
      orderBy: shippingMethods.sortOrder,
    });

    // Get product dimensions
    const productIds = items.map(item => item.productId);
    const productData = await db.query.products.findMany({
      where: and(
        eq(products.tenantId, tenantId),
        inArray(products.id, productIds)
      ),
    });

    // Calculate total dimensions
    const totalDimensions = this.calculateTotalDimensions(items, productData);

    // Calculate rates for each method
    const rates: CalculatedRate[] = [];

    for (const method of methods) {
      try {
        let rate: CalculatedRate | null = null;

        if (method.carrier === 'correios') {
          rate = await this.calculateCorreiosRate(method, cepDestino, totalDimensions);
        } else if (method.carrier === 'jadlog') {
          rate = await this.calculateJadlogRate(method, cepDestino, totalDimensions, subtotal);
        } else if (method.carrier === 'custom' && method.flatRate) {
          rate = {
            methodId: method.id,
            name: method.name,
            carrier: method.carrier,
            price: parseFloat(method.flatRate),
            days: {
              min: method.estimatedDeliveryDaysMin || 1,
              max: method.estimatedDeliveryDaysMax || 7,
            },
            isFreeShipping: false,
          };
        }

        if (rate) {
          // Apply free shipping logic
          const qualifiesForFreeShipping = this.checkFreeShipping(
            method,
            subtotal,
            customerTier
          );

          if (qualifiesForFreeShipping) {
            rate.originalPrice = rate.price;
            rate.price = 0;
            rate.isFreeShipping = true;
          }

          rates.push(rate);
        }
      } catch (error) {
        console.error(`Error calculating rate for ${method.name}:`, error);
        // Continue with other methods
      }
    }

    // Cache results
    await db.insert(shippingRatesCache).values({
      tenantId,
      cacheKey,
      cep: cepDestino.replace(/\D/g, ''),
      productIds,
      rates,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour cache
    });

    return rates;
  }

  private async calculateCorreiosRate(
    method: any,
    cepDestino: string,
    dimensions: any,
  ): Promise<CalculatedRate | null> {
    // Get tenant origin CEP from settings
    const originCep = method.settings?.originCep || '01310100'; // Default: São Paulo

    const servicos = method.serviceCode ? [method.serviceCode] : ['40010', '41106'];

    const results = await this.correiosService.calculateShipping(
      originCep,
      cepDestino,
      dimensions,
      servicos,
    );

    const result = results.find(r => r.code === method.serviceCode) || results[0];

    if (!result || result.error) {
      return null;
    }

    return {
      methodId: method.id,
      name: method.name,
      carrier: 'correios',
      price: result.price,
      days: {
        min: result.days,
        max: result.days + 2,
      },
      isFreeShipping: false,
    };
  }

  private async calculateJadlogRate(
    method: any,
    cepDestino: string,
    dimensions: any,
    subtotal: number,
  ): Promise<CalculatedRate | null> {
    const originCep = method.settings?.originCep || '01310100';

    const results = await this.jadlogService.calculateShipping({
      cepOrigem: originCep,
      cepDestino,
      vlMercadoria: subtotal,
      psReal: dimensions.weight,
    });

    const result = results.find(r => r.code === method.serviceCode) || results[0];

    if (!result) {
      return null;
    }

    return {
      methodId: method.id,
      name: method.name,
      carrier: 'jadlog',
      price: result.price,
      days: {
        min: result.days,
        max: result.days + 1,
      },
      isFreeShipping: false,
    };
  }

  private calculateTotalDimensions(items: ShippingItem[], products: any[]) {
    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;
    let volume = 0;

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      const weight = parseFloat(product.weight || '0') || 0.5; // Default 500g
      const quantity = item.quantity;

      totalWeight += weight * quantity;

      // For volume calculation
      const length = product.attributes?.length || 16;
      const width = product.attributes?.width || 11;
      const height = product.attributes?.height || 2;

      volume += length * width * height * quantity;

      // Track maximum dimensions
      maxLength = Math.max(maxLength, length);
      maxWidth = Math.max(maxWidth, width);
      maxHeight = Math.max(maxHeight, height);
    }

    // Correios limit: max 30kg
    totalWeight = Math.min(totalWeight, 30);

    // For multiple items, estimate package dimensions
    // Using cube root of total volume as approximation
    const cubicRoot = Math.cbrt(volume);
    const estimatedLength = Math.max(maxLength, Math.min(cubicRoot * 1.2, 100));
    const estimatedWidth = Math.max(maxWidth, Math.min(cubicRoot, 100));
    const estimatedHeight = Math.max(maxHeight, Math.min(volume / (estimatedLength * estimatedWidth), 100));

    return {
      weight: Math.max(totalWeight, 0.3), // Minimum 300g
      length: Math.min(estimatedLength, 105), // Correios max
      width: Math.min(estimatedWidth, 105),
      height: Math.min(estimatedHeight, 105),
    };
  }

  private checkFreeShipping(
    method: any,
    subtotal: number,
    customerTier?: string,
  ): boolean {
    // Check tier-based free shipping
    if (customerTier && ['silver', 'gold', 'platinum'].includes(customerTier.toLowerCase())) {
      // Silver+ gets free shipping on orders over R$ 99
      if (subtotal >= 99) {
        return true;
      }
    }

    // Check method-specific free shipping threshold
    if (method.freeShippingThreshold && subtotal >= parseFloat(method.freeShippingThreshold)) {
      return true;
    }

    return false;
  }

  private generateCacheKey(tenantId: string, cep: string, items: ShippingItem[]): string {
    const data = JSON.stringify({ tenantId, cep, items });
    return createHash('sha256').update(data).digest('hex');
  }
}
```

### Task 3.5: Create Shipping Controller

**File:** `gaqno-shop-service/src/shipping/shipping.controller.ts`

```typescript
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ShippingCalculatorService } from './shipping-calculator.service';
import { ShippingMethodsService } from './shipping-methods.service';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { AuthGuard } from '../auth/auth.guard';

interface CalculateShippingDto {
  cep: string;
  items: Array<{
    productId: string;
    variationId?: string;
    quantity: number;
  }>;
  subtotal: number;
}

@Controller('shipping')
export class ShippingController {
  constructor(
    private readonly calculatorService: ShippingCalculatorService,
    private readonly methodsService: ShippingMethodsService,
  ) {}

  @Post('calculate')
  async calculateShipping(
    @CurrentTenant() tenantId: string,
    @Body() dto: CalculateShippingDto,
  ) {
    const rates = await this.calculatorService.calculateShipping(
      tenantId,
      dto.cep,
      dto.items,
      dto.subtotal,
    );

    return {
      cep: dto.cep,
      rates,
    };
  }

  @Get('methods')
  async getShippingMethods(@CurrentTenant() tenantId: string) {
    return this.methodsService.getActiveMethods(tenantId);
  }

  @Get('track')
  async trackShipment(
    @CurrentTenant() tenantId: string,
    @Query('carrier') carrier: string,
    @Query('trackingNumber') trackingNumber: string,
  ) {
    return this.methodsService.getTrackingEvents(tenantId, carrier, trackingNumber);
  }
}
```

### Task 3.6: Create Shipping Module

**File:** `gaqno-shop-service/src/shipping/shipping.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingCalculatorService } from './shipping-calculator.service';
import { ShippingMethodsService } from './shipping-methods.service';
import { CorreiosService } from './correios.service';
import { JadlogService } from './jadlog.service';

@Module({
  controllers: [ShippingController],
  providers: [
    ShippingCalculatorService,
    ShippingMethodsService,
    CorreiosService,
    JadlogService,
  ],
  exports: [ShippingCalculatorService, CorreiosService, JadlogService],
})
export class ShippingModule {}
```

### Task 3.7: Update Checkout with Shipping Selection

**File:** `gaqno-shop/src/app/checkout/page.tsx` (enhance existing)

Add shipping calculation section to the checkout page:

```typescript
// Add to checkout page state
const [shippingAddress, setShippingAddress] = useState<any>(null);
const [shippingRates, setShippingRates] = useState<any[]>([]);
const [selectedShipping, setSelectedShipping] = useState<any>(null);
const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

// Add shipping calculation function
const calculateShipping = async () => {
  if (!shippingAddress?.cep || cartItems.length === 0) return;

  setIsCalculatingShipping(true);
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shipping/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Slug': process.env.NEXT_PUBLIC_TENANT_SLUG || 'default',
      },
      body: JSON.stringify({
        cep: shippingAddress.cep,
        items: cartItems.map(item => ({
          productId: item.productId,
          variationId: item.variationId,
          quantity: item.quantity,
        })),
        subtotal: cartTotal,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setShippingRates(data.rates);
      // Select default shipping method
      if (data.rates.length > 0 && !selectedShipping) {
        setSelectedShipping(data.rates[0]);
      }
    }
  } catch (error) {
    console.error('Error calculating shipping:', error);
  } finally {
    setIsCalculatingShipping(false);
  }
};

// Add shipping selection UI
const ShippingSelection = () => (
  <div className="border rounded-lg p-4 space-y-4">
    <h3 className="font-semibold flex items-center gap-2">
      <Truck className="h-5 w-5" />
      Forma de Entrega
    </h3>

    {isCalculatingShipping ? (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Calculando frete...</span>
      </div>
    ) : shippingRates.length === 0 ? (
      <p className="text-gray-500">Informe o CEP para calcular o frete</p>
    ) : (
      <div className="space-y-2">
        {shippingRates.map((rate) => (
          <label
            key={rate.methodId}
            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedShipping?.methodId === rate.methodId
                ? 'border-primary bg-primary/5'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping"
                checked={selectedShipping?.methodId === rate.methodId}
                onChange={() => setSelectedShipping(rate)}
                className="h-4 w-4"
              />
              <div>
                <p className="font-medium">{rate.name}</p>
                <p className="text-sm text-gray-500">
                  Chega em {rate.days.min}-{rate.days.max} dias úteis
                </p>
              </div>
            </div>
            <div className="text-right">
              {rate.isFreeShipping ? (
                <>
                  <p className="font-semibold text-green-600">GRÁTIS</p>
                  <p className="text-sm text-gray-400 line-through">
                    R$ {rate.originalPrice?.toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="font-semibold">
                  R$ {rate.price.toFixed(2)}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
    )}
  </div>
);
```

### Task 3.8: Create Shipping Methods Admin Page

**File:** `gaqno-shop-admin/src/pages/Shipping/ShippingMethodsPage.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useShopQueries } from '@/hooks/useShopQueries';
import { Button } from '@gaqno-development/frontcore/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-development/frontcore/components/ui/card';
import { Switch } from '@gaqno-development/frontcore/components/ui/switch';
import { Truck, Edit, Plus } from 'lucide-react';

interface ShippingMethod {
  id: string;
  name: string;
  carrier: string;
  isActive: boolean;
  isDefault: boolean;
  freeShippingThreshold: string | null;
}

export function ShippingMethodsPage() {
  const { getShippingMethods } = useShopQueries();
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      const data = await getShippingMethods();
      setMethods(data);
    } catch (error) {
      console.error('Error loading shipping methods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCarrierIcon = (carrier: string) => {
    switch (carrier) {
      case 'correios':
        return '📮';
      case 'jadlog':
        return '🚚';
      case 'custom':
        return '📦';
      default:
        return '🚛';
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Métodos de Envio</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Método
        </Button>
      </div>

      <div className="grid gap-4">
        {methods.map((method) => (
          <Card key={method.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getCarrierIcon(method.carrier)}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{method.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{method.carrier}</p>
                    {method.freeShippingThreshold && (
                      <p className="text-sm text-green-600">
                        Frete grátis acima de R$ {parseFloat(method.freeShippingThreshold).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {method.isDefault && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Padrão
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Ativo</span>
                    <Switch checked={method.isActive} />
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {methods.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum método configurado</h3>
              <p className="text-gray-500 mt-2">
                Adicione métodos de envio para seus clientes
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Método
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

---

## Phase 3 Completion Checklist

- [ ] Shipping database schema created and migrated
- [ ] Correios API integration service
- [ ] Jadlog API integration service
- [ ] Shipping calculation service with caching
- [ ] Shipping rates API endpoint
- [ ] Checkout shipping selector
- [ ] Shipping methods admin management
- [ ] Carrier tracking integration
- [ ] Free shipping logic with loyalty tier benefits
- [ ] All integrations tested

---

**Next:** Continue to Phase 4 - Loyalty Program
