import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../services/slice/loginSlice";
import {
  Home,
  UserPlus,
  CheckCircle2,
  XCircle,
  FileText,
  LogOut,
  Users,
  Settings,
  ChevronRight,
  Shield
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.login);
  const username = userData?.user_name || "Admin";
  const pageAccess = userData?.page_access || "";

  const menuItems = [
    {
      title: "Dashboard",
      icon: <Home size={20} />,
      path: "/dashboard",
    },
    // {
    //   title: "All Visitors",
    //   icon: <FileText size={20} />,
    //   path: "/reports",
    // },
    {
      title: "Request Gate Pass",
      icon: <UserPlus size={20} />,
      path: "/request-gate-pass",
    },
    {
      title: "Approval Requests",
      icon: <CheckCircle2 size={20} />,
      path: "/approval-request",
    },
    {
      title: "Close Gate Pass",
      icon: <XCircle size={20} />,
      path: "/close-gate-pass",
    },
    {
      title: "Employee Status",
      icon: <Users size={20} />,
      path: "/employee",
    },
    {
      title: "Settings",
      icon: <Settings size={20} />,
      path: "/settings",
    },
  ];

  // Filter menu items based on page_access
  let filteredMenuItems = menuItems.filter((item) => {
    if (!pageAccess) return false;
    if (pageAccess.toLowerCase() === "all") return true;
    
    // Check if item.title is mentioned in the page_access string
    return pageAccess.toLowerCase().includes(item.title.toLowerCase());
  });

  // Strictly enforce that Guards only see the Gate Pass page
  if (userData?.role?.toLowerCase() === "guard") {
    filteredMenuItems = menuItems.filter(item => item.title === "Close Gate Pass");
  }

  const handleLogout = () => {
    dispatch(logoutUser());  // clears Redux + sessionStorage
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-orange-100 w-64 shadow-xl z-20">
      {/* Gradient accent bar */}
      <div className="h-1 w-full flex-shrink-0" style={{ background: 'linear-gradient(90deg, #f97316, #ea580c, #dc2626)' }} />

      {/* Logo Section */}
      <div className="p-5 border-b border-orange-50 flex justify-center items-center bg-gradient-to-b from-orange-50/60 to-white">
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full p-1 shadow-lg" style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '2px solid #fed7aa' }}>
            <img
              src="/logo.png"
              alt="AT Jewellers"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="text-center">
            <p className="font-extrabold text-sm tracking-wide" style={{ color: '#c2410c' }}>AT Jewellers</p>
            <p className="text-[10px] text-orange-400 font-medium">Symbol of Trust · Since 1957</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-4 space-y-1 overflow-y-auto pt-4">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between group px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-white shadow-md"
                  : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' } : {}}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? "text-white" : "group-hover:text-orange-600 transition-colors"}>
                  {item.icon}
                </span>
                <span className="text-sm font-semibold">{item.title}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-white/70" />}
            </Link>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 mt-auto border-t border-orange-50 space-y-3">
        {/* User Profile & Logout */}
        <div className="flex items-center justify-between bg-gradient-to-br from-orange-50 to-amber-50 p-3 rounded-2xl border border-orange-100/50 shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1 pr-2">
              <p className="text-sm font-bold text-gray-800 truncate">{username}</p>
              <p className="text-[10px] text-orange-600 font-medium capitalize truncate">{userData?.role || "Administrator"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 text-red-500 bg-white hover:bg-red-50 border border-red-100 rounded-xl transition-all shadow-sm group flex-shrink-0"
          >
            <LogOut size={16} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Botivate branding */}
        <a
          href="https://www.botivate.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all hover:bg-orange-50 group"
        >
          <span
            className="flex items-center justify-center w-4 h-4 rounded-md"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="9" height="9">
              <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="white" strokeWidth="0.5" strokeLinejoin="round" />
            </svg>
          </span>
          <span
            className="text-[10px] font-bold tracking-tight group-hover:opacity-70 transition-opacity"
            style={{
              background: 'linear-gradient(90deg, #f97316, #ea580c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Powered by Botivate
          </span>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
