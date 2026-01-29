import '@/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { sample1 } from '@/mock-data/call-trace.ts';
import { ThemeProvider, TraceViewerLayout } from '@/index';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TraceViewerLayout functionTrace={sample1} />
    </ThemeProvider>
  </StrictMode>
);
