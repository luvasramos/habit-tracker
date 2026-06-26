import type { ButtonHTMLAttributes, ReactNode } from 'react';

type RecommendationOptionProps = {
  accessibleName: string;
  children: ReactNode;
  isSelected: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'aria-pressed' | 'children' | 'type'>;

export const RecommendationOption = ({
  accessibleName,
  children,
  className = '',
  isSelected,
  title,
  ...props
}: RecommendationOptionProps) => (
  <button
    className={`selector-card recommendation-option ${className}`.trim()}
    type="button"
    aria-label={accessibleName}
    aria-pressed={isSelected}
    title={title ?? accessibleName}
    {...props}
  >
    {children}
  </button>
);
