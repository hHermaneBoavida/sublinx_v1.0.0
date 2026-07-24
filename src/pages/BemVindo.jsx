import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import GoogleIcon from "@/components/GoogleIcon";
import FacebookIcon from "@/components/FacebookIcon";

export default function BemVindo() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate("/Onboarding", { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const loading = isLoadingAuth;

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLogging(true);
    setError("");

    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/Onboarding";
    } catch (err) {
      setError("Credenciais inválidas. Verifique seu email e senha.");
      setIsLogging(false);
    }
  };

  const handleFacebook = async () => {
    setError("");
    try {
      await base44.auth.loginWithProvider("facebook", "/Onboarding");
    } catch (err) {
      setError("Não foi possível conectar com o Facebook. Tente outro método.");
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await base44.auth.loginWithProvider("google", "/Onboarding");
    } catch (err) {
      setError("Não foi possível conectar com o Google. Tente outro método.");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-cyan-900/30" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />

      {/* Animated Grid Background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, cyan 1px, transparent 1px),
            linear-gradient(to bottom, cyan 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }}
      />

      <style>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative w-full max-w-md z-10"
      >
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Header com Logo */}
          <div className="p-8 sm:p-10 text-center border-b border-gray-700/50">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/116e0559c_Sublinx_icon.png"
                  alt="Sublinx"
                  className="w-20 h-20 sm:w-24 sm:h-24"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-20 blur-2xl animate-pulse" />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                SUBLINX
              </span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Descubra o que está acontecendo perto de você.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            {error && (
              <Alert className="mb-4 bg-red-900/20 border-red-500/50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-300 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {showEmailForm ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-10 sm:pl-12 h-12 sm:h-14 w-full rounded-2xl bg-gray-800/50 border border-gray-600 focus:border-cyan-500 text-white text-sm sm:text-base focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 sm:pl-12 pr-12 h-12 sm:h-14 w-full rounded-2xl bg-gray-800/50 border border-gray-600 focus:border-cyan-500 text-white text-sm sm:text-base focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLogging}
                  className="w-full h-12 sm:h-14 rounded-2xl font-bold text-white text-sm sm:text-base transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #0d4f4f 0%, #00b894 100%)" }}
                >
                  {isLogging ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Entrar"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Voltar
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                {/* Facebook — primary social login */}
                <button
                  onClick={handleFacebook}
                  className="w-full h-12 sm:h-14 rounded-2xl font-bold text-white text-sm sm:text-base flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "#1877F2", border: "1px solid #1877F2" }}
                >
                  <FacebookIcon className="w-5 h-5" />
                  Continuar com Facebook
                </button>

                {/* Google */}
                <button
                  onClick={handleGoogle}
                  className="w-full h-12 sm:h-14 rounded-2xl font-semibold text-white text-sm sm:text-base flex items-center justify-center gap-3 transition-all hover:bg-white/5 active:scale-[0.98]"
                  style={{ background: "#121212", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <GoogleIcon className="w-5 h-5" />
                  Continuar com Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-gray-600">ou</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Email login */}
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="w-full h-12 sm:h-14 rounded-2xl font-bold text-white text-sm sm:text-base transition-all hover:opacity-90 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #0d4f4f 0%, #00b894 100%)" }}
                >
                  Entrar com E-mail
                </button>
              </div>
            )}

            {/* Register link */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Não tem conta?{" "}
                <a href="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                  Criar conta
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-500">
            Ao entrar, você concorda com nossos{" "}
            <a href="#" className="text-cyan-400 hover:text-cyan-300">Termos de Uso</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}