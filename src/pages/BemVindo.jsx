import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Zap, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BemVindo() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.auth.me()
      .then(user => {
        if (user) {
          navigate(createPageUrl("Mapa"));
        }
      })
      .catch(() => {
        // Usuário não logado
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLogging(true);
    setError("");
    
    // CORREÇÃO: Contas demo funcionais
    const demoAccounts = {
      "organizador@sublynx.com": { password: "password123", type: "organizer" },
      "alex@example.com": { password: "password123", type: "user" }
    };
    
    if (demoAccounts[email] && password === demoAccounts[email].password) {
      // Simular login bem-sucedido
      setTimeout(() => {
        navigate(createPageUrl("Mapa"));
      }, 1000);
    } else {
      setError("❌ Credenciais inválidas. Use uma das contas demo abaixo.");
      setIsLogging(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full"
        />
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
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/116e0559c_Sublinx_icon.png"
                  alt="Sublinx"
                  className="w-20 h-20 sm:w-24 sm:h-24"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-20 blur-2xl animate-pulse" />
              </div>
            </motion.div>
            
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                SUBLINX
              </span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Entre na cena underground</p>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            {/* Error Alert */}
            {error && (
              <Alert className="mb-4 bg-red-900/20 border-red-500/50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-300 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10 sm:pl-12 h-12 sm:h-14 bg-gray-800/50 border-gray-600 focus:border-cyan-500 text-white text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 sm:pl-12 pr-12 h-12 sm:h-14 bg-gray-800/50 border-gray-600 focus:border-cyan-500 text-white text-sm sm:text-base"
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

              <Button
                type="submit"
                disabled={isLogging}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold text-sm sm:text-base shadow-lg shadow-cyan-500/25 transition-all duration-300"
              >
                {isLogging ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Entrar na Cena
                  </>
                )}
              </Button>
            </form>

            {/* Demo Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 p-4 bg-gradient-to-r from-cyan-900/20 to-purple-900/20 rounded-xl border border-cyan-500/20"
            >
              <p className="text-xs text-cyan-300 font-semibold mb-2 flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Contas Demo Disponíveis:
              </p>
              <div className="space-y-2 text-xs">
                <div className="bg-gray-800/50 rounded p-2 border border-gray-700">
                  <p className="text-cyan-400 font-semibold">📧 Organizador:</p>
                  <p className="text-gray-300 font-mono">organizador@sublynx.com</p>
                  <p className="text-gray-500 text-[10px] mt-1">🔑 Senha: password123</p>
                </div>
                <div className="bg-gray-800/50 rounded p-2 border border-gray-700">
                  <p className="text-purple-400 font-semibold">📧 Usuário:</p>
                  <p className="text-gray-300 font-mono">alex@example.com</p>
                  <p className="text-gray-500 text-[10px] mt-1">🔑 Senha: password123</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs sm:text-sm text-gray-500">
            Ao entrar, você concorda com nossos{' '}
            <a href="#" className="text-cyan-400 hover:text-cyan-300">Termos de Uso</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}