import { UserProfile } from '@clerk/clerk-react';

export function BillingSection() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing & Subscription</h3>
        <p className="text-sm text-gray-600 mb-4">
          Manage your subscription, billing information, and view invoices
        </p>
      </div>

      <UserProfile
        appearance={{
          elements: {
            navbarMobileMenuButton: 'hidden',
            navbar: 'hidden',
            pageScrollBox: 'bg-transparent shadow-none',
          },
        }}
        routing="hash"
      />
    </div>
  );
}
