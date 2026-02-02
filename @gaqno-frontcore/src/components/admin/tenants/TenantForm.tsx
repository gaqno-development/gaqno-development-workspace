import React, { useState, useEffect } from "react";
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
import { Building2 } from "lucide-react";
import { ITenant } from "../../../types/admin";

export const TenantForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenants, createTenant, updateTenant, isLoading } = useTenants();
  const isEdit = !!id;

  const existing = isEdit ? (tenants ?? []).find((t) => t.id === id) : null;

  const [formData, setFormData] = useState<{
    name: string;
    domain: string;
    status: ITenant["status"];
  }>({
    name: "",
    domain: "",
    status: "active",
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        name: existing.name ?? "",
        domain: existing.domain ?? "",
        status: existing.status ?? "active",
      });
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result =
      isEdit && id
        ? await updateTenant(id, formData)
        : await createTenant(formData);

    if (result.success) {
      navigate("/admin/tenants");
    }
  };

  if (isEdit && isLoading && !existing) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {isEdit ? "Edit Tenant" : "New Tenant"}
        </CardTitle>
        <CardDescription>
          {isEdit
            ? "Update tenant information"
            : "Create a new organization tenant"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Organization name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) =>
                setFormData({ ...formData, domain: e.target.value })
              }
              placeholder="example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v: ITenant["status"]) =>
                setFormData({ ...formData, status: v })
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit">{isEdit ? "Save" : "Create"}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/tenants")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
