export async function generateMeetingTopic(
  pitchDescription: string,
  meetingType: string,
  authToken: string,
): Promise<string> {
  const response = await fetch('/api/ai/generate-topic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      promptName: 'meeting-topic-generator',
      variables: {
        pitchDescription,
        meetingType,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate meeting topic');
  }

  const data = await response.json();
  return data.topic;
}
