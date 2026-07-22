import React from "react";

interface OrbitLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function OrbitLogo({ size = 32, className, ...props }: OrbitLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Planetary ring (large broken circle) */}
      <path
        d="M 81.0 38.7 A 33 33 0 1 1 61.3 19.0"
        stroke="currentColor"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      {/* Orbiting moon (small circle at the top right) */}
      <circle
        cx="80.0"
        cy="20.0"
        r="8.5"
        stroke="currentColor"
        strokeWidth="7.5"
      />
    </svg>
  );
}
