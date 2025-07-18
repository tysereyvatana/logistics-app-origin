import axios from 'axios';

// Create an instance of axios
const api = axios.create({
  // The "proxy" in package.json will automatically handle the base URL in development
  baseURL: '/', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
