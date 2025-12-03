// src/components/HeaderMobile.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function HeaderMobile() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
        
        {/* 로고 */}
        <Link to="/" className="font-bold nk-text-primary text-lg">
          넝쿨OS
        </Link>

        {/* 햄버거 버튼 */}
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* 드롭다운 메뉴 */}
      {open && (
        <div className="bg-white border-t border-gray-200 shadow-md">
          <nav className="flex flex-col p-4 gap-3 text-gray-700 text-sm">
            
            {/* 메인 메뉴 */}
            <Link to="/" onClick={() => setOpen(false)}>
              넝쿨 모드
            </Link>

            <Link to="/history" onClick={() => setOpen(false)}>
              넝쿨 모드 히스토리
            </Link>

            <Link to="/planner" onClick={() => setOpen(false)}>
              넝쿨 플래너
            </Link>

            <Link to="/insight" onClick={() => setOpen(false)}>
              넝쿨 인사이트
            </Link>

            <hr className="my-2" />

            <Link to="/pro-support" onClick={() => setOpen(false)}>
              Pro 안내
            </Link>

            <button
              onClick={handleLogout}
              className="text-red-500 text-left"
            >
              로그아웃
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

