// src/components/CtaSection.jsx
export default function CtaSection({ onClickStart }) {
  // App에서 넘어온 onClickStart를 한 번 감싸서 사용하는 핸들러
  const handleClick = () => {
    if (onClickStart) onClickStart();
  };

  return (
    <section className="py-20 bg-gradient-to-br from-[#f3ecff] to-[#edf7ff] text-center">
      <h2 className="text-xl font-bold text-nk-color-primary-strong">
        오늘부터 당신의 리듬을 함께 가꿀까요?
      </h2>

      <button
        className="nk-btn-primary mt-6 px-10 py-3"
        onClick={handleClick}   // ✅ 여기 이름만 맞춰주면 끝!
      >
        넝쿨OS 시작하기 🌸
      </button>
    </section>
  );
}
