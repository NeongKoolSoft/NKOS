// tests/gold-samples-data.mjs
// 🌱 FSM 튜닝용 GOLD 샘플 데이터

export const GOLD_SAMPLES = [
  {
    id: 1,
    text: "해야 할 일은 머릿속에 계속 맴도는데, 뭘 먼저 해야 할지 모르겠다. 그냥 넷플릭스나 보면서 내일로 미루고 싶다.",
    expected: "DELAY",
  },
  {
    id: 2,
    text: "오늘도 할 일을 적어보긴 했는데, 아무것도 손에 안 잡힌다. 생각만 많고 몸은 도무지 움직여지지 않는다.",
    expected: "DELAY",
  },
  // ... 여기 아래로 #3 ~ #68 까지 쭉 복붙
];
