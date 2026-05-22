import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';


// Assuming Variant and Product interfaces based on the context
export interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number; // Changed from quantity to stock
}

export interface Product {
  id:string;
  name: string;
  variants: Variant[];
}

interface InventoryItemProps {
  product: Product;
  onPress?: () => void;
}

const InventoryItem: React.FC<InventoryItemProps> = ({ product, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} className="mb-4 bg-gray-800 rounded-lg p-4">
      <View className="flex-row justify-between items-center">
        <Text className="text-white text-lg font-bold">{product.name}</Text>
      </View>
      {product.variants.map(variant => {
        const isLowStock = variant.stock < 5; // Changed from quantity to stock
        const lowStockContainerClass = isLowStock ? 'border border-amber-400' : 'border border-transparent';

        return (
          <View key={variant.id} className={`mt-3 p-3 bg-gray-700 rounded-lg ${lowStockContainerClass}`}>
            <View className="flex-row justify-between">
              <Text className="text-white capitalize">{variant.name}</Text>
              <Text className="text-white font-semibold">₦{variant.price.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-gray-400">Qty: {variant.stock}</Text> 
              {isLowStock && (
                <View className="bg-amber-400 rounded-full px-2 py-0.5">
                  <Text className="text-black text-xs font-bold">Low Stock</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </TouchableOpacity>
  );
};

export default InventoryItem;
