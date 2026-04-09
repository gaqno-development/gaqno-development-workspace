import { useState } from "react";
import { useAdminProducts } from "@/hooks/use-admin-products";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-neutral-100 text-neutral-600",
};

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const { products, total, loading, updateStatus } = useAdminProducts({
    page: String(page),
    limit: "20",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Produtos da Loja</h2>
        <a
          href="/dropshipping-admin/produtos/publicar"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Publicar Produto
        </a>
      </div>

      {loading && <p className="text-muted-foreground">Carregando...</p>}

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Título</th>
              <th className="px-4 py-3 text-left font-medium">Preço</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Destaque</th>
              <th className="px-4 py-3 text-left font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={String(p.id)} className="border-b">
                <td className="px-4 py-3">{String(p.customTitle)}</td>
                <td className="px-4 py-3">
                  R$ {Number(p.sellingPriceBrl).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[String(p.status)] ?? ""}`}
                  >
                    {STATUS_LABELS[String(p.status)] ?? String(p.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.featured ? "Sim" : "Não"}
                </td>
                <td className="px-4 py-3 space-x-2">
                  {p.status !== "published" && (
                    <button
                      onClick={() =>
                        updateStatus({
                          id: String(p.id),
                          status: "published",
                        })
                      }
                      className="text-xs text-green-600 hover:underline"
                    >
                      Publicar
                    </button>
                  )}
                  {p.status === "published" && (
                    <button
                      onClick={() =>
                        updateStatus({
                          id: String(p.id),
                          status: "draft",
                        })
                      }
                      className="text-xs text-yellow-600 hover:underline"
                    >
                      Despublicar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            Página {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={products.length < 20}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
