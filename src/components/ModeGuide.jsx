// src/components/ModeGuide.jsx
import React from 'react';

const MODES = [
  { 
    id: 'DECISIVE', 
    label: '결단/실행', 
    desc: '불확실함을 끊고 행동으로 옮기는 날', 
    color: 'bg-rose-50 text-rose-600 border-rose-100',
    icon: '🔥'
  },
  { 
    id: 'EXPLORATORY', 
    label: '탐색/실험', 
    desc: '새로운 가능성을 열고 호기심을 따르는 날', 
    color: 'bg-violet-50 text-violet-600 border-violet-100',
    icon: '✨'
  },
  { 
    id: 'REFLECT', 
    label: '성찰/정리', 
    desc: '내면을 돌아보고 생각을 정리하는 날', 
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    icon: '🌊'
  },
  { 
    id: 'STABILIZE', 
    label: '안정/회복', 
    desc: '불안을 잠재우고 에너지를 비축하는 날', 
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    icon: '🌿'
  },
  { 
    id: 'SIMPLIFY', 
    label: '단순화', 
    desc: '복잡한 것을 쳐내고 본질에 집중하는 날', 
    color: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: '✂️'
  },
  { 
    id: 'DELAY', 
    label: '보류/휴식', 
    desc: '판단을 멈추고 흐름에 맡기는 날', 
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    icon: '☕'
  },
];

const ModeGuide = () => {
  return (
    <div className="mt-12">
      <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
        NuckleOS Mode Guide
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {MODES.map((mode) => (
          <div 
            key={mode.id} 
            className={`p-3 rounded-xl border ${mode.color} flex items-start gap-3 transition-transform hover:-translate-y-1`}
          >
            <div className="text-xl">{mode.icon}</div>
            <div>
              <div className="font-bold text-sm">{mode.id}</div>
              <div className="text-xs opacity-80 font-medium mb-1">{mode.label}</div>
              <div className="text-[11px] leading-tight opacity-70">
                {mode.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModeGuide;