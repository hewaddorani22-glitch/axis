/**
 * AXIS Icon System
 * Geometric, minimal line icons matching the AXIS crosshair logo.
 * All icons use currentColor and accept className for sizing/color.
 */

import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const defaults = (props: IconProps) => ({
  width: props.size || 20,
  height: props.size || 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

// ── Navigation Icons ──

export function IconCommand(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="7" strokeDasharray="3 3" />
    </svg>
  );
}

export function IconTarget(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  );
}

export function IconRevenue(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <polyline points="4 16 8 11 12 14 16 8 20 5" />
      <line x1="20" y1="5" x2="20" y2="9" />
      <line x1="20" y1="5" x2="16" y2="5" />
      <line x1="4" y1="20" x2="20" y2="20" />
      <line x1="4" y1="4" x2="4" y2="20" />
    </svg>
  );
}

export function IconHabits(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="M5.6 5.6l2.15 2.15" />
      <path d="M16.25 16.25l2.15 2.15" />
      <path d="M5.6 18.4l2.15-2.15" />
      <path d="M16.25 7.75l2.15-2.15" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

export function IconGoals(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M4 20L8 14L12 16L16 10L20 6" />
      <polyline points="15 6 20 6 20 11" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  );
}

export function IconPartners(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3.3 2.7-6 6-6" />
      <circle cx="16" cy="8" r="3" />
      <path d="M22 19c0-3.3-2.7-6-6-6" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="10" y1="19" x2="14" y2="19" />
    </svg>
  );
}

export function IconProve(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <rect x="4" y="10" width="3" height="10" rx="1" />
      <rect x="10.5" y="6" width="3" height="14" rx="1" />
      <rect x="17" y="3" width="3" height="17" rx="1" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
      <circle cx="8" cy="7" r="2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="17" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Status & Metric Icons ──

export function IconStreak(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M12 2L8 10h3l-2 8 8-10h-4l3-6z" />
    </svg>
  );
}

export function IconFocus(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <polyline points="5 12 10 17 19 7" strokeWidth={2.5} />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconWarning(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <circle cx="8" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconBriefing(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="13" y2="15" />
      <line x1="5" y1="2" x2="5" y2="6" />
      <line x1="19" y1="2" x2="19" y2="6" />
    </svg>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <circle cx="10" cy="10" r="6" />
      <line x1="14.5" y1="14.5" x2="20" y2="20" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <polyline points="15 6 9 12 15 18" />
    </svg>
  );
}

export function IconLink(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

export function IconUpgrade(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M12 3L4 15h5v6h6v-6h5L12 3z" />
    </svg>
  );
}

export function IconNudge(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-5" strokeWidth={2.2} />
    </svg>
  );
}

export function IconTrophy(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M6 9H3a1 1 0 01-1-1V5a1 1 0 011-1h3" />
      <path d="M18 9h3a1 1 0 001-1V5a1 1 0 00-1-1h-3" />
      <path d="M6 4h12v6a6 6 0 11-12 0V4z" />
      <line x1="12" y1="16" x2="12" y2="19" />
      <rect x="8" y="19" width="8" height="2" rx="1" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" strokeWidth={2} />
    </svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <polyline points="22 4 12 13 2 4" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M12 3a15.3 15.3 0 014 9 15.3 15.3 0 01-4 9 15.3 15.3 0 01-4-9 15.3 15.3 0 014-9z" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function IconReview(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
}

// ── AXIS Logo ──

export function AxisLogo({ size = 28, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" {...props}>
      <line x1="4" y1="20" x2="36" y2="20" stroke="#CDFF4F" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="4" x2="20" y2="36" stroke="#CDFF4F" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="20" r="3.5" fill="#CDFF4F" />
    </svg>
  );
}

// Brand Icons
export function IconBrandNotion({ size = 24, className = "", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M4 4v16l16 2V6L4 4z" />
      <path d="M4 4l6-2 10 2" />
      <path d="M10 2v16" />
      <path d="M8 10h8" />
      <path d="M8 14h8" />
    </svg>
  );
}

export function IconBrandTodoist({ size = 24, className = "", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M5 8h14M5 12h14M5 16h14" />
      <path d="M3 8h.01M3 12h.01M3 16h.01" />
    </svg>
  );
}

export function IconBrandMint({ size = 24, className = "", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M12 12c-3.31 0-6-2.69-6-6 0 3.31 2.69 6 6 6z" />
      <path d="M12 12c3.31 0 6 2.69 6 6 0-3.31-2.69-6-6-6z" />
    </svg>
  );
}

export function IconBrandHabitica({ size = 24, className = "", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4" />
      <path d="M10 10h4" />
    </svg>
  );
}

export function IconBrandGoogleSheets({ size = 24, className = "", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

export function IconBrandStrides({ size = 24, className = "", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </svg>
  );
}
