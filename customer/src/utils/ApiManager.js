import axios from 'axios';

const link = 'https://delivery-system-09mk.onrender.com';
// const link = 'http://localhost:4000';

const ApiManager = axios.create({
  baseURL: `${link}`,
  responseType: 'json',
  withCredentials: true,
});

export default ApiManager;
