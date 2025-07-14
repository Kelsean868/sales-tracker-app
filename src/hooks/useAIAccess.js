import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useAIAccess = (userId) => {
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'aiAccess', userId),
      (doc) => {
        if (doc.exists()) {
          setAiEnabled(doc.data().aiEnabled === true);
        } else {
          setAiEnabled(false);
        }
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching AI access:', error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { aiEnabled, loading, error };
};
