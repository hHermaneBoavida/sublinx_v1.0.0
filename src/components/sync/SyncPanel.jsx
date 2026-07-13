import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, CheckCircle, AlertTriangle, Loader2, Globe } from 'lucide-react';
import { runSync, CITIES, CATEGORIES } from '@/lib/aggregation/syncEngine';

export default function SyncPanel() {
  const [city, setCity] = useState('São Paulo');
  const [category, setCategory] = useState('techno');
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState(null);

  const syncMutation = useMutation({
    mutationFn: async (params) => {
      return await runSync({
        ...params,
        onProgress: (msg) => setProgress(msg),
      });
    },
    onSuccess: (data) => {
      setResult(data);
      setProgress('');
    },
    onError: (e) => {
      setResult({ error: e.message });
      setProgress('');
    },
  });

  const handleSync = () => {
    setResult(null);
    syncMutation.mutate({ city, category });
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gray-900/80 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Sincronização via Web
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-500">
            Usa IA com busca web para descobrir eventos reais. Eventos são normalizados, validados,
            geocodificados e deduplicados automaticamente antes de serem salvos.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Cidade</label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                  {CITIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Categoria</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
          >
            {syncMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sincronizando...</>
            ) : (
              <><Zap className="w-4 h-4" /> Importar Eventos</>
            )}
          </Button>

          {progress && (
            <div className="flex items-center gap-2 text-sm text-cyan-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              {progress}
            </div>
          )}

          {result && !result.error && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-bold">Sincronização concluída</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 rounded-lg bg-green-900/30 border border-green-800">
                  <p className="text-lg font-bold text-green-400">{result.imported}</p>
                  <p className="text-xs text-gray-500">Importados</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-purple-900/30 border border-purple-800">
                  <p className="text-lg font-bold text-purple-400">{result.duplicates}</p>
                  <p className="text-xs text-gray-500">Duplicados</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-yellow-900/30 border border-yellow-800">
                  <p className="text-lg font-bold text-yellow-400">{result.ignored}</p>
                  <p className="text-xs text-gray-500">Ignorados</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-cyan-900/30 border border-cyan-800">
                  <p className="text-lg font-bold text-cyan-400">{result.total}</p>
                  <p className="text-xs text-gray-500">Encontrados</p>
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-red-900/20 border border-red-800 max-h-32 overflow-y-auto">
                  <p className="text-xs text-red-400 font-bold mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Erros ({result.errors.length})
                  </p>
                  {result.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-gray-500 truncate">• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {result?.error && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              {result.error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-900/80 border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-yellow-500 border-yellow-700">Etapa 9</Badge>
            <p className="text-xs text-gray-500">
              Sincronização automática (diária + a cada 30min) requer backend functions.
              Disponível no plano Builder+. A sincronização web acima é manual e usa IA
              com busca em tempo real.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}