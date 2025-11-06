import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../config/firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import PostIt from "../components/PostIt";
import PostItModal from "../components/PostItModal";
import AddPostForm from "../components/AddPostForm";
import { computeDDay, generateRandomPosition, generateRandomRotation, getRandomColor } from "../utils/helpers";

const BoardView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [board, setBoard] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [currentPage, setCurrentPage] = useState(0);
  const boardRef = useRef(null);

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 보드 데이터 실시간 구독 및 주인 확인
  useEffect(() => {
    if (!id) return;
    
    const boardRef = doc(db, "boards", id);
    const unsubscribe = onSnapshot(boardRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBoard(data);
        
        // 주인 확인: 로그인한 사용자 ID가 보드의 ownerId와 일치하면 주인
        if (user && data.ownerId === user.uid) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      } else {
        alert("존재하지 않는 보드입니다.");
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [id, user, navigate]);

  // 포스트 실시간 구독 (모두 볼 수 있지만 내용은 주인만)
  useEffect(() => {
    if (!id) return;

    const postsRef = collection(db, "boards", id, "notes");
    const q = query(postsRef, orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = [];
      snapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() });
      });
      setPosts(postsData);
      
      // 포스트가 추가되면 해당 페이지로 이동
      if (postsData.length > 0) {
        const lastPost = postsData[postsData.length - 1];
        if (lastPost.page !== undefined) {
          setCurrentPage(lastPost.page);
        }
      }
    });

    return () => unsubscribe();
  }, [id]);

  // 보드 크기 고정 (더 큰 크기)
  const getBoardSize = () => {
    // 고정 크기: 데스크톱은 1400x800, 모바일은 화면 크기에 맞춤
    const fixedWidth = isMobile ? window.innerWidth - 24 : 1400;
    const fixedHeight = isMobile ? window.innerHeight * 0.7 : 800;
    
    return {
      width: fixedWidth,
      height: fixedHeight
    };
  };
  
  // 포스트를 페이지별로 분류하는 헬퍼 함수
  const getPostsByPage = useMemo(() => {
    const postsPerPage = 20;
    
    // createdAt 순서로 정렬
    const sortedPosts = [...posts].sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
      return aTime - bTime;
    });
    
    // 각 포스트의 페이지 계산
    const postsWithPage = sortedPosts.map((post, index) => {
      const postPage = post.page !== undefined ? post.page : Math.floor(index / postsPerPage);
      return { ...post, calculatedPage: postPage };
    });
    
    // 페이지별로 그룹화
    const postsByPage = {};
    let maxPage = 0;
    
    postsWithPage.forEach(post => {
      const page = post.calculatedPage;
      if (!postsByPage[page]) {
        postsByPage[page] = [];
      }
      postsByPage[page].push(post);
      maxPage = Math.max(maxPage, page);
    });
    
    return {
      postsByPage,
      maxPage,
      postsPerPage
    };
  }, [posts]);
  
  // 현재 페이지의 포스트잇 필터링
  const currentPagePosts = getPostsByPage.postsByPage[currentPage] || [];
  
  // 총 페이지 수 계산 (실제 page 필드 기반)
  const totalPages = Math.max(1, getPostsByPage.maxPage + 1);

  // 포스트 추가
  const handleAddPost = async (nickname, message) => {
    if (!id) return;

    try {
      // 고정된 보드 크기
      const boardSize = getBoardSize();
      const boardWidth = boardSize.width;
      const boardHeight = boardSize.height;
      
      // 가장 마지막 페이지 찾기
      const lastPage = getPostsByPage.maxPage;
      
      // 마지막 페이지에 먼저 배치 시도 (generateRandomPosition이 공간이 없으면 자동으로 다음 페이지로 이동)
      const position = generateRandomPosition(posts, boardWidth, boardHeight, message.length, lastPage);
      const rotation = generateRandomRotation();
      const color = getRandomColor();

      const postsRef = collection(db, "boards", id, "notes");
      await addDoc(postsRef, {
        nickname,
        message,
        x: position.x,
        y: position.y,
        rotation,
        color,
        page: position.page,
        createdAt: serverTimestamp()
      });
      
      // 새 포스트잇이 추가된 페이지로 이동
      if (position.page !== undefined) {
        setCurrentPage(position.page);
      }
    } catch (error) {
      alert("응원 메시지 추가에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 포스트 삭제
  const handleDeletePost = async (postId) => {
    if (!id || !postId) return;

    if (!window.confirm("이 응원 메시지를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const postRef = doc(db, "boards", id, "notes", postId);
      await deleteDoc(postRef);
      setSelectedPost(null);
    } catch (error) {
      alert("포스트잇 삭제에 실패했습니다.");
    }
  };


  // 공유 기능
  const shareUrl = window.location.href;
  const shareTitle = `${board?.owner || "익명"}님의 응원 보드`;
  const shareText = `${board?.owner || "익명"}님의 수능 응원 보드에 응원 메시지를 남겨주세요!`;

  const handleShare = async () => {
    // Web Share API 사용 (모바일)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // 사용자가 공유를 취소한 경우 (에러 무시)
      }
    } else {
      // Web Share API를 지원하지 않는 경우 클립보드 복사
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback: 텍스트 영역을 사용한 복사
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        alert('링크 복사에 실패했습니다. 링크를 직접 복사해주세요.');
      }
      document.body.removeChild(textArea);
    }
  };

  const dday = board ? computeDDay(board.ddayTarget) : null;

  return (
    <div 
      className="min-h-screen p-3 sm:p-4 md:p-6 flex flex-col items-center"
      style={{ backgroundColor: '#FFFDF7', overflowY: 'auto' }}
    >
      <div className="w-full mb-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 sm:mb-10 md:mb-12 w-full"
          style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}
        >
          <div className="flex flex-col items-center gap-4 sm:gap-5 bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
            <div className="text-center w-full">
              <div className="flex items-center gap-2 sm:gap-3 justify-center mb-3 flex-wrap">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold break-words" style={{ color: '#333333' }}>
                  {board?.owner || "익명"}님의 응원 보드
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="p-2 sm:p-2.5 rounded-lg transition-all flex-shrink-0 touch-manipulation"
                  style={{ 
                    color: '#999999',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#FFB703';
                    e.currentTarget.style.backgroundColor = '#FFFDF7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#999999';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="공유하기"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </motion.button>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
              {dday && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="text-center px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-xl shadow-sm w-full sm:w-auto"
                  style={{ 
                    background: 'linear-gradient(135deg, #FFB703 0%, #FB8500 100%)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                    {dday}
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 justify-center w-full sm:w-auto">
                {!user && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/login")}
                    className="px-5 sm:px-6 py-3.5 text-white rounded-xl transition-all text-sm sm:text-base font-semibold shadow-sm hover:shadow-md whitespace-nowrap touch-manipulation w-full sm:w-auto"
                    style={{ 
                      background: 'linear-gradient(135deg, #FFB703 0%, #FB8500 100%)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      minHeight: '48px'
                    }}
                  >
                    나도 보드 만들기
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/")}
                  className="px-5 sm:px-6 py-3.5 rounded-xl transition-all text-sm sm:text-base font-semibold whitespace-nowrap touch-manipulation w-full sm:w-auto"
                  style={{ 
                    backgroundColor: '#FFFDF7',
                    color: '#666666',
                    border: '2px solid rgba(0, 0, 0, 0.1)',
                    minHeight: '48px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F6BD60';
                    e.currentTarget.style.color = '#333333';
                    e.currentTarget.style.borderColor = '#FFB703';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFDF7';
                    e.currentTarget.style.color = '#666666';
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  홈으로
                </motion.button>
                
                {/* 공유 버튼들 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                  className="px-5 sm:px-6 py-3.5 rounded-xl transition-all text-sm sm:text-base font-semibold whitespace-nowrap touch-manipulation w-full sm:w-auto flex items-center justify-center gap-2"
                  style={{ 
                    background: 'linear-gradient(135deg, #FFB703 0%, #FB8500 100%)',
                    color: '#FFFFFF',
                    minHeight: '48px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>공유하기</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyLink}
                  className="px-5 sm:px-6 py-3.5 rounded-xl transition-all text-sm sm:text-base font-semibold whitespace-nowrap touch-manipulation w-full sm:w-auto flex items-center justify-center gap-2"
                  style={copied ? {
                    backgroundColor: '#84A59D',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    minHeight: '48px'
                  } : {
                    backgroundColor: '#FFFDF7',
                    color: '#666666',
                    border: '2px solid rgba(0, 0, 0, 0.1)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    minHeight: '48px'
                  }}
                  onMouseEnter={(e) => {
                    if (!copied) {
                      e.currentTarget.style.backgroundColor = '#F6BD60';
                      e.currentTarget.style.color = '#333333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!copied) {
                      e.currentTarget.style.backgroundColor = '#FFFDF7';
                      e.currentTarget.style.color = '#666666';
                    }
                  }}
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>복사됨!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>링크 복사</span>
                    </>
                  )}
                </motion.button>
                
                {user && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      try {
                        await signOut();
                        navigate("/");
                      } catch (error) {
                        // 로그아웃 실패 (에러 무시)
                      }
                    }}
                    className="px-5 sm:px-6 py-3.5 rounded-xl transition-all text-sm sm:text-base font-semibold whitespace-nowrap touch-manipulation w-full sm:w-auto"
                    style={{ 
                      backgroundColor: '#FFFDF7',
                      color: '#666666',
                      border: '2px solid rgba(0, 0, 0, 0.1)',
                      minHeight: '48px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F6BD60';
                      e.currentTarget.style.color = '#333333';
                      e.currentTarget.style.borderColor = '#FFB703';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFDF7';
                      e.currentTarget.style.color = '#666666';
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    로그아웃
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 화이트보드 */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px', gap: '16px' }}>
          {/* 페이지네이션 컨트롤 */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: currentPage === 0 ? '#e0e0e0' : '#FFB703',
                  color: currentPage === 0 ? '#999' : '#fff',
                  minWidth: '80px'
                }}
              >
                이전
              </motion.button>
              <div className="text-sm sm:text-base font-semibold px-4 py-2 rounded-lg" style={{ backgroundColor: '#FFFDF7', border: '2px solid rgba(0, 0, 0, 0.1)' }}>
                {currentPage + 1} / {totalPages}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: currentPage >= totalPages - 1 ? '#e0e0e0' : '#FFB703',
                  color: currentPage >= totalPages - 1 ? '#999' : '#fff',
                  minWidth: '80px'
                }}
              >
                다음
              </motion.button>
            </div>
          )}
          
          <motion.div
            ref={boardRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl sm:rounded-3xl"
            style={{ 
              width: `${getBoardSize().width}px`,
              height: `${getBoardSize().height}px`,
              maxWidth: isMobile ? 'calc(100% - 24px)' : '95vw',
              maxHeight: isMobile ? '70vh' : '80vh',
              backgroundColor: '#FFFDF7',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              border: '2px solid rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* 현재 페이지의 포스트잇들만 표시 */}
            {currentPagePosts.map((post) => (
              <PostIt
                key={post.id}
                post={post}
                isOwner={isOwner}
                onClick={isOwner ? setSelectedPost : () => {}}
                postCount={currentPagePosts.length}
              />
            ))}

          {/* 응원 남기기 버튼 (모두 사용 가능) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddForm(true)}
            className="absolute text-white font-semibold rounded-2xl transition-all z-10 flex items-center gap-2 touch-manipulation"
            style={{ 
              top: isMobile ? '1rem' : '1.5rem',
              left: '50%',
              padding: isMobile ? '14px 38px' : '16px 32px',
              fontSize: isMobile ? '16px' : '18px',
              background: 'linear-gradient(135deg, #FFB703 0%, #FB8500 100%)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              minHeight: '48px',
              minWidth: '140px'
            }}
            initial={{ x: '-50%' }}
            animate={{ x: '-50%' }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'}
          >
            <span>응원 하기</span>
          </motion.button>

            {/* 빈 상태 메시지 */}
            {currentPagePosts.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">📝</div>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-400 mb-2">
                    {posts.length === 0 ? '아직 응원 메시지가 없어요' : '이 페이지에는 포스트잇이 없어요'}
                  </p>
                  <p className="text-sm sm:text-base text-gray-500">
                    {posts.length === 0 ? '첫 번째 응원 메시지를 남겨보세요! ✨' : '다른 페이지를 확인해보세요!'}
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>

        {/* 공유 안내 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 sm:mt-6 bg-white rounded-2xl p-4 sm:p-6 mx-auto w-full"
          style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', maxWidth: '1200px' }}
        >
          {isOwner && (
            <div className="mb-4 rounded-xl p-4" style={{ backgroundColor: '#E8F5E9', border: '1px solid #C8E6C9' }}>
              <p className="text-sm text-center font-semibold" style={{ color: '#2E7D32' }}>
                보드 주인으로 로그인되어 있습니다
              </p>
              <p className="text-xs text-center mt-1" style={{ color: '#4CAF50' }}>
                모든 응원 메시지를 확인할 수 있습니다
              </p>
            </div>
          )}
          {!isOwner && user && (
            <div className="mb-4 rounded-xl p-4" style={{ backgroundColor: '#FFF9E6', border: '1px solid #FFE5B4' }}>
              <p className="text-sm text-center font-semibold" style={{ color: '#FB8500' }}>
                이 보드의 주인이 아닙니다
              </p>
              <p className="text-xs text-center mt-1" style={{ color: '#FFB703' }}>
                응원 메시지는 작성할 수 있지만, 내용은 보드 주인만 확인할 수 있습니다
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* 모달들 (주인만 사용 가능) */}
      <PostItModal
        post={selectedPost}
        isOpen={!!selectedPost && isOwner}
        onClose={() => setSelectedPost(null)}
        onDelete={selectedPost ? () => handleDeletePost(selectedPost.id) : null}
        isOwner={isOwner}
      />

      <AddPostForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddPost}
      />
    </div>
  );
};

export default BoardView;

