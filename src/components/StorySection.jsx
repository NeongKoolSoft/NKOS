// src/components/StorySection.jsx
function StorySection() {
  return (
    <section className="py-16 px-6 bg-[#f8f7fa]">
      <div className="max-w-4xl mx-auto space-y-10">

        <div className="nk-card-soft">
          <h3 className="text-lg font-semibold mb-2 text-nk-color-primary-strong">
            감정의 흐름을 기록하면
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            당신만의 리듬이 보여요.  
            넝쿨OS는 하루의 작은 변화에서 패턴을 찾아
            성장 방향을 제안해줘요.
          </p>
        </div>

        <div className="nk-card-soft">
          <h3 className="text-lg font-semibold mb-2 text-nk-color-primary-strong">
            '모드'는 당신의 하루를 설명하는 언어예요
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Delay, Reflect, Simplify...  
            하루의 흐름이 어떤 리듬인지 명확히 알면  
            무엇을 해야 할지 보이기 시작하죠.
          </p>
        </div>

      </div>
    </section>

  );
}

export default StorySection;
