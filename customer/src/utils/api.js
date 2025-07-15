import ApiManager from './ApiManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getHeadersWithJwt = async () => {
  const jwt = await AsyncStorage.getItem('jwt');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwt}`,
  };
};

export const signIn = async (reqData) => {
  try {
    const result = await ApiManager('/api/v1/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: reqData,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};
export const forgotPassword = async (reqData) => {
  try {
    const result = await ApiManager('/api/v1/users/forgotPassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: reqData,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const signUp = async (reqData) => {
  try {
    const result = await ApiManager('/api/v1/users/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: reqData,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const deleteAccount = async () => {
  const headers = await getHeadersWithJwt();
  try {
    const result = await ApiManager('/api/v1/users/deleteMe', {
      method: 'DELETE',
      headers,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const submitPost = async (reqData, reqParams) => {
  const headers = await getHeadersWithJwt();
  try {
    const result = await ApiManager(`/api/v1/${reqParams}`, {
      method: 'POST',
      headers,
      data: reqData,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const submitUserUpdate = async (reqData, reqParams) => {
  const headers = await getHeadersWithJwt();
  try {
    const result = await ApiManager(`/api/v1/${reqParams}`, {
      method: 'PATCH',
      headers,
      data: reqData,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const getItems = async (reqParams, query = {}) => {
  const headers = await getHeadersWithJwt();
  let url = `/api/v1/${reqParams}`;
  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams(query).toString();
    url += `?${params}`;
    console.log('====================================');
    console.log(`GET Request URL: ${url}`);
    console.log('====================================');
  }
  try {
    const result = await ApiManager(url, {
      method: 'GET',
      headers,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const deleteItems = async (reqParams) => {
  const headers = await getHeadersWithJwt();
  try {
    const result = await ApiManager(`/api/v1/${reqParams}`, {
      method: 'DELETE',
      headers,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const getItemById = async (reqParams, id) => {
  const headers = await getHeadersWithJwt();
  try {
    const result = await ApiManager(`/api/v1/${reqParams}/${id}`, {
      method: 'GET',
      headers,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const updateItem = async (reqParams, id, reqData) => {
  const headers = await getHeadersWithJwt();
  try {
    const result = await ApiManager(`/api/v1/${reqParams}/${id}`, {
      method: 'PATCH',
      headers,
      data: reqData,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};
