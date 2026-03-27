import { NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full">
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-wider">
          ADMIN<span className="text-blue-500">PRO</span>
        </h2>
      </div>
      <nav className="flex-1 px-4 mt-6">
        <NavLink
          to="/productos"
          className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
        >
          <ShoppingBag size={20} /> Inventario
        </NavLink>
      </nav>
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-red-400 hover:bg-slate-800 w-full px-4 py-3 rounded-lg transition"
        >
          <LogOut size={20} /> Salir
        </button>
      </div>
    </div>
  );
};

export default Sidebar;