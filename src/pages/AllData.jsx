"use client";
import { useEffect, useState, useRef } from "react";
import { fetchAllVisitorsApi } from "../services/allVisitors.js";
import { updateVisitApprovalApi } from "../services/approvalApi.js";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../services/slice/loginSlice";
import { User, Users, Eye, Search, Filter, Download, ChevronLeft, ChevronRight, CheckCircle, XCircle, Bell, LogOut, Clock, ArrowLeft, QrCode, UserCheck, Phone, Plus, Pencil, Trash2, X, AlertTriangle } from "lucide-react";
import {
    fetchPersonsApi,
    createPersonApi,
    updatePersonApi,
    deletePersonApi
} from "../services/personApi";
import QRCodeModal from "../components/QRCodeModal";

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

const AdminAllVisits = ({ initialTab = "Visitors", hideTabs = false, readOnly = false }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const { userData } = useSelector((state) => state.login);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [purposeFilter, setPurposeFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [showPersonModal, setShowPersonModal] = useState(false);
    const [persons, setPersons] = useState([]);
    const [personForm, setPersonForm] = useState({ personToMeet: "", phone: "", designation: "", status: "active" });
    const [formErrors, setFormErrors] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, person: null });
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [activeMainTab, setActiveMainTab] = useState(initialTab);
    const previousPendingRef = useRef(null);

    const itemsPerPage = 10;

    const getStatusStr = (v) => (v?.approval_status || v?.status || v?.status_1 || v?.status1 || "").toString().toLowerCase();

    const fetchData = async (isPolling = false) => {
        try {
            if (!isPolling) setLoading(true);
            const queryRole = userData?.role === "admin" || userData?.role === "guard" ? "admin" : userData?.user_name;
            const res = await fetchAllVisitorsApi(queryRole);
            const rows = res.data?.data || res.data || [];
            const visitors = Array.isArray(rows) ? rows : [];
            setData(visitors);

            // Check for new pending requests using ref to avoid stale closures
            const currentPendingCount = visitors.filter(v => getStatusStr(v) === 'pending').length;

            if (isPolling && previousPendingRef.current !== null && currentPendingCount > previousPendingRef.current) {
                showToast("New visitor request received!", "info");
            }

            // Always update the ref after checking
            previousPendingRef.current = currentPendingCount;

        } catch (err) {
            if (!isPolling) setError("Failed to load data");
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        try {
            await updateVisitApprovalApi({ id, status, approvedBy: "admin" });
            fetchData(); // Refresh data after action
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const handleLogout = () => {
        sessionStorage.clear();
        dispatch(logoutUser());
        navigate("/login", { replace: true });
    };

    useEffect(() => {
        fetchData();

        // Polling interval (every 5 seconds)
        const intervalId = setInterval(() => {
            fetchData(true);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [userData]); // Added userData dependency

    const loadPersons = async () => {
        const res = await fetchPersonsApi();
        setPersons(res.data || []);
    };

    useEffect(() => {
        if (showEmployeeModal || activeMainTab === "Employees") {
            loadPersons();
        }
    }, [showEmployeeModal, activeMainTab]);

    const emptyForm = { personToMeet: "", phone: "", designation: "", status: "active" };

    const openAddModal = () => {
        setPersonForm(emptyForm);
        setEditingId(null);
        setFormErrors({});
        setShowEmployeeModal(true);
    };

    const openEditModal = (p) => {
        setPersonForm({
            personToMeet: p.person_to_meet || "",
            phone: p.phone === 'N/A' ? '' : (p.phone || ""),
            designation: p.designation || "",
            status: p.status || "active"
        });
        setEditingId(p.id);
        setFormErrors({});
        setShowEmployeeModal(true);
    };

    const closeEmployeeModal = () => {
        setShowEmployeeModal(false);
        setEditingId(null);
        setPersonForm(emptyForm);
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};
        if (!personForm.personToMeet.trim()) errors.personToMeet = "Employee name is required.";
        if (personForm.phone && !/^[0-9+\-\s]{7,15}$/.test(personForm.phone.trim())) errors.phone = "Enter a valid phone number.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEmployeeSubmit = async () => {
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            const payload = {
                personToMeet: personForm.personToMeet.trim(),
                phone: personForm.phone.trim(),
                designation: personForm.designation.trim(),
                status: personForm.status
            };
            if (editingId) {
                const res = await updatePersonApi(editingId, payload);
                if (res.error) throw new Error(res.error);
                showToast("Employee updated successfully!", "success");
            } else {
                const res = await createPersonApi(payload);
                if (res.error) throw new Error(res.error);
                showToast("Employee added successfully!", "success");
            }
            closeEmployeeModal();
            loadPersons();
        } catch (err) {
            showToast(err.message || "Something went wrong.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteConfirmed = async () => {
        const p = deleteConfirm.person;
        if (!p) return;
        try {
            await deletePersonApi(p.id);
            showToast("Employee deleted.", "success");
            loadPersons();
        } catch {
            showToast("Failed to delete employee.", "error");
        } finally {
            setDeleteConfirm({ show: false, person: null });
        }
    };


    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowImageModal(true);
    };

    const closeImageModal = () => {
        setShowImageModal(false);
        setSelectedImage("");
    };

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
    };

    const availableFilters = ["All", ...new Set(data.map(v => v.person_to_meet).filter(Boolean))];
    const availablePurposes = ["All", ...new Set(data.map(v => v.purpose_of_visit).filter(Boolean))];

    const filteredData = data.filter(item => {
        const matchesSearch = Object.values(item).some(value =>
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesPerson = selectedFilter === "All" || item.person_to_meet === selectedFilter;
        const matchesPurpose = purposeFilter === "All" || item.purpose_of_visit === purposeFilter;
        return matchesSearch && matchesPerson && matchesPurpose;
    });

    const filteredPersons = persons.filter(p => 
        p.person_to_meet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm)
    );

    const activeList = activeMainTab === "Visitors" ? filteredData : filteredPersons;
    const totalPages = Math.ceil(activeList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = activeList.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    const getStatusBadge = (v) => {
        const status = getStatusStr(v);
        switch (status) {
            case 'approved':
                return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Approved</span>;
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Pending</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Rejected</span>;
            default:
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Pending</span>;
        }
    };

    const getImageUrl = (image) => {
        if (!image) return null;
        const str = image.toString().trim();
        
        // Extract Google Drive file ID from full URL
        const match = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
        let id = match ? match[1] : null;
        
        // If no full URL match, check if the string itself is just a raw Drive ID
        if (!id && /^[a-zA-Z0-9_-]{20,}$/.test(str)) {
            id = str;
        }
        
        if (id) {
            // Use the official Google Drive export URL which avoids recent 403 Forbidden errors
            return `https://drive.google.com/uc?export=view&id=${id}`;
        }
        
        // Already a direct URL or base64 data URI
        if (str.startsWith("http") || str.startsWith("data:image")) return str;
        return null;
    };



    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Compact Single Line Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-orange-100 shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        {readOnly && (
                            <button 
                                onClick={() => navigate("/dashboard")}
                                className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors border border-orange-100"
                            >
                                <ArrowLeft className="w-4 h-4 text-orange-600" />
                            </button>
                        )}
                        <div>
                             <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">
                                {activeMainTab === "Employees" ? "Employee Status" : "Visitor Management"}
                             </h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Comprehensive Reports</p>
                        </div>
                    </div>

                    {!hideTabs && (
                        <>
                            <div className="h-8 w-[1px] bg-orange-100 mx-2 hidden sm:block"></div>
                            <div className="flex p-1 bg-orange-50/50 rounded-xl border border-orange-100 w-full sm:w-auto">
                                <button
                                    onClick={() => setActiveMainTab("Visitors")}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-bold text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-2 ${
                                        activeMainTab === "Visitors"
                                            ? "bg-orange-500 text-white shadow-md shadow-orange-100"
                                            : "text-gray-500 hover:bg-white"
                                    }`}
                                >
                                    <Users size={12} />
                                    Visitors
                                </button>
                                <button
                                    onClick={() => setActiveMainTab("Employees")}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-bold text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-2 ${
                                        activeMainTab === "Employees"
                                            ? "bg-orange-500 text-white shadow-md shadow-orange-100"
                                            : "text-gray-500 hover:bg-white"
                                    }`}
                                >
                                    <UserCheck size={12} />
                                    Employees
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Search Field */}
                    <div className="relative flex-1 sm:flex-none min-w-[120px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={14} />
                        <input 
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-orange-50/50 border border-orange-100 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 outline-none w-full sm:w-48 transition-all placeholder:text-gray-400 font-medium"
                        />
                    </div>

                    {activeMainTab === "Visitors" && availableFilters.length > 1 && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Filter: Person */}
                            <div className="flex-1 sm:flex-none flex items-center gap-2 bg-orange-50/50 px-3 py-2 rounded-xl border border-orange-100">
                                <Filter size={12} className="text-orange-500" />
                                <select 
                                    value={selectedFilter}
                                    onChange={(e) => setSelectedFilter(e.target.value)}
                                    className="bg-transparent text-[11px] font-semibold text-gray-700 border-none outline-none cursor-pointer focus:ring-0 w-full sm:max-w-[100px] truncate"
                                >
                                    {availableFilters.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>

                            {/* Filter: Purpose */}
                            <div className="flex-1 sm:flex-none flex items-center gap-2 bg-orange-50/50 px-3 py-2 rounded-xl border border-orange-100">
                                <select 
                                    value={purposeFilter}
                                    onChange={(e) => setPurposeFilter(e.target.value)}
                                    className="bg-transparent text-[11px] font-semibold text-gray-700 border-none outline-none cursor-pointer focus:ring-0 w-full sm:max-w-[100px] truncate"
                                >
                                    {availablePurposes.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {!readOnly && activeMainTab === "Employees" && (
                            <button
                                onClick={openAddModal}
                                className="flex-1 sm:flex-none flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 active:scale-95 shadow-md shadow-orange-100 transition-all duration-200"
                            >
                                <Plus size={13} />
                                Add Employee
                            </button>
                        )}
                        
                        <button
                            onClick={() => setIsQRModalOpen(true)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-xl transition-colors border border-orange-200 shadow-sm"
                            title="Show Visitor QR Code"
                        >
                            <QrCode className="w-4 h-4" />
                        </button>


                    </div>
                </div>
            </div>



                {/* Stats Cards */}
                {activeMainTab === "Visitors" ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="text-sm text-gray-600 mb-1">Total Visitors</div>
                            <div className="text-2xl font-bold text-gray-900">{data.length}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="text-sm text-gray-600 mb-1">Pending</div>
                            <div className="text-2xl font-bold text-yellow-600">
                                {data.filter(v => getStatusStr(v) === 'pending').length}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="text-sm text-gray-600 mb-1">Approved</div>
                            <div className="text-2xl font-bold text-green-600">
                                {data.filter(v => getStatusStr(v) === 'approved').length}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="text-sm text-gray-600 mb-1">Rejected</div>
                            <div className="text-2xl font-bold text-red-600">
                                {data.filter(v => getStatusStr(v) === 'rejected').length}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="text-sm text-gray-600 mb-1">Total Employees</div>
                            <div className="text-2xl font-bold text-gray-900">{persons.length}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="text-sm text-gray-600 mb-1">Available</div>
                            <div className="text-2xl font-bold text-green-600">
                                {persons.filter(p => p.status !== 'Absent').length}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="text-sm text-gray-600 mb-1">Absent</div>
                            <div className="text-2xl font-bold text-red-600">
                                {persons.filter(p => p.status === 'Absent').length}
                            </div>
                        </div>
                    </div>
                )}


            {/* Content Section */}
            <div className="mt-6">
                {activeMainTab === "Visitors" ? (
                    <div className="space-y-6">
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Visitor Details</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Visit Info</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Approval & Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {currentData.map((v) => (
                                                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden cursor-pointer mr-4 bg-orange-100 flex items-center justify-center" onClick={() => handleImageClick(getImageUrl(v.visitor_photo))}>
                                                                {getImageUrl(v.visitor_photo) ? (
                                                                    <img src={getImageUrl(v.visitor_photo)} alt={v.visitor_name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.parentNode.querySelector('span')?.style && (e.target.parentNode.querySelector('span').style.display='flex'); }} />
                                                                ) : null}
                                                                <span className={`text-orange-600 font-bold text-sm ${getImageUrl(v.visitor_photo) ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>{(v.visitor_name || "V").charAt(0).toUpperCase()}</span>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">{v.visitor_name}</div>
                                                                <div className="text-sm text-gray-600">{v.mobile_number}</div>
                                                                {v.visitor_address && <div className="text-xs text-gray-500 mt-1">{v.visitor_address}</div>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <div className="font-medium text-gray-900">Meeting: {v.person_to_meet}</div>
                                                        <div className="text-gray-600">Purpose: {v.purpose_of_visit || '-'}</div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {v.date_of_visit ? new Date(v.date_of_visit).toLocaleDateString("en-IN") : (v.timestamp ? v.timestamp.toString().split(',')[0] : 'N/A')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {getStatusBadge(v)}
                                                        <div className="mt-1 text-xs text-gray-500">{v.gate_pass_closed ? 'Gate Pass Closed' : 'Gate Pass Open'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-600 font-medium">
                                                        {formatDate(v.timestamp || v.date_of_visit)}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-600">
                                                        <div className="font-medium text-orange-600 mb-1">Entry: {formatTime(v.time_of_entry, v.timestamp)}</div>
                                                        {v.approved_by && <div>By: {v.approved_by}</div>}
                                                        {v.approved_at && <div>At: {formatTime(v.approved_at)}</div>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {totalPages > 1 && (
                                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
                                        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-50">Prev</button>
                                        <span className="text-sm">Page {currentPage} of {totalPages}</span>
                                        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-50">Next</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {currentData.map((v) => (
                                <div key={v.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden" onClick={() => handleImageClick(getImageUrl(v.visitor_photo))}>
                                            <img src={getImageUrl(v.visitor_photo)} alt={v.visitor_name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{v.visitor_name}</div>
                                            <div className="text-sm text-gray-600">{v.mobile_number}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div className="text-orange-600 font-bold">Date: {formatDate(v.timestamp || v.date_of_visit)}</div>
                                        <div className="text-orange-600 font-bold">Time: {formatTime(v.time_of_entry, v.timestamp)}</div>
                                        <div><strong>Meeting:</strong> {v.person_to_meet}</div>
                                        <div><strong>Status:</strong> {getStatusBadge(v)}</div>
                                    </div>
                                </div>
                            ))}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4">
                                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-50">Prev</button>
                                    <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-50">Next</button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Desktop Table - Employees */}
                        <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                         <tr>
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee Name</th>
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Designation</th>
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                             {!readOnly && <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>}
                                         </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {activeMainTab === "Employees" && currentData.map((p) => {
                                            const activeMeeting = data.find(v => v.person_to_meet === p.person_to_meet && v.approval_status?.toLowerCase() === 'approved' && !v.gate_pass_closed);
                                            const isAvailable = p.status !== 'Absent';
                                            
                                            return (
                                                <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900">{p.person_to_meet}</div>
                                                        {activeMeeting && (
                                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full w-fit border border-orange-100 italic">
                                                                <Clock className="w-3 h-3" />
                                                                <span>In Meeting with {activeMeeting.visitor_name}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{p.phone || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{p.designation || '—'}</td>
                                                    <td className="px-6 py-4">
                                                        <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                                                            isAvailable
                                                                ? "bg-green-50 text-green-700 border-green-200"
                                                                : "bg-red-50 text-red-700 border-red-200"
                                                        }`}>
                                                            {isAvailable ? 'Available' : 'Absent'}
                                                        </div>
                                                    </td>
                                                    {!readOnly && (
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    title="Edit Employee"
                                                                    onClick={() => openEditModal(p)}
                                                                    className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-150 opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Pencil size={14} />
                                                                </button>
                                                                <button
                                                                    title="Delete Employee"
                                                                    onClick={() => setDeleteConfirm({ show: true, person: p })}
                                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-all duration-150 opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                     {/* Mobile Cards - Employees */}
                     <div className="md:hidden space-y-4">
                         {activeMainTab === "Employees" && currentData.map((p) => {
                             const activeMeeting = data.find(v => v.person_to_meet === p.person_to_meet && v.approval_status?.toLowerCase() === 'approved' && !v.gate_pass_closed);
                             const isAvailable = p.status !== 'Absent';
                             return (
                                 <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
                                     <div className="flex items-center justify-between">
                                         <div>
                                             <div className="font-bold text-gray-900 text-base">{p.person_to_meet}</div>
                                             {p.designation && <div className="text-xs text-gray-500 mt-0.5">{p.designation}</div>}
                                         </div>
                                         <div className="flex items-center gap-2">
                                             <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                 isAvailable
                                                     ? "bg-green-100 text-green-700"
                                                     : "bg-red-100 text-red-700"
                                             }`}>
                                                 {isAvailable ? 'Available' : 'Absent'}
                                             </div>
                                             {!readOnly && (
                                                 <div className="flex gap-1">
                                                     <button title="Edit" onClick={() => openEditModal(p)} className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"><Pencil size={13} /></button>
                                                     <button title="Delete" onClick={() => setDeleteConfirm({ show: true, person: p })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                                                 </div>
                                             )}
                                         </div>
                                     </div>
                                     
                                     <div className="flex items-center gap-2 text-sm text-gray-600">
                                         <Phone size={14} className="text-orange-500" />
                                         <span>{p.phone || 'N/A'}</span>
                                     </div>

                                     {activeMeeting && (
                                         <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-700 italic">
                                             <Clock size={14} />
                                             <span>In Meeting with {activeMeeting.visitor_name}</span>
                                         </div>
                                     )}
                                 </div>
                             );
                         })}
                     </div>

                     {totalPages > 1 && (
                         <div className="flex items-center justify-between pt-4 md:hidden">
                             <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-bold bg-white rounded-xl border border-gray-200 disabled:opacity-50">Prev</button>
                             <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-bold bg-white rounded-xl border border-gray-200 disabled:opacity-50">Next</button>
                         </div>
                     )}
                        {persons.length === 0 && (
                            <div className="text-center py-12 text-gray-500">No employees found</div>
                        )}
                    </div>
            )}
            </div>
            {showImageModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Visitor Photo</h3>
                            <button
                                onClick={closeImageModal}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 flex justify-center">
                            <img
                                src={selectedImage}
                                alt="Visitor"
                                className="max-w-full max-h-[60vh] object-contain rounded-lg"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/user.png";
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Employee Modal */}
            {showEmployeeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-orange-600">
                            <div>
                                <h2 className="text-base font-bold text-white">{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
                                <p className="text-orange-100 text-xs mt-0.5">{editingId ? 'Update employee details below' : 'Fill in the employee details below'}</p>
                            </div>
                            <button onClick={closeEmployeeModal} className="p-1.5 rounded-lg text-orange-100 hover:text-white hover:bg-white/20 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Employee Name */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Employee Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Pooja Sharma"
                                    value={personForm.personToMeet}
                                    onChange={(e) => { setPersonForm({ ...personForm, personToMeet: e.target.value }); setFormErrors(prev => ({ ...prev, personToMeet: '' })); }}
                                    className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${ formErrors.personToMeet ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-orange-400 focus:ring-orange-100' }`}
                                />
                                {formErrors.personToMeet && <p className="text-xs text-red-500 mt-1">{formErrors.personToMeet}</p>}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="e.g. 9876543210"
                                    value={personForm.phone}
                                    onChange={(e) => { setPersonForm({ ...personForm, phone: e.target.value }); setFormErrors(prev => ({ ...prev, phone: '' })); }}
                                    className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${ formErrors.phone ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-orange-400 focus:ring-orange-100' }`}
                                />
                                {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                            </div>

                            {/* Designation */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Designation</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sales Manager"
                                    value={personForm.designation}
                                    onChange={(e) => setPersonForm({ ...personForm, designation: e.target.value })}
                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-orange-400 focus:ring-orange-100 transition-all"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                                <select
                                    value={personForm.status}
                                    onChange={(e) => setPersonForm({ ...personForm, status: e.target.value })}
                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-orange-400 focus:ring-orange-100 transition-all bg-white cursor-pointer"
                                >
                                    <option value="active">Available</option>
                                    <option value="Absent">Absent</option>
                                </select>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={closeEmployeeModal}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEmployeeSubmit}
                                disabled={submitting}
                                className="px-5 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 rounded-xl shadow-md shadow-orange-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {submitting ? (
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                                ) : null}
                                {editingId ? 'Update Employee' : 'Add Employee'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Employee?</h3>
                            <p className="text-sm text-gray-500">
                                Are you sure you want to delete <span className="font-semibold text-gray-800">{deleteConfirm.person?.person_to_meet}</span>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 px-6 pb-6">
                            <button
                                onClick={() => setDeleteConfirm({ show: false, person: null })}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirmed}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 rounded-xl shadow-md shadow-red-100 transition-all"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-4 sm:top-6 right-4 sm:right-6 left-4 sm:left-auto mx-auto sm:mx-0 max-w-sm z-50">
                    <div className={`px-4 py-3 rounded-xl shadow-lg border text-white flex items-center gap-3 ${toast.type === "success" ? "bg-green-500 border-green-600" :
                        toast.type === "info" ? "bg-blue-500 border-blue-600" :
                            "bg-red-500 border-red-600"
                        }`}>
                        <Bell className="w-5 h-5 animate-bounce" />
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button
                            onClick={() => setToast({ show: false, message: "", type: "" })}
                            className="text-white ml-auto p-1 rounded hover:bg-white/20"
                        >
                            <XCircle className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
            {/* QR Code Modal */}
            <QRCodeModal 
                isOpen={isQRModalOpen} 
                onClose={() => setIsQRModalOpen(false)} 
            />

        </div>
    );
};

export default AdminAllVisits;