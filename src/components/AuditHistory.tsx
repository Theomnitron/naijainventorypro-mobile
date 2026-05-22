import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useInventory } from '../context/InventoryContext';
import { ReceiptView } from './ReceiptView';

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

export const AuditHistory: React.FC = () => {
  const { auditLog, voidTransaction } = useInventory() as any; // Cast safely for log parsing boundaries
  
  // Local Filtering and Modal UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [showReceipt, setShowReceipt] = useState<AuditEntry | null>(null);
  
  // Pin Keypad Protection Overlay States
  const [pinEntry, setPinEntry] = useState('');
  const [pinError, setPinError] = useState('');
  const [isProcessingVoid, setIsProcessingVoid] = useState(false);

  // Live structural data filtering mapping across the historical records
  const filteredLog = useMemo(() => {
    if (!auditLog) return [];
    return auditLog.filter((entry: AuditEntry) => {
      const matchQuery = 
        entry.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.variantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.type?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchQuery;
    });
  }, [auditLog, searchQuery]);

  // Handle Pin Terminal Input actions
  const handleKeypadPress = (num: string) => {
    setPinError('');
    if (pinEntry.length < 4) {
      setPinEntry(prev => prev + num);
    }
  };

  const handleDeletePin = () => {
    setPinEntry(prev => prev.slice(0, -1));
  };

  const handleExecuteVoid = async () => {
    if (pinEntry !== '1234') { // Replace with your profile's security pin context call matching your auth profile
      setPinError('INVALID SECURITY PIN');
      setPinEntry('');
      return;
    }

    if (!selectedEntry) return;
    
    setIsProcessingVoid(true);
    try {
      await voidTransaction(selectedEntry.id);
      setSelectedEntry(null);
      setPinEntry('');
    } catch (err) {
      setPinError('REVERSAL TRANSACTION FAILED');
    } finally {
      setIsProcessingVoid(false);
    }
  };

  const formatNaira = (num: number) => {
    return '₦' + num.toLocaleString('en-NG');
  };

  const renderAuditItem = ({ item }: { item: AuditEntry }) => {
    const isSale = item.type === 'Sale';
    const date = new Date(item.timestamp).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 mb-3 flex-row justify-between items-center">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center space-x-2">
            <Text className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
              item.isVoided ? 'bg-zinc-900 text-zinc-500 line-through' :
              item.type === 'Sale' ? 'bg-emerald-950 text-emerald-400' : 'bg-blue-950 text-blue-400'
            }`}>
              {item.type} {item.isVoided ? '(VOIDED)' : ''}
            </Text>
            <Text className="text-zinc-500 text-[11px] font-medium">{date}</Text>
          </View>
          
          <Text className={`text-white text-base font-black mt-2 tracking-tight ${item.isVoided ? 'line-through opacity-40' : ''}`}>
            {item.productName}
          </Text>
          <Text className="text-zinc-400 text-xs font-medium mt-0.5">{item.variantName}</Text>
        </View>

        <View className="items-end justify-between h-full py-1">
          {item.price ? (
            <Text className={`text-sm font-bold font-mono ${item.isVoided ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>
              {formatNaira(item.price)}
            </Text>
          ) : null}

          <View className="flex-row space-x-2 mt-3">
            <TouchableOpacity 
              onPress={() => setShowReceipt(item)}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <Text className="text-zinc-400 font-bold text-[10px] uppercase tracking-wide">Receipt</Text>
            </TouchableOpacity>

            {isSale && !item.isVoided && (
              <TouchableOpacity 
                onPress={() => { setSelectedEntry(item); setPinEntry(''); setPinError(''); }}
                className="px-3 py-1.5 bg-red-950/40 border border-red-900/30 rounded-lg"
              >
                <Text className="text-red-400 font-bold text-[10px] uppercase tracking-wide">Void</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black px-4 pt-4">
      {/* Search Header Form Filter */}
      <View className="bg-zinc-950 border border-zinc-900 h-14 rounded-xl px-4 flex-row items-center mb-4">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search historical audit logs..."
          placeholderTextColor="#52525b"
          className="w-full text-white font-medium text-sm p-0"
        />
      </View>

      {/* Native Performance List Render */}
      <FlatList
        data={filteredLog}
        keyExtractor={(item) => item.id}
        renderItem={renderAuditItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="py-20 items-center justify-center">
            <Text className="text-zinc-600 font-bold text-xs uppercase tracking-widest">No transaction logs captured</Text>
          </View>
        }
      />

      {/* MODAL 1: PIN Pad Security Layer */}
      <Modal visible={!!selectedEntry} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-zinc-950 border-t border-zinc-900 rounded-t-3xl p-6 pb-8">
            <Text className="text-center text-xs font-black text-red-500 uppercase tracking-widest">Security Authorization</Text>
            <Text className="text-center text-white text-lg font-black mt-1">Enter Transaction Pin to Reverse</Text>
            
            {/* Visual Dot Indication Display */}
            <View className="flex-row justify-center space-x-4 my-6">
              {[1, 2, 3, 4].map((pos) => (
                <View 
                  key={pos} 
                  className={`w-4 h-4 rounded-full border-2 border-zinc-800 ${pinEntry.length >= pos ? 'bg-white border-white' : 'bg-transparent'}`}
                />
              ))}
            </View>

            {pinError ? <Text className="text-center text-xs font-bold text-red-500 uppercase tracking-tight mb-4">{pinError}</Text> : null}

            {/* Custom Terminal Keypad Numeric Rows */}
            <View className="space-y-2 mb-6">
              {[['1','2','3'], ['4','5','6'], ['7','8','9']].map((row, i) => (
                <View key={i} className="flex-row justify-center space-x-2">
                  {row.map((num) => (
                    <TouchableOpacity 
                      key={num} 
                      onPress={() => handleKeypadPress(num)} 
                      className="w-20 h-14 bg-zinc-900 items-center justify-center rounded-xl border border-zinc-800/60"
                    >
                      <Text className="text-white text-xl font-black">{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View className="flex-row justify-center space-x-2 mt-2">
                <TouchableOpacity onPress={handleDeletePin} className="w-20 h-14 bg-zinc-900/40 items-center justify-center rounded-xl">
                  <Text className="text-red-500 font-bold text-xs uppercase">Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleKeypadPress('0')} className="w-20 h-14 bg-zinc-900 items-center justify-center rounded-xl border border-zinc-800/60">
                  <Text className="text-white text-xl font-black">0</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  disabled={pinEntry.length !== 4 || isProcessingVoid}
                  onPress={handleExecuteVoid} 
                  className="w-20 h-14 bg-white items-center justify-center rounded-xl disabled:opacity-40"
                >
                  {isProcessingVoid ? <ActivityIndicator color="#000" /> : <Text className="text-black font-black text-xs uppercase">Enter</Text>}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => setSelectedEntry(null)} className="w-full py-2">
              <Text className="text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">Cancel Reversal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Receipt View Overlay Sheet */}
      <Modal visible={!!showReceipt} animationType="slide" transparent={false} onRequestClose={() => setShowReceipt(null)}>
        <View className="flex-1 bg-black pt-12 px-4">
          <View className="flex-row justify-between items-center mb-6 px-2">
            <Text className="text-white text-xl font-black uppercase tracking-tighter">Transaction Voucher</Text>
            <TouchableOpacity onPress={() => setShowReceipt(null)} className="p-2 bg-zinc-900 rounded-full">
              <Text className="text-zinc-400 font-bold text-sm">✕</Text>
            </TouchableOpacity>
          </View>
          
          {showReceipt && (
            <ReceiptView 
              entry={showReceipt} 
              profile={{ businessName: "Naija Retail Store", businessAddress: "Abuja Wharf Terminal Hub" }} // Fallback mock strings linked into profile parameters
            />
          )}
        </View>
      </Modal>
    </View>
  );
};