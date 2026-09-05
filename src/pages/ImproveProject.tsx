import { fetchApi } from '../utils/api';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ImprovementAnalysis } from '../types';
import { Loader2, Sparkles, AlertTriangle, Lightbulb, ShieldAlert, Wrench, Crosshair, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function ImproveProject() {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImprovementAnalysis | null>(null);

  if (!user) return <Navigate to="/" />;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi('/api/improve-project', { method: 'POST', body: JSON.stringify({ description }) });
      setAnalysis(data.improvement);
    } catch (err: unknown) {
      console.error(err);
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to analyze project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 max-w-4xl mx-auto w-full">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-neutral-900 mb-3">Improve My Project</h1>
        <p className="text-neutral-600">Enter your existing project idea or current progress. Our AI will analyze it for risks, missing features, and technical improvements.</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm mb-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-800">Analysis Failed</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}
        <form onSubmit={handleAnalyze}>
          <label htmlFor="projectDescription" className="block text-sm font-bold text-neutral-700 mb-2">Project Description</label>
          <textarea id="projectDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your project, the problem it solves, the features you have planned, and your tech stack..."
            rows={5}
            className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-4 resize-none transition-shadow shadow-sm"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!description.trim() || loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Sparkles className="w-5 h-5" /> Analyze Project</>}
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {analysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-blue-900 font-bold mb-3 flex items-center gap-2 text-lg"><Crosshair className="w-5 h-5"/> Realistic MVP Scope</h3>
              <p className="text-blue-800 leading-relaxed">{analysis.realisticMvpScope}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnalysisCard 
                title="Weaknesses" 
                icon={<AlertTriangle className="w-5 h-5 text-red-500"/>} 
                items={analysis.weaknesses}
                bgClass="bg-red-50/50"
                borderClass="border-red-100"
              />
              <AnalysisCard 
                title="Missing Features" 
                icon={<Lightbulb className="w-5 h-5 text-amber-500"/>} 
                items={analysis.missingFeatures}
                bgClass="bg-amber-50/50"
                borderClass="border-amber-100"
              />
              <AnalysisCard 
                title="Technical Risks" 
                icon={<Wrench className="w-5 h-5 text-orange-500"/>} 
                items={analysis.technicalRisks}
                bgClass="bg-orange-50/50"
                borderClass="border-orange-100"
              />
              <AnalysisCard 
                title="Security Concerns" 
                icon={<ShieldAlert className="w-5 h-5 text-rose-500"/>} 
                items={analysis.securityConcerns}
                bgClass="bg-rose-50/50"
                borderClass="border-rose-100"
              />
              <AnalysisCard 
                title="Scalability Issues" 
                icon={<TrendingUp className="w-5 h-5 text-indigo-500"/>} 
                items={analysis.scalabilityIssues}
                bgClass="bg-indigo-50/50"
                borderClass="border-indigo-100"
              />
              <AnalysisCard 
                title="Innovation Improvements" 
                icon={<Sparkles className="w-5 h-5 text-emerald-500"/>} 
                items={analysis.innovationImprovements}
                bgClass="bg-emerald-50/50"
                borderClass="border-emerald-100"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnalysisCard({ title, icon, items, bgClass, borderClass }: { title: string, icon: React.ReactNode, items: string[], bgClass: string, borderClass: string }) {
  return (
    <div className={cn("border rounded-2xl p-5 shadow-sm", bgClass, borderClass)}>
      <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2 text-lg">
        {icon} {title}
      </h3>
      <ul className="space-y-3">
        {items?.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
            <span className="text-neutral-400 mt-0.5 font-bold">›</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
