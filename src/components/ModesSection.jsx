// src/components/ModesSection.jsx
function ModesSection() {
  return (
    <section className="py-8 px-4 bg-white md:py-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
          의사결정 모드 6가지
        </h2>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* DELAY */}
          <div className="p-5 rounded-xl bg-gray-50">
            <div className="font-semibold mb-2">DELAY Mode</div>
            <p className="text-gray-600">
              결정을 미루고 휴식·정리에 집중해야 하는 날.
            </p>
          </div>

          {/* STABILIZE */}
          <div className="p-5 rounded-xl bg-gray-50">
            <div className="font-semibold mb-2">STABILIZE Mode</div>
            <p className="text-gray-600">
              작은 일부터 정리하며 안정감을 되찾는 모드.
            </p>
          </div>

          {/* SIMPLIFY */}
          <div className="p-5 rounded-xl bg-gray-50">
            <div className="font-semibold mb-2">SIMPLIFY Mode</div>
            <p className="text-gray-600">
              기준을 줄이고 선택지를 2~3개로 좁혀야 하는 날.
            </p>
          </div>

          {/* DECISIVE */}
          <div className="p-5 rounded-xl bg-gray-50">
            <div className="font-semibold mb-2">DECISIVE Mode</div>
            <p className="text-gray-600">
              빠르게 판단하고 실행해도 안전한 날.
            </p>
          </div>

          {/* EXPLORATORY */}
          <div className="p-5 rounded-xl bg-gray-50">
            <div className="font-semibold mb-2">EXPLORATORY Mode</div>
            <p className="text-gray-600">
              실험하고 새로운 길을 탐색해도 좋은 날.
            </p>
          </div>

          {/* REFLECT (새 모드) */}
          <div className="p-5 rounded-xl bg-gray-50">
            <div className="font-semibold mb-2">REFLECT Mode</div>
            <p className="text-gray-600">
              감정과 생각을 바라보고 기준을 재정비해야 하는 날.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ModesSection;
