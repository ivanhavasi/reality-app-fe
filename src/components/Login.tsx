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
    <div className="min-vh-100">
      {/* Hero Section */}
      <div className="py-4 py-md-5" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-12 col-lg-6 mb-4 mb-lg-0">
              <h1 className="display-6 display-md-4 fw-bold mb-3 mb-md-4 text-white">
                Find Your Perfect Apartment in Prague
              </h1>
              <p className="mb-3 mb-md-4 fs-6 fs-md-5 text-white">
                Discover the best apartments for sale and rent in the Prague region.
                Our comprehensive platform helps you find your dream home with ease.
              </p>
              <div className="d-grid d-sm-block">
                <button
                  className="btn btn-light btn-lg px-4 py-2 w-100 w-sm-auto shadow"
                  onClick={() => googleLogin()}
                >
                  <i className="fab fa-google me-2 text-primary"></i>
                  Get Started with Google
                </button>
              </div>
            </div>
            <div className="col-12 col-lg-6 text-center">
              <div className="bg-white rounded-3 p-3 p-md-4 shadow">
                <h3 className="h5 h-md-4 mb-2 mb-md-3 text-primary">🏠 Havasi Reality Platform</h3>
                <p className="mb-0 text-dark fw-medium">Your gateway to premium properties</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-4 py-md-5">
        <div className="container">
          <div className="row text-center mb-4 mb-md-5">
            <div className="col-12">
              <h2 className="h2 h-md-1 mb-3">Why Choose Our Platform?</h2>
              <p className="text-muted fs-6">
                We make finding your perfect apartment in Prague simple and efficient
              </p>
            </div>
          </div>

          <div className="row g-3 g-md-4">
            <div className="col-12 col-md-4">
              <div className="text-center p-3 p-md-4">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <i className="fas fa-search fa-lg fa-md-2x text-primary"></i>
                </div>
                <h4 className="h5 h-md-4">Comprehensive Search</h4>
                <p className="text-muted small">
                  Browse through thousands of apartments for sale and rent across the entire Prague region.
                  Filter by price, location, size, and amenities to find exactly what you need.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="text-center p-3 p-md-4">
                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <i className="fas fa-bell fa-lg fa-md-2x text-success"></i>
                </div>
                <h4 className="h5 h-md-4">Smart Notifications</h4>
                <p className="text-muted small">
                  Never miss out on new listings! Set up custom notifications based on your preferences
                  and be the first to know about the newest apartment entries in your desired areas.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="text-center p-3 p-md-4">
                <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <i className="fas fa-map-marker-alt fa-lg fa-md-2x text-info"></i>
                </div>
                <h4 className="h5 h-md-4">Prague Region Coverage</h4>
                <p className="text-muted small">
                  Complete coverage of Prague and surrounding areas. From the historic center
                  to modern suburbs, find properties in every district of the Prague region.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="py-4 py-md-5" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-12 col-lg-8 px-3">
              <h3 className="h3 h-md-2 mb-3 text-white">Ready to Find Your Dream Apartment?</h3>
              <p className="mb-4 text-white fs-6">
                Join thousands of satisfied users who found their perfect home through our platform.
                Start your search today and set up personalized notifications to stay ahead of the market.
              </p>
              <div className="d-grid d-sm-block">
                <button
                  className="btn btn-light btn-lg px-4 px-md-5 py-3 shadow w-100 w-sm-auto"
                  onClick={() => googleLogin()}
                >
                  <i className="fab fa-google me-2 text-primary"></i>
                  <span className="d-none d-sm-inline">Login with Google to Start</span>
                  <span className="d-sm-none">Login with Google</span>
                </button>
              </div>
              <div className="mt-3">
                <small className="text-white opacity-75 d-block d-sm-inline">
                  Free to use • Instant notifications • Verified listings
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white py-3 py-md-4">
        <div className="container">
          <div className="row">
            <div className="col-12 col-md-6 mb-2 mb-md-0 text-center text-md-start">
              <h6 className="h6 mb-1">Havasi Reality Platform</h6>
              <p className="mb-0 small text-muted">
                Your trusted partner in finding apartments for sale and rent in Prague region.
              </p>
            </div>
            <div className="col-12 col-md-6 text-center text-md-end">
              <small className="text-muted">
                © 2025 Havasi Reality Platform. All rights reserved.
              </small>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
