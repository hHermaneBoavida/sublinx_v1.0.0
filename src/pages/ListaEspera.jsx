import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Lock, 
  Mail, 
  User, 
  Music, 
  Check,
  Sparkles,
  Crown
} from "lucide-react";
import { motion } from "framer-motion";

export default function ListaEspera() {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    city: "",
    favorite_genre: "",
    why_join: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Salvar na entidade WaitList (criar se não existir)
      await base44.entities.WaitList.create({
        ...formData,
        status: "pending",
        submitted_at: new Date().toISOString()
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Erro ao enviar:", error);
      alert("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card className="bg-gray-900/80 border-cyan-500/30 backdrop-blur-lg">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Você está na lista! 🎉
              </h2>
              <p className="text-gray-300 mb-6">
                Enviamos um email de confirmação para <strong>{formData.email}</strong>
              </p>
              <p className="text-gray-400 text-sm">
                Você receberá seu convite exclusivo em breve. 
                Fique de olho na sua caixa de entrada!
              </p>

              <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-cyan-300 text-sm">
                  💡 Dica: Compartilhe com amigos para subir na fila!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 py-12 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lock className="w-8 h-8 text-cyan-400" />
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
              BETA FECHADO
            </Badge>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Junte-se à Lista de Espera
            </span>
          </h1>
          <p className="text-gray-300 text-lg">
            Acesso exclusivo à plataforma underground mais esperada
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          {[
            { icon: Crown, title: "Acesso Antecipado", desc: "Seja um dos primeiros" },
            { icon: Sparkles, title: "Recursos Exclusivos", desc: "Features premium grátis" },
            { icon: Music, title: "Eventos Secretos", desc: "Acesso VIP" }
          ].map((benefit, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/30 transition-all">
              <CardContent className="p-4 text-center">
                <benefit.icon className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold text-sm mb-1">{benefit.title}</h3>
                <p className="text-gray-400 text-xs">{benefit.desc}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white">Solicite seu Convite</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="seu@email.com"
                      className="bg-gray-800 border-gray-600 text-white pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Nome Completo *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      placeholder="Seu nome"
                      className="bg-gray-800 border-gray-600 text-white pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Cidade *</label>
                  <Input
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="São Paulo"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Gênero Musical Favorito</label>
                  <div className="relative">
                    <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      value={formData.favorite_genre}
                      onChange={(e) => setFormData({...formData, favorite_genre: e.target.value})}
                      placeholder="Techno, House, etc"
                      className="bg-gray-800 border-gray-600 text-white pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Por que quer entrar?</label>
                  <Textarea
                    value={formData.why_join}
                    onChange={(e) => setFormData({...formData, why_join: e.target.value})}
                    placeholder="Conte um pouco sobre você e sua conexão com a cena underground..."
                    className="bg-gray-800 border-gray-600 text-white h-24"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white h-12 text-lg font-semibold"
                >
                  {loading ? "Enviando..." : "Solicitar Acesso"}
                </Button>

                <p className="text-gray-400 text-xs text-center">
                  Ao enviar, você concorda com nossos termos e condições
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex justify-center gap-8 text-center"
        >
          <div>
            <div className="text-2xl font-bold text-cyan-400">2,450+</div>
            <div className="text-gray-400 text-sm">Na fila</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">150+</div>
            <div className="text-gray-400 text-sm">Convites enviados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-pink-400">95%</div>
            <div className="text-gray-400 text-sm">Taxa de ativação</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}