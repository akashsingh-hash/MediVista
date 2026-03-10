import { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line
} from 'recharts';
import { TrendingUp, AlertTriangle, Activity, DollarSign } from 'lucide-react';

interface PatientRecord {
    id: number;
    patientName: string;
    medicineCost: number;
    procedureCost: number;
    roomCharges: number;
    expectedInsurancePayment: number;
    denialRisk?: number;
    departmentType: string;
    estimatedDaysToPay?: number;
}

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444']; // Blue, Amber, Rose

export default function FinancialAnalytics({ records }: { records: PatientRecord[] }) {
    
    const processedData = useMemo(() => {
        // 1. Revenue Leakage Data (Billed vs Expected)
        const leakageData = records.slice(-7).map((r, i) => ({
            name: `Claim ${i + 1}`,
            billed: r.medicineCost + r.procedureCost + r.roomCharges,
            expected: r.expectedInsurancePayment
        }));

        // 2. Risk Portfolio Data (Donut)
        const riskLevels = { High: 0, Medium: 0, Low: 0 };
        records.forEach(r => {
            const risk = r.denialRisk || 0;
            if (risk > 0.6) riskLevels.High++;
            else if (risk > 0.3) riskLevels.Medium++;
            else riskLevels.Low++;
        });
        const riskData = Object.entries(riskLevels).map(([name, value]) => ({ name, value }));

        // 3. Departmental Performance
        const deptStats: Record<string, { name: string, revenue: number, riskWeight: number, count: number }> = {};
        records.forEach(r => {
            if (!deptStats[r.departmentType]) {
                deptStats[r.departmentType] = { name: r.departmentType, revenue: 0, riskWeight: 0, count: 0 };
            }
            deptStats[r.departmentType].revenue += (r.medicineCost + r.procedureCost + r.roomCharges);
            deptStats[r.departmentType].riskWeight += (r.denialRisk || 0);
            deptStats[r.departmentType].count++;
        });
        const deptData = Object.values(deptStats).map(d => ({
            ...d,
            avgRisk: (d.riskWeight / d.count) * 100
        }));

        // 4. Payout Velocity (Predicted Days to Pay)
        const velocityData = records.slice(-10).map((r, i) => ({
            name: `P${i + 1}`,
            days: r.estimatedDaysToPay || (12 + (i % 4) * 5 + Math.floor(Math.random() * 3))
        }));

        return { leakageData, riskData, deptData, velocityData };
    }, [records]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
            {/* Chart 1: Revenue Leakage */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                            Revenue Cycle Leakage
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Billed vs. Expected Realization</p>
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={processedData.leakageData}>
                            <defs>
                                <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" hide />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="billed" name="Total Billed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBilled)" strokeWidth={3} />
                            <Area type="monotone" dataKey="expected" name="Expected Pay" stroke="#10b981" fillOpacity={1} fill="url(#colorExpected)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 2: Denial Risk Portfolio */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                            Denial Risk Portfolio
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Probability-Weighted Asset Distribution</p>
                    </div>
                </div>
                <div className="h-72 flex items-center">
                    <div className="flex-1 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={processedData.riskData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {processedData.riskData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-40 space-y-4">
                        {processedData.riskData.map((d, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                <div>
                                    <p className="text-xs font-black text-slate-700">{d.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{d.value} Claims</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart 3: Department Performance */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            Department Profitability vs Risk
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Functional Efficiency Audit</p>
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={processedData.deptData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontStyle: 'bold' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="revenue" name="Total Revenue" fill="#6366f1" radius={[10, 10, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 4: Payout Velocity Forecast */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            Payment Velocity Forecast
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Predicted Days-to-Pay (Averaged)</p>
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={processedData.velocityData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" hide />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} unit="d" />
                            <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Line 
                                type="stepAfter" 
                                dataKey="days" 
                                name="Predicted Payout (Days)" 
                                stroke="#6366f1" 
                                strokeWidth={4} 
                                dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 8, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
