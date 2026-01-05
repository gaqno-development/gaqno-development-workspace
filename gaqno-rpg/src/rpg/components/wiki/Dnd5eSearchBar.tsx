import React, { useState } from 'react';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import { Search, X } from 'lucide-react';
import { Button } from '@gaqno-dev/frontcore/components/ui';

interface Dnd5eSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const Dnd5eSearchBar: React.FC<Dnd5eSearchBarProps> = ({
  onSearch,
  placeholder = 'Buscar...',
  className = '',
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <Button type="submit" disabled={query.trim().length < 2}>
        Buscar
      </Button>
    </form>
  );
};

