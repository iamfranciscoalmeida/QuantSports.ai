import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MatchFilters {
  team?: string
  season?: string
  from_date?: string
  to_date?: string
  limit?: number
  offset?: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Parse query parameters
    const url = new URL(req.url)
    const filters: MatchFilters = {
      team: url.searchParams.get('team') || undefined,
      season: url.searchParams.get('season') || undefined,
      from_date: url.searchParams.get('from') || undefined,
      to_date: url.searchParams.get('to') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '100'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    }

    // Build query
    let query = supabaseClient
      .from('matches')
      .select('*')
      .order('date', { ascending: false })
      .range(filters.offset!, filters.offset! + filters.limit! - 1)

    // Apply filters
    if (filters.team) {
      query = query.or(`home_team.eq.${filters.team},away_team.eq.${filters.team}`)
    }

    if (filters.season) {
      query = query.eq('season', filters.season)
    }

    if (filters.from_date) {
      query = query.gte('date', filters.from_date)
    }

    if (filters.to_date) {
      query = query.lte('date', filters.to_date)
    }

    // Execute query
    const { data, error } = await query

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        count: data?.length || 0,
        filters: filters
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})