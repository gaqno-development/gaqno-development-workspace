"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
} from "../ui";
import {
  useVideoTemplates,
  useVideoGenerateFromTemplateMutation,
  useVideoStatus,
} from "../../hooks/ai";

export interface AIVideoGeneratorProps {
  productName?: string;
  productDescription?: string;
  onVideoGenerated?: (data: { id: string; videoUrl?: string }) => void;
  compact?: boolean;
  title?: string;
}

export function AIVideoGenerator({
  productName: initialProductName = "",
  productDescription: initialProductDescription = "",
  onVideoGenerated,
  compact = false,
  title = "AI video from template",
}: AIVideoGeneratorProps) {
  const [templateId, setTemplateId] = useState("");
  const [productName, setProductName] = useState(initialProductName);
  const [productDescription, setProductDescription] = useState(
    initialProductDescription
  );
  const [generationId, setGenerationId] = useState("");

  const templatesQuery = useVideoTemplates();
  const generateFromTemplate = useVideoGenerateFromTemplateMutation();
  const statusQuery = useVideoStatus(generationId);

  const templates = templatesQuery.data ?? [];
  const status = statusQuery.data as
    | { status?: string; video_url?: string; error?: string; progress?: number }
    | undefined;
  const isCompleted = status?.status === "completed";
  const isFailed = status?.status === "failed";
  const isProcessing =
    status?.status === "processing" || status?.status === "pending";

  const handleGenerate = useCallback(() => {
    if (!templateId.trim()) return;
    generateFromTemplate.mutate(
      {
        templateId: templateId.trim(),
        product:
          productName.trim() || productDescription.trim()
            ? {
                name: productName.trim() || undefined,
                description: productDescription.trim() || undefined,
              }
            : undefined,
      },
      {
        onSuccess: (data: { id?: string }) => {
          if (data?.id) {
            setGenerationId(data.id);
            onVideoGenerated?.({ id: data.id });
          }
        },
      }
    );
  }, [
    templateId,
    productName,
    productDescription,
    generateFromTemplate,
    onVideoGenerated,
  ]);

  const canGenerate = !!templateId.trim() && !generateFromTemplate.isPending;

  if (compact) {
    return (
      <div className="space-y-2">
        <Select
          value={templateId}
          onValueChange={setTemplateId}
          disabled={templatesQuery.isLoading}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue
              placeholder={
                templatesQuery.isLoading ? "Loading…" : "Select template"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Product name (optional)"
          className="max-w-xs"
        />
        <Input
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          placeholder="Description (optional)"
          className="max-w-xs"
        />
        <Button size="sm" onClick={handleGenerate} disabled={!canGenerate}>
          {generateFromTemplate.isPending ? "Starting…" : "Generate video"}
        </Button>
        {generationId && (
          <div className="text-sm text-muted-foreground">
            {isProcessing && "Processing…"}
            {isFailed && (status?.error ?? "Failed")}
            {isCompleted && status?.video_url && (
              <video
                src={status.video_url}
                controls
                className="mt-2 w-full max-w-xs rounded"
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          Choose a template, optional product name/description, then generate.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Template</Label>
          <Select
            value={templateId}
            onValueChange={setTemplateId}
            disabled={templatesQuery.isLoading}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue
                placeholder={
                  templatesQuery.isLoading
                    ? "Loading templates…"
                    : "Select a template"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Product name (optional)</Label>
          <Input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Product name"
            className="max-w-xs"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            Product description (optional)
          </Label>
          <Input
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            placeholder="Short description"
            className="max-w-md"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleGenerate} disabled={!canGenerate}>
            {generateFromTemplate.isPending ? "Starting…" : "Generate video"}
          </Button>
          {(isCompleted || isFailed) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGenerationId("")}
            >
              Generate another
            </Button>
          )}
        </div>
        {generateFromTemplate.isError && (
          <p className="text-sm text-destructive">
            {(generateFromTemplate.error as Error)?.message ??
              "Failed to start generation."}
          </p>
        )}
        {generationId && (
          <div className="space-y-2 rounded-md border p-3">
            <Label className="text-xs font-medium">Generation status</Label>
            {statusQuery.isLoading && !status && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {isProcessing && (
              <p className="text-sm text-muted-foreground">
                Processing…{" "}
                {status?.progress != null ? `${status.progress}%` : ""}
              </p>
            )}
            {isFailed && (
              <p className="text-sm text-destructive">
                {status?.error ?? "Generation failed."}
              </p>
            )}
            {isCompleted && status?.video_url && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Preview:</p>
                <video
                  src={status.video_url}
                  controls
                  className="w-full max-w-lg rounded-lg"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
