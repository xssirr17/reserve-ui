import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReservationForm } from '../components/ReservationForm';
import { ResourceResponse, SlotResponse } from '../api/types';

const mockResource: ResourceResponse = {
  id: 'res-uuid-1',
  name: 'Conference Room Alpha',
  type: 'ROOM',
  metadata: { capacity: 10 },
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};

const mockSlot: SlotResponse = {
  id: 'slot-uuid-1',
  resourceId: 'res-uuid-1',
  startTime: '2026-10-06T10:00:00Z',
  endTime: '2026-10-06T11:00:00Z',
  capacity: 10,
  reserved: 2,
  createdAt: '2026-10-01T00:00:00Z',
};

describe('Booking Flow Component Test', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderComponent = (props: {
    onSuccess?: Mock;
    onRefreshAvailability?: Mock;
  }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ReservationForm
          resource={mockResource}
          slot={mockSlot}
          onSuccess={props.onSuccess || vi.fn()}
          onRefreshAvailability={props.onRefreshAvailability || vi.fn()}
        />
      </QueryClientProvider>
    );
  };

  it('Happy Path: successfully creates a reservation hold (201 Created)', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();

    // Mock fetch for POST /api/reservations
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes('/api/reservations') && init?.method === 'POST') {
        const headers = new Headers();
        headers.set('content-type', 'application/json');
        headers.set('location', '/api/reservations/resv-created-uuid');

        return new Response(
          JSON.stringify({
            id: 'resv-created-uuid',
            slotId: mockSlot.id,
            userId: 'user-charlie',
            quantity: 2,
            status: 'PENDING',
            expiresAt: '2026-10-06T10:15:00Z',
            createdAt: '2026-10-06T10:00:00Z',
            updatedAt: '2026-10-06T10:00:00Z',
          }),
          { status: 201, statusText: 'Created', headers }
        );
      }
      return new Response('Not found', { status: 404 });
    });

    renderComponent({ onSuccess: handleSuccess });

    const userInput = screen.getByLabelText(/user name \/ identifier/i);
    await user.clear(userInput);
    await user.type(userInput, 'user-charlie');

    const quantityInput = screen.getByLabelText(/quantity \(units\)/i);
    fireEvent.change(quantityInput, { target: { value: '2' } });

    const reserveButton = screen.getByRole('button', { name: /reserve now/i });
    await user.click(reserveButton);

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });

    const callArg = handleSuccess.mock.calls[0][0];
    expect(callArg.reservation.id).toBe('resv-created-uuid');
    expect(callArg.reservation.status).toBe('PENDING');
    expect(callArg.reservation.quantity).toBe(2);
  });

  it('409 Path: handles Insufficient Capacity conflict and allows availability refresh', async () => {
    const user = userEvent.setup();
    const handleRefresh = vi.fn();

    // Mock 409 Conflict Problem Details
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes('/api/reservations') && init?.method === 'POST') {
        const headers = new Headers();
        headers.set('content-type', 'application/problem+json');

        return new Response(
          JSON.stringify({
            type: 'urn:problem-type:insufficient-capacity',
            title: 'Insufficient Capacity',
            status: 409,
            detail: 'Requested 5 units but only 1 capacity left',
            slotId: mockSlot.id,
            requested: 5,
            available: 1,
            timestamp: new Date().toISOString(),
          }),
          { status: 409, statusText: 'Conflict', headers }
        );
      }
      return new Response('Not found', { status: 404 });
    });

    renderComponent({ onRefreshAvailability: handleRefresh });

    const userInput = screen.getByLabelText(/user name \/ identifier/i);
    await user.clear(userInput);
    await user.type(userInput, 'user-bob');

    const reserveButton = screen.getByRole('button', { name: /reserve now/i });
    await user.click(reserveButton);

    // Verify ErrorBanner displays Insufficient Capacity Problem Details
    await waitFor(() => {
      expect(screen.getByText('Insufficient Capacity')).toBeInTheDocument();
      expect(
        screen.getByText('Requested 5 units but only 1 capacity left')
      ).toBeInTheDocument();
      expect(screen.getByText(/HTTP 409/i)).toBeInTheDocument();
    });

    // Verify refresh availability button is rendered and functional
    const refreshBtn = screen.getByRole('button', { name: /refresh availability/i });
    expect(refreshBtn).toBeInTheDocument();
    await user.click(refreshBtn);
    expect(handleRefresh).toHaveBeenCalled();
  });
});
