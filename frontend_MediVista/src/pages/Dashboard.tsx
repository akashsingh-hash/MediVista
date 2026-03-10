import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    X,
    Search,
    Filter,
    ClipboardList,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
    Activity,
    User,
    Shield,
    Stethoscope,
    TrendingUp,
    Clock,
    LayoutDashboard,
    Brain
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface PatientRecord {
    id: number;
    patientName: string;
    age: number;
    sex: string;
    insuranceProvider: string;
    insuranceType: string;
    departmentType: string;
    emrSystem: string;
    billingSystem: string;
    medicineCost: number;
    procedureCost: number;
    roomCharges: number;
    expectedInsurancePayment: number;
    patientPayableAmount: number;
    isApproved?: boolean;
    approvalConfidence?: number;
    denialRisk?: number;
    predictedDenialReason?: string;
    actionRequired?: string;
    nextBestActionInstruction?: string;
    nextBestActionDepartment?: string;
    estimatedDaysToPay?: number;
    expectedDate?: string;
    financialAlertLevel?: string;
}

export default function Dashboard() {
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const hospitalName = localStorage.getItem('hospitalName') || 'Hospital';

    const { register, handleSubmit, reset } = useForm<PatientRecord>();

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const response = await api.get('/records');
            setRecords(response.data);
        } catch (err) {
            toast.error('Could not load patient records.');
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: PatientRecord) => {
        setIsSubmitting(true);
        const loadingToast = toast.loading('AI Model is analyzing the claim...');
        try {
            // 0. Parse numeric strings from form into true numbers and calculate the total bill for the ML API
            const payloadForML = {
                ...data,
                age: Number(data.age),
                medicineCost: Number(data.medicineCost),
                procedureCost: Number(data.procedureCost),
                roomCharges: Number(data.roomCharges),
                expectedInsurancePayment: Number(data.expectedInsurancePayment),
                patientPayableAmount: Number(data.patientPayableAmount),
                totalBillAmount: Number(data.medicineCost) + Number(data.procedureCost) + Number(data.roomCharges)
            };

            // 1. Call ML FastAPI for predictions
            const mlResponse = await fetch('http://localhost:8000/api/predict/claim', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payloadForML),
            });

            if (!mlResponse.ok) {
                const errorData = await mlResponse.json();
                console.error("ML Validation Error:", errorData);
                throw new Error("Failed to get prediction from ML API");
            }
            const prediction = await mlResponse.json();

            // 2. Merge ML predictions with the form data
            const completeRecord = {
                ...payloadForML,
                isApproved: prediction.is_approved,
                approvalConfidence: prediction.approval_confidence,
                denialRisk: prediction.denial_risk,
                predictedDenialReason: prediction.predicted_denial_reason,
                actionRequired: prediction.action_required,
                nextBestActionInstruction: prediction.next_best_action?.instruction,
                nextBestActionDepartment: prediction.next_best_action?.recommended_department,
                estimatedDaysToPay: prediction.expected_payment_timeline?.estimated_days_to_pay,
                expectedDate: prediction.expected_payment_timeline?.expected_date,
                financialAlertLevel: prediction.financial_variance_warning?.alert_level
            };

            // 3. Save to Java Backend
            const response = await api.post('/records', completeRecord);
            // Prepend the new record to the list for immediate visibility
            setRecords(prev => [response.data, ...prev]);

            setIsFormOpen(false);
            reset();
            toast.success('Record analyzed and saved successfully!', { id: loadingToast });
        } catch (err) {
            console.error('Failed to run prediction or create record', err);
            toast.error('Submission failed. Is the ML server running?', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalRevenue = records.reduce((acc, curr) => acc + (curr.medicineCost + curr.procedureCost + curr.roomCharges), 0);

    const filteredRecords = records.filter(record => {
        const name = record.patientName || '';
        const provider = record.insuranceProvider || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            provider.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-xl">
                                <LayoutDashboard className="w-8 h-8 text-white" />
                            </div>
                            {hospitalName}
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                            Management Portal & Predictive Claim Shield
                        </p>
                    </motion.div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200/50 hover:shadow-blue-300/50 transition-all"
                    >
                        <Plus className="w-6 h-6" />
                        New Analysis
                    </motion.button>
                </div>
            </div>

            {/* Stats Section */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total Records', value: records.length, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Approval Rate', value: records.length ? `${((records.filter(r => r.isApproved).length / records.length) * 100).toFixed(0)}%` : '0%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'High Risk Claims', value: records.filter(r => (r.denialRisk || 0) > 0.4).length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-5">
                            <div className={`${stat.bg} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-7 h-7 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content: Search and Table */}
            <div className="max-w-7xl mx-auto bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="relative w-full sm:w-[450px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by patient name or insurance carrier..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 font-bold transition-all">
                            <Filter className="w-5 h-5" />
                            Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#fcfdfe] text-slate-400 text-xs font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Patient & Vitals</th>
                                <th className="px-8 py-5">Insurance & System</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Risk Matrix</th>
                                <th className="px-8 py-5">Billed Amount</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"
                                            />
                                            <p className="font-bold text-slate-400">Fetching Clinical Data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center font-bold text-slate-300">
                                        No records found in current workflow.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record, index) => {
                                    const rowKey = record.id ?? index;
                                    return (
                                        <React.Fragment key={rowKey}>
                                            <tr
                                                onClick={() => setExpandedId(expandedId === rowKey ? null : rowKey)}
                                                className={`group cursor-pointer transition-all ${expandedId === rowKey ? 'bg-blue-50/30 shadow-inner' : 'hover:bg-slate-50/50'}`}
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="font-black text-slate-800 text-lg">{record.patientName || 'Untitled Patient'}</div>
                                                    <div className="text-sm font-semibold text-slate-500 flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">{record.age}Y</span>
                                                        <span className="text-slate-300">|</span>
                                                        <span>{record.sex === 'M' ? 'Male' : 'Female'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                        <Shield className="w-4 h-4 text-emerald-500" />
                                                        {(record.insuranceProvider || 'N/A').replace('_', ' ')}
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-400 mt-1 pl-6">{(record.emrSystem || '').replace('_', ' ')}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {record.isApproved ? (
                                                        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100/50 text-emerald-700 rounded-lg font-bold text-sm">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Approved
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-100/50 text-rose-700 rounded-lg font-bold text-sm">
                                                            <AlertCircle className="w-4 h-4" />
                                                            Predicted Denial
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 bg-slate-100 rounded-full h-3 min-w-[120px] overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${(record.denialRisk || 0) * 100}%` }}
                                                                className={`h-full rounded-full ${(record.denialRisk || 0) > 0.6 ? 'bg-gradient-to-r from-rose-400 to-rose-600' :
                                                                    (record.denialRisk || 0) > 0.3 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                                                                    }`}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-black text-slate-600">{((record.denialRisk || 0) * 100).toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-xl font-black text-slate-900">₹{((record.medicineCost || 0) + (record.procedureCost || 0) + (record.roomCharges || 0)).toLocaleString()}</div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedId(expandedId === rowKey ? null : rowKey);
                                                        }}
                                                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ml-auto ${expandedId === rowKey
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                                            : 'bg-slate-50 text-slate-600 hover:bg-white hover:shadow-md border border-slate-100'
                                                            }`}
                                                    >
                                                        <Brain className={`w-3 h-3 ${expandedId === rowKey ? 'text-white' : 'text-blue-500'}`} />
                                                        {expandedId === rowKey ? 'Close' : 'Analysis'}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expanded Detail Panel */}
                                            <AnimatePresence>
                                                {expandedId === rowKey && (
                                                    <tr>
                                                        <td colSpan={6} className="p-0 border-none">
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden bg-[#fafbff] px-8 py-10 border-b border-blue-50"
                                                            >
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                                                    <div className="space-y-6">
                                                                        <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                                            <Brain className="w-4 h-4" /> Prediction Summary
                                                                        </h4>
                                                                        <div className="p-6 bg-white rounded-[2rem] border border-blue-100/50 shadow-sm relative overflow-hidden">
                                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />
                                                                            <div className="relative z-10">
                                                                                <p className="text-sm font-bold text-slate-400">AI Trust Score</p>
                                                                                <p className="text-4xl font-black text-blue-600 mt-1">{((record.approvalConfidence || 0) * 100).toFixed(1)}%</p>
                                                                                <div className={`mt-4 p-4 rounded-2xl text-sm font-bold leading-relaxed border ${record.isApproved ? 'bg-blue-50/50 text-blue-800 border-blue-100/50' : 'bg-rose-50/50 text-rose-800 border-rose-100/50'}`}>
                                                                                    {record.actionRequired}
                                                                                </div>
                                                                                {record.nextBestActionInstruction && (
                                                                                    <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Next Best Action / Action Plan</p>
                                                                                        <p className="text-sm font-bold text-indigo-900">{record.nextBestActionInstruction}</p>
                                                                                        <p className="text-[10px] font-bold text-indigo-500 mt-1">Responsible: {record.nextBestActionDepartment}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-6 md:col-span-2">
                                                                        <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                                            <Activity className="w-4 h-4" /> Analysis & Recommendations
                                                                        </h4>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
                                                                            <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                                                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Denial Core Factor</p>
                                                                                {record.predictedDenialReason ? (
                                                                                    <div className="flex items-start gap-4 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                                                                        <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                                                                                            <AlertCircle className="w-5 h-5" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="font-black text-rose-900 text-lg leading-tight">{record.predictedDenialReason}</p>
                                                                                            <p className="text-xs font-bold text-rose-500 mt-1 uppercase tracking-wider">Identified Bottleneck</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl text-emerald-700 font-bold border border-emerald-100">
                                                                                        <CheckCircle2 className="w-5 h-5" /> All checks passed
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] shadow-xl text-white">
                                                                                <div className="flex justify-between items-start mb-4">
                                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financial Intelligence</p>
                                                                                    <Stethoscope className="w-5 h-5 text-blue-400" />
                                                                                </div>
                                                                                <div className="space-y-4">
                                                                                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                                                                        <span className="text-slate-400 font-bold tracking-wide">Expected Payment</span>
                                                                                        <span className="font-black text-blue-400">₹{record.expectedInsurancePayment.toLocaleString()}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                                                                        <span className="text-slate-400 font-bold tracking-wide">Patient Responsibility</span>
                                                                                        <span className="font-black">₹{record.patientPayableAmount.toLocaleString()}</span>
                                                                                    </div>
                                                                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                                                                                        System Verification: {record.billingSystem.replace('_', ' ')} • Active Session Control
                                                                                    </p>
                                                                                    {record.financialAlertLevel && (
                                                                                        <div className={`mt-2 p-2 rounded border border-solid font-bold text-[10px] ${record.financialAlertLevel === 'High' ? 'bg-rose-900/30 border-rose-500/50 text-rose-300' : 'bg-amber-900/30 border-amber-500/50 text-amber-300'}`}>
                                                                                            <AlertTriangle className="inline w-3 h-3 mr-1" />
                                                                                            Financial Alert Level: {record.financialAlertLevel}
                                                                                        </div>
                                                                                    )}
                                                                                    {record.expectedDate && (
                                                                                        <div className="pt-2 flex items-center gap-2 text-[10px] font-bold text-blue-400">
                                                                                            <Clock className="w-3 h-3" />
                                                                                            Estimated Payout: {record.expectedDate} ({record.estimatedDaysToPay} days)
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sliding Form Drawer */}
            <AnimatePresence>
                {isFormOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFormOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto px-8 py-10"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Add New Patient Record</h2>
                                    <p className="text-slate-500">Enter patient, treatment and financial information</p>
                                </div>
                                <button
                                    onClick={() => setIsFormOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-10">
                                {/* Patient Information Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-wider text-xs">
                                        <User className="w-4 h-4" />
                                        Patient Information
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                                            <input
                                                {...register('patientName', { required: 'Name is required' })}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                placeholder="Patient's Full Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Age</label>
                                            <input
                                                type="number"
                                                {...register('age', { required: true, min: 0, max: 120 })}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                placeholder="45"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sex</label>
                                            <select
                                                {...register('sex', { required: true })}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                                            >
                                                <option value="M">Male</option>
                                                <option value="F">Female</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Insurance Information Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-wider text-xs">
                                        <Shield className="w-4 h-4" />
                                        Insurance & Billing
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Insurance Provider</label>
                                            <select
                                                {...register('insuranceProvider', { required: true })}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            >
                                                <option value="Star_Health">Star Health</option>
                                                <option value="HDFC_ERGO">HDFC ERGO</option>
                                                <option value="Niva_Bupa">Niva Bupa</option>
                                                <option value="ICICI_Lombard">ICICI Lombard</option>
                                                <option value="New_India_Assurance">New India Assurance</option>
                                                <option value="Bajaj_Allianz">Bajaj Allianz</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Policy Type</label>
                                            <select
                                                {...register('insuranceType', { required: true })}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            >
                                                <option value="Private">Private</option>
                                                <option value="Government">Government</option>
                                                <option value="Employer">Employer</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Treatment details */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-wider text-xs">
                                        <Stethoscope className="w-4 h-4" />
                                        Treatment & Systems
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
                                            <select
                                                {...register('departmentType', { required: true })}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            >
                                                <option value="Cardiology">Cardiology</option>
                                                <option value="Neurology">Neurology</option>
                                                <option value="Orthopedics">Orthopedics</option>
                                                <option value="Radiology">Radiology</option>
                                                <option value="Emergency">Emergency</option>
                                                <option value="Oncology">Oncology</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">EMR System</label>
                                            <select
                                                {...register('emrSystem', { required: true })}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            >
                                                <option value="Practo_EMR">Practo EMR</option>
                                                <option value="KareXpert">KareXpert</option>
                                                <option value="Epic_India">Epic India</option>
                                                <option value="Custom_Inhouse">Custom Inhouse</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Billing System</label>
                                            <select
                                                {...register('billingSystem', { required: true })}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            >
                                                <option value="Tally_Billing">Tally Billing</option>
                                                <option value="Oracle_Health">Oracle Health</option>
                                                <option value="SAP_Healthcare">SAP Healthcare</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Costs Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-amber-600 font-bold uppercase tracking-wider text-xs">
                                        <Activity className="w-4 h-4" />
                                        Financial Breakdown (₹)
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Medicine Cost</label>
                                            <input type="number" step="0.01" {...register('medicineCost', { required: true })} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Procedure Cost</label>
                                            <input type="number" step="0.01" {...register('procedureCost', { required: true })} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Room Charges</label>
                                            <input type="number" step="0.01" {...register('roomCharges', { required: true })} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Expected Ins. Pymt</label>
                                            <input type="number" step="0.01" {...register('expectedInsurancePayment', { required: true })} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div className="md:col-span-2 pt-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Patient Payable (Out of Pocket)</label>
                                            <input type="number" step="0.01" {...register('patientPayableAmount', { required: true })} className="w-full px-4 py-2 border border-blue-200 bg-blue-50/30 font-bold rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit area */}
                                <div className="pt-6 border-t border-slate-100 flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Analyzing...' : 'Submit for Prediction'}
                                        <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsFormOpen(false)}
                                        className="px-8 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all font-sans"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-slate-400 text-sm">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
                <div className="hidden sm:block text-slate-300">|</div>
                <div>HIPAA Compliant Data Repository</div>
            </div>
        </div>
    );
}
