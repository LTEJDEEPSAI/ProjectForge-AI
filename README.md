# ProjectForge AI — AI Project Idea Generator & Mentor

**ProjectForge AI** is a production-grade, AI-powered platform designed specifically to guide final-year university students through the most critical phase of their degree: building their final project.

From ideation and feasibility analysis to architectural blueprinting and technical mentorship, ProjectForge AI transforms vague ideas into production-ready software architecture.

## 🚀 The Problem We Solve
Final-year students often struggle with:
- **Scope Creep:** Proposing projects that are too complex for their timeframe.
- **Skill Mismatch:** Choosing tech stacks they don't know, leading to failure.
- **Vague Architectures:** Lacking structural blueprints before coding starts.
- **Isolation:** Lacking access to senior developers for technical mentorship.

## 💡 The Solution
ProjectForge AI acts as a **Senior Staff Engineer and Mentor** for the student. It analyzes their exact skills, timeframe, and career goals to generate realistic project ideas, validates them with a brutal "Reality Check", outputs a step-by-step technical blueprint, and provides a conversational AI mentor specifically grounded in their chosen architecture.

## ✨ Key Features
1. **Personalized Project Generation:** Context-aware ideation based on the student's exact skill proficiency, time budget, and domain interests.
2. **Brutal Reality Check:** Calculates feasibility, time suitability, and skill-match scores to prevent students from failing.
3. **Architectural Blueprints:** Generates a production-ready technology stack, database design, and non-functional requirements.
4. **Development Roadmap:** Provides an actionable, phased execution plan.
5. **Context-Aware AI Mentor:** A conversational AI assistant fully aware of the student's chosen blueprint, preventing generic advice and enforcing architectural consistency.
6. **Project Improvement:** Audits existing project ideas for scalability, security, and missing features.

## 🔄 Complete User Flow
1. **Authentication:** Secure Google Sign-In via Firebase Auth.
2. **Profile Onboarding:** Student inputs skills, timeline, and career goals.
3. **Personalized Project Ideas:** AI recommends 5 highly tailored projects.
4. **Reality Check & Blueprint:** The selected idea is validated and architected.
5. **Dashboard:** Projects are saved securely to Firebase Firestore.
6. **AI Mentor:** Ongoing chat assistance during the development phase.

## 🏗️ Architecture & Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Backend:** Express.js API, Node.js, Zod validation
- **Database & Persistence:** Firebase Firestore
- **Authentication:** Firebase Auth (Google Provider)
- **AI Integration:** OpenAI / ChatAnywhere API (configured securely server-side)
- **Deployment:** Vercel (Edge-ready, serverless functions)

## 🔒 Security & Data Privacy
- **Zero Client-Side Secrets:** All AI API credentials remain strictly server-side.
- **Role-Based Access Control (RBAC):** Firestore Rules enforce strict UID ownership. Users cannot read or write to other students' projects.
- **API Hardening:** Express backend utilizes JWT validation (`firebase-admin/auth`), rate limiting, payload truncation, and JSON body limits (1MB).
- **Zod Validation:** Strict request validation prevents malformed payloads and abuse.
- **AI Prompt Injection Protection:** System prompts are strictly separated from user inputs.

## 🧪 Testing Strategy
- Integration tests using `vitest` and `@testing-library/react`.
- Auth routing and protected route isolation tests.
- UI validation and empty-state boundary testing.
- Firestore ownership logic validation.

## ☁️ Google Services Integration
- **Firebase Authentication:** Handles robust Google Sign-In and secure JWT session management.
- **Firebase Firestore:** Deeply integrated as the primary persistence layer, utilizing real-time snapshots and robust security rules for project and chat history storage.

## 🚀 Getting Started (Local Setup)

1. Clone the repository.
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Set up environment variables in \`.env\`:
   \`\`\`env
   CHATANYWHERE_API_KEY=your_api_key_here
   \`\`\`
4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Open [http://localhost:3000](http://localhost:3000)

## 🔮 Future Improvements
- **GitHub Integration:** Auto-scaffold the generated blueprint directly into a GitHub repository.
- **Jira/Trello Sync:** Push the generated roadmap phases into actionable Kanban boards.
- **Peer Review:** Allow students to safely share projects for peer feedback while maintaining data isolation.
