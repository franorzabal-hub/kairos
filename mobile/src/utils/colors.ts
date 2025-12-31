/**
 * Color utility functions
 *
 * Centralized color utilities for consistent color manipulation across the app.
 */

import { CHILD_COLORS } from '../theme';

/**
 * Generate a consistent pastel color based on a string (e.g., category name)
 *
 * Creates a pastel/light version of a hex color by blending with white.
 * Useful for creating soft backgrounds that pair well with the original color as text.
 *
 * @param hexColor - The base color in hex format (e.g., "#5C6BC0")
 * @param intensity - How much of the original color to keep (0.0-1.0, default 0.2)
 *                    Lower values = lighter/more pastel, higher values = more saturated
 * @returns Pastel version of the color in hex format
 *
 * @example
 * // Create a light background from a child's color
 * const bgColor = getPastelColor(childColor, 0.2);
 * // Use childColor for text, bgColor for background
 */
export function getPastelColor(hexColor: string, intensity: number = 0.2): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Blend with white (255, 255, 255)
  const blendedR = Math.round(r * intensity + 255 * (1 - intensity));
  const blendedG = Math.round(g * intensity + 255 * (1 - intensity));
  const blendedB = Math.round(b * intensity + 255 * (1 - intensity));

  return `#${blendedR.toString(16).padStart(2, '0')}${blendedG.toString(16).padStart(2, '0')}${blendedB.toString(16).padStart(2, '0')}`;
}

/**
 * Get a consistent color for a child based on their index in the children array.
 *
 * Uses the CHILD_COLORS palette from theme and cycles through if there are
 * more children than colors.
 *
 * @param index - The index of the child in the children array
 * @returns A hex color string from the CHILD_COLORS palette
 *
 * @example
 * // In a list of children
 * children.map((child, index) => {
 *   const color = getChildColor(index);
 *   // Use color for avatar background, badges, etc.
 * });
 */
export function getChildColor(index: number): string {
  return CHILD_COLORS[index % CHILD_COLORS.length];
}
