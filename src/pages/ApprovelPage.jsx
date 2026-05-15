import React, { useState, useEffect } from 'react'
import { 
    Clock, 
    CheckCircle, 
    CheckCircle2,
    Search,
    LogOut, 
    Bell, 
    Calendar, 
    UserCheck, 
    XCircle, 
    Eye, 
    Phone, 
    MapPin, 
    ArrowLeft,
    ShieldCheck,
    AlertCircle,
    User,
    Filter
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUser } from '../services/slice/loginSlice'
import { fetchVisitsForApprovalApi, updateVisitApprovalApi } from '../services/approvalApi'

const VisitorManagement = () => {
    const [userRole, setUserRole] = useState("")
    const [username, setUsername] = useState("")
    const [activeTab, setActiveTab] = useState("Requests")
    const [isLoading, setIsLoading] = useState(false)
    const [toast, setToast] = useState({ show: false, message: "", type: "" })
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [pendingVisits, setPendingVisits] = useState([])
    const [approvedVisits, setApprovedVisits] = useState([])
    const [loadingStates, setLoadingStates] = useState({});

    const { isLoggedIn: isReduxLoggedIn, userData } = useSelector((state) => state.login);

    useEffect(() => {
        if (isReduxLoggedIn && userData) {
            setUsername(userData.user_name);
            setUserRole(userData.role);
            setIsLoggedIn(true);
        } else {
            navigate("/login", { replace: true });
        }
    }, [navigate, isReduxLoggedIn, userData]);

    const fetchAllData = async () => {
        if (!username) return;
        setIsLoading(true);
        try {
            const res = await fetchVisitsForApprovalApi(username);
            if (res.success) {
                // Pending: Column K (planned1) not null AND Column L (actual1) is null
                const pending = res.visits.filter(v => {
                    const p1 = v.planned1 || v.planned_1;
                    const a1 = v.actual1 || v.actual_1 || v.actual;
                    return p1 && (!a1 || a1 === "");
                });
                
                // History: Column K (planned1) AND Column L (actual1) both not null
                const history = res.visits.filter(v => {
                    const p1 = v.planned1 || v.planned_1;
                    const a1 = v.actual1 || v.actual_1 || v.actual;
                    return p1 && a1 && a1 !== "";
                });

                setPendingVisits(pending);
                setApprovedVisits(history);
            }
        } catch (err) {
            showToast("Failed to load visit data", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchAllData();
        }
    }, [isLoggedIn, activeTab]);

    const fetchPendingVisits = fetchAllData;
    const fetchApprovedVisits = fetchAllData;

    const updateVisitStatus = async (visitId, status) => {
        try {
            setLoadingStates(prev => ({ ...prev, [visitId]: status }));
            const visit = pendingVisits.find(v => v.id === visitId);
            await updateVisitApprovalApi({ 
                id: visitId, 
                status: status.charAt(0).toUpperCase() + status.slice(1), 
                approvedBy: username,
                serialNo: visit?.serial_no 
            });
            showToast(`Visit ${status} successfully`, "success");
            await fetchPendingVisits();
            await fetchApprovedVisits();
        } catch (err) {
            showToast(`Failed to ${status} visit`, "error");
        } finally {
            setLoadingStates(prev => {
                const copy = { ...prev };
                delete copy[visitId];
                return copy;
            });
        }
    };

    const handleApproveVisit = (id) => updateVisitStatus(id, "approved");
    const handleRejectVisit = (id) => {
        if (window.confirm("Are you sure you want to reject this visit?")) {
            updateVisitStatus(id, "rejected");
        }
    };

    const showToast = (message, type) => {
        setToast({ show: true, message, type })
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000)
    }

    const getImageUrl = (image) => {
        if (!image) return "/user.png";
        if (typeof image === "string" && image.startsWith("http")) return image;
        return image;
    };

    const currentVisits = activeTab === "Requests" ? pendingVisits : approvedVisits;

    const [selectedFilter, setSelectedFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [purposeFilter, setPurposeFilter] = useState("All");

    const availableFilters = ["All", ...new Set(currentVisits.map(v => v.person_to_meet).filter(Boolean))];
    const availablePurposes = ["All", ...new Set(currentVisits.map(v => v.purpose_of_visit).filter(Boolean))];

    const filteredVisits = currentVisits.filter(v => {
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
                        <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">Approval Dashboard</h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Gate Pass Control</p>
                    </div>

                    <div className="h-8 w-[1px] bg-sky-100 mx-2 hidden sm:block"></div>

                    {/* Compact Tabs */}
                    <div className="flex p-1 bg-sky-50/50 rounded-xl border border-sky-100 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab("Requests")}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-bold text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-2 ${
                                activeTab === "Requests"
                                    ? "bg-sky-500 text-white shadow-md shadow-sky-100"
                                    : "text-gray-500 hover:bg-white"
                            }`}
                        >
                            <Clock size={12} />
                            <span>Pending ({pendingVisits.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("Approved")}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-bold text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-2 ${
                                activeTab === "Approved"
                                    ? "bg-green-500 text-white shadow-md shadow-green-100"
                                    : "text-gray-500 hover:bg-white"
                            }`}
                        >
                            <CheckCircle2 size={12} />
                            <span>History ({approvedVisits.length})</span>
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
            </div>

                {/* Table Container - Desktop only */}
                <div className="hidden lg:block bg-white rounded-3xl border border-sky-50 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-sky-50">
                                    {activeTab === "Requests" && (
                                        <th className="px-6 py-4 text-xs font-bold text-sky-700 uppercase tracking-wider text-left">Actions</th>
                                    )}
                                    <th className="px-6 py-4 text-xs font-bold text-sky-700 uppercase tracking-wider w-24">Serial No</th>
                                    <th className="px-6 py-4 text-xs font-bold text-sky-700 uppercase tracking-wider">Visitor</th>
                                    <th className="px-6 py-4 text-xs font-bold text-sky-700 uppercase tracking-wider">Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-sky-700 uppercase tracking-wider">Timing</th>
                                    <th className="px-6 py-4 text-xs font-bold text-sky-700 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sky-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={activeTab === "Requests" ? 6 : 5} className="px-6 py-12 text-center text-gray-400">
                                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-sky-500 border-t-transparent mx-auto mb-2"></div>
                                            Loading requests...
                                        </td>
                                    </tr>
                                ) : filteredVisits.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeTab === "Requests" ? 6 : 5} className="px-6 py-16 text-center text-gray-400 font-medium">
                                            <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                                            No {activeTab.toLowerCase()} found for this filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVisits.map((visit) => (
                                        <tr key={visit.id} className="hover:bg-sky-50/30 transition-colors">
                                        {activeTab === "Requests" && (
                                            <td className="px-6 py-4 text-left">
                                                <div className="flex items-center justify-start gap-2">
                                                    <button
                                                        onClick={() => handleRejectVisit(visit.id)}
                                                        disabled={loadingStates[visit.id]}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveVisit(visit.id)}
                                                        disabled={loadingStates[visit.id]}
                                                        className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-100 hover:bg-sky-600 transition-all flex items-center gap-2"
                                                    >
                                                        {loadingStates[visit.id] === 'approved' ? <Clock size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                        Approve
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 bg-sky-50 text-sky-700 rounded-md text-[11px] font-bold border border-sky-100">
                                                    {visit.serial_no || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-xl overflow-hidden border border-sky-100 flex-shrink-0">
                                                        <img 
                                                            src={getImageUrl(visit.visitor_photo)} 
                                                            className="h-full w-full object-cover" 
                                                            alt="Visitor"
                                                            onError={(e) => { e.target.src = "/user.png"; }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm">{visit.visitor_name}</p>
                                                        <p className="text-xs text-gray-500 font-medium">{visit.mobile_number}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                                        <User size={12} className="text-sky-500" /> {visit.person_to_meet}
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <MapPin size={12} className="text-purple-500" /> {visit.purpose_of_visit}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                                                        <Calendar size={12} className="text-orange-500" /> {visit.timestamp?.split(',')[0] || visit.date_of_visit || "N/A"}
                                                    </p>
                                                    <p className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                                                        <Clock size={12} className="text-blue-500" /> {
                                                            visit.time_of_entry?.toString().includes('T') 
                                                            ? new Date(visit.time_of_entry).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                                            : visit.time_of_entry
                                                        }
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    (visit.status || visit.status_1 || visit.status1 || visit.approval_status)?.toUpperCase() === "APPROVED" 
                                                        ? "bg-blue-100 text-blue-700" 
                                                        : (visit.status || visit.status_1 || visit.status1 || visit.approval_status)?.toUpperCase() === "REJECTED"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-amber-100 text-amber-700"
                                                }`}>
                                                    {(visit.status || visit.status_1 || visit.status1 || visit.approval_status || "PENDING").toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Cards - Desktop hidden */}
                <div className="lg:hidden space-y-4">
                    {isLoading ? (
                        <div className="bg-white rounded-2xl p-8 flex justify-center border border-sky-50 shadow-sm">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent"></div>
                        </div>
                    ) : filteredVisits.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 font-medium border border-sky-50 shadow-sm">
                            <AlertCircle size={40} className="mx-auto mb-3 opacity-20" />
                            No {activeTab.toLowerCase()} found.
                        </div>
                    ) : (
                        filteredVisits.map((visit) => (
                            <div key={visit.id} className="bg-white rounded-2xl border border-sky-100 shadow-sm p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-1 bg-sky-50 text-sky-700 rounded-md text-[11px] font-bold border border-sky-100">
                                        {visit.serial_no || "N/A"}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        (visit.status || visit.status_1 || visit.status1 || visit.approval_status)?.toUpperCase() === "APPROVED" 
                                            ? "bg-blue-100 text-blue-700" 
                                            : (visit.status || visit.status_1 || visit.status1 || visit.approval_status)?.toUpperCase() === "REJECTED"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-amber-100 text-amber-700"
                                    }`}>
                                        {(visit.status || visit.status_1 || visit.status1 || visit.approval_status || "PENDING").toUpperCase()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="h-14 w-14 rounded-2xl overflow-hidden border border-sky-100 flex-shrink-0">
                                        <img 
                                            src={getImageUrl(visit.visitor_photo)} 
                                            className="h-full w-full object-cover" 
                                            alt="Visitor"
                                            onError={(e) => { e.target.src = "/user.png"; }}
                                        />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-gray-800 text-base truncate">{visit.visitor_name}</p>
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                            <Phone size={10} /> {visit.mobile_number}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">To Meet</p>
                                        <p className="text-xs font-bold text-gray-700 truncate flex items-center gap-1">
                                            <User size={12} className="text-sky-500 flex-shrink-0" /> {visit.person_to_meet}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Purpose</p>
                                        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                            <MapPin size={12} className="text-purple-500 flex-shrink-0" /> {visit.purpose_of_visit}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                                        <p className="text-xs font-bold text-gray-600 flex items-center gap-1">
                                            <Calendar size={12} className="text-orange-500 flex-shrink-0" /> {visit.timestamp?.split(',')[0] || visit.date_of_visit || "N/A"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</p>
                                        <p className="text-xs font-bold text-gray-600 flex items-center gap-1">
                                            <Clock size={12} className="text-blue-500 flex-shrink-0" /> {
                                                visit.time_of_entry?.toString().includes('T') 
                                                ? new Date(visit.time_of_entry).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                                : visit.time_of_entry
                                            }
                                        </p>
                                    </div>
                                </div>

                                {activeTab === "Requests" && (
                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            onClick={() => handleRejectVisit(visit.id)}
                                            disabled={loadingStates[visit.id]}
                                            className="flex-1 py-2.5 border border-red-200 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={16} /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleApproveVisit(visit.id)}
                                            disabled={loadingStates[visit.id]}
                                            className="flex-[2] py-2.5 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-100 hover:bg-sky-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            {loadingStates[visit.id] === 'approved' ? <Clock size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                            Approve Request
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

            {toast.show && (
                <div className="fixed top-6 right-6 z-50">
                    <div className={`px-6 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm ${
                        toast.type === "success" ? "bg-green-500" : "bg-red-500"
                    }`}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    )
}

export default VisitorManagement
