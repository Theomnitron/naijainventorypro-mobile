
import React, { createContext, useState, useEffect, useContext } from 'react';
import { db, auth } from '../services/firebase'; // Assuming firebase is initialized
import { collection, onSnapshot, writeBatch, doc, addDoc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { SecureStorageService } from '../services/secureStorage';

// Dummy decryption function - replace with your actual implementation
const decryptData = (data: any, key: string): any => {
  console.log(`Decrypting with key: ${key}`); // Use the key
  return data;
};

// Dummy encryption function - replace with your actual implementation
const encryptData = (data: any, key: string): any => {
    console.log(`Encrypting with key: ${key}`);
    return data;
}

interface Variant {
  id: string;
  name: string;
  stock: number;
  price: number;
  sku?: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  variants: Variant[];
}

interface NewProductData {
    brand: string;
    model: string;
    category: string;
    variantName: string;
    price: number;
    stock: number;
    sku: string;
}

interface UpdateVariantData {
    brand: string;
    model: string;
    category: string;
    variantName: string;
    price: number;
    sku: string;
}

interface InventoryContextType {
  products: Product[];
  loading: boolean;
  addProduct: (product: NewProductData) => Promise<void>;
  updateVariant: (productId: string, variantId: string, updates: UpdateVariantData) => Promise<void>;
  sellVariant: (productId: string, variantId: string, finalPrice: number) => Promise<void>;
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
                stock: Number(v.stock) || 0,
                price: Number(v.price) || 0,
                sku: v.sku || '',
              }));
            } catch (error) {
              console.error("Failed to decrypt variants, using safe fallbacks:", error);
              variants = productData.variants.map((v: any) => ({ id: v.id, name: v.name, stock: 0, price: 0, sku: '' }));
            }
          }

          return {
            id: doc.id,
            name: productData.name,
            brand: productData.brand,
            model: productData.model,
            category: productData.category,
            variants,
          };
        });
        setProducts(fetchedProducts);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, masterKey, isConnected]);

  const addProduct = async (data: NewProductData) => {
      if (!user || !masterKey) throw new Error("User not authenticated or key is missing.");
      const { brand, model, category, variantName, price, stock, sku } = data;
      
      const productsColRef = collection(db, 'users', user.uid, 'products');

      const newVariant = {
          id: doc(collection(db, 'temp')).id, // Temporary unique ID
          name: variantName,
          price,
          stock,
          sku
      };

      const encryptedVariants = encryptData([newVariant], masterKey);

      await addDoc(productsColRef, {
        brand,
        model,
        category,
        name: `${brand} ${model}`,
        variants: encryptedVariants,
      });
  };

  const updateVariant = async (productId: string, variantId: string, data: UpdateVariantData) => {
      if (!user || !masterKey) throw new Error("User not authenticated or key is missing.");

      const productRef = doc(db, 'users', user.uid, 'products', productId);
      const productSnap = await getDoc(productRef);

      if(productSnap.exists()){
          const productData = productSnap.data();
          let variants = decryptData(productData.variants, masterKey);
          
          const variantIndex = variants.findIndex((v: Variant) => v.id === variantId);
          if (variantIndex === -1) throw new Error("Variant not found");

          // Update variant details
          variants[variantIndex] = { ...variants[variantIndex], name: data.variantName, price: data.price, sku: data.sku };

          const encryptedVariants = encryptData(variants, masterKey);

          await updateDoc(productRef, {
              brand: data.brand,
              model: data.model,
              category: data.category,
              name: `${data.brand} ${data.model}`,
              variants: encryptedVariants,
          });
      } else {
          throw new Error("Product not found");
      }
  };

  const sellVariant = async (productId: string, variantId: string, quantity: number) => {
    if (!isConnected) throw new Error("Device is offline. Please connect to a network.");
    // Implementation
  };

  const restockVariant = async (productId: string, variantId: string, quantity: number) => {
    if (!isConnected) throw new Error("Device is offline. Please connect to a network.");
    
    if (!user || !masterKey) throw new Error("User not authenticated or key is missing.");

      const productRef = doc(db, 'users', user.uid, 'products', productId);
      const productSnap = await getDoc(productRef);

      if(productSnap.exists()){
          const productData = productSnap.data();
          let variants = decryptData(productData.variants, masterKey);
          
          const variantIndex = variants.findIndex((v: Variant) => v.id === variantId);
          if (variantIndex === -1) throw new Error("Variant not found");

          variants[variantIndex].stock += quantity;

          const encryptedVariants = encryptData(variants, masterKey);

          await updateDoc(productRef, {
              variants: encryptedVariants,
          });
      } else {
          throw new Error("Product not found");
      }
  };

  const voidTransaction = async (transactionId: string) => {
    if (!isConnected) throw new Error("Device is offline. Please connect to a network.");
    // Implementation
  };

  return (
    <InventoryContext.Provider value={{ products, loading, addProduct, updateVariant, sellVariant, restockVariant, voidTransaction }}>
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
