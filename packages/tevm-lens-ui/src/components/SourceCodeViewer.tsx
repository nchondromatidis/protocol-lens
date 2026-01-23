import CodeMirror from '@uiw/react-codemirror';
import { solidity } from '@replit/codemirror-lang-solidity';
import { oneDark } from '@codemirror/theme-one-dark';
import { useMemo } from 'react';

interface SourceCodeViewerProps {
  sourceCode?: string;
  language?: 'solidity' | 'plaintext';
}

export function SourceCodeViewer({
  sourceCode = '// Select a function to view its source code',
  language = 'solidity',
}: SourceCodeViewerProps) {
  const extensions = useMemo(() => {
    const exts = [];
    if (language === 'solidity') {
      exts.push(solidity);
    }
    return exts;
  }, [language]);

  return (
    <div className="h-full w-full overflow-hidden">
      <CodeMirror
        value={sourceCode}
        extensions={extensions}
        theme={oneDark}
        readOnly={true}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          foldGutter: true,
        }}
        className="h-full"
      />
    </div>
  );
}
