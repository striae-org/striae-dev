import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '~/services/firebase';
import { getUserApiKey } from '~/utils/auth';
import paths from '~/config/config.json';

const USER_WORKER_URL = paths.user_worker_url;

/**
 * Hook that monitors auth state changes and syncs email updates to KV store
 */
export const useEmailSyncToKV = () => {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        try {
          // Get current user data from KV store
          const apiKey = await getUserApiKey();
          const response = await fetch(`${USER_WORKER_URL}/${user.uid}`, {
            method: 'GET',
            headers: {
              'X-Custom-Auth-Key': apiKey
            }
          });

          if (response.ok) {
            const userData = await response.json() as { email: string; [key: string]: unknown };
            
            // Check if email in KV store is different from Firebase Auth
            if (userData.email !== user.email) {
              console.log('Email mismatch detected, updating KV store...');
              
              // Update KV store with new email
              const updateResponse = await fetch(`${USER_WORKER_URL}/${user.uid}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Custom-Auth-Key': apiKey
                },
                body: JSON.stringify({
                  email: user.email,
                  updatedAt: new Date().toISOString()
                })
              });

              if (updateResponse.ok) {
                console.log('KV store email updated successfully');
              } else {
                console.error('Failed to update email in KV store');
              }
            }
          }
        } catch (error) {
          console.error('Error syncing email to KV store:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);
};
