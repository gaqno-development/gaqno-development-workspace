import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useImportableProducts, useAdminProducts } from "@/hooks/use-admin-products";
import { useAdminCategories } from "@/hooks/use-admin-categories";

export function PublishProductPage() {
  const navigate = useNavigate();
  const { data: importable, isLoading } = useImportableProducts();
  const { categories } = useAdminCategories();
  const { publish } = useAdminProducts();

  const [selected, setSelected] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dsProduct = importable?.find(
    (p) => String(p.id) === selected,
  );

  const handleSelect = (product: Record<string, unknown>) => {
    setSelected(String(product.id));
    setTitle(String(product.title ?? ""));
    setPrice(String(product.sellingPriceBrl ?? ""));
  };

  const handlePublish = async () => {
    if (!selected || !title || !price) return;
    setSubmitting(true);
    try {
      const images = dsProduct?.imageUrls
        ? String(dsProduct.imageUrls).split(";").filter(Boolean)
        : [];

      await publish({
        dsProductId: selected,
        customTitle: title,
        sellingPriceBrl: Number(price),
        categoryId: categoryId || undefined,
        images,
        variations: dsProduct?.mappedVariations ?? null,
      });
      navigate("/dropshipping-admin/produtos");
    } finally {
      setSubmitting(false);
    }
  };

  if (!selected) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">
          Selecionar Produto para Publicar
        </h2>
        {isLoading && (
          <p className="text-muted-foreground">Carregando...</p>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(importable ?? []).map((p) => (
            <button
              key={String(p.id)}
              onClick={() => handleSelect(p)}
              className="rounded-lg border p-4 text-left hover:border-primary hover:bg-muted/50 transition-colors"
            >
              <h3 className="font-medium line-clamp-2">
                {String(p.title)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Custo: US$ {Number(p.costUsd).toFixed(2)} | Venda: R${" "}
                {Number(p.sellingPriceBrl).toFixed(2)}
              </p>
            </button>
          ))}
        </div>
        {!isLoading && (importable ?? []).length === 0 && (
          <p className="text-muted-foreground">
            Todos os produtos importados já foram publicados.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-2xl font-bold">Personalizar e Publicar</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Título personalizado
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Preço de venda (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Categoria
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Sem categoria</option>
            {categories.map((cat) => (
              <option key={String(cat.id)} value={String(cat.id)}>
                {String(cat.name)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setSelected(null)}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Voltar
        </button>
        <button
          onClick={handlePublish}
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "Publicando..." : "Publicar como Rascunho"}
        </button>
      </div>
    </div>
  );
}
