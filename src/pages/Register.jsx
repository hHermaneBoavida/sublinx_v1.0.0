import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
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
import { useToast } from "@/components/ui/use-toast";

export default function Register() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate("/Onboarding", { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = "/Onboarding";
    } catch (err) {
      setError(err.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Código enviado", description: "Verifique seu email." });
    } catch (err) {
      setError(err.message || "Erro ao reenviar código");
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

  if (showOtp) {
    return (
      <AuthContainer>
        <AuthBranding subtitle={`Enviamos um código para ${email}`} />

        <div className="w-full max-w-sm space-y-5">
          <AuthError message={error} />

          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
              autoFocus
              autoComplete="one-time-code"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <AuthPrimaryButton onClick={handleVerify} loading={loading} disabled={otpCode.length < 6}>
            Verificar
          </AuthPrimaryButton>

          <div className="text-center text-sm text-gray-500">
            Não recebeu o código?{" "}
            <button onClick={handleResend} className="text-gray-300 hover:text-white font-medium">
              Reenviar
            </button>
          </div>
        </div>

        <AuthFooter>SUBLINX © 2026</AuthFooter>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <AuthBranding subtitle="Descubra o que está acontecendo perto de você." />

      <div className="w-full max-w-sm">
        {showForm ? (
          <div className="space-y-5">
            <button
              onClick={() => setShowForm(false)}
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
                autoComplete="new-password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <AuthInput
                type="password"
                icon={Lock}
                autoComplete="new-password"
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <AuthPrimaryButton type="submit" loading={loading}>
                Criar conta
              </AuthPrimaryButton>
            </form>

            <div className="text-center text-sm text-gray-500 pt-2">
              Já tem conta?{" "}
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors font-medium">
                Entrar
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <AuthError message={error} />

            {/* Facebook — primary social registration */}
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

            {/* Email registration */}
            <AuthPrimaryButton onClick={() => setShowForm(true)}>
              Criar conta com E-mail
            </AuthPrimaryButton>

            <div className="text-center text-sm text-gray-500 pt-2">
              Já tem conta?{" "}
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors font-medium">
                Entrar
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