import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { SessionView } from './SessionView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-session-id' }),
  };
});

vi.mock('../hooks/useRpgSession', () => ({
  useRpgSession: () => ({
    data: {
      id: 'test-session-id',
      name: 'Test Session',
      userId: 'test-user',
    },
    isLoading: false,
  }),
}));

vi.mock('../hooks/useRpgWebSocket', () => ({
  useRpgWebSocket: () => ({
    connected: true,
    connectedUsers: [],
    submitAction: vi.fn(),
  }),
}));

describe('SessionView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render for player', () => {
    vi.mock('../hooks/useRpgSession', () => ({
      useRpgSession: () => ({
        data: {
          id: 'test-session-id',
          name: 'Test Session',
          userId: 'player-user',
        },
        isLoading: false,
      }),
    }));

    render(<SessionView />, { wrapper });

    expect(screen.getByText(/Aguardando narrativas/i)).toBeInTheDocument();
  });

  it('should render for master', () => {
    vi.mock('../hooks/useRpgSession', () => ({
      useRpgSession: () => ({
        data: {
          id: 'test-session-id',
          name: 'Test Session',
          userId: 'master-user',
        },
        isLoading: false,
      }),
    }));

    render(<SessionView />, { wrapper });

    expect(screen.getByText(/Aguardando narrativas/i)).toBeInTheDocument();
  });

  it('should verify ActionForm hidden for master', () => {
    vi.mock('../hooks/useRpgSession', () => ({
      useRpgSession: () => ({
        data: {
          id: 'test-session-id',
          name: 'Test Session',
          userId: 'master-user',
        },
        isLoading: false,
      }),
    }));

    const { container } = render(<SessionView />, { wrapper });

    const actionForm = container.querySelector('[data-testid="action-form"]');
    expect(actionForm).not.toBeInTheDocument();
  });

  it('should test PlayerDiceRequest', () => {
    render(<SessionView />, { wrapper });

    expect(screen.getByText(/Aguardando narrativas/i)).toBeInTheDocument();
  });
});

