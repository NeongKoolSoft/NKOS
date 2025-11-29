// src/components/CtaSection.jsx
import React from 'react';

function CtaSection() {
  // 🌟 클릭 시 맨 위로 스크롤 이동하는 함수
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-16 px-4 text-center rounded-t-3xl bg-blue-600 text-white mt-12 -mx-5 md:mx-0 md:rounded-3xl shadow-lg">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          당신의 방식으로 결정하세요.
        </h2>
        <p className="text-sm md:text-base max-w-xl mx-auto mb-8 text-blue-100 leading-relaxed">
          넝쿨OS는 당신을 더 열심히 하라고 밀어붙이지 않습니다.<br />
          당신의 리듬에 맞는 의사결정 방식을 제안할 뿐입니다.
        </p>
        
        {/* 🌟 수정: 텍스트 변경 & 클릭 이벤트 연결 */}
        <button 
          onClick={scrollToTop}
          className="px-8 py-3 bg-white text-blue-700 font-bold rounded-full shadow-lg hover:bg-blue-50 transition-colors transform hover:-translate-y-1"
        >
          기록 시작하기
        </button>
      </div>
    </section>
  );
}

export default CtaSection;