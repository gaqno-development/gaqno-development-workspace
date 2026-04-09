import { useState } from "react";
import { useAdminCategories } from "@/hooks/use-admin-categories";

export function CategoriesPage() {
  const { categories, loading, create, update, remove } =
    useAdminCategories();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const handleCreate = async () => {
    if (!name || !slug) return;
    await create({ name, slug });
    setName("");
    setSlug("");
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Categorias</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? "Cancelar" : "Nova Categoria"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 space-y-3">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, ""),
              );
            }}
            placeholder="Nome da categoria"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug (ex: camisetas)"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <button
            onClick={handleCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Criar
          </button>
        </div>
      )}

      {loading && <p className="text-muted-foreground">Carregando...</p>}

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Nome</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Ativa</th>
              <th className="px-4 py-3 text-left font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={String(cat.id)} className="border-b">
                <td className="px-4 py-3">{String(cat.name)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {String(cat.slug)}
                </td>
                <td className="px-4 py-3">{cat.active ? "Sim" : "Não"}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => remove(String(cat.id))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Desativar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
