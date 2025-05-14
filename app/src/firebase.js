import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

let dbPromise = null;

const initializeFirebase = async () => {
  try {
    const response = await fetch('/firebaseConfig.json');
    const firebaseConfig = await response.json();

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    return db;
  } catch (error) {
    console.error('Error loading Firebase config:', error);
    throw error;
  }
};

export const getDb = () => {
  if (!dbPromise) {
    dbPromise = initializeFirebase();
  }
  return dbPromise;
};