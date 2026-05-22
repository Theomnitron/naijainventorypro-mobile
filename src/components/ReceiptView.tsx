import React from 'react';
import { View, Text, ScrollView } from 'react-native';

const BRAND_NAME = "Naija Inventory";

export interface AuditEntry {
  id: string;
  type: 'Sale' | 'Restock' | 'Edit' | 'New';
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  price?: number;
  quantity?: number;
  timestamp: number;
  isVoided?: boolean;
  voidedAt?: number;
}

export interface UserProfile {
  businessName: string;
  businessAddress?: string;
  city?: string;
  state?: string;
}

interface ReceiptViewProps {
  entry: AuditEntry;
  profile: UserProfile;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({ entry, profile }) => {
  const STORE_NAME = profile.businessName;
  const STORE_ADDRESS = profile.businessAddress || `${profile.city || ''}, ${profile.state || ''}`.trim() || 'No Address Provided';

  const isCanceled = entry.isVoided;
  const status = isCanceled ? 'CANCELED' : 'SUCCESS';

  const date = new Date(entry.timestamp);
  const formattedDate = date.toLocaleDateString('en-NG');
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatNairaMobile = (num: number) => {
    return '₦' + num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <ScrollView className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md max-w-sm mx-auto">
      {/* Header Info Layout */}
      <View className="items-center border-b border-zinc-800 border-dashed pb-4 mb-4">
        <Text className="text-white text-base font-black uppercase tracking-tight text-center">
          {STORE_NAME}
        </Text>
        <Text className="text-zinc-500 text-[10px] font-bold text-center mt-1 uppercase max-w-[200px]">
          {STORE_ADDRESS}
        </Text>
      </View>

      {/* Meta Transaction Info */}
      <View className="space-y-2 border-b border-zinc-800 border-dashed pb-4 mb-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</Text>
          <View className={`px-2 py-0.5 rounded-md ${isCanceled ? 'bg-red-950/50' : 'bg-emerald-950/50'}`}>
            <Text className={`text-[9px] font-black uppercase tracking-widest ${isCanceled ? 'text-red-400' : 'text-emerald-400'}`}>
              {status}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Receipt No</Text>
          <Text className="text-zinc-300 font-mono text-[10px] uppercase">
            {entry.id.substring(0, 8)}...
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date & Time</Text>
          <Text className="text-zinc-300 font-medium text-[10px]">
            {formattedDate} • {formattedTime}
          </Text>
        </View>

        {isCanceled && entry.voidedAt && (
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Canceled Date</Text>
            <Text className="text-red-400 font-medium text-[10px]">
              {new Date(entry.voidedAt).toLocaleDateString('en-NG')}
            </Text>
          </View>
        )}
      </View>

      {/* Item Breakdown details */}
      <View className="border-b border-zinc-800 border-dashed pb-4 mb-6">
        <Text className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
          Transaction Item
        </Text>
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <Text className={`text-white text-sm font-black tracking-tight ${isCanceled ? 'line-through opacity-50' : ''}`}>
              {entry.productName}
            </Text>
            <Text className="text-zinc-500 text-[11px] font-medium mt-0.5">
              {entry.variantName}
            </Text>
          </View>
          <Text className="text-zinc-400 text-xs font-bold text-right font-mono">
            ×{entry.quantity || 1}
          </Text>
        </View>
      </View>

      {/* Full Total Summary Area */}
      <View className="items-center pt-2 mb-6">
        <Text
          className={`text-3xl font-black tracking-tighter ${
            isCanceled ? 'text-zinc-600 line-through' : 'text-white'
          }`}
        >
          {formatNairaMobile(entry.price || 0)}
        </Text>
      </View>

      {/* Footer Branding Token */}
      <View className="items-center">
        <Text className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-600">
          Powered by {BRAND_NAME}
        </Text>
      </View>
    </ScrollView>
  );
};