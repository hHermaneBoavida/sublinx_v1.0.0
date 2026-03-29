import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Shield, Palette, Accessibility, Smartphone, Zap,
  MapPin, ClipboardCheck, Star, AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  {
    id: "design",
    label: "Design",
    icon: Palette,
    color: "from-pink-500 to-purple-600",
    border: "border-pink-500/30",
    glow: "rgba(236,72,153,0.3)",
    items: [
      "Todos os botões têm contraste suficiente (WCAG AA: 4.5:1).",
      "Tipografia legível em todas as telas, com tamanhos responsivos.",
      "Layout responsivo, validado em breakpoints (mobile, tablet, desktop).",
      "Botão de voltar fixo e consistente em todas as telas.",
      "Hierarquia visual clara: títulos, subtítulos e corpo de texto diferenciados.",
      "Espaçamentos (padding/margin) proporcionais e consistentes.",
      "Ícones com tamanho mínimo de 24px e áreas de toque de 44px.",
      "Paleta de cores definida e aplicada uniformemente.",
    ],
  },
  {
    id: "acessibilidade",
    label: "Acessibilidade",
    icon: Accessibility,
    color: "from-blue-500 to-cyan-600",
    border: "border-blue-500/30",
    glow: "rgba(59,130,246,0.3)",
    items: [
      "Navegação via teclado testada e funcional (Tab, Enter, Esc).",
      "Todos os inputs possuem <label> ou aria-label associados.",
      "Imagens possuem atributo alt descritivo.",
      "Elementos interativos (botões, links) acessíveis por screen readers.",
      "Feedback visual e auditivo em interações importantes (erros, sucesso).",
      "Contraste de cores validado com ferramenta (ex: WebAIM Contrast Checker).",
      "Focus visível e destacado em todos os elementos interativos.",
      "ARIA roles aplicados onde necessário (dialog, alert, navigation).",
    ],
  },
  {
    id: "responsividade",
    label: "Responsividade",
    icon: Smartphone,
    color: "from-green-500 to-emerald-600",
    border: "border-green-500/30",
    glow: "rgba(34,197,94,0.3)",
    items: [
      "Media queries implementadas de 320px a 1440px.",
      "Elementos se reorganizam sem quebra ou overflow horizontal.",
      "Fontes escalam proporcionalmente (clamp ou rem).",
      "Imagens responsivas com max-width: 100%.",
      "Botões se ajustam sem truncar texto.",
      "Validado em iOS Safari, Android Chrome e tablets.",
      "Validado em orientação portrait e landscape.",
      "Inputs não causam zoom automático no iOS (font-size ≥ 16px).",
    ],
  },
  {
    id: "desempenho",
    label: "Desempenho",
    icon: Zap,
    color: "from-yellow-500 to-orange-600",
    border: "border-yellow-500/30",
    glow: "rgba(234,179,8,0.3)",
    items: [
      "Imagens compactadas (WebP ou compressão adequada).",
      "Scripts carregados de forma assíncrona quando possível.",
      "Lazy loading aplicado em imagens e componentes pesados.",
      "Tempo de carregamento inicial abaixo de 3 segundos (LCP).",
      "Console sem erros ou warnings críticos.",
      "Queries ao banco de dados otimizadas (evitar N+1).",
      "Cache configurado para dados estáticos e sessão.",
      "Bundle size monitorado e chunks separados por rota.",
    ],
  },
  {
    id: "gps",
    label: "Integridade do GPS",
    icon: MapPin,
    color: "from-cyan-500 to-blue-600",
    border: "border-cyan-500/30",
    glow: "rgba(6,182,212,0.3)",
    items: [
      "Localização do usuário capturada em tempo real, sem atrasos.",
      "Dados de GPS persistem mesmo com troca de tela ou interrupção.",
      "Fallback definido quando o usuário nega permissão de localização.",
      "Precisão mínima aceitável configurada (enableHighAccuracy).",
      "Testado em ambiente indoor (GPS pode ser impreciso).",
      "Testado em ambiente outdoor para validar precisão.",
      "Localização expirada é renovada automaticamente (maximumAge).",
      "Erros de geolocalização tratados com mensagem amigável ao usuário.",
    ],
  },
  {
    id: "validacao",
    label: "Validação em Tempo Real",
    icon: ClipboardCheck,
    color: "from-purple-500 to-pink-600",
    border: "border-purple-500/30",
    glow: "rgba(168,85,247,0.3)",
    items: [
      "ESLint ativo com regras definidas no projeto.",
      "Campos obrigatórios validados antes do envio.",
      "Formatos de entrada validados (email, telefone, CEP).",
      "Mensagens de erro claras e próximas ao campo com problema.",
      "Formulários bloqueiam envio duplicado (disabled durante loading).",
      "Dados retornados da API validados antes de renderizar.",
      "Testes unitários cobrem funções críticas (helpers, filtros).",
      "Testes de integração validam fluxos principais (login, criação de evento).",
    ],
  },
  {
    id: "curadoria",
    label: "Curadoria de Eventos",
    icon: Star,
    color: "from-lime-500 to-green-600",
    border: "border-lime-500/30",
    glow: "rgba(163,230,53,0.3)",
    items: [
      "Eventos exibidos passam por filtro de relevância para o público-alvo.",
      "Critérios de curadoria (popularidade, categoria, localização) definidos e aplicados.",
      "Atualização dinâmica: eventos entram ou saem da lista em tempo real.",
      "Eventos possuem tags e categorias bem definidas para fácil navegação.",
      "Eventos expirados (data passada) não aparecem no feed.",
      "Eventos secretos visíveis apenas para usuários Pro.",
      "Ordenação configurável (distância, data, popularidade).",
      "Curadoria por gênero musical baseada nas preferências do usuário.",
    ],
  },
];

function Section({ section, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [checked, setChecked] = useState({});
  const Icon = section.icon;

  const toggle = (i) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  const doneCount = Object.values(checked).filter(Boolean).length;
  const total = section.items.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-gray-900/70 backdrop-blur-sm overflow-hidden ${section.border}`}
      style={{ boxShadow: `0 0 20px ${section.glow}` }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-base sm:text-lg leading-tight">{section.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{doneCount}/{total} itens concluídos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress pill */}
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              pct === 100
                ? "bg-green-500/20 text-green-400 border border-green-500/40"
                : pct > 50
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                : "bg-gray-700 text-gray-400 border border-gray-600"
            }`}
          >
            {pct}%
          </span>
          {open ? (
            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          )}
        </div>
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800 mx-4 sm:mx-5 rounded-full mb-1">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${section.color}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Items */}
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 pt-3 space-y-2">
              {section.items.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer select-none transition-all duration-200 ${
                    checked[i]
                      ? "bg-green-500/10 border border-green-500/25"
                      : "bg-gray-800/50 border border-gray-700/50 hover:border-gray-600"
                  }`}
                  onClick={() => toggle(i)}
                  role="checkbox"
                  aria-checked={!!checked[i]}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === " " || e.key === "Enter") && toggle(i)}
                >
                  {checked[i] ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-sm leading-snug ${
                      checked[i] ? "line-through text-gray-500" : "text-gray-200"
                    }`}
                  >
                    {item}
                  </span>
                </motion.li>
              ))}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Checklist() {
  const [allChecked, setAllChecked] = useState({});

  // Global progress (count across all sections × items)
  const totalItems = SECTIONS.reduce((s, sec) => s + sec.items.length, 0);

  return (
    <div className="min-h-screen bg-black text-white pb-24 md:pb-10">
      {/* Header */}
      <div
        className="sticky top-0 z-20 backdrop-blur-xl border-b border-gray-800/60 px-4 py-3"
        style={{ background: "rgba(0,0,0,0.85)" }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
              Checklist de Qualidade
            </h1>
            <p className="text-xs text-gray-400">{SECTIONS.length} categorias · {totalItems} itens verificáveis</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Warning banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-200">
            Clique em cada item para marcá-lo como concluído. O progresso é salvo localmente durante esta sessão.
          </p>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            return (
              <Badge
                key={sec.id}
                className={`flex items-center gap-1.5 bg-gray-800 border ${sec.border} text-gray-300 text-xs py-1 px-2`}
              >
                <Icon className="w-3 h-3" />
                {sec.label}
              </Badge>
            );
          })}
        </div>

        {/* Sections */}
        {SECTIONS.map((sec, i) => (
          <Section key={sec.id} section={sec} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  );
}