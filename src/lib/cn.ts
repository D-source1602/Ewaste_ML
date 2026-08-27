/** Joins class names, dropping anything falsy. Replaces `clsx`. */
export function cn(
  ...parts: (string | false | null | undefined)[]
): string {
  return parts.filter(Boolean).join(' ');
}
