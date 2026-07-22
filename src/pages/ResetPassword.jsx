import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Lock, ArrowLeft, AlertTriangle } from "lucide-react";
import AuthBranding from "@/components/auth/AuthBranding";
import {
  AuthContainer,
  AuthPrimaryButton,
  AuthInput,
  AuthFooter,
  AuthError,
} from "@/components/auth/AuthButtons";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Falha ao redefinir senha");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthContainer>
        <AuthBranding subtitle="Link inválido" />

        <div className="w-full max-w-sm space-y-5">
          <div className="flex justify-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500" />
          </div>
          <p className="text-sm text-gray-300 text-center">
            Este link de recuperação está ausente ou é inválido. Solicite um novo email de recuperação.
          </p>
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Solicitar novo link
            </Link>
          </div>
        </div>

        <AuthFooter>SUBLINX © 2026</AuthFooter>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <AuthBranding subtitle="Nova senha" />

      <div className="w-full max-w-sm space-y-5">
        <AuthError message={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            type="password"
            icon={Lock}
            autoComplete="new-password"
            autoFocus
            placeholder="Nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
            Redefinir senha
          </AuthPrimaryButton>
        </form>

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para login
          </Link>
        </div>
      </div>

      <AuthFooter>SUBLINX © 2026</AuthFooter>
    </AuthContainer>
  );
}