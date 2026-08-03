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
            d="M 44.5 55.5 C 50 36, 62 31, 76.5 34 C 67 52, 55 60, 44.5 55.5 Z"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </g>
    </svg>
  );
}

