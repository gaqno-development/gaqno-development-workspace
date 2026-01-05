import React from 'react';
import { ReferencedItemArray } from '../ReferencedItemArray';

interface RuleRendererProps {
  ruleData: any;
  onReferenceClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const RuleRenderer: React.FC<RuleRendererProps> = ({
  ruleData,
  onReferenceClick,
  resolvedData,
}) => {
  if (!ruleData || !ruleData.subsections) return null;

  return (
    <div>
      <h3 className="font-semibold mb-2">Subseções</h3>
      <ReferencedItemArray items={ruleData.subsections} onItemClick={onReferenceClick} resolvedData={resolvedData} />
    </div>
  );
};

