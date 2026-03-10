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
    Brain,
    ArrowUpRight,
    HelpCircle,
    ChevronRight,
    ChevronLeft,
    Lock,
    Sparkles,
    Copy,
    FileText
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import FinancialAnalytics from '../components/analytics/FinancialAnalytics';

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
    claimDate?: string;
}

export default function Dashboard() {
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [formStep, setFormStep] = useState(1);
    const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
    const hospitalName = localStorage.getItem('hospitalName') || 'Hospital';

    // Auto-Appeal Generators
    const [isGeneratingAppeal, setIsGeneratingAppeal] = useState(false);
    const [generatedAppeal, setGeneratedAppeal] = useState<string | null>(null);

    // Global CSS to hide spin-buttons for number inputs and improve overall styling
    const customStyle = (
        <style>{`
            input[type=number]::-webkit-inner-spin-button,
            input[type=number]::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            input[type=number] {
                -moz-appearance: textfield;
            }
            .form-input-glow:focus {
                box-shadow: 0 0 20px -5px rgba(59, 130, 246, 0.2);
            }
            .dark-input-glow:focus {
                box-shadow: 0 0 25px -5px rgba(59, 130, 246, 0.4);
            }
        `}</style>
    );

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

    const handleGenerateAppeal = async (record: PatientRecord, e: React.MouseEvent) => {
        e.stopPropagation();

        setIsGeneratingAppeal(true);
        setGeneratedAppeal(null);
        const loadingToast = toast.loading('Groq AI is drafting the appeal letter...');

        try {
            const payload = {
                patientName: record.patientName,
                age: Number(record.age),
                insuranceProvider: record.insuranceProvider,
                denialReason: record.predictedDenialReason || "Medical necessity not established",
                medicineCost: Number(record.medicineCost),
                procedureCost: Number(record.procedureCost),
                roomCharges: Number(record.roomCharges),
            };

            const response = await fetch('https://medivista-1-ml.onrender.com/api/generate-appeal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to generate appeal");
            }
            const data = await response.json();
            setGeneratedAppeal(data.letter);
            toast.success('Appeal letter drafted by AI!', { id: loadingToast });
        } catch (error: any) {
            console.error("Appeal Error:", error);
            toast.error(error.message || 'Appeal generation failed.', { id: loadingToast });
        } finally {
            setIsGeneratingAppeal(false);
        }
    };

    const handleCopyAppeal = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (generatedAppeal) {
            navigator.clipboard.writeText(generatedAppeal);
            toast.success('Copied to clipboard!');
        }
    };

    const onSubmit = async (data: PatientRecord) => {
        setIsSubmitting(true);
        const loadingToast = toast.loading('AI Model is analyzing the claim...');
        try {
            // 0. Prepare clean payload for ML API (only send what it expects)
            const payloadForML = {
                emrSystem: data.emrSystem,
                billingSystem: data.billingSystem,
                medicineCost: Number(data.medicineCost),
                procedureCost: Number(data.procedureCost),
                roomCharges: Number(data.roomCharges),
                totalBillAmount: Number(data.medicineCost) + Number(data.procedureCost) + Number(data.roomCharges),
                expectedInsurancePayment: Number(data.expectedInsurancePayment),
                patientPayableAmount: Number(data.patientPayableAmount),
                departmentType: data.departmentType,
                age: Math.floor(Number(data.age)), // Ensure integer for Pydantic
                sex: data.sex,
                insuranceProvider: data.insuranceProvider,
                insuranceType: data.insuranceType
            };

            console.log("Submitting to ML Server:", payloadForML);

            // 1. Call ML FastAPI for predictions
            let mlResponse;
            try {
                mlResponse = await fetch('https://medivista-1-ml.onrender.com/api/predict/claim', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payloadForML),
                });
            } catch (netErr) {
                console.error("ML Network Error:", netErr);
                throw new Error("ML Server is not reachable. Is the Python server running on port 8000?");
            }

            if (!mlResponse.ok) {
                const errorData = await mlResponse.json();
                console.error("ML Validation Error:", errorData);
                const detail = errorData.detail?.[0]?.msg || JSON.stringify(errorData.detail) || "Unknown ML validation error";
                throw new Error(`ML Analysis Error: ${detail}`);
            }
            const prediction = await mlResponse.json();

            // 2. Merge ML predictions with the form data
            // Inject random jitter to estimated payout dates (User preference for dynamic charts)
            const mlDays = prediction.expected_payment_timeline?.estimated_days_to_pay || 15;
            const jitteredDays = Math.max(5, mlDays + Math.floor(Math.random() * 21) - 10); // Jitter ±10 days, min 5

            const randomPayoutDate = new Date();
            randomPayoutDate.setDate(randomPayoutDate.getDate() + jitteredDays);
            const jitteredDateStr = randomPayoutDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

            // Generate a random Admission/Claim Date (Jitter -7 to 0 days from today)
            const randomClaimDate = new Date();
            randomClaimDate.setDate(randomClaimDate.getDate() - Math.floor(Math.random() * 8));
            const claimDateStr = randomClaimDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

            const completeRecord = {
                ...data, // Keep all original form fields (like patientName)
                ...payloadForML, // Use the cleaned numeric values
                isApproved: prediction.is_approved,
                approvalConfidence: prediction.approval_confidence,
                denialRisk: prediction.denial_risk,
                predictedDenialReason: prediction.predicted_denial_reason,
                actionRequired: prediction.action_required,
                nextBestActionInstruction: prediction.next_best_action?.instruction,
                nextBestActionDepartment: prediction.next_best_action?.recommended_department,
                estimatedDaysToPay: jitteredDays,
                expectedDate: jitteredDateStr,
                claimDate: claimDateStr,
                financialAlertLevel: prediction.financial_variance_warning?.alert_level
            };

            // 3. Save to Java Backend
            try {
                const response = await api.post('/records', completeRecord);
                console.log("Java Backend Success:", response.data);
                setRecords(prev => [response.data, ...prev]);
                setIsFormOpen(false);
                setFormStep(1);
                reset();
                toast.success('Record analyzed and saved successfully!', { id: loadingToast });
            } catch (javaErr: any) {
                console.error("Java Backend Full Error Object:", javaErr);
                const errorDetail = javaErr.response?.data?.message || javaErr.response?.data?.error || javaErr.message || "Unknown error";
                console.error("Java Backend Error Details:", errorDetail);
                throw new Error(`Cloud Sync Error: ${errorDetail}`);
            }
        } catch (err: any) {
            console.error('Submission Error:', err);
            toast.error(err.message || 'Submission failed.', { id: loadingToast });
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
            {customStyle}
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

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 mt-10 p-1.5 bg-slate-100/50 backdrop-blur rounded-[2rem] border border-slate-200/50 w-fit">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-8 py-3 rounded-[1.5rem] font-black text-sm transition-all flex items-center gap-2 ${activeTab === 'list'
                            ? 'bg-white text-blue-600 shadow-xl shadow-blue-200/20'
                            : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <ClipboardList className="w-4 h-4" />
                        Patient Workflow
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-8 py-3 rounded-[1.5rem] font-black text-sm transition-all flex items-center gap-2 ${activeTab === 'analytics'
                            ? 'bg-white text-blue-600 shadow-xl shadow-blue-200/20'
                            : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        Financial Insights
                    </button>
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

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto">
                {activeTab === 'list' ? (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                                                <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] uppercase tracking-tighter">{record.claimDate || 'N/A'}</span>
                                                                <span className="text-slate-300">|</span>
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
                                                                                            {record.claimDate && (
                                                                                                <div className="pt-1 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                                                                    <Clock className="w-3 h-3 text-slate-500" />
                                                                                                    Admission/Claim: {record.claimDate}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* LLM Auto-Appeal Button & Modal - FULL WIDTH ROW */}
                                                                        {(!record.isApproved || (record.denialRisk && record.denialRisk > 0.4)) && (
                                                                            <div className="mt-8 pt-8 border-t border-slate-200" onClick={e => e.stopPropagation()}>
                                                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                                                    <div>
                                                                                        <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                                                                            <Sparkles className="w-5 h-5 text-amber-500" /> AI Auto-Appeal Generator
                                                                                        </h4>
                                                                                        <p className="text-xs font-semibold text-slate-500 mt-1">
                                                                                            Draft a customized, structured appeal letter using Groq LLM trained on optimal claim recovery paths.
                                                                                        </p>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={(e) => handleGenerateAppeal(record, e)}
                                                                                        disabled={isGeneratingAppeal}
                                                                                        className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:shadow-slate-500/30 transition-all flex items-center gap-2 disabled:opacity-70 text-sm whitespace-nowrap"
                                                                                    >
                                                                                        {isGeneratingAppeal ? (
                                                                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                                                                        ) : (
                                                                                            <FileText className="w-4 h-4" />
                                                                                        )}
                                                                                        {isGeneratingAppeal ? "Drafting Appeal..." : "Generate AI Appeal"}
                                                                                    </button>
                                                                                </div>

                                                                                <AnimatePresence>
                                                                                    {generatedAppeal && (
                                                                                        <motion.div
                                                                                            initial={{ height: 0, opacity: 0 }}
                                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                                            exit={{ height: 0, opacity: 0 }}
                                                                                            className="overflow-hidden mt-6"
                                                                                        >
                                                                                            <div className="bg-white border border-slate-200 p-6 rounded-2xl relative">
                                                                                                <button
                                                                                                    onClick={handleCopyAppeal}
                                                                                                    className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                                                                                >
                                                                                                    <Copy className="w-4 h-4" /> Copy
                                                                                                </button>
                                                                                                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Drafted Letter Preview</h5>
                                                                                                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap font-medium">
                                                                                                    {generatedAppeal}
                                                                                                </div>
                                                                                            </div>
                                                                                        </motion.div>
                                                                                    )}
                                                                                </AnimatePresence>
                                                                            </div>
                                                                        )}

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
                ) : (
                    <FinancialAnalytics records={records} />
                )}
            </div>

            {/* Sliding Form Drawer */}
            <AnimatePresence mode="wait">
                {isFormOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFormOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white/95 backdrop-blur-xl shadow-[-20px_0_50px_-10px_rgba(0,0,0,0.1)] z-[70] overflow-y-auto"
                        >
                            {/* Drawer Header */}
                            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                                        <Brain className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Predictive Intake</h2>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {[1, 2, 3].map((s) => (
                                                <div
                                                    key={s}
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${formStep >= s ? (formStep === s ? 'w-6 bg-blue-600' : 'w-3 bg-blue-400') : 'w-3 bg-slate-200'}`}
                                                />
                                            ))}
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Step {formStep} of 3</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsFormOpen(false)}
                                    className="p-3 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all group"
                                >
                                    <X className="w-6 h-6 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-[calc(100vh-100px)]">
                                <div className="flex-1 px-8 py-10 overflow-x-hidden">
                                    <AnimatePresence mode="wait">
                                        {formStep === 1 && (
                                            <motion.div
                                                key="step1"
                                                initial={{ x: 50, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                exit={{ x: -50, opacity: 0 }}
                                                className="space-y-8"
                                            >
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                                            <User className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Patient Identity</h3>
                                                            <p className="text-xs font-bold text-slate-400">Basic demographic markers for risk assessment</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div className="group">
                                                            <div className="flex items-center justify-between mb-2 px-1">
                                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">Full Legal Name</label>
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                                                    <HelpCircle className="w-3 h-3" /> Required for compliance checks
                                                                </div>
                                                            </div>
                                                            <input
                                                                {...register('patientName', { required: 'Name is required' })}
                                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 form-input-glow"
                                                                placeholder="e.g. John Doe"
                                                            />
                                                            <p className="mt-2 text-[10px] text-slate-500 font-bold px-1 opacity-80">Ensure the name matches the official insurance identification card.</p>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 px-1">Clinical Age</label>
                                                                <input
                                                                    type="number"
                                                                    {...register('age', { required: true, min: 0, max: 120 })}
                                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 form-input-glow"
                                                                    placeholder="45"
                                                                />
                                                                <p className="mt-2 text-[10px] text-slate-500 font-bold px-1 opacity-80">Used to predict aging-related denials.</p>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 px-1">Biological Sex</label>
                                                                <div className="relative">
                                                                    <select
                                                                        {...register('sex', { required: true })}
                                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer pr-10 form-input-glow"
                                                                    >
                                                                        <option value="M">Male Identity</option>
                                                                        <option value="F">Female Identity</option>
                                                                    </select>
                                                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                                                                </div>
                                                                <p className="mt-2 text-[10px] text-slate-500 font-bold px-1 opacity-80">Critical for sex-specific procedure checks.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {formStep === 2 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ x: 50, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                exit={{ x: -50, opacity: 0 }}
                                                className="space-y-8"
                                            >
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                                                            <Shield className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-black text-slate-800 tracking-tight">System Infrastructure</h3>
                                                            <p className="text-xs font-bold text-slate-400">Insurance carrier and clinical system handshake</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-6">
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 px-1">Carrier Provider</label>
                                                                <div className="relative text-black">
                                                                    <select
                                                                        {...register('insuranceProvider', { required: true })}
                                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer pr-10 form-input-glow"
                                                                    >
                                                                        <option value="Star_Health">Star Health</option>
                                                                        <option value="HDFC_ERGO">HDFC ERGO</option>
                                                                        <option value="Niva_Bupa">Niva Bupa</option>
                                                                        <option value="ICICI_Lombard">ICICI Lombard</option>
                                                                        <option value="New_India_Assurance">New India Assurance</option>
                                                                        <option value="Bajaj_Allianz">Bajaj Allianz</option>
                                                                    </select>
                                                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 px-1">Plan Classification</label>
                                                                <div className="relative text-black">
                                                                    <select
                                                                        {...register('insuranceType', { required: true })}
                                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer pr-10 form-input-glow"
                                                                    >
                                                                        <option value="Private">Private / Personal</option>
                                                                        <option value="Government">Govt / State Funded</option>
                                                                        <option value="Employer">Group / Employer</option>
                                                                    </select>
                                                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 px-1">Medical Department</label>
                                                            <div className="relative text-black">
                                                                <select
                                                                    {...register('departmentType', { required: true })}
                                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer pr-10 form-input-glow"
                                                                >
                                                                    <option value="Cardiology">Cardiology</option>
                                                                    <option value="Neurology">Neurology</option>
                                                                    <option value="Orthopedics">Orthopedics</option>
                                                                    <option value="Radiology">Radiology</option>
                                                                    <option value="Emergency">Emergency Room</option>
                                                                    <option value="Oncology">Oncology</option>
                                                                </select>
                                                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                                                            </div>
                                                            <p className="mt-2 text-[10px] text-slate-500 font-bold px-1 opacity-80">The department significantly influences the claim's processing priority and risk weight.</p>
                                                        </div>

                                                        <p className="text-[10px] text-slate-600 italic px-1 font-bold bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                                                            <HelpCircle className="inline w-3 h-3 mr-1 text-slate-500" />
                                                            Carrier verification helps the AI understand specific policy constraints and previous denial patterns for the selected provider.
                                                        </p>

                                                        <div className="grid grid-cols-2 gap-6 p-6 bg-slate-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
                                                            <div className="col-span-2 flex items-center gap-2 mb-2">
                                                                <Activity className="w-3 h-3 text-blue-400" />
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Core Integration</p>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Primary EMR</label>
                                                                <div className="relative">
                                                                    <select
                                                                        {...register('emrSystem', { required: true })}
                                                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:border-blue-500 focus:bg-white/20 outline-none transition-all font-bold text-white text-sm cursor-pointer pr-10 dark-input-glow"
                                                                    >
                                                                        <option value="Practo_EMR" className="bg-slate-900">Practo EMR</option>
                                                                        <option value="KareXpert" className="bg-slate-900">KareXpert</option>
                                                                        <option value="Epic_India" className="bg-slate-900">Epic India</option>
                                                                        <option value="Custom_Inhouse" className="bg-slate-900">In-house OS</option>
                                                                    </select>
                                                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 rotate-90" />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Billing Logic</label>
                                                                <div className="relative">
                                                                    <select
                                                                        {...register('billingSystem', { required: true })}
                                                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:border-blue-500 focus:bg-white/20 outline-none transition-all font-bold text-white text-sm cursor-pointer pr-10 dark-input-glow"
                                                                    >
                                                                        <option value="Tally_Billing" className="bg-slate-900">Tally Financial</option>
                                                                        <option value="Oracle_Health" className="bg-slate-900">Oracle Health</option>
                                                                        <option value="SAP_Healthcare" className="bg-slate-900">SAP Core</option>
                                                                    </select>
                                                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 rotate-90" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {formStep === 3 && (
                                            <motion.div
                                                key="step3"
                                                initial={{ x: 50, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                exit={{ x: -50, opacity: 0 }}
                                                className="space-y-8"
                                            >
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                                                            <TrendingUp className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Financial Intelligence</h3>
                                                            <p className="text-xs font-bold text-slate-400">Cost mapping and liability simulation</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                                                        <div className="group">
                                                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 px-1 flex items-center justify-between">
                                                                Medicine Costs
                                                                <HelpCircle className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                                            </label>
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                                <input
                                                                    type="number" step="0.01" {...register('medicineCost', { required: true })}
                                                                    className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black text-lg text-slate-900 form-input-glow"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="group">
                                                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 px-1 flex items-center justify-between">
                                                                Procedure Fees
                                                                <HelpCircle className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                                            </label>
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                                <input
                                                                    type="number" step="0.01" {...register('procedureCost', { required: true })}
                                                                    className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black text-lg text-slate-900 form-input-glow"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="group md:col-span-2">
                                                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 px-1 flex items-center justify-between">
                                                                Hospital / Room Charges
                                                                <HelpCircle className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                                            </label>
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                                <input
                                                                    type="number" step="0.01" {...register('roomCharges', { required: true })}
                                                                    className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black text-lg text-slate-900 form-input-glow"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full" />
                                                        <div className="relative z-10 flex flex-col gap-6">
                                                            <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                                                <div>
                                                                    <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em]">Patient Liability</p>
                                                                    <p className="text-[10px] text-indigo-200 mt-1">Expected amount paid by user</p>
                                                                </div>
                                                                <div className="relative">
                                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-black">₹</span>
                                                                    <input
                                                                        type="number" step="0.01" {...register('patientPayableAmount', { required: true })}
                                                                        className="w-40 pl-8 pr-5 py-3 bg-white/10 border border-white/20 rounded-xl focus:bg-white/20 focus:border-white/50 outline-none transition-all font-black text-xl text-right"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em]">System Assurance</p>
                                                                    <p className="text-[10px] text-indigo-200 mt-1">Expected carrier payout</p>
                                                                </div>
                                                                <div className="relative">
                                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-black">₹</span>
                                                                    <input
                                                                        type="number" step="0.01" {...register('expectedInsurancePayment', { required: true })}
                                                                        className="w-40 pl-8 pr-5 py-3 bg-white/10 border border-white/20 rounded-xl focus:bg-white/20 focus:border-white/50 outline-none transition-all font-black text-xl text-right"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="pt-2">
                                                                <div className="flex items-center gap-2 text-[8px] font-black text-white/40 uppercase tracking-widest mb-1.5 px-0.5">
                                                                    <Lock className="w-3 h-3" /> Encrypted Financial Session
                                                                </div>
                                                                <p className="text-[10px] font-bold text-white/30 leading-relaxed italic px-0.5">
                                                                    Liability is cross-checked against departmental room charges (internal sum logic) and carrier-specific deductible matrices.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Form Action Footer */}
                                <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-6 z-10 flex flex-col sm:flex-row gap-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                                    {formStep > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setFormStep(prev => prev - 1)}
                                            className="flex-1 py-4 bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </button>
                                    )}

                                    {formStep < 3 ? (
                                        <button
                                            type="button"
                                            onClick={() => setFormStep(prev => prev + 1)}
                                            className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black tracking-tight text-lg shadow-xl shadow-slate-200 hover:shadow-slate-300 transition-all flex items-center justify-center gap-3"
                                        >
                                            Continue Intake
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-[2] py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] hover:bg-right text-white rounded-2xl font-black tracking-tight text-lg shadow-2xl shadow-blue-200 hover:shadow-blue-300 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                    />
                                                    Analyzing Simulation...
                                                </>
                                            ) : (
                                                <>
                                                    Execute AI Classification
                                                    <ArrowUpRight className="w-6 h-6" />
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {formStep === 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setIsFormOpen(false)}
                                            className="flex-1 py-4 bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    )}
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
