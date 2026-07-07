export function formatDate(date: Date | string): string {
  let dateObj: Date;

  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(Number);
    dateObj = new Date(year, month - 1, day);
  } else {
    dateObj = date;
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatDateFromISO(isoString: string): string {
  const date = new Date(isoString);
  return formatDate(date);
}
