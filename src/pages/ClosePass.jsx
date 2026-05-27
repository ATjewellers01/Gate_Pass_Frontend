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
  Search,
  Calendar,
  XCircle
} from "lucide-react"
import { fetchGatePassesApi, closeGatePassApi } from "../services/cloasePassApi";


const formatDate = (d) => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (!isNaN(date.getTime())) {
      return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    }
    return "—";
  } catch (e) {
    return "—";
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return "—";
  try {
    let val = timeStr.toString().trim();
    if (val.toLowerCase().includes("invalid")) return "—";
    
    // If it's already HH:MM or HH:MM AM/PM
    if (/^\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?(?::\d{2})?$/.test(val)) {
      return val;
    }
    
    const d = new Date(val);
    if (isNaN(d.getTime())) return "—";

    let hours = d.getHours();
    let minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch (e) {
    return "—";
  }
}




const GatePassClosure = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingGatePasses, setPendingGatePasses] = useState([])
  const [historyGatePasses, setHistoryGatePasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [closingPasses, setClosingPasses] = useState(new Set())
  const [confirmModal, setConfirmModal] = useState({ show: false, passId: null })
  const [previewImage, setPreviewImage] = useState(null)
  const previousApprovedRef = useRef(null)

  const fetchGatePassData = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      setError(null);

      const res = await fetchGatePassesApi();
      const rows = res.data.data;

      // Pending: gate_pass_closed is false (visitor still inside)
      const pending = rows.filter(v => !v.gate_pass_closed);

      // History: gate_pass_closed is true (visitor exited)
      const history = rows.filter(v => v.gate_pass_closed);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && previewImage) {
            setPreviewImage(null);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);

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
      showToast("Gate pass closed successfully!", "success");
      await new Promise(resolve => setTimeout(resolve, 1500));
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

  const handleClosePassClick = (id) => {
    setConfirmModal({ show: true, passId: id });
  };

  const handleConfirmClose = () => {
    const { passId } = confirmModal;
    setConfirmModal({ show: false, passId: null });
    handleCloseGatePass(passId);
  };

  const handleCancelClose = () => {
    setConfirmModal({ show: false, passId: null });
  };

  const currentData = activeTab === "pending" ? pendingGatePasses : historyGatePasses
  const handleRefresh = () => fetchGatePassData()

  const getImageUrl = (image) => {
    if (!image) return "/user.png";
    if (typeof image === "string" && image.startsWith("http")) return image;
    return image;
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-orange-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-shrink-0">
                    <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">Gate Pass Management</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Monitor & Close Passes</p>
                </div>

                <div className="h-8 w-[1px] bg-orange-100 mx-2 hidden sm:block"></div>

                {/* Compact Tabs */}
                <div className="flex p-1 bg-orange-50/50 rounded-xl border border-orange-100 w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-bold text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-2 ${
                            activeTab === "pending"
                                ? "bg-orange-500 text-white shadow-md shadow-orange-100"
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={14} />
                    <input 
                        type="text"
                        placeholder="Search visitor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-orange-50/50 border border-orange-100 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 outline-none w-full sm:w-48 transition-all placeholder:text-gray-400 font-medium"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Filter: Person */}
                    <div className="flex-1 sm:flex-none flex items-center gap-2 bg-orange-50/50 px-3 py-2 rounded-xl border border-orange-100 group">
                        <Filter size={12} className="text-orange-500" />
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
                    <div className="flex-1 sm:flex-none flex items-center gap-2 bg-orange-50/50 px-3 py-2 rounded-xl border border-orange-100">
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
                    className="p-2 bg-white text-orange-600 hover:bg-orange-50 rounded-xl border border-orange-100 transition-all shadow-sm disabled:opacity-50"
                    title="Refresh Data"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
        {/* Table Container - Desktop only */}
        <div className="hidden lg:block bg-white rounded-3xl border border-orange-50 shadow-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-orange-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-orange-700 uppercase tracking-wider text-left">Actions</th>
                  <th className="px-6 py-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Pass ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Visitor</th>
                  <th className="px-6 py-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Person to Meet</th>
                  <th className="px-6 py-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Time In</th>
                  {activeTab === "history" && (
                    <th className="px-6 py-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Time Out</th>
                  )}
                  <th className="px-6 py-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {loading ? (
                  <tr>
                    <td colSpan={activeTab === "history" ? 10 : 9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
                        <span className="text-gray-400 font-medium">Loading gate passes...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === "history" ? 10 : 9} className="px-6 py-16 text-center text-gray-400 font-medium">
                      <DoorClosed size={48} className="mx-auto mb-4 opacity-20" />
                      No {activeTab} gate passes found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((gatePass) => {
                    const isClosing = closingPasses.has(gatePass.id);
                    return (
                      <tr key={gatePass.id} className="hover:bg-orange-50/30 transition-colors group">
                        <td className="px-6 py-4 text-left">
                          {activeTab === "pending" && (
                            gatePass.approval_status === "approved" || gatePass.approval_status === "rejected"
                          ) && (
                            <button
                              onClick={() => handleClosePassClick(gatePass.id)}
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
                          <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg">
                            {gatePass.serial_no || `SN-${gatePass.id.toString().padStart(3, '0')}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl overflow-hidden border border-orange-100 flex-shrink-0">
                              <img src={getImageUrl(gatePass.visitor_photo)} className="h-full w-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300" onClick={() => setPreviewImage(getImageUrl(gatePass.visitor_photo))} alt="Visitor" onError={(e) => { e.target.src = "/user.png"; }} />
                            </div>
                            <p className="font-bold text-gray-800 text-sm whitespace-nowrap">{gatePass.visitor_name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-gray-500 font-medium whitespace-nowrap"><Phone size={10} className="inline mr-1" />{gatePass.mobile_number}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">{gatePass.person_to_meet}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{gatePass.purpose_of_visit}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[11px] font-bold text-gray-600 flex items-center gap-1 whitespace-nowrap">
                            <Calendar size={12} className="text-orange-500" /> {formatDate(gatePass.time_of_entry || gatePass.created_at)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[11px] font-bold text-gray-600 flex items-center gap-1 whitespace-nowrap">
                            <Clock size={12} className="text-blue-500" /> {formatTime(gatePass.time_of_entry || gatePass.created_at || gatePass.timestamp)}
                          </p>
                        </td>
                        {activeTab === "history" && (
                          <td className="px-6 py-4">
                            <p className="text-[11px] font-bold text-gray-600 flex items-center gap-1 whitespace-nowrap">
                              <DoorClosed size={12} className="text-red-500" /> {gatePass.visitor_out_time ? formatTime(gatePass.visitor_out_time) : "—"}
                            </p>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            gatePass.gate_pass_closed
                              ? "bg-green-100 text-green-700"
                              : gatePass.approval_status === "approved"
                                  ? "bg-blue-100 text-blue-700"
                                  : gatePass.approval_status === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                          }`}>
                            {gatePass.gate_pass_closed ? "CLOSED" : (gatePass.approval_status || "pending").toUpperCase()}
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
            <div className="bg-white rounded-2xl p-8 flex justify-center shadow-sm border border-orange-50">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-400 font-medium shadow-sm border border-orange-50">
              <DoorClosed size={40} className="mx-auto mb-3 opacity-20" />
              No {activeTab} gate passes found.
            </div>
          ) : (
            filteredData.map((gatePass) => {
              const isClosing = closingPasses.has(gatePass.id);
              const canClose = activeTab === "pending" && (
                gatePass.approval_status === "approved" || gatePass.approval_status === "rejected"
              );
              return (
                <div key={gatePass.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg">
                      {gatePass.serial_no || `SN-${gatePass.id?.toString().padStart(3, '0')}`}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      gatePass.gate_pass_closed
                        ? "bg-green-100 text-green-700"
                        : gatePass.approval_status === "approved"
                          ? "bg-blue-100 text-blue-700"
                          : gatePass.approval_status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                    }`}>
                      {gatePass.gate_pass_closed ? "CLOSED" : (gatePass.approval_status || "pending").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl overflow-hidden border border-orange-100 flex-shrink-0">
                      <img src={getImageUrl(gatePass.visitor_photo)} className="h-full w-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300" onClick={() => setPreviewImage(getImageUrl(gatePass.visitor_photo))} alt="Visitor" onError={(e) => { e.target.src = "/user.png"; }} />
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
                  <div className="flex flex-col gap-1 text-xs text-gray-600">
                    <p className="text-[11px] font-bold text-gray-600 flex items-center gap-1 whitespace-nowrap">
                      <Calendar size={12} className="text-orange-500" /> {formatDate(gatePass.time_of_entry || gatePass.created_at)}
                    </p>
                    <div className="flex gap-4 mt-1">
                      <p className="text-[11px] font-bold text-gray-600 flex items-center gap-1 whitespace-nowrap">
                        <Clock size={12} className="text-blue-500" /> In: {formatTime(gatePass.time_of_entry || gatePass.created_at || gatePass.timestamp)}
                      </p>
                      {activeTab === "history" && gatePass.visitor_out_time && (
                        <p className="text-[11px] font-bold text-gray-600 flex items-center gap-1 whitespace-nowrap">
                          <DoorClosed size={12} className="text-red-500" /> Out: {formatTime(gatePass.visitor_out_time)}
                        </p>
                      )}
                    </div>
                  </div>
                  {canClose && (
                    <button
                      onClick={() => handleClosePassClick(gatePass.id)}
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

      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCancelClose}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center gap-5 animate-[fadeIn_0.2s_ease]">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-orange-100">
              <DoorClosed size={36} className="text-orange-500" />
            </div>

            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Close Gate Pass?</h2>
              <p className="text-sm text-gray-500">
                Are you sure you want to close this gate pass? Once closed, the visitor will be marked as exited.
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={handleCancelClose}
                className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all"
              >
                No, Cancel
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg bg-orange-500 hover:bg-orange-600 shadow-orange-100"
              >
                Yes, Close Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Improved Animated Toast */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[60] animate-[slideIn_0.3s_ease]">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white font-bold text-sm ${
            toast.type === "success" ? "bg-green-500" :
            toast.type === "error" ? "bg-red-500" : "bg-orange-500"
          }`}>
            {toast.type === "success" 
                ? <CheckCircle2 size={18} /> 
                : toast.type === "error" 
                ? <AlertCircle size={18} />
                : <Bell size={18} />
            }
            {toast.message}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
          <div 
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
              onClick={() => setPreviewImage(null)}
          >
              <div className="relative max-w-3xl max-h-[90vh] w-full flex justify-center items-center">
                  <button 
                      className="absolute -top-10 right-0 md:-right-10 text-white hover:text-gray-300 transition-colors bg-black/40 hover:bg-black/60 rounded-full p-1"
                      onClick={() => setPreviewImage(null)}
                  >
                      <XCircle size={28} />
                  </button>
                  <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                  />
              </div>
          </div>
      )}
    </div>
  )
}

export default GatePassClosure;

