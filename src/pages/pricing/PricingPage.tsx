import { PricingTable } from '@clerk/clerk-react';

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-gray-600">Select the perfect plan for your meeting needs</p>
      </div>
      <PricingTable />
    </div>
  );
}
