interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: 'high' | 'low';
}

const sizeClasses = {
  sm: 'h-12',
  md: 'h-12 md:h-16',
  lg: 'h-16',
  xl: 'h-24',
};

export function Logo({ size = 'md', className = '', priority = 'low' }: LogoProps) {
  const sizeClass = sizeClasses[size];

  return (
    <a href="https://wavepitch.ai" className="inline-block hover:opacity-80 transition-opacity">
      <img
        src="/images/onboardinglogo_4.png"
        alt="Logo"
        className={`w-auto ${sizeClass} ${className}`}
        loading={priority === 'high' ? 'eager' : 'lazy'}
        fetchPriority={priority}
      />
    </a>
  );
}
