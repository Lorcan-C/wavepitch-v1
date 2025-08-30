// import { Protect } from '@clerk/clerk-react';
// import { UpgradePrompt } from './UpgradePrompt';

interface MeetingProtectProps {
  children: React.ReactNode;
}

export function MeetingProtect({ children }: MeetingProtectProps) {
  // Feature flag: disable billing protection temporarily
  return <>{children}</>;

  // Original billing protection (commented out)
  // return (
  //   <Protect feature="unlimited_meetings" fallback={<UpgradePrompt feature="unlimited meetings" />}>
  //     {children}
  //   </Protect>
  // );
}
