import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@gaqno-dev/frontcore/components/ui';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface MasterTabsProps {
  children: React.ReactNode[];
  tabLabels: string[];
  defaultTab?: string;
  className?: string;
  onTabChange?: (tab: string) => void;
}

export const MasterTabs: React.FC<MasterTabsProps> = ({
  children,
  tabLabels,
  defaultTab,
  className,
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabLabels[0]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      const currentIndex = tabLabels.indexOf(activeTab);
      if (currentIndex < tabLabels.length - 1) {
        const nextTab = tabLabels[currentIndex + 1];
        setActiveTab(nextTab);
        onTabChange?.(nextTab);
      }
    }

    if (isRightSwipe) {
      const currentIndex = tabLabels.indexOf(activeTab);
      if (currentIndex > 0) {
        const nextTab = tabLabels[currentIndex - 1];
        setActiveTab(nextTab);
        onTabChange?.(nextTab);
      }
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className={cn('w-full', className)}>
      <TabsList 
        className="grid w-full grid-cols-5 h-12 mb-4"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        ref={tabsRef}
      >
        {tabLabels.map((label) => (
          <TabsTrigger
            key={label}
            value={label}
            className="text-sm min-h-[44px] touch-manipulation"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children.map((child, index) => (
        <TabsContent
          key={tabLabels[index]}
          value={tabLabels[index]}
          className="mt-0 min-h-[400px]"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {child}
        </TabsContent>
      ))}
    </Tabs>
  );
};

