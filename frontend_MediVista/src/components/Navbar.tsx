import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(auth === 'true');
  }, [location]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    }
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('hospitalName');
    setIsAuthenticated(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard', private: true },
    { name: 'Features', path: '/#features' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-white shadow-md'
        : 'bg-white/95 backdrop-blur-sm'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-br from-blue-600 to-teal-500 p-2 rounded-lg group-hover:shadow-lg transition-shadow">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              MediVista
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-slate-700 hover:text-blue-600 transition-colors font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="px-5 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-slate-700 hover:text-blue-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-200"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="block py-2 text-slate-700 hover:text-blue-600 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full py-2 text-left text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="block w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg font-medium text-center hover:shadow-lg transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
