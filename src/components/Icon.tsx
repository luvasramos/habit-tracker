type IconName =
  | 'add'
  | 'calendar'
  | 'check'
  | 'delete'
  | 'edit'
  | 'habits'
  | 'next'
  | 'previous'
  | 'stats';

type IconProps = {
  name: IconName;
  className?: string;
};

const paths: Record<IconName, ReactNode> = {
  add: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  calendar: (
    <>
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M4 8h16" />
      <rect x="4" y="5" width="16" height="15" rx="2" />
    </>
  ),
  check: <path d="m5 12 4 4 10-10" />,
  delete: (
    <>
      <path d="M6 7h12" />
      <path d="M10 7V5h4v2" />
      <path d="M8 7l1 13h6l1-13" />
    </>
  ),
  edit: (
    <>
      <path d="M5 19h4l10-10-4-4L5 15v4Z" />
      <path d="m13 7 4 4" />
    </>
  ),
  habits: (
    <>
      <path d="M6 7h12" />
      <path d="M6 12h12" />
      <path d="M6 17h8" />
      <path d="m4 7 .5.5L6 6" />
      <path d="m4 12 .5.5L6 11" />
      <path d="m4 17 .5.5L6 16" />
    </>
  ),
  next: <path d="m9 5 7 7-7 7" />,
  previous: <path d="m15 5-7 7 7 7" />,
  stats: (
    <>
      <path d="M12 4a8 8 0 1 1-8 8" />
      <path d="M12 4v8h8" />
    </>
  ),
};

export const Icon = ({ name, className = '' }: IconProps) => (
  <svg
    className={`icon ${className}`.trim()}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {paths[name]}
  </svg>
);
import type { ReactNode } from 'react';
