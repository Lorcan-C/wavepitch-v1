import { Participant } from '@/meetings/types';
import { voiceAssigner } from '@/services/voice';

/**
 * Test utility to verify voice assignment consistency
 */
export function testVoiceAssignments() {
  const testSessionId = 'test-session-123';

  // Mock AI participants (no users)
  const participants: Participant[] = [
    { id: 'expert-1', name: 'Alice', role: 'Tech Lead', avatar: '👩‍💻', color: 'purple' },
    { id: 'expert-2', name: 'Bob', role: 'Designer', avatar: '👨‍🎨', color: 'blue' },
    { id: 'expert-3', name: 'Carol', role: 'PM', avatar: '👩‍💼', color: 'green' },
    { id: 'expert-4', name: 'Dave', role: 'Engineer', avatar: '👨‍💻', color: 'yellow' },
  ];

  // Test initial assignment
  console.log('🎤 Testing voice assignment system...');
  voiceAssigner.assignVoices(testSessionId, participants);

  // Test consistency - same participant should always get same voice
  const voice1 = voiceAssigner.getVoice(testSessionId, 'expert-1');
  const voice1Again = voiceAssigner.getVoice(testSessionId, 'expert-1');

  console.log(`Expert 1 voice (first call): ${voice1}`);
  console.log(`Expert 1 voice (second call): ${voice1Again}`);
  console.log(`Consistency test: ${voice1 === voice1Again ? '✅ PASS' : '❌ FAIL'}`);

  // Test all participants get different voices
  const allVoices = participants.map((p) => ({
    name: p.name,
    voice: voiceAssigner.getVoice(testSessionId, p.id),
  }));

  console.log('\n🎭 Voice assignments:');
  allVoices.forEach(({ name, voice }) => {
    console.log(`  ${name}: ${voice}`);
  });

  const uniqueVoices = new Set(allVoices.map((v) => v.voice));
  console.log(
    `\nUniqueness test: ${uniqueVoices.size === participants.length ? '✅ PASS' : '⚠️  PARTIAL'}`,
  );
  console.log(`(${uniqueVoices.size}/${participants.length} unique voices)`);

  // Cleanup
  voiceAssigner.clearSession(testSessionId);
  console.log('\n🧹 Test session cleaned up');

  return {
    consistencyPassed: voice1 === voice1Again,
    uniqueVoiceCount: uniqueVoices.size,
    totalParticipants: participants.length,
  };
}
