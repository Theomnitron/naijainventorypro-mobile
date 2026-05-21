
import React, { createContext, useState, useEffect, useContext } from 'react';
import { db, auth } from '../services/firebase'; // Assuming firebase is initialized
import { collection, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { SecureStorageService } from '../services/secureStorage';

// Dummy decryption function - replace with your actual implementation
const decryptData = (data: any, key: string): any => {
  // In a real app, you would use a library like crypto-js for AES decryption
  // For this example, we'll just return the data as is.
  console.log(`Decrypting with key: ${key}`); // Use the key
  return data;
};

interface Variant {
  id: string;
  name: string;
  stock: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  variants: Variant[];
}

interface InventoryContextType {
  products: Product[];
  loading: boolean;
  sellVariant: (productId: string, variantId: string, quantity: number) => Promise<void>;
  restockVariant: (productId: string, variantId: string, quantity: number) => Promise<void>;
  voidTransaction: (transactionId: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user } = useAuth();
  const isConnected = useNetworkStatus();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterKey, setMasterKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchKey = async () => {
      const key = await SecureStorageService.getMasterKey();
      setMasterKey(key);
    };
    fetchKey();
  }, []);

  useEffect(() => {
    if (user && masterKey && isConnected) {
      const productsColRef = collection(db, 'users', user.uid, 'products');
      const unsubscribe = onSnapshot(productsColRef, (snapshot) => {
        const fetchedProducts: Product[] = snapshot.docs.map((doc) => {
          const productData = doc.data();
          let variants: Variant[] = [];

          if (productData.variants) {
            try {
              const decryptedVariants = decryptData(productData.variants, masterKey);
              variants = decryptedVariants.map((v: any) => ({
                id: v.id,
                name: v.name,
                stock: Number(v.stock) || 0, // Safe fallback
                price: Number(v.price) || 0, // Safe fallback
              }));
            } catch (error) {
              console.error("Failed to decrypt variants, using safe fallbacks:", error);
              // Fallback to empty array or variants with 0 values
              variants = productData.variants.map((v: any) => ({
                id: v.id,
                name: v.name,
                stock: 0,
                price: 0,
              }));
            }
          }

          return {
            id: doc.id,
            name: productData.name,
            variants,
          };
        });
        setProducts(fetchedProducts);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, masterKey, isConnected]);

  const sellVariant = async (productId: string, variantId: string, quantity: number) => {
    if (!isConnected) {
      throw new Error("Device is offline. Please connect to a network.");
    }
    // Implementation using a batch write to ensure atomicity
  };

  const restockVariant = async (productId: string, variantId: string, quantity: number) => {
    if (!isConnected) {
      throw new Error("Device is offline. Please connect to a network.");
    }
    // Implementation
  };

  const voidTransaction = async (transactionId: string) => {
    if (!isConnected) {
      throw new Error("Device is offline. Please connect to a network.");
    }
    // Implementation
  };

  return (
    <InventoryContext.Provider value={{ products, loading, sellVariant, restockVariant, voidTransaction }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
