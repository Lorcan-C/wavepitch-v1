// TODO: Implement proper text generation service
// This is a temporary stub to fix import errors

export function getTextGenerationService() {
  console.warn('[getTextGenerationService] This is a mock implementation. Please implement proper service.');
  return {
    generateAgentResponse: async (prompt: string) => {
      console.warn('[MockTextGenerationService] Mock generateAgentResponse called');
      return 'SUMMARY: Mock document summary\n\nKEY POINTS:\n- Mock key point 1\n- Mock key point 2\n- Mock key point 3';
    }
  };
}