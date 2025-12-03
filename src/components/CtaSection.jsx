// src/components/CtaSection.jsx
export default function CtaSection({ onClickStart }) {
  const handleClick = () => {
    if (onClickStart) onClickStart();   // ✅ App에서 넘어온 핸들러 호출
  };

  return (
    <section className="mt-16 mb-24">
      <div className="bg-blue-600 rounded-3xl px-8 py-10 text-center text-white">
        <h2 className="text-2xl font-bold mb-3">
          당신의 방식으로 결정하세요.
        </h2>
        <p className="text-sm opacity-90 mb-8">
          넝쿨OS는 당신을 더 열심히 하라고만 밀어붙이지 않습니다.
          당신의 리듬에 맞는 의사결정 방식을 지원합니다.
        </p>

        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-blue-600 font-semibold text-sm shadow-md hover:bg-blue-50 transition-colors"
        >
          오늘의 모드로 이동
        </button>
      </div>
    </section>
  );
}
