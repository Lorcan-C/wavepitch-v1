export class TTSAudioCacheService {
  private static audioMap = new Map<string, string>();

  static storeAudioForMessage(messageId: string, audioUrl: string): void {
    this.audioMap.set(messageId, audioUrl);
    console.log(`TTS Cache: Stored audio for message ${messageId}`);
  }

  static getAudioForMessage(messageId: string): string | null {
    return this.audioMap.get(messageId) || null;
  }

  static clearAudioForMessage(messageId: string): void {
    const audioUrl = this.audioMap.get(messageId);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      this.audioMap.delete(messageId);
      console.log(`TTS Cache: Cleared audio for message ${messageId}`);
    }
  }

  static clearAllAudio(): void {
    for (const [messageId, audioUrl] of this.audioMap.entries()) {
      URL.revokeObjectURL(audioUrl);
      console.log(`TTS Cache: Cleared audio for message ${messageId}`);
    }
    this.audioMap.clear();
    console.log('TTS Cache: Cleared all audio cache');
  }

  static hasAudioForMessage(messageId: string): boolean {
    return this.audioMap.has(messageId);
  }
}
