import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@gaqno-dev/frontcore/components/ui';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import { Label } from '@gaqno-dev/frontcore/components/ui';
import { Button } from '@gaqno-dev/frontcore/components/ui';

interface PlayerNameDialogProps {
  sessionId: string;
  open: boolean;
  onNameSubmit: (name: string) => void;
}

export const PlayerNameDialog: React.FC<PlayerNameDialogProps> = ({
  sessionId,
  open,
  onNameSubmit
}) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      if (sessionId) {
        localStorage.setItem(`player-name-${sessionId}`, name.trim());
      }
      onNameSubmit(name.trim());
    }
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Identificação</DialogTitle>
          <DialogDescription>
            Digite seu nome para participar da sessão
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="player-name">Seu Nome</Label>
            <Input
              id="player-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João, Maria, etc."
              maxLength={50}
              autoFocus
              required
            />
          </div>
          <Button type="submit" disabled={!name.trim()} className="w-full">
            Entrar na Sessão
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

