import { TraceViewerClient, ThemeProvider } from '@defi-notes/evm-lens-ui';
import React, { useEffect, useState } from 'react';
import type { TraceResult } from '@defi-notes/evm-lens-ui';
import { type MethodArgs } from '@/workflows/_utils.ts';
import {
  protocolWorkflowRegistry,
  type ProtocolWorkflowRegistry,
  runWorkflow,
  type WorkflowMethodKeys,
} from '@/workflows/protocol-workflow-registry.ts';

type ProtocolWorkflowProps<
  R extends Record<string, object> = ProtocolWorkflowRegistry,
  P extends keyof R = keyof R,
  M extends WorkflowMethodKeys<R[P]> = WorkflowMethodKeys<R[P]>,
  A extends MethodArgs<R[P], M> = MethodArgs<R[P], M>,
> = {
  protocol: P;
  workflow: M;
  args: A;
};

export const ProtocolWorkflow: React.FC<ProtocolWorkflowProps<ProtocolWorkflowRegistry>> = ({
  protocol,
  workflow,
  args,
}) => {
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTrace = async () => {
      try {
        setLoading(true);
        setError(null);
        const trace = await runWorkflow(protocolWorkflowRegistry, protocol, workflow, args);
        const result = await protocolWorkflowRegistry[protocol].toTraceResult(trace);
        setTraceResult(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch trace'));
      } finally {
        setLoading(false);
      }
    };

    fetchTrace();
  }, [protocol, workflow, args]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!traceResult) {
    return null;
  }

  return (
    <div className="h-[800px]">
      <ThemeProvider>
        <TraceViewerClient trace={traceResult} />
      </ThemeProvider>
    </div>
  );
};
