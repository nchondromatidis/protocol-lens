import { useState, useCallback, useRef } from 'react';

export const useCopyFeedback = (duration = 300) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    (key: string, value: string) => {
      navigator.clipboard.writeText(value).catch(() => {});
      setCopiedKey(key);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopiedKey(null), duration);
    },
    [duration]
  );

  return { copiedKey, copy };
};
