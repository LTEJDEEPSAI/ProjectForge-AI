import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { ProjectIdea } from '../types';
import { Link } from 'react-router-dom';
import { Pickaxe, ArrowRight, Lightbulb, TrendingUp, Trash2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export function Dashboard() {
  const { user, login } = useAuth();
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        const q = query(
          collection(db, 'projects'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectIdea));
        setProjects(fetched);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting project', err);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-20">
        <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-6">
          <Pickaxe className="w-12 h-12" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 mb-6 leading-tight">
          Transform your idea into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">production-ready</span> final year project.
        </h1>
        <p className="text-lg text-neutral-600 mb-10 leading-relaxed">
          ProjectForge AI mentors you from initial brainstorming to architectural blueprints, helping you build realistic, innovative, and highly-scored academic projects.
        </p>
        <button
          onClick={login}
          className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 rounded-full text-lg font-semibold transition-transform hover:scale-105 active:scale-95 shadow-xl flex items-center gap-3"
        >
          Sign In to Start Forging
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Your Projects</h1>
          <p className="text-neutral-500 mt-1">Manage and track your generated project ideas.</p>
        </div>
        <Link 
          to="/onboarding" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <Lightbulb className="w-4 h-4" />
          Generate New Idea
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
            <Pickaxe className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">No projects yet</h2>
          <p className="text-neutral-500 mb-6">Start by telling us about your skills and interests to generate personalized project ideas.</p>
          <Link 
            to="/onboarding" 
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full font-medium hover:bg-neutral-800 transition-colors"
          >
            Start Idea Generator
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => {
            let totalTasks = 0;
            let completedTasks = 0;
            project.blueprint?.developmentRoadmap?.forEach((phase, i) => {
              phase.tasks.forEach((_, j) => {
                totalTasks++;
                if (project.roadmapProgress?.[`${i}-${j}`]) completedTasks++;
              });
            });
            const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={project.id} 
              className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col relative"
            >
              <button 
                onClick={() => project.id && deleteProject(project.id)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full text-neutral-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all z-10 border border-neutral-100 shadow-sm"
                aria-label="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3 pr-8">
                  <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {project.difficulty}
                  </span>
                  {project.realityCheck?.feasibilityScore && (
                     <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                     <TrendingUp className="w-3 h-3"/> Score: {project.realityCheck.feasibilityScore}/100
                   </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-sm text-neutral-600 mb-4 line-clamp-3 flex-1">
                  {project.concept}
                </p>
                
                <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
                  {project.techStack?.slice(0, 3).map((tech, i) => (
                    <span key={i} className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md border border-neutral-200">
                      {tech}
                    </span>
                  ))}
                  {project.techStack?.length > 3 && (
                    <span className="text-xs text-neutral-400 font-medium px-1 py-1">
                      +{project.techStack.length - 3} more
                    </span>
                  )}
                </div>
                
                {totalTasks > 0 && (
                  <div className="mb-5 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-neutral-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Progress</span>
                      <span className="text-xs font-bold text-neutral-900">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>
                )}
                
                <Link 
                  to={`/project/${project.id}`} 
                  className="mt-auto block w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2.5 rounded-lg border border-blue-100 transition-colors"
                >
                  Continue Project
                </Link>
              </div>
            </motion.div>
          )})}
        </div>
      )}
    </div>
  );
}
