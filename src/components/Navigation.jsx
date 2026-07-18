import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Image as ImageIcon, User } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  
  if (location.pathname === '/admin') {
    return null;
  }

  return (
    <nav className="w-full glass-panel rounded-none border-t border-white/10 p-4 z-50 shrink-0">
      <ul className="flex justify-around items-center max-w-md mx-auto">
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-full transition-all duration-300 ${
                isActive ? 'text-primary glow-text-pink scale-110' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <Home size={24} />
            <span className="text-xs mt-1 font-semibold">Home</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/albums"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-full transition-all duration-300 ${
                isActive ? 'text-cyan glow-text-cyan scale-110' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <ImageIcon size={24} />
            <span className="text-xs mt-1 font-semibold">Albums</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-full transition-all duration-300 ${
                isActive ? 'text-primary glow-text-pink scale-110' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <User size={24} />
            <span className="text-xs mt-1 font-semibold">Profile</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;
