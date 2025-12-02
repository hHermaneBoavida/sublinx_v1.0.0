import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Wand2, Loader2, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIContentGenerator({ 
  genre, 
  type, 
  location, 
  onContentGenerated 
}) {
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [copied, setCopied] = useState({ title: false, description: false });

  const generateContent = async () => {
    if (!genre || !type) {
      alert('Selecione gênero e tipo de evento primeiro');
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('generateEventContent', {
        genre,
        type,
        location: location?.city || 'São Paulo',
        keywords: keywords || 'energia, comunidade, música'
      });

      if (data.success) {
        setGeneratedContent(data.content);
        onContentGenerated?.(data.content);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Erro ao gerar conteúdo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, field) => {
    await navigator.clipboard.writeText(text);
    setCopied({ ...copied, [field]: true });
    setTimeout(() => setCopied({ ...copied, [field]: false }), 2000);
  };

  return (
    <Card className="bg-gradient-to-br from-cyan-900/10 via-purple-900/10 to-pink-900/10 border-2 border-cyan-500/30">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Gerador de Conteúdo IA</h3>
          </div>
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">
            Palavras-chave (opcional)
          </label>
          <Input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="energia, comunidade, pista lotada..."
            className="bg-gray-900/50 border-gray-700 text-white"
          />
        </div>

        <Button
          onClick={generateContent}
          disabled={loading || !genre || !type}
          className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando conteúdo mágico...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Título e Descrição
            </>
          )}
        </Button>

        {generatedContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 pt-3 border-t border-gray-700/50"
          >
            {/* Título Gerado */}
            <div className="relative">
              <label className="text-sm text-gray-400 mb-1 block">Título Sugerido:</label>
              <div className="relative">
                <Textarea
                  value={generatedContent.title}
                  readOnly
                  className="bg-gray-900/70 border-cyan-500/30 text-white pr-10 resize-none"
                  rows={2}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard(generatedContent.title, 'title')}
                  className="absolute top-2 right-2 h-6 w-6 hover:bg-cyan-600/20"
                >
                  {copied.title ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {/* Descrição Gerada */}
            <div className="relative">
              <label className="text-sm text-gray-400 mb-1 block">Descrição Sugerida:</label>
              <div className="relative">
                <Textarea
                  value={generatedContent.description}
                  readOnly
                  className="bg-gray-900/70 border-purple-500/30 text-white pr-10 resize-none"
                  rows={6}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard(generatedContent.description, 'description')}
                  className="absolute top-2 right-2 h-6 w-6 hover:bg-purple-600/20"
                >
                  {copied.description ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {/* Hashtags */}
            {generatedContent.hashtags?.length > 0 && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Hashtags Sugeridas:</label>
                <div className="flex flex-wrap gap-2">
                  {generatedContent.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-cyan-600/20 border border-cyan-500/30 rounded-full text-cyan-300 text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vibe Tags */}
            {generatedContent.vibe_tags?.length > 0 && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Vibes Sugeridas:</label>
                <div className="flex flex-wrap gap-2">
                  {generatedContent.vibe_tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-xs"
                    >
                      ✨ {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                onContentGenerated(generatedContent);
                alert('✅ Conteúdo aplicado ao evento!');
              }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Usar Este Conteúdo
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}