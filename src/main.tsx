import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createLearningApi } from './application/learning-api';
import type { Services } from './application/services';
import { LESSONS } from './domain/curriculum/catalog';
import { localStorageLabSettings } from './infrastructure/persistence/local-storage-lab-settings';
import { localStorageProgressRepository } from './infrastructure/persistence/local-storage-progress';
import { localStoragePreferences } from './infrastructure/persistence/local-storage-preferences';
import { jsonProgressCodec } from './infrastructure/persistence/progress-codec';
import { mathRandom, systemClock } from './infrastructure/system/clock-and-random';
import { App } from './presentation/App';
import { AppProvider } from './presentation/hooks/app';
import './presentation/styles.css';

// Composition root: the only place that knows which adapters implement which ports.
const services: Services = {
  api: createLearningApi({ lessons: LESSONS, progress: localStorageProgressRepository(systemClock), clock: systemClock }),
  settings: localStorageLabSettings,
  codec: jsonProgressCodec,
  preferences: localStoragePreferences,
  clock: systemClock,
  random: mathRandom,
};

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
createRoot(root).render(<StrictMode><AppProvider services={services}><App /></AppProvider></StrictMode>);
