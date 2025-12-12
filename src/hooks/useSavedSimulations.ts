import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SavedSimulation {
  id: string;
  user_id: string;
  type: "goal" | "contribution";
  name: string;
  initial_value: number;
  target: number | null;
  monthly_contribution: number | null;
  years: number;
  rate: number;
  result: number;
  total_invested: number | null;
  earnings: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSimulationData {
  type: "goal" | "contribution";
  name: string;
  initial_value: number;
  target?: number | null;
  monthly_contribution?: number | null;
  years: number;
  rate: number;
  result: number;
  total_invested?: number | null;
  earnings?: number | null;
}

export const useSavedSimulations = () => {
  const queryClient = useQueryClient();

  const { data: simulations = [], isLoading, error } = useQuery({
    queryKey: ["saved-simulations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("saved_simulations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SavedSimulation[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (simulation: CreateSimulationData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("saved_simulations")
        .insert({
          user_id: user.id,
          type: simulation.type,
          name: simulation.name,
          initial_value: simulation.initial_value,
          target: simulation.target,
          monthly_contribution: simulation.monthly_contribution,
          years: simulation.years,
          rate: simulation.rate,
          result: simulation.result,
          total_invested: simulation.total_invested,
          earnings: simulation.earnings,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-simulations"] });
      toast.success("Simulação salva para comparação");
    },
    onError: (error) => {
      console.error("Erro ao salvar simulação:", error);
      toast.error("Erro ao salvar simulação");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("saved_simulations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-simulations"] });
      toast.success("Simulação removida");
    },
    onError: (error) => {
      console.error("Erro ao remover simulação:", error);
      toast.error("Erro ao remover simulação");
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("saved_simulations")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-simulations"] });
      toast.success("Todas as simulações foram removidas");
    },
    onError: (error) => {
      console.error("Erro ao remover simulações:", error);
      toast.error("Erro ao remover simulações");
    },
  });

  return {
    simulations,
    isLoading,
    error,
    saveSimulation: createMutation.mutate,
    deleteSimulation: deleteMutation.mutate,
    deleteAllSimulations: deleteAllMutation.mutate,
    isSaving: createMutation.isPending,
    isDeleting: deleteMutation.isPending || deleteAllMutation.isPending,
  };
};
