import { act, render, screen } from '@testing-library/react';
import { LESSONS } from '../domain/curriculum/catalog';
import { SPECIAL_IDS } from '../domain/curriculum/ids';
import { createTestServices } from '../application/testing/in-memory';
import { AppProvider } from './hooks/app';
import { App } from './App';

const go = async (id: string) => {
  await act(async () => { window.location.hash = id; window.dispatchEvent(new HashChangeEvent('hashchange')); });
};

it('every page renders, records the visit and logs no errors', async () => {
  localStorage.clear();
  const errors: unknown[] = [];
  const spy = vi.spyOn(console, 'error').mockImplementation((...a) => { errors.push(a); });
  const services = createTestServices();
  await act(async () => { render(<AppProvider services={services}><App /></AppProvider>); });
  for (const l of LESSONS) {
    await go(l.id);
    expect(screen.getByRole('heading', { level: 2, name: l.title }).closest('section')?.hidden).toBe(false);
  }
  for (const id of SPECIAL_IDS) await go(id);
  expect(screen.getByRole('heading', { level: 2, name: 'Final exam' })).toBeTruthy();
  expect(Object.keys(services.api.getState().progress.visited).sort()).toEqual([...LESSONS.map(l => l.id), ...SPECIAL_IDS].sort());
  expect(Object.values(services.api.getState().progress.practice).every(v => !v || Object.keys(v).length === 0)).toBe(true);
  spy.mockRestore();
  expect(errors).toEqual([]);
});
