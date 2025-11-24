// src/components/StorySection.jsx
function StorySection() {
  return (
    <section className="py-16 px-4 bg-gray-100 md:py-20">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">
          왜 사람에게 OS가 필요한가?
        </h2>
        <p className="mb-4 text-sm md:text-base text-gray-700 leading-relaxed">
          우리는 매일 수많은 결정을 내리지만 그 대부분은 감정, 피로, 습관, 불안 같은 것들에 휩쓸립니다.
        </p>
        <p className="mb-4 text-sm md:text-base text-gray-700 leading-relaxed">
          캘린더와 할 일 앱은 많지만, <strong>“지금 어떤 방식으로 결정하는 게 가장 좋은가?”</strong>를 알려주는 도구는 없습니다.
        </p>
        <p className="mb-4 text-sm md:text-base text-gray-700 leading-relaxed">
          넝쿨OS는 당신의 삶을 체크리스트가 아닌 <strong>운영체제(OS)</strong>로 바라봅니다.
        </p>
      </div>
    </section>
  );
}

export default StorySection;
