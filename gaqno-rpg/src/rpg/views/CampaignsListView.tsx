import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRpgPublicCampaigns, useRpgMyCampaigns } from '../hooks/useRpgCampaigns';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import { CampaignCard } from '../components/CampaignCard';
import { Plus, Search, Filter } from 'lucide-react';
import { Campaign, CampaignGenre } from '../types/campaign.types';

const ALL_GENRES: CampaignGenre[] = ['Horror', 'Épico', 'Sci-Fi', 'Fantasy', 'Mystery', 'Comedy', 'Drama', 'Action'];

export const CampaignsListView: React.FC = () => {
  const navigate = useNavigate();
  const { data: publicCampaigns, isLoading: loadingPublic } = useRpgPublicCampaigns();
  const { data: myCampaigns, isLoading: loadingMy } = useRpgMyCampaigns();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<CampaignGenre | 'all'>('all');

  const handleUseCampaign = (campaignId: string) => {
    navigate(`/rpg/sessions/new?campaignId=${campaignId}`);
  };

  const filterCampaigns = (campaigns: Campaign[]): Campaign[] => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        searchQuery === '' ||
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.pitch?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGenre = selectedGenre === 'all' || campaign.genre === selectedGenre;
      
      return matchesSearch && matchesGenre;
    });
  };

  const filteredPublicCampaigns = useMemo(
    () => (publicCampaigns ? filterCampaigns(publicCampaigns) : []),
    [publicCampaigns, searchQuery, selectedGenre]
  );

  const filteredMyCampaigns = useMemo(
    () => (myCampaigns ? filterCampaigns(myCampaigns) : []),
    [myCampaigns, searchQuery, selectedGenre]
  );

  if (loadingPublic || loadingMy) {
    return <div className="p-6">Carregando campanhas...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Campanhas RPG</h1>
        <Button onClick={() => navigate('/rpg/campaigns/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Nova Campanha
        </Button>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar campanhas por nome, descrição ou pitch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Gênero:</span>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedGenre === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedGenre('all')}
            >
              Todos
            </Button>
            {ALL_GENRES.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {filteredPublicCampaigns.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Campanhas Públicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPublicCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={() => navigate(`/rpg/campaigns/${campaign.id}`)}
                onUse={() => handleUseCampaign(campaign.id)}
              />
            ))}
          </div>
        </div>
      )}

      {filteredMyCampaigns.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Minhas Campanhas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMyCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={() => navigate(`/rpg/campaigns/${campaign.id}`)}
                onEdit={() => navigate(`/rpg/campaigns/${campaign.id}/edit`)}
                onUse={() => handleUseCampaign(campaign.id)}
              />
            ))}
          </div>
        </div>
      )}

      {filteredPublicCampaigns.length === 0 &&
        filteredMyCampaigns.length === 0 &&
        (publicCampaigns && publicCampaigns.length > 0 || myCampaigns && myCampaigns.length > 0) && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma campanha encontrada com os filtros selecionados.
          </div>
        )}

      {(!publicCampaigns || publicCampaigns.length === 0) &&
        (!myCampaigns || myCampaigns.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma campanha disponível. Crie uma nova campanha para começar!
          </div>
        )}
    </div>
  );
};

