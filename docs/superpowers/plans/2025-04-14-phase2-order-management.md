# gaqno-shop Production Readiness - Phase 2: Order Management

> **For agentic workers:** Use superpowers:subagent-driven-development to implement tasks in this phase.

**Goal:** Complete order lifecycle management with customer order history, order tracking, and email notifications.

**Estimated Duration:** 2 weeks

---

## Phase 2 Tasks

### Task 2.1: Extend Orders API with Authentication

**File:** `gaqno-shop-service/src/order/order.controller.ts`

Add authentication guard to existing endpoints and create new customer-specific endpoints:

```typescript
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Public endpoint for guest order lookup
  @Get('track/:orderNumber')
  async trackOrder(
    @CurrentTenant() tenantId: string,
    @Param('orderNumber') orderNumber: string,
    @Query('email') email: string,
  ) {
    return this.orderService.trackOrder(tenantId, orderNumber, email);
  }

  // Customer endpoints (authenticated)
  @Get('my-orders')
  @UseGuards(AuthGuard)
  async getMyOrders(
    @CurrentTenant() tenantId: string,
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    return this.orderService.getCustomerOrders(
      tenantId,
      req.customer.customerId,
      { page, limit, status }
    );
  }

  @Get('my-orders/:id')
  @UseGuards(AuthGuard)
  async getMyOrderDetail(
    @CurrentTenant() tenantId: string,
    @Request() req,
    @Param('id') orderId: string,
  ) {
    return this.orderService.getCustomerOrderDetail(
      tenantId,
      req.customer.customerId,
      orderId
    );
  }

  // Admin endpoints (keep existing)
  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: any,
  ) {
    return this.orderService.findAll(tenantId, query);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.orderService.findOne(tenantId, id);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.orderService.updateStatus(tenantId, id, body.status, body.notes);
  }
}
```

### Task 2.2: Extend Order Service

**File:** `gaqno-shop-service/src/order/order.service.ts`

Add new methods for customer order management:

```typescript
async getCustomerOrders(
  tenantId: string,
  customerId: string,
  options: { page: number; limit: number; status?: string }
) {
  const { page, limit, status } = options;
  const offset = (page - 1) * limit;

  const whereConditions = [
    eq(orders.tenantId, tenantId),
    eq(orders.customerId, customerId),
  ];

  if (status) {
    whereConditions.push(eq(orders.status, status as any));
  }

  const [items, total] = await Promise.all([
    this.drizzle.db.query.orders.findMany({
      where: and(...whereConditions),
      with: {
        items: true,
      },
      orderBy: [desc(orders.createdAt)],
      limit,
      offset,
    }),
    this.drizzle.db.select({ count: sql`count(*)`.mapWith(Number) })
      .from(orders)
      .where(and(...whereConditions)),
  ]);

  return {
    items: items.map(order => ({
      ...order,
      items: order.items?.length || 0,
    })),
    total: total[0]?.count || 0,
    page,
    limit,
    totalPages: Math.ceil((total[0]?.count || 0) / limit),
  };
}

async getCustomerOrderDetail(tenantId: string, customerId: string, orderId: string) {
  const order = await this.drizzle.db.query.orders.findFirst({
    where: and(
      eq(orders.tenantId, tenantId),
      eq(orders.id, orderId),
      eq(orders.customerId, customerId)
    ),
    with: {
      items: true,
    },
  });

  if (!order) {
    throw new NotFoundException('Pedido não encontrado');
  }

  // Get status history
  const history = await this.drizzle.db.query.orderStatusHistory.findMany({
    where: and(
      eq(orderStatusHistory.tenantId, tenantId),
      eq(orderStatusHistory.orderId, orderId)
    ),
    orderBy: [desc(orderStatusHistory.createdAt)],
  });

  // Get tracking info if available
  const trackingInfo = await this.getTrackingInfo(tenantId, orderId);

  return {
    ...order,
    statusHistory: history,
    tracking: trackingInfo,
  };
}

async trackOrder(tenantId: string, orderNumber: string, email: string) {
  const order = await this.drizzle.db.query.orders.findFirst({
    where: and(
      eq(orders.tenantId, tenantId),
      eq(orders.orderNumber, orderNumber)
    ),
    with: {
      customer: true,
      items: true,
    },
  });

  if (!order || order.customer?.email !== email) {
    throw new NotFoundException('Pedido não encontrado');
  }

  const trackingInfo = await this.getTrackingInfo(tenantId, order.id);

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    total: order.total,
    tracking: trackingInfo,
  };
}

private async getTrackingInfo(tenantId: string, orderId: string) {
  const label = await this.drizzle.db.query.shippingLabels.findFirst({
    where: and(
      eq(shippingLabels.tenantId, tenantId),
      eq(shippingLabels.orderId, orderId)
    ),
  });

  if (!label || !label.trackingNumber) {
    return null;
  }

  // Get tracking events based on carrier
  let events = [];
  if (label.carrier === 'correios') {
    events = await this.correiosService.getTrackingEvents(label.trackingNumber);
  } else if (label.carrier === 'jadlog') {
    events = await this.jadlogService.getTrackingEvents(label.trackingNumber);
  }

  return {
    carrier: label.carrier,
    trackingNumber: label.trackingNumber,
    status: label.status,
    estimatedDelivery: label.estimatedDelivery,
    events,
  };
}
```

### Task 2.3: Create Order Status History Tracking

**File:** `gaqno-shop-service/src/order/order-status.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { orderStatusHistory } from '../database/schema';

@Injectable()
export class OrderStatusService {
  constructor(private readonly drizzle: DrizzleService) {}

  async addStatusChange(
    tenantId: string,
    orderId: string,
    status: string,
    notes?: string,
    metadata?: Record<string, any>
  ) {
    await this.drizzle.db.insert(orderStatusHistory).values({
      tenantId,
      orderId,
      status: status as any,
      notes,
      metadata: metadata || {},
    });
  }

  async getStatusHistory(tenantId: string, orderId: string) {
    return this.drizzle.db.query.orderStatusHistory.findMany({
      where: and(
        eq(orderStatusHistory.tenantId, tenantId),
        eq(orderStatusHistory.orderId, orderId)
      ),
      orderBy: [desc(orderStatusHistory.createdAt)],
    });
  }
}
```

### Task 2.4: Create Email Notification Service

**File:** `gaqno-shop-service/src/mail/order-mail.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from './mail.service';

@Injectable()
export class OrderMailService {
  constructor(private readonly mailService: MailService) {}

  async sendOrderConfirmation(order: any, customer: any) {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">R$ ${item.price}</td>
      </tr>
    `).join('');

    await this.mailService.sendMail({
      to: customer.email,
      subject: `Pedido ${order.orderNumber} confirmado!`,
      html: `
        <h1>Obrigado pelo seu pedido!</h1>
        <p>Seu pedido <strong>${order.orderNumber}</strong> foi confirmado.</p>
        
        <h2>Resumo do Pedido</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Produto</th>
              <th style="padding: 10px; text-align: left;">Qtd</th>
              <th style="padding: 10px; text-align: left;">Preço</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <p><strong>Total: R$ ${order.total}</strong></p>
        
        <p>Você pode acompanhar seu pedido em: <a href="${process.env.STORE_URL}/pedido/${order.orderNumber}">Acompanhar Pedido</a></p>
      `,
    });
  }

  async sendOrderShipped(order: any, customer: any, trackingInfo: any) {
    await this.mailService.sendMail({
      to: customer.email,
      subject: `Seu pedido ${order.orderNumber} foi enviado!`,
      html: `
        <h1>Seu pedido foi enviado!</h1>
        <p>Seu pedido <strong>${order.orderNumber}</strong> foi enviado.</p>
        
        <h2>Informações de Rastreamento</h2>
        <p><strong>Transportadora:</strong> ${trackingInfo.carrier}</p>
        <p><strong>Código de rastreamento:</strong> ${trackingInfo.trackingNumber}</p>
        <p><a href="${process.env.STORE_URL}/pedido/${order.orderNumber}">Acompanhar envio</a></p>
      `,
    });
  }

  async sendOrderDelivered(order: any, customer: any) {
    await this.mailService.sendMail({
      to: customer.email,
      subject: `Pedido ${order.orderNumber} entregue!`,
      html: `
        <h1>Seu pedido foi entregue!</h1>
        <p>Seu pedido <strong>${order.orderNumber}</strong> foi entregue.</p>
        
        <p>Esperamos que você goste da sua compra!</p>
        
        <p><a href="${process.env.STORE_URL}/produtos">Continue comprando</a></p>
      `,
    });
  }
}
```

### Task 2.5: Create Customer Order List Page

**File:** `gaqno-shop/src/app/conta/pedidos/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTenant } from '@/contexts/tenant-context';
import { Button } from '@gaqno-development/frontcore/components/ui/button';
import { Badge } from '@gaqno-development/frontcore/components/ui/badge';
import { Loader2, Package, Eye } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: string;
  createdAt: string;
  items: number;
}

const statusLabels: Record<string, { label: string; variant: any }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  confirmed: { label: 'Confirmado', variant: 'default' },
  processing: { label: 'Em Processamento', variant: 'default' },
  shipped: { label: 'Enviado', variant: 'default' },
  delivered: { label: 'Entregue', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  refunded: { label: 'Reembolsado', variant: 'destructive' },
};

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { tenant } = useTenant();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/conta/pedidos');
      return;
    }

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, pagination.page]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/my-orders?page=${pagination.page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            'X-Tenant-Slug': process.env.NEXT_PUBLIC_TENANT_SLUG || 'default',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      setOrders(data.items);
      setPagination({
        page: data.page,
        totalPages: data.totalPages,
        total: data.total,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Pedidos</h1>
        <p className="text-gray-500">
          Total: {pagination.total} pedido{pagination.total !== 1 ? 's' : ''}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum pedido encontrado</h3>
          <p className="text-gray-500 mt-2">Você ainda não fez nenhum pedido.</p>
          <Link href="/produtos">
            <Button className="mt-4" style={{ backgroundColor: tenant?.primaryColor }}>
              Começar a comprar
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                    <Badge variant={statusLabels[order.status]?.variant || 'secondary'}>
                      {statusLabels[order.status]?.label || order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.items} item{order.items !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">
                    R$ {parseFloat(order.total).toFixed(2)}
                  </p>
                  <Link href={`/conta/pedidos/${order.id}`}>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalhes
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Task 2.6: Create Order Detail Page

**File:** `gaqno-shop/src/app/conta/pedidos/[id]/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTenant } from '@/contexts/tenant-context';
import { Button } from '@gaqno-development/frontcore/components/ui/button';
import { Badge } from '@gaqno-development/frontcore/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-development/frontcore/components/ui/card';
import { Loader2, ArrowLeft, Package, Truck, CheckCircle, Clock } from 'lucide-react';

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: string;
  shippingAmount: string;
  discountAmount: string;
  total: string;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  shippingAddress: any;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: string;
    imageUrl: string | null;
  }>;
  statusHistory: Array<{
    status: string;
    notes: string | null;
    createdAt: string;
  }>;
  tracking: {
    carrier: string;
    trackingNumber: string;
    status: string;
    estimatedDelivery: string | null;
    events: Array<{
      date: string;
      location: string;
      description: string;
      status: string;
    }>;
  } | null;
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
};

export default function OrderDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { tenant } = useTenant();
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchOrderDetail();
    }
  }, [status, params.id]);

  const fetchOrderDetail = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/my-orders/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            'X-Tenant-Slug': process.env.NEXT_PUBLIC_TENANT_SLUG || 'default',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch order');

      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
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

  if (!order) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Pedido não encontrado</h1>
        <Link href="/conta/pedidos">
          <Button className="mt-4" style={{ backgroundColor: tenant?.primaryColor }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos pedidos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/conta/pedidos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold mt-2">{order.orderNumber}</h1>
          <p className="text-gray-500">
            {format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <Badge variant="default" className="text-sm">
          {order.status}
        </Badge>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {order.statusHistory.map((history, index) => {
                const Icon = statusIcons[history.status] || Clock;
                return (
                  <div key={index} className="relative flex items-start gap-4">
                    <div className="relative z-10 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium capitalize">{history.status}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(history.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {history.notes && (
                        <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Info */}
      {order.tracking && (
        <Card>
          <CardHeader>
            <CardTitle>Rastreamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Transportadora</p>
                  <p className="font-medium">{order.tracking.carrier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Código</p>
                  <p className="font-medium">{order.tracking.trackingNumber}</p>
                </div>
              </div>
              
              {order.tracking.events.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Histórico de Rastreamento</h4>
                  <div className="space-y-3">
                    {order.tracking.events.map((event, index) => (
                      <div key={index} className="flex gap-3 text-sm">
                        <div className="text-gray-500 w-24 flex-shrink-0">
                          {format(new Date(event.date), 'dd/MM HH:mm')}
                        </div>
                        <div>
                          <p className="font-medium">{event.description}</p>
                          <p className="text-gray-500">{event.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                </div>
                <p className="font-medium">
                  R$ {parseFloat(item.price).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>R$ {parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Frete</span>
              <span>R$ {parseFloat(order.shippingAmount).toFixed(2)}</span>
            </div>
            {parseFloat(order.discountAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Desconto</span>
                <span className="text-green-600">-R$ {parseFloat(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>R$ {parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 2.7: Create Public Order Tracking Page

**File:** `gaqno-shop/src/app/pedido/[orderNumber]/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTenant } from '@/contexts/tenant-context';
import { Button } from '@gaqno-development/frontcore/components/ui/button';
import { Input } from '@gaqno-development/frontcore/components/ui/input';
import { Label } from '@gaqno-development/frontcore/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-development/frontcore/components/ui/card';
import { Loader2, Search, Package } from 'lucide-react';

export default function TrackOrderPage() {
  const params = useParams();
  const { tenant } = useTenant();
  const orderNumber = params.orderNumber as string;
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/track/${orderNumber}?email=${encodeURIComponent(email)}`,
        {
          headers: {
            'X-Tenant-Slug': process.env.NEXT_PUBLIC_TENANT_SLUG || 'default',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Pedido não encontrado');
      }

      const data = await response.json();
      setOrderData(data);
    } catch (err) {
      setError('Pedido não encontrado. Verifique o número e o email.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Package className="mx-auto h-12 w-12 mb-4" style={{ color: tenant?.primaryColor }} />
            <h1 className="text-2xl font-bold">Rastrear Pedido</h1>
            <p className="text-gray-500 mt-2">Pedido: {orderNumber}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email usado na compra</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              style={{ backgroundColor: tenant?.primaryColor }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Rastrear Pedido
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Pedido {orderData.orderNumber}</h1>
          <p className="text-gray-500">
            {format(new Date(orderData.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-3xl font-bold capitalize">{orderData.status}</p>
              <p className="text-gray-500 mt-2">
                Total: R$ {parseFloat(orderData.total).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {orderData.tracking && (
          <Card>
            <CardHeader>
              <CardTitle>Rastreamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Transportadora</p>
                  <p className="font-medium">{orderData.tracking.carrier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Código</p>
                  <p className="font-medium">{orderData.tracking.trackingNumber}</p>
                </div>
              </div>

              {orderData.tracking.events?.length > 0 && (
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    {orderData.tracking.events.map((event: any, index: number) => (
                      <div key={index} className="flex gap-3 text-sm">
                        <div className="text-gray-500 w-24 flex-shrink-0">
                          {format(new Date(event.date), 'dd/MM HH:mm')}
                        </div>
                        <div>
                          <p className="font-medium">{event.description}</p>
                          <p className="text-gray-500">{event.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setOrderData(null)}
        >
          Rastrear outro pedido
        </Button>
      </div>
    </div>
  );
}
```

---

## Phase 2 Completion Checklist

- [ ] Orders API extended with customer endpoints
- [ ] Order status history tracking implemented
- [ ] Email notifications for order events
- [ ] Customer order list page
- [ ] Customer order detail page with timeline
- [ ] Public order tracking page
- [ ] All pages tested and working

---

**Next:** Continue to Phase 3 - Shipping Integration
