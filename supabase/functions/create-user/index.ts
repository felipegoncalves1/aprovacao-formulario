import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";
// Using PBKDF2 via Web Crypto; bcrypt removed (not supported in Edge runtime)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Password hashing using Web Crypto PBKDF2 (Deno-compatible, no Workers)
const PBKDF2_ITERATIONS = 310000;
const PBKDF2_HASH = "SHA-256";

function bytesToBase64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

function generateSalt(length = 16): Uint8Array {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return salt;
}

async function hashPasswordPBKDF2(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = generateSalt(16);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: PBKDF2_HASH, salt, iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    256
  );
  const hashB64 = bytesToBase64(bits);
  const saltB64 = bytesToBase64(salt);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltB64}$${hashB64}`;
}


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

    // Prevent duplicate emails manually (no unique index enforced yet)
    const { data: existing, error: checkErr } = await supabase
      .from("profiles")
      .select("id, email")
      .ilike("email", emailLower)
      .maybeSingle();

    if (checkErr) {
      console.error("Erro checando e-mail existente:", checkErr);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar e-mail existente" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existing) {
      return new Response(
        JSON.stringify({ error: "E-mail já cadastrado" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash password using PBKDF2 (SHA-256)
    const passwordHash = await hashPasswordPBKDF2(password);


    // Create profile row
    const { data: profile, error: insertErr } = await supabase
      .from("profiles")
      .insert({
        email: emailLower,
        first_name: firstName,
        last_name: lastName,
        is_active: true,
        password_hash: passwordHash,
      })
      .select("id, email, first_name, last_name, is_active")
      .single();

    if (insertErr) {
      console.error("Erro ao inserir profile:", insertErr);
      return new Response(
        JSON.stringify({ error: "Erro ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign role
    const { error: roleErr } = await supabase
      .from("user_roles")
      .insert({ user_id: profile.id, role });

    if (roleErr) {
      console.error("Erro ao atribuir perfil:", roleErr);
      // Best-effort cleanup: mark user inactive if role assignment failed
      await supabase.from("profiles").update({ is_active: false }).eq("id", profile.id);
      return new Response(
        JSON.stringify({ error: "Erro ao atribuir perfil de acesso" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        is_active: profile.is_active,
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
