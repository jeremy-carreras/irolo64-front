export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    const dateStr = date.includes('T') ? date.split('T')[0] : date;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatDateFromISO(isoString: string): string {
  return formatDate(isoString);
}

export function formatNumber(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '0';

  const parts = num.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return decimals > 0 ? parts.join('.') : parts[0];
}

export function formatCurrency(value: number | string, decimals: number = 2): string {
  return `$${formatNumber(value, decimals)}`;
}
