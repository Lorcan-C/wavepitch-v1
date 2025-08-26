export const createWebSocketUrl = (endpoint: string = '/api/speechmatics-ws'): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${endpoint}`;
};

export const calculateReconnectDelay = (attempt: number, maxDelay: number = 10000): number => {
  return Math.min(1000 * Math.pow(2, attempt), maxDelay);
};

export const isCleanClose = (code: number): boolean => {
  return code === 1000; // Normal closure
};

export const shouldReconnect = (code: number, attempt: number, maxAttempts: number): boolean => {
  return !isCleanClose(code) && attempt < maxAttempts;
};