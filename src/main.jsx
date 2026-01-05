import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import.meta.env.VITE_GA_MEASUREMENT_ID
import ReactGA from "react-ga4";

console.log("--- 배포 환경 변수 디버깅 ---");
console.log("전체 환경변수 객체:", import.meta.env); 
console.log("GA ID 값:", import.meta.env.VITE_GA_MEASUREMENT_ID);

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

if (GA_ID) {
  ReactGA.initialize(GA_ID);
  console.log("GA4 초기화 완료!");
} else {
  console.error("GA_ID를 찾을 수 없습니다. 환경변수 설정을 확인하세요.");
  console.log("--- 배포 환경 변수 디버깅 ---");
  console.log("전체 환경변수 객체:", import.meta.env); 
  console.log("GA ID 값:", import.meta.env.VITE_GA_MEASUREMENT_ID);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
