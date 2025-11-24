// src/components/CtaSection.jsx
function CtaSection() {
  return (
    <section className="py-16 px-4 text-center nk-bg-primary text-white md:py-20">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          당신의 방식으로 결정하세요.
        </h2>
        <p className="text-sm md:text-base max-w-xl mx-auto mb-6 text-blue-100">
          넝쿨OS는 당신을 더 열심히 하라고 밀어붙이지 않습니다.<br />
          당신의 리듬에 맞는 의사결정 방식을 제안할 뿐입니다.
        </p>
        <button className="w-full sm:w-auto px-6 py-3 bg-white text-gray-900 font-bold rounded-lg shadow nk-border-primary border">
          곧 시작됩니다
        </button>
      </div>
    </section>
  );
}

export default CtaSection;
