# Workflow AI Canvas UX/UI Improvements

Comprehensive enhancement plan for the workflow canvas focusing on visual polish, UX patterns, functionality, and visualization.

## 1. Visual Polish Improvements

### 1.1 Drag Feedback Enhancement
- **File**: `gaqno-ai-ui/src/components/workflow/drag-utils.ts` (create)
- Add ghost preview when dragging nodes from palette
- Show semi-transparent node following cursor during drag
- Scale animation on drag start (0.95 → 1.0)

### 1.2 Node Selection & Hover States
- **File**: `gaqno-ai-ui/src/components/workflow/nodes/WorkflowNode.tsx`
- Add subtle lift animation on hover (`translateY(-2px)`)
- Enhanced ring animation for selected state
- Glow effect on nodes with active execution status

### 1.3 Connection Animation
- **File**: `gaqno-ai-ui/src/components/workflow/edges/WorkflowEdge.tsx`
- Smoother bezier curves with dynamic control points
- Pulse animation on newly created connections
- Gradient stroke for data-flow direction indication

### 1.4 Empty State Polish
- **File**: `gaqno-ai-ui/src/components/workflow/EmptyCanvasOverlay.tsx`
- Animated illustration or Lottie for visual appeal
- Staggered entrance animation for template buttons
- Pulse animation on the "Assistente IA" hint

## 2. UX Patterns

### 2.1 Keyboard Shortcuts Help
- **File**: `gaqno-ai-ui/src/components/workflow/KeyboardShortcutsHelp.tsx` (create)
- Modal showing all available shortcuts (Cmd+K to open search, Ctrl+Z undo, etc.)
- Trigger via `?` key or button in toolbar
- Group shortcuts by category: Navigation, Editing, View

### 2.2 Enhanced Context Menus
- **File**: `gaqno-ai-ui/src/components/workflow/CanvasContextMenu.tsx`
- Add keyboard navigation (arrow keys + Enter)
- Icons for all menu items
- Separator groups for logical organization
- "Copy as JSON" option for nodes

### 2.3 Connection Validation Feedback
- **File**: `gaqno-ai-ui/src/components/workflow/WorkflowCanvas.tsx`
- Real-time visual feedback during connection drag
- Highlight compatible handles in green
- Red pulse on incompatible connection attempts
- Toast message improvement (position: bottom-center, auto-dismiss)

### 2.4 Node Palette Tooltips
- **File**: `gaqno-ai-ui/src/components/workflow/NodePalette.tsx`
- Rich tooltips showing node details on hover
- Preview of required inputs/outputs
- Estimated cost indicator tooltip

## 3. Functionality Enhancements

### 3.1 Multi-Select Support
- **File**: `gaqno-ai-ui/src/components/workflow/WorkflowCanvas.tsx`
- Box selection with Shift+drag
- Multi-select with Cmd/Ctrl+click
- Bulk actions: delete, duplicate, disable selected nodes

### 3.2 Enhanced Search & Navigation
- **File**: `gaqno-ai-ui/src/components/workflow/CanvasSearch.tsx`
- Add recent searches
- Keyboard shortcut indicators in results
- Auto-focus and zoom to selected node
- Search by execution status

### 3.3 Improved Node Palette
- **File**: `gaqno-ai-ui/src/components/workflow/NodePalette.tsx`
- Favorite/starred nodes section
- Recently used nodes
- Category color coding in collapsed mode
- Drag count badge (show how many dragged)

### 3.4 Canvas Navigation Controls
- **File**: `gaqno-ai-ui/src/components/workflow/CanvasControls.tsx` (create)
- Zoom level indicator with reset button
- Quick fit-view button
- MiniMap toggle
- Grid snap toggle

## 4. Visualization Improvements

### 4.1 Edge Labels
- **File**: `gaqno-ai-ui/src/components/workflow/edges/WorkflowEdge.tsx`
- Optional labels showing connection type
- Data flow direction arrows
- Dynamic label positioning based on edge curvature

### 4.2 Enhanced Status Indicators
- **File**: `gaqno-ai-ui/src/components/workflow/nodes/WorkflowNode.tsx`
- Progress ring for running nodes (SVG circle animation)
- Error count badge on failed nodes
- Last execution time tooltip
- Duration countdown for timed nodes

### 4.3 MiniMap Enhancement
- **File**: `gaqno-ai-ui/src/components/workflow/WorkflowCanvas.tsx`
- Show viewport rectangle with drag-to-pan
- Color-coded node dots by category
- Zoom controls integrated

### 4.4 Execution Flow Visualization
- **File**: `gaqno-ai-ui/src/components/workflow/edges/WorkflowEdge.tsx`
- Data packet animation along edges during execution
- Highlight active execution path
- Fade inactive branches

## Implementation Priority

**Phase 1 (High Impact, Low Effort)**:
1. Node hover lift animation
2. Keyboard shortcuts help
3. Enhanced context menu styling
4. Connection validation visual feedback

**Phase 2 (Medium Effort)**:
1. Drag ghost preview
2. Multi-select support
3. Edge labels
4. Enhanced status indicators

**Phase 3 (Higher Effort)**:
1. Execution flow animations
2. Node grouping
3. Advanced MiniMap features
4. Canvas navigation controls

## Design System Compliance

All changes follow the `@gaqno-development/frontcore` design system:
- 8pt grid spacing
- Semantic color usage (green=success, amber=warning, red=error)
- Transition duration: 150-250ms
- No decorative elements without purpose
- Import UI components from `@gaqno-development/frontcore/components/ui`
