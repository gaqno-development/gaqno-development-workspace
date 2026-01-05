import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRpgCampaign } from '../hooks/useRpgCampaigns';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { Badge } from '@gaqno-dev/frontcore/components/ui';
import { ArrowLeft, Edit, MapPin, Users, BookOpen, Sparkles, Sword } from 'lucide-react';
import { useAuth } from '@gaqno-dev/frontcore/hooks';

export const CampaignDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: campaign, isLoading } = useRpgCampaign(id || null);

  if (isLoading) {
    return <div className="p-6">Carregando campanha...</div>;
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/rpg/campaigns')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="mt-4 text-center text-muted-foreground">
          Campanha não encontrada
        </div>
      </div>
    );
  }

  const isOwner = campaign.userId === user?.id;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/rpg/campaigns')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-muted-foreground mb-4">{campaign.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="capitalize">
              {campaign.status}
            </Badge>
            {campaign.genre && (
              <Badge variant="secondary">
                {campaign.genre}
              </Badge>
            )}
            {campaign.isPublic && (
              <Badge variant="secondary">Público</Badge>
            )}
          </div>
        </div>
        {isOwner && (
          <Button onClick={() => navigate(`/rpg/campaigns/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start"
          onClick={() => navigate(`/rpg/campaigns/${id}/locations`)}
        >
          <MapPin className="w-5 h-5 mb-2" />
          <span className="font-semibold">Localizações</span>
          <span className="text-xs text-muted-foreground mt-1">
            Gerenciar locais da campanha
          </span>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start"
          onClick={() => navigate(`/rpg/campaigns/${id}/custom-classes`)}
        >
          <Users className="w-5 h-5 mb-2" />
          <span className="font-semibold">Classes Customizadas</span>
          <span className="text-xs text-muted-foreground mt-1">
            Gerenciar classes personalizadas
          </span>
        </Button>
      </div>

      <div className="space-y-6">
        {campaign.concept && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Conceito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {campaign.concept.theme && (
                  <div>
                    <span className="font-semibold">Tema: </span>
                    <span>{campaign.concept.theme}</span>
                  </div>
                )}
                {campaign.concept.tone && (
                  <div>
                    <span className="font-semibold">Tom: </span>
                    <span>{campaign.concept.tone}</span>
                  </div>
                )}
                {campaign.concept.setting && (
                  <div>
                    <span className="font-semibold">Ambiente: </span>
                    <span>{campaign.concept.setting}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {campaign.world && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Mundo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {campaign.world.name && (
                  <div>
                    <span className="font-semibold">Nome: </span>
                    <span>{campaign.world.name}</span>
                  </div>
                )}
                {campaign.world.geography && (
                  <div>
                    <span className="font-semibold">Geografia: </span>
                    <span>{campaign.world.geography}</span>
                  </div>
                )}
                {campaign.world.magic && (
                  <div>
                    <span className="font-semibold">Magia: </span>
                    <span>{campaign.world.magic}</span>
                  </div>
                )}
                {campaign.world.tech && (
                  <div>
                    <span className="font-semibold">Tecnologia: </span>
                    <span>{campaign.world.tech}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {campaign.initialNarrative && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Narrativa Inicial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaign.initialNarrative.opening && (
                  <div>
                    <span className="font-semibold">Abertura: </span>
                    <p className="mt-1 text-sm">{campaign.initialNarrative.opening}</p>
                  </div>
                )}
                {campaign.initialNarrative.inciting_incident && (
                  <div>
                    <span className="font-semibold">Incidente Incitante: </span>
                    <p className="mt-1 text-sm">{campaign.initialNarrative.inciting_incident}</p>
                  </div>
                )}
                {campaign.initialNarrative.first_quest && (
                  <div>
                    <span className="font-semibold">Primeira Quest: </span>
                    <p className="mt-1 text-sm">{campaign.initialNarrative.first_quest}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {campaign.npcs && campaign.npcs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                NPCs ({campaign.npcs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaign.npcs.map((npc, index) => (
                  <div key={index} className="border-l-2 border-primary/20 pl-3">
                    <div className="font-semibold">{npc.name}</div>
                    {npc.role && (
                      <div className="text-sm text-muted-foreground">Papel: {npc.role}</div>
                    )}
                    {npc.description && (
                      <p className="text-sm mt-1">{npc.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {campaign.hooks && campaign.hooks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sword className="w-5 h-5" />
                Ganchos ({campaign.hooks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {campaign.hooks.map((hook, index) => (
                  <li key={index} className="text-sm">{hook}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {campaign.pitch && (
          <Card>
            <CardHeader>
              <CardTitle>Pitch</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{campaign.pitch}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

