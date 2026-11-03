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
/** The single pid file written before one file per port (fiche 20261102100505596), still read. */
export const LEGACY_PID_FILENAME = 'daemon.pid';
/** The pid file of the daemon that listens on `port`. */
export const pidFilename = (port: number): string => `daemon-${port}.pid`;
export const COP1_DIR = '.cop1';
