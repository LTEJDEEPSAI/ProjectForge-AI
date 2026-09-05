
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Pickaxe, LogOut, Lightbulb, User as UserIcon, LayoutDashboard, Wrench, AlertCircle, X } from 'lucide-react';

export function Layout() {
  const { user, login, logout, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
      {authError === 'unauthorized-domain' && (
        <div className="bg-red-500 text-white p-4 relative shadow-md z-[60]">
          <div className="max-w-7xl mx-auto flex items-start gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-lg mb-1">Firebase Domain Not Authorized</h3>
              <p className="text-sm mb-3">
                Since we switched to your personal Firebase project, you must authorize this AI Studio preview domain to log in.
              </p>
              <ol className="list-decimal list-inside text-sm space-y-1 bg-red-600/30 p-3 rounded-md">
                <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold">Firebase Console</a> and open your project.</li>
                <li>Go to <strong>Authentication &gt; Settings &gt; Authorized domains</strong>.</li>
                <li>Click <strong>Add domain</strong> and add: <br/> <code className="bg-white text-red-700 px-2 py-0.5 rounded ml-4 font-mono select-all">ais-dev-t46dxj63ngdp4o74yvfkyp-797387275154.asia-southeast1.run.app</code></li>
                <li>Add this domain too (for shared links): <br/> <code className="bg-white text-red-700 px-2 py-0.5 rounded ml-4 font-mono select-all">ais-pre-t46dxj63ngdp4o74yvfkyp-797387275154.asia-southeast1.run.app</code></li>
                <li>Once added, click the <strong>Refresh Icon</strong> at the top right of this preview window to reload the app.</li>
              </ol>
            </div>
            <button onClick={clearAuthError} className="ml-auto text-white hover:text-red-200 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {authError && authError !== 'unauthorized-domain' && (
         <div className="bg-amber-500 text-white p-3 text-center flex items-center justify-center gap-2 relative z-[60]">
           <AlertCircle className="w-5 h-5" /> {authError}
           <button onClick={clearAuthError} className="absolute right-4"><X className="w-5 h-5" /></button>
         </div>
      )}

      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <Pickaxe className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-neutral-900">ProjectForge <span className="text-blue-600">AI</span></span>
            </Link>
            <nav className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link to="/" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link to="/onboarding" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" /> Generate Ideas
                  </Link>
                  <Link to="/improve" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" /> Improve Project
                  </Link>
                  <div className="h-6 w-px bg-neutral-300 mx-2" />
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-neutral-500 hidden sm:block">{user.email}</span>
                    <button
                      onClick={handleLogout}
                      className="text-neutral-500 hover:text-red-600 transition-colors p-1"
                      aria-label="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={login}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4" />
                  Sign In to Forge
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-neutral-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-neutral-500">
            © {new Date().getFullYear()} ProjectForge AI. Built for final-year students.<br /><span className="text-xs text-neutral-400 mt-2 block">Powered by Google Gemini AI & Firebase Authentication</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
