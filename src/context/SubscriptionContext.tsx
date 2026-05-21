import React, { createContext, useContext } from 'react';
// 1. Fixed: Import both AuthContext AND the useAuth custom hook
import { AuthContext, useAuth } from './AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import Paystack from 'react-native-paystack-webview';

interface SubscriptionContextType {
    // Context can be expanded with more subscription-related state
}

// 2. Fixed: We cast to a safe component to bypass the internal package JSX bug
const PaystackComponent = Paystack as any;

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface PaystackPaymentGatewayProps {
  billingAmount: number;
}

export const PaystackPaymentGateway: React.FC<PaystackPaymentGatewayProps> = ({ billingAmount }) => {
  const authContext = useAuth();

  const { user, isExpired } = authContext || { user: null, isExpired: false };

  const handlePaymentSuccess = async (transactionRef: string) => {
    if (user) {
      console.log(`Successful transaction: ${transactionRef}`);
      const userDocRef = doc(db, 'users', user.uid);
      
      const newExpirationDate = new Date();
      newExpirationDate.setDate(newExpirationDate.getDate() + 30);

      try {
        await updateDoc(userDocRef, {
          subscriptionExpirationDate: Math.floor(newExpirationDate.getTime() / 1000),
          isExpired: false,
        });
      } catch (error) {
        console.error("Failed to update user's subscription:", error);
      }
    }
  };

  if (!isExpired || !user) {
    return null;
  }

  return (
    /* 3. Fixed: Swapped <Paystack> to <PaystackComponent> so TS compiles clean */
    <PaystackComponent
      xmlns="http://www.w3.org/1999/xhtml"
      paystackKey="YOUR_PUBLIC_KEY"
      billingEmail={user.email || ''}
      amount={billingAmount}
      onSuccess={(res: { transactionRef: { reference: string }}) => {
        if (res && res.transactionRef && res.transactionRef.reference) {
          handlePaymentSuccess(res.transactionRef.reference);
        }
      }}
      onCancel={() => {
        console.log('Payment was cancelled.');
      }}
      autoStart={true}
    />
  );
};

export const SubscriptionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <SubscriptionContext.Provider value={{}}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};