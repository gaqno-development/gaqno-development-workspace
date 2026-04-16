# gaqno-shop Production Readiness - Phase 4: Loyalty Program

> **For agentic workers:** Use superpowers:subagent-driven-development to implement tasks in this phase.

**Goal:** Implement full loyalty points system with tier benefits, points earning on purchases, and redemption at checkout.

**Estimated Duration:** 2 weeks

---

## Phase 4 Tasks

### Task 4.1: Create Loyalty Database Schema

**File:** `gaqno-shop-service/src/database/schema.ts` (add to existing)

```typescript
// loyalty_tiers table
export const loyaltyTiers = pgTable(
  "loyalty_tiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 50 }).notNull(),
    minPoints: integer("min_points").notNull(),
    pointsMultiplier: decimal("points_multiplier", { precision: 3, scale: 2 }).default("1.00"),
    benefits: jsonb("benefits").default({}),
    color: varchar("color", { length: 7 }).default("#cd7f32"),
    iconUrl: varchar("icon_url", { length: 500 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("loyalty_tiers_tenant_idx").on(table.tenantId),
    tenantSlugIdx: uniqueIndex("loyalty_tiers_tenant_slug_idx").on(table.tenantId, table.slug),
  })
);

// customer_loyalty_status table
export const customerLoyaltyStatus = pgTable(
  "customer_loyalty_status",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    tierId: uuid("tier_id").references(() => loyaltyTiers.id),
    currentPoints: integer("current_points").default(0),
    lifetimePoints: integer("lifetime_points").default(0),
    pointsToNextTier: integer("points_to_next_tier").default(0),
    tierAchievedAt: timestamp("tier_achieved_at"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("loyalty_status_tenant_idx").on(table.tenantId),
    customerIdx: uniqueIndex("loyalty_status_customer_idx").on(table.tenantId, table.customerId),
  })
);

// loyalty_points_transactions table
export const loyaltyPointsTransactions = pgTable(
  "loyalty_points_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id),
    type: varchar("type", { length: 50 }).notNull(), // "earn", "redeem", "expire", "adjust", "bonus"
    points: integer("points").notNull(),
    description: varchar("description", { length: 255 }),
    metadata: jsonb("metadata").default({}),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("loyalty_tx_tenant_idx").on(table.tenantId),
    customerIdx: index("loyalty_tx_customer_idx").on(table.customerId),
    orderIdx: index("loyalty_tx_order_idx").on(table.orderId),
    createdAtIdx: index("loyalty_tx_created_at_idx").on(table.createdAt),
  })
);

// Type exports
export type LoyaltyTier = typeof loyaltyTiers.$inferSelect;
export type NewLoyaltyTier = typeof loyaltyTiers.$inferInsert;
export type CustomerLoyaltyStatus = typeof customerLoyaltyStatus.$inferSelect;
export type LoyaltyPointsTransaction = typeof loyaltyPointsTransactions.$inferSelect;
```

**Generate migration:**
```bash
cd gaqno-shop-service
npx drizzle-kit generate
npm run migrate
```

### Task 4.2: Create Loyalty Service

**File:** `gaqno-shop-service/src/loyalty/loyalty.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import {
  loyaltyTiers,
  customerLoyaltyStatus,
  loyaltyPointsTransactions,
} from '../database/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

@Injectable()
export class LoyaltyService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getCustomerLoyaltyStatus(tenantId: string, customerId: string) {
    const db = this.drizzle.db;

    // Get or create loyalty status
    let status = await db.query.customerLoyaltyStatus.findFirst({
      where: and(
        eq(customerLoyaltyStatus.tenantId, tenantId),
        eq(customerLoyaltyStatus.customerId, customerId)
      ),
      with: {
        tier: true,
      },
    });

    if (!status) {
      // Create initial status with base tier
      const baseTier = await db.query.loyaltyTiers.findFirst({
        where: and(
          eq(loyaltyTiers.tenantId, tenantId),
          eq(loyaltyTiers.isActive, true)
        ),
        orderBy: loyaltyTiers.minPoints,
      });

      const [newStatus] = await db.insert(customerLoyaltyStatus).values({
        tenantId,
        customerId,
        tierId: baseTier?.id,
        currentPoints: 0,
        lifetimePoints: 0,
        pointsToNextTier: baseTier ? baseTier.minPoints : 0,
      }).returning();

      status = { ...newStatus, tier: baseTier };
    }

    // Get next tier info
    let nextTier = null;
    if (status.tier) {
      nextTier = await db.query.loyaltyTiers.findFirst({
        where: and(
          eq(loyaltyTiers.tenantId, tenantId),
          eq(loyaltyTiers.isActive, true),
          gte(loyaltyTiers.minPoints, status.tier.minPoints + 1)
        ),
        orderBy: loyaltyTiers.minPoints,
      });
    }

    return {
      tier: status.tier,
      currentPoints: status.currentPoints,
      lifetimePoints: status.lifetimePoints,
      pointsToNextTier: nextTier ? nextTier.minPoints - status.lifetimePoints : 0,
      nextTier: nextTier ? { name: nextTier.name, minPoints: nextTier.minPoints } : null,
    };
  }

  async getPointsHistory(tenantId: string, customerId: string, page = 1, limit = 20) {
    const db = this.drizzle.db;
    const offset = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      db.query.loyaltyPointsTransactions.findMany({
        where: and(
          eq(loyaltyPointsTransactions.tenantId, tenantId),
          eq(loyaltyPointsTransactions.customerId, customerId)
        ),
        orderBy: [desc(loyaltyPointsTransactions.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: sql`count(*)`.mapWith(Number) })
        .from(loyaltyPointsTransactions)
        .where(and(
          eq(loyaltyPointsTransactions.tenantId, tenantId),
          eq(loyaltyPointsTransactions.customerId, customerId)
        )),
    ]);

    return {
      items: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        points: tx.points,
        description: tx.description,
        orderNumber: tx.metadata?.orderNumber,
        createdAt: tx.createdAt,
      })),
      total: total[0]?.count || 0,
      page,
      limit,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
    };
  }

  async earnPoints(
    tenantId: string,
    customerId: string,
    points: number,
    type: string,
    description: string,
    orderId?: string,
    metadata?: Record<string, any>,
  ) {
    const db = this.drizzle.db;

    // Create transaction
    await db.insert(loyaltyPointsTransactions).values({
      tenantId,
      customerId,
      orderId,
      type,
      points,
      description,
      metadata,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
    });

    // Update customer status
    const currentStatus = await db.query.customerLoyaltyStatus.findFirst({
      where: and(
        eq(customerLoyaltyStatus.tenantId, tenantId),
        eq(customerLoyaltyStatus.customerId, customerId)
      ),
    });

    const newLifetimePoints = (currentStatus?.lifetimePoints || 0) + points;
    const newCurrentPoints = (currentStatus?.currentPoints || 0) + points;

    // Check for tier upgrade
    const newTier = await db.query.loyaltyTiers.findFirst({
      where: and(
        eq(loyaltyTiers.tenantId, tenantId),
        eq(loyaltyTiers.isActive, true),
        gte(loyaltyTiers.minPoints, newLifetimePoints)
      ),
      orderBy: desc(loyaltyTiers.minPoints),
    });

    const nextTier = await db.query.loyaltyTiers.findFirst({
      where: and(
        eq(loyaltyTiers.tenantId, tenantId),
        eq(loyaltyTiers.isActive, true),
        gte(loyaltyTiers.minPoints, newLifetimePoints + 1)
      ),
      orderBy: loyaltyTiers.minPoints,
    });

    if (currentStatus) {
      await db.update(customerLoyaltyStatus)
        .set({
          tierId: newTier?.id || currentStatus.tierId,
          currentPoints: newCurrentPoints,
          lifetimePoints: newLifetimePoints,
          pointsToNextTier: nextTier ? nextTier.minPoints - newLifetimePoints : 0,
          tierAchievedAt: newTier?.id !== currentStatus.tierId ? new Date() : currentStatus.tierAchievedAt,
          updatedAt: new Date(),
        })
        .where(eq(customerLoyaltyStatus.id, currentStatus.id));
    } else {
      await db.insert(customerLoyaltyStatus).values({
        tenantId,
        customerId,
        tierId: newTier?.id,
        currentPoints: newCurrentPoints,
        lifetimePoints: newLifetimePoints,
        pointsToNextTier: nextTier ? nextTier.minPoints - newLifetimePoints : 0,
        tierAchievedAt: newTier ? new Date() : null,
      });
    }

    return {
      pointsEarned: points,
      newTotal: newCurrentPoints,
      tierUpgraded: newTier?.id !== currentStatus?.tierId,
      newTier: newTier,
    };
  }

  async redeemPoints(
    tenantId: string,
    customerId: string,
    points: number,
    orderId: string,
    orderNumber: string,
  ): Promise<{ discountAmount: number; remainingPoints: number }> {
    const db = this.drizzle.db;

    // Get current status
    const status = await db.query.customerLoyaltyStatus.findFirst({
      where: and(
        eq(customerLoyaltyStatus.tenantId, tenantId),
        eq(customerLoyaltyStatus.customerId, customerId)
      ),
    });

    if (!status || status.currentPoints < points) {
      throw new Error('Pontos insuficientes');
    }

    // Calculate discount (100 points = R$ 1,00)
    const POINT_VALUE_CENTS = 1;
    const discountAmount = (points * POINT_VALUE_CENTS) / 100;

    // Create redemption transaction
    await db.insert(loyaltyPointsTransactions).values({
      tenantId,
      customerId,
      orderId,
      type: 'redeem',
      points: -points,
      description: `Resgate no pedido ${orderNumber}`,
      metadata: { orderNumber, discountAmount },
    });

    // Update points balance
    const remainingPoints = status.currentPoints - points;
    await db.update(customerLoyaltyStatus)
      .set({
        currentPoints: remainingPoints,
        updatedAt: new Date(),
      })
      .where(eq(customerLoyaltyStatus.id, status.id));

    return {
      discountAmount,
      remainingPoints,
    };
  }

  async calculatePointsForOrder(
    tenantId: string,
    customerId: string,
    orderTotal: number,
  ): Promise<number> {
    const db = this.drizzle.db;

    // Get customer tier for multiplier
    const status = await db.query.customerLoyaltyStatus.findFirst({
      where: and(
        eq(customerLoyaltyStatus.tenantId, tenantId),
        eq(customerLoyaltyStatus.customerId, customerId)
      ),
      with: {
        tier: true,
      },
    });

    const multiplier = parseFloat(status?.tier?.pointsMultiplier || '1.00');
    const basePoints = Math.floor(orderTotal); // 1 point per R$ 1

    return Math.floor(basePoints * multiplier);
  }
}
```

### Task 4.3: Create Loyalty Controller

**File:** `gaqno-shop-service/src/loyalty/loyalty.controller.ts`

```typescript
import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('loyalty')
@UseGuards(AuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('status')
  async getStatus(
    @CurrentTenant() tenantId: string,
    @Request() req,
  ) {
    return this.loyaltyService.getCustomerLoyaltyStatus(
      tenantId,
      req.customer.customerId
    );
  }

  @Get('transactions')
  async getTransactions(
    @CurrentTenant() tenantId: string,
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.loyaltyService.getPointsHistory(
      tenantId,
      req.customer.customerId,
      page,
      limit
    );
  }

  @Post('redeem')
  async redeemPoints(
    @CurrentTenant() tenantId: string,
    @Request() req,
    @Body() body: { points: number; orderId: string; orderNumber: string },
  ) {
    return this.loyaltyService.redeemPoints(
      tenantId,
      req.customer.customerId,
      body.points,
      body.orderId,
      body.orderNumber
    );
  }
}
```

### Task 4.4: Create Loyalty Dashboard Page

**File:** `gaqno-shop/src/app/conta/fidelidade/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTenant } from '@/contexts/tenant-context';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-development/frontcore/components/ui/card';
import { Badge } from '@gaqno-development/frontcore/components/ui/badge';
import { Progress } from '@gaqno-development/frontcore/components/ui/progress';
import { Loader2, Star, Gift, TrendingUp, Package, Award } from 'lucide-react';

interface LoyaltyStatus {
  tier: {
    id: string;
    name: string;
    color: string;
    benefits: Record<string, boolean>;
  } | null;
  currentPoints: number;
  lifetimePoints: number;
  pointsToNextTier: number;
  nextTier: {
    name: string;
    minPoints: number;
  } | null;
}

interface Transaction {
  id: string;
  type: string;
  points: number;
  description: string;
  orderNumber?: string;
  createdAt: string;
}

export default function LoyaltyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { tenant } = useTenant();
  
  const [status_, setStatus_] = useState<LoyaltyStatus | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      const [statusRes, transactionsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/loyalty/status`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            'X-Tenant-Slug': process.env.NEXT_PUBLIC_TENANT_SLUG || 'default',
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/loyalty/transactions?limit=10`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            'X-Tenant-Slug': process.env.NEXT_PUBLIC_TENANT_SLUG || 'default',
          },
        }),
      ]);

      if (statusRes.ok) {
        setStatus_(await statusRes.json());
      }
      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.items);
      }
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!status_) {
    return (
      <div className="text-center py-12">
        <p>Erro ao carregar dados de fidelidade</p>
      </div>
    );
  }

  const tierProgress = status_.nextTier
    ? ((status_.lifetimePoints - (status_.tier?.minPoints || 0)) / (status_.nextTier.minPoints - (status_.tier?.minPoints || 0))) * 100
    : 100;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Programa de Fidelidade</h1>

      {/* Status Card */}
      <Card style={{ borderColor: status_.tier?.color }} className="border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: status_.tier?.color + '20' }}
              >
                <Award className="w-8 h-8" style={{ color: status_.tier?.color }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Seu Tier</p>
                <h2 className="text-2xl font-bold" style={{ color: status_.tier?.color }}>
                  {status_.tier?.name || 'Bronze'}
                </h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Pontos Disponíveis</p>
              <p className="text-3xl font-bold">{status_.currentPoints.toLocaleString()}</p>
            </div>
          </div>

          {status_.nextTier && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso para {status_.nextTier.name}</span>
                <span>{Math.round(tierProgress)}%</span>
              </div>
              <Progress value={tierProgress} className="h-3" />
              <p className="text-sm text-gray-500 mt-2">
                Faltam {status_.pointsToNextTier} pontos para o próximo tier
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefícios do Seu Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {status_.tier?.benefits?.freeShipping && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Frete Grátis</p>
                  <p className="text-sm text-gray-600">Em compras acima de R$ 99</p>
                </div>
              </div>
            )}
            {status_.tier?.benefits?.pointsMultiplier && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Star className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Pontos em Dobro</p>
                  <p className="text-sm text-gray-600">Ganhe mais pontos em cada compra</p>
                </div>
              </div>
            )}
            {status_.tier?.benefits?.earlyAccess && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Acesso Antecipado</p>
                  <p className="text-sm text-gray-600">Novidades antes de todo mundo</p>
                </div>
              </div>
            )}
            {status_.tier?.benefits?.exclusiveDiscounts && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Gift className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">Descontos Exclusivos</p>
                  <p className="text-sm text-gray-600">Ofertas especiais só para você</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Points History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pontos</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Você ainda não tem transações de pontos
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(tx.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    {tx.orderNumber && (
                      <p className="text-sm text-gray-400">Pedido: {tx.orderNumber}</p>
                    )}
                  </div>
                  <Badge
                    variant={tx.points > 0 ? 'default' : 'destructive'}
                    className={tx.points > 0 ? 'bg-green-600' : ''}
                  >
                    {tx.points > 0 ? '+' : ''}{tx.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Phase 4 Completion Checklist

- [ ] Loyalty database schema created and migrated
- [ ] Loyalty service with earn/redeem logic
- [ ] Tier system with automatic upgrades
- [ ] Points history tracking
- [ ] Loyalty status API endpoint
- [ ] Customer loyalty dashboard page
- [ ] Points redemption at checkout
- [ ] Tier benefits applied (free shipping, multipliers)
- [ ] Admin tier management (covered in Phase 5)

---

**Next:** Continue to Phase 5 - Analytics & Wishlist
