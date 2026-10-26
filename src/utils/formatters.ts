/**
 * Currency and Date formatters for Grocery Shop Management
 */

export function formatCurrency(amount: number, symbol = '₹'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol}0`;
  }
  
  // Format as Indian Rupee formatting (e.g. 1,00,000 or 150)
  const isWhole = Number.isInteger(amount);
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol}${formattedNumber}`;
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return 'Not available';
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    // Standardized Indian English format: e.g. 25 Oct 2026, 07:30 PM
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour should be 12
    const strHours = hours.toString().padStart(2, '0');

    return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
  } catch {
    return isoString;
  }
}

export function formatDateOnly(isoString?: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDateOnly(isoString);
  } catch {
    return '';
  }
}

export function formatQuantity(value: number, unit: string): string {
  if (!value && value !== 0) return unit;
  return `${value} ${unit}`;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
