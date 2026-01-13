export enum KlippyState {
  disconnected = 'disconnected',
  error = 'error',
  ready = 'ready',
  shutdown = 'shutdown',
  startup = 'startup',
  unknown = 'unknown',
}

export enum PrintState {
  cancelled = 'cancelled',
  complete = 'complete',
  error = 'error',
  paused = 'paused',
  printing = 'printing',
  standby = 'standby',
  unknown = 'unknown',
}
