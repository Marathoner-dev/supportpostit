import React from "react";
import { motion } from "framer-motion";
import Modal from "./Modal";

const PostItModal = ({ post, isOpen, onClose, onDelete, isOwner }) => {
  if (!post) return null;

  const createdAt = post.createdAt?.toDate 
    ? post.createdAt.toDate() 
    : new Date(post.createdAt || Date.now());

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-sm p-8 max-w-md w-full relative"
        style={{ 
          background: post.color,
        }}
      >
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white rounded-full text-xl font-semibold transition-all"
          style={{ color: '#999999' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#333333'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#999999'}
          aria-label="닫기"
        >
          ×
        </motion.button>
        
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-bold mb-3 border-b border-black/10 pb-3 mx-auto" style={{ color: "#333333" }}>
            {post.nickname}
          </h3>
          <p className="text-sm flex items-center justify-center gap-2" style={{ color: "#999999" }}>
            {createdAt.toLocaleString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>
        
        <div 
          className="text-base leading-relaxed whitespace-pre-wrap break-words font-medium text-center mb-6"
          style={{ color: "#333333", minHeight: "120px" }}
        >
          {post.message}
        </div>

        {/* 삭제 버튼 (주인만 표시) */}
        {isOwner && onDelete && (
          <div className="flex justify-center">
            <motion.button
              onClick={handleDelete}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
              style={{
                backgroundColor: '#f44336',
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#da190b';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f44336';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>삭제하기</span>
            </motion.button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PostItModal;

