import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  QueryProvider,
  AuthProvider,
  TenantProvider,
} from "@gaqno-development/frontcore";

function WarehousePage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Warehouse Module</h1>
      <p className="text-muted-foreground mt-2">
        Warehouse functionality coming soon...
      </p>
    </div>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            <Route path="/warehouse" element={<WarehousePage />} />
            <Route path="*" element={<Navigate to="/warehouse" replace />} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
