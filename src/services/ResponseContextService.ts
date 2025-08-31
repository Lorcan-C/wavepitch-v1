import { Participant } from '@/meetings/types';

import { SpeakerRotationService } from './SpeakerRotationService';

export class ResponseContextService {
  static getNextAgent(
    participants: Participant[],
    currentSpeakerIndex: number,
    meetingPurpose: string,
  ) {
    try {
      const nextAgent = SpeakerRotationService.getCurrentSpeaker(participants, currentSpeakerIndex);

      console.log('ResponseContextService: Agent context compiled');

      return {
        agentName: nextAgent.name,
        agentRole: nextAgent.role,
        agentBio: nextAgent.description || nextAgent.role,
        meetingPurpose: meetingPurpose,
      };
    } catch (error) {
      console.log('ResponseContextService: Failed to compile agent context');
      throw error;
    }
  }
}
