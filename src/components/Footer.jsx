// src/components/Footer.jsx
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-10">
      <div className="max-w-5xl mx-auto px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-gray-500">
        <div>
          넝쿨OS © 2025
          <span className="ml-2">운영자: 박경은</span>
          <span className="ml-2">
            문의:{" "}
            <a
              href="mailto:kel79@proton.me"
              className="underline hover:text-gray-700"
            >
              pke7709@gmail.com
            </a>
          </span>
        </div>

        <div className="flex gap-4">
          {/* ✅ 여기서는 Link만 사용하고, 바깥에 a로 감싸지 않기 */}
          <Link
            to="/privacy"
            className="hover:text-gray-700 underline underline-offset-2"
          >
            개인정보처리방침
          </Link>
          <Link
            to="/terms"
            className="hover:text-gray-700 underline underline-offset-2"
          >
            이용약관
          </Link>
        </div>
      </div>
    </footer>
  );
}
