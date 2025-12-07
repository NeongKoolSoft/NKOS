// src/lib/logRepository.js
import { supabase } from "./supabase";

// 공통: 유저 일지 리스트 조회
export async function fetchUserLogs({ userId, limit = 100 }) {
  if (!userId) return { data: [], error: new Error("userId is required") };

  const { data, error } = await supabase
    .from("nkos_logs")
    .select(
      "id, user_id, log_date, created_at, text, mode, emotion_tags, character, meta, ai_recommendation"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

    .limit(limit);

  if (error) {
    console.error("[fetchUserLogs] error:", error);
    return { data: [], error };
  }

  // UI에서 쓰기 편하게 normalize
  const normalized = (data || []).map((row) => {
    const date =
      row.log_date ||
      (row.created_at ? row.created_at.split("T")[0] : null);

    return {
      id: row.id,
      userId: row.user_id,
      date,
      createdAt: row.created_at,
      text: row.text,
      mode: row.mode, // DELAY / STABILIZE / ...
      emotionTags: row.emotion_tags,
      character: row.character,
      meta: row.meta,
      aiRecommendation: row.ai_recommendation,
    };
  });

  return { data: normalized, error: null };
}

// 바이탈 흐름 차트용: 날짜 순으로 모드 흐름 만들기
export function buildVitalFlowSeries(logs) {
  const sorted = [...logs].sort((a, b) =>
    (a.date || "").localeCompare(b.date || "")
  );

  // 예: [{ date: '2024-12-01', mode: 'DELAY' }, ...]
  return sorted.map((log) => ({
    date: log.date,
    mode: log.mode,
  }));
}
