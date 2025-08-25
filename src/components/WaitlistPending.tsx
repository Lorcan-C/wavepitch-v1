import { SignOutButton, useUser } from '@clerk/clerk-react';

import { Logo } from './Logo';
import { Button } from './ui/button';

export function WaitlistPending() {
  const { user } = useUser();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold">You're on the waitlist!</h1>

          <div className="space-y-2">
            <p className="text-muted-foreground">
              Hi {user?.firstName || 'there'}! Thanks for signing up.
            </p>
            <p className="text-muted-foreground">
              We'll notify you at <strong>{user?.primaryEmailAddress?.emailAddress}</strong> when
              your early access is ready.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-800">
              💡 <strong>Good news:</strong> You're already signed up! When we approve your access,
              you'll be able to sign in and start using the app immediately.
            </p>
          </div>

          <div className="pt-6 space-y-3">
            <SignOutButton redirectUrl="/">
              <Button variant="outline" className="w-full">
                Sign Out
              </Button>
            </SignOutButton>

            <p className="text-xs text-muted-foreground">
              Want to use a different email? Sign out and sign up again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
