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

    // Try direct DB connection first, fallback to PostgREST
    let isAdmin = false
    let clientId: string | null = null
    let clientData: any = null
    let metaAccounts: any[] = []

    const dbUrl = Deno.env.get("SUPABASE_DB_URL")

    if (dbUrl) {
      // Use direct PostgreSQL connection (bypasses PostgREST)
      try {
        const { Pool } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts")
        const pool = new Pool(dbUrl, 1)
        const conn = await pool.connect()
        try {
          // Check admin
          const adminResult = await conn.queryObject<{ id: string }>(
            "SELECT id FROM admins WHERE user_id = $1 LIMIT 1",
            [user.id]
          )

          if (adminResult.rows.length > 0) {
            isAdmin = true
          } else {
            // Check client
            const clientResult = await conn.queryObject<{
              id: string; name: string; company: string | null; logo_url: string | null
            }>(
              "SELECT id, name, company, logo_url FROM clients WHERE user_id = $1 LIMIT 1",
              [user.id]
            )

            if (clientResult.rows.length > 0) {
              const c = clientResult.rows[0]
              clientId = c.id
              clientData = c

              const accountsResult = await conn.queryObject<{
                id: string; meta_account_id: string; meta_account_name: string | null
              }>(
                "SELECT id, meta_account_id, meta_account_name FROM meta_accounts WHERE client_id = $1",
                [c.id]
              )
              metaAccounts = accountsResult.rows
            }
          }
        } finally {
          conn.release()
          await pool.end()
        }
      } catch (dbErr) {
        console.error("Direct DB failed, using PostgREST:", dbErr)
        // Fallback to PostgREST below
        await fallbackPostgREST(supabase, user.id)
          .then(result => {
            isAdmin = result.isAdmin
            clientId = result.clientId
            clientData = result.clientData
            metaAccounts = result.metaAccounts
          })
      }
    } else {
      console.warn("SUPABASE_DB_URL not available, using PostgREST")
      const result = await fallbackPostgREST(supabase, user.id)
      isAdmin = result.isAdmin
      clientId = result.clientId
      clientData = result.clientData
      metaAccounts = result.metaAccounts
    }

    return new Response(JSON.stringify({ isAdmin, clientId, clientData, metaAccounts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("auth-check-role error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

async function fallbackPostgREST(supabase: any, userId: string) {
  let isAdmin = false
  let clientId: string | null = null
  let clientData: any = null
  let metaAccounts: any[] = []

  const { data: adminData } = await supabase
    .from("admins")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (adminData) {
    isAdmin = true
  } else {
    const { data: client } = await supabase
      .from("clients")
      .select("id, name, company, logo_url")
      .eq("user_id", userId)
      .maybeSingle()

    if (client) {
      clientId = client.id
      clientData = client

      const { data: accounts } = await supabase
        .from("meta_accounts")
        .select("id, meta_account_id, meta_account_name")
        .eq("client_id", client.id)

      metaAccounts = accounts || []
    }
  }

  return { isAdmin, clientId, clientData, metaAccounts }
}
