import React, { useState, useEffect } from "react";
import api from "../services/axiosInstance";
import { Users, Edit, Trash2, Plus, X, Shield, Lock } from "lucide-react";
import { useSelector } from "react-redux";

const AVAILABLE_PAGES = [
  "Dashboard",
  "Request Gate Pass",
  "Approval Requests",
  "Close Gate Pass",
  "Employee Status",
  "Settings"
];

const Settings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    userName: "",
    userId: "",
    password: "",
    phone: "",
    role: "Staff",
    selectedPages: []
  });

  const { userData } = useSelector((state) => state.login);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/system-users");
      if (res.data && res.data.success) {
        setUsers(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch system users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        userName: user.userName || "",
        userId: user.userId || "",
        password: "", // We typically don't fetch password, leave blank unless changing
        phone: user.phone || "",
        role: user.role || "Staff",
        selectedPages: user.pageAccess ? user.pageAccess.split(",").map(p => p.trim()) : []
      });
    } else {
      setEditingUser(null);
      setFormData({
        userName: "",
        userId: "",
        password: "",
        phone: "",
        role: "Staff",
        selectedPages: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handlePageToggle = (pageTitle) => {
    setFormData(prev => {
      const isSelected = prev.selectedPages.includes(pageTitle);
      let newSelected = [];
      if (isSelected) {
        newSelected = prev.selectedPages.filter(p => p !== pageTitle);
      } else {
        newSelected = [...prev.selectedPages, pageTitle];
      }
      return { ...prev, selectedPages: newSelected };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        userName: formData.userName,
        userId: formData.userId,
        phone: formData.phone,
        role: formData.role,
        pageAccess: formData.selectedPages.join(", ")
      };
      
      // Only send password if it's a new user or explicitly typed during edit
      if (formData.password) {
        payload.password = formData.password;
      } else if (!editingUser) {
        alert("Password is required for new users.");
        return;
      }

      if (editingUser) {
        await api.patch(`/api/system-users/${editingUser.id}`, payload);
      } else {
        await api.post("/api/system-users", payload);
      }
      fetchUsers();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save user:", error);
      alert("Failed to save user details.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/api/system-users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-orange-500" size={24} />
            User Management Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage system access, roles, and user details.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors"
        >
          <Plus size={18} /> Add New User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Name & Role</th>
                <th className="px-6 py-4 font-bold">User ID (Login)</th>
                <th className="px-6 py-4 font-bold">Phone</th>
                <th className="px-6 py-4 font-bold">Page Access</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{user.userName}</p>
                          <p className="text-xs font-semibold text-orange-600 uppercase">{user.role || 'Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{user.userId}</td>
                    <td className="px-6 py-4 text-gray-500">{user.phone || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.pageAccess ? (
                          user.pageAccess.split(",").map((page, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-md uppercase">
                              {page.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-red-400 font-medium">No Access</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        {userData?.user_id !== user.userId && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingUser ? "Edit User" : "Add New User"}
              </h2>
              <button onClick={handleCloseModal} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.userName}
                    onChange={e => setFormData({...formData, userName: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Login User ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.userId}
                    onChange={e => setFormData({...formData, userId: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Guard">Guard</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Lock size={12} /> {editingUser ? "New Password (leave blank to keep current)" : "Password *"}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Page Access Configuration</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_PAGES.map((page) => {
                    const isChecked = formData.selectedPages.includes(page) || formData.selectedPages.includes("All");
                    return (
                      <label key={page} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handlePageToggle(page)}
                          className="w-4 h-4 text-orange-500 bg-white border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                        />
                        <span className="text-sm font-semibold text-gray-700">{page}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                  💡 Note: Checking these items will directly reflect on the user's sidebar menu.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-sm transition-all"
                >
                  {editingUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
