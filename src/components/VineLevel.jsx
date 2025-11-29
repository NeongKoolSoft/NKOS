// src/components/VineLevel.jsx
import React from 'react';

// 레벨별 넝쿨 아이콘 (SVG)
const VineIcons = ({ level }) => {
  if (level < 3) {
    // Lv 1-2: 씨앗
    return (
      <svg width="60" height="60" viewBox="0 0 100 100" className="text-stone-500 fill-current">
        <circle cx="50" cy="80" r="15" />
        <path d="M50 65 Q50 40 60 30" stroke="currentColor" strokeWidth="4" fill="none"/>
      </svg>
    );
  } else if (level < 6) {
    // Lv 3-5: 새싹
    return (
      <svg width="60" height="60" viewBox="0 0 100 100" className="text-green-500 fill-current">
        <path d="M50 90 L50 50" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
        <path d="M50 50 Q30 20 10 40" stroke="currentColor" strokeWidth="0" fill="currentColor"/>
        <path d="M50 50 Q70 20 90 40" stroke="currentColor" strokeWidth="0" fill="currentColor"/>
      </svg>
    );
  } else if (level < 10) {
    // Lv 6-9: 튼튼한 줄기
    return (
      <svg width="60" height="60" viewBox="0 0 100 100" className="text-green-600 fill-current">
        <path d="M50 90 Q60 60 50 30" stroke="currentColor" strokeWidth="8" fill="none"/>
        <path d="M50 70 Q30 60 20 80" stroke="currentColor" strokeWidth="0" fill="#4ade80"/>
        <path d="M50 50 Q70 40 80 60" stroke="currentColor" strokeWidth="0" fill="#4ade80"/>
        <path d="M50 30 Q30 10 10 30" stroke="currentColor" strokeWidth="0" fill="#4ade80"/>
      </svg>
    );
  } else {
    // Lv 10+: 꽃이 핀 넝쿨 (만개)
    return (
      <svg width="60" height="60" viewBox="0 0 100 100" className="text-rose-500 fill-current">
        <path d="M50 90 Q40 50 50 40" stroke="#16a34a" strokeWidth="6" fill="none"/>
        <circle cx="50" cy="40" r="15" />
        <circle cx="50" cy="25" r="10" className="text-rose-400"/>
        <circle cx="65" cy="40" r="10" className="text-rose-400"/>
        <circle cx="50" cy="55" r="10" className="text-rose-400"/>
        <circle cx="35" cy="40" r="10" className="text-rose-400"/>
        <circle cx="50" cy="40" r="8" fill="#fef08a"/>
      </svg>
    );
  }
};

const VineLevel = ({ level, xp, nextLevelXp }) => {
  const progress = Math.min((xp / nextLevelXp) * 100, 100);

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-green-100 mb-6">
      {/* 넝쿨 아이콘 영역 */}
      <div className="bg-green-50 p-2 rounded-full border border-green-100 flex-shrink-0">
        <VineIcons level={level} />
      </div>

      {/* 정보 영역 */}
      <div className="flex-1">
        <div className="flex justify-between items-end mb-1">
          <h3 className="font-bold text-gray-700 text-lg">
            Lv.{level} <span className="text-sm font-normal text-gray-500">나의 넝쿨</span>
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            {xp} / {nextLevelXp} XP
          </span>
        </div>
        
        {/* 경험치 바 */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {level < 10 ? "기록을 남겨 넝쿨을 키워보세요! 🌱" : "넝쿨이 아름답게 만개했습니다! 🌸"}
        </p>
      </div>
    </div>
  );
};

export default VineLevel;