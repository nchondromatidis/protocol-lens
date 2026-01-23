import { Group, Panel, Separator } from 'react-resizable-panels';
import type { FunctionCallEvent } from '@defi-notes/tevm-lens/src/lens/CallTrace.ts';
import { FunctionTraceViewer } from '@/components/FunctionTraceViewer.tsx';
import { SourceCodeViewer } from '@/components/SourceCodeViewer.tsx';

interface TraceViewerLayoutProps {
  functionTrace: FunctionCallEvent;
  sourceCode?: string;
}

export function TraceViewerLayout({ functionTrace, sourceCode }: TraceViewerLayoutProps) {
  return (
    <Group orientation="vertical" className="h-screen">
      <Panel defaultSize={60} className="overflow-hidden border">
        <SourceCodeViewer sourceCode={sourceCode} />
      </Panel>
      <Separator />
      <Panel defaultSize={40} className="overflow-auto p-4 border">
        <FunctionTraceViewer functionTrace={functionTrace} />
      </Panel>
    </Group>
  );
}
