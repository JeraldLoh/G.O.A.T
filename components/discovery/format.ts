/** Formats a measured USD cost; sub-cent values keep enough digits to be non-zero. */
export function formatUsd(value: number): string {
  if (value === 0) return "$0.00";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}

export function formatPct(value: number): string {
  return `${Math.round(value)}%`;
}
