import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBDDtkaAx2U4deT31pW6STAVhWkUtO6Ps0",
    authDomain: "rudra-online-store.firebaseapp.com",
    projectId: "rudra-online-store",
    storageBucket: "rudra-online-store.firebasestorage.app",
    messagingSenderId: "451625063679",
    appId: "1:451625063679:web:4d8686a9ad57b31daa68ca",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;