import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "blue" | "green" | "orange" | "purple" | "red";
  subtitle?: string;
}

const colorStyles: Record<
  StatCardProps["color"],
  { iconWrapper: string; accent: string }
> = {
  blue: {
    iconWrapper: "bg-blue-100 text-blue-600",
    accent: "text-blue-600",
  },
  green: {
    iconWrapper: "bg-green-100 text-green-600",
    accent: "text-green-600",
  },
  orange: {
    iconWrapper: "bg-orange-100 text-orange-600",
    accent: "text-orange-600",
  },
  purple: {
    iconWrapper: "bg-purple-100 text-purple-600",
    accent: "text-purple-600",
  },
  red: {
    iconWrapper: "bg-red-100 text-red-600",
    accent: "text-red-600",
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}) => {
  const styles = colorStyles[color];

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between space-x-4">
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl ${styles.iconWrapper}`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
};