import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  
  const googleLogin = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      const { access_token } = tokenResponse;
      login(access_token);
    },
    onError: () => {
      console.error('Login failed');
    },
  });

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <button className="btn btn-outline-primary" onClick={() => googleLogin()}>
        Login with Google
      </button>
    </div>
  );
};

export default Login;
