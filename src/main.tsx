import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { HabitProvider } from './state/HabitProvider';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HabitProvider>
      <App />
    </HabitProvider>
  </StrictMode>,
);
