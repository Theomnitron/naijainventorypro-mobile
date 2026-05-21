import { useContext } from 'react';
import { doc, runTransaction, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AuthContext } from '../context/AuthContext';
// 1. Fixed: Import our central custom alert hook from the context file
import { useNotifications } from '../context/NotificationContext';

interface VoidState {
  failures: number;
  isLocked: boolean;
  lockedUntil: number | null;
}

export const useAntiTamper = () => {
  const authContext = useContext(AuthContext);
  
  // 2. Fixed: Pull alert systems cleanly via the hook
  const { showToast, triggerPushNotification } = useNotifications();

  const verifyAppPin = async (enteredPin: string, correctPin: string): Promise<boolean> => {
    const user = authContext?.user;
    if (!user) {
      showToast('User not authenticated.', 'error');
      return false;
    }

    const userDocRef = doc(db, 'users', user.uid);

    try {
      const isPinCorrect = await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
          throw new Error("User document does not exist.");
        }

        const data = userDoc.data();
        const voidState: VoidState = data.voidState || { failures: 0, isLocked: false, lockedUntil: null };

        // 3. Fixed: Streamlined to use global showToast directly to avoid context structure type-clashes
        if (voidState.isLocked && voidState.lockedUntil && Date.now() < voidState.lockedUntil) {
            const remaining = Math.ceil((voidState.lockedUntil - Date.now()) / (60 * 1000));
            showToast(`Account locked. Try again in ${remaining} minutes.`, 'error');
            return false;
        }

        if (enteredPin === correctPin) {
          if (voidState.failures > 0 || voidState.isLocked) {
            transaction.update(userDocRef, {
              'voidState.failures': 0,
              'voidState.isLocked': false,
              'voidState.lockedUntil': null,
            });
          }
          return true;
        } else {
          const currentFailures = voidState.failures || 0;
          if (currentFailures + 1 >= 3) {
            const lockedUntil = Date.now() + 30 * 60 * 1000;
            transaction.update(userDocRef, {
              'voidState.failures': increment(1),
              'voidState.isLocked': true,
              'voidState.lockedUntil': lockedUntil,
            });

            showToast('Too many failed attempts. Your account is locked for 30 minutes.', 'warning');
            triggerPushNotification('Security Alert', 'Your account has been locked due to multiple failed login attempts.');
          } else {
            transaction.update(userDocRef, {
              'voidState.failures': increment(1),
            });
            showToast('Incorrect PIN.', 'error');
          }
          return false;
        }
      });
      return isPinCorrect ?? false;
    } catch (e) {
      console.error("Anti-tamper transaction failed: ", e);
      showToast('An error occurred during verification.', 'error');
      return false;
    }
  };

  return { verifyAppPin };
};