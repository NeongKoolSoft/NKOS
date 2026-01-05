import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import.meta.env.VITE_GA_MEASUREMENT_ID
import ReactGA from "react-ga4";

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;


// 🔴 아래 로그를 추가해서 배포된 사이트 콘솔(F12)에서 확인해 보세요!
console.log("환경변수 체크 - GA_ID:", GA_ID); 

if (GA_ID) {
  ReactGA.initialize(GA_ID);
  console.log("GA4 초기화 완료!");
} else {
  console.error("GA_ID를 찾을 수 없습니다. 환경변수 설정을 확인하세요.");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
