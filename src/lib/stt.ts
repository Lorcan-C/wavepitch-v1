// ===== SPEECHMATICS STT SERVICE =====

/**
 * Get Speechmatics JWT token for authentication
 */
export async function getSpeechmatticsToken(): Promise<string> {
  try {
    const response = await fetch('/api/speechmatics/token', { method: 'POST' });
    if (response.status === 404) {
      throw new Error('Speechmatics endpoint not configured');
    }
    if (!response.ok) throw new Error(`Auth failed: ${response.status}`);
    const { jwt } = await response.json();
    return jwt;
  } catch (error) {
    throw new Error('Failed to connect to Speechmatics');
  }
}

/**
 * Speechmatics configuration
 */
export const speechmatticsConfig = {
  transcription_config: {
    language: 'en',
    enable_partials: true,
    max_delay: 2.0
  }
};

/**
 * User-friendly error messages
 */
export function getSTTErrorMessage(error: string): string {
  if (error.includes('NotAllowedError')) return 'Microphone access denied';
  if (error.includes('404')) return 'Speech service not configured';
  if (error.includes('Auth failed')) return 'Authentication failed';
  return 'Speech recognition unavailable';
}

// TODO: Add other STT providers (Whisper, Deepgram) here later