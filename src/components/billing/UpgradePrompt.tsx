import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature?: string;
  className?: string;
}

export function UpgradePrompt({
  feature = 'unlimited meetings',
  className = '',
}: UpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <div
      className={`text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Upgrade Required</h3>
      <p className="text-gray-600 mb-4">
        You've reached your free plan limit. Upgrade to access {feature}.
      </p>
      <button
        onClick={() => navigate('/app/pricing')}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        View Plans & Upgrade
      </button>
    </div>
  );
}
