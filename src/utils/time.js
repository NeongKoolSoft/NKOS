// src/utils/time.js
export function formatKoreanTime(utcString) {
  if (!utcString) return "";

  return new Date(utcString).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}