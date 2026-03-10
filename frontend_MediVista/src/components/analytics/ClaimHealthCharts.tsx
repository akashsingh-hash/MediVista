import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#10b981', '#ef4444'];
const RISK_COLORS = ['#3b82f6', '#f59e0b', '#ef4444'];

export const ClaimHealthDonut = ({ data }: { data: any[] }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          labelLine={false}
          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((_entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export const RiskDistributionBar = ({ data }: { data: any[] }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
        <Tooltip 
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);
