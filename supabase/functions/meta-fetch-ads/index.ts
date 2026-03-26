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

    const { meta_account_id, adset_id } = await req.json()

    const { data: metaAccount } = await supabase
      .from("meta_accounts")
      .select("access_token")
      .eq("meta_account_id", meta_account_id)
      .single()

    if (!metaAccount) {
      return new Response(JSON.stringify({ error: "Cuenta no encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const fields = "name,status,creative{thumbnail_url},insights{impressions,clicks,spend,ctr,cpc,actions}"
    const url = `https://graph.facebook.com/v19.0/${adset_id}/ads?fields=${fields}&date_preset=last_30d&access_token=${metaAccount.access_token}`

    const res = await fetch(url)
    const data = await res.json()

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const ads = (data.data || []).map((ad: any) => {
      const insight = ad.insights?.data?.[0] || {}
      const purchaseAction = (insight.actions || []).find((a: any) => a.action_type === "purchase")

      return {
        ad_id: ad.id,
        ad_name: ad.name,
        status: ad.status,
        impressions: parseInt(insight.impressions || "0"),
        clicks: parseInt(insight.clicks || "0"),
        spend: parseFloat(insight.spend || "0"),
        ctr: parseFloat(insight.ctr || "0"),
        cpc: parseFloat(insight.cpc || "0"),
        conversions: purchaseAction ? parseInt(purchaseAction.value) : 0,
        creative_thumbnail_url: ad.creative?.thumbnail_url || null,
      }
    })

    return new Response(JSON.stringify({ ads }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
