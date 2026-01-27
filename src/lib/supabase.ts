
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isMock = !supabaseUrl || !supabaseAnonKey || supabaseAnonKey.includes('INSERT_YOUR_ANON_KEY');

// Simple in-memory session mock
let mockSession: any = null;
const authListeners: any[] = [];

const mockClient = {
    auth: {
        getSession: async () => {
            return { data: { session: mockSession }, error: null };
        },
        signInWithPassword: async ({ email }: any) => {
            mockSession = {
                user: { email },
                access_token: 'mock-token',
                refresh_token: 'mock-refresh'
            };
            authListeners.forEach(cb => cb('SIGNED_IN', mockSession));
            return { data: { session: mockSession }, error: null };
        },
        signOut: async () => {
            mockSession = null;
            authListeners.forEach(cb => cb('SIGNED_OUT', null));
            return { error: null };
        },
        onAuthStateChange: (cb: any) => {
            authListeners.push(cb);
            // Fire immediately with current state
            cb(mockSession ? 'SIGNED_IN' : 'SIGNED_OUT', mockSession);
            return { data: { subscription: { unsubscribe: () => { } } } };
        }
    }
};

if (isMock) {
    console.warn('Supabase keys are missing or placeholders. Using MOCK client for local dev.');
}

export const supabase = isMock ? (mockClient as any) : createClient(supabaseUrl || '', supabaseAnonKey || '');
