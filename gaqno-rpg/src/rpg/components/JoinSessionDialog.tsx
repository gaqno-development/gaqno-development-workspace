import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRpgSessionByCode } from '../hooks/useRpgSessions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@gaqno-dev/frontcore/components/ui';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import { Label } from '@gaqno-dev/frontcore/components/ui';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { LogIn } from 'lucide-react';

export const JoinSessionDialog: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const { data: session, isLoading, error } = useRpgSessionByCode(code.length >= 4 ? code : null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (session) {
      navigate(`/rpg/sessions/${session.id}`);
      setOpen(false);
      setCode('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <LogIn className="w-4 h-4 mr-2" />
            Entrar por Código
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entrar em uma Sessão</DialogTitle>
          <DialogDescription>
            Digite o código da sessão para entrar
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">Código da Sessão</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={10}
              className="font-mono text-lg tracking-wider text-center"
            />
            {code.length >= 4 && session && (
              <p className="text-sm text-green-600 mt-2">
                Sessão encontrada: {session.name}
              </p>
            )}
            {code.length >= 4 && error && (
              <p className="text-sm text-red-600 mt-2">
                Sessão não encontrada
              </p>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={!session || isLoading}
            loading={isLoading}
            className="w-full"
          >
            Entrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

