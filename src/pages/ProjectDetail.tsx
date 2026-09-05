import { fetchApi } from '../utils/api';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ProjectIdea, MentorMessage } from '../types';
import { CheckCircle2, Circle, AlertTriangle, TrendingUp, Lightbulb, Pickaxe, BrainCircuit, Loader2, Send } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';

export function ProjectDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const [project, setProject] = useState<ProjectIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reality' | 'blueprint' | 'mentor'>('overview');

  const toggleTaskComplete = async (phaseIndex: number, taskIndex: number) => {
    if (!project || !id) return;
    const taskKey = `${phaseIndex}-${taskIndex}`;
    const newProgress = {
      ...project.roadmapProgress,
      [taskKey]: !project.roadmapProgress?.[taskKey]
    };
    
    setProject({ ...project, roadmapProgress: newProgress });

    try {
      await updateDoc(doc(db, 'projects', id), {
        roadmapProgress: newProgress
      });
    } catch (error) {
      console.error('Failed to update task progress', error);
      // Rollback would go here in production
    }
  };

  useEffect(() => {
    if (!user || !id) return;
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          setProject({ id: docSnap.id, ...docSnap.data() } as ProjectIdea);
          
          // Fetch chat history
          const msgQuery = query(collection(db, 'projects', id, 'messages'), orderBy('createdAt', 'asc'));
          const msgSnap = await getDocs(msgQuery);
          setMessages(msgSnap.docs.map(d => ({ id: d.id, ...d.data() } as MentorMessage)));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMentorMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !id || chatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    const newUserMsg: MentorMessage = {
      role: 'user',
      content: userMsg,
      createdAt: Date.now()
    };
    
    // Optimistic update
    setMessages(prev => [...prev, newUserMsg]);

    try {
      // 1. Save user msg to DB
      await addDoc(collection(db, 'projects', id, 'messages'), newUserMsg);
      
      // 2. Call API
      const data = await fetchApi('/api/mentor-chat', { method: 'POST', body: JSON.stringify({ message: userMsg, history: messages, projectContext: project, profile: project?.profile }) });
      
      // 3. Save model msg to DB
      const modelMsg: MentorMessage = {
        role: 'model',
        content: data.reply,
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'projects', id, 'messages'), modelMsg);
      setMessages(prev => [...prev, modelMsg]);

    } catch (err: unknown) {
      console.error(err);
      const errorMsg: MentorMessage = {
        role: 'model',
        content: `Sorry, I encountered an error: ${(err instanceof Error ? err.message : String(err))}. Please try asking again.`,
        createdAt: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!user) return <Navigate to="/" />;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!project) return <div className="py-20 text-center">Project not found or access denied.</div>;

  return (
    <div className="py-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{project.difficulty}</span>
          <span className="text-sm font-medium text-neutral-500">{project.duration}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-neutral-900">{project.title}</h1>
        <p className="text-lg text-neutral-600 mt-2">{project.concept}</p>
      </div>

      <div className="flex space-x-1 bg-neutral-100 p-1 rounded-xl mb-6 flex-shrink-0 overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={cn("px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2", activeTab === 'overview' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200")}>
          <Lightbulb className="w-4 h-4" /> Overview
        </button>
        <button onClick={() => setActiveTab('reality')} className={cn("px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2", activeTab === 'reality' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200")}>
          <TrendingUp className="w-4 h-4" /> Reality Check
        </button>
        <button onClick={() => setActiveTab('blueprint')} className={cn("px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2", activeTab === 'blueprint' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200")}>
          <Pickaxe className="w-4 h-4" /> Tech Blueprint
        </button>
        <button onClick={() => setActiveTab('mentor')} className={cn("px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2", activeTab === 'mentor' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200")}>
          <BrainCircuit className="w-4 h-4" /> Mentor Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 sm:p-8">
        
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section>
              <h3 className="text-lg font-bold text-neutral-900 mb-3 border-b border-neutral-100 pb-2">The Problem</h3>
              <p className="text-neutral-700 leading-relaxed">{project.problemStatement}</p>
            </section>
            <section>
              <h3 className="text-lg font-bold text-neutral-900 mb-3 border-b border-neutral-100 pb-2">Target Users</h3>
              <p className="text-neutral-700 leading-relaxed">{project.targetUsers}</p>
            </section>
            <section>
              <h3 className="text-lg font-bold text-neutral-900 mb-3 border-b border-neutral-100 pb-2">Proposed Solution</h3>
              <p className="text-neutral-700 leading-relaxed">{project.proposedSolution}</p>
            </section>
            <section>
              <h3 className="text-lg font-bold text-neutral-900 mb-3 border-b border-neutral-100 pb-2">Key Features</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {project.features?.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-neutral-700 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {activeTab === 'reality' && project.realityCheck && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <ScoreCard title="Feasibility" score={project.realityCheck.feasibilityScore} />
              <ScoreCard title="Innovation" score={project.realityCheck.innovationScore} />
              <ScoreCard title="Complexity" score={project.realityCheck.complexityScore} />
              <ScoreCard title="Cost / Budget" score={project.realityCheck.costScore} />
              <ScoreCard title="Time Suitability" score={project.realityCheck.timeSuitability} />
              <ScoreCard title="Skill Match" score={project.realityCheck.skillMatchScore} />
            </div>
            <section className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
              <h3 className="text-blue-900 font-bold mb-2 flex items-center gap-2"><TrendingUp className="w-5 h-5"/> Evaluation Summary</h3>
              <p className="text-blue-800 text-sm leading-relaxed mb-4">{project.realityCheck.explanation}</p>
              
              {project.realityCheck.mentorVerdict && (
                <>
                  <h4 className="text-blue-900 font-bold mb-1 text-sm">Mentor's Verdict</h4>
                  <p className="text-blue-800 text-sm leading-relaxed italic border-l-4 border-blue-300 pl-3">{project.realityCheck.mentorVerdict}</p>
                </>
              )}
            </section>
            
            {project.realityCheck.realisticMvpScope && (
              <section className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
                <h3 className="text-emerald-900 font-bold mb-2">Realistic MVP Scope</h3>
                <p className="text-emerald-800 text-sm leading-relaxed">{project.realityCheck.realisticMvpScope}</p>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section>
                <h3 className="text-lg font-bold text-neutral-900 mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500"/> Project Risks</h3>
                <ul className="space-y-2">
                  {project.realityCheck.risks?.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                      <span className="text-amber-500 font-bold mt-0.5">•</span> {r}
                    </li>
                  ))}
                </ul>
              </section>
              
              <section>
                <h3 className="text-lg font-bold text-neutral-900 mb-3 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-purple-500"/> Skill Gaps</h3>
                <ul className="space-y-2">
                  {project.realityCheck.skillGaps?.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                      <span className="text-purple-500 font-bold mt-0.5">•</span> {r}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            
            <section>
              <h3 className="text-lg font-bold text-neutral-900 mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-emerald-500"/> Recommendations</h3>
              <ul className="space-y-2">
                {project.realityCheck.recommendations?.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="text-emerald-500 font-bold mt-0.5">•</span> {r}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {activeTab === 'blueprint' && project.blueprint && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section>
              <h3 className="text-lg font-bold text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Development Roadmap</h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
                {project.blueprint.developmentRoadmap?.map((phase, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-bold text-sm z-10">
                      {i + 1}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-neutral-200 p-4 rounded-xl shadow-sm">
                      <h4 className="font-bold text-neutral-900 mb-2">{phase.phase}</h4>
                      <ul className="space-y-2">
                        {phase.tasks.map((t, j) => {
                          const isCompleted = project.roadmapProgress?.[`${i}-${j}`];
                          return (
                            <li key={j} className="text-sm flex items-start gap-2">
                              <button 
                                onClick={() => toggleTaskComplete(i, j)}
                                className="mt-0.5 shrink-0 text-neutral-400 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                                aria-label={isCompleted ? "Mark task incomplete" : "Mark task complete"}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>
                              <span className={cn("text-neutral-700 transition-all duration-300", isCompleted && "text-neutral-400 line-through")}>
                                {t}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <section className="bg-neutral-50 p-5 rounded-xl border border-neutral-100">
                <h3 className="font-bold text-neutral-900 mb-2">Architecture & Tech Stack</h3>
                <p className="text-sm text-neutral-700 mb-4">{project.blueprint.recommendedArchitecture}</p>
                <div className="flex flex-wrap gap-2">
                  {project.blueprint.technologyStack?.map((t, i) => (
                    <span key={i} className="bg-white border border-neutral-200 text-neutral-700 text-xs px-2.5 py-1 rounded-md font-medium">{t}</span>
                  ))}
                </div>
              </section>
              <section className="bg-neutral-50 p-5 rounded-xl border border-neutral-100">
                <h3 className="font-bold text-neutral-900 mb-2">Database & API</h3>
                <p className="text-sm text-neutral-700 mb-2"><span className="font-semibold text-neutral-900">DB Design:</span> {project.blueprint.databaseDesign}</p>
                <div className="space-y-1 mt-3">
                  <span className="font-semibold text-neutral-900 text-sm">Key APIs:</span>
                  {project.blueprint.apiRequirements?.map((api, i) => (
                    <div key={i} className="text-xs text-neutral-600 bg-white p-2 border border-neutral-200 rounded-md font-mono">{api}</div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'mentor' && (
          <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 p-8 text-center border-2 border-dashed border-neutral-200 rounded-xl">
                  <BrainCircuit className="w-12 h-12 mb-3 text-neutral-300" />
                  <p className="font-medium text-neutral-600 mb-1">I am your AI Project Mentor.</p>
                  <p className="text-sm mb-6">Ask me any technical or architectural question about your project.</p>
                  
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                    {[
                      "What should I build first?",
                      "How should I design the database?",
                      "How do I implement authentication?",
                      "How can I simplify my MVP?",
                      "How should I test this project?",
                      "What security risks should I consider?"
                    ].map((q, i) => (
                      <button 
                        key={i}
                        onClick={() => setChatInput(q)}
                        className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs px-3 py-1.5 rounded-full transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-5 py-3.5",
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white rounded-br-sm" 
                      : "bg-neutral-100 text-neutral-800 rounded-bl-sm"
                  )}>
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-800 prose-pre:text-neutral-100" style={{ color: 'inherit' }}>
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex w-full justify-start">
                  <div className="bg-neutral-100 text-neutral-800 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                    <span className="text-sm text-neutral-500 font-medium">Mentor is typing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={sendMentorMessage} className="mt-auto relative shrink-0">
              <input
                type="text"
                aria-label="Chat input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about testing, deployment, or architecture..."
                disabled={chatLoading}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-full pl-5 pr-14 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow shadow-sm disabled:opacity-70"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ title, score }: { title: string; score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return "text-emerald-600";
    if (s >= 50) return "text-amber-500";
    return "text-red-500";
  };
  
  return (
    <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
      <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">{title}</span>
      <span className={cn("text-3xl font-black", getColor(score))}>{score}<span className="text-lg text-neutral-400 font-medium">/100</span></span>
    </div>
  );
}
