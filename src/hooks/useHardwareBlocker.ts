import { useEffect } from 'react';
import { BackHandler } from 'react-native';

export const useHardwareBlocker = (shouldBlock: boolean) => {
  useEffect(() => {
    const handleBackButton = () => {
      if (shouldBlock) return true;
      return false;
    };
  
    // Capture the event subscription object
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackButton);
  
    // Clean up by calling .remove() directly on the subscription instance
    return () => subscription.remove();
  }, [shouldBlock]);
}