"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, Legend
} from "recharts"
import {
  QrCode, UserPlus, DoorClosed, Users, CheckCircle, Clock,
  Shield, TrendingUp, Search, ArrowRight, MoreVertical, Eye
} from "lucide-react"
import QRCodeModal from "../components/QRCodeModal"
import { fetchVisitsForApprovalApi } from "../services/approvalApi"

/* ─── helpers ─── */
const getImageUrl = (image) => {
  if (!image) return null;
  const str = image.toString().trim();
  const match = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  let id = match ? match[1] : null;
  if (!id && /^[a-zA-Z0-9_-]{20,}$/.test(str)) {
    id = str;
  }
  if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
  if (str.startsWith("http") || str.startsWith("data:image")) return str;
  return null;
};
const getStatusValue = (v) => {
  const s = (v.approval_status || v.status || v.status_1 || "").toString().toLowerCase().trim()
  if (s === "approved") return "Approved"
  if (s === "rejected") return "Rejected"
  return "Pending"
}

const last7Days = () => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toDateString())
  }
  return days
}

const formatDate = (d) => {
  if (!d) return "—";
  try {
    const str = d.toString();
    if (str.includes(",")) return str.split(",")[0].trim();
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    }
    return str;
  } catch (e) {
    return "—";
  }
}

const formatTime = (timeStr, fallbackDateStr) => {
  try {
    let val = timeStr || fallbackDateStr;
    if (!val) return "—";
    val = val.toString();
    
    if (/^\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?(?::\d{2})?$/.test(val.trim())) return val.trim();
    
    if (val.includes(",")) {
      const parts = val.split(",");
      return parts.length > 1 ? parts[1].trim() : val;
    }
    
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    return val;
  } catch (e) {
    return "—";
  }
}

/* ─── badge ─── */
const Badge = ({ status }) => {
  if (status === "Approved") return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Approved
    </span>
  )
  if (status === "Rejected") return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 bg-red-50 px-2.5 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Rejected
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> Pending
    </span>
  )
}

/* ─── custom tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-xs">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-500">{p.name}:</span>
            <span className="font-bold text-gray-800">{p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
const HomePage = () => {
  const navigate = useNavigate()
  const { userData } = useSelector((state) => state.login)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  /* ─── fetch ─── */
  const fetchData = async () => {
    const queryRole = (userData?.role?.toLowerCase() === "admin" || userData?.role?.toLowerCase() === "guard") 
      ? "admin" 
      : userData?.user_name || "admin";
      
    const res = await fetchVisitsForApprovalApi(queryRole)
    if (res.success) setVisits(res.visits)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 30000)
    return () => clearInterval(id)
  }, [])

  /* ─── derived stats ─── */
  const stats = useMemo(() => {
    const approved = visits.filter(v => getStatusValue(v) === "Approved").length
    const pending = visits.filter(v => getStatusValue(v) === "Pending").length
    const rejected = visits.filter(v => getStatusValue(v) === "Rejected").length
    const open = visits.filter(v => !v.gate_pass_closed).length
    return { total: visits.length, approved, pending, rejected, open }
  }, [visits])

  /* ─── bar chart: visitors per day (last 7) ─── */
  const barData = useMemo(() => {
    const days = last7Days()
    return days.map(day => {
      const dayVisits = visits.filter(v => {
        try { return new Date(v.timestamp || v.date_of_visit || "").toDateString() === day }
        catch { return false }
      })
      const label = new Date(day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      return {
        date: label,
        Visitors: dayVisits.length,
        Approved: dayVisits.filter(v => getStatusValue(v) === "Approved").length,
      }
    })
  }, [visits])

  /* ─── line chart: cumulative by day ─── */
  const lineData = useMemo(() => {
    const days = last7Days()
    let cum = 0
    return days.map(day => {
      const count = visits.filter(v => {
        try { return new Date(v.timestamp || v.date_of_visit || "").toDateString() === day }
        catch { return false }
      }).length
      cum += count
      return {
        date: new Date(day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        Total: cum,
      }
    })
  }, [visits])

  /* ─── table data ─── */
  const tableData = useMemo(() => {
    const q = search.toLowerCase()
    return visits
      .filter(v =>
        !q ||
        (v.visitor_name || "").toLowerCase().includes(q) ||
        (v.person_to_meet || "").toLowerCase().includes(q) ||
        (v.mobile_number || "").includes(q)
      )
      .slice(0, 12)
  }, [visits, search])

  const statCards = [
    {
      label: "Total Visitors",
      value: stats.total,
      icon: <Users size={18} className="text-orange-500" />,
      iconBg: "bg-orange-50",
      trend: "+Live",
      trendColor: "text-emerald-500"
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: <CheckCircle size={18} className="text-emerald-500" />,
      iconBg: "bg-emerald-50",
      trend: stats.total ? `${Math.round(stats.approved / stats.total * 100)}%` : "0%",
      trendColor: "text-emerald-500"
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: <Clock size={18} className="text-amber-500" />,
      iconBg: "bg-amber-50",
      trend: stats.total ? `${Math.round(stats.pending / stats.total * 100)}%` : "0%",
      trendColor: "text-amber-500"
    },
    {
      label: "Gate Pass Open",
      value: stats.open,
      icon: <Shield size={18} className="text-orange-600" />,
      iconBg: "bg-orange-100",
      trend: "Active",
      trendColor: "text-orange-600"
    },
  ]

  return (
    <div className="flex flex-col space-y-4 sm:space-y-6 animate-in fade-in duration-500">

      {/* ── Stat Cards ── */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`${c.iconBg} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}>
              {c.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{c.label}</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-extrabold text-gray-800 leading-none">
                  {loading ? "—" : c.value}
                </span>
                <span className={`text-xs font-bold mb-0.5 ${c.trendColor} flex items-center gap-0.5`}>
                  <TrendingUp size={10} /> {c.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Visitor Activity</h2>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-500 inline-block" /> Visitors</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" /> Approved</span>
              </p>
            </div>
            <span className="text-xs text-gray-400 font-medium">Last 7 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barCategoryGap="35%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="Visitors" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Approved" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Area Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Cumulative Visits</h2>
              <p className="text-xs text-gray-400 mt-0.5">Running total by day</p>
            </div>
            <span className="text-xs text-gray-400 font-medium">Last 7 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={lineData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Total" stroke="#ea580c" strokeWidth={2} fill="url(#colorTotal)" dot={{ r: 3, fill: "#ea580c", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Visitor Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        {/* Table header */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-800">
            All Visitors <span className="text-gray-400 font-medium">({visits.length})</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search visitor..."
                className="pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-orange-300 focus:bg-white transition-all w-full sm:w-48"
              />
            </div>
            <button
              onClick={() => navigate("/reports")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all whitespace-nowrap"
            >
              <Eye size={13} /> View All
            </button>
            <button
              onClick={() => navigate("/request-gate-pass")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-all whitespace-nowrap"
            >
              <UserPlus size={13} /> New Visit
            </button>
          </div>
        </div>

        {/* ── Mobile: Card List ── */}
        <div className="block md:hidden flex-1 overflow-y-auto min-h-0 divide-y divide-gray-50">
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
              <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              <span className="text-xs">Loading visitors...</span>
            </div>
          ) : tableData.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Users size={28} className="mb-2 opacity-30" />
              <span className="text-xs">No visitors found</span>
            </div>
          ) : (
            tableData.map((v, i) => {
              const status = getStatusValue(v)
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50 transition-colors">
                  {/* Avatar / Photo */}
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-100 bg-orange-100 flex items-center justify-center shrink-0">
                    {getImageUrl(v.visitor_photo) ? (
                      <img
                        src={getImageUrl(v.visitor_photo)}
                        alt={v.visitor_name || 'Visitor'}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display='none'; e.target.parentNode.querySelector('span')?.style && (e.target.parentNode.querySelector('span').style.display='flex'); }}
                      />
                    ) : null}
                    <span className={`text-orange-600 font-bold text-sm ${getImageUrl(v.visitor_photo) ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                      {(v.visitor_name || v.name || "V").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-gray-800 truncate">{v.visitor_name || v.name || "—"}</span>
                      <Badge status={status} />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-2">
                      <span className="font-semibold text-gray-700">To Meet: {v.person_to_meet || "—"}</span>
                      {v.mobile_number && <span className="text-gray-400">· {v.mobile_number}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[11px] text-gray-400">{formatDate(v.timestamp || v.date_of_visit)}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        ↓ {formatTime(v.time_of_entry, v.timestamp)}
                      </span>
                      {v.visitor_out_time && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          ↑ {formatTime(v.visitor_out_time)}
                        </span>
                      )}
                      {v.gate_pass_closed
                        ? <span className="text-[10px] font-semibold text-gray-400">● Closed</span>
                        : <span className="text-[10px] font-semibold text-orange-500">● Open</span>
                      }
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── Desktop: Table ── */}
        <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
          <table className="w-full min-w-[1000px] text-xs relative">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left">Visitor</th>
                <th className="px-4 py-3 text-left">Mobile</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Person to Meet</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Purpose</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Time In</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Time Out</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Gate Pass</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                      Loading visitors...
                    </div>
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                    <Users size={28} className="mx-auto mb-2 opacity-30" />
                    No visitors found
                  </td>
                </tr>
              ) : (
                tableData.map((v, i) => {
                  const status = getStatusValue(v)
                  return (
                    <tr key={i} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 bg-orange-100 flex items-center justify-center shrink-0">
                          {getImageUrl(v.visitor_photo) ? (
                            <img
                              src={getImageUrl(v.visitor_photo)}
                              alt={v.visitor_name || 'Visitor'}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.style.display='none'; e.target.parentNode.querySelector('span')?.style && (e.target.parentNode.querySelector('span').style.display='flex'); }}
                            />
                          ) : null}
                          <span className={`text-orange-600 font-bold text-xs ${getImageUrl(v.visitor_photo) ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                            {(v.visitor_name || v.name || "V").charAt(0).toUpperCase()}
                          </span>
                        </div>
                          <span className="font-semibold text-gray-800 whitespace-nowrap">{v.visitor_name || v.name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{v.mobile_number || v.phone || "—"}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap">
                          {v.person_to_meet || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell max-w-[120px] truncate">{v.purpose_of_visit || v.purpose || "—"}</td>
                      <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell whitespace-nowrap font-medium">{formatDate(v.timestamp || v.date_of_visit)}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          ↓ {formatTime(v.time_of_entry, v.timestamp)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell whitespace-nowrap">
                        {v.visitor_out_time ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                            ↑ {formatTime(v.visitor_out_time)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5"><Badge status={status} /></td>
                      <td className="px-4 py-3.5">
                        {v.gate_pass_closed
                          ? <span className="text-[11px] font-semibold text-gray-400">● Closed</span>
                          : <span className="text-[11px] font-semibold text-orange-500">● Open</span>
                        }
                      </td>
                      <td className="px-4 py-3.5">
                        <button className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100">
                          <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && tableData.length > 0 && (
          <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">Showing {tableData.length} of {visits.length} records</span>
            <button
              onClick={() => navigate("/reports")}
              className="text-xs text-orange-500 font-bold hover:underline flex items-center gap-1"
            >
              View full report <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>

      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
    </div>
  )
}

export default HomePage
