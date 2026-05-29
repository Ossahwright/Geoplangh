import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Shield, Lock, User, Mail, KeyRound, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface AdminAuthProps {
  onLogin: () => void;
}

export function AdminAuth({ onLogin }: AdminAuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        onLogin();
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const isConfigured = true;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 font-sans relative">
      <div className="absolute top-0 right-0 p-8 w-full h-full pointer-events-none opacity-20">
        <div className="w-[800px] h-[800px] bg-slate-300 rounded-full blur-[120px] mix-blend-multiply top-[-200px] right-[-200px] absolute"></div>
        <div className="w-[600px] h-[600px] bg-amber-50 rounded-full blur-[100px] mix-blend-multiply bottom-[-100px] left-[-100px] absolute"></div>
      </div>
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 relative z-10 border border-slate-200">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">GeoPlan GH</h1>
          <p className="text-sm text-slate-500 font-medium tracking-wide uppercase mt-1">Admin Portal Access</p>
        </div>

        {!isConfigured && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 font-medium">
            Firebase is not configured yet. Please add your credentials to the configuration file to enable authentication.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Admin Email</label>
            <div className="relative">
               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="email" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
                 className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium text-slate-900" 
                 placeholder="admin@geoplan.gh" 
               />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Password</label>
            <div className="relative">
               <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type={showPassword ? "text" : "password"} 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 required
                 className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium text-slate-900" 
                 placeholder="••••••••••" 
               />
               <button 
                 type="button" 
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
               >
                 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
               </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-widest text-sm font-bold shadow-md disabled:opacity-70 mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
            ) : isLogin ? (
              <><Lock className="w-4 h-4" /> Secure Admin Login</>
            ) : (
              <><User className="w-4 h-4" /> Register Admin</>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-500 mb-2 font-medium">
             {isLogin ? "Need a new admin account?" : "Already an admin?"}
          </p>
          <button 
             type="button"
             onClick={() => {
               setIsLogin(!isLogin);
               setError(null);
             }}
             className="text-amber-600 hover:text-amber-700 font-bold text-sm tracking-wide transition-colors uppercase"
          >
             {isLogin ? "Register Admin Access" : "Switch to Login"}
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest w-full">
         Secured by Firebase Identity Engine &copy; 2026
      </div>
    </div>
  );
}
