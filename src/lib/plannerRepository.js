// src/lib/plannerRepository.js
import { supabase } from "./supabase";

// 오늘 날짜 문자열 만들기: 'YYYY-MM-DD'
export function getTodayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// 1) 특정 날짜의 플래너(헤더 + 아이템들) 불러오기
export async function fetchPlannerForDate(userId, date) {
  if (!userId) throw new Error("userId is required");
  if (!date) throw new Error("date is required");

  // nkos_planner_entries: 해당 날짜 메타 (제목, 상태, 메모 등)
  const { data: entryRows, error: entryError } = await supabase
    .from("nkos_planner_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_date", date)
    .order("created_at", { ascending: true })
    .limit(1);

  if (entryError) {
    console.error("[fetchPlannerForDate] entry error:", entryError);
    throw entryError;
  }

  const entry = entryRows && entryRows[0] ? entryRows[0] : null;

  // planner_items: 해당 날짜의 개별 계획 줄들 (하루 3줄 계획 등)
  const { data: items, error: itemsError } = await supabase
    .from("planner_items")
    .select("id, text, completed, date, source, mode, created_at")
    .eq("user_id", userId)
    .eq("date", date)
    .order("id", { ascending: true });

  if (itemsError) {
    console.error("[fetchPlannerForDate] items error:", itemsError);
    throw itemsError;
  }

  return { entry, items: items || [] };
}

// 2) 플래너 헤더 upsert (없으면 INSERT, 있으면 UPDATE 느낌으로 사용)
export async function upsertPlannerEntry(userId, date, payload) {
  if (!userId || !date) throw new Error("userId/date required");

  const row = {
    user_id: userId,
    plan_date: date,
    title: payload.title ?? null,
    status: payload.status ?? null,
    note: payload.note ?? null,
    meta: payload.meta ?? {},
  };

  // 중복 없는 (user_id + plan_date)라고 가정하고 upsert
  const { data, error } = await supabase
    .from("nkos_planner_entries")
    .upsert(row, {
      onConflict: "user_id,plan_date",
    })
    .select()
    .single();

  if (error) {
    console.error("[upsertPlannerEntry] error:", error);
    throw error;
  }

  return data;
}

// 3) 개별 아이템 저장 (INSERT or UPDATE)
export async function savePlannerItem(userId, date, item) {
  if (!userId || !date) throw new Error("userId/date required");

  const base = {
    user_id: userId,
    date,
    text: item.text ?? "",
    completed: item.completed ?? false,
    source: item.source ?? "planner",
    mode: item.mode ?? null,
  };

  if (item.id) {
    // UPDATE
    const { data, error } = await supabase
      .from("planner_items")
      .update(base)
      .eq("id", item.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("[savePlannerItem] update error:", error);
      throw error;
    }
    return data;
  } else {
    // INSERT
    const { data, error } = await supabase
      .from("planner_items")
      .insert(base)
      .select()
      .single();

    if (error) {
      console.error("[savePlannerItem] insert error:", error);
      throw error;
    }
    return data;
  }
}

// 4) 아이템 삭제
export async function deletePlannerItem(userId, id) {
  if (!userId || !id) throw new Error("userId/id required");

  const { error } = await supabase
    .from("planner_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[deletePlannerItem] error:", error);
    throw error;
  }
}

// ✅ 선택한 날짜의 "오늘의 모드" 가져오기
export async function fetchModeForDate(userId, dateString) {
  if (!userId || !dateString) return null;

  const { data, error } = await supabase
    .from("nkos_logs")
    .select("mode")               // 모드 필드 이름이 다르면 여기만 수정
    .eq("user_id", userId)
    .eq("log_date", dateString)   // log_date 대신 created_at 날짜를 쓰면 to_char 등으로 맞춰도 됨
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("fetchModeForDate error", error);
    return null;
  }

  return data?.mode || null;
}
