export const FEATURE_FLAGS = {
  // Voice input UI features
  SHOW_LISTENING_BOX: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
