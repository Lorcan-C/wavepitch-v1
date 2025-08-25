import { useTTS } from '@/hooks/useTTS';

export function QuickTTSTest() {
  const { speak, loading } = useTTS();

  return (
    <button
      onClick={() => speak('Hello! Your OpenAI text-to-speech is working correctly.')}
      disabled={loading}
      className="fixed bottom-4 right-4 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 disabled:opacity-50"
    >
      {loading ? '🔊 Speaking...' : '🎤 Test TTS'}
    </button>
  );
}
