import { useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "@gaqno-development/frontcore/contexts";
import { initI18n, I18nProvider } from "@gaqno-development/frontcore/i18n";
import { ProductsPage } from "./pages/ProductsPage";
import { PublishProductPage } from "./pages/PublishProductPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { OrdersPage } from "./pages/OrdersPage";

initI18n();

function AdminView() {
  const { pathname } = useLocation();

  const stripped = pathname
    .replace(/^\/dropshipping-admin\/?/, "")
    .replace(/\/+$/, "");

  const section = stripped.split("/")[0] || "produtos";

  const VIEWS: Record<string, React.ComponentType> = {
    produtos: ProductsPage,
    categorias: CategoriesPage,
    pedidos: OrdersPage,
  };

  if (stripped === "produtos/publicar") return <PublishProductPage />;

  const View = VIEWS[section];
  if (View) return <View />;

  return <Navigate to="/dropshipping-admin/produtos" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <AdminView />
      </I18nProvider>
    </AuthProvider>
  );
}
