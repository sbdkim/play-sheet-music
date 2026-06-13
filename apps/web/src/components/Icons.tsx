import type { SVGProps } from 'react';

function Icon(props: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  const { children, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export function UploadIcon() {
  return <Icon><path d="M12 16V4m0 0 4 4m-4-4L8 8" /><path d="M4 15v4h16v-4" /></Icon>;
}

export function PlayIcon() {
  return <Icon><path d="m8 5 11 7-11 7Z" /></Icon>;
}

export function PauseIcon() {
  return <Icon><path d="M9 5v14M15 5v14" /></Icon>;
}

export function StopIcon() {
  return <Icon><rect x="6" y="6" width="12" height="12" /></Icon>;
}

export function MoonIcon() {
  return <Icon><path d="M20 15.2A8.4 8.4 0 0 1 8.8 4 8.4 8.4 0 1 0 20 15.2Z" /></Icon>;
}

export function SunIcon() {
  return <Icon><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>;
}

export function VolumeIcon() {
  return <Icon><path d="M5 10v4h3l4 4V6L8 10H5Z" /><path d="M16 9a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10" /></Icon>;
}
