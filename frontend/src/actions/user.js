import appConfig from '../config';

export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const LOGOUT_REQUEST = 'LOGOUT_REQUEST';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';
export const LOGOUT_FAILURE = 'LOGOUT_FAILURE';

function requestLogin(creds) {
  return {
    type: LOGIN_REQUEST,
    isFetching: true,
    isAuthenticated: false,
    creds,
  };
}

export function receiveLogin(user) {
  return {
    type: LOGIN_SUCCESS,
    isFetching: false,
    isAuthenticated: true,
    id_token: user.id_token, // You may replace with full user if needed
  };
}

function loginError(message) {
  return {
    type: LOGIN_FAILURE,
    isFetching: false,
    isAuthenticated: false,
    message,
  };
}

function requestLogout() {
  return {
    type: LOGOUT_REQUEST,
    isFetching: true,
    isAuthenticated: true,
  };
}

export function receiveLogout() {
  return {
    type: LOGOUT_SUCCESS,
    isFetching: false,
    isAuthenticated: false,
  };
}

// Logs the user out
export function logoutUser() {
  return dispatch => {
    dispatch(requestLogout());
    localStorage.removeItem('id_token');
    document.cookie = 'id_token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    dispatch(receiveLogout());
  };
}

// Logs the user in
export function loginUser(creds) {
  const config = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: creds.login,
      password: creds.password,
    }),
  };

  return dispatch => {
    dispatch(requestLogin(creds));

    // If in dev mode, hit local PHP backend
    if (process.env.NODE_ENV === 'development') {
      return fetch('http://localhost/studenthub/backend/login.php', config)
        .then(response =>
          response.json().then(data => ({ data, response }))
        )
        .then(({ data, response }) => {
          if (!response.ok || !data.success) {
            dispatch(loginError(data.error || 'Login failed'));
            return Promise.reject(data);
          }

          const id_token = data.user?.id || null;
          localStorage.setItem('id_token', id_token);

          dispatch(receiveLogin({ id_token }));
          return Promise.resolve(data);
        })
        .catch(err => {
          dispatch(loginError(err.message || 'Network error'));
          console.error('Login error:', err);
        });
    } else {
      // fallback for production or mock mode
      localStorage.setItem('id_token', appConfig.id_token);
      dispatch(receiveLogin({ id_token: appConfig.id_token }));
    }
  };
}
