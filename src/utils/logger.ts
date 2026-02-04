/**
 * Logger utility with debug mode support
 * 
 * Why: Constitution principle V requires clear documentation.
 * Debug mode allows developers to trace rule evaluation decisions.
 */

let debugMode = false;

/**
 * Enable or disable debug logging
 */
export function setDebugMode(enabled: boolean): void {
  debugMode = enabled;
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return debugMode;
}

/**
 * Log a debug message (only shown when debug mode is enabled)
 */
export function debug(message: string, ...args: unknown[]): void {
  if (debugMode) {
    console.error(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Log an info message
 */
export function info(message: string, ...args: unknown[]): void {
  console.log(message, ...args);
}

/**
 * Log a warning message
 */
export function warn(message: string, ...args: unknown[]): void {
  console.warn(`⚠️  ${message}`, ...args);
}

/**
 * Log an error message
 */
export function error(message: string, ...args: unknown[]): void {
  console.error(`❌ ${message}`, ...args);
}

/**
 * Log a success message
 */
export function success(message: string, ...args: unknown[]): void {
  console.log(`✅ ${message}`, ...args);
}
