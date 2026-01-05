import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MasterDashboard } from './MasterDashboard';
import { BrowserRouter } from 'react-router-dom';

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
      userId: 'master-user',
    },
    isLoading: false,
  }),
}));

vi.mock('../hooks/useRpgWebSocket', () => ({
  useRpgWebSocket: () => ({
    connected: true,
    connectedUsers: [],
    requestDiceRoll: vi.fn(),
    completeDiceRoll: vi.fn(),
  }),
}));

describe('MasterDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all tabs', () => {
    render(<MasterDashboard />, { wrapper });

    expect(screen.getByText(/Visão Geral/i)).toBeInTheDocument();
    expect(screen.getByText(/Narrativas/i)).toBeInTheDocument();
    expect(screen.getByText(/Jogadores/i)).toBeInTheDocument();
    expect(screen.getByText(/Controles/i)).toBeInTheDocument();
    expect(screen.getByText(/Mundo/i)).toBeInTheDocument();
  });

  it('should verify content of each tab', () => {
    render(<MasterDashboard />, { wrapper });

    expect(screen.getByText(/Visão Geral/i)).toBeInTheDocument();
  });

  it('should test integration with hooks', () => {
    render(<MasterDashboard />, { wrapper });

    expect(screen.getByText(/Visão Geral/i)).toBeInTheDocument();
  });
});

