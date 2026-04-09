import { useState } from "react";
import { useAdminOrders } from "@/hooks/use-admin-orders";

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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-700",
  awaiting_payment: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-orange-100 text-orange-800",
};

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useAdminOrders({
    page: String(page),
    limit: "20",
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const orders = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pedidos da Loja</h2>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando...</p>}

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Cliente</th>
              <th className="px-4 py-3 text-left font-medium">Total</th>
              <th className="px-4 py-3 text-left font-medium">
                Pagamento
              </th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={String(order.id)} className="border-b">
                <td className="px-4 py-3 font-mono text-xs">
                  {String(order.id).slice(0, 8)}...
                </td>
                <td className="px-4 py-3">
                  <div>{String(order.customerName)}</div>
                  <div className="text-xs text-muted-foreground">
                    {String(order.customerEmail)}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">
                  R$ {Number(order.totalBrl).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-xs">
                  {order.paymentMethod === "pix"
                    ? "PIX"
                    : order.paymentMethod === "checkout_pro"
                      ? "Checkout Pro"
                      : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[String(order.status)] ?? ""}`}
                  >
                    {STATUS_LABELS[String(order.status)] ??
                      String(order.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(String(order.createdAt)).toLocaleDateString(
                    "pt-BR",
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm text-muted-foreground">Página {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={orders.length < 20}
          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
