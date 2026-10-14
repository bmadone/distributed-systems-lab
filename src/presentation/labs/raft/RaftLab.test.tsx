import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTestServices } from '../../../application/testing/in-memory';
import { AppProvider } from '../../hooks/app';
import { VectorClockLab } from '../vclock/VectorClockLab';
import { RaftLab } from './RaftLab';

const mount = (ui: ReactNode) => {
  const services = createTestServices();
  render(<AppProvider services={services}>{ui}</AppProvider>);
  return services.api;
};

describe('keyboard access', () => {
  it('Raft nodes accept a client write via Enter', () => {
    mount(<RaftLab />);
    const s1 = screen.getByRole('button', { name: /^S1, leader, term 1, 2 of 2/ });
    fireEvent.keyDown(s1, { key: 'Enter' });
    expect(screen.getByRole('button', { name: /^S1, leader, term 1, 3 of 3/ })).toBeTruthy();
  });

  it('vector clock events can be selected with the keyboard and compared', () => {
    const api = mount(<VectorClockLab />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'P1 send to P2, Lamport 2, vector 2 0 0' }), { key: ' ' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'P3 local event, Lamport 1, vector 0 0 1' }), { key: 'Enter' });
    expect(screen.getByText(/Concurrent: neither/)).toBeTruthy();
    expect(api.getState().signals.vclock).toMatchObject({ foundConcurrent: true, foundMislead: true, delivered: false });
  });
});
