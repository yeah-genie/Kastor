export const Logo = ({ size = 32 }: { size?: number }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <rect 
        x="4" 
        y="4" 
        width="16" 
        height="16" 
        rx="5" 
        fill="url(#paint0_linear)" 
        fillOpacity="0.9"
      />
      <rect 
        x="12" 
        y="12" 
        width="16" 
        height="16" 
        rx="5" 
        fill="url(#paint1_linear)" 
        fillOpacity="0.8"
        style={{ mixBlendMode: 'plus-lighter' }}
      />
      <defs>
        <linearGradient id="paint0_linear" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="paint1_linear" x1="12" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </svg>
  );
};
