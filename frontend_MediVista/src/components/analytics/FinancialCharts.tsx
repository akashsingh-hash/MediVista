import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend
} from 'recharts';

export const CostVsRiskScatter = ({ data }: { data: any[] }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis type="number" dataKey="cost" name="Claim Amount" unit="₹" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
        <YAxis type="number" dataKey="risk" name="Denial Risk" unit="%" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Claims" data={data} fill="#6366f1" />
      </ScatterChart>
    </ResponsiveContainer>
  </div>
);

export const TrendLineChart = ({ data, dataKey, color, name }: { data: any[], dataKey: string, color: string, name: string }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
        <Line type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={3} dot={{ r: 4, fill: color, strokeWidth: 2 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const FinancialVarianceArea = ({ data }: { data: any[] }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
        <Legend verticalAlign="top" height={36}/>
        <Area type="monotone" dataKey="billed" name="Billed Amount" stroke="#6366f1" fillOpacity={1} fill="url(#colorBilled)" strokeWidth={2} />
        <Area type="monotone" dataKey="expected" name="Expected Payment" stroke="#10b981" fillOpacity={1} fill="url(#colorExpected)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export const RevenueAtRiskGauge = ({ amount }: { amount: number }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-rose-50 rounded-[2.5rem] border border-rose-100">
    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Revenue at High Risk</span>
    <span className="text-4xl font-black text-rose-600 tracking-tight">₹{(amount / 100000).toFixed(1)}L</span>
    <div className="w-full h-2 bg-rose-200 rounded-full mt-4 overflow-hidden">
      <div 
        className="h-full bg-rose-500 rounded-full" 
        style={{ width: `${Math.min(100, (amount / 1000000) * 100)}%` }}
      />
    </div>
    <span className="text-[10px] font-bold text-rose-400 mt-2">Target: &lt; ₹10L</span>
  </div>
);
