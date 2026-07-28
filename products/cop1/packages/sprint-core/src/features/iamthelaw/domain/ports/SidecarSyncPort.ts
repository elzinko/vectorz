/** Port for writing governance rules to the native iamthelaw sidecar location. */
export interface SidecarSyncPort {
  /** Write sidecar content, ensuring target directory exists and using atomic write. */
  write(content: string): void;
}
