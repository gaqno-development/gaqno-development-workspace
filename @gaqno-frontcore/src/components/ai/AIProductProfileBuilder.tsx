"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Label,
} from "../ui";
import { useProductProfile } from "../../hooks/ai";
import type {
  ProductProfileRequestProduct,
  ProductProfileResponse,
} from "../../utils/api";

function formatValue(value: string | string[] | number | null): string {
  if (value === null) return "—";
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (typeof value === "number") return String(value);
  return value;
}

export interface AIProductProfileBuilderProps {
  initialData?: ProductProfileRequestProduct | null;
  onProfileBuilt?: (result: ProductProfileResponse) => void;
  compact?: boolean;
  title?: string;
}

export function AIProductProfileBuilder({
  initialData,
  onProfileBuilt,
  compact = false,
  title = "Product semantic profile",
}: AIProductProfileBuilderProps) {
  const [inferMissing, setInferMissing] = useState(true);
  const build = useProductProfile();

  const handleBuild = () => {
    if (!initialData) return;
    build.mutate(
      { product: initialData, inferMissing },
      {
        onSuccess: (data) => {
          onProfileBuilt?.(data);
        },
      }
    );
  };

  const result = build.data;
  const isLoading = build.isPending;
  const error = build.isError ? (build.error as Error)?.message : null;

  if (compact) {
    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inferMissing}
            onChange={(e) => setInferMissing(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Infer missing attributes
        </label>
        <Button
          size="sm"
          onClick={handleBuild}
          disabled={!initialData || isLoading}
        >
          {isLoading ? "Building…" : "Build profile"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && (
          <p className="text-xs text-muted-foreground">
            Confidence: {result.overallConfidence}
          </p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          Build a profile from product data. Optional AI inference for missing
          category and marketingCopy.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="infer-missing"
            type="checkbox"
            checked={inferMissing}
            onChange={(e) => setInferMissing(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <Label
            htmlFor="infer-missing"
            className="text-sm font-medium leading-none cursor-pointer"
          >
            Infer missing attributes (category, marketingCopy)
          </Label>
          <Button
            size="sm"
            onClick={handleBuild}
            disabled={!initialData || isLoading}
          >
            {isLoading ? "Building…" : "Build profile"}
          </Button>
        </div>
        {initialData && (
          <p className="text-xs text-muted-foreground">
            Using product: {initialData.name} (price {initialData.price}).
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && (
          <div className="space-y-3 rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Overall confidence:</span>
              <Badge variant="secondary">{result.overallConfidence}</Badge>
            </div>
            <div className="grid gap-2">
              {Object.entries(result.profile).map(([key, field]) => (
                <div key={key} className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">{key}:</span>
                  <span className="text-muted-foreground">
                    {formatValue(field.value)}
                  </span>
                  <Badge
                    variant={
                      field.source === "inferred" ? "outline" : "secondary"
                    }
                    className="text-xs"
                  >
                    {field.source} ({field.confidence})
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
