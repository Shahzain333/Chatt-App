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
      { 
        auth: { 
          persistSession: true 
        } 
      }
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

  // ============ MESSAGES ============
  
  async sendMessage(messageText, chatId, currentUserUid, selectedUserUid) {
    try {
      const supabase = this.init();
      
      // Get current user email
      const { data: currentUserData } = await supabase
        .from('users')
        .select('email')
        .eq('uid', currentUserUid)
        .single();

      if (!currentUserData) {
        throw new Error("Current user not found");
      }
      
      // Get selected user email
      const { data: selectedUserData } = await supabase
        .from('users')
        .select('email')
        .eq('uid', selectedUserUid)
        .single();

      if (!selectedUserData) {
        throw new Error("Selected user not found");
      }

      const currentUserEmail = currentUserData.email;
      const selectedUserEmail = selectedUserData.email;

      // Check if chat exists
      const { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      // If chat doesn't exist, create it
      if (chatError && chatError.code === 'PGRST116') {
        // Create new chat
        const { error: insertChatError } = await supabase
          .from('chats')
          .insert({
            id: chatId,
            user1email: currentUserEmail,
            user2email: selectedUserEmail,
            lastmessage: messageText,
            lastmessagetimestamp: new Date().toISOString(),
          });

        if (insertChatError) {
          console.error('Error creating chat:', insertChatError);
          throw insertChatError;
        }

      } else if (!chatError && existingChat) {
        // Update existing chat
        const { error: updateError } = await supabase
          .from('chats')
          .update({
            lastmessage: messageText,
            lastmessagetimestamp: new Date().toISOString()
          })
          .eq('id', chatId);

        if (updateError) {
          console.error('Error updating chat:', updateError);
          throw updateError;
        }
      } else {
        // Handle other errors
        if (chatError) {
          console.error('Error checking chat existence:', chatError);
          throw chatError;
        }
      }

      // Send message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chatid: chatId,
          text: messageText,
          sender: currentUserEmail,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting message:', error);
        throw error;
      }
      
      return { ...data, chatId: chatId };

    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
}

  listenForMessages(chatId, callback) {
    
    if(!chatId) return () => {};

    const supabase = this.init();

    //Get initial data
    this.getMessages(chatId).then(messages => {
      //console.log('DEBUG: Initial messages for chat', chatId, ':', messages);
      callback(messages || [])
    }) 

    //listen for message
    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chatid=eq.${chatId}`
        },
        async () => {
          //console.log('DEBUG: Message change detected for chat:', chatId);
          const messages = await this.getMessages(chatId);
          callback(messages)
        }
      )
      .subscribe()
      // .subscribe((status) => {
      //   console.log('DEBUG: Subscription status:', status, 'for chat:', chatId);
      // });

      const unsubscribe = () => {
        supabase.removeChannel(channel)
        this.subscriptions.delete(`messages-${chatId}`)
      } 

      this.subscriptions.set(`messages-${chatId}`, unsubscribe);
      return unsubscribe;

  }

  async getMessages(chatId) {
    try {
      
      const supabase = this.init()

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chatid', chatId)
        .order('timestamp', { ascending: true }) 

      if (error) {
        console.error('DEBUG: Error fetching messages:', error);
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }

  // Helper Methods
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

const firebaseService = new SupabaseService();
export default firebaseService ;