export type DaemonStatus = 'running' | 'stopped' | 'unknown';

export interface PidInfo {
  pid: number;
  startedAt: Date;
}

export interface HealthInfo {
  status: 'ok';
  uptime: number;
  version: string;
  pid: number;
}

export const COP1_VERSION = '0.1.0';
export const DEFAULT_PORT = 4242;
/** Le port de la page web de mission control (`COP1_WEB_PORT` du lanceur) : son Origin peut écrire. */
export const DEFAULT_WEB_PORT = 5273;
export const PID_FILENAME = 'daemon.pid';
export const COP1_DIR = '.cop1';
