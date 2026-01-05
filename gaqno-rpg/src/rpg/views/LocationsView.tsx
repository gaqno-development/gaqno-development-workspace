import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useRpgLocations,
  useCreateRpgLocation,
  useUpdateRpgLocation,
  useDeleteRpgLocation,
  useGenerateRpgLocation,
} from '../hooks/useRpgLocations';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@gaqno-dev/frontcore/components/ui';
import { LocationCard } from '../components/LocationCard';
import { Plus, Search, Filter, Sparkles } from 'lucide-react';
import { Location, LocationType, CreateLocationRequest, GenerateLocationRequest } from '../types/location.types';
import { Label } from '@gaqno-dev/frontcore/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@gaqno-dev/frontcore/components/ui';

const ALL_LOCATION_TYPES: LocationType[] = ['dungeon', 'city', 'region', 'landmark', 'building'];

export const LocationsView: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { data: locations, isLoading } = useRpgLocations(campaignId || null);
  const createLocation = useCreateRpgLocation(campaignId || '');
  const updateLocation = useUpdateRpgLocation(campaignId || '');
  const deleteLocation = useDeleteRpgLocation(campaignId || '');
  const generateLocation = useGenerateRpgLocation(campaignId || '');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<LocationType | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const [createForm, setCreateForm] = useState<CreateLocationRequest>({
    name: '',
    type: 'dungeon',
    description: '',
  });

  const [generateForm, setGenerateForm] = useState<GenerateLocationRequest>({
    name: '',
    type: 'dungeon',
    description: '',
  });

  const filterLocations = (locations: Location[]): Location[] => {
    return locations.filter((location) => {
      const matchesSearch =
        searchQuery === '' ||
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'all' || location.type === selectedType;

      return matchesSearch && matchesType;
    });
  };

  const filteredLocations = useMemo(
    () => (locations ? filterLocations(locations) : []),
    [locations, searchQuery, selectedType]
  );

  const handleCreate = async () => {
    try {
      await createLocation.mutateAsync(createForm);
      setIsCreateDialogOpen(false);
      setCreateForm({ name: '', type: 'dungeon', description: '' });
    } catch (error) {
      console.error('Error creating location:', error);
    }
  };

  const handleGenerate = async () => {
    try {
      await generateLocation.mutateAsync(generateForm);
      setIsGenerateDialogOpen(false);
      setGenerateForm({ name: '', type: 'dungeon', description: '' });
    } catch (error) {
      console.error('Error generating location:', error);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingLocation) return;
    try {
      await updateLocation.mutateAsync({
        id: editingLocation.id,
        data: {
          name: editingLocation.name,
          type: editingLocation.type,
          description: editingLocation.description,
        },
      });
      setIsEditDialogOpen(false);
      setEditingLocation(null);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleDelete = async (locationId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta localização?')) {
      try {
        await deleteLocation.mutateAsync(locationId);
      } catch (error) {
        console.error('Error deleting location:', error);
      }
    }
  };

  if (!campaignId) {
    return <div className="p-6">Campanha não encontrada</div>;
  }

  if (isLoading) {
    return <div className="p-6">Carregando localizações...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Localizações</h1>
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
                <DialogTitle>Gerar Localização com IA</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="generate-name">Nome</Label>
                  <Input
                    id="generate-name"
                    value={generateForm.name}
                    onChange={(e) => setGenerateForm({ ...generateForm, name: e.target.value })}
                    placeholder="Nome da localização"
                  />
                </div>
                <div>
                  <Label htmlFor="generate-type">Tipo</Label>
                  <Select
                    value={generateForm.type}
                    onValueChange={(value) => setGenerateForm({ ...generateForm, type: value as LocationType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_LOCATION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="generate-description">Descrição (opcional)</Label>
                  <Input
                    id="generate-description"
                    value={generateForm.description || ''}
                    onChange={(e) => setGenerateForm({ ...generateForm, description: e.target.value })}
                    placeholder="Descrição breve"
                  />
                </div>
                <Button onClick={handleGenerate} disabled={generateLocation.isPending || !generateForm.name}>
                  {generateLocation.isPending ? 'Gerando...' : 'Gerar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar Localização
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Localização</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create-name">Nome</Label>
                  <Input
                    id="create-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Nome da localização"
                  />
                </div>
                <div>
                  <Label htmlFor="create-type">Tipo</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(value) => setCreateForm({ ...createForm, type: value as LocationType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_LOCATION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
                    placeholder="Descrição da localização"
                  />
                </div>
                <Button onClick={handleCreate} disabled={createLocation.isPending || !createForm.name}>
                  {createLocation.isPending ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar localizações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tipo:</span>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
            >
              Todos
            </Button>
            {ALL_LOCATION_TYPES.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {filteredLocations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma localização encontrada.</p>
          <p className="text-sm mt-2">Crie uma nova localização ou gere uma com IA.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onEdit={() => handleEdit(location)}
              onDelete={() => handleDelete(location.id)}
            />
          ))}
        </div>
      )}

      {editingLocation && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Localização</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editingLocation.name}
                  onChange={(e) =>
                    setEditingLocation({ ...editingLocation, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Tipo</Label>
                <Select
                  value={editingLocation.type}
                  onValueChange={(value) =>
                    setEditingLocation({ ...editingLocation, type: value as LocationType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_LOCATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Input
                  id="edit-description"
                  value={editingLocation.description || ''}
                  onChange={(e) =>
                    setEditingLocation({ ...editingLocation, description: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleUpdate} disabled={updateLocation.isPending}>
                {updateLocation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

