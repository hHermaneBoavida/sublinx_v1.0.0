import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";
import AuthBranding from "@/components/auth/AuthBranding";
import {
  AuthContainer,
  AuthPrimaryButton,
  AuthSecondaryButton,
  AuthInput,
  AuthFooter,
  AuthError,
} from "@/components/auth/AuthButtons";
import { useToast } from "@/components/ui/use-toast";

const AppleLogo = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.05 12.04c-.03-2.93 2.39-4.34 2.5-4.41-1.36-1.99-3.48-2.26-4.23-2.29-1.8-.18-3.51 1.06-4.43 1.06-.92 0-2.32-1.04-3.82-1.01-1.96.03-3.78 1.14-4.79 2.89-2.05 3.56-.52 8.81 1.47 11.69.98 1.41 2.14 2.99 3.65 2.93 1.47-.06 2.02-.95 3.8-.95s2.28.95 3.82.92c1.58-.03 2.58-1.43 3.54-2.85 1.12-1.63 1.58-3.21 1.6-3.29-.03-.01-3.07-1.18-3.11-4.69zM14.25 3.51c.81-.98 1.35-2.34 1.21-3.69-1.16.05-2.57.77-3.41 1.75-.75.87-1.4 2.26-1.23 3.59 1.3.1 2.62-.66 3.43-1.65z" />
  </svg>
);

export default function Register() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

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
      window.location.href = "/";
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

  const handleGoogle = () => base44.auth.loginWithProvider("google", "/");
  const handleApple = () => base44.auth.loginWithProvider("apple", "/");

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
      <AuthBranding />

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
            <AuthPrimaryButton onClick={() => setShowForm(true)}>
              Criar conta com E-mail
            </AuthPrimaryButton>
            <AuthSecondaryButton icon={GoogleIcon} onClick={handleGoogle}>
              Continuar com Google
            </AuthSecondaryButton>
            <AuthSecondaryButton icon={AppleLogo} onClick={handleApple}>
              Continuar com Apple
            </AuthSecondaryButton>
          </div>
        )}
      </div>

      <AuthFooter>
        Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade
      </AuthFooter>
    </AuthContainer>
  );
}