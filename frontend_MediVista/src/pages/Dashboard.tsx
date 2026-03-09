import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    X,
    Search,
    Filter,
    Download,
    ClipboardList,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
    Activity,
    User,
    Shield,
    Stethoscope,
    ChevronRight,
    TrendingUp,
    Clock,
    LayoutDashboard
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';

interface PatientRecord {
    id?: number;
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
}

export default function Dashboard() {
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
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
            console.error('Failed to fetch records', err);
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: PatientRecord) => {
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
                actionRequired: prediction.action_required
            };

            // 3. Save to Java Backend
            await api.post('/records', completeRecord);
            await fetchRecords();
            setIsFormOpen(false);
            reset();
        } catch (err) {
            console.error('Failed to run prediction or create record', err);
            alert('Error processing the claim prediction. Please check if ML API is running and inputs are valid.');
        }
    };

    const filteredRecords = records.filter(record =>
        record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.insuranceProvider.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                            <LayoutDashboard className="w-8 h-8 text-blue-600" />
                            {hospitalName} Dashboard
                        </h1>
                        <p className="text-slate-600">Overview of patient records and claim status</p>
                    </div>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        New Patient Record
                    </button>
                </div>
            </div>

            {/* Stats Section */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Records', value: records.length, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-100' },
                    { label: 'Approved Claims', value: records.filter(r => r.isApproved).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                    { label: 'Pending/At Risk', value: records.filter(r => !r.isApproved && r.denialRisk && r.denialRisk > 0.4).length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
                    { label: 'Avg Denial Risk', value: records.length ? `${(records.reduce((acc, current) => acc + (current.denialRisk || 0), 0) / records.length * 100).toFixed(1)}%` : '0%', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className={`${stat.bg} p-3 rounded-xl`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content: Search and Table */}
            <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patients or insurance..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 font-medium">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 font-medium">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-sm font-semibold">
                            <tr>
                                <th className="px-6 py-4">Patient Name</th>
                                <th className="px-6 py-4">Insurance</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Predictive Status</th>
                                <th className="px-6 py-4">Risk Level</th>
                                <th className="px-6 py-4">Total Amount</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <Activity className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                                        Loading records...
                                    </td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record, idx) => (
                                    <React.Fragment key={record.id || idx}>
                                        <tr className="hover:bg-slate-50/50 transition-colors selection:bg-blue-100">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">{record.patientName}</div>
                                                <div className="text-xs text-slate-500">{record.age} years • {record.sex}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-700">{record.insuranceProvider.replace('_', ' ')}</div>
                                                <div className="text-xs text-slate-500">{record.insuranceType}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wider">
                                                    {record.departmentType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {record.isApproved ? (
                                                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-sm">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Approved
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-rose-600 font-semibold text-sm">
                                                            <AlertCircle className="w-4 h-4" />
                                                            Denied / High Risk
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-slate-400">({((record.approvalConfidence || 0) * 100).toFixed(0)}%)</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-full bg-slate-100 rounded-full h-2 max-w-[100px] mb-1">
                                                    <div
                                                        className={`h-2 rounded-full ${(record.denialRisk || 0) > 0.6 ? 'bg-rose-500' : (record.denialRisk || 0) > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`}
                                                        style={{ width: `${(record.denialRisk || 0) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] uppercase font-bold text-slate-500">
                                                    {((record.denialRisk || 0) * 100).toFixed(0)}% Denial Risk
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                ₹{(record.medicineCost + record.procedureCost + record.roomCharges).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-lg hover:bg-white">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                        {/* AI Insight Row */}
                                        {record.actionRequired && (
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <td colSpan={7} className="px-6 py-3">
                                                    <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
                                                        <div className={`p-2 rounded-lg mt-0.5 ${record.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {record.isApproved ? <CheckCircle2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                                AI Copilot Insights
                                                                {record.predictedDenialReason && (
                                                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[10px] uppercase tracking-wider font-bold">
                                                                        Flag: {record.predictedDenialReason}
                                                                    </span>
                                                                )}
                                                            </h4>
                                                            <p className="text-sm text-slate-600 mt-1">{record.actionRequired}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
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
                                        className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                                    >
                                        Submit for Prediction
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
