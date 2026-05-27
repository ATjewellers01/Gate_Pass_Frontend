"use client"

import { useState } from "react"
import { Menu } from 'lucide-react'
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block h-full">
        <Sidebar closeMenu={() => {}} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:hidden ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <Sidebar closeMenu={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header
          className="flex h-16 items-center justify-between px-4 md:hidden bg-white/90 backdrop-blur-md border-b border-orange-100 shadow-sm z-30 sticky top-0"
        >
          <div className="flex items-center gap-3">
            <div
              className="p-1.5 rounded-xl shadow-sm"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
            >
              <span className="text-white font-bold text-sm">GP</span>
            </div>
            <h1 className="text-lg font-extrabold text-gray-800 tracking-tight">GatePass</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
          >
            <Menu size={22} />
          </button>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}