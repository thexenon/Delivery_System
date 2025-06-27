import axios from 'axios';

// const link = 'https://delivery-system-09mk.onrender.com';
const link = 'http://127.0.0.1:3000';

const ApiManager = axios.create({
  baseURL: `${link}`,
  responseType: 'json',
  withCredentials: true,
});

export default ApiManager;
