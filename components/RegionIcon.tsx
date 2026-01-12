
import React from 'react';
import { Globe } from 'lucide-react';

interface RegionIconProps {
  zone: string;
  className?: string;
}

export const RegionIcon: React.FC<RegionIconProps> = ({ zone, className = "w-4 h-4" }) => {
  const z = zone.toLowerCase();

  // --- SVG Flags ---
  
  // United States (us-*)
  const USFlag = () => (
    <svg viewBox="0 0 32 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="24" rx="2" fill="#B22234"/>
      <path d="M0 3H32" stroke="white" strokeWidth="2"/>
      <path d="M0 9H32" stroke="white" strokeWidth="2"/>
      <path d="M0 15H32" stroke="white" strokeWidth="2"/>
      <path d="M0 21H32" stroke="white" strokeWidth="2"/>
      <rect width="14" height="13" rx="1" fill="#3C3B6E"/>
      <circle cx="2" cy="2" r="0.5" fill="white"/>
      <circle cx="5" cy="2" r="0.5" fill="white"/>
      <circle cx="8" cy="2" r="0.5" fill="white"/>
      <circle cx="11" cy="2" r="0.5" fill="white"/>
      <circle cx="3.5" cy="4.5" r="0.5" fill="white"/>
      <circle cx="6.5" cy="4.5" r="0.5" fill="white"/>
      <circle cx="9.5" cy="4.5" r="0.5" fill="white"/>
      <circle cx="2" cy="7" r="0.5" fill="white"/>
      <circle cx="5" cy="7" r="0.5" fill="white"/>
      <circle cx="8" cy="7" r="0.5" fill="white"/>
      <circle cx="11" cy="7" r="0.5" fill="white"/>
      <circle cx="3.5" cy="9.5" r="0.5" fill="white"/>
      <circle cx="6.5" cy="9.5" r="0.5" fill="white"/>
      <circle cx="9.5" cy="9.5" r="0.5" fill="white"/>
    </svg>
  );

  // European Union (europe-*) - Fallback for Europe
  const EUFlag = () => (
    <svg viewBox="0 0 32 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="24" rx="2" fill="#003399"/>
      <circle cx="16" cy="12" r="7" stroke="#FFCC00" strokeWidth="1" strokeDasharray="1 3" opacity="0.8"/>
      <circle cx="16" cy="12" r="2" fill="#003399"/>
      <path d="M16 5L16.5 6H15.5L16 5Z" fill="#FFCC00"/>
      <path d="M16 19L16.5 20H15.5L16 19Z" fill="#FFCC00"/>
      <path d="M9 12L9.5 13H8.5L9 12Z" fill="#FFCC00"/>
      <path d="M23 12L23.5 13H22.5L23 12Z" fill="#FFCC00"/>
    </svg>
  );

  // Japan (asia-northeast1/2)
  const JPFlag = () => (
    <svg viewBox="0 0 32 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="24" rx="2" fill="white" stroke="#E2E8F0" strokeWidth="0.5"/>
      <circle cx="16" cy="12" r="6" fill="#BC002D"/>
    </svg>
  );

  // India (asia-south1/2)
  const INFlag = () => (
    <svg viewBox="0 0 32 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="24" rx="2" fill="white"/>
      <rect width="32" height="8" rx="2" fill="#FF9933"/>
      <rect y="16" width="32" height="8" rx="2" fill="#138808"/>
      <circle cx="16" cy="12" r="3.5" stroke="#000080" strokeWidth="0.5"/>
      <circle cx="16" cy="12" r="1" fill="#000080"/>
    </svg>
  );

  // Australia (australia-*)
  const AUFlag = () => (
    <svg viewBox="0 0 32 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="24" rx="2" fill="#00008B"/>
      <path d="M0 0H14V12H0V0Z" fill="#00008B"/>
      {/* Union Jack Abstraction */}
      <path d="M0 0L14 12M14 0L0 12" stroke="white" strokeWidth="2"/>
      <path d="M7 0V12M0 6H14" stroke="white" strokeWidth="2"/>
      <path d="M7 0V12M0 6H14" stroke="#CC0000" strokeWidth="1"/>
      {/* Stars */}
      <circle cx="22" cy="6" r="1.5" fill="white"/>
      <circle cx="26" cy="10" r="1" fill="white"/>
      <circle cx="24" cy="16" r="1" fill="white"/>
      <circle cx="20" cy="14" r="1" fill="white"/>
      <circle cx="7" cy="18" r="2" fill="white"/>
    </svg>
  );

  // Canada (northamerica-northeast*)
  const CAFlag = () => (
    <svg viewBox="0 0 32 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="24" rx="2" fill="#FF0000"/>
      <rect x="8" width="16" height="24" fill="white"/>
      <path d="M16 4L18 8L20 7L18 12H20L16 18V21H16V18L12 12H14L12 7L14 8L16 4Z" fill="#FF0000"/>
    </svg>
  );

  // Brazil (southamerica-*)
  const BRFlag = () => (
    <svg viewBox="0 0 32 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="24" rx="2" fill="#009B3A"/>
      <path d="M16 2L29 12L16 22L3 12L16 2Z" fill="#FEDF00"/>
      <circle cx="16" cy="12" r="5" fill="#002776"/>
      <path d="M12 11C14 10 18 10 20 13" stroke="white" strokeWidth="0.5"/>
    </svg>
  );

  // Taiwan (asia-east1)
  const TWFlag = () => (
    <svg viewBox="0 0 32 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="24" rx="2" fill="#FE0000"/>
      <rect width="16" height="12" rx="1" fill="#000095"/>
      <circle cx="8" cy="6" r="3.5" fill="white"/>
      <circle cx="8" cy="6" r="1.5" fill="#000095" opacity="0.1"/>
    </svg>
  );

  // --- Logic ---
  
  if (z === 'global') {
    return <Globe className={`${className} text-slate-400`} />;
  }

  // Exact starts
  if (z.startsWith('us-')) return <USFlag />;
  if (z.startsWith('northamerica-')) return <CAFlag />;
  if (z.startsWith('southamerica-')) return <BRFlag />;
  if (z.startsWith('australia-')) return <AUFlag />;
  
  // Asia breakdown
  if (z.startsWith('asia-northeast')) return <JPFlag />;
  if (z.startsWith('asia-south')) return <INFlag />;
  if (z.startsWith('asia-east1')) return <TWFlag />;
  
  // Europe breakdown
  if (z.startsWith('europe-')) return <EUFlag />;

  // Default fallback (Generic Earth)
  return <Globe className={`${className} text-slate-400`} />;
};
