import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface DashboardMetricsProps {
  todaySales: number;
  monthlySales: number;
  totalDiscounts: number;
  totalSurplus: number;
  lowStockCount: number;
  outOfStockCount: number;
  isLoading: boolean;
  onMetricPress?: (filter: string) => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  todaySales,
  monthlySales,
  totalDiscounts,
  totalSurplus,
  lowStockCount,
  outOfStockCount,
  isLoading,
  onMetricPress,
}) => {
  
  const formatNairaMobile = (num: number) => {
    return '₦' + num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const metrics = [
    {
      label: 'Today Sales',
      value: formatNairaMobile(todaySales),
      active: true,
      hasSub: totalDiscounts > 0 || totalSurplus > 0,
      subValue: (
        <View className="mt-2 flex-col gap-0.5">
          {totalDiscounts > 0 && (
            <Text className="text-[9px] font-black uppercase text-orange-400">
              {formatNairaMobile(totalDiscounts)} Total Discounts
            </Text>
          )}
          {totalSurplus > 0 && (
            <Text className="text-[9px] font-black uppercase text-emerald-400">
              {formatNairaMobile(totalSurplus)} Total Surplus
            </Text>
          )}
        </View>
      ),
    },
    { label: 'Out of Stock', value: outOfStockCount.toString(), active: false, filter: 'Out of Stock' },
    { label: 'Low Stock', value: lowStockCount.toString(), active: false, filter: 'Low Stock' },
    { label: 'Monthly Rev', value: formatNairaMobile(monthlySales), active: false },
  ];

  return (
    <View className="flex-row flex-wrap justify-between p-2">
      {metrics.map((item, i) => {
        const isClickable = !!item.filter;
        
        return (
          <TouchableOpacity
            key={i}
            disabled={!isClickable}
            onPress={() => isClickable && onMetricPress && onMetricPress(item.filter!)}
            className={`w-[48%] mb-4 p-4 border rounded-2xl flex-col justify-between ${
              item.active
                ? 'bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white'
                : 'bg-zinc-950 border-zinc-900'
            } ${isClickable ? 'active:scale-95' : ''}`}
          >
            <View>
              <View className="flex-row justify-between items-center mb-3">
                <Text
                  className={`text-[10px] uppercase font-bold ${
                    item.active ? 'text-zinc-400' : 'text-zinc-500'
                  }`}
                >
                  {item.label}
                </Text>
                {isClickable && (
                  <Text className={item.active ? 'text-zinc-400' : 'text-zinc-500'}>→</Text>
                )}
              </View>
              
              <Text
                className={`text-lg font-black truncate ${
                  item.active ? 'text-white dark:text-black' : 'text-white'
                }`}
              >
                {isLoading ? '---' : item.value}
              </Text>
            </View>

            {!isLoading && item.hasSub && item.subValue}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};