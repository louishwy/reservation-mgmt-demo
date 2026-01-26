export function localDateToUtcDate(localYmd?: string): string | undefined {
  if (!localYmd) return undefined;
  const local = new Date(localYmd + 'T00:00:00');
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const d = String(local.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Format an ISO/UTC arrivalTime into a readable local string
export function formatLocalDatetime(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch (err) {
    return iso;
  }
}

// Convert ISO string to datetime-local value (YYYY-MM-DDTHH:mm)
export function isoToDatetimeLocal(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
