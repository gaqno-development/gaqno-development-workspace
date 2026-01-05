import React, { useState, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { RpgCharacter } from '../types/rpg.types';
import { Loader2 } from 'lucide-react';

interface CharacterSheetProps {
  character: RpgCharacter;
  onUpdate?: (updates: { name?: string; attributes?: Record<string, any>; resources?: Record<string, any>; metadata?: Record<string, any> }) => void;
  editable?: boolean;
}

const AttributeRow = memo<{ 
  label: string; 
  value: any; 
  editable: boolean; 
  onChange?: (value: any) => void;
}>(({ label, value, editable, onChange }) => {
  const [localValue, setLocalValue] = useState(String(value || ''));
  const [isEditing, setIsEditing] = useState(false);

  React.useEffect(() => {
    if (!isEditing) {
      setLocalValue(String(value || ''));
    }
  }, [value, isEditing]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (onChange && localValue !== String(value)) {
      const numValue = Number(localValue);
      onChange(isNaN(numValue) ? localValue : numValue);
    }
  }, [localValue, value, onChange]);

  if (editable && isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground capitalize flex-1">{label}:</span>
        <Input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          className="h-8 w-20"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div 
      className="flex justify-between cursor-pointer hover:bg-muted/50 p-1 rounded"
      onClick={() => editable && setIsEditing(true)}
    >
      <span className="text-sm text-muted-foreground capitalize">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
});

AttributeRow.displayName = 'AttributeRow';

export const CharacterSheet = memo<CharacterSheetProps>(({
  character,
  onUpdate,
  editable = false
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [localCharacter, setLocalCharacter] = useState(character);

  React.useEffect(() => {
    setLocalCharacter(character);
  }, [character]);

  const attributes = useMemo(() => Object.entries(localCharacter.attributes || {}), [localCharacter.attributes]);
  const resources = useMemo(() => Object.entries(localCharacter.resources || {}), [localCharacter.resources]);

  const handleAttributeChange = useCallback((key: string, value: any) => {
    const updated = {
      ...localCharacter,
      attributes: {
        ...localCharacter.attributes,
        [key]: value
      }
    };
    setLocalCharacter(updated);
  }, [localCharacter]);

  const handleResourceChange = useCallback((key: string, value: any) => {
    const updated = {
      ...localCharacter,
      resources: {
        ...localCharacter.resources,
        [key]: value
      }
    };
    setLocalCharacter(updated);
  }, [localCharacter]);

  const handleSave = useCallback(async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(localCharacter);
    } finally {
      setIsSaving(false);
    }
  }, [localCharacter, onUpdate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {localCharacter.name}
          {editable && onUpdate && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Salvar'
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {attributes.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Atributos</h3>
            <div className="grid grid-cols-2 gap-2">
              {attributes.map(([key, value]) => (
                <AttributeRow
                  key={key}
                  label={key}
                  value={value}
                  editable={editable}
                  onChange={(newValue) => handleAttributeChange(key, newValue)}
                />
              ))}
            </div>
          </div>
        )}

        {resources.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Recursos</h3>
            <div className="grid grid-cols-2 gap-2">
              {resources.map(([key, value]) => (
                <AttributeRow
                  key={key}
                  label={key}
                  value={value}
                  editable={editable}
                  onChange={(newValue) => handleResourceChange(key, newValue)}
                />
              ))}
            </div>
          </div>
        )}

        {attributes.length === 0 && resources.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum atributo ou recurso definido
          </p>
        )}
      </CardContent>
    </Card>
  );
});

CharacterSheet.displayName = 'CharacterSheet';

