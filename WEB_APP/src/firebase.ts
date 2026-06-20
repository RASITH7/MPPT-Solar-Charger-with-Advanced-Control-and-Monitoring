import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp({
  ...firebaseConfig,
  databaseURL: "https://mppt-charger-default-rtdb.asia-southeast1.firebasedatabase.app/"
});
export const db = getDatabase(app);
