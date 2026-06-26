export function NivaLogo({ size = 32, className = '' }) {
  return (
    <img
      src="/favicon.svg"
      width={size}
      height={size}
      alt="NivaOps"
      className={className}
      style={{ objectFit: 'contain' }}
    />
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
