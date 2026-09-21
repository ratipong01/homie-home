import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  action,
}) => {
  return (
    <div className="flex items-start justify-between gap-2 mb-4">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-bold text-text-main tracking-tight leading-tight">
            {title}
          </h1>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-muted text-text-secondary border border-surface-muted">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-text-muted mt-0.5 leading-normal">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
