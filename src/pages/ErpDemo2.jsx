import React, { useState } from 'react';
import { Send, Menu, Bell, Bot, User, Info, CreditCard, ChevronRight } from 'lucide-react';

// 시스템 적용 코드 (Mock-up)
const ErpDemo2 = () => {
  const [input, setInput] = useState("");
  
  // 초기 대화 상태 (데모용 시나리오: 미수금 조회)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'user',
      text: '삼성전자 지금 미수금 얼마야? 언제 준대?',
      time: '오후 2:30'
    },
    {
      id: 2,
      type: 'ai',
      text: '네, 대표님. 삼성전자 미수채권 현황 조회했습니다. 수금 약속이 잡혀있네요.',
      hasCard: true, // 카드가 있는 메시지
      time: '오후 2:30'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      
      {/* 스마트폰 프레임 (375x720) */}
      <div className="w-[375px] h-[720px] bg-white rounded-[35px] shadow-2xl overflow-hidden border-[8px] border-gray-800 flex flex-col relative">
        
        {/* 1. 상단 헤더 */}
        <header className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Bot size={18} />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm">넝쿨 AI 에이전트</h1>
              <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                ERP 연결됨
              </span>
            </div>
          </div>
          <div className="flex gap-3 text-gray-400">
            <Bell size={20} className="hover:text-gray-600 cursor-pointer" />
            <Menu size={20} className="hover:text-gray-600 cursor-pointer" />
          </div>
        </header>

        {/* 2. 채팅 영역 */}
        <div className="flex-1 bg-[#f2f4f6] overflow-y-auto p-4 space-y-4">
          
          {/* 날짜 구분선 */}
          <div className="flex justify-center my-2">
            <span className="bg-black/10 text-white text-[10px] px-3 py-1 rounded-full">
              2025년 12월 28일 금요일
            </span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                
                {/* 프로필 아이콘 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.type === 'user' ? 'bg-yellow-400' : 'bg-blue-600 text-white'
                }`}>
                  {msg.type === 'user' ? <User size={16} className="text-gray-800" /> : <Bot size={16} />}
                </div>

                {/* 메시지 내용 */}
                <div className="flex flex-col gap-1 w-full">
                  <span className={`text-[11px] text-gray-500 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.type === 'user' ? '나 (CEO)' : 'AI 비서'}
                  </span>
                  
                  {/* 말풍선 */}
                  <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm w-fit ${
                    msg.type === 'user' 
                      ? 'bg-yellow-300 text-gray-900 rounded-tr-none ml-auto' 
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  }`}>
                    {msg.text}
                  </div>

                  {/* 📊 [핵심] ERP 데이터 카드 (미수금 요약) */}
                  {msg.hasCard && (
                    <div className="mt-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full animate-fade-in-up">
                      {/* 카드 헤더 */}
                      <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-2">
                        <CreditCard size={14} className="text-blue-600" />
                        <span className="text-xs font-bold text-blue-700">삼성전자 미수채권 요약</span>
                      </div>
                      
                      {/* 카드 바디 */}
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">현재 잔액</span>
                          <span className="font-bold text-red-500">55,000,000 원</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">수금 예정</span>
                          <span className="font-bold text-gray-800">30,000,000 원</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">예정일</span>
                          <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                            12월 30일 (월)
                          </span>
                        </div>
                        
                        {/* 특이사항 */}
                        <div className="mt-2 bg-gray-50 p-2.5 rounded-lg flex gap-2 items-start">
                          <Info size={14} className="text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-gray-600 leading-tight">
                            특이사항: 어제(27일) 14:00 담당자와 통화 완료됨.
                          </p>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-600 border-t border-gray-100 flex items-center justify-center gap-1 transition-colors group">
                        담당자에게 독촉문자 발송
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
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
              placeholder="더 궁금한 점을 물어보세요..." 
              className="w-full bg-gray-100 text-gray-800 text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="absolute right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-sm">
              <Send size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ErpDemo2;