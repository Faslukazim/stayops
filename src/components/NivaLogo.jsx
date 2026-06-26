export function NivaLogo({ size = 32, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={size} height={size} className={className}>
      {/* Left pillar */}
      <rect x="6" y="8" width="10" height="34" rx="5" fill="#111827"/>
      {/* Right pillar */}
      <rect x="32" y="8" width="10" height="34" rx="5" fill="#111827"/>
      {/* Arch connector */}
      <path d="M16,22 Q16,8 24,8 Q32,8 32,22 L32,28 L22,28 L22,22 Q22,16 24,16 Q26,16 26,22 L26,28 L16,28 Z" fill="#111827"/>
      {/* Emerald accent corner */}
      <path d="M6,34 Q6,42 14,42 L16,42 L16,34 Z" fill="#00C853"/>
    </svg>
  );
}

export function NivaWordmark({ size = 'base', className = '' }) {
  const sizeClass = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <span className={`font-bold tracking-tight ${sizeClass} ${className}`}>
      <span style={{ color: '#0F172A' }}>Niva</span><span style={{ color: '#00C853' }}>Ops</span>
    </span>
  );
}
