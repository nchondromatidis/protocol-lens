type Level = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const levels: Record<Level, Set<Level>> = {
  TRACE: new Set(['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']),
  DEBUG: new Set(['DEBUG', 'INFO', 'WARN', 'ERROR']),
  INFO: new Set(['INFO', 'WARN', 'ERROR']),
  WARN: new Set(['WARN', 'ERROR']),
  ERROR: new Set(['ERROR']),
};

let currentLevel: Level = 'INFO';

export const logger = {
  setLevel(newLevel: Level) {
    currentLevel = newLevel;
  },

  trace: (msg: string, cntx: unknown) => {
    if (levels[currentLevel].has('TRACE')) log('TRACE', msg, cntx);
  },
  debug: (msg: string, cntx: unknown) => {
    if (levels[currentLevel].has('DEBUG')) log('DEBUG', msg, cntx);
  },
  info: (msg: string, cntx: unknown) => {
    if (levels[currentLevel].has('INFO')) log('INFO', msg, cntx);
  },
  warn: (msg: string, cntx: unknown) => {
    if (levels[currentLevel].has('WARN')) log('WARN', msg, cntx);
  },
  error: (msg: string, cntx: unknown) => {
    if (levels[currentLevel].has('ERROR')) log('ERROR', msg, cntx);
  },
};

function log(level: string, msg: string, cntx: unknown) {
  console.log(`${level} (evm-lens):`, msg, cntx);
}
