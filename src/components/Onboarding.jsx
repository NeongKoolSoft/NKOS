// src/components/Onboarding.jsx
import React, { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'NKOS_tutorial_77';

const SLIDES = [
  {
    emoji: "🚀",
    title: "넝쿨OS는 기록 앱이 아닙니다.\n당신의 ‘의사결정 엔진’입니다.",
    desc: "넝쿨OS는 감정 기록 서비스가 아닙니다.\n당신의 하루를 읽고 ‘지금 무엇을 해야 하는지’를\nAI가 계산하는 의사결정 보조 시스템입니다.\n\n하루 10초 기록만으로도,\n당신의 패턴과 에너지를 정확히 파악합니다."
  },
  {
    emoji: "🧭",
    title: "감정이 아니라,\n‘행동 모드’를 분석합니다.",
    desc: "지금은 집중해야 할 때인지,\n잠시 멈춰야 할 때인지\n당신 스스로는 잘 모를 때가 많습니다.\n\n넝쿨OS는 하루 기록 2~3줄만으로\n당신의 현재 행동 모드(DELAY, DECISIVE 등)를 계산하고,\n즉시 가장 적합한 전략을 제안합니다."
  },
  {
    emoji: "🌱",
    title: "기록이 쌓일수록\n당신의 ‘의사결정 패턴’이 보입니다.",
    desc: "넝쿨OS는 단순한 감정 트래킹을 하지 않습니다.\n당신의 판단 흐름, 흔들리는 지점, 강해지는 시점을 분석하여\n시간이 지날수록 더 정교한 코칭을 제공합니다.\n\n30개 기록이 쌓이면,\n당신만의 ‘장기 패턴 리포트’가 자동 생성됩니다."
  }
];


const Onboarding = () => {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // 튜토리얼 확인 여부 체크
    const hasSeen = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeen) {
      setShow(true);
    }
  }, []);

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-slideUp border border-gray-100">
        
        {/* 상단 이미지 영역 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 h-52 flex items-center justify-center text-7xl shadow-inner">
          {SLIDES[step].emoji}
        </div>

        {/* 텍스트 영역 */}
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4 whitespace-pre-line leading-tight">
            {SLIDES[step].title}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-8 keep-all">
            {SLIDES[step].desc}
          </p>

          {/* 인디케이터 */}
          <div className="flex justify-center gap-2 mb-8">
            {SLIDES.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === step ? "bg-nk-primary w-8" : "bg-gray-200 w-2"
                }`}
              />
            ))}
          </div>

          {/* 버튼 */}
          <button
            onClick={handleNext}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all transform hover:-translate-y-0.5"
          >
            {step === SLIDES.length - 1 ? "나만의 OS 부팅하기 ⚡" : "다음"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Onboarding;