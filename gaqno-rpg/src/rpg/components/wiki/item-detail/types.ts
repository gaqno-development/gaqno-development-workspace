export interface Dnd5eItemDetailProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  onReferenceClick?: (category: string, index: string) => void;
  isLoading?: boolean;
}

