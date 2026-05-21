import * as SecureStore from 'expo-secure-store';

const MASTER_KEY_STORAGE_NAME = 'naija_inventory_pro_master_key';

export const SecureStorageService = {
  /**
   * Caches the Master Key securely in the device's hardware enclave
   */
  saveMasterKey: async (key: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(MASTER_KEY_STORAGE_NAME, key, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.error('Failed to commit key to Secure Store:', error);
      throw new Error('Hardware storage injection failure');
    }
  },

  /**
   * Retrieves the Master Key from the hardware enclave
   */
  getMasterKey: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(MASTER_KEY_STORAGE_NAME);
    } catch (error) {
      console.error('Failed to retrieve key from Secure Store:', error);
      return null;
    }
  },

  /**
   * Clears the key out of memory immediately during lockouts
   */
  clearMasterKey: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(MASTER_KEY_STORAGE_NAME);
    } catch (error) {
      console.error('Failed to purge key from hardware:', error);
    }
  },
};