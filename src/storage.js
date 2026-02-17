// Simple localStorage wrapper to mimic window.storage
// const storage = {
//     async get(key) {
//       const value = localStorage.getItem(key);
//       return value ? { key, value, shared: false } : null;
//     },
    
//     async set(key, value) {
//       localStorage.setItem(key, value);
//       return { key, value, shared: false };
//     },
    
//     async delete(key) {
//       localStorage.removeItem(key);
//       return { key, deleted: true, shared: false };
//     },
    
//     async list(prefix = '') {
//       const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
//       return { keys, prefix, shared: false };
//     }
//   };
  
//   window.storage = storage;


  // src/storage.js
const storage = {
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? { key, value, shared: false } : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      return { key, value, shared: false };
    } catch (error) {
      console.error('Storage set error:', error);
      return null;
    }
  },
  
  async delete(key) {
    try {
      localStorage.removeItem(key);
      return { key, deleted: true, shared: false };
    } catch (error) {
      console.error('Storage delete error:', error);
      return null;
    }
  },
  
  async list(prefix = '') {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
      return { keys, prefix, shared: false };
    } catch (error) {
      console.error('Storage list error:', error);
      return { keys: [], prefix, shared: false };
    }
  }
};

// Initialize window.storage
if (typeof window !== 'undefined') {
  window.storage = storage;
}

export default storage;