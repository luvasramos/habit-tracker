import type { ButtonHTMLAttributes, ReactNode } from 'react';

type RecommendationOptionProps = {
  accessibleName: string;
  children: ReactNode;
  isSelected: boolean;
  selectionRole?: 'radio';
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'aria-pressed' | 'children' | 'type'>;

export const RecommendationOption = ({
  accessibleName,
  children,
  className = '',
  isSelected,
  selectionRole,
  title,
  ...props
}: RecommendationOptionProps) => (
  <button
    className={`selector-card recommendation-option ${className}`.trim()}
    type="button"
    aria-label={accessibleName}
    aria-checked={selectionRole === 'radio' ? isSelected : undefined}
    aria-pressed={selectionRole === 'radio' ? undefined : isSelected}
    role={selectionRole}
    title={title ?? accessibleName}
    {...props}
  >
    {children}
  </button>
);
