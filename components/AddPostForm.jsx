import React, { useState } from "react";
import { motion } from "framer-motion";
import Modal from "./Modal";

const AddPostForm = ({ isOpen, onClose, onSubmit }) => {
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nickname.trim() || !message.trim()) {
      alert("닉네임과 응원 문구를 모두 입력해주세요!");
      return;
    }
    onSubmit(nickname.trim(), message.trim());
    setNickname("");
    setMessage("");
    onClose();
  };

  const handleClose = () => {
    setNickname("");
    setMessage("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <motion.div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-6 sm:p-7 md:p-8 max-w-md sm:max-w-lg md:max-w-xl w-full mx-3 sm:mx-4"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="text-center mb-6 sm:mb-7 md:mb-8">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3" style={{ color: '#333333' }}>
            응원 메시지 남기기
          </h3>
          <p className="text-sm sm:text-base md:text-lg" style={{ color: '#999999' }}>따뜻한 마음을 전해주세요</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-5 sm:mb-6 md:mb-7">
            <label className="block text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3" style={{ color: '#666666' }}>
              닉네임
            </label>
            <input
              type="text"
              className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl transition-all text-base sm:text-lg"
              style={{ 
                border: '2px solid rgba(0, 0, 0, 0.1)',
                backgroundColor: '#FFFDF7',
                color: '#333333'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#FFB703';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 183, 3, 0.2)';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                e.target.style.boxShadow = 'none';
                e.target.style.backgroundColor = '#FFFDF7';
              }}
              onMouseEnter={(e) => {
                if (document.activeElement !== e.target) {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#F6BD60';
                }
              }}
              onMouseLeave={(e) => {
                if (document.activeElement !== e.target) {
                  e.target.style.backgroundColor = '#FFFDF7';
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                }
              }}
              placeholder="이름을 입력해주세요 (최대 10자)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={10}
              autoFocus
            />
          </div>
          
          <div className="mb-6 sm:mb-7 md:mb-8">
            <label className="block text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3" style={{ color: '#666666' }}>
              응원 문구
            </label>
            <textarea
              className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl resize-none transition-all text-base sm:text-lg"
              style={{ 
                border: '2px solid rgba(0, 0, 0, 0.1)',
                backgroundColor: '#FFFDF7',
                color: '#333333',
                minHeight: '120px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#FFB703';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 183, 3, 0.2)';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                e.target.style.boxShadow = 'none';
                e.target.style.backgroundColor = '#FFFDF7';
              }}
              onMouseEnter={(e) => {
                if (document.activeElement !== e.target) {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#F6BD60';
                }
              }}
              onMouseLeave={(e) => {
                if (document.activeElement !== e.target) {
                  e.target.style.backgroundColor = '#FFFDF7';
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                }
              }}
              placeholder="수능 화이팅! 파이팅! 응원합니다!"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs sm:text-sm mt-2 text-right" style={{ color: '#999999' }}>
              {message.length}/100
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <motion.button
              type="button"
              onClick={handleClose}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-all font-semibold text-base sm:text-lg touch-manipulation w-full sm:w-auto"
              style={{ 
                border: '2px solid rgba(0, 0, 0, 0.1)',
                color: '#666666',
                backgroundColor: 'white',
                minHeight: '52px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFFDF7'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              취소
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="px-8 sm:px-10 py-3.5 sm:py-4 text-white rounded-xl transition-all shadow-sm font-semibold text-base sm:text-lg touch-manipulation w-full sm:w-auto"
              style={{ 
                background: 'linear-gradient(135deg, #FFB703 0%, #FB8500 100%)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                minHeight: '52px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'}
            >
              응원하기
            </motion.button>
          </div>
        </form>
      </motion.div>
    </Modal>
  );
};

export default AddPostForm;

