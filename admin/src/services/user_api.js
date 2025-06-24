import ApiManager from './ApiManager';
const token = localStorage.getItem('token');

export const user_login = async (reqData) => {
  try {
    const result = await ApiManager('/api/v1/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: reqData,
      withCredentials: true,
    });
    return result;
  } catch (error) {
    return error;
  }
};

export const userPassword = async (reqData) => {
  try {
    const result = await ApiManager('/api/v1/users/updateMyPassword', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: reqData,
      withCredentials: true,
    });
    return result;
  } catch (error) {
    return error;
  }
};

export const forgotPass = async (reqData) => {
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

export const user_signup = async (reqData) => {
  try {
    const result = await ApiManager('/api/v1/users/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: reqData,
      withCredentials: true,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const submitComment = async (reqData, reqParams) => {
  try {
    const result = await ApiManager(`/api/v1/${reqParams}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: reqData,
      withCredentials: true,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const submitPost = async (reqData, reqParams) => {
  try {
    const result = await ApiManager(`/api/v1/${reqParams}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: reqData,
      withCredentials: true,
    });
    return result;
  } catch (error) {
    return error;
  }
};

export const submitUpdate = async (reqData, reqParams) => {
  try {
    const result = await ApiManager(`/api/v1/${reqParams}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: reqData,
      withCredentials: true,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const submitUserUpdate = async (reqData) => {
  try {
    const result = await ApiManager('/api/v1/users/updateMe', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
      data: reqData,
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const fetchItems = async (reqParams, query = {}) => {
  let url = `/api/v1/${reqParams}`;
  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams(query).toString();
    url += `?${params}`;
    console.log('====================================');
    console.log('====================================');
    console.log(`GET Request URL: ${url}`);
    console.log('====================================');
    console.log('====================================');
  }
  try {
    const result = await ApiManager(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const deleteItem = async (reqParams, item) => {
  try {
    const result = await ApiManager(
      `/api/v1/${reqParams}/${item.id || item._id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return result;
  } catch (error) {
    return error.response.data;
  }
};

export const fetchItem = async (reqParams, id) => {
  try {
    const result = await ApiManager(`/api/v1/${reqParams}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return result;
  } catch (error) {
    return error.response.data;
  }
};
