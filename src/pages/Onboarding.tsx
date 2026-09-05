import { fetchApi } from "../utils/api";
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Pickaxe, ArrowRight, ArrowLeft, Loader2, CheckCircle2, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectIdea } from '../types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';

const schema = z.object({
  branch: z.string().min(2, "Branch is required"),
  interests: z.string().min(2, "Interests are required"),
  skills: z.string().min(2, "Skills are required"),
  proficiency: z.string().min(2, "Proficiency is required"),
  career: z.string().min(2, "Career interests are required"),
  technologies: z.string().min(2, "Preferred technologies are required"),
  teamSize: z.string().min(1, "Team size is required"),
  timeAvailable: z.string().min(2, "Time available is required"),
  budget: z.string().min(2, "Budget is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  domain: z.string().min(2, "Domain is required"),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 'academic', title: 'Academic Profile', fields: ['branch', 'interests', 'career'] },
  { id: 'skills', title: 'Technical Skills', fields: ['skills', 'proficiency', 'technologies'] },
  { id: 'logistics', title: 'Project Logistics', fields: ['teamSize', 'timeAvailable', 'budget'] },
  { id: 'preferences', title: 'Preferences', fields: ['difficulty', 'domain'] },
];

export function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatedIdeas, setGeneratedIdeas] = useState<ProjectIdea[]>([]);
  const [selectingIdea, setSelectingIdea] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, trigger } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  });

  if (!user) return <Navigate to="/" />;

  const handleNext = async () => {
    const fields = STEPS[currentStep].fields as (keyof FormData)[];
    const isValid = await trigger(fields);
    if (isValid) {
      setCurrentStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(s => s - 1);
  };

  const onSubmit = async (data: FormData) => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const result = await fetchApi('/api/generate-projects', { method: 'POST', body: JSON.stringify({ formData: data }) });
      
      if (result.ideas && Array.isArray(result.ideas)) {
        setGeneratedIdeas(result.ideas);
      } else {
        throw new Error('Invalid data format received from AI');
      }
    } catch (err: any) {
      console.error(err);
      setGenerateError(err.message || 'Failed to generate ideas. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const selectIdea = async (idea: ProjectIdea) => {
    setSelectingIdea(idea.title);
    setSelectError(null);
    try {
      // 1. Reality Check
      const evalResult = await fetchApi('/api/evaluate-project', { method: 'POST', body: JSON.stringify({ project: idea }) });

      // 2. Blueprint
      const bpResult = await fetchApi('/api/generate-blueprint', { method: 'POST', body: JSON.stringify({ project: idea }) });

      // 3. Save to Firestore
      const projectData = {
        ...idea,
        userId: user.uid,
        realityCheck: evalResult.evaluation,
        blueprint: bpResult.blueprint,
        roadmapProgress: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, 'projects'), projectData);
      navigate(`/project/${docRef.id}`);
    } catch (err: any) {
      console.error(err);
      setSelectError(err.message || 'Failed to process the selected idea.');
      setSelectingIdea(null);
    }
  };

  if (generatedIdeas.length > 0) {
    return (
      <div className="py-8 max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mb-4 tracking-tight">Your Personalized Project Ideas</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            We've generated these ideas based on your profile. Select one to generate a full technical blueprint and reality check.
          </p>
        </div>

        {selectError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 max-w-2xl mx-auto">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-800">Processing Failed</h4>
              <p className="text-sm text-red-600 mt-1">{selectError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {generatedIdeas.map((idea, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {idea.difficulty}
                </span>
                <span className="text-sm font-medium text-neutral-500">{idea.duration}</span>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">{idea.title}</h3>
              <p className="text-neutral-600 mb-4 font-medium">{idea.concept}</p>
              
              <div className="mb-4">
                <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-1">Problem</h4>
                <p className="text-sm text-neutral-600">{idea.problemStatement}</p>
              </div>

              <div className="mb-6 flex-1">
                <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-2">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {idea.techStack?.map((tech, i) => (
                    <span key={i} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded border border-neutral-200">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => selectIdea(idea)}
                disabled={selectingIdea !== null}
                className={cn(
                  "w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                  selectingIdea === idea.title 
                    ? "bg-blue-100 text-blue-700 cursor-not-allowed" 
                    : selectingIdea !== null
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      : "bg-neutral-900 text-white hover:bg-neutral-800 hover:shadow-md"
                )}
              >
                {selectingIdea === idea.title ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Forging Blueprint...
                  </>
                ) : (
                  <>
                    <Pickaxe className="w-4 h-4" />
                    Select & Build Blueprint
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-2xl mx-auto w-full">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-neutral-900 mb-3 tracking-tight">Project Idea Generator</h1>
        <p className="text-neutral-600">Tell us about your skills and goals to get personalized project recommendations.</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-200 rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-300"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          ></div>
          
          {STEPS.map((step, idx) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors border-2",
                idx < currentStep ? "bg-blue-600 border-blue-600 text-white" :
                idx === currentStep ? "bg-white border-blue-600 text-blue-600" :
                "bg-white border-neutral-300 text-neutral-400"
              )}>
                {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-4 font-semibold text-neutral-700">
          {STEPS[currentStep].title}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        {generateError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-800">Generation Failed</h4>
              <p className="text-sm text-red-600 mt-1">{generateError}</p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {currentStep === 0 && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Academic Branch / Specialization</label>
                    <input {...register('branch')} placeholder="e.g. Computer Science, Information Technology" className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2.5" />
                    {errors.branch && <p className="text-red-500 text-sm mt-1">{errors.branch.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Primary Interests</label>
                    <input {...register('interests')} placeholder="e.g. Machine Learning, Web Dev, IoT" className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2.5" />
                    {errors.interests && <p className="text-red-500 text-sm mt-1">{errors.interests.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Career Aspiration</label>
                    <input {...register('career')} placeholder="e.g. Full Stack Engineer, Data Scientist" className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2.5" />
                    {errors.career && <p className="text-red-500 text-sm mt-1">{errors.career.message}</p>}
                  </div>
                </>
              )}

              {currentStep === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Technical Skills</label>
                    <input {...register('skills')} placeholder="e.g. Python, React, SQL, AWS" className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2.5" />
                    {errors.skills && <p className="text-red-500 text-sm mt-1">{errors.skills.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">General Proficiency Level</label>
                    <select {...register('proficiency')} className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2.5 bg-white">
                      <option value="">Select proficiency...</option>
                      <option value="Beginner">Beginner (Familiar with syntax)</option>
                      <option value="Intermediate">Intermediate (Built some projects)</option>
                      <option value="Advanced">Advanced (Confident in building full systems)</option>
                    </select>
                    {errors.proficiency && <p className="text-red-500 text-sm mt-1">{errors.proficiency.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Preferred Technologies</label>
                    <input {...register('technologies')} placeholder="e.g. Next.js, Firebase, PyTorch" className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2.5" />
                    {errors.technologies && <p className="text-red-500 text-sm mt-1">{errors.technologies.message}</p>}
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Team Size</label>
                    <select {...register('teamSize')} className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2.5 bg-white">
                      <option value="">Select team size...</option>
                      <option value="Individual">Individual</option>
                      <option value="2 members">2 members</option>
                      <option value="3-4 members">3-4 members</option>
                      <option value="5+ members">5+ members</option>
                    </select>
                    {errors.teamSize && <p className="text-red-500 text-sm mt-1">{errors.teamSize.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Time Available (approx)</label>
                    <select {...register('timeAvailable')} className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2.5 bg-white">
                      <option value="">Select time...</option>
                      <option value="1-2 months">1-2 months</option>
                      <option value="3-4 months (one semester)">3-4 months (one semester)</option>
                      <option value="6-8 months (two semesters)">6-8 months (two semesters)</option>
                    </select>
                    {errors.timeAvailable && <p className="text-red-500 text-sm mt-1">{errors.timeAvailable.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Approximate Budget</label>
                    <select {...register('budget')} className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2.5 bg-white">
                      <option value="">Select budget...</option>
                      <option value="$0 (Free tier only)">$0 (Free tier only)</option>
                      <option value="<$50">Under $50</option>
                      <option value="<$200">Under $200</option>
                      <option value="$200+">$200+</option>
                    </select>
                    {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget.message}</p>}
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Preferred Difficulty</label>
                    <select {...register('difficulty')} className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2.5 bg-white">
                      <option value="">Select difficulty...</option>
                      <option value="Safe & Standard">Safe & Standard (High chance of completion)</option>
                      <option value="Moderate Challenge">Moderate Challenge (Learn some new things)</option>
                      <option value="Ambitious">Ambitious (High risk, high reward)</option>
                    </select>
                    {errors.difficulty && <p className="text-red-500 text-sm mt-1">{errors.difficulty.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Target Domain / Industry</label>
                    <input {...register('domain')} placeholder="e.g. Healthcare, Education, FinTech, Sustainability" className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2.5" />
                    {errors.domain && <p className="text-red-500 text-sm mt-1">{errors.domain.message}</p>}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between pt-6 border-t border-neutral-100 mt-8">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0 || generating}
              className="px-5 py-2.5 rounded-lg font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            
            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-neutral-900 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-2"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={generating}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Projects
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
