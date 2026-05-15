import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  CheckCircle2,
  DoorClosed,
  DoorOpen,
  RefreshCw,
  AlertCircle,
  Phone,
  UserCheck,
  MapPin,
  Bell,
  ArrowLeft,
  Clock,
  ExternalLink,
  Filter,
  Search
} from "lucide-react"
import { fetchGatePassesApi, closeGatePassApi } from "../services/cloasePassApi";

const GatePassClosure = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingGatePasses, setPendingGatePasses] = useState([])
  const [historyGatePasses, setHistoryGatePasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [closingPasses, setClosingPasses] = useState(new Set())
  const previousApprovedRef = useRef(null)

  const fetchGatePassData = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      setError(null);

      const res = await fetchGatePassesApi();
      const rows = res.data.data;

      // Pending: Gate pass not yet closed (Column P is null)
      const pending = rows.filter(v => {
        const a2 = v.actual2 || v.actual_2;
        return !a2 || a2 === "";
      });

      // History: Gate pass is closed (Column P is not null)
      const history = rows.filter(v => {
        const a2 = v.actual2 || v.actual_2;
        return a2 && a2 !== "";
      });

      // Check for new approved passes
      const currentApprovedCount = pending.filter(r => r.approval_status?.toLowerCase() === "approved").length;
      
      if (isPolling && previousApprovedRef.current !== null && currentApprovedCount > previousApprovedRef.current) {
         showToast("A new gate pass was just approved!", "info");
      }

      previousApprovedRef.current = currentApprovedCount;

      setPendingGatePasses(pending);
      setHistoryGatePasses(history);

    } catch (err) {
      if (!isPolling) setError("Failed to load gate passes");
      setPendingGatePasses([]);
      setHistoryGatePasses([]);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGatePassData();
    
    const intervalId = setInterval(() => {
        fetchGatePassData(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchGatePassData])

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 4000)
  }

  const handleCloseGatePass = async (id) => {
    setClosingPasses(prev => new Set([...prev, id]));

    try {
      await closeGatePassApi(id);
      showToast("Gate pass closed successfully", "success");
      fetchGatePassData();
    } catch (err) {
      showToast("Failed to close gate pass", "error");
    } finally {
      setClosingPasses(prev => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  const currentData = activeTab === "pending" ? pendingGatePasses : historyGatePasses
  const handleRefresh = () => fetchGatePassData()

  const getImageUrl = (image) => {
    if (!image) return "/user.png";
    if (typeof image === "string" && image.startsWith("http")) return image;
    return image;
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    try {
      return new Date(`1970-01-01T${time}`).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return time;
    }
  };


    const [selectedFilter, setSelectedFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [purposeFilter, setPurposeFilter] = useState("All");

    const availableFilters = ["All", ...new Set(currentData.map(v => v.person_to_meet).filter(Boolean))];
    const availablePurposes = ["All", ...new Set(currentData.map(v => v.purpose_of_visit).filter(Boolean))];

    const filteredData = currentData.filter(v => {
        const matchesSearch = 
            v.visitor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.mobile_number?.includes(searchTerm);
        
        const matchesPerson = selectedFilter === "All" || v.person_to_meet === selectedFilter;
        const matchesPurpose = purposeFilter === "All" || v.purpose_of_visit === purposeFilter;

        return matchesSearch && matchesPerson && matchesPurpose;
    });

    // Reset filters when tab changes
    useEffect(() => {
        setSelectedFilter("All");
        setSearchTerm("");
        setPurposeFilter("All");
    }, [activeTab]);

  return (
    <div className="space-y-4">
        {/* Compact Single Line Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-sky-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-shrink-0">
                    <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">Gate Pass Management</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Monitor & Close Passes</p>
                </div>

                <div className="h-8 w-[1px] bg-sky-100 mx-2 hidden sm:block"></div>

                {/* Compact Tabs */}
                <div className="flex p-1 bg-sky-50/50 rounded-xl border border-sky-100 w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-bold text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-2 ${
                            activeTab === "pending"
                                ? "bg-sky-500 text-white shadow-md shadow-sky-100"
                                : "text-gray-500 hover:bg-white"
                        }`}
                    >
                        <Clock size={12} />
                        <span>Active ({pendingGatePasses.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-bold text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-2 ${
                            activeTab === "history"
                                ? "bg-green-500 text-white shadow-md shadow-green-100"
                                : "text-gray-500 hover:bg-white"
                        }`}
                    >
                        <CheckCircle2 size={12} />
                        <span>History ({historyGatePasses.length})</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Search Field */}
                <div className="relative flex-1 sm:flex-none min-w-[150px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" size={14} />
                    <input 
                        type="text"
                        placeholder="Search visitor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-sky-50/50 border border-sky-100 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 outline-none w-full sm:w-48 transition-all placeholder:text-gray-400 font-medium"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Filter: Person */}
                    <div className="flex-1 sm:flex-none flex items-center gap-2 bg-sky-50/50 px-3 py-2 rounded-xl border border-sky-100 group">
                        <Filter size={12} className="text-sky-500" />
                        <select 
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="bg-transparent text-[11px] font-semibold text-gray-700 border-none outline-none cursor-pointer focus:ring-0 w-full sm:max-w-[100px] truncate"
                        >
                            <option value="All">All Staff</option>
                            {availableFilters.filter(f => f !== "All").map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>

                    {/* Filter: Purpose */}
                    <div className="flex-1 sm:flex-none flex items-center gap-2 bg-sky-50/50 px-3 py-2 rounded-xl border border-sky-100">
                        <select 
                            value={purposeFilter}
                            onChange={(e) => setPurposeFilter(e.target.value)}
                            className="bg-transparent text-[11px] font-semibold text-gray-700 border-none outline-none cursor-pointer focus:ring-0 w-full sm:max-w-[100px] truncate"
                        >
                            <option value="All">All Purpose</option>
                            {availablePurposes.filter(p => p !== "All").map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-2 bg-white text-sky-600 hover:bg-sky-50 rounded-xl border border-sky-100 transition-all shadow-sm disabled:opacity-50"
                    title="Refresh Data"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
        {/* Table Container - Desktop only */}
        <div className="hidden lg:block bg-white rounded-3xl border border-sky-50 shadow-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-sky-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-sky-700 uppercase tracking-wider text-left">Actions</th>
                  <th className="px-6 py-4 text-xs font-bold text-sky-700 uppercase tracking-wider">Pass ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-sky-700 uppercase tracking-wider">Visitor Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-sky-700 uppercase tracking-wider">Visit Information</th>
                  <th className="px-6 py-4 text-xs font-bold text-sky-700 uppercase tracking-wider">Timing</th>
                  <th className="px-6 py-4 text-xs font-bold text-sky-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent"></div>
                        <span className="text-gray-400 font-medium">Loading gate passes...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-gray-400 font-medium">
                      <DoorClosed size={48} className="mx-auto mb-4 opacity-20" />
                      No {activeTab} gate passes found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((gatePass) => {
                    const isClosing = closingPasses.has(gatePass.id);
                    return (
                      <tr key={gatePass.id} className="hover:bg-sky-50/30 transition-colors group">
                        <td className="px-6 py-4 text-left">
                          {activeTab === "pending" && (
                            gatePass.status === "Approved" || gatePass.status_1 === "Approved" || gatePass.status1 === "Approved" ||
                            gatePass.status === "Rejected" || gatePass.status_1 === "Rejected" || gatePass.status1 === "Rejected" ||
                            gatePass.approval_status === "Approved" || gatePass.approval_status === "Rejected"
                          ) && (
                            <button
                              onClick={() => handleCloseGatePass(gatePass.serial_no)}
                              disabled={isClosing}
                              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isClosing
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-100 hover:scale-105"
                              }`}
                            >
                              {isClosing ? <RefreshCw size={14} className="animate-spin" /> : <DoorClosed size={14} />}
                              {isClosing ? "Closing..." : "Close Pass"}
                            </button>
                          )}
                          {activeTab === "history" && (
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold bg-sky-100 text-sky-700 px-2.5 py-1 rounded-lg">
                            {gatePass.serial_no || `SN-${gatePass.id.toString().padStart(3, '0')}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl overflow-hidden border border-sky-100">
                              <img src={getImageUrl(gatePass.visitor_photo)} className="h-full w-full object-cover" alt="Visitor" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{gatePass.visitor_name}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} /> {gatePass.mobile_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-700">To Meet: {gatePass.person_to_meet}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">Purpose: {gatePass.purpose_of_visit}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-1">
                            <p className="text-gray-700 font-medium flex items-center gap-1">
                              <Clock size={12} className="text-sky-500" /> In: {
                                gatePass.time_of_entry?.toString().includes('T')
                                  ? new Date(gatePass.time_of_entry).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                  : gatePass.time_of_entry || "N/A"
                              }
                            </p>
                            {gatePass.visitor_out_time && (
                              <p className="text-red-500 font-medium flex items-center gap-1">
                                <DoorClosed size={12} /> Out: {gatePass.visitor_out_time}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            (gatePass.actual2 || gatePass.actual_2)
                              ? "bg-green-100 text-green-700"
                              : ((gatePass.status || gatePass.status_1 || gatePass.status1)?.toUpperCase() === "APPROVED"
                                  ? "bg-blue-100 text-blue-700"
                                  : (gatePass.status || gatePass.status_1 || gatePass.status1)?.toUpperCase() === "REJECTED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700")
                          }`}>
                            {(gatePass.actual2 || gatePass.actual_2) ? "CLOSED" : (gatePass.status || gatePass.status_1 || gatePass.status1 || gatePass.approval_status || "PENDING").toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards - visible only on small screens */}
        <div className="lg:hidden space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl p-8 flex justify-center shadow-sm border border-sky-50">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-400 font-medium shadow-sm border border-sky-50">
              <DoorClosed size={40} className="mx-auto mb-3 opacity-20" />
              No {activeTab} gate passes found.
            </div>
          ) : (
            filteredData.map((gatePass) => {
              const isClosing = closingPasses.has(gatePass.id);
              const canClose = activeTab === "pending" && (
                gatePass.status === "Approved" || gatePass.status_1 === "Approved" || gatePass.status1 === "Approved" ||
                gatePass.status === "Rejected" || gatePass.status_1 === "Rejected" || gatePass.status1 === "Rejected" ||
                gatePass.approval_status === "Approved" || gatePass.approval_status === "Rejected"
              );
              return (
                <div key={gatePass.id} className="bg-white rounded-2xl border border-sky-100 shadow-sm p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold bg-sky-100 text-sky-700 px-2.5 py-1 rounded-lg">
                      {gatePass.serial_no || `SN-${gatePass.id?.toString().padStart(3, '0')}`}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      (gatePass.actual2 || gatePass.actual_2)
                        ? "bg-green-100 text-green-700"
                        : (gatePass.status || gatePass.status_1 || gatePass.status1)?.toUpperCase() === "APPROVED"
                          ? "bg-blue-100 text-blue-700"
                          : (gatePass.status || gatePass.status_1 || gatePass.status1)?.toUpperCase() === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                    }`}>
                      {(gatePass.actual2 || gatePass.actual_2) ? "CLOSED" : (gatePass.status || gatePass.status_1 || gatePass.status1 || gatePass.approval_status || "PENDING").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl overflow-hidden border border-sky-100 flex-shrink-0">
                      <img src={getImageUrl(gatePass.visitor_photo)} className="h-full w-full object-cover" alt="Visitor" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{gatePass.visitor_name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} /> {gatePass.mobile_number}</p>
                    </div>
                  </div>
                  <div className="text-sm space-y-0.5">
                    <p className="text-gray-700"><span className="font-semibold">To Meet:</span> {gatePass.person_to_meet}</p>
                    <p className="text-xs text-gray-500"><span className="font-semibold">Purpose:</span> {gatePass.purpose_of_visit}</p>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <p className="flex items-center gap-1">
                      <Clock size={12} className="text-sky-500" /> In: {
                        gatePass.time_of_entry?.toString().includes('T')
                          ? new Date(gatePass.time_of_entry).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                          : gatePass.time_of_entry || "N/A"
                      }
                    </p>
                    {gatePass.visitor_out_time && (
                      <p className="flex items-center gap-1 text-red-500">
                        <DoorClosed size={12} /> Out: {gatePass.visitor_out_time}
                      </p>
                    )}
                  </div>
                  {canClose && (
                    <button
                      onClick={() => handleCloseGatePass(gatePass.serial_no)}
                      disabled={isClosing}
                      className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isClosing ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600 shadow-md"
                      }`}
                    >
                      {isClosing ? <RefreshCw size={14} className="animate-spin" /> : <DoorClosed size={14} />}
                      {isClosing ? "Closing..." : "Close Pass"}
                    </button>
                  )}
                  {activeTab === "history" && (
                    <div className="text-center">
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">Completed</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      {toast.show && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl text-white ${
            toast.type === "success" ? "bg-green-500" :
            toast.type === "error" ? "bg-red-500" : "bg-sky-500"
          }`}>
            <Bell size={20} />
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default GatePassClosure;

