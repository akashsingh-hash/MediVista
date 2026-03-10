import React from 'react';
import { motion } from 'framer-motion';
import { 
  Server, 
  Brain, 
  ShieldCheck, 
  Cpu, 
  ArrowUpRight,
  Sparkles,
  Zap,
  Globe,
  Database,
  Lock as LockIcon
} from 'lucide-react';

const techStack = [
  {
    category: 'Client Interface',
    icon: <Globe className="w-6 h-6" />,
    color: 'blue',
    items: [
      { name: 'React', slug: 'react', desc: 'State-driven UI' },
      { name: 'Vite', slug: 'vite', desc: 'Modern Tooling' },
      { name: 'Tailwind', slug: 'tailwindcss', desc: 'Design System' },
      { name: 'Framer', slug: 'framer', desc: 'Animations' },
    ]
  },
  {
    category: 'Backend Core',
    icon: <Server className="w-6 h-6" />,
    color: 'emerald',
    items: [
      { name: 'Spring Boot', slug: 'springboot', desc: 'Java Core' },
      { name: 'MySQL', slug: 'mysql', desc: 'Relational DB' },
      { name: 'Redis', slug: 'redis', desc: 'Fast Cache' },
    ]
  },
  {
    category: 'AI Engine',
    icon: <Brain className="w-6 h-6" />,
    color: 'indigo',
    items: [
      { name: 'FastAPI', slug: 'fastapi', desc: 'Python API' },
      { name: 'XGBoost', slug: 'xgboost', logo: 'https://raw.githubusercontent.com/dmlc/dmlc.github.io/master/img/logo-m/xgboost.png', desc: 'Classifier' },
      { name: 'Scikit-learn', slug: 'scikitlearn', desc: 'Data Science' },
      { name: 'Pandas', slug: 'pandas', desc: 'Manipulation' },
    ]
  },
  {
    category: 'DevOps & IAM',
    icon: <ShieldCheck className="w-6 h-6" />,
    color: 'rose',
    items: [
      { name: 'Docker', slug: 'docker', desc: 'Containers' },
      { name: 'Keycloak', slug: 'keycloak', desc: 'Identity' },
      { name: 'Security', slug: 'springsecurity', desc: 'Auth Layer' },
    ]
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function TechStack() {
  return (
    <div className="relative min-h-screen bg-[#020617] text-white overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-blue-600/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -right-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 font-black text-xs uppercase tracking-[0.3em] mb-8"
          >
            <Sparkles className="w-4 h-4" /> System Architecture v2.0
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
          >
            Powering <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
              Healthcare Intelligence
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-slate-400 font-medium leading-relaxed"
          >
            Our infrastructure is built on industry-leading technologies meticulously integrated 
            for maximum precision, real-time analysis, and enterprise-grade reliability.
          </motion.p>
        </div>

        {/* Tech Categories Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {techStack.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col gap-6">
              <div className="flex items-center gap-3 px-2">
                <div className={`p-2.5 rounded-xl bg-${group.color}-500/10 text-${group.color}-400 border border-${group.color}-500/20 shadow-lg shadow-${group.color}-500/10`}>
                  {group.icon}
                </div>
                <h2 className="text-sm font-black text-slate-300 uppercase tracking-[0.2em]">
                  {group.category}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {group.items.map((tech: any, techIdx) => (
                  <motion.div
                    key={techIdx}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="group relative bg-[#0f172a]/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-default overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-4 h-4 text-blue-400" />
                    </div>
                    
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                        <div className="relative w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2.5 shadow-2xl group-hover:rotate-6 transition-transform">
                          <img 
                            src={tech.logo || `https://cdn.simpleicons.org/${tech.slug}`} 
                            alt={tech.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-black text-white text-lg tracking-tight mb-0.5">
                          {tech.name}
                        </h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          {tech.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Footer Stats Line */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-32 pt-12 border-t border-slate-800/50 flex flex-wrap justify-center gap-16"
        >
          {[
            { label: 'Latency', value: '< 20ms', icon: <Zap className="w-5 h-5 text-amber-400" /> },
            { label: 'Security', value: 'OAuth 2.0', icon: <LockIcon className="w-5 h-5 text-rose-400" /> },
            { label: 'Compute', value: 'XGB-Optimized', icon: <Cpu className="w-5 h-5 text-indigo-400" /> },
            { label: 'Data', value: 'HIPAA-Ready', icon: <Database className="w-5 h-5 text-emerald-400" /> },
          ].map((stat, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="p-2 bg-slate-800/50 rounded-lg">{stat.icon}</div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <p className="text-lg font-black text-white tracking-tight leading-none">{stat.value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
