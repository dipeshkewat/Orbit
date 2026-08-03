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
      <g fill="currentColor">
        {[0, 90, 180, 270].map((angle) => (
          <path
            key={angle}
            d="M 43 57 C 48 38, 58 31, 76 34 C 65 54, 52 61, 43 57 Z"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </g>
    </svg>
  );
}

