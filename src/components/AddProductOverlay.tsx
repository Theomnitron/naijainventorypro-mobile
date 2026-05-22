import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useInventory } from '../context/InventoryContext';

export type Category = 'Phones' | 'Tablets' | 'Laptops' | 'Accessories' | 'Gadgets' | 'Other';

interface AddProductOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'Restock' | 'Edit' | 'New';
  initialData?: {
    productId: string;
    variantId: string;
    brand: string;
    model: string;
    category: Category;
    variantName: string;
    price: number;
    sku: string;
    currentStock?: number;
  };
}

export const AddProductOverlay: React.FC<AddProductOverlayProps> = ({
  isOpen,
  onClose,
  initialData,
  mode = 'New'
}) => {
  // Grab the context object safely
  const inventoryContext = useInventory() as any;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    category: 'Phones' as Category,
    variantName: '',
    price: '',
    stock: '',
    sku: '',
  });

  // Sync state data whenever initialData changes or overlay pops open
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        brand: initialData.brand,
        model: initialData.model,
        category: initialData.category,
        variantName: initialData.variantName,
        price: initialData.price.toString(),
        stock: initialData.currentStock?.toString() || '',
        sku: initialData.sku || '',
      });
    } else if (isOpen) {
      setFormData({
        brand: '',
        model: '',
        category: 'Phones',
        variantName: '',
        price: '',
        stock: '',
        sku: '',
      });
    }
    setError('');
  }, [isOpen, initialData]);

  const handleSubmit = async () => {
    setError('');
    const cleanPrice = Number(formData.price.replace(/[^0-9]/g, ''));
    const cleanStock = Number(formData.stock.replace(/[^0-9]/g, ''));

    if (!formData.brand || !formData.model || !cleanPrice) {
      setError('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'Edit' && initialData) {
        // Fallback execution mapping matching web name or context hooks
        const updateFn = inventoryContext.updateVariant || inventoryContext.updateProduct || inventoryContext.update;
        if (updateFn) {
          await updateFn(initialData.productId, initialData.variantId, {
            brand: formData.brand,
            model: formData.model,
            category: formData.category,
            variantName: formData.variantName,
            price: cleanPrice,
            sku: formData.sku,
          });
        } else {
          throw new Error('Update function not found in InventoryContext');
        }
      } else if (mode === 'Restock' && initialData) {
        const restockFn = inventoryContext.restockVariant || inventoryContext.restockProduct || inventoryContext.restock;
        if (restockFn) {
          await restockFn(initialData.productId, initialData.variantId, cleanStock);
        } else {
          throw new Error('Restock function not found in InventoryContext');
        }
      } else {
        const addFn = inventoryContext.addProduct || inventoryContext.add || inventoryContext.addNewProduct;
        if (addFn) {
          await addFn({
            brand: formData.brand,
            model: formData.model,
            category: formData.category,
            variantName: formData.variantName,
            price: cleanPrice,
            stock: cleanStock,
            sku: formData.sku,
          });
        } else {
          throw new Error('Add function not found in InventoryContext');
        }
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = mode === 'Restock';

  return (
    <Modal visible={isOpen} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black"
      >
        <View className="pt-12 px-6 flex-row justify-between items-center border-b border-zinc-900 pb-4">
          <View>
            <Text className="text-xs font-black uppercase text-zinc-500 tracking-wider">
              {mode === 'Edit' ? 'Modify Item' : mode === 'Restock' ? 'Inventory Intake' : 'New Stock'}
            </Text>
            <Text className="text-white text-xl font-black mt-0.5">
              {mode === 'Edit' ? 'Edit Variant' : mode === 'Restock' ? 'Restock Item' : 'Add Product'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-900 rounded-full">
            <Text className="text-zinc-400 font-bold text-base">✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-4">
          {error ? (
            <View className="mb-4 p-3 bg-red-950/40 border border-red-500/20 rounded-xl">
              <Text className="text-red-500 text-xs font-bold text-center">{error}</Text>
            </View>
          ) : null}

          <View className="space-y-4">
            <View className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 mb-4">
              <Text className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Brand Name *</Text>
              <TextInput
                editable={!isReadOnly}
                value={formData.brand}
                onChangeText={(text) => setFormData({ ...formData, brand: text })}
                placeholder="e.g. Apple, Samsung"
                placeholderTextColor="#4b5563"
                className={`text-white text-base font-bold ${isReadOnly ? 'opacity-40' : ''}`}
              />
            </View>

            <View className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 mb-4">
              <Text className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Model Description *</Text>
              <TextInput
                editable={!isReadOnly}
                value={formData.model}
                onChangeText={(text) => setFormData({ ...formData, model: text })}
                placeholder="e.g. iPhone 15 Pro Max"
                placeholderTextColor="#4b5563"
                className={`text-white text-base font-bold ${isReadOnly ? 'opacity-40' : ''}`}
              />
            </View>

            <View className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 mb-4">
              <Text className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Variant Spec Label</Text>
              <TextInput
                editable={!isReadOnly}
                value={formData.variantName}
                onChangeText={(text) => setFormData({ ...formData, variantName: text })}
                placeholder="e.g. 256GB / Black Titanium"
                placeholderTextColor="#4b5563"
                className={`text-white text-base font-bold ${isReadOnly ? 'opacity-40' : ''}`}
              />
            </View>

            <View className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 mb-4">
              <Text className="text-[10px] font-bold text-zinc-500 uppercase mb-1">SKU / Barcode</Text>
              <TextInput
                editable={!isReadOnly}
                value={formData.sku}
                onChangeText={(text) => setFormData({ ...formData, sku: text })}
                placeholder="Scan or enter identifier code"
                placeholderTextColor="#4b5563"
                className={`text-white text-base font-bold ${isReadOnly ? 'opacity-40' : ''}`}
              />
            </View>

            <View className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 mb-4">
              <Text className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Retail Price (₦) *</Text>
              <TextInput
                editable={!isReadOnly}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#4b5563"
                className={`text-white text-base font-bold ${isReadOnly ? 'opacity-40' : ''}`}
              />
            </View>

            <View className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 mb-8">
              <Text className="text-[10px] font-bold text-zinc-500 uppercase mb-1">
                {mode === 'Restock' ? 'Units to Add *' : 'Initial Inventory Count *'}
              </Text>
              <TextInput
                value={formData.stock}
                onChangeText={(text) => setFormData({ ...formData, stock: text })}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#4b5563"
                className="text-white text-base font-bold"
              />
            </View>
          </View>
        </ScrollView>

        <View className="p-6 border-t border-zinc-900 bg-black">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-16 bg-white rounded-2xl flex-row items-center justify-center active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black font-black uppercase tracking-widest text-sm">
                {mode === 'Edit' ? 'SAVE CHANGES' : mode === 'Restock' ? 'INCREASE STOCK' : 'ADD TO INVENTORY'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};