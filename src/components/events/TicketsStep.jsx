import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Plus, Trash2, DollarSign, Clock, AlertCircle } from "lucide-react";

export default function TicketsStep({ 
  formData, 
  errors, 
  onTicketChange, 
  onAddTicket, 
  onRemoveTicket 
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Ticket className="w-8 h-8 text-green-400" />
        <h2 className="text-2xl font-bold">Configurar Ingressos</h2>
      </div>

      {errors.tickets && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400 text-sm">{errors.tickets}</p>
        </div>
      )}

      <div className="space-y-4">
        {formData.ticket_types.map((ticket, index) => (
          <Card key={index} className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-cyan-400" />
                  Ingresso #{index + 1}
                </CardTitle>
                {formData.ticket_types.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveTicket(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300 mb-2 block">Nome do Ingresso *</Label>
                  <Input
                    value={ticket.name}
                    onChange={(e) => onTicketChange(index, 'name', e.target.value)}
                    placeholder="Ex: Pista, VIP, Camarote"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  {errors[`ticket_${index}_name`] && (
                    <p className="text-red-400 text-xs mt-1">{errors[`ticket_${index}_name`]}</p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-300 mb-2 block">Preço (R$) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      value={ticket.price}
                      onChange={(e) => onTicketChange(index, 'price', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white pl-10"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {errors[`ticket_${index}_price`] && (
                    <p className="text-red-400 text-xs mt-1">{errors[`ticket_${index}_price`]}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300 mb-2 block">Quantidade Disponível *</Label>
                  <Input
                    type="number"
                    value={ticket.quantity}
                    onChange={(e) => onTicketChange(index, 'quantity', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    min="1"
                  />
                  {errors[`ticket_${index}_quantity`] && (
                    <p className="text-red-400 text-xs mt-1">{errors[`ticket_${index}_quantity`]}</p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-300 mb-2 block">Descrição</Label>
                  <Input
                    value={ticket.description}
                    onChange={(e) => onTicketChange(index, 'description', e.target.value)}
                    placeholder="Ex: Acesso à pista principal"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <Label className="text-yellow-300 font-semibold">Preço Promocional (Early Bird)</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 text-xs mb-1 block">Preço Promocional (R$)</Label>
                    <Input
                      type="number"
                      value={ticket.early_bird_price || ''}
                      onChange={(e) => onTicketChange(index, 'early_bird_price', e.target.value)}
                      placeholder="Ex: 35.00"
                      className="bg-gray-800 border-gray-600 text-white"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs mb-1 block">Válido Até</Label>
                    <Input
                      type="datetime-local"
                      value={ticket.early_bird_until || ''}
                      onChange={(e) => onTicketChange(index, 'early_bird_until', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onAddTicket}
        className="w-full border-dashed border-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Tipo de Ingresso
      </Button>

      <Card className="bg-cyan-500/10 border-cyan-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-cyan-300 font-semibold">Total de Ingressos:</span>
            <span className="text-2xl font-bold text-white">
              {formData.ticket_types.reduce((sum, t) => sum + (t.quantity || 0), 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-cyan-300 font-semibold">Receita Potencial:</span>
            <span className="text-2xl font-bold text-green-400">
              R$ {formData.ticket_types.reduce((sum, t) => sum + (t.price * t.quantity), 0).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}