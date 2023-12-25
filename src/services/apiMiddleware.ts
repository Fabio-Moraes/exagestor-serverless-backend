import axios from 'axios';

axios.defaults.withCredentials = true;

const apiMiddleware = axios.create({
  baseURL: process.env.NEXT_PUBLIC_FRONTEND_ORIGIN_BASEURL,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

export default apiMiddleware;
