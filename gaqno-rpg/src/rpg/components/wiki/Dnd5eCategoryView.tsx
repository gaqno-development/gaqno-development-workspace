import React, { useState, useEffect, useRef } from 'react';
import { useDnd5eCategoryList, useDnd5eSearch, useDnd5eItem } from '../../hooks/useDnd5e';
import { Dnd5eItemCard } from './Dnd5eItemCard';
import { Dnd5eItemDetail } from './item-detail';
import { Dnd5eSearchBar } from './Dnd5eSearchBar';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@gaqno-dev/frontcore/components/ui';

interface Dnd5eCategoryViewProps {
  category: string;
  title: string;
}

const ITEMS_PER_PAGE = 30;

export const Dnd5eCategoryView: React.FC<Dnd5eCategoryViewProps> = ({
  category,
  title,
}) => {
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ index: string; category?: string } | null>(null);
  const [loadedItems, setLoadedItems] = useState<Array<{ name: string; index: string }>>([]);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Use selected item's category if available, otherwise use current category
  const itemCategory = selectedItem?.category || category;

  const { data: categoryList, isLoading: isLoadingList } = useDnd5eCategoryList(
    category,
    searchQuery ? undefined : currentOffset,
    searchQuery ? undefined : ITEMS_PER_PAGE,
  );
  const { data: searchResults, isLoading: isLoadingSearch } = useDnd5eSearch(
    category,
    searchQuery,
  );
  const { data: itemDetail, isLoading: isLoadingDetail } = useDnd5eItem(
    itemCategory,
    selectedItem?.index || null,
    true, // resolveReferences = true to use BFF
  );

  // Reset pagination when category or search changes
  useEffect(() => {
    setLoadedItems([]);
    setCurrentOffset(0);
    setHasMore(true);
  }, [category, searchQuery]);

  // Load initial items or append new items
  useEffect(() => {
    if (searchQuery && searchResults) {
      setLoadedItems(searchResults.map((item) => ({ name: item.name, index: item.index })));
      setHasMore(false);
    } else if (categoryList?.results) {
      if (currentOffset === 0) {
        // Initial load
        setLoadedItems(categoryList.results.map((item) => ({ name: item.name, index: item.index })));
      } else {
        // Append new items
        setLoadedItems((prev) => [
          ...prev,
          ...categoryList.results.map((item) => ({ name: item.name, index: item.index })),
        ]);
      }
      setHasMore(categoryList.hasMore ?? false);
    }
  }, [categoryList, searchResults, searchQuery, currentOffset]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (searchQuery || !hasMore || isLoadingList) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingList) {
          setCurrentOffset((prev) => prev + ITEMS_PER_PAGE);
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingList, searchQuery]);

  const isLoading = isLoadingList || isLoadingSearch;

  const handleItemClick = (index: string) => {
    setSelectedItem({ index, category });
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  const handleReferenceClick = (refCategory: string, refIndex: string) => {
    // Update selected item to show the referenced item with its category
    setSelectedItem({ index: refIndex, category: refCategory });
  };

  const getItemMetadata = (item: any) => {
    return {};
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <Dnd5eSearchBar
          onSearch={setSearchQuery}
          placeholder={`Buscar ${title.toLowerCase()}...`}
        />
      </div>

      {isLoading && loadedItems.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : loadedItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum item disponível'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadedItems.map((item) => (
              <Dnd5eItemCard
                key={item.index}
                name={item.name}
                index={item.index}
                metadata={getItemMetadata(item)}
                onViewDetails={() => handleItemClick(item.index)}
              />
            ))}
          </div>
          
          {/* Infinite scroll trigger */}
          {!searchQuery && hasMore && (
            <div ref={observerTarget} className="flex justify-center items-center py-8">
              {isLoadingList ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Carregando mais...</span>
                </div>
              ) : (
                <div className="h-4" />
              )}
            </div>
          )}
        </>
      )}

      {selectedItem && (
        <Dnd5eItemDetail
          item={itemDetail}
          isOpen={!!selectedItem || isLoadingDetail}
          onClose={handleCloseDetail}
          category={itemCategory}
          onReferenceClick={handleReferenceClick}
          isLoading={isLoadingDetail}
        />
      )}
    </div>
  );
};

