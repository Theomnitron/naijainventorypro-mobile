import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';

interface SellConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (finalPrice: number) => Promise<void>;
  productName: string;
  variantName: string;
  expectedPrice: number;
}

export const SellConfirmationModal: React.FC<SellConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  variantName,
  expectedPrice
}) => {
  const [finalPrice, setFinalPrice] = useState(expectedPrice.toString());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Synchronize internal input values when the selected inventory card state mutations trigger changes
  useEffect(() => {
    if (isOpen) {
      setFormDataFromPrice(expectedPrice);
      setError('');
    }
  }, [isOpen, expectedPrice]);

  const setFormDataFromPrice = (val: number) => {
    setFinalPrice(val.toString());
  };

  const handleSubmit = async () => {
    setError('');
    const rawPrice = finalPrice.replace(/[^0-9]/g, '');
    const price = Number(rawPrice);

    if (!rawPrice || price < 100) {
      setError('Price required (Min ₦100)');
      return;
    }

    setIsProcessing(true);
    try {
      await onConfirm(price);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to complete transaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parsedPrice = Number(finalPrice.replace(/[^0-9]/g, '')) || 0;
  const isDiscounted = parsedPrice > 0 && parsedPrice < expectedPrice;
  const isSurplus = parsedPrice > expectedPrice;

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 justify-end bg-black/70">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="bg-zinc-950 border-t border-zinc-900 rounded-t-3xl p-6 pb-8"
          >
            {/* Header Action Sheet Tracker */}
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Checkout Verification
                </Text>
                <Text className="text-white text-xl font-black mt-0.5 tracking-tight">
                  Confirm Sale
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-900 rounded-full">
                <Text className="text-zinc-400 font-bold text-sm">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Core Variant Specifications Card */}
            <View className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-4">
              <Text className="text-white text-base font-black tracking-tight">{productName}</Text>
              <Text className="text-zinc-400 text-xs font-bold uppercase mt-0.5 tracking-wider">{variantName}</Text>
              <View className="mt-3 pt-3 border-t border-zinc-800/60 flex-row justify-between items-center">
                <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Baseline Price</Text>
                <Text className="text-zinc-300 font-mono text-sm font-bold">
                  ₦{expectedPrice.toLocaleString('en-NG')}
                </Text>
              </View>
            </View>

            {/* Interactive Currency Input Area */}
            <View className="space-y-3 mb-6">
              <View className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-1">
                  Final Agreed Transaction Price (₦) *
                </Text>
                <TextInput
                  value={finalPrice}
                  onChangeText={setFinalPrice}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#3f3f46"
                  className="text-white text-2xl font-black p-0 font-mono tracking-tight"
                />
              </View>

              {/* Real-time Dynamic Price Differential Badges */}
              {isDiscounted && (
                <View className="bg-amber-950/30 border border-amber-500/20 p-3 rounded-xl">
                  <Text className="text-center text-xs font-black text-amber-500 uppercase tracking-wide">
                    ⚠️ Marked down Discount: -₦{(expectedPrice - parsedPrice).toLocaleString('en-NG')}
                  </Text>
                </View>
              )}

              {isSurplus && (
                <View className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl">
                  <Text className="text-center text-xs font-black text-emerald-400 uppercase tracking-wide">
                    📈 Marked up Surplus: +₦{(parsedPrice - expectedPrice).toLocaleString('en-NG')}
                  </Text>
                </View>
              )}

              {error ? (
                <View className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl">
                  <Text className="text-red-500 text-xs font-bold text-center uppercase tracking-tight">{error}</Text>
                </View>
              ) : null}
            </View>

            {/* Core Confirmation Submit Trigger */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isProcessing}
              className="w-full h-16 bg-white rounded-2xl flex-row items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-black font-black uppercase tracking-widest text-sm">
                  COMPLETE SALE TRANSACTION
                </Text>
              )}
            </TouchableOpacity>

            <Text className="mt-4 text-center text-[9px] font-bold uppercase text-zinc-600 tracking-widest leading-relaxed px-4">
              Deducting 1 unit from system stock registry and committing record to ledger.
            </Text>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};