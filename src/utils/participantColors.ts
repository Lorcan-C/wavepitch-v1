// Ocean/sunset themed color palette
const COLORS = [
  '#8ecae6', // Light blue (sky blue)
  '#219ebc', // Medium blue (ocean blue)
  '#023047', // Dark navy (deep ocean)
  '#ffb703', // Bright yellow (sunset yellow)
  '#fb8500', // Orange (sunset orange)
  '#2D5016', // Forest green (pine trees)
];

export const getParticipantColor = (participantId: string, fallbackColor?: string): string => {
  if (fallbackColor?.startsWith('#')) return fallbackColor;

  // Use participant ID to consistently assign same color
  const hash = participantId.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  return COLORS[Math.abs(hash) % COLORS.length];
};

export const getMessageBubbleColors = (senderName: string, isUser: boolean) => {
  if (isUser) {
    return {
      backgroundColor: '#3B82F6',
      textColor: 'white',
      className: 'bg-blue-600 text-white',
    };
  }

  const participantColor = getParticipantColor(senderName);
  return {
    backgroundColor: `${participantColor}20`, // 20% opacity
    textColor: '#374151',
    borderColor: `${participantColor}40`, // 40% opacity
    className: 'text-gray-900',
  };
};
