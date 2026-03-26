import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

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

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const token = authHeader.replace("Bearer ", "")
    const { error: authError } = await supabase.auth.getUser(token)
    if (authError) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { meta_account_id, campaign_id } = await req.json()

    // Get access token via direct DB
    const conn = await pool.connect()
    let accessToken: string
    try {
      const result = await conn.queryObject<{ access_token: string }>(
        "SELECT access_token FROM meta_accounts WHERE meta_account_id = $1 LIMIT 1",
        [meta_account_id]
      )
      if (result.rows.length === 0) {
        return new Response(JSON.stringify({ error: "Cuenta no encontrada" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      accessToken = result.rows[0].access_token
    } finally {
      conn.release()
    }

    const fields = "name,status,insights{impressions,reach,clicks,ctr,spend,cpc,actions}"
    const url = `https://graph.facebook.com/v19.0/${campaign_id}/adsets?fields=${fields}&date_preset=last_30d&access_token=${accessToken}`

    const res = await fetch(url)
    const data = await res.json()

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const adsets = (data.data || []).map((adset: any) => {
      const insight = adset.insights?.data?.[0] || {}
      const purchaseAction = (insight.actions || []).find((a: any) => a.action_type === "purchase")
      const conversions = purchaseAction ? parseInt(purchaseAction.value) : 0
      const spend = parseFloat(insight.spend || "0")

      return {
        adset_id: adset.id,
        adset_name: adset.name,
        status: adset.status,
        impressions: parseInt(insight.impressions || "0"),
        reach: parseInt(insight.reach || "0"),
        clicks: parseInt(insight.clicks || "0"),
        ctr: parseFloat(insight.ctr || "0"),
        spend,
        cpc: parseFloat(insight.cpc || "0"),
        conversions,
        roas: spend > 0 && conversions > 0 ? conversions / spend : 0,
      }
    })

    return new Response(JSON.stringify({ adsets }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
