import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const PostIt = ({ post, isOwner = false, onClick, postCount = 1 }) => {
  const [size, setSize] = useState({ width: 160, minHeight: 130, fontSize: 'text-xs' });

  useEffect(() => {
    // 화면 크기 감지
    const updateSize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      // 메시지 길이에 따른 기본 크기 계산
      const messageLength = post.message ? post.message.length : 0;
      const charWidth = 8;
      const lineHeight = 20;
      const maxWidth = 250;
      const padding = 24;
      
      // 메시지 길이에 따른 너비 계산
      const textWidth = Math.min(messageLength * charWidth, maxWidth - padding);
      let calculatedWidth = Math.max(120, textWidth + padding);
      calculatedWidth = Math.min(calculatedWidth, maxWidth);
      
      // 메시지 길이에 따른 높이 계산
      const charsPerLine = Math.floor((calculatedWidth - padding) / charWidth);
      const lines = charsPerLine > 0 ? Math.ceil(messageLength / charsPerLine) : 1;
      let calculatedHeight = Math.max(100, lines * lineHeight + 60);
      
      // 포스트잇 개수에 따른 크기 조정 (메시지 길이 기반 크기와 조합)
      let baseWidth = calculatedWidth;
      let baseMinHeight = calculatedHeight;
      let baseFontSize = 'text-xs';
      let basePadding = 12;
      
      if (postCount <= 1) {
        baseWidth = Math.max(calculatedWidth, isMobile ? 140 : isTablet ? 180 : 200);
        baseMinHeight = Math.max(calculatedHeight, isMobile ? 120 : isTablet ? 150 : 170);
        baseFontSize = isMobile ? 'text-xs' : 'text-sm';
        basePadding = isMobile ? 14 : 16;
      } else if (postCount <= 3) {
        baseWidth = Math.max(calculatedWidth, isMobile ? 120 : isTablet ? 150 : 170);
        baseMinHeight = Math.max(calculatedHeight, isMobile ? 100 : isTablet ? 130 : 150);
        baseFontSize = 'text-xs';
        basePadding = isMobile ? 12 : 14;
      } else if (postCount <= 5) {
        baseWidth = Math.max(calculatedWidth, isMobile ? 110 : isTablet ? 130 : 150);
        baseMinHeight = Math.max(calculatedHeight, isMobile ? 90 : isTablet ? 110 : 130);
        baseFontSize = 'text-xs';
        basePadding = 12;
      } else {
        baseWidth = Math.max(calculatedWidth, isMobile ? 100 : isTablet ? 120 : 140);
        baseMinHeight = Math.max(calculatedHeight, isMobile ? 80 : isTablet ? 100 : 120);
        baseFontSize = 'text-xs';
        basePadding = 10;
      }
      
      setSize({
        width: baseWidth,
        minHeight: baseMinHeight,
        fontSize: baseFontSize,
        padding: basePadding
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [postCount, post.message]);

  // 랜덤 회전 각도 (자연스러운 느낌)
  const rotation = post.rotation || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: rotation - 5 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotate: rotation,
        x: 0,
        y: 0
      }}
      whileHover={{ 
        scale: 1.1,
        rotate: rotation + 2,
        y: -8,
        zIndex: 10
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
      className={`absolute shadow-sm rounded-xl border border-white/30 flex flex-col items-center justify-center text-center ${
        isOwner ? 'cursor-pointer' : 'cursor-default'
      }`}
      style={{
        left: `${post.x}%`,
        top: `${post.y}%`,
        background: post.color,
        width: size.width,
        minHeight: size.minHeight,
        padding: size.padding,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        transformOrigin: 'center center',
        transform: 'translate(-50%, -50%)' // 중심점 기준 배치
      }}
      onClick={() => isOwner && onClick && onClick(post)}
    >
      <div className={`font-extrabold mb-2 w-full border-b-2 border-black/10 pb-1 px-1 ${size.fontSize}`} style={{ color: "#333333" }}>
        {post.nickname}
      </div>
      {isOwner ? (
        <div 
          className={`${size.fontSize} break-words leading-relaxed px-1`}
          style={{ color: "#333333", wordBreak: 'break-word', overflowWrap: 'break-word' }}
        >
          {post.message}
        </div>
      ) : (
        <div 
          className={`${size.fontSize} leading-relaxed px-1 flex items-center justify-center`}
          style={{ color: "#999999" }}
        >
          <div className="text-center">
            <div className={`${postCount <= 1 ? 'text-3xl' : postCount <= 3 ? 'text-2xl' : 'text-xl'} mb-1`}>🔒</div>
            <div className={`${postCount <= 1 ? 'text-xs' : 'text-[10px]'} font-semibold`}>주인만 확인 가능</div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PostIt;

