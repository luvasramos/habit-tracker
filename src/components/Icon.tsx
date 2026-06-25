import type { ReactNode } from 'react';

type IconName =
  | 'add'
  | 'bell'
  | 'calendar'
  | 'check'
  | 'close'
  | 'delete'
  | 'edit'
  | 'flame'
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
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 19a2 2 0 0 0 4 0" />
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
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
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
  flame: (
    <>
      <path d="M12 21c3.3 0 6-2.4 6-5.8 0-2.7-1.5-4.6-3.4-6.4-.7 1.6-1.7 2.4-2.8 2.9.4-2.8-.8-5.2-3.1-7.2.1 3.4-2.7 5.2-2.7 8.8C6 17.9 8.7 21 12 21Z" />
      <path d="M12 18c1.2 0 2.2-.9 2.2-2.2 0-1-.6-1.7-1.4-2.4-.2.7-.6 1.1-1.1 1.3.1-1-.3-1.8-1.1-2.6 0 1.3-.8 2- .8 3.3C9.8 17 10.8 18 12 18Z" />
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
