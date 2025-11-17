import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Plus, Trash2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function EventPolls({ event, user }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: "", options: ["", ""] });
  const queryClient = useQueryClient();

  const { data: polls = [] } = useQuery({
    queryKey: ['eventPolls', event.id],
    queryFn: async () => {
      return await base44.entities.EventPoll.filter({ event_id: event.id }, "-created_date");
    },
    staleTime: 30000,
  });

  const { data: votes = [] } = useQuery({
    queryKey: ['pollVotes', event.id],
    queryFn: async () => {
      const pollIds = polls.map(p => p.id);
      if (pollIds.length === 0) return [];
      return await base44.entities.EventPollVote.filter({ poll_id: { $in: pollIds } });
    },
    enabled: polls.length > 0,
    staleTime: 15000,
  });

  const createPollMutation = useMutation({
    mutationFn: async (pollData) => {
      return await base44.entities.EventPoll.create({
        event_id: event.id,
        organizer_id: user.id,
        question: pollData.question,
        options: pollData.options.filter(o => o.trim()),
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventPolls', event.id]);
      setShowCreate(false);
      setNewPoll({ question: "", options: ["", ""] });
    }
  });

  const closePollMutation = useMutation({
    mutationFn: async (pollId) => {
      return await base44.entities.EventPoll.update(pollId, { is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventPolls', event.id]);
    }
  });

  const getVotesForOption = (pollId, option) => {
    return votes.filter(v => v.poll_id === pollId && v.selected_option === option).length;
  };

  const getTotalVotes = (pollId) => {
    return votes.filter(v => v.poll_id === pollId).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Enquetes
        </h3>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Enquete
        </Button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gray-800 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white text-sm">Criar Nova Enquete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Pergunta da enquete..."
                value={newPoll.question}
                onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
              />
              
              {newPoll.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Opção ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const updated = [...newPoll.options];
                      updated[index] = e.target.value;
                      setNewPoll({ ...newPoll, options: updated });
                    }}
                    className="bg-gray-900 border-gray-700 text-white flex-1"
                  />
                  {newPoll.options.length > 2 && (
                    <Button
                      onClick={() => setNewPoll({
                        ...newPoll,
                        options: newPoll.options.filter((_, i) => i !== index)
                      })}
                      variant="ghost"
                      size="icon"
                      className="text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              <div className="flex gap-2">
                <Button
                  onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ""] })}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Adicionar Opção
                </Button>
                <Button
                  onClick={() => createPollMutation.mutate(newPoll)}
                  disabled={!newPoll.question || newPoll.options.filter(o => o.trim()).length < 2}
                  className="flex-1 bg-cyan-600"
                >
                  Criar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="space-y-3">
        {polls.map((poll) => {
          const totalVotes = getTotalVotes(poll.id);
          
          return (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className={`bg-gray-900/50 ${poll.is_active ? 'border-cyan-500/30' : 'border-gray-700'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-white text-sm flex-1">{poll.question}</CardTitle>
                    {poll.is_active ? (
                      <Badge className="bg-green-600/20 border-green-500/30 text-green-300">
                        Ativa
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-600/20 border-gray-500/30 text-gray-300">
                        Encerrada
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-gray-400">{totalVotes} votos totais</p>
                  
                  <div className="space-y-2">
                    {poll.options.map((option, index) => {
                      const votes = getVotesForOption(poll.id, option);
                      const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                      
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">{option}</span>
                            <span className="text-cyan-400 font-semibold">
                              {votes} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>

                  {poll.is_active && (
                    <Button
                      onClick={() => closePollMutation.mutate(poll.id)}
                      variant="outline"
                      size="sm"
                      className="w-full text-orange-400 border-orange-500/30"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Encerrar Enquete
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {polls.length === 0 && !showCreate && (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma enquete criada</p>
          </div>
        )}
      </div>
    </div>
  );
}