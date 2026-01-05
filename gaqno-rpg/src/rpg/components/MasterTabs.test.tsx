import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MasterTabs } from './MasterTabs';

describe('MasterTabs', () => {
  it('should render all tabs', () => {
    render(
      <MasterTabs
        tabLabels={['Tab 1', 'Tab 2', 'Tab 3']}
      >
        <div>Content 1</div>
        <div>Content 2</div>
        <div>Content 3</div>
      </MasterTabs>
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('should navigate between tabs', () => {
    render(
      <MasterTabs
        tabLabels={['Tab 1', 'Tab 2', 'Tab 3']}
      >
        <div>Content 1</div>
        <div>Content 2</div>
        <div>Content 3</div>
      </MasterTabs>
    );

    const tab2 = screen.getByText('Tab 2');
    fireEvent.click(tab2);

    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('should test swipe gestures (mock)', () => {
    const onTabChange = vi.fn();
    const { container } = render(
      <MasterTabs
        tabLabels={['Tab 1', 'Tab 2', 'Tab 3']}
        onTabChange={onTabChange}
      >
        <div>Content 1</div>
        <div>Content 2</div>
        <div>Content 3</div>
      </MasterTabs>
    );

    const tabsContainer = container.querySelector('[class*="tabs"]') || container;

    fireEvent.touchStart(tabsContainer, {
      targetTouches: [{ clientX: 200 }],
    });

    fireEvent.touchMove(tabsContainer, {
      targetTouches: [{ clientX: 100 }],
    });

    fireEvent.touchEnd(tabsContainer);

    expect(onTabChange).toHaveBeenCalledWith('Tab 2');
  });
});

