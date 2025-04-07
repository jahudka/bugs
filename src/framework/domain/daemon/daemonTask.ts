export interface DaemonTask {
  run(signal: AbortSignal): Promise<void>;
}
