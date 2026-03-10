import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const DenialReasonsChart = ({ data }: { data: any[] }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        layout="vertical" 
        data={data}
        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" hide />
        <YAxis 
          dataKey="reason" 
          type="category" 
          width={100} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
        />
        <Tooltip 
          cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const DeptRiskHeatmap = ({ data }: { data: any[] }) => (
  <div className="grid grid-cols-2 gap-4">
    {data.map((item, idx) => (
      <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{item.dept}</span>
        <span className={`text-2xl font-black mt-1 ${item.riskCount > 5 ? 'text-rose-500' : item.riskCount > 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
          {item.riskCount}
        </span>
        <span className="text-[10px] font-bold text-slate-500 mt-1">High Risk Claims</span>
      </div>
    ))}
  </div>
);
