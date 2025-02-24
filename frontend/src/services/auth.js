export const getCodeFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code');
  };
  
  export const exchangeCodeForToken = async (code) => {
    const authUrl = process.env.REACT_APP_AUTH_URL;
    const response = await fetch(`${authUrl}/exchange?code=${code}`);
    const data = await response.json();
    if (data.id_token) {
      localStorage.setItem('id_token', data.id_token);
    }
    return data;
  };
  
  export const login = () => {
    const authUrl = process.env.REACT_APP_AUTH_URL;
    window.location.href = `${authUrl}/login`;
  };
  