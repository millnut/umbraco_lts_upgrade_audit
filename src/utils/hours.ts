/**
 * Hour calculation utilities
 *
 * Why: Implements linear scaling per clarification decision.
 * Hours scale as: total = baseHours × instanceCount
 */

/**
 * Calculate total hours using linear scaling
 *
 * @param baseHours - Base hours per instance
 * @param instanceCount - Number of instances found
 * @returns Total hours (rounded to 0.5h granularity)
 */
export function calculateHours(baseHours: number, instanceCount: number): number {
  const total = baseHours * instanceCount;
  return roundToHalfHour(total);
}

/**
 * Round hours to 0.5h granularity (30 minutes minimum)
 *
 * @param hours - Raw hour value
 * @returns Hours rounded to nearest 0.5
 */
export function roundToHalfHour(hours: number): number {
  return Math.round(hours * 2) / 2;
}

/**
 * Convert hours to days (8 hours = 1 day)
 *
 * @param hours - Hours to convert
 * @returns Days (rounded to 1 decimal place)
 */
export function hoursToDays(hours: number): number {
  return Math.round((hours / 8) * 10) / 10;
}
