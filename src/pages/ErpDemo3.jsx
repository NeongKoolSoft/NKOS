import React, { useState } from 'react';
import { Send, Menu, Bell, Bot, User, CheckCircle, ChevronRight, Grid } from 'lucide-react';

export default function ErpDemo3() {
  const [input, setInput] = useState("");
  
  // 데모용 데이터 상태
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'user',
      text: '삼성전자에 S24 케이스 100개 내일 납품으로 잡아.',
      time: '오후 3:15'
    },
    {
      id: 2,
      type: 'ai',
      text: '정상적으로 등록했습니다. (주문번호: SO-251228-01)',
      hasGrid: true, // 그리드(표) 표시 여부
      time: '오후 3:15'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      
      {/* 스마트폰 프레임 (375x720) */}
      <div className="w-[375px] h-[720px] bg-white rounded-[35px] shadow-2xl overflow-hidden border-[8px] border-gray-800 flex flex-col relative">
        
        {/* 1. 상단 헤더 */}
        <header className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <Bot size={18} />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm">넝쿨 AI 에이전트</h1>
              <span className="text-[10px] text-green-600 font-medium flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                영업 모드
              </span>
            </div>
          </div>
          <div className="flex gap-3 text-gray-400">
            <Bell size={20} className="hover:text-gray-600 cursor-pointer" />
            <Menu size={20} className="hover:text-gray-600 cursor-pointer" />
          </div>
        </header>

        {/* 2. 채팅 영역 */}
        <div className="flex-1 bg-[#f5f6f8] overflow-y-auto p-4 space-y-4">
          
          {/* 날짜 구분선 */}
          <div className="flex justify-center my-2">
            <span className="bg-black/10 text-white text-[10px] px-3 py-1 rounded-full">
              2025년 12월 28일 금요일
            </span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[95%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                
                {/* 프로필 아이콘 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.type === 'user' ? 'bg-yellow-400' : 'bg-indigo-600 text-white'
                }`}>
                  {msg.type === 'user' ? <User size={16} className="text-gray-800" /> : <Bot size={16} />}
                </div>

                {/* 메시지 내용 */}
                <div className="flex flex-col gap-1 w-full">
                  <span className={`text-[11px] text-gray-500 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.type === 'user' ? '나 (영업팀)' : 'AI 비서'}
                  </span>
                  
                  {/* 말풍선 */}
                  <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm w-fit ${
                    msg.type === 'user' 
                      ? 'bg-yellow-300 text-gray-900 rounded-tr-none ml-auto' 
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  }`}>
                    {msg.text}
                  </div>

                  {/* 📊 [핵심] ERP 데이터 그리드 (수주 등록 결과) */}
                  {msg.hasGrid && (
                    <div className="mt-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full animate-fade-in-up">
                      {/* 카드 헤더 */}
                      <div className="bg-green-50 px-4 py-3 border-b border-green-100 flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-600" />
                        <span className="text-xs font-bold text-green-800">실시간 ERP 수주 등록 현황</span>
                      </div>
                      
                      {/* 데이터 그리드 (표) */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-left border-collapse">
                          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                              <th className="px-3 py-2 whitespace-nowrap">일자</th>
                              <th className="px-3 py-2 whitespace-nowrap">거래처</th>
                              <th className="px-3 py-2 whitespace-nowrap">품목명</th>
                              <th className="px-3 py-2 text-right whitespace-nowrap">수량</th>
                              <th className="px-3 py-2 whitespace-nowrap">납기일</th>
                              <th className="px-3 py-2 text-center whitespace-nowrap">상태</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-700 bg-white">
                            <tr className="hover:bg-blue-50 transition-colors">
                              <td className="px-3 py-3 border-b border-gray-50">12/28</td>
                              <td className="px-3 py-3 border-b border-gray-50 font-bold text-gray-800">삼성전자</td>
                              <td className="px-3 py-3 border-b border-gray-50">S24케이스</td>
                              <td className="px-3 py-3 border-b border-gray-50 text-right font-bold text-blue-600">100</td>
                              <td className="px-3 py-3 border-b border-gray-50 text-gray-500">12/29</td>
                              <td className="px-3 py-3 border-b border-gray-50 text-center">
                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold">승인대기</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* 하단 액션 버튼 */}
                      <div className="flex border-t border-gray-100">
                        <button className="flex-1 py-3 hover:bg-gray-50 text-xs font-bold text-gray-500 border-r border-gray-100 transition-colors">
                          수정하기
                        </button>
                        <button className="flex-1 py-3 hover:bg-blue-50 text-xs font-bold text-blue-600 transition-colors flex items-center justify-center gap-1">
                          결재 요청 <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 시간 표시 */}
                  <span className={`text-[10px] text-gray-400 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 3. 하단 입력바 */}
        <div className="bg-white px-4 py-3 border-t border-gray-100 shrink-0">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="주문할 내용을 입력하세요..." 
              className="w-full bg-gray-100 text-gray-800 text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="absolute right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors shadow-sm">
              <Send size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}