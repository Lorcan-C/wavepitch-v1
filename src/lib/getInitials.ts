export function getInitials(name: string): string {
  if (!name) return '';

  const words = name.split(' ');

  if (words.length > 1) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
}
