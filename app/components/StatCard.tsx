import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'purple';
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'border-blue-500 bg-blue-50';
      case 'green':
        return 'border-green-500 bg-green-50';
      case 'orange':
        return 'border-orange-500 bg-orange-50';
      case 'purple':
        return 'border-purple-500 bg-purple-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  const getIconColor = () => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'green':
        return 'text-green-600';
      case 'orange':
        return 'text-orange-600';
      case 'purple':
        return 'text-purple-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className={`stat-card ${getColorClasses()}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${getIconColor()}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};