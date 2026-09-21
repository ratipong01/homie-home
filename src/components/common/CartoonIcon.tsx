import React from 'react';

export type CartoonIconName =
  | 'tasks'
  | 'finance'
  | 'dashboard'
  | 'members'
  | 'plus'
  | 'bell'
  | 'pet'
  | 'asset'
  | 'virtual'
  | 'person'
  | 'settle'
  | 'calendar'
  | 'check'
  | 'sparkles'
  | 'lock'
  | 'settings'
  | 'warn';

interface CartoonIconProps {
  name: CartoonIconName;
  className?: string;
  size?: number;
}

export const CartoonIcon: React.FC<CartoonIconProps> = ({
  name,
  className = '',
  size = 24,
}) => {
  const pixelSize = `${size}px`;

  switch (name) {
    case 'tasks':
      // Cartoon Clipboard with cute check and star
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <rect x="8" y="10" width="32" height="34" rx="8" fill="#FFEDD5" stroke="#EA580C" strokeWidth="3" />
          <rect x="16" y="4" width="16" height="10" rx="4" fill="#F97316" stroke="#C2410C" strokeWidth="2.5" />
          <circle cx="24" cy="9" r="2" fill="#FFFBF5" />
          <path d="M16 22H32" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
          <path d="M16 29H30" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
          <path d="M16 36H24" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
          <circle cx="33" cy="35" r="5.5" fill="#34D399" stroke="#059669" strokeWidth="2" />
          <path d="M31 35L32.5 36.5L35.5 33.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'finance':
      // Cartoon Cute Money Bag / Coin Wallet
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <ellipse cx="24" cy="30" rx="16" ry="14" fill="#FEF08A" stroke="#CA8A04" strokeWidth="3" />
          <path d="M17 18C17 18 19 12 24 12C29 12 31 18 31 18" stroke="#CA8A04" strokeWidth="3" strokeLinecap="round" />
          <rect x="18" y="15" width="12" height="5" rx="2.5" fill="#FACC15" stroke="#A16207" strokeWidth="2" />
          <circle cx="24" cy="30" r="7" fill="#FACC15" stroke="#CA8A04" strokeWidth="2" />
          <text x="24" y="34" textAnchor="middle" fill="#854D0E" fontSize="11" fontWeight="900" fontFamily="sans-serif">฿</text>
        </svg>
      );

    case 'dashboard':
      // Cartoon Bar Chart with Smiling Face
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <rect x="6" y="8" width="36" height="34" rx="8" fill="#E0F2FE" stroke="#0284C7" strokeWidth="3" />
          <rect x="12" y="24" width="6" height="12" rx="3" fill="#38BDF8" stroke="#0284C7" strokeWidth="2" />
          <rect x="21" y="16" width="6" height="20" rx="3" fill="#818CF8" stroke="#4F46E5" strokeWidth="2" />
          <rect x="30" y="20" width="6" height="16" rx="3" fill="#F472B6" stroke="#DB2777" strokeWidth="2" />
          <circle cx="15" cy="18" r="1.5" fill="#0369A1" />
          <circle cx="33" cy="14" r="1.5" fill="#BE185D" />
          <path d="M23 10L25 12L27 10" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'members':
      // Cartoon Group of Cute Faces
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          {/* Back member */}
          <circle cx="31" cy="18" r="8" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="2.5" />
          <path d="M23 38C23 32 27 30 31 30C35 30 39 32 39 38" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="2.5" />
          {/* Front member */}
          <circle cx="18" cy="20" r="9" fill="#FFEDD5" stroke="#EA580C" strokeWidth="2.5" />
          <circle cx="15.5" cy="19" r="1.2" fill="#9A3412" />
          <circle cx="20.5" cy="19" r="1.2" fill="#9A3412" />
          <path d="M16 23C17 24.5 19 24.5 20 23" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 40C9 33 13 31 18 31C23 31 27 33 27 40" fill="#FED7AA" stroke="#EA580C" strokeWidth="2.5" />
        </svg>
      );

    case 'plus':
      // Cartoon Chunky Plus Button
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <circle cx="24" cy="24" r="20" fill="#F97316" stroke="#C2410C" strokeWidth="3" />
          <rect x="21.5" y="12" width="5" height="24" rx="2.5" fill="#FFFFFF" />
          <rect x="12" y="21.5" width="24" height="5" rx="2.5" fill="#FFFFFF" />
        </svg>
      );

    case 'bell':
      // Cartoon Jingle Bell with Star
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <path
            d="M24 8C17 8 13 14 13 22C13 29 9 32 9 34H39C39 32 35 29 35 22C35 14 31 8 24 8Z"
            fill="#FEF08A"
            stroke="#CA8A04"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="38" r="4.5" fill="#EAB308" stroke="#A16207" strokeWidth="2.5" />
          <ellipse cx="24" cy="8" rx="3.5" ry="2.5" fill="#FACC15" stroke="#CA8A04" strokeWidth="2" />
          <circle cx="20" cy="20" r="1" fill="#A16207" />
          <circle cx="28" cy="20" r="1" fill="#A16207" />
        </svg>
      );

    case 'pet':
      // Cartoon Cute Paw with Heart
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <ellipse cx="24" cy="31" rx="10" ry="8" fill="#FED7AA" stroke="#EA580C" strokeWidth="2.5" />
          <circle cx="13" cy="18" r="4.5" fill="#FFEDD5" stroke="#EA580C" strokeWidth="2.5" />
          <circle cx="21" cy="13" r="4.5" fill="#FFEDD5" stroke="#EA580C" strokeWidth="2.5" />
          <circle cx="27" cy="13" r="4.5" fill="#FFEDD5" stroke="#EA580C" strokeWidth="2.5" />
          <circle cx="35" cy="18" r="4.5" fill="#FFEDD5" stroke="#EA580C" strokeWidth="2.5" />
          <path d="M22 30C22 28.5 24 28.5 24 30C24 28.5 26 28.5 26 30C26 31.5 24 33 24 33C24 33 22 31.5 22 30Z" fill="#F43F5E" />
        </svg>
      );

    case 'asset':
      // Cartoon Cozy House with Chimney
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <rect x="30" y="10" width="5" height="10" rx="1.5" fill="#FB923C" stroke="#C2410C" strokeWidth="2" />
          <path d="M8 22L24 9L40 22" fill="#FDA4AF" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="12" y="21" width="24" height="19" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="2.5" />
          <rect x="20" y="28" width="8" height="12" rx="2" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
          <circle cx="26" cy="34" r="1" fill="#FFFFFF" />
          <rect x="14" y="24" width="5" height="5" rx="1" fill="#67E8F9" stroke="#0891B2" strokeWidth="1.5" />
          <rect x="29" y="24" width="5" height="5" rx="1" fill="#67E8F9" stroke="#0891B2" strokeWidth="1.5" />
        </svg>
      );

    case 'virtual':
    case 'person':
      // Cartoon Friendly Character Face
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <circle cx="24" cy="20" r="12" fill="#E0E7FF" stroke="#4F46E5" strokeWidth="2.5" />
          <path d="M12 40C12 33 17 31 24 31C31 31 36 33 36 40" fill="#C7D2FE" stroke="#4F46E5" strokeWidth="2.5" />
          <circle cx="20" cy="19" r="1.5" fill="#312E81" />
          <circle cx="28" cy="19" r="1.5" fill="#312E81" />
          <path d="M21 23C22 25 26 25 27 23" stroke="#312E81" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 12C20 9 28 9 30 12" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'settle':
      // Cartoon Flying Cash / Pay
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <rect x="8" y="14" width="32" height="20" rx="5" fill="#BBF7D0" stroke="#16A34A" strokeWidth="3" />
          <circle cx="24" cy="24" r="5" fill="#4ADE80" stroke="#15803D" strokeWidth="2" />
          <path d="M6 18C4 20 4 28 6 30" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
          <path d="M42 18C44 20 44 28 42 30" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'calendar':
      // Cartoon Calendar with Pin
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <rect x="8" y="12" width="32" height="30" rx="6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="3" />
          <path d="M8 20H40" stroke="#EF4444" strokeWidth="3" />
          <rect x="15" y="6" width="4" height="9" rx="2" fill="#B91C1C" />
          <rect x="29" y="6" width="4" height="9" rx="2" fill="#B91C1C" />
          <circle cx="18" cy="28" r="2.5" fill="#F87171" />
          <circle cx="24" cy="28" r="2.5" fill="#F87171" />
          <circle cx="30" cy="28" r="2.5" fill="#F87171" />
          <circle cx="18" cy="35" r="2.5" fill="#F87171" />
          <circle cx="24" cy="35" r="2.5" fill="#EF4444" />
        </svg>
      );

    case 'check':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <circle cx="24" cy="24" r="18" fill="#D1FAE5" stroke="#10B981" strokeWidth="3" />
          <path d="M15 24L21 30L33 18" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'sparkles':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 6L26.5 17.5L38 20L26.5 22.5L24 34L21.5 22.5L10 20L21.5 17.5L24 6Z" fill="#FDE047" stroke="#EAB308" strokeWidth="2.5" />
          <circle cx="35" cy="11" r="3" fill="#F472B6" />
          <circle cx="12" cy="32" r="2.5" fill="#60A5FA" />
        </svg>
      );

    case 'lock':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <rect x="11" y="19" width="26" height="22" rx="6" fill="#FED7AA" stroke="#EA580C" strokeWidth="3" />
          <path d="M17 19V14C17 10 20 7 24 7C28 7 31 10 31 14V19" stroke="#EA580C" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="24" cy="29" r="3" fill="#C2410C" />
          <path d="M24 32V36" stroke="#C2410C" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'settings':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <circle cx="24" cy="24" r="7" fill="#FED7AA" stroke="#EA580C" strokeWidth="3" />
          <path
            d="M24 4V8M24 40V44M4 24H8M40 24H44M9.86 9.86L12.69 12.69M35.31 35.31L38.14 38.14M9.86 38.14L12.69 35.31M35.31 12.69L38.14 9.86"
            stroke="#EA580C"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'warn':
    default:
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 7L42 39H6L24 7Z" fill="#FEF08A" stroke="#CA8A04" strokeWidth="3" strokeLinejoin="round" />
          <path d="M24 19V27" stroke="#A16207" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="24" cy="33" r="2" fill="#A16207" />
        </svg>
      );
  }
};
