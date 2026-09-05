export interface OnboardingData {
  branch: string;
  interests: string;
  skills: string;
  proficiency: string;
  career: string;
  technologies: string;
  teamSize: string;
  timeAvailable: string;
  budget: string;
  difficulty: string;
  domain: string;
}

export interface ProjectIdea {
  id?: string;
  userId?: string;
  title: string;
  concept: string;
  problemStatement: string;
  targetUsers: string;
  proposedSolution: string;
  features: string[];
  innovation: string;
  techStack: string[];
  skills: string[];
  difficulty: string;
  duration: string;
  cost: string;
  aiOpps: string;
  outcome: string;
  challenges: string;
  realityCheck?: RealityCheck;
  blueprint?: Blueprint;
  roadmapProgress?: Record<string, boolean>;
  createdAt?: number;
  updatedAt?: number;
}

export interface RealityCheck {
  feasibilityScore: number;
  innovationScore: number;
  complexityScore: number;
  costScore: number;
  timeSuitability: number;
  skillMatchScore: number;
  explanation: string;
  mentorVerdict: string;
  risks: string[];
  skillGaps: string[];
  recommendations: string[];
  realisticMvpScope: string;
}

export interface Blueprint {
  overview: string;
  problemDefinition: string;
  objectives: string[];
  targetUsers: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  recommendedArchitecture: string;
  databaseDesign: string;
  apiRequirements: string[];
  authenticationApproach: string;
  technologyStack: string[];
  developmentRoadmap: { phase: string; tasks: string[] }[];
  testingStrategy: string;
  deploymentStrategy: string;
  futureImprovements: string[];
}

export interface MentorMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  createdAt: number;
}

export interface ImprovementAnalysis {
  weaknesses: string[];
  missingFeatures: string[];
  technicalRisks: string[];
  scalabilityIssues: string[];
  securityConcerns: string[];
  accessibilityIssues: string[];
  innovationImprovements: string[];
  techChanges: string[];
  realisticMvpScope: string;
}
