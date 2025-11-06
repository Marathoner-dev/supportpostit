// Firebase 설정 파일
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 환경 변수에서 Firebase 설정 가져오기
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Firebase 초기화
let app;
let db;
let auth;
let googleProvider;

try {
  // 설정 값 확인
  const hasValidConfig = Object.values(firebaseConfig).every(
    value => value && !value.includes('your_') && !value.includes('REPLACE')
  );

  if (!hasValidConfig) {
    db = null;
    app = null;
    auth = null;
  } else {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // 인증 프로바이더 설정
    googleProvider = new GoogleAuthProvider();
  }
} catch (error) {
  db = null;
  app = null;
  auth = null;
}

export { db, auth, googleProvider };
export default app;

