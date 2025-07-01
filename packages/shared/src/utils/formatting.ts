/**
 * Formats duration in minutes to a human-readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Formats a date to a human-readable string
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Formats a date and time to a human-readable string
 */
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Formats experience points with appropriate suffixes
 */
export const formatExperiencePoints = (xp: number): string => {
  if (xp < 1000) {
    return `${xp} XP`;
  }

  if (xp < 1000000) {
    return `${(xp / 1000).toFixed(1)}K XP`;
  }

  return `${(xp / 1000000).toFixed(1)}M XP`;
};

/**
 * Formats a quest title with proper capitalization
 */
export const formatQuestTitle = (title: string): string => {
  return title
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Truncates text to a specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Formats a percentage value
 */
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) {
    return '0%';
  }

  const percentage = (value / total) * 100;
  return `${Math.round(percentage)}%`;
};
