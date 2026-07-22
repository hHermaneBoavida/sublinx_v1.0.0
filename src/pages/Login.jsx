import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";

const AppleLogo = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.05 12.04c-.03-2.93 2.39-4.34 2.5-4.41-1.36-1.99-3.48-2.26-4.23-2.29-1.8-.18-3.51 1.06-4.43 1.06-.92 0-2.32-1.04-3.82-1.01-1.96.03-3.78 1.14-4.79 2.89-2.05 3.56-.52 8.81 1.47 11.69.98 1.41 2.14 2.99 3.65 2.93 1.47-.06 2.02-.95 3.8-.95s2.28.95 3.82.92c1.58-.03 2.58-1.43 3.54-2.85 1.12-1.63 1.58-3.21 1.6-3.29-.03-.01-3.07-1.18-3.11-4.69zM14.25 3.51c.81-.98 1.35-2.34 1.21-3.69-1.16.05-2.57.77-3.41 1.75-.75.87-1.4 2.26-1.23 3.59 1.3.1 2.62-.66 3.43-1.65z" />
  </svg>
);



export default function Login() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  const handleApple = () => {
    base44.auth.loginWithProvider("apple", "/");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between py-16 px-6">
      {/* Logo + Brand */}
      <div className="flex flex-col items-center mt-8">
        <img src="https://media.base44.com/images/public/68a70ee66a1156f1068d2903/a1612e3df_Capturadetela2025-08-01215926.png" alt="SUBLINX" className="w-28 h-28 object-contain" />
        <h1 className="text-4xl font-black tracking-[0.15em] mt-6" style={{ color: "#8A2BE2" }}>
          SUBLINX
        </h1>
      </div>

      {/* Buttons / Form */}
      <div className="w-full max-w-sm">
        {showEmailForm ? (
          <div className="space-y-5">
            <button
              onClick={() => setShowEmailForm(false)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Voltar</span>
            </button>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-14 rounded-2xl bg-[#121212] border-white/10 text-white placeholder:text-gray-600"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-14 rounded-2xl bg-[#121212] border-white/10 text-white placeholder:text-gray-600"
                  required
                />
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-white transition-colors">
                  Esqueci minha senha
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #0d4f4f 0%, #00b894 100%)" }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar"}
              </button>
            </form>

            <div className="text-center text-sm text-gray-500 pt-2">
              Não tem conta?{" "}
              <Link to="/register" className="text-gray-300 hover:text-white transition-colors font-medium">
                Criar conta
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full h-14 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #0d4f4f 0%, #00b894 100%)" }}
            >
              Entrar com E-mail
            </button>
            <button
              onClick={handleGoogle}
              className="w-full h-14 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-3 transition-all hover:bg-white/5 active:scale-[0.98]"
              style={{ background: "#121212", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <GoogleIcon className="w-5 h-5" />
              Continuar com Google
            </button>
            <button
              onClick={handleApple}
              className="w-full h-14 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-3 transition-all hover:bg-white/5 active:scale-[0.98]"
              style={{ background: "#121212", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <AppleLogo className="w-5 h-5" />
              Continuar com Apple
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-gray-700 max-w-xs">
        Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade
      </div>
    </div>
  );
}