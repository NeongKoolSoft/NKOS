// src/components/Footer.jsx
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full py-8 text-center text-[12px] md:text-sm text-gray-500 mt-10">
      <div className="space-y-1 leading-relaxed">

        {/* 브랜드 & 연도 */}
        <div className="font-medium">넝쿨OS © 2025</div>

        {/* 운영자 정보 */}
        <div>
          운영자 : 박경은 &nbsp;&nbsp; 문의 :{" "}
          <a
            href="mailto:pke7709@gmail.com"
            className="text-gray-600 underline hover:text-nk-primary"
          >
            pke7709@gmail.com
          </a>
        </div>

        {/* 정책 링크 */}
        <div className="flex items-center justify-center gap-4 mt-1">
          <Link
            to="/privacy"
            className="underline hover:text-nk-primary transition-colors"
          >
            개인정보처리방침
          </Link>

          <Link
            to="/terms"
            className="underline hover:text-nk-primary transition-colors"
          >
            이용약관
          </Link>
        </div>
      </div>
    </footer>
  );
}
