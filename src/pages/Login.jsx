import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import FacebookIcon from "@/components/FacebookIcon";
import AuthBranding from "@/components/auth/AuthBranding";
import {
  AuthContainer,
  AuthPrimaryButton,
  AuthInput,
  AuthFooter,
  AuthError,
} from "@/components/auth/AuthButtons";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate("/Onboarding", { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/Onboarding";
    } catch (err) {
      setError(err.message || "Email ou senha inválidos");
    } finally {
      setLoading(false);
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

  return (
    <AuthContainer>
      <AuthBranding subtitle="Descubra o que está acontecendo perto de você." />

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

            <AuthError message={error} />

            <form onSubmit={handleSubmit} className="space-y-4">
              <AuthInput
                type="email"
                icon={Mail}
                autoComplete="email"
                autoFocus
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <AuthInput
                type="password"
                icon={Lock}
                autoComplete="current-password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-white transition-colors">
                  Esqueci minha senha
                </Link>
              </div>
              <AuthPrimaryButton type="submit" loading={loading}>
                Entrar
              </AuthPrimaryButton>
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
            <AuthError message={error} />

            {/* Facebook — primary social login */}
            <button
              onClick={handleFacebook}
              className="w-full h-14 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "#1877F2", border: "1px solid #1877F2" }}
            >
              <FacebookIcon className="w-5 h-5" />
              Continuar com Facebook
            </button>

            {/* Google */}
            <button
              onClick={handleGoogle}
              className="w-full h-14 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-3 transition-all hover:bg-white/5 active:scale-[0.98]"
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
            <AuthPrimaryButton onClick={() => setShowEmailForm(true)}>
              Entrar com E-mail
            </AuthPrimaryButton>

            <div className="text-center text-sm text-gray-500 pt-2">
              Não tem conta?{" "}
              <Link to="/register" className="text-gray-300 hover:text-white transition-colors font-medium">
                Criar conta
              </Link>
            </div>
          </div>
        )}
      </div>

      <AuthFooter>
        Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade
      </AuthFooter>
    </AuthContainer>
  );
}