import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";
// Using PBKDF2 via Web Crypto; bcrypt removed (not supported in Edge runtime)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Password hashing not used here; rely solely on Supabase Auth for credentials



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

    const { fullName, email, password, role } = await req.json();

    if (!fullName || !email || !password || !role) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios ausentes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Senha deve conter ao menos 8 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedRoles = ["analista", "leitura", "supervisor"];
    if (!allowedRoles.includes(String(role))) {
      return new Response(
        JSON.stringify({ error: "Perfil inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize inputs
    const emailLower = String(email).trim().toLowerCase();
    const parts = String(fullName).trim().split(/\s+/);
    const firstName = parts[0] ?? null;
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;

    // Create auth user first to satisfy FK and enforce unique email
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: emailLower,
      password: String(password),
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    });

    if (createErr || !created?.user?.id) {
      console.error("Erro ao criar usuário de autenticação:", createErr);
      const msg = createErr?.message?.toLowerCase() || "";
      const isDup = msg.includes("already") || msg.includes("exists");
      return new Response(
        JSON.stringify({ error: isDup ? "E-mail já cadastrado" : "Erro ao criar usuário de autenticação" }),
        { status: isDup ? 409 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUserId = created.user.id;

    // Optionally assign role in user_roles (profile will be created by DB triggers if configured)
    const { error: roleErr } = await supabase
      .from("user_roles")
      .insert({ user_id: authUserId, role });

    if (roleErr) {
      // If duplicate or RLS prevents, just log and continue; user remains created
      console.error("Aviso: falha ao atribuir perfil (prosseguindo)", roleErr);
    }

    return new Response(
      JSON.stringify({
        id: authUserId,
        email: emailLower,
        first_name: firstName,
        last_name: lastName,
        is_active: true,
        role,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro inesperado em create-user:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
