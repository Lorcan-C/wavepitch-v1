import { useState } from 'react';

import { useTTS } from '@/hooks/useTTS';

export function TTSTest() {
  const { speak, loading } = useTTS();
  const [error, setError] = useState<string>('');

  const testTTS = async () => {
    try {
      setError('');
      await speak('Testing OpenAI text to speech. Your API key is working!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="font-semibold">TTS API Test</h3>
      <button
        onClick={testTTS}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test OpenAI TTS'}
      </button>
      {error && (
        <div className="text-red-500 text-sm">
          Error: {error}
          <br />
          Check that OPENAI_API_KEY is set in Vercel Environment Variables
        </div>
      )}
    </div>
  );
}
