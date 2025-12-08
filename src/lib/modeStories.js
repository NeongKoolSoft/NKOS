// src/lib/modeStories.js
// Top1 + Top2 조합 스토리텔링 헬퍼

// 조합 스토리 (핵심 조합 + 확장 조합)
const MODE_COMBINATIONS = {
  "DELAY+SIMPLIFY": `
해야 할 일은 많고 생각은 복잡하지만,
지금은 몸이 쉽게 움직이지 않는 흐름이에요. (DELAY)

그러면서도 머릿속에서는
'이 중에서 뭐부터 줄여야 하지?' 하는 정리 욕구가 함께 올라오고 있습니다. (SIMPLIFY)

완전히 멈춘 상태가 아니라,
혼란 속에서 단서를 찾으려는 시점에 가까워요.
`,

  "DELAY+STABILIZE": `
지금은 에너지가 떨어져 있어서 적극적으로 움직이기 어렵지만, (DELAY)
단순히 미루는 것이 아니라
‘일단 컨디션부터 회복해야겠다’는 방향성이 함께 있습니다. (STABILIZE)

오늘의 핵심은 성과보다 회복이에요.
`,

  "STABILIZE+REFLECT": `
큰 변화를 만들기보다 루틴을 다시 안정시키려는 흐름이 기본이고, (STABILIZE)
그 과정에서 최근의 감정과 선택을 가만히 되짚어보려는 마음이 있습니다. (REFLECT)

지금은 몸과 마음을 다시 정렬하는 구간에 가까워요.
`,

  "REFLECT+SIMPLIFY": `
스스로의 감정과 생각을 깊이 들여다보면서도, (REFLECT)
그 안에서 ‘기준을 단순하게 만들고 싶다’는 정리 욕구가 올라오고 있어요. (SIMPLIFY)

의미를 되짚으면서 동시에 기준을 재설정하는 시점이에요.
`,

  "SIMPLIFY+DECISIVE": `
지금은 복잡한 것들을 줄이고 꼭 필요한 것만 남기려는 정리 흐름과(SIMPLIFY),
줄어든 범위 안에서 바로 실행하고 싶은 에너지가 동시에 켜져 있어요. (DECISIVE)

정리와 실행이 자연스럽게 맞물리는 시점입니다.
`,

  "DECISIVE+SIMPLIFY": `
실행 의지가 강하게 올라와 있지만(DECISIVE),
그 중심에는 ‘필요한 것만 남기자’는 단순화 전략이 깔려 있어요. (SIMPLIFY)

즉, 무작정 치고 나가는 게 아니라,
정리된 목표를 빠르게 수행하는 날입니다.
`,

  "DECISIVE+EXPLORATORY": `
지금은 실행 에너지(DECISIVE)와 실험 정신(EXPLORATORY)이 동시에 활성화되어 있어요.

결과를 만들면서도 새로운 방식으로 접근해보고 싶은,
창의적 실행 모드입니다.
`,

  "EXPLORATORY+DECISIVE": `
새로운 아이디어와 실험 욕구가 중심이지만(EXPLORATORY),
마음에 드는 방향이 보이면 바로 행동하고 싶은 실행력도 함께 있습니다. (DECISIVE)

탐색과 실행이 자연스럽게 오가는 모드예요.
`,

  // 🔹 추가 조합 12개

  "DELAY+REFLECT": `
겉으로는 미루고 멈춰 있는 것처럼 보이지만(DELAY),
내면에서는 ‘왜 이렇게 굳었지?’ 하고 스스로를 들여다보는 흐름이 있습니다. (REFLECT)

행동은 느리지만 생각은 깊어지는 구간에 가까워요.
이 멈춤은 단순한 무기력이 아니라,
방향을 다시 세우기 위한 숨 고르기일 수 있어요.
`,

  "DELAY+DECISIVE": `
지금은 몸은 멈춰 있지만(DELAY),
머릿속에서는 ‘이건 끝내야 하는데…’ 하고 결단의 불씨가 켜져 있습니다. (DECISIVE)

실제로 행동은 아직 막혀 있지만,
내면에서는 이미 선택이 어느 정도 정리된 상태일 수 있어요.

멈춤과 결심이 동시에 존재하는 전환기의 모습입니다.
`,

  "DELAY+EXPLORATORY": `
해야 할 일은 손에 잘 안 잡히지만(DELAY),
동시에 완전히 다른 방향이나 새로운 시도를 떠올리고 있는 흐름이 있습니다. (EXPLORATORY)

지금의 미룸은 단순한 회피라기보다,
현재 문제 대신 새로운 가능성으로 마음이 흘러가고 있기 때문일 수 있어요.
`,

  "STABILIZE+SIMPLIFY": `
기존 루틴을 회복하고 싶고(STABILIZE),
그 속에서 불필요한 것들을 덜어내 더 가볍게 만들고 싶다는 마음이 있습니다. (SIMPLIFY)

지금은 ‘복잡함을 줄여 안정감을 되찾는 과정’에 가까워요.
`,

  "STABILIZE+DECISIVE": `
안정을 찾고 싶은 마음이 기본 흐름이지만(STABILIZE),
특정한 하나의 작업에 대해서는 ‘이건 해내야 한다’는 의지가 올라옵니다. (DECISIVE)

전체적으로는 조심스럽지만,
핵심 목표 하나는 분명하게 잡힌 날입니다.
`,

  "STABILIZE+EXPLORATORY": `
루틴을 유지하고 싶은 마음이 기본 흐름이지만(STABILIZE),
동시에 작은 변화나 새로운 시도에 관심이 생기고 있어요. (EXPLORATORY)

큰 모험은 아니지만,
안전한 범위 안에서 가벼운 실험을 해보고 싶은 상태에 가깝습니다.
`,

  "REFLECT+STABILIZE": `
감정과 생각을 깊이 들여다보는 흐름 속에서(REFLECT),
이제는 생활 리듬과 컨디션도 함께 안정시키고 싶다는 마음이 있습니다. (STABILIZE)

머릿속 정리와 일상 루틴 정비가 동시에 필요한 구간이에요.
`,

  "REFLECT+DECISIVE": `
내면을 깊이 들여다보는 과정 속에서(REFLECT),
‘이제 어떻게 해야 할지 알겠다’는 결심이 함께 생기는 흐름입니다. (DECISIVE)

고민이 행동으로 이어지는 전환점에 가까워요.
`,

  "REFLECT+EXPLORATORY": `
감정과 생각을 정리하는 과정에서(REFLECT),
새로운 관점이나 전혀 다른 가능성이 떠오르고 있습니다. (EXPLORATORY)

과거를 되짚다가 미래의 새로운 방향을 발견하는 흐름이에요.
`,

  "SIMPLIFY+DELAY": `
정리를 하고 싶지만(SIMPLIFY),
막상 무엇을 어떻게 줄여야 할지 몰라 멈춰 있는 상태입니다. (DELAY)

혼란 속에서 핵심만 남기려는 시도가 나타나는 구간이에요.
`,

  "SIMPLIFY+REFLECT": `
할 일과 생각을 줄이고 싶다는 마음(SIMPLIFY)과
‘무엇을 기준으로 줄여야 할까?’를 되짚어보는 흐름이 함께 있습니다. (REFLECT)

지금은 마음속 기준을 단순하게 재정의하는 과정에 가깝습니다.
`,

  "EXPLORATORY+SIMPLIFY": `
새로운 시도에 관심이 있지만(EXPLORATORY),
그 전에 먼저 ‘가볍게 정리하고 단순하게 시작하고 싶다’는 욕구가 있습니다. (SIMPLIFY)

혼란스러운 실험이 아니라,
핵심만 남긴 뒤 가볍게 탐색하는 전략적인 흐름이에요.
`,
};

// 단일 모드일 때 fallback용 짧은 설명
const SINGLE_MODE_STORIES = {
  DELAY: `
지금은 마음과 몸이 쉽게 움직이지 않는 흐름이에요.

‘해야 하는 건 아는데, 손이 안 간다’는 느낌이 강할 수 있어요.
이럴 땐 스스로를 밀어붙이기보다,
에너지가 새는 지점과 부담의 크기를 가볍게 점검해 보는 게 도움이 됩니다.
`,
  STABILIZE: `
지금은 새로 벌리기보다, 이미 가지고 있는 삶의 리듬을
다시 안정시키는 데 초점이 맞춰져 있어요.

컨디션, 수면, 식사, 기본 루틴을 정비하는 것이
오늘의 핵심 액션일 수 있습니다.
`,
  REFLECT: `
지금은 눈앞의 실행보다,
‘왜 이렇게 느끼고 생각하는지’를 들여다보는 흐름이에요.

답을 당장 내리지 않더라도,
내 감정과 선택의 패턴을 알아차리는 것 자체가
이미 중요한 움직임입니다.
`,
  SIMPLIFY: `
해야 할 일과 생각이 너무 많아진 상태에서,
지금은 ‘핵심만 남기고 단순하게 만들고 싶다’는 욕구가 강합니다.

목표와 할 일을 1~3개 정도로 줄여보는 것이
오늘의 좋은 전략이 될 수 있어요.
`,
  DECISIVE: `
지금은 ‘이제는 해보자’ 쪽으로 기울어 있는 실행 모드입니다.

완벽한 계획보다,
작게라도 시작하고 싶다는 에너지가 올라와 있을 가능성이 커요.
`,
  EXPLORATORY: `
지금은 정해진 답보다는,
새로운 시도와 실험 자체에서 의미를 찾는 흐름이에요.

실패해도 괜찮다는 전제를 깔고,
작은 실험을 여러 번 해보는 것이 잘 어울리는 상태입니다.
`,
};

export function getModeStory(primary, secondary) {
  if (!primary) return "";

  // Top2가 없거나, 둘이 같으면 단일 모드 스토리
  if (!secondary || primary === secondary) {
    return SINGLE_MODE_STORIES[primary] || "";
  }

  const key = `${primary}+${secondary}`;
  if (MODE_COMBINATIONS[key]) return MODE_COMBINATIONS[key];

  // 순서 바꿔도 의미 있는 조합이면 뒤집어서도 시도
  const reversed = `${secondary}+${primary}`;
  if (MODE_COMBINATIONS[reversed]) return MODE_COMBINATIONS[reversed];

  // 그래도 없으면: primary 단일 설명 + 한 줄 조합 설명
  const base = SINGLE_MODE_STORIES[primary] || "";
  return (
    base +
    `

또 한편으로는 ${secondary} 성향도 함께 비치는 날이에요.
두 흐름을 동시에 의식하면서 오늘의 행동을 설계해볼 수 있어요.
`
  );
}

export { MODE_COMBINATIONS, SINGLE_MODE_STORIES };
