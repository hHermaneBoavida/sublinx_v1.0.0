import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mail, ArrowLeft } from "lucide-react";
import AuthBranding from "@/components/auth/AuthBranding";
import {
  AuthContainer,
  AuthPrimaryButton,
  AuthInput,
  AuthFooter,
} from "@/components/auth/AuthButtons";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthContainer>
      <AuthBranding subtitle="Recuperar senha" />

      <div className="w-full max-w-sm space-y-5">
        {sent ? (
          <p className="text-sm text-gray-300 text-center">
            Se existir uma conta com esse email, você receberá um link de recuperação em breve.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-500 text-center">
              Enviaremos um link para redefinir sua senha
            </p>
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
              <AuthPrimaryButton type="submit" loading={loading}>
                Enviar link
              </AuthPrimaryButton>
            </form>
          </>
        )}

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