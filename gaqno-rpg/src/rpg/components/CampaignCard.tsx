import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@gaqno-dev/frontcore/components/ui';
import { Badge } from '@gaqno-dev/frontcore/components/ui';
import { 
  Ghost, 
  Sword, 
  Rocket, 
  Sparkles, 
  Shield, 
  Search, 
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { Campaign, CampaignGenre } from '../types/campaign.types';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface CampaignCardProps {
  campaign: Campaign;
  onClick?: () => void;
  onEdit?: () => void;
  onUse?: () => void;
  className?: string;
}

const genreIcons: Record<CampaignGenre, React.ComponentType<{ className?: string }>> = {
  Horror: Ghost,
  Épico: Sword,
  'Sci-Fi': Rocket,
  Fantasy: Sparkles,
  Mystery: Search,
  Comedy: BookOpen,
  Drama: Shield,
  Action: Sword,
};

const genreColors: Record<CampaignGenre, string> = {
  Horror: 'bg-red-500/20 text-red-400 border-red-500/30',
  Épico: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Sci-Fi': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Fantasy: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Mystery: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  Comedy: 'bg-green-500/20 text-green-400 border-green-500/30',
  Drama: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  Action: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onClick,
  onEdit,
  onUse,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [moodboardIndex, setMoodboardIndex] = useState(0);

  const GenreIcon = campaign.genre ? genreIcons[campaign.genre] : Sparkles;
  const genreColor = campaign.genre ? genreColors[campaign.genre] : 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  const handleMoodboardNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (campaign.moodboard && campaign.moodboard.length > 0) {
      setMoodboardIndex((prev) => (prev + 1) % campaign.moodboard!.length);
    }
  };

  const handleMoodboardPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (campaign.moodboard && campaign.moodboard.length > 0) {
      setMoodboardIndex((prev) => (prev - 1 + campaign.moodboard!.length) % campaign.moodboard!.length);
    }
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 cursor-pointer group',
        'bg-background/80 backdrop-blur-sm border-border/50',
        'hover:shadow-2xl hover:scale-[1.02] hover:border-primary/50',
        isHovered && 'scale-[1.02] shadow-2xl border-primary/50',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        )}
      />

      {campaign.colorPalette && campaign.colorPalette.length > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          {campaign.colorPalette.slice(0, 5).map((color, idx) => (
            <div
              key={idx}
              className="flex-1"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}

      <CardHeader className="relative z-10 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate mb-1">{campaign.name}</h3>
            {campaign.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {campaign.description}
              </p>
            )}
          </div>
          {campaign.genre && (
            <Badge className={cn('shrink-0', genreColor)}>
              <GenreIcon className="w-3 h-3 mr-1" />
              {campaign.genre}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        {campaign.moodboard && campaign.moodboard.length > 0 && (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/50">
            <img
              src={campaign.moodboard[moodboardIndex]}
              alt={`Moodboard ${moodboardIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {campaign.moodboard.length > 1 && (
              <>
                <button
                  onClick={handleMoodboardPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <button
                  onClick={handleMoodboardNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {campaign.moodboard.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-all',
                        idx === moodboardIndex ? 'bg-white' : 'bg-white/40'
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {campaign.currentArc && (
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="font-semibold">
              Sessão {campaign.currentArc.session} - Ato {campaign.currentArc.act}
            </Badge>
            <span className="text-muted-foreground truncate">{campaign.currentArc.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="capitalize">{campaign.status}</span>
          {campaign.isPublic && (
            <Badge variant="secondary" className="text-xs">Público</Badge>
          )}
        </div>

        {isHovered && campaign.pitch && (
          <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
              {campaign.pitch}
            </p>
          </div>
        )}

        {(onEdit || onUse) && (
          <div className="flex gap-2 pt-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="flex-1 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 rounded-md transition-colors"
              >
                Editar
              </button>
            )}
            {onUse && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUse();
                }}
                className="flex-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
              >
                Usar
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

