"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Textarea,
} from "../ui";
import { useContentGeneration } from "../../hooks/ai";
import type { GenerateContentProductInput } from "../../utils/api";

export interface AIContentGeneratorProps {
  productData?: GenerateContentProductInput | null;
  onContentGenerated?: (data: { copy: string; assumptions: string[] }) => void;
  contentTypes?: string[];
  compact?: boolean;
  title?: string;
}

export function AIContentGenerator({
  productData,
  onContentGenerated,
  compact = false,
  title = "AI text content generation",
}: AIContentGeneratorProps) {
  const [reviewCopy, setReviewCopy] = useState("");
  const generate = useContentGeneration();

  const result = generate.data;
  const isLoading = generate.isPending;
  const error = generate.isError ? (generate.error as Error)?.message : null;

  useEffect(() => {
    if (result?.copy != null) {
      setReviewCopy(result.copy);
      onContentGenerated?.({
        copy: result.copy,
        assumptions: result.assumptions ?? [],
      });
    }
  }, [result?.copy, result?.assumptions, onContentGenerated]);

  const handleGenerate = () => {
    if (!productData) return;
    generate.mutate({ product: productData });
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={!productData || isLoading}
        >
          {isLoading ? "Generating…" : "Generate copy"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && (
          <Textarea
            value={reviewCopy}
            onChange={(e) => setReviewCopy(e.target.value)}
            placeholder="Generated copy"
            className="min-h-[80px] text-sm"
          />
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          Generate marketing copy from product data. Assumptions are listed for
          manual review.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={!productData || isLoading}
        >
          {isLoading ? "Generating…" : "Generate copy"}
        </Button>
        {productData && (
          <p className="text-xs text-muted-foreground">
            Using product: {productData.name} (price {productData.price}).
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && result.assumptions.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs font-medium">Assumptions</Label>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {result.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}
        {result && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Copy (editable for review)
            </Label>
            <Textarea
              value={reviewCopy}
              onChange={(e) => setReviewCopy(e.target.value)}
              placeholder="Generated copy will appear here"
              className="min-h-[80px] text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
