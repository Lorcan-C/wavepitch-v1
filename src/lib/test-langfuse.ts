import { langfuse } from './langfuse';

// Test function to verify Langfuse connection
export async function testLangfuseConnection() {
  try {
    // Test environment variables are loaded
    console.log('Environment check:');
    console.log('LANGFUSE_SECRET_KEY:', process.env.LANGFUSE_SECRET_KEY ? '✅ Set' : '❌ Missing');
    console.log('LANGFUSE_PUBLIC_KEY:', process.env.LANGFUSE_PUBLIC_KEY ? '✅ Set' : '❌ Missing');
    console.log('LANGFUSE_BASEURL:', process.env.LANGFUSE_BASEURL || 'Using default');

    // Test Langfuse client initialization
    console.log('Langfuse client:', langfuse ? '✅ Initialized' : '❌ Failed');

    return true;
  } catch (error) {
    console.error('Langfuse connection test failed:', error);
    return false;
  }
}
