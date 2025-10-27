import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  showAuthButtons?: boolean;
  currentPage?: 'login' | 'register' | 'home';
}

export const Header: React.FC<HeaderProps> = ({
  showAuthButtons = true,
  currentPage = 'home',
}) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              FinaTech
            </Link>
          </div>

          {/* Navigation */}
          {showAuthButtons && (
            <div className="flex items-center space-x-4">
              {currentPage !== 'login' && (
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
              )}
              {currentPage !== 'register' && (
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};