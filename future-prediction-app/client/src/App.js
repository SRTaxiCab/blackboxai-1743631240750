import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Timeline from './components/Timeline';
import Predictions from './components/Predictions';
import Analytics from './components/Analytics';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <i className="fas fa-crystal-ball text-indigo-600 text-2xl mr-2"></i>
                <span className="text-xl font-bold text-gray-800">Future Prediction</span>
              </div>

              {/* Navigation Links */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`
                  }
                >
                  Dashboard
                </NavLink>

                <NavLink
                  to="/timeline"
                  className={({ isActive }) =>
                    `${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`
                  }
                >
                  Timeline
                </NavLink>

                <NavLink
                  to="/predictions"
                  className={({ isActive }) =>
                    `${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`
                  }
                >
                  Predictions
                </NavLink>

                <NavLink
                  to="/analytics"
                  className={({ isActive }) =>
                    `${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`
                  }
                >
                  Analytics
                </NavLink>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                aria-controls="mobile-menu"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <i className="fas fa-bars"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${
                  isActive
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/timeline"
              className={({ isActive }) =>
                `${
                  isActive
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`
              }
            >
              Timeline
            </NavLink>

            <NavLink
              to="/predictions"
              className={({ isActive }) =>
                `${
                  isActive
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`
              }
            >
              Predictions
            </NavLink>

            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `${
                  isActive
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`
              }
            >
              Analytics
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-inner mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2023 Future Prediction App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;