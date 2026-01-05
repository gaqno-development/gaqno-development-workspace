import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Textarea } from '@gaqno-dev/frontcore/components/ui';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Save, X } from 'lucide-react';

interface QuickNotesProps {
  notes: string;
  onSave: (notes: string) => void;
  className?: string;
}

export const QuickNotes: React.FC<QuickNotesProps> = ({
  notes: initialNotes,
  onSave,
  className,
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (value: string) => {
    setNotes(value);
    setHasChanges(value !== initialNotes);
  };

  const handleSave = () => {
    onSave(notes);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setNotes(initialNotes);
    setIsEditing(false);
    setHasChanges(false);
  };

  return (
    <GlassCard variant="light" className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold high-contrast-text">Notas Rápidas</h3>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-xs"
          >
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
              className="text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              Salvar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Cancelar
            </Button>
          </div>
        )}
      </div>
      {isEditing ? (
        <Textarea
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-[200px] bg-black/20 border-white/10 text-readable-sm high-contrast-text"
          placeholder="Digite suas notas aqui..."
        />
      ) : (
        <div className="min-h-[200px] p-3 bg-black/20 rounded-lg border border-white/10">
          <p className="text-readable-sm high-contrast-text whitespace-pre-wrap">
            {notes || 'Nenhuma nota ainda. Clique em "Editar" para adicionar.'}
          </p>
        </div>
      )}
    </GlassCard>
  );
};

