import { createClient } from "@supabase/supabase-js";

class SupabaseService {
  constructor() {
    this.supabase = null;
    this.subscriptions = new Map();
    this.isInitialized = false
  }

  init() {

    if (this.supabase) return this.supabase;
    
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { 
        auth: { 
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        } 
      }
    );

    // Check for existing session immediately
    if (!this.isInitialized) {
      const { data: session } = this.supabase.auth.getSession();
      if (session) {
        // Session exists on init
        console.log("Existing session found on init");
      }
      this.isInitialized = true;
    }

    return this.supabase;
  }

  // ============ AUTH ============
  async signUp(email, password, username = '') {
    try {
      const supabase = this.init();
      
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password, 
        options: {
          data: {
            username: username,
          }

        }
      });

      if (authError) throw authError;

      // 2. Create user in users table (same as Firebase)
      if (authData.user) {
        await this.addUser({
          uid: authData.user.id,
          email: authData.user.email,
          username: email.split('@')[0],
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
  
  async sendMessage(messageText, chatId, currentUserUid, selectedUserUid, attachments = []) {
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

      // create message text with attachment indicator
      let displayText = messageText.trim()

      if(attachments.length > 0) {
        if(attachments.some(a => a.type === 'image')) {
          displayText = displayText || 'Photo'
        } else if (attachments.some(a => a.type === 'video')) {
            displayText = displayText || 'Video';
        } else if (attachments.some(a => a.type === 'audio')) {
            displayText = displayText || 'Audio';
        } else {
            displayText = displayText || 'File';
        }
      }

      // Check if chat exists
      const { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      // If chat doesn't exist, create it
      if ((chatError && chatError.code === 'PGRST116') || !existingChat) {
        // Create new chat
        const { error: insertChatError } = await supabase
          .from('chats')
          .insert({
            id: chatId,
            user1email: currentUserEmail,
            user2email: selectedUserEmail,
            lastmessage: displayText,
            lastmessagetimestamp: new Date().toISOString(),
          });

        if (insertChatError) {
          console.error('Error creating chat:', insertChatError);
          throw insertChatError;
        }

      } else {
        // Update existing chat
        const { error: updateError } = await supabase
          .from('chats')
          .update({
            lastmessage: displayText,
            lastmessagetimestamp: new Date().toISOString()
          })
          .eq('id', chatId);

        if (updateError) {
          console.error('Error updating chat:', updateError);
          throw updateError;
        }

      }

      // Send message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chatid: chatId,
          text: displayText,
          sender: currentUserEmail,
          timestamp: new Date().toISOString(),
          attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
          has_attachments: attachments.length > 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting message:', error);
        throw error;
      }
      
      return { 
        ...data, 
        chatId: chatId, 
        attachments: attachments.length > 0 ? attachments : [] 
      };

    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  async uploadFile(file, chatId) {
    try {
      const supabase = this.init();

      // Generate Unique File Name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `chats/${chatId}/${fileName}`

      // Upload file to supabase storage
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file)

      if(error) {
        console.log("Error in Uploading File in the Supabase", error.message)
        return null
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath)

      return {
        url : publicUrl,
        type: file.type.startsWith('image') ? 'image' :
              file.type.startsWith('video') ? 'video' :
              file.type.startsWith('audio') ? 'audio' : 'file',
        file: file.name,
        size: file.size,
        mimeType: file.type
      }

    } catch(error) {
      console.error('Error uploading file:', error);
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

  async updateMessage(chatId, messageId, newText, attachments = []) {
    try {
      
      const supabase = await this.init();
      const currentUser = await this.getCurrentUser();

      if(!currentUser) {
        throw new Error("User Not Authenticated!")
      }

      // Get Current User Email
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('uid', currentUser.id)
        .single();
      
      if(!userData) {
        throw new Error("User Data Not Found!")
      }

      // Get existing message to preserve attachments
      const { data: existingMessage } = await supabase
        .from('messages')
        .select('attachments')
        .eq('id', messageId)
        .single();

      const currentAttachments = existingMessage?.attachments ? JSON.parse(existingMessage.attachments) : []

      // Update Message
      const { error } = await supabase
        .from('messages')
        .update({
          text: newText,
          edited: true,
          editedat: new Date().toISOString(),
          attachments: attachments.length > 0 ? JSON.stringify(attachments) : JSON.stringify(currentAttachments)
        })
        .eq('id', messageId)
        .eq('sender', userData.email)

      if(error) throw error

      // Update chat's last message if this was latest
      await this.updateChatLastMessage(chatId);
      //console.log("Update Message !")

    } catch (error) {
      console.log('Error in Update Message', error)
      throw error
    }
  }

  async deleteMessage(chatId, messageId) {
    try {
      const supabase = this.init()
      const currentUser = await this.getCurrentUser()

      if(!currentUser) {
        throw new Error('User not authenticated')
      }

      // Get CUrrent User Email
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('uid', currentUser.id)
        .single();
      
      if(!userData) {
        throw new Error("User data not found!")
      }

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender', userData.email)
      
      if (error) throw error;

      // Update chat's last message
      await this.updateChatLastMessage(chatId);

    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }

  async updateChatLastMessage(chatId) {
    try {

      const supabase = this.init();

      // Get Latest Message
      const { data: latestMessage, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chatid', chatId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()
      
      
      if (error && error.code !== 'PGRST116') {
        //console.log("No Message In Chat")
        // Update Chat With Empty Last Mesaage
        await supabase
          .from('chats')
          .update({
            lastmessage: '',
            lastmessagetimestamp: null
          })
          .eq('id',chatId)
        
        return

      }

      // Update chat with latest message
      await supabase
        .from('chats')
        .update({
          lastmessage: latestMessage?.text || '',
          lastmessagetimestamp: latestMessage?.timestamp || null,
          edited: true,
          editedat: new Date().toISOString()
        })
        .eq('id', chatId);

    } catch (error) {
      console.log("Error updating chat last message:", error);
      throw Error
    }
  }

  // ============ Chats ============
  listenForChats(callback) {
    const supabase = this.init();

    // Get Initial Data
    this.getUserChats().then(callback)

    const channel = supabase
      .channel('user-chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats'
        },
        async () => {
          const chats = await this.getUserChats()
          callback(chats)
        }
      )
      .subscribe()

      const unsubscribe = () => {
        supabase.removeChannel(channel)
        this.subscriptions.delete('user-chats')
      }

      this.subscriptions.set('user-chats', unsubscribe)
      
      return unsubscribe;

  }

  async getUserChats() {
    try {
      
      const supabase = this.init()
      
      const currentUser = await this.getCurrentUser()

      if(!currentUser || !currentUser.id) {
        console.log('No current user or email found');
        return [];
      }

      // Get User Email
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('uid', currentUser.id)
        .single()

      if(!userData) {
        console.log('No user data found for UID:', currentUser.id);
        return [];
      }

      const userEmail = userData.email

      // Get chats where user is user1 or user2
      const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .or(`user1email.eq.${userEmail},user2email.eq.${userEmail}`) 
        .order('lastmessagetimestamp', { ascending: false })

      if(error) {
        console.error('Error Fetching Chats', error)
        throw error
      }

      //console.log('Chats found:', chats);
      
      if(!chats || chats.length === 0) {
        //console.log('There Is NO Any Chats');
        return []
      }

      // Get user detail for each chat
      const chatsWithUsers = await Promise.all(
        chats.map(async (chat) => {
          
          // Determine which user is the other user
          const otherUserEmail = chat.user1email === userEmail ? chat.user2email : chat.user1email;
          
          const { data: otherUser } = await supabase
            .from('users')
            .select("*")
            .eq('email', otherUserEmail)
            .single()

          if (!otherUser) {
            console.warn(`No user found for email: ${otherUserEmail}`);
            return null;
          }

          // Return normalized chat object WITH user data
          return {
            id: chat.id,
            lastMessage: chat.lastmessage || "",
            lastMessageTimestamp: chat.lastmessagetimestamp,
            // Include the other user as part of the chat object
            otherUser: {
              uid: otherUser.uid,
              email: otherUser.email,
              username: otherUser.username,
              fullName: otherUser.fullname,
              image: otherUser.image
            }
          };

        })
      )

      // Filter out any null results
      const filteredChats = chatsWithUsers.filter(chat => chat !== null);
      //console.log('Final formatted chats:', filteredChats); // Debug log
      return filteredChats;

      // return chats.map(chat => ({
      //   id: chat.id,
      //   lastmessage: chat.lastmessage,
      //   lastmessagetimestamp: chat.lastmessagetimestamp, 
      //   user1email: chat.user1email,
      //   user2email: chat.user2email
      // }))

    } catch (error) {
      console.error("Error getting user chats:", error);
      //throw error;
      return []
    }
  }

  async deleteChats(chatId) {
    try {
      
      const supabase = this.init()
      const currentUser = await this.getCurrentUser()

      if(!currentUser) {
        throw new Error("User not authenticated")
      }

      // Get user email
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('uid', currentUser.id)
        .single()
      
      if(!userData) {
        throw new Error("User data not found");
      }

      const userEmail = userData.email

      // Check if user is in chat
      const { error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .or(`user1email.eq.${userEmail},user2email.eq.${userEmail}`)
        .single();
      
      if(chatError) {
        throw new Error("Chat not found or not authorized");
      }

      // Delete chat (messages will cascade delete)
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

    } catch (error) {
      console.error("Error deleting chat:", error);
      throw error;
    }
  }

  // ============ Helper Methods ============

  async getSession() {
    const supabase = this.init();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

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