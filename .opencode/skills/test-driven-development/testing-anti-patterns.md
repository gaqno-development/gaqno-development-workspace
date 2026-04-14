# Testing Anti-Patterns

**Load this reference when:** writing or changing tests, adding mocks, or tempted to add test-only methods to production code.

## The Iron Laws

```
1. NEVER test mock behavior
2. NEVER add test-only methods to production classes
3. NEVER mock without understanding dependencies
```

## Anti-Pattern 1: Testing Mock Behavior

```typescript
// BAD: Testing that the mock exists
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});

// GOOD: Test real component or don't mock it
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});
```

## Anti-Pattern 2: Test-Only Methods in Production

```typescript
// BAD: destroy() only used in tests
class Session {
  async destroy() { /* cleanup */ }
}

// GOOD: Test utilities handle test cleanup
export async function cleanupSession(session: Session) {
  const workspace = session.getWorkspaceInfo();
  if (workspace) await workspaceManager.destroyWorkspace(workspace.id);
}
```

## Anti-Pattern 3: Mocking Without Understanding

Before mocking any method:
1. "What side effects does the real method have?"
2. "Does this test depend on any of those side effects?"
3. "Do I fully understand what this test needs?"

## Anti-Pattern 4: Incomplete Mocks

Mock the COMPLETE data structure as it exists in reality, not just fields your immediate test uses.

## Anti-Pattern 5: Integration Tests as Afterthought

Testing is part of implementation, not optional follow-up. TDD would have caught this.

## Quick Reference

| Anti-Pattern | Fix |
|--------------|-----|
| Assert on mock elements | Test real component or unmock it |
| Test-only methods in production | Move to test utilities |
| Mock without understanding | Understand dependencies first, mock minimally |
| Incomplete mocks | Mirror real API completely |
| Tests as afterthought | TDD - tests first |
| Over-complex mocks | Consider integration tests |
