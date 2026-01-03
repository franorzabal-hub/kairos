/**
 * Centralized date formatting utilities
 * All functions use 'es-AR' locale for consistency
 */

/**
 * Format day number with leading zero (e.g., "05", "23")
 */
export function formatEventDay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.getDate().toString().padStart(2, '0');
}

/**
 * Format month abbreviation uppercase without period (e.g., "ENE", "DIC")
 */
export function formatEventMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase().replace('.', '');
}

/**
 * Format full date (e.g., "lunes, 15 de enero")
 */
export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/**
 * Format time (e.g., "14:30")
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format relative date (e.g., "Hoy", "Ayer", "Hace 3 días")
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return formatFullDate(dateStr);
}
