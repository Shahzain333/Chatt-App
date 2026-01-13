// supabase-client.js
import { createClient } from "@supabase/supabase-js";

class SupabaseService {
  constructor() {
    this.supabase = null;
    this.subscriptions = new Map();
  }

  init() {
    if (this.supabase) return this.supabase;
    
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { persistSession: true } }
    );

    return this.supabase;
  }

  // ============ AUTH ============
  async signUp(email, password, username = '') {
    try {
      const supabase = this.init();
      
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;

      // 2. Create user in users table (same as Firebase)
      if (authData.user) {
        await this.addUser({
          uid: authData.user.id,
          email: authData.user.email,
          username: username || email.split('@')[0],
          fullName: username || '',
          image: ""
        });
      }

      return authData;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  async signIn(email, password) {
    const supabase = this.init();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const supabase = this.init();
    // Clean up subscriptions
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions.clear();
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  }

  async signInWithGoogle() {
    const supabase = this.init();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  }

  async signInWithGitHub() {
    const supabase = this.init();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  }

  onAuthStateChange(callback) {
    const supabase = this.init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // For OAuth logins, create user profile
        if (event === 'SIGNED_IN') {
          this.addUser({
            uid: session.user.id,
            email: session.user.email,
            username: session.user.email?.split('@')[0] || '',
            fullName: session.user.user_metadata?.full_name ||  session.user.user_metadata?.fullname || '',
            image: session.user.user_metadata?.avatar_url || ""
          }).catch(console.error);
        }
        callback(session.user);
      } else {
        callback(null);
      }
    });
    return () => subscription?.unsubscribe();
  }

  // ============ USERS ============
  async addUser(userData) {
    try {
      const supabase = this.init();
      const existingUser = await this.getUser(userData.uid);
      
      if (existingUser) {
        return userData.uid; // User already exists
      }

      const { error } = await supabase
        .from('users')
        .insert({
          uid: userData.uid,
          email: userData.email,
          username: userData.username,
          fullname: userData.fullName,
          image: userData.image,
          //createdAt: new Date().toISOString()
        });

      if (error) throw error;
      return userData.uid;
    } catch (error) {
      console.error("Error adding user:", error);
      throw error;
    }
  }

  async getUser(uid) {
    try {
      const supabase = this.init();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', uid)
        .single();

      if (error || !data) return null;
      return data;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  listenForUser(uid, callback) {
    const supabase = this.init();
    
    // Get initial data
    this.getUser(uid).then(callback);

    // Listen for changes
    const channel = supabase
      .channel(`user-${uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `uid=eq.${uid}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            callback(null);
          } else {
            callback(payload.new);
          }
        }
      )
      .subscribe();

    const unsubscribe = () => {
      supabase.removeChannel(channel);
      this.subscriptions.delete(`user-${uid}`);
    };
    
    this.subscriptions.set(`user-${uid}`, unsubscribe);
    return unsubscribe;
  }

  async getAllUsers() {
    try {
      const supabase = this.init();
      const currentUser = await this.getCurrentUser();
      
      if (!currentUser) return [];

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('email', currentUser.email);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  listenForAllUsers(callback) {
    const supabase = this.init();
    
    // Get initial data
    this.getAllUsers().then(callback);

    // Listen for changes
    const channel = supabase
      .channel('all-users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        async () => {
          const users = await this.getAllUsers();
          callback(users);
        }
      )
      .subscribe();

    const unsubscribe = () => {
      supabase.removeChannel(channel);
      this.subscriptions.delete('all-users');
    };
    
    this.subscriptions.set('all-users', unsubscribe);
    return unsubscribe;
  }

  async searchUsers(searchTerm) {
    try {
      const supabase = this.init();
      const currentUser = await this.getCurrentUser();
      
      if (!currentUser) return [];

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', `${searchTerm}%`)
        .neq('email', currentUser.email);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  }

  // ============ HELPERS ============
  async getCurrentUser() {
    const supabase = this.init();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  getCurrentUserEmail() {
    const supabase = this.init();
    const session = supabase.auth.getSession();
    return session?.then(({ data }) => data?.session?.user?.email) || null;
  }

  getCurrentUserId() {
    const supabase = this.init();
    const session = supabase.auth.getSession();
    return session?.then(({ data }) => data?.session?.user?.id) || null;
  }

  cleanup() {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions.clear();
  }
}

const supabaseService = new SupabaseService();
export default supabaseService;