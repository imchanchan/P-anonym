import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

// Create Supabase client only if configured, otherwise use a mock
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isUsingSupabase = isSupabaseConfigured;

// Database Types
export interface Post {
  id: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  created_at: string;
}

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'sell' | 'free';
  price?: string;
  status: 'available' | 'reserved' | 'completed';
  likes: number;
  created_at: string;
}

export interface MarketItemImage {
  id: string;
  market_item_id: string;
  url: string;
  path: string;
  sort_order: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: 'me' | 'other';
  created_at: string;
}

export interface Conversation {
  id: string;
  nickname: string;
  last_message: string;
  unread: boolean;
  created_at: string;
  updated_at: string;
}
