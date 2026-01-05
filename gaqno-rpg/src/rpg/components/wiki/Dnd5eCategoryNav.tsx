import React from 'react';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import {
  Swords,
  Sparkles,
  Package,
  Users,
  Shield,
  BookOpen,
  Award,
  ScrollText,
  UserCircle,
  Gem,
  MessageSquare,
  School,
} from 'lucide-react';

export type WikiCategory =
  | 'monsters'
  | 'spells'
  | 'equipment'
  | 'classes'
  | 'races'
  | 'feats'
  | 'features'
  | 'backgrounds'
  | 'magic-items'
  | 'subclasses'
  | 'subraces'
  | 'languages'
  | 'magic-schools'
  | 'proficiencies';

interface CategoryConfig {
  id: WikiCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  apiCategory: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'monsters', label: 'Monstros', icon: Swords, apiCategory: 'monsters' },
  { id: 'spells', label: 'Magias', icon: Sparkles, apiCategory: 'spells' },
  { id: 'equipment', label: 'Equipamentos', icon: Package, apiCategory: 'equipment' },
  { id: 'classes', label: 'Classes', icon: Users, apiCategory: 'classes' },
  { id: 'races', label: 'Raças', icon: UserCircle, apiCategory: 'races' },
  { id: 'subclasses', label: 'Subclasses', icon: Shield, apiCategory: 'subclasses' },
  { id: 'subraces', label: 'Sub-raças', icon: UserCircle, apiCategory: 'subraces' },
  { id: 'feats', label: 'Talentos', icon: Award, apiCategory: 'feats' },
  { id: 'features', label: 'Características', icon: ScrollText, apiCategory: 'features' },
  { id: 'backgrounds', label: 'Antecedentes', icon: BookOpen, apiCategory: 'backgrounds' },
  { id: 'magic-items', label: 'Itens Mágicos', icon: Gem, apiCategory: 'magic-items' },
  { id: 'languages', label: 'Idiomas', icon: MessageSquare, apiCategory: 'languages' },
  { id: 'magic-schools', label: 'Escolas de Magia', icon: School, apiCategory: 'magic-schools' },
  { id: 'proficiencies', label: 'Proficiências', icon: Shield, apiCategory: 'proficiencies' },
];

interface Dnd5eCategoryNavProps {
  currentCategory: WikiCategory | null;
  onCategoryChange: (category: WikiCategory) => void;
  className?: string;
}

export const Dnd5eCategoryNav: React.FC<Dnd5eCategoryNavProps> = ({
  currentCategory,
  onCategoryChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {CATEGORIES.map((category) => {
        const Icon = category.icon;
        const isActive = currentCategory === category.id;
        return (
          <Button
            key={category.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className="flex items-center gap-2"
          >
            <Icon className="w-4 h-4" />
            {category.label}
          </Button>
        );
      })}
    </div>
  );
};

export { CATEGORIES };

