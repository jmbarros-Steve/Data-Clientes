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

    // Verify auth
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

    const { meta_account_id, date_preset = "last_30d" } = await req.json()

    // Get access token for this meta account
    const { data: metaAccount } = await supabase
      .from("meta_accounts")
      .select("access_token")
      .eq("meta_account_id", meta_account_id)
      .single()

    if (!metaAccount) {
      return new Response(JSON.stringify({ error: "Cuenta de Meta no encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Fetch from Meta Marketing API
    const fields = "campaign_name,objective,status"
    const insightFields = "impressions,reach,clicks,ctr,spend,cpc,cpm,actions,cost_per_action_type,frequency"
    const metaUrl = `https://graph.facebook.com/v19.0/${meta_account_id}/campaigns?fields=${fields}&limit=100&access_token=${metaAccount.access_token}`

    const campaignsRes = await fetch(metaUrl)
    const campaignsData = await campaignsRes.json()

    if (campaignsData.error) {
      return new Response(JSON.stringify({ error: campaignsData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Fetch insights for each campaign
    const campaigns = await Promise.all(
      (campaignsData.data || []).map(async (campaign: any) => {
        try {
          const insightsUrl = `https://graph.facebook.com/v19.0/${campaign.id}/insights?fields=${insightFields}&date_preset=${date_preset}&access_token=${metaAccount.access_token}`
          const insightsRes = await fetch(insightsUrl)
          const insightsData = await insightsRes.json()
          const insight = insightsData.data?.[0] || {}

          // Extract conversions from actions
          const purchaseAction = (insight.actions || []).find((a: any) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase")
          const conversions = purchaseAction ? parseInt(purchaseAction.value) : 0

          const costPerPurchase = (insight.cost_per_action_type || []).find((a: any) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase")
          const costPerConversion = costPerPurchase ? parseFloat(costPerPurchase.value) : 0

          const spend = parseFloat(insight.spend || "0")
          const roas = costPerConversion > 0 && conversions > 0 ? (conversions * costPerConversion) / spend : 0

          return {
            campaign_id: campaign.id,
            campaign_name: campaign.campaign_name || campaign.name,
            status: campaign.status,
            objective: campaign.objective,
            impressions: parseInt(insight.impressions || "0"),
            reach: parseInt(insight.reach || "0"),
            clicks: parseInt(insight.clicks || "0"),
            ctr: parseFloat(insight.ctr || "0"),
            spend,
            cpc: parseFloat(insight.cpc || "0"),
            cpm: parseFloat(insight.cpm || "0"),
            conversions,
            cost_per_conversion: costPerConversion,
            roas,
            frequency: parseFloat(insight.frequency || "0"),
            date_start: insight.date_start,
            date_stop: insight.date_stop,
          }
        } catch {
          return {
            campaign_id: campaign.id,
            campaign_name: campaign.campaign_name || campaign.name,
            status: campaign.status,
            objective: campaign.objective,
            impressions: 0, reach: 0, clicks: 0, ctr: 0, spend: 0,
            cpc: 0, cpm: 0, conversions: 0, cost_per_conversion: 0,
            roas: 0, frequency: 0, date_start: null, date_stop: null,
          }
        }
      })
    )

    // Cache results
    await supabase.from("campaign_cache").upsert({
      meta_account_id,
      cache_type: "campaigns",
      data: campaigns,
      fetched_at: new Date().toISOString(),
    }, {
      onConflict: "meta_account_id,cache_type",
    }).select()

    return new Response(JSON.stringify({ campaigns }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
