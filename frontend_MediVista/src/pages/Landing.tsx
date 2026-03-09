import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  ClipboardList,
  Sparkles,
  ArrowRight,
  BarChart3,
  Clock,
  TrendingUp,
  Target,
  CheckCircle2,
  Database,
  Brain,
  Activity,
} from 'lucide-react';
import FeatureCard from '../components/FeatureCard';
import Footer from '../components/Footer';

export default function Landing() {
  const features = [
    {
      icon: Users,
      title: 'Patient Data Management',
      description:
        'Centralized patient information with secure access controls and comprehensive health records management.',
    },
    {
      icon: ShieldCheck,
      title: 'Insurance & Billing Integration',
      description:
        'Seamlessly integrate with major insurance providers and automate billing workflows for faster processing.',
    },
    {
      icon: ClipboardList,
      title: 'Claim Processing Analytics',
      description:
        'Real-time tracking and analytics for claim submissions, approvals, and denial patterns.',
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Insights',
      description:
        'Machine learning algorithms predict claim outcomes and identify optimization opportunities.',
    },
  ];

  const steps = [
    {
      number: '01',
      icon: Database,
      title: 'Data Entry',
      description: 'Import patient and insurance data from multiple sources',
    },
    {
      number: '02',
      icon: ClipboardList,
      title: 'Claim Generation',
      description: 'Automated billing and claim generation with validation',
    },
    {
      number: '03',
      icon: Brain,
      title: 'ML Evaluation',
      description: 'AI-powered prediction and claim evaluation',
    },
    {
      number: '04',
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Real-time insights and operational intelligence',
    },
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Reduced Denial Rates',
      description: 'Lower claim denial rates by up to 40% with predictive analytics',
    },
    {
      icon: Clock,
      title: 'Faster Reimbursement',
      description: 'Accelerate payment cycles by 60% with automated workflows',
    },
    {
      icon: Target,
      title: 'Operational Visibility',
      description: 'Complete transparency across your revenue cycle operations',
    },
    {
      icon: CheckCircle2,
      title: 'Data-Driven Decisions',
      description: 'Make informed decisions with comprehensive analytics',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 opacity-95"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Operational Intelligence for
              <br />
              <span className="text-cyan-300 drop-shadow-md">Healthcare Revenue Cycles</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-50 mb-10 max-w-3xl mx-auto leading-relaxed">
              MediVista empowers hospitals with real-time analytics, claim monitoring,
              and AI-powered insights to optimize revenue cycle management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2 group"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 bg-blue-700/50 backdrop-blur-sm text-white rounded-lg font-semibold text-lg hover:bg-blue-700/70 transition-all border-2 border-white/30">
                View Dashboard Demo
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 relative"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <Activity className="w-10 h-10 text-white mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">40%</div>
                  <div className="text-blue-100 text-sm">Fewer Denials</div>
                </div>
                <div className="text-center">
                  <Clock className="w-10 h-10 text-white mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">60%</div>
                  <div className="text-blue-100 text-sm">Faster Payments</div>
                </div>
                <div className="text-center">
                  <Users className="w-10 h-10 text-white mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">500+</div>
                  <div className="text-blue-100 text-sm">Hospitals</div>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-10 h-10 text-white mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">₹15Cr+</div>
                  <div className="text-blue-100 text-sm">Revenue Saved</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Powerful Features for Healthcare Operations
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need to streamline your revenue cycle management in one platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              A streamlined workflow from data entry to actionable insights
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white font-bold text-2xl mb-4">
                    {step.number}
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-teal-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-blue-300 to-teal-300"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Transform Your Operations
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Real results that impact your bottom line
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/70 backdrop-blur-md rounded-2xl p-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all border border-white/50 text-center"
              >
                <div className="bg-gradient-to-br from-blue-100 to-teal-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-900 to-teal-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Transform Healthcare Revenue Operations
            </h2>
            <p className="text-xl text-blue-50 mb-10 max-w-2xl mx-auto">
              Join hundreds of healthcare organizations already optimizing their revenue cycles with MediVista
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:shadow-2xl transition-all group"
            >
              Start Using MediVista
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
