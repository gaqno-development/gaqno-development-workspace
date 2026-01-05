import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dnd5eCategoryNav, WikiCategory, CATEGORIES } from '../components/wiki/Dnd5eCategoryNav';
import { Dnd5eCategoryView } from '../components/wiki/Dnd5eCategoryView';
import { Card, CardContent } from '@gaqno-dev/frontcore/components/ui';
import { BookOpen } from 'lucide-react';

const CATEGORY_MAP: Record<WikiCategory, { apiCategory: string; title: string }> = {
  monsters: { apiCategory: 'monsters', title: 'Monstros' },
  spells: { apiCategory: 'spells', title: 'Magias' },
  equipment: { apiCategory: 'equipment', title: 'Equipamentos' },
  classes: { apiCategory: 'classes', title: 'Classes' },
  races: { apiCategory: 'races', title: 'Raças' },
  subclasses: { apiCategory: 'subclasses', title: 'Subclasses' },
  subraces: { apiCategory: 'subraces', title: 'Sub-raças' },
  feats: { apiCategory: 'feats', title: 'Talentos' },
  features: { apiCategory: 'features', title: 'Características' },
  backgrounds: { apiCategory: 'backgrounds', title: 'Antecedentes' },
  'magic-items': { apiCategory: 'magic-items', title: 'Itens Mágicos' },
  languages: { apiCategory: 'languages', title: 'Idiomas' },
  'magic-schools': { apiCategory: 'magic-schools', title: 'Escolas de Magia' },
  proficiencies: { apiCategory: 'proficiencies', title: 'Proficiências' },
};

export const WikiView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') as WikiCategory | null;
  const [currentCategory, setCurrentCategory] = useState<WikiCategory | null>(
    categoryParam || 'monsters',
  );

  useEffect(() => {
    if (categoryParam) {
      const validCategory = CATEGORIES.find(c => c.id === categoryParam);
      if (validCategory && categoryParam !== currentCategory) {
        setCurrentCategory(categoryParam);
      }
    } else if (!currentCategory) {
      setCurrentCategory('monsters');
    }
  }, [categoryParam, currentCategory]);

  const handleCategoryChange = (category: WikiCategory) => {
    setCurrentCategory(category);
    setSearchParams({ category });
  };

  const categoryConfig = currentCategory ? CATEGORY_MAP[currentCategory] : null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Wiki D&D 5e</h1>
        </div>
        <p className="text-muted-foreground">
          Explore todas as informações oficiais do D&D 5e
        </p>
      </div>

      <div className="mb-6">
        <Dnd5eCategoryNav
          currentCategory={currentCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {categoryConfig ? (
        <Dnd5eCategoryView
          category={categoryConfig.apiCategory}
          title={categoryConfig.title}
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Selecione uma categoria para começar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

