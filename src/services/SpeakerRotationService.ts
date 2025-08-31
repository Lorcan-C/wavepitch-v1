import { Participant } from '@/meetings/types';

export class SpeakerRotationService {
  static getCurrentSpeaker(participants: Participant[], currentIndex: number): Participant {
    return participants[currentIndex % participants.length];
  }

  static getNextIndex(currentIndex: number, participantCount: number): number {
    return (currentIndex + 1) % participantCount;
  }

  static advanceToNext(currentIndex: number, participantCount: number): number {
    return this.getNextIndex(currentIndex, participantCount);
  }
}
