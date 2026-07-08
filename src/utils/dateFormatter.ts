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
