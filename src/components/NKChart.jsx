// src/components/NKChart.jsx
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const NKChart = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      // 데이터 없을 때 높이도 같이 줄임
      <div className="w-full h-52 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm border border-gray-100">
        데이터가 없습니다 🌱
      </div>
    );
  }

  const data = logs.slice(-7).map((log) => ({
    date: log.date.slice(5),
    energy: log.signals?.energy_level || 0,
    anxiety: log.signals?.risk_avoidance || 0,
  }));

  return (
    // 🌟 수정: h-72 -> h-52 (높이 약 30% 축소)
    // 🌟 수정: minHeight 300px -> 200px
    <div className="w-full h-52 bg-white p-4 rounded-xl shadow-sm border border-gray-100" style={{ minHeight: '200px' }}>
      
      {/* 🌟 수정: mb-4 -> mb-2 (제목 아래 여백 축소) */}
      <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center">
        📊 마음 바이탈 흐름 (최근 7건)
      </h3>
      
      <ResponsiveContainer width="99%" height="85%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: -25, bottom: 0 }} // 여백 미세 조정
        >
          <defs>
            <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAnxiety" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }} 
            axisLine={false} 
            tickLine={false} 
            interval="preserveStartEnd"
          />
          
          <YAxis 
            domain={[0, 5]} 
            tick={{ fontSize: 10 }} 
            axisLine={false} 
            tickLine={false} 
            tickCount={6}
          />
          
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
          />

          <Area
            type="monotone"
            dataKey="energy"
            name="에너지"
            stroke="#10B981"
            fillOpacity={1}
            fill="url(#colorEnergy)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="anxiety"
            name="불안/회피"
            stroke="#EF4444"
            fillOpacity={1}
            fill="url(#colorAnxiety)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NKChart;