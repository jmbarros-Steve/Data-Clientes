import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!admin) {
      return new Response(JSON.stringify({ error: "Solo administradores" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { access_token, business_id } = await req.json()

    if (!access_token) {
      return new Response(JSON.stringify({ error: "access_token requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    let accounts: any[] = []

    if (business_id) {
      // Listar ad accounts del Business Manager
      const url = `https://graph.facebook.com/v19.0/${business_id}/owned_ad_accounts?fields=id,name,account_id,account_status,currency,timezone_name,business_name&limit=100&access_token=${access_token}`
      const res = await fetch(url)
      const data = await res.json()

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      accounts = (data.data || []).map((acc: any) => ({
        id: acc.id,
        account_id: acc.account_id,
        name: acc.name,
        status: acc.account_status === 1 ? "ACTIVE" : acc.account_status === 2 ? "DISABLED" : "UNKNOWN",
        currency: acc.currency,
        timezone: acc.timezone_name,
        business_name: acc.business_name,
      }))
    } else {
      // Listar ad accounts del usuario (sin business)
      const url = `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id,account_status,currency,timezone_name&limit=100&access_token=${access_token}`
      const res = await fetch(url)
      const data = await res.json()

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      accounts = (data.data || []).map((acc: any) => ({
        id: acc.id,
        account_id: acc.account_id,
        name: acc.name,
        status: acc.account_status === 1 ? "ACTIVE" : acc.account_status === 2 ? "DISABLED" : "UNKNOWN",
        currency: acc.currency,
        timezone: acc.timezone_name,
      }))
    }

    // También listar Business Managers del usuario
    const bmUrl = `https://graph.facebook.com/v19.0/me/businesses?fields=id,name&limit=50&access_token=${access_token}`
    const bmRes = await fetch(bmUrl)
    const bmData = await bmRes.json()

    const businesses = (bmData.data || []).map((bm: any) => ({
      id: bm.id,
      name: bm.name,
    }))

    return new Response(JSON.stringify({ accounts, businesses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
