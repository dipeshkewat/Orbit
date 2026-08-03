import React from "react";

interface OrbitLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function OrbitLogo({ size = 32, className = "", style, ...props }: OrbitLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      {/* Horizontal Orbital Ring */}
      <path
        d="M 5 50 C 5 28, 95 28, 95 50 C 95 72, 5 72, 5 50 Z M 13 50 C 13 63, 87 63, 87 50 C 87 37, 13 37, 13 50 Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      {/* Vertical Orbital Ring */}
      <path
        d="M 50 5 C 72 5, 72 95, 50 95 C 28 95, 28 5, 50 5 Z M 50 13 C 37 13, 37 87, 50 87 C 63 87, 63 13, 50 13 Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      {/* Core Sphere */}
      <circle cx="50" cy="50" r="13" fill="currentColor" />
      {/* Inner Globe Grid Arcs */}
      <circle cx="50" cy="50" r="12" stroke="var(--color-background, #111)" strokeWidth="1.2" fill="none" />
      <path d="M 38 50 A 12 12 0 0 0 62 50 A 12 12 0 0 0 38 50" stroke="var(--color-background, #111)" strokeWidth="1" fill="none" />
      <path d="M 50 38 A 12 12 0 0 0 50 62 A 12 12 0 0 0 50 38" stroke="var(--color-background, #111)" strokeWidth="1" fill="none" />
    </svg>
  );
}
