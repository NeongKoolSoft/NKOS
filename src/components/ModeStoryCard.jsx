// src/components/ModeStoryCard.jsx
import { getModeStory } from "../lib/modeStories";

const MODE_LABEL = {
  DELAY: "DELAY · 지연/멈춤",
  STABILIZE: "STABILIZE · 안정/루틴",
  REFLECT: "REFLECT · 내면/되돌아봄",
  SIMPLIFY: "SIMPLIFY · 단순화/정리",
  DECISIVE: "DECISIVE · 결단/실행",
  EXPLORATORY: "EXPLORATORY · 탐색/실험",
};

export default function ModeStoryCard({ primary, secondary }) {
  if (!primary) return null;

  const story = getModeStory(primary, secondary);

  return (
    <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      {/* 헤더: 오늘의 모드 조합 */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-neutral-500">
            오늘의 흐름
          </span>
          <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
            {primary}
            {secondary && primary !== secondary ? ` + ${secondary}` : ""}
          </span>
        </div>
      </div>

      {/* 본문 스토리 */}
      <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-800">
        {story.trim()}
      </p>
    </div>
  );
}
