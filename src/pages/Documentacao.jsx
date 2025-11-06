import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Globe, 
  RefreshCw, 
  MapPin, 
  Filter,
  AlertTriangle,
  CheckCircle,
  Code,
  Zap
} from 'lucide-react';

export default function Documentacao() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-2">
          📚 Documentação Técnica - Integração de Eventos
        </h1>
        <p className="text-gray-400">
          Arquitetura completa para integração com APIs externas (Google, Facebook, Instagram)
        </p>
      </div>

      <Alert className="mb-6 bg-yellow-900/20 border-yellow-500/50">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        <AlertDescription className="text-yellow-200">
          <strong>IMPORTANTE:</strong> Esta integração requer implementação no backend. 
          Entre em contato com a equipe base44 ou habilite Backend Functions em 
          Dashboard → Settings → Backend Functions.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="architecture" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="architecture" className="text-white">Arquitetura</TabsTrigger>
          <TabsTrigger value="apis" className="text-white">APIs</TabsTrigger>
          <TabsTrigger value="data" className="text-white">Estrutura</TabsTrigger>
          <TabsTrigger value="implementation" className="text-white">Backend</TabsTrigger>
        </TabsList>

        <TabsContent value="architecture" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="w-5 h-5" />
                Fluxo de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-800/50 p-4 rounded-lg border border-cyan-500/30">
                <h3 className="text-cyan-400 font-semibold mb-3">1. Coleta (Backend Scheduled Job)</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>✅ Cronjob executando a cada 6 horas</p>
                  <p>✅ Chamadas paralelas às APIs (Google, Facebook, Instagram)</p>
                  <p>✅ Timeout de 30s por API</p>
                  <p>✅ Retry com exponential backoff</p>
                </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-purple-500/30">
                <h3 className="text-purple-400 font-semibold mb-3">2. Transformação (ETL Pipeline)</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>✅ Normalização de dados (formato unificado)</p>
                  <p>✅ Extração de geolocalização (lat/lng)</p>
                  <p>✅ Classificação automática (ML/NLP)</p>
                  <p>✅ Deduplicação (nome + data + local)</p>
                </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-green-500/30">
                <h3 className="text-green-400 font-semibold mb-3">3. Armazenamento (Database)</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>✅ Inserção em lote (bulk insert)</p>
                  <p>✅ Índices em geolocalização (spatial index)</p>
                  <p>✅ Arquivamento automático de eventos passados</p>
                  <p>✅ Logs de sync com rastreabilidade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Globe className="w-5 h-5 text-cyan-400" />
                APIs de Integração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-4 rounded-lg border border-cyan-500/30">
                <h3 className="text-cyan-400 font-bold mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Google Places / Events API
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Endpoint:</p>
                    <code className="text-xs bg-black/50 p-2 rounded block text-cyan-300">
                      GET https://maps.googleapis.com/maps/api/place/nearbysearch/json
                    </code>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Parâmetros:</p>
                    <code className="text-xs bg-black/50 p-2 rounded block text-gray-300">
                      location=-23.5505,-46.6333&radius=10000&type=night_club
                    </code>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300">1000 req/dia Free</Badge>
                    <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300">Geolocalização</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-4 rounded-lg border border-purple-500/30">
                <h3 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Facebook Graph API
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Endpoint:</p>
                    <code className="text-xs bg-black/50 p-2 rounded block text-purple-300">
                      GET https://graph.facebook.com/v18.0/search?type=event
                    </code>
                  </div>
                  <Alert className="bg-red-900/20 border-red-500/50">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <AlertDescription className="text-red-200 text-xs">
                      Requer App Review + Permissões Especiais
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-900/30 to-orange-900/30 p-4 rounded-lg border border-pink-500/30">
                <h3 className="text-pink-400 font-bold mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Instagram Graph API
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Hashtags Monitoradas:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['#evento', '#party', '#underground', '#techno', '#festival'].map(tag => (
                        <Badge key={tag} className="bg-pink-600/20 border-pink-500/30 text-pink-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Code className="w-5 h-5 text-green-400" />
                Estrutura de Dados - Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-green-300 bg-gray-800 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">{`{
  "id": "uuid",
  "title": "Underground Beats Vol.2",
  "description": "Evento techno independente",
  "date": "2025-11-04T22:00:00Z",
  
  "location": {
    "venue_name": "Galpão 47",
    "address": "Rua Augusta, 1234",
    "city": "São Paulo",
    "lat": -23.5505,
    "lng": -46.6333
  },
  
  "source": "facebook",
  "source_id": "fb_123456",
  "source_url": "https://fb.com/events/123",
  
  "organizer": {
    "name": "Beat Underground",
    "url": "https://fb.com/beatug"
  },
  
  "genre": "techno",
  "vibe_tags": ["techno", "underground"],
  
  "media": {
    "images": ["url1", "url2"],
    "thumbnail": "url_thumb"
  },
  
  "relevance_score": 0.85,
  
  "sync_metadata": {
    "last_sync": "2025-01-20T10:30:00Z",
    "is_duplicate": false
  }
}`}</pre>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Filter className="w-5 h-5 text-yellow-400" />
                Algoritmo de Deduplicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-yellow-400 font-semibold mb-2">Critérios:</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>✅ Similaridade de título {'>'} 80%</li>
                  <li>✅ Mesma data (±24h)</li>
                  <li>✅ Distância {'<'} 500m</li>
                  <li>✅ Manter evento com maior relevance_score</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementation" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="w-5 h-5 text-orange-400" />
                Implementação Backend (Node.js)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-orange-900/20 border-orange-500/50">
                <Zap className="w-5 h-5 text-orange-400" />
                <AlertDescription className="text-orange-200">
                  <strong>REQUER:</strong> Habilitar Backend Functions no Dashboard → Settings
                </AlertDescription>
              </Alert>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-orange-400 font-semibold mb-2">1. Criar Scheduled Job</h4>
                <code className="text-xs bg-black/50 p-3 rounded block text-gray-300">
                  // backend/jobs/syncEvents.js{'\n'}
                  cron.schedule('0 */6 * * *', syncAllEvents);
                </code>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-orange-400 font-semibold mb-2">2. Instalar Dependências</h4>
                <code className="text-xs bg-black/50 p-3 rounded block text-gray-300">
                  npm install node-cron axios googleapis{'\n'}
                  npm install @faker-js/faker leven
                </code>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-orange-400 font-semibold mb-2">3. Configurar Variáveis de Ambiente</h4>
                <code className="text-xs bg-black/50 p-3 rounded block text-gray-300">
                  GOOGLE_MAPS_API_KEY=your_key{'\n'}
                  FACEBOOK_ACCESS_TOKEN=your_token{'\n'}
                  INSTAGRAM_ACCESS_TOKEN=your_token
                </code>
              </div>

              <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
                <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Próximos Passos
                </h4>
                <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
                  <li>Contatar suporte base44 para habilitar backend</li>
                  <li>Obter API keys (Google, Facebook, Instagram)</li>
                  <li>Implementar funções de sync no backend</li>
                  <li>Testar em ambiente de staging</li>
                  <li>Deploy para produção</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <RefreshCw className="w-5 h-5 text-blue-400" />
                Ciclo de Atualização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                  <span className="text-gray-300 text-sm">00:00 UTC</span>
                  <span className="text-cyan-400 font-semibold">Sync Google Events</span>
                </div>
                <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                  <span className="text-gray-300 text-sm">06:00 UTC</span>
                  <span className="text-purple-400 font-semibold">Sync Facebook Events</span>
                </div>
                <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                  <span className="text-gray-300 text-sm">12:00 UTC</span>
                  <span className="text-pink-400 font-semibold">Sync Instagram Posts</span>
                </div>
                <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                  <span className="text-gray-300 text-sm">18:00 UTC</span>
                  <span className="text-orange-400 font-semibold">Archive Expired Events</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}