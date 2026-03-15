import util from 'node:util';

const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL ?? 'INFO';

const LEVELS = {
  TRACE: new Set(['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']),
  DEBUG: new Set(['DEBUG', 'INFO', 'WARN', 'ERROR']),
  INFO: new Set(['INFO', 'WARN', 'ERROR']),
  WARN: new Set(['WARN', 'ERROR']),
  ERROR: new Set(['ERROR']),
};

export const logger = {
  trace: (msg: string, cntx: unknown) => {
    if (LEVELS[LOG_LEVEL].has('TRACE')) log('TRACE', msg, cntx);
  },
  debug: (msg: string, cntx: unknown) => {
    if (LEVELS[LOG_LEVEL].has('DEBUG')) log('DEBUG', msg, cntx);
  },
  info: (msg: string, cntx: unknown) => {
    if (LEVELS[LOG_LEVEL].has('INFO')) log('INFO', msg, cntx);
  },
  warn: (msg: string, cntx: unknown) => {
    if (LEVELS[LOG_LEVEL].has('WARN')) log('WARN', msg, cntx);
  },
  error: (msg: string, cntx: unknown) => {
    if (LEVELS[LOG_LEVEL].has('ERROR')) log('ERROR', msg, cntx);
  },
};

function log(level: string, msg: string, cntx: unknown) {
  console.log(`${level} (evm-lens):`, msg);
  inspect(cntx);
}

function inspect(obj: unknown) {
  console.log(util.inspect(obj, { depth: 14, colors: true }));
}
