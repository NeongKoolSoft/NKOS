// src/components/Footer.jsx
import { Link } from "react-router-dom";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-gray-100 bg-[#f9fbff]">
      <div className="max-w-4xl mx-auto px-4 py-6 text-xs md:text-sm text-gray-500">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* 왼쪽: 서비스/운영자 정보 */}
          <div>
            <div className="font-semibold text-nk-primary">
              넝쿨OS <span className="text-gray-400 text-[11px] md:text-xs">© {year}</span>
            </div>
            <div className="mt-1">
              운영자: <span className="font-medium">박경은</span>
            </div>
            <div className="mt-0.5">
              문의:&nbsp;
              <a
                href="mailto:pke7790@gmail.com"
                className="underline underline-offset-2 hover:text-nk-primary"
              >
                pke7790@gmail.com
              </a>
            </div>
          </div>

          {/* 오른쪽: 정책 링크 */}
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link
              to="/privacy"
              className="hover:text-nk-primary underline-offset-2 hover:underline"
            >
              <a href="/privacy" className="hover:text-gray-600">개인정보처리방침</a>
            </Link>
            <Link
              to="/terms"
              className="hover:text-nk-primary underline-offset-2 hover:underline"
            >
              <a href="/terms" className="hover:text-gray-600">이용약관</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
