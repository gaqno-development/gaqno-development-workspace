import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { HomePage } from "@/pages/HomePage";
import { QuickstartPage } from "@/pages/QuickstartPage";
import { AuthenticationPage } from "@/pages/AuthenticationPage";
import { ErrorsPage } from "@/pages/ErrorsPage";
import { WebhooksPage } from "@/pages/WebhooksPage";
import { ApiOverviewPage } from "@/pages/ApiOverviewPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/quickstart" element={<Layout><QuickstartPage /></Layout>} />
      <Route path="/authentication" element={<Layout><AuthenticationPage /></Layout>} />
      <Route path="/errors" element={<Layout><ErrorsPage /></Layout>} />
      <Route path="/webhooks" element={<Layout><WebhooksPage /></Layout>} />
      <Route path="/api-overview" element={<Layout><ApiOverviewPage /></Layout>} />
    </Routes>
  );
}

export default App;
