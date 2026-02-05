import React, { useState } from "react";
import { useDomains } from "../../../hooks/admin/useDomains";
import { useTenants } from "../../../hooks/admin/useTenants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { Globe } from "lucide-react";

interface DomainFormProps {
  tenantId?: string;
}

export const DomainForm: React.FC<DomainFormProps> = ({ tenantId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenants, isLoading: tenantsLoading } = useTenants();
  const { domains, createDomain, updateDomain } = useDomains(tenantId);
  const isEdit = !!id;

  const existingDomain = isEdit ? domains.find((d) => d.id === id) : null;

  const [formData, setFormData] = useState({
    domain: existingDomain?.domain || "",
    tenantId: existingDomain?.tenantId || tenantId || "",
    verificationMethod: existingDomain?.verificationMethod || "dns",
    isActive: existingDomain?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !formData.tenantId) return;
    const result = isEdit
      ? await updateDomain(id!, formData)
      : await createDomain(formData);

    if (result.success) {
      navigate("/admin/domains");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {isEdit ? "Edit Domain" : "Add Domain"}
        </CardTitle>
        <CardDescription>
          {isEdit
            ? "Update domain information"
            : "Add a new domain for this tenant"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) =>
                setFormData({ ...formData, domain: e.target.value })
              }
              placeholder="example.com"
              required
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="tenantId">Organization</Label>
              <Select
                value={formData.tenantId}
                onValueChange={(value) =>
                  setFormData({ ...formData, tenantId: value })
                }
                disabled={tenantsLoading}
              >
                <SelectTrigger id="tenantId">
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {(tenants ?? []).map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="verificationMethod">Verification Method</Label>
            <Select
              value={formData.verificationMethod}
              onValueChange={(value: "dns" | "file" | "meta") =>
                setFormData({ ...formData, verificationMethod: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dns">DNS</SelectItem>
                <SelectItem value="file">File</SelectItem>
                <SelectItem value="meta">Meta Tag</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit">{isEdit ? "Update" : "Create"}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/domains")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
