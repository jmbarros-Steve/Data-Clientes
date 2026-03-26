import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Direct DB pool (bypasses PostgREST)
const dbUrl = Deno.env.get("SUPABASE_DB_URL")!
const pool = new Pool(dbUrl, 1)

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify auth token
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const conn = await pool.connect()
    try {
      // Check if admin
      const adminResult = await conn.queryObject<{ id: string }>(
        "SELECT id FROM admins WHERE user_id = $1 LIMIT 1",
        [user.id]
      )

      if (adminResult.rows.length > 0) {
        return new Response(JSON.stringify({
          isAdmin: true,
          clientId: null,
          clientData: null,
          metaAccounts: [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      // Check if client
      const clientResult = await conn.queryObject<{
        id: string; name: string; company: string | null; logo_url: string | null
      }>(
        "SELECT id, name, company, logo_url FROM clients WHERE user_id = $1 LIMIT 1",
        [user.id]
      )

      if (clientResult.rows.length > 0) {
        const client = clientResult.rows[0]

        // Get meta accounts for this client
        const accountsResult = await conn.queryObject<{
          id: string; meta_account_id: string; meta_account_name: string | null
        }>(
          "SELECT id, meta_account_id, meta_account_name FROM meta_accounts WHERE client_id = $1",
          [client.id]
        )

        return new Response(JSON.stringify({
          isAdmin: false,
          clientId: client.id,
          clientData: client,
          metaAccounts: accountsResult.rows,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      // Not found in either table
      return new Response(JSON.stringify({
        isAdmin: false,
        clientId: null,
        clientData: null,
        metaAccounts: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    } finally {
      conn.release()
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
