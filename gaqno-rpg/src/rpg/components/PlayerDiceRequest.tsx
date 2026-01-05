import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@gaqno-dev/frontcore/components/ui';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { AnimatedDice } from './AnimatedDice';
import { DiceRollRequest, DiceResult } from '../types/rpg.types';
import { X, Dice1 } from 'lucide-react';

interface PlayerDiceRequestProps {
  request: DiceRollRequest | null;
  onRollComplete: (requestId: string, result: DiceResult) => void;
  onDismiss?: () => void;
}

export const PlayerDiceRequest: React.FC<PlayerDiceRequestProps> = ({
  request,
  onRollComplete,
  onDismiss,
}) => {
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null);
  const [hasRolled, setHasRolled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (request) {
      console.log('[PlayerDiceRequest] Request received:', {
        request,
        status: request.status,
        isPending: request.status === 'pending',
      });
      if (request.status === 'pending') {
        setDiceResult(null);
        setHasRolled(false);
        setIsSubmitting(false);
      }
    }
  }, [request]);

  const handleRoll = (result: DiceResult) => {
    setDiceResult(result);
    setHasRolled(true);
  };

  const handleSubmit = async () => {
    if (!request || !diceResult) return;
    
    setIsSubmitting(true);
    try {
      await onRollComplete(request.id, diceResult);
      setTimeout(() => {
        onDismiss?.();
        setDiceResult(null);
        setHasRolled(false);
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error('Error submitting dice roll:', error);
      setIsSubmitting(false);
    }
  };

  if (!request) {
    console.log('[PlayerDiceRequest] No request, returning null');
    return null;
  }
  
  if (request.status !== 'pending') {
    console.log('[PlayerDiceRequest] Request status is not pending:', request.status);
    return null;
  }
  
  console.log('[PlayerDiceRequest] Rendering dice request dialog');

  return (
    <Dialog open={!!request} onOpenChange={() => onDismiss?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dice1 className="w-5 h-5" />
            Rolagem de Dados Solicitada
          </DialogTitle>
          <DialogDescription>
            O mestre está pedindo para você rolar dados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {request.context && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Contexto:</p>
              <p className="text-sm text-muted-foreground">{request.context}</p>
            </div>
          )}

          <div className="flex items-center justify-center p-6">
            <AnimatedDice
              onRoll={handleRoll}
              formula={request.formula}
              target={request.target}
              disabled={hasRolled || isSubmitting}
              mode="player"
            />
          </div>

          {diceResult && (
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold mb-2">
                {diceResult.roll}
              </div>
              <div className="text-sm text-muted-foreground">
                Natural: {diceResult.natural} | Fórmula: {diceResult.formula}
                {diceResult.target && ` | DC: ${diceResult.target}`}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!hasRolled || isSubmitting}
              className="flex-1 min-h-[44px]"
            >
              {isSubmitting ? 'Submetendo...' : 'Submeter'}
            </Button>
            {onDismiss && (
              <Button
                variant="outline"
                onClick={onDismiss}
                className="min-h-[44px]"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

