import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  useRpgCustomClasses,
  useCreateRpgCustomClass,
  useUpdateRpgCustomClass,
  useDeleteRpgCustomClass,
  useGenerateRpgCustomClass,
} from '../hooks/useRpgCustomClasses';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@gaqno-dev/frontcore/components/ui';
import { CustomClassCard } from '../components/CustomClassCard';
import { Plus, Search, Sparkles } from 'lucide-react';
import {
  CustomClass,
  CreateCustomClassRequest,
  GenerateCustomClassRequest,
} from '../types/custom-class.types';
import { Label } from '@gaqno-dev/frontcore/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@gaqno-dev/frontcore/components/ui';

const DND_CLASSES = [
  'barbarian',
  'bard',
  'cleric',
  'druid',
  'fighter',
  'monk',
  'paladin',
  'ranger',
  'rogue',
  'sorcerer',
  'warlock',
  'wizard',
];

export const CustomClassesView: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: customClasses, isLoading } = useRpgCustomClasses(campaignId || null);
  const createCustomClass = useCreateRpgCustomClass(campaignId || '');
  const updateCustomClass = useUpdateRpgCustomClass(campaignId || '');
  const deleteCustomClass = useDeleteRpgCustomClass(campaignId || '');
  const generateCustomClass = useGenerateRpgCustomClass(campaignId || '');

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<CustomClass | null>(null);

  const [createForm, setCreateForm] = useState<CreateCustomClassRequest>({
    name: '',
    description: '',
    baseClass: '',
  });

  const [generateForm, setGenerateForm] = useState<GenerateCustomClassRequest>({
    baseClass: '',
    name: '',
    theme: '',
  });

  const filterClasses = (classes: CustomClass[]): CustomClass[] => {
    return classes.filter((customClass) => {
      const matchesSearch =
        searchQuery === '' ||
        customClass.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customClass.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customClass.baseClass?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  };

  const filteredClasses = useMemo(
    () => (customClasses ? filterClasses(customClasses) : []),
    [customClasses, searchQuery]
  );

  const handleCreate = async () => {
    try {
      await createCustomClass.mutateAsync(createForm);
      setIsCreateDialogOpen(false);
      setCreateForm({ name: '', description: '', baseClass: '' });
    } catch (error) {
      console.error('Error creating custom class:', error);
    }
  };

  const handleGenerate = async () => {
    try {
      await generateCustomClass.mutateAsync(generateForm);
      setIsGenerateDialogOpen(false);
      setGenerateForm({ baseClass: '', name: '', theme: '' });
    } catch (error) {
      console.error('Error generating custom class:', error);
    }
  };

  const handleEdit = (customClass: CustomClass) => {
    setEditingClass(customClass);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingClass) return;
    try {
      await updateCustomClass.mutateAsync({
        id: editingClass.id,
        data: {
          name: editingClass.name,
          description: editingClass.description,
          baseClass: editingClass.baseClass,
        },
      });
      setIsEditDialogOpen(false);
      setEditingClass(null);
    } catch (error) {
      console.error('Error updating custom class:', error);
    }
  };

  const handleDelete = async (classId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta classe customizada?')) {
      try {
        await deleteCustomClass.mutateAsync(classId);
      } catch (error) {
        console.error('Error deleting custom class:', error);
      }
    }
  };

  if (!campaignId) {
    return <div className="p-6">Campanha não encontrada</div>;
  }

  if (isLoading) {
    return <div className="p-6">Carregando classes customizadas...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Classes Customizadas</h1>
        <div className="flex gap-2">
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar com IA
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Classe Customizada com IA</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="generate-base-class">Classe Base (D&D 5e)</Label>
                  <Select
                    value={generateForm.baseClass || ''}
                    onValueChange={(value) => setGenerateForm({ ...generateForm, baseClass: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma classe base" />
                    </SelectTrigger>
                    <SelectContent>
                      {DND_CLASSES.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="generate-name">Nome (opcional)</Label>
                  <Input
                    id="generate-name"
                    value={generateForm.name || ''}
                    onChange={(e) => setGenerateForm({ ...generateForm, name: e.target.value })}
                    placeholder="Nome da classe customizada"
                  />
                </div>
                <div>
                  <Label htmlFor="generate-theme">Tema (opcional)</Label>
                  <Input
                    id="generate-theme"
                    value={generateForm.theme || ''}
                    onChange={(e) => setGenerateForm({ ...generateForm, theme: e.target.value })}
                    placeholder="Ex: um guerreiro que usa magia das sombras"
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={generateCustomClass.isPending || !generateForm.baseClass}
                >
                  {generateCustomClass.isPending ? 'Gerando...' : 'Gerar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar Classe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Classe Customizada</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create-name">Nome</Label>
                  <Input
                    id="create-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Nome da classe"
                  />
                </div>
                <div>
                  <Label htmlFor="create-base-class">Classe Base (opcional)</Label>
                  <Select
                    value={createForm.baseClass || ''}
                    onValueChange={(value) => setCreateForm({ ...createForm, baseClass: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {DND_CLASSES.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="create-description">Descrição</Label>
                  <Input
                    id="create-description"
                    value={createForm.description || ''}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Descrição da classe"
                  />
                </div>
                <Button onClick={handleCreate} disabled={createCustomClass.isPending || !createForm.name}>
                  {createCustomClass.isPending ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma classe customizada encontrada.</p>
          <p className="text-sm mt-2">Crie uma nova classe ou gere uma com IA.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((customClass) => (
            <CustomClassCard
              key={customClass.id}
              customClass={customClass}
              onEdit={() => handleEdit(customClass)}
              onDelete={() => handleDelete(customClass.id)}
            />
          ))}
        </div>
      )}

      {editingClass && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Classe Customizada</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-base-class">Classe Base</Label>
                <Select
                  value={editingClass.baseClass || ''}
                  onValueChange={(value) => setEditingClass({ ...editingClass, baseClass: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {DND_CLASSES.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Input
                  id="edit-description"
                  value={editingClass.description || ''}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, description: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleUpdate} disabled={updateCustomClass.isPending}>
                {updateCustomClass.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

