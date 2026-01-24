import { useEffect } from "react";
import firebaseService from "../services/firebaseServices";
import { 
  setChats, 
  setCurrentUser, 
  setLoading, 
  clearChatState, 
  setAllUsers 
} from "../store/chatSlice";
import { useDispatch } from "react-redux";

export const useFirebaseData = (currentUser) => {
  const dispatch = useDispatch();

  // Fetch all users and listen for updates
  useEffect(() => {
    if (!currentUser) return;

    const fetchAllUsers = async () => {
      try {
        dispatch(setLoading(true));
        const users = await firebaseService.getAllUsers();
        dispatch(setAllUsers(users || []));
      } catch (error) {
        console.error('Error fetching all users:', error);
        dispatch(setAllUsers([]));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchAllUsers();
    
    const unsubscribe = firebaseService.listenForAllUsers((users) => {
      dispatch(setAllUsers(users || []));
    });
    
    return () => unsubscribe();
  }, [currentUser, dispatch]);

  // Initialize user and chats listeners
  useEffect(() => {
    let unsubscribeUser = () => {};
    let unsubscribeChats = () => {};

    const initialize = async () => {
      try {
        dispatch(setLoading(true));
        
        const currentUserId = firebaseService.getCurrentUserId();
        
        if (currentUserId) {
          unsubscribeUser = firebaseService.listenForUser(currentUserId, (user) => {
            if (user) dispatch(setCurrentUser(user));
          });
        }

        // unsubscribeChats = firebaseService.listenForChats((newChats) => {
        //   dispatch(setChats(newChats || []));
        // });

      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    initialize();
    return () => {
      unsubscribeUser();
      unsubscribeChats();
    };
  }, [dispatch]);

  // Auth state listener
  useEffect(() => {
    const unsubscribeAuth = firebaseService.onAuthStateChange(async (authUser) => {
      if (authUser) {
        try {
          const userData = await firebaseService.getUser(authUser.uid);
          if (userData) dispatch(setCurrentUser(userData));
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      } else {
        dispatch(setCurrentUser(null));
        dispatch(clearChatState());
      }
    });

    return () => {
      if (typeof unsubscribeAuth === 'function') unsubscribeAuth();
    };

}, [dispatch]);

};
