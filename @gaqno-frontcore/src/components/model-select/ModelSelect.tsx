import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui';
import { Label } from '../ui';
import { useModelsRegistry } from '../../hooks/ai';
import type { CapabilityRegistry } from '../../hooks/ai';

export type ModelCapability = 'text' | 'image';

export interface ModelSelectProps {
  capability: ModelCapability;
  value?: string;
  onValueChange?: (model: string, provider?: string) => void;
  providerValue?: string;
  onProviderChange?: (provider: string) => void;
  placeholder?: string;
  loadingPlaceholder?: string;
  showProvider?: boolean;
  aiServiceBaseUrl?: string;
  className?: string;
}

export function ModelSelect({
  capability,
  value,
  onValueChange,
  providerValue,
  onProviderChange,
  placeholder = 'Selecione o modelo',
  loadingPlaceholder = 'Carregando...',
  showProvider = true,
  aiServiceBaseUrl,
  className,
}: ModelSelectProps) {
  const { data: registry, isLoading } = useModelsRegistry(aiServiceBaseUrl);

  const capabilityData: CapabilityRegistry | undefined =
    registry?.[capability];
  const providers = capabilityData?.providers ?? [];
  const effectiveProvider =
    providerValue ??
    capabilityData?.defaultProvider ??
    providers[0]?.id;
  const models =
    effectiveProvider && showProvider
      ? providers.find((p) => p.id === effectiveProvider)?.models ?? []
      : providers.flatMap((p) => p.models);

  const handleProviderChange = (v: string) => {
    onProviderChange?.(v);
  };

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      {showProvider && providers.length > 1 && (
        <div>
          <Label htmlFor={`model-provider-${capability}`}>Provedor</Label>
          <Select
            value={effectiveProvider}
            onValueChange={handleProviderChange}
          >
            <SelectTrigger id={`model-provider-${capability}`}>
              <SelectValue
                placeholder={
                  isLoading ? loadingPlaceholder : 'Selecione o provedor'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor={`model-select-${capability}`}>Modelo</Label>
        <Select
          value={value}
          onValueChange={(model) =>
            onValueChange?.(model, effectiveProvider)
          }
        >
          <SelectTrigger id={`model-select-${capability}`}>
            <SelectValue
              placeholder={
                isLoading
                  ? loadingPlaceholder
                  : models.length > 0
                    ? placeholder
                    : 'Nenhum modelo disponível'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
