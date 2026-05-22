import React from 'react';
import { Text, View } from 'react-native';


interface MetricCardProps {
  title: string;
  value: string;
  style?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, style }) => (
  <View className={`p-4 bg-gray-800 rounded-lg flex-1 items-center justify-center ${style}`}>
    <Text className="text-gray-400 text-sm capitalize">{title}</Text>
    <Text className="text-white text-2xl font-bold">{value}</Text>
  </View>
);

interface DashboardMetricsProps {
  totalSales: number;
  revenue: number;
  transactions: number;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ totalSales, revenue, transactions }) => {
  return (
    <View className="flex-col md:flex-row gap-4 mb-6">
      <View className="flex-1 flex-row gap-4">
        <MetricCard title="Total Sales" value={`₦${totalSales.toLocaleString()}`} />
        <MetricCard title="Revenue" value={`₦${revenue.toLocaleString()}`} style="bg-blue-900" />
      </View>
      <MetricCard title="Transactions" value={String(transactions)} style="bg-green-900" />
    </View>
  );
};

export default DashboardMetrics;
