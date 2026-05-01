export function formatRelativeTime(input: string | number | Date) {
  const date = input instanceof Date ? input : new Date(input);
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  const units = [
    { limit: 60, divisor: 1, name: "second" },
    { limit: 3600, divisor: 60, name: "minute" },
    { limit: 86400, divisor: 3600, name: "hour" },
    { limit: 604800, divisor: 86400, name: "day" },
    { limit: 2592000, divisor: 604800, name: "week" },
    { limit: 31536000, divisor: 2592000, name: "month" },
  ] as const;

  const unit = units.find((entry) => absSeconds < entry.limit) ?? {
    divisor: 31536000,
    name: "year",
  };

  const value = Math.max(1, Math.round(absSeconds / unit.divisor));
  const label = value === 1 ? unit.name : `${unit.name}s`;

  return `${value} ${label} ${diffSeconds < 0 ? "ago" : "from now"}`;
}