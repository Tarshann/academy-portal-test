// Firebase service placeholder
module.exports = {
  // Authentication methods
  auth: {
    signIn: async (email, password) => {
      console.log(`Signing in user: ${email}`);
      return { userId: '123', email };
    },
    
    signUp: async (email, password) => {
      console.log(`Creating user: ${email}`);
      return { userId: '123', email };
    },
    
    signOut: async () => {
      console.log('Signing out user');
      return { success: true };
    }
  },
  
  // Firestore methods
  firestore: {
    getDocument: async (collection, id) => {
      console.log(`Getting document ${id} from ${collection}`);
      return { id, data: {} };
    },
    
    addDocument: async (collection, data) => {
      console.log(`Adding document to ${collection}`, data);
      return { id: '123', data };
    }
  }
}; 