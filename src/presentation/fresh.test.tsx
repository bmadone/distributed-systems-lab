import { act, render } from '@testing-library/react';
import { LESSONS } from '../domain/curriculum/catalog';
import { createTestServices } from '../application/testing/in-memory';
import { AppProvider } from './hooks/app';
import { LessonPage } from './pages/LessonPage';

// Regression guard: no lab may satisfy its own practice tasks just by mounting with defaults.
it('a fresh course has no practice tasks done after every lesson mounts', async () => {
  localStorage.clear();
  const services = createTestServices();
  await act(async () => {
    render(<AppProvider services={services}>{LESSONS.map(l => <LessonPage key={l.id} lesson={l} hidden={false} />)}</AppProvider>);
  });
  const done = Object.entries(services.api.getState().progress.practice).filter(([, v]) => v && Object.keys(v).length > 0);
  expect(done).toEqual([]);
});
