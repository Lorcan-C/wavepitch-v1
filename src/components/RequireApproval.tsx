import { useUser } from '@clerk/clerk-react';

import { WaitlistPending } from './WaitlistPending';

interface RequireApprovalProps {
  children: React.ReactNode;
}

export function RequireApproval({ children }: RequireApprovalProps) {
  const { user, isLoaded } = useUser();

  // Feature flag to temporarily disable approval requirement
  const REQUIRE_APPROVAL = false;

  // Show loading while user data is being fetched
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Check if user is approved
  const isApproved = user?.publicMetadata?.approved === true;

  if (REQUIRE_APPROVAL && !isApproved) {
    return <WaitlistPending />;
  }

  return <>{children}</>;
}
