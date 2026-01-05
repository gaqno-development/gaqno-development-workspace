import React, { useState } from 'react';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Textarea } from '@gaqno-dev/frontcore/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { Progress } from '@gaqno-dev/frontcore/components/ui';
import { Loader2, Sparkles, RefreshCw, GitBranch, Edit3, X } from 'lucide-react';
import { CampaignStep } from '../types/campaign.types';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface CampaignStepEditorProps {
  step: CampaignStep;
  content: any;
  onGenerate: () => void;
  onRegenerate?: () => void;
  onBranch?: () => void;
  onUpdate: (content: any) => void;
  isGenerating: boolean;
  isBranching?: boolean;
  stepLabel: string;
  variants?: any[];
  onSelectVariant?: (variant: any) => void;
}

const SkeletonLoader = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-4 bg-muted rounded w-3/4" />
    <div className="h-4 bg-muted rounded w-full" />
    <div className="h-4 bg-muted rounded w-5/6" />
    <div className="h-4 bg-muted rounded w-4/5" />
  </div>
);

export const CampaignStepEditor: React.FC<CampaignStepEditorProps> = ({
  step,
  content,
  onGenerate,
  onRegenerate,
  onBranch,
  onUpdate,
  isGenerating,
  isBranching = false,
  stepLabel,
  variants,
  onSelectVariant,
}) => {
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  const formatContent = (data: any): string => {
    if (!data) return '';
    return JSON.stringify(data, null, 2);
  };

  const parseContent = (text: string): any => {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const handleEdit = () => {
    setEditedContent(formatContent(content));
    setEditing(true);
  };

  const handleSave = () => {
    const parsed = parseContent(editedContent);
    onUpdate(parsed);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedContent('');
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      onGenerate();
    }
  };

  const handleBranch = () => {
    if (onBranch) {
      onBranch();
    }
  };

  React.useEffect(() => {
    if (isGenerating || isBranching) {
      const interval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setGenerationProgress(0);
    }
  }, [isGenerating, isBranching]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{stepLabel}</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {!content && !editingPrompt && (
              <Button onClick={onGenerate} disabled={isGenerating || isBranching}>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar com IA
                  </>
                )}
              </Button>
            )}
            {content && !editing && !editingPrompt && (
              <>
                <Button variant="outline" onClick={handleEdit} size="sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                {onRegenerate && (
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={isGenerating || isBranching}
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerar
                  </Button>
                )}
                {onBranch && (
                  <Button
                    variant="outline"
                    onClick={handleBranch}
                    disabled={isGenerating || isBranching}
                    size="sm"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    Branching
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setEditingPrompt(true)}
                  size="sm"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Prompt
                </Button>
              </>
            )}
            {editingPrompt && (
              <Button
                variant="outline"
                onClick={() => setEditingPrompt(false)}
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {(isGenerating || isBranching) && (
          <div className="space-y-4">
            <Progress value={generationProgress} className="w-full" />
            <div className="space-y-2">
              <SkeletonLoader />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {isBranching ? 'Gerando variações...' : 'Gerando conteúdo com IA...'}
            </p>
          </div>
        )}

        {editingPrompt && !isGenerating && !isBranching && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Prompt Personalizado
              </label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="font-mono text-sm min-h-[150px]"
                placeholder="Digite um prompt personalizado para esta etapa..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onGenerate();
                  setEditingPrompt(false);
                }}
                disabled={!customPrompt.trim()}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar com Prompt
              </Button>
              <Button variant="outline" onClick={() => setEditingPrompt(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {!isGenerating && !isBranching && !editingPrompt && editing && (
          <div className="space-y-4">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="font-mono text-sm min-h-[300px]"
              placeholder="Cole ou edite o conteúdo JSON..."
            />
            <div className="flex gap-2">
              <Button onClick={handleSave}>Salvar</Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {!isGenerating && !isBranching && !editingPrompt && !editing && variants && variants.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Escolha uma variação:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {variants.map((variant, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-4 border rounded-lg cursor-pointer transition-all',
                    'hover:border-primary hover:shadow-md',
                    'bg-muted/50'
                  )}
                  onClick={() => onSelectVariant && onSelectVariant(variant)}
                >
                  <div className="bg-muted p-3 rounded mb-2">
                    <pre className="text-xs whitespace-pre-wrap font-mono line-clamp-6">
                      {formatContent(variant)}
                    </pre>
                  </div>
                  <Button size="sm" className="w-full">
                    Usar esta versão
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isGenerating && !isBranching && !editingPrompt && !editing && content && (!variants || variants.length === 0) && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {formatContent(content)}
              </pre>
            </div>
            {step === 'narrative' && content.opening && (
              <div className="mt-4 p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Preview:</h4>
                <p className="text-sm leading-relaxed">{content.opening}</p>
              </div>
            )}
          </div>
        )}

        {!isGenerating && !isBranching && !editingPrompt && !editing && !content && (!variants || variants.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            Clique em "Gerar com IA" para criar o conteúdo deste passo.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

