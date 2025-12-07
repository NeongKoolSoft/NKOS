// tests/goldSamples.js
// 넝쿨 골드샘플 리스트 (기대 모드 포함)
//
// MODES: DELAY / STABILIZE / REFLECT / SIMPLIFY / DECISIVE / EXPLORATORY

export const goldSamples = [
  { id: 54, text: "망설일 이유가 없어. 답은 이미 나와 있잖아.", expected: "DECISIVE" },
  { id: 55, text: "오늘 안에 무조건 끝낼 수 있을 것 같은 자신감이 들어.", expected: "DECISIVE" },
  { id: 56, text: "오늘 안에 이 일을 꼭 끝내기로 마음먹었다.", expected: "DECISIVE" },
  { id: 57, text: "이번 주는 결과물을 반드시 만들어낸다.", expected: "DECISIVE" },
  { id: 58, text: "지금 바로 시작하면 충분히 해낼 수 있을 것 같다.", expected: "DECISIVE" },
  { id: 59, text: "더 생각할 시간 없이 오늘 바로 행동해야겠다.", expected: "DECISIVE" },
  { id: 60, text: "오랫동안 미뤄왔던 문제를 오늘 해결하기로 결심했다.", expected: "DECISIVE" },

  { id: 61, text: "이 문제에 대해 완전히 다른 관점으로 접근해볼래.", expected: "EXPLORATORY" },
  { id: 62, text: "창의력이 샘솟는 기분, 낙서라도 끄적여봐야지.", expected: "EXPLORATORY" },
  { id: 63, text: "남들이 안 하는 짓을 한번 해보고 싶다.", expected: "EXPLORATORY" },
  { id: 64, text: "호기심이 생겨서 새로운 방법을 여러 가지 찾아보고 있다.", expected: "EXPLORATORY" },
  { id: 65, text: "오늘은 평소에 안 해보던 방식으로 시도해보고 싶다", expected: "EXPLORATORY" },
  { id: 66, text: "아이디어가 계속 떠올라서 이것저것 실험해보고 싶다.", expected: "EXPLORATORY" },
  { id: 67, text: "지금은 실패해도 괜찮다는 마음으로 자유롭게 탐색하는 중이다.", expected: "EXPLORATORY" },
  { id: 68, text: "창의적인 영감이 떠올라서 새로운 걸 배우고 싶다.", expected: "EXPLORATORY" },
];
