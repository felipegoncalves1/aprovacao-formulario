import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Supabase environment not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { userId, password, role } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualiza senha se foi informada
    if (password) {
      if (typeof password !== "string" || password.length < 8) {
        return new Response(
          JSON.stringify({ error: "Senha deve conter ao menos 8 caracteres" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { error: passErr } = await supabase.auth.admin.updateUserById(userId, {
        password,
      });
      if (passErr) {
        console.error("Erro ao atualizar senha:", passErr);
        return new Response(
          JSON.stringify({ error: "Falha ao atualizar senha" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Atualiza perfil de acesso, se informado
    if (role) {
      const allowedRoles = ["analista", "leitura", "supervisor"];
      if (!allowedRoles.includes(String(role))) {
        return new Response(
          JSON.stringify({ error: "Perfil inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Remove papéis anteriores e define apenas o informado
      const { error: delErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (delErr) {
        console.error("Erro ao limpar perfis anteriores:", delErr);
      }

      const { error: insErr } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (insErr) {
        console.error("Erro ao definir novo perfil:", insErr);
        return new Response(
          JSON.stringify({ error: "Falha ao atualizar perfil de acesso" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro inesperado em update-user:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
