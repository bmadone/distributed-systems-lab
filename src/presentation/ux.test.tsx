import { act, fireEvent, render, screen } from '@testing-library/react';
import { createTestServices } from '../application/testing/in-memory';
import { App } from './App';
import { AppProvider } from './hooks/app';

const mount = async (services = createTestServices()) => {
  await act(async () => { render(<AppProvider services={services}><App /></AppProvider>); });
  return services;
};
const go = async (id: string) => { await act(async () => { window.location.hash = id; window.dispatchEvent(new HashChangeEvent('hashchange')); }); };

beforeEach(() => { document.documentElement.removeAttribute('data-theme'); window.location.hash = ''; });

describe('theme toggle', () => {
  it('applies and persists the chosen theme, and returns to system', async () => {
    const s = await mount();
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(s.preferences.load().theme).toBe('dark');
    fireEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    fireEvent.click(screen.getByRole('button', { name: 'Auto' }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(s.preferences.load().theme).toBe('system');
  });

  it('restores the saved preference on load', async () => {
    const services = createTestServices();
    services.preferences.save({ theme: 'dark' });
    await mount(services);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Dark' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('t cycles the theme, but not while typing', async () => {
    const s = await mount();
    fireEvent.keyDown(document.body, { key: 't' });
    expect(s.preferences.load().theme).toBe('light');
    const field = document.createElement('textarea'); document.body.appendChild(field);
    fireEvent.keyDown(field, { key: 't' });
    expect(s.preferences.load().theme).toBe('light');
    field.remove();
  });
});

describe('navigation UX', () => {
  it('[ and ] move between pages', async () => {
    await mount(); await go('cap');
    fireEvent.keyDown(document.body, { key: ']' });
    expect(window.location.hash).toBe('#models');
    await act(async () => { await new Promise(r => setTimeout(r, 20)); }); // jsdom fires hashchange asynchronously
    fireEvent.keyDown(document.body, { key: '[' });
    expect(window.location.hash).toBe('#cap');
  });

  it('sets the document title and moves focus to the page heading', async () => {
    await mount(); await go('quorums');
    await act(async () => { await new Promise(r => requestAnimationFrame(() => r(null))); });
    expect(document.title).toBe('Quorums · Distributed Systems Lab');
    expect(document.activeElement?.tagName).toBe('H2');
    expect(document.activeElement?.textContent).toBe('Quorums');
  });

  it('has a skip link that focuses the main landmark', async () => {
    await mount();
    fireEvent.click(screen.getByText('Skip to content'));
    expect(document.activeElement?.id).toBe('main');
  });

  it('exposes progress as a progressbar and offers a Continue link', async () => {
    await mount(); await go('cap');
    const bar = screen.getByRole('progressbar', { name: 'Lessons completed' });
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('23');
    expect(screen.getByRole('link', { name: /^(Start|Continue):/ }).getAttribute('href')).toBe('#sd-intro');
  });
});
