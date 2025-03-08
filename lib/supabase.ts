import { createClient } from '@supabase/supabase-js'

// Define types at the top
export interface NewsData {
  id: string
  headline: string
  source: string
  url: string
  image_url?: string
  art_style?: string
  created_at: string
  user_email: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Email related queries
export const emailQueries = {
  saveEmail: async (email: string) => {
    const { data, error } = await supabase
      .from('emails')
      .insert([{ email }])
      .single()
    
    if (error) throw error
    return data
  },

  getEmailStatus: async (email: string) => {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) throw error
    return data
  }
}

// News history related queries
export const newsQueries = {
  saveNewsToHistory: async (newsData: {
    headline: string
    source: string
    url: string
    image_url?: string
    user_email: string
  }) => {
    const { data, error } = await supabase
      .from('news_history')
      .insert([newsData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  fetchUserNewsHistory: async (email: string) => {
    const { data, error } = await supabase
      .from('news_history')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data
  },

  getLatestNews: async (email: string) => {
    const { data, error } = await supabase
      .from('news_history')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error
    return data
  },

  async getNewsById(id: string): Promise<NewsData | null> {
    const { data, error } = await supabase
      .from('news_history')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as NewsData
  }
}

// Rate limit related queries
export const rateLimitQueries = {
  getDailyUsage: async (email: string) => {
    const { data, error } = await supabase
      .from('usage_metrics')
      .select('visualizations_count')
      .eq('user_email', email)
      .eq('date', new Date().toISOString().split('T')[0])
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data?.visualizations_count || 0
  },

  incrementUsage: async (email: string) => {
    const { error } = await supabase.rpc('increment_usage', { 
      p_email: email 
    })
    if (error) throw error
    return true
  },

  resetDailyLimit: async (email: string) => {
    const { error } = await supabase
      .from('usage_metrics')
      .upsert({
        user_email: email,
        date: new Date().toISOString().split('T')[0],
        visualizations_count: 0
      })
    
    if (error) throw error
    return true
  }
}

// Subscription related queries
export const subscriptionQueries = {
  getCurrentSubscription: async (email: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_email', email)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return data;
  },

  getDailyUsage: async (email: string) => {
    const { data, error } = await supabase
      .from('usage_metrics')
      .select('visualizations_count')
      .eq('user_email', email)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  incrementUsage: async (email: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('usage_metrics')
      .upsert({
        user_email: email,
        date: today,
        visualizations_count: 1
      }, {
        onConflict: 'user_email,date',
        count: 'exact'
      });

    if (error) throw error;
  }
}

// Add timestamp check to prevent too frequent API calls
export async function shouldFetchNewHeadline() {
  const { data: latestNews } = await supabase
    .from('news')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!latestNews?.length) return true;

  const lastFetchTime = new Date(latestNews[0].created_at);
  const now = new Date();
  const hoursSinceLastFetch = (now.getTime() - lastFetchTime.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastFetch >= 1; // Only fetch new headlines every hour
}

export async function saveNewsWithStyle(
  title: string, 
  image: string, 
  artStyle: { id: string; name: string }
) {
  const { error } = await supabase.from('news').insert([{ 
    title, 
    image,
    art_style_id: artStyle.id,
    art_style_name: artStyle.name
  }]);

  if (error) throw error;
} 