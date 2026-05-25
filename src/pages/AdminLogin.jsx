"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/slice/loginSlice";
import { Eye, EyeOff, Shield, Lock, User } from "lucide-react";

const LoginPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { isLoggedIn, userData, error } = useSelector((state) => state.login);

    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isLoggedIn && userData) {
            setIsLoginLoading(false);
            if (userData.role?.toLowerCase() === "admin" || userData.user_name?.toUpperCase() === "AAKASH AGRAWAL") {
                navigate("/approval-request", { replace: true });
            } else if (userData.role?.toLowerCase() === "guard") {
                navigate("/close-gate-pass", { replace: true });
            } else {
                navigate("/approval-request", { replace: true });
            }
        }
        if (error) {
            setIsLoginLoading(false);
            showToast(error, "error");
        }
    }, [isLoggedIn, userData, error, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoginLoading(true);
        dispatch(loginUser(formData));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 5000);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{
                background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fed7aa 100%)",
            }}
        >
            {/* Decorative blobs */}
            <div
                className="absolute top-[-120px] left-[-120px] w-96 h-96 rounded-full opacity-30 pointer-events-none"
                style={{ background: "radial-gradient(circle, #fb923c, transparent 70%)" }}
            />
            <div
                className="absolute bottom-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(circle, #ea580c, transparent 70%)" }}
            />
            {/* Decorative diamond pattern */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 pointer-events-none"
                style={{ background: "radial-gradient(circle, #7c2d12, transparent 60%)", border: "2px solid #c2410c" }}
            />

            {/* Card */}
            <div
                className="relative w-full max-w-md z-10 rounded-3xl overflow-hidden"
                style={{
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(249,115,22,0.2)",
                    boxShadow: "0 32px 80px rgba(194,65,12,0.18), 0 8px 32px rgba(0,0,0,0.08)",
                }}
            >
                {/* Top accent bar */}
                <div
                    className="h-1.5 w-full"
                    style={{ background: "linear-gradient(90deg, #f97316, #ea580c, #dc2626)" }}
                />

                {/* Logo & Header */}
                <div className="px-8 pt-8 pb-4 text-center">
                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                        <div
                            className="w-24 h-24 rounded-full p-1.5 shadow-xl"
                            style={{
                                background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
                                border: "3px solid #fed7aa",
                            }}
                        >
                            <img
                                src="/logo.png"
                                alt="AT Jewellers"
                                className="w-full h-full object-contain rounded-full"
                            />
                        </div>
                    </div>

                    <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#7c2d12' }}>
                        AT Jewellers
                    </h1>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: '#c2410c' }}>
                        Symbol of Trust · Since 1957
                    </p>
                    <div className="mt-3 pt-3 border-t border-orange-100">
                        <p className="text-xs text-orange-400 font-medium uppercase tracking-widest">
                            GatePass Portal
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-5 space-y-5">
                    {/* Username */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="username"
                            className="block text-xs font-bold uppercase tracking-wider ml-1"
                            style={{ color: '#92400e' }}
                        >
                            Username
                        </label>
                        <div className="relative">
                            <User
                                size={16}
                                className="absolute left-4 top-1/2 -translate-y-1/2"
                                style={{ color: '#fb923c' }}
                            />
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter your username"
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                                style={{
                                    background: "#fff7ed",
                                    border: "1.5px solid #fed7aa",
                                    color: "#431407",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#f97316";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
                                    e.target.style.background = "#ffffff";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "#fed7aa";
                                    e.target.style.boxShadow = "none";
                                    e.target.style.background = "#fff7ed";
                                }}
                            />
                            {formData.username && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-bold">✓</span>
                            )}
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="password"
                            className="block text-xs font-bold uppercase tracking-wider ml-1"
                            style={{ color: '#92400e' }}
                        >
                            Password
                        </label>
                        <div className="relative">
                            <Lock
                                size={16}
                                className="absolute left-4 top-1/2 -translate-y-1/2"
                                style={{ color: '#fb923c' }}
                            />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                                style={{
                                    background: "#fff7ed",
                                    border: "1.5px solid #fed7aa",
                                    color: "#431407",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#f97316";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
                                    e.target.style.background = "#ffffff";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "#fed7aa";
                                    e.target.style.boxShadow = "none";
                                    e.target.style.background = "#fff7ed";
                                }}
                            />
                            {formData.password && (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: '#fb923c' }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoginLoading}
                            className="w-full py-4 rounded-xl font-bold text-sm text-white tracking-wide transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{
                                background: "linear-gradient(135deg, #f97316, #ea580c)",
                                boxShadow: "0 8px 32px rgba(249,115,22,0.4)",
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoginLoading) {
                                    e.target.style.transform = "translateY(-1px)";
                                    e.target.style.boxShadow = "0 12px 40px rgba(249,115,22,0.5)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "0 8px 32px rgba(249,115,22,0.4)";
                            }}
                        >
                            {isLoginLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-8 pb-7 text-center">
                    <p className="text-xs" style={{ color: '#a16207' }}>
                        Powered by{" "}
                        <a
                            href="https://www.botivate.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold transition-opacity hover:opacity-70"
                            style={{
                                background: "linear-gradient(90deg, #f97316, #ea580c)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            Botivate
                        </a>
                    </p>
                </div>
            </div>

            {/* Toast */}
            {toast.show && (
                <div
                    className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 transition-all duration-300"
                    style={{
                        background: toast.type === "success"
                            ? "linear-gradient(135deg, #059669, #10b981)"
                            : "linear-gradient(135deg, #dc2626, #ef4444)",
                        color: "#fff",
                        boxShadow: toast.type === "success"
                            ? "0 8px 32px rgba(16,185,129,0.4)"
                            : "0 8px 32px rgba(239,68,68,0.4)",
                    }}
                >
                    {toast.type === "success" ? "✓" : "✕"} {toast.message}
                    <button
                        onClick={() => setToast({ show: false, message: "", type: "" })}
                        className="ml-2 opacity-70 hover:opacity-100 text-white font-bold"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
