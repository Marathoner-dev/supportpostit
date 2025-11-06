import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../config/firebase";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from "firebase/firestore";

const Home = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [existingBoardId, setExistingBoardId] = useState(null);
  const navigate = useNavigate();

  // 사용자의 기존 보드 확인
  useEffect(() => {
    const checkExistingBoard = async () => {
      if (!isAuthenticated || !user || !db) return;

      setIsChecking(true);
      try {
        const boardsRef = collection(db, "boards");
        const q = query(
          boardsRef,
          where("ownerId", "==", user.uid),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const boardDoc = querySnapshot.docs[0];
          setExistingBoardId(boardDoc.id);
        } else {
          setExistingBoardId(null);
        }
      } catch (error) {
        setExistingBoardId(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkExistingBoard();
  }, [isAuthenticated, user]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    
    // 로그인 확인
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    // 기존 보드가 있으면 해당 보드로 이동
    if (existingBoardId) {
      navigate(`/board/${existingBoardId}`);
      return;
    }

    // Firebase 연결 확인
    if (!db) {
      const errorMsg = `❌ Firebase가 연결되지 않았습니다.

확인 사항:
1. .env 파일이 프로젝트 루트에 있는지 확인
2. .env 파일의 모든 값이 실제 Firebase 설정 값으로 입력되었는지 확인
3. 개발 서버를 재시작했는지 확인 (npm start)`;
      alert(errorMsg);
      return;
    }

    setIsCreating(true);
    let boardId = null;
    
    try {
      boardId = uuidv4().slice(0, 8);
      const boardRef = doc(db, "boards", boardId);
      
      const defaultDday = new Date();
      defaultDday.setMonth(10); // 11월
      defaultDday.setDate(13); // 13일 (수능일)

      const boardData = {
        owner: user.displayName || user.email?.split('@')[0] || "익명",
        ownerId: user.uid, // 사용자 ID 저장 (주인 확인용)
        ownerEmail: user.email || null,
        ownerPhotoURL: user.photoURL || null,
        ddayTarget: defaultDday.toISOString().slice(0, 10),
        createdAt: serverTimestamp()
      };
      
      await setDoc(boardRef, boardData);

      // 보드 페이지로 이동
      setTimeout(() => {
        navigate(`/board/${boardId}`);
      }, 100);
      
    } catch (error) {
      let errorMessage = "보드 생성에 실패했습니다.\n\n";
      
      if (error.code === 'permission-denied') {
        errorMessage += "❌ 권한이 거부되었습니다.\n\n";
      } else if (error.code === 'unavailable') {
        errorMessage += "❌ 서비스에 연결할 수 없습니다.\n인터넷 연결을 확인해주세요.";
      } else {
        errorMessage += `❌오류가 발생했습니다`;
      }
      
      alert(errorMessage);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8" style={{ backgroundColor: '#FFFDF7' }}>
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl p-8 md:p-16 shadow-sm"
          style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ color: '#333333' }}>
              너의 수능을<br />응원해!
            </h1>
            <p className="text-xl md:text-2xl font-medium mb-2" style={{ color: '#666666' }}>
              친구들이 응원 메시지를 남길 수 있는
            </p>
            <p className="text-lg" style={{ color: '#999999' }}>
              나만의 특별한 화이트보드를 만들어보세요
            </p>
          </motion.div>

          {isAuthenticated && user ? (
            <div className="space-y-8">
              {/* 로그인된 사용자 정보 */}
              <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFDF7', border: '1px solid rgba(0, 0, 0, 0.1)' }}>
                <div className="flex items-center gap-4">
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt="프로필" 
                      className="w-14 h-14 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-lg" style={{ color: '#333333' }}>
                      {user.displayName || user.email?.split('@')[0] || "사용자"}님
                    </p>
                    <p className="text-sm" style={{ color: '#999999' }}>{user.email}</p>
                  </div>
                </div>
              </div>

              {/* 로그아웃 버튼 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  try {
                    await signOut();
                  } catch (error) {
                    // 로그아웃 실패 (에러 무시)
                  }
                }}
                className="w-full px-5 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ 
                  backgroundColor: '#FFFDF7',
                  color: '#666666',
                  border: '2px solid rgba(0, 0, 0, 0.1)',
                  minHeight: '48px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#F6BD60';
                  e.target.style.color = '#333333';
                  e.target.style.borderColor = '#FFB703';
                  e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#FFFDF7';
                  e.target.style.color = '#666666';
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                }}
              >
                로그아웃
              </motion.button>

              {isChecking ? (
                <motion.button
                  disabled
                  className="w-full py-5 text-white rounded-2xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'linear-gradient(135deg, #FFB703 0%, #FB8500 100%)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    확인 중...
                  </span>
                </motion.button>
              ) : existingBoardId ? (
                <motion.button
                  onClick={handleCreateBoard}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-5 text-white rounded-2xl font-semibold text-lg transition-all duration-200"
                  style={{ 
                    background: 'linear-gradient(135deg, #FFB703 0%, #FB8500 100%)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  내 보드로 가기
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleCreateBoard}
                  disabled={isCreating}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-5 text-white rounded-2xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'linear-gradient(135deg, #FFB703 0%, #FB8500 100%)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      보드 생성 중...
                    </span>
                  ) : (
                    "보드 만들기"
                  )}
                </motion.button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <motion.button
                onClick={() => navigate("/login")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-5 text-white rounded-2xl font-semibold text-lg transition-all duration-200"
                style={{ 
                  background: 'linear-gradient(135deg, #FFB703 0%, #FB8500 100%)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                로그인하고 시작하기
              </motion.button>
              <p className="text-sm text-center" style={{ color: '#999999' }}>
                로그인 후 보드를 만들 수 있습니다
              </p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 p-6 rounded-2xl"
            style={{ backgroundColor: '#FFFDF7', border: '1px solid rgba(0, 0, 0, 0.1)' }}
          >
            <p className="text-sm text-center leading-relaxed" style={{ color: '#666666' }}>
              보드를 만들면 고유한 URL이 생성됩니다.<br />
              친구들에게 링크를 공유해서 따뜻한 응원 메시지를 받아보세요.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;

