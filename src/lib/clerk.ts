// Clerk configuration for the application
export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error('Missing Clerk publishable key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file');
}