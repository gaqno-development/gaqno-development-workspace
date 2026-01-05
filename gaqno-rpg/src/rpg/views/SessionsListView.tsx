import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRpgSessions, useCreateRpgSession, useDeleteRpgSession } from '../hooks/useRpgSessions';
import { useRpgCampaigns } from '../hooks/useRpgCampaigns';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@gaqno-dev/frontcore/components/ui';
import { Plus, Trash2, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@gaqno-dev/frontcore/components/ui';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import { Label } from '@gaqno-dev/frontcore/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@gaqno-dev/frontcore/components/ui';
import { useForm } from 'react-hook-form';
import { JoinSessionDialog } from '../components/JoinSessionDialog';
import { Campaign } from '../types/campaign.types';

interface CreateSessionForm {
  name: string;
  description?: string;
  campaignId?: string;
}

export const SessionsListView: React.FC = () => {
  const navigate = useNavigate();
  const { data: sessions, isLoading } = useRpgSessions();
  const createSession = useCreateRpgSession();
  const deleteSession = useDeleteRpgSession();
  const { data: campaigns } = useRpgCampaigns();
  const [open, setOpen] = React.useState(false);
  const { register, handleSubmit, reset, watch, setValue } = useForm<CreateSessionForm>();

  const onSubmit = async (data: CreateSessionForm) => {
    // Garantir que campaignId seja undefined se não foi selecionado
    const sessionData = {
      name: data.name,
      description: data.description,
      ...(data.campaignId && data.campaignId !== 'none' ? { campaignId: data.campaignId } : {}),
    };
    const newSession = await createSession.mutateAsync(sessionData);
    reset();
    setOpen(false);
    if (newSession?.id) {
      navigate(`/rpg/sessions/${newSession.id}`);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta sessão?')) {
      await deleteSession.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div>Carregando sessões...</div>;
  }

  const copyRoomCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sessões RPG</h1>
        <div className="flex gap-2">
          <JoinSessionDialog />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Sessão
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Sessão</DialogTitle>
              <DialogDescription>
                Crie uma nova sessão de RPG para começar a jogar
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  {...register('name', { required: true })}
                  placeholder="Nome da sessão"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  {...register('description')}
                  placeholder="Descrição opcional"
                />
              </div>
              <div>
                <Label htmlFor="campaignId">Campanha (opcional)</Label>
                <Select
                  value={watch('campaignId') || 'none'}
                  onValueChange={(value: string) => setValue('campaignId', value === 'none' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {campaigns?.filter((c: Campaign) => c.status === 'active').map((campaign: Campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" loading={createSession.isPending}>
                Criar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions?.map((session) => (
          <Card
            key={session.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/rpg/sessions/${session.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{session.name}</CardTitle>
                  <CardDescription>{session.description || 'Sem descrição'}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDelete(session.id, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Status: {session.status}
                </div>
                {session.roomCode && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Código:</span>
                    <code className="px-2 py-1 bg-muted rounded font-mono text-sm font-semibold">
                      {session.roomCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => copyRoomCode(session.roomCode, e)}
                      title="Copiar código"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma sessão criada ainda. Crie uma nova sessão para começar!
        </div>
      )}
    </div>
  );
};

