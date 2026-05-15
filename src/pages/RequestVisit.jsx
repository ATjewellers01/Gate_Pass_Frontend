import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Clock,
  UserCheck,
  SwitchCamera,
  ArrowLeft,
  ChevronRight,
  Send,
  XCircle,
  RefreshCw,
  CheckCircle,
  UserPlus
} from "lucide-react";
import { createVisitRequestApi, fetchVisitorByMobileApi } from "../services/requestApi";
import { fetchPersonsApi } from "../services/personApi";

const AssignTask = () => {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [personToMeetOptions, setPersonToMeetOptions] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [currentFacingMode, setCurrentFacingMode] = useState("environment");
  const [stream, setStream] = useState(null);

  const [formData, setFormData] = useState({
    visitorName: "",
    mobileNumber: "",
    email: "",
    visitorAddress: "",
    purposeOfVisit: "",
    personToMeet: "",
    personToMeetContact: "",
    dateOfVisit: "",
    timeOfEntry: "",
  });

  useEffect(() => {
    openCamera("environment");

    const now = new Date();
    setFormData((prev) => ({
      ...prev,
      dateOfVisit: now.toISOString().split("T")[0],
      timeOfEntry: now.toTimeString().slice(0, 5),
    }));

    fetchPersonToMeetOptions();

    return () => closeCamera();
  }, []);

  const fetchPersonToMeetOptions = async () => {
    setIsLoadingOptions(true);
    try {
      const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
      const response = await fetch(`${SCRIPT_URL}?action=getMasters`);
      const result = await response.json();

      if (result.status === "success" && Array.isArray(result.data)) {
        const mastersData = result.data;
        const options = [];
        // Row 0 is header, so loop from index 1
        for (let i = 1; i < mastersData.length; i++) {
          const personName = mastersData[i][6]; // Column G (Index 6)
          const personPhone = mastersData[i][7] || ""; // Column H (Index 7)
          if (personName && typeof personName === 'string' && personName.trim() !== '') {
            options.push({ 
              person_to_meet: personName.trim(),
              phone: personPhone.toString().trim()
            });
          }
        }

        // Remove duplicates just in case
        const uniqueOptions = options.reduce((acc, curr) => {
          if (!acc.find(item => item.person_to_meet === curr.person_to_meet)) {
            acc.push(curr);
          }
          return acc;
        }, []);

        setPersonToMeetOptions(uniqueOptions);
      } else {
        setPersonToMeetOptions([]);
      }
    } catch (err) {
      setToast({ show: true, message: "Failed to load persons", type: "error" });
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const openCamera = async (facingMode) => {
    try {
      if (stream) stream.getTracks().forEach((t) => t.stop());

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        setStream(newStream);
        setCurrentFacingMode(facingMode);
      }
    } catch (err) {
      showToast("Camera access failed", "error");
    }
  };

  const switchCamera = async () => {
    const next = currentFacingMode === "user" ? "environment" : "user";
    await openCamera(next);
  };

  const closeCamera = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(
      (blob) => {
        const file = new File([blob], `visitor_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setPhotoFile(file);
        setCapturedPhoto(URL.createObjectURL(file));
        showToast("Photo captured!", "success");

        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=19&addressdetails=1`
                );
                const data = await response.json();
                const a = data.address || {};
                const parts = [
                  a.amenity || a.building || a.office || a.shop || a.tourism || a.leisure,
                  a.house_number ? `${a.house_number}, ${a.road}` : a.road,
                  a.neighbourhood || a.suburb || a.quarter || a.hamlet || a.village,
                  a.city_district || a.district,
                  a.city || a.town || a.county,
                  a.state,
                  a.postcode,
                ].filter(Boolean);

                const address = parts.length >= 3 ? parts.join(", ") : (data.display_name || parts.join(", "));
                if (address) {
                  setFormData((prev) => ({ ...prev, visitorAddress: address }));
                }
              } catch (error) {
                console.error("Error fetching location address:", error);
              }
            },
            () => {
              showToast("Location access denied", "error");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setPhotoFile(null);
    openCamera(currentFacingMode);
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "mobileNumber" && value.length === 10) {
      try {
        const res = await fetchVisitorByMobileApi(value);
        if (res.data?.found) {
          setFormData((prev) => ({
            ...prev,
            visitorName: res.data.data.visitorName || "",
            mobileNumber: res.data.data.mobileNumber || value,
            visitorAddress: res.data.data.visitorAddress || "",
            purposeOfVisit: res.data.data.purposeOfVisit || "",
            personToMeet: res.data.data.personToMeet || "",
          }));
          showToast("Visitor details auto-filled", "success");
        }
      } catch (err) {
        // New visitor
      }
    }

    if (name === "personToMeet") {
      const selectedPerson = personToMeetOptions.find(p => p.person_to_meet === value);
      if (selectedPerson) {
        setFormData(prev => ({ ...prev, personToMeetContact: selectedPerson.phone }));
      } else {
        setFormData(prev => ({ ...prev, personToMeetContact: "" }));
      }
    }
  };

  const validateForm = () => {
    const required = ["visitorName", "mobileNumber", "personToMeet", "dateOfVisit", "timeOfEntry"];
    for (let f of required) {
      if (!formData[f]?.trim()) {
        showToast(`Please fill ${f}`, "error");
        return false;
      }
    }
    if (!/^[6-9]\d{9}$/.test(formData.mobileNumber)) {
      showToast("Enter valid 10-digit mobile number", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await createVisitRequestApi({ ...formData, photoFile });
      showToast("Visitor registered successfully!", "success");
      setTimeout(() => navigate("/dashboard/close-gate-pass", { replace: true }), 1000);
    } catch (err) {
      showToast("Submission failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="text-sky-500" />
            Visitor Entry Form
          </h1>
          <p className="text-gray-500 text-sm">Register a new visitor for gate entry</p>
        </div>
        <button
          onClick={() => navigate("/dashboard/quick-task")}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
          <span className="font-semibold text-sm">Back to Dashboard</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-sky-50 shadow-2xl overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-sky-50">
          {/* Form Content */}
          <div className="p-4 sm:p-8 lg:p-12 space-y-8 lg:space-y-10">
            {/* Photo Section - Moved to top for better flow */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
              <div className="flex-1 space-y-4">
                <h2 className="text-sm font-bold text-sky-700 uppercase tracking-widest flex items-center gap-2">
                  <Camera size={16} /> Visitor Photo
                </h2>
                <div className="relative aspect-video rounded-3xl bg-gray-900 overflow-hidden shadow-xl border-4 border-white ring-1 ring-sky-100">
                  {!capturedPhoto ? (
                    <>
                      <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          type="button"
                          onClick={switchCamera}
                          className="bg-black/40 backdrop-blur-md text-white p-3 rounded-2xl hover:bg-black/60 transition-all border border-white/20"
                        >
                          <SwitchCamera size={20} />
                        </button>
                      </div>
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="flex items-center gap-2 px-8 py-3 bg-white text-gray-800 rounded-2xl font-bold shadow-2xl hover:scale-105 transition-all"
                        >
                          <Camera size={20} />
                          Capture Photo
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                        <button
                          type="button"
                          onClick={retakePhoto}
                          className="flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-2xl font-bold shadow-2xl hover:bg-red-600 transition-all"
                        >
                          <RefreshCw size={20} />
                          Retake Photo
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="flex-1 space-y-6">
                <h2 className="text-sm font-bold text-sky-700 uppercase tracking-widest flex items-center gap-2">
                  <User size={16} /> Personal Details
                </h2>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1">Visitor Name*</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                      <input
                        type="text"
                        name="visitorName"
                        value={formData.visitorName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all outline-none text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1">Mobile Number*</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        placeholder="9876543210"
                        maxLength="10"
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all outline-none text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all outline-none text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visit Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
              <div className="space-y-6">
                <h2 className="text-sm font-bold text-sky-700 uppercase tracking-widest flex items-center gap-2">
                  <UserCheck size={16} /> Visit Details
                </h2>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1">Person to Meet*</label>
                    <div className="relative group">
                      <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                      <select
                        name="personToMeet"
                        value={formData.personToMeet}
                        onChange={handleChange}
                        className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all outline-none text-sm font-bold appearance-none cursor-pointer"
                      >
                        <option value="">Select Person</option>
                        {personToMeetOptions.map((person, index) => (
                          <option key={index} value={person.person_to_meet}>{person.person_to_meet}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-sky-600 ml-1">Person to Meet Contact</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" size={18} />
                        <input
                          type="text"
                          name="personToMeetContact"
                          value={formData.personToMeetContact}
                          readOnly
                          placeholder="Contact"
                          className="w-full pl-12 pr-4 py-3.5 bg-sky-50/30 border border-sky-100 rounded-2xl outline-none text-sm font-semibold text-sky-700 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 ml-1">Purpose of Visit</label>
                      <div className="relative group">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                        <input
                          type="text"
                          name="purposeOfVisit"
                          value={formData.purposeOfVisit}
                          onChange={handleChange}
                          placeholder="General Meeting"
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all outline-none text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-sm font-bold text-sky-700 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} /> Timing
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1">Date</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="date"
                        name="dateOfVisit"
                        value={formData.dateOfVisit}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-sky-500 transition-all outline-none text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1">Time In</label>
                    <div className="relative group">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="time"
                        name="timeOfEntry"
                        value={formData.timeOfEntry}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-sky-500 transition-all outline-none text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5 pt-4">
              <label className="text-xs font-bold text-gray-500 ml-1">Visitor Address</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-4 text-gray-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                <textarea
                  name="visitorAddress"
                  value={formData.visitorAddress}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter full address..."
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all outline-none text-sm font-medium resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 sm:p-8 bg-sky-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="text-[10px] sm:text-xs text-gray-500 font-medium">
              Fields marked with * are mandatory
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate("/dashboard/quick-task")}
                className="flex-1 sm:flex-none px-8 py-3.5 bg-white text-gray-600 rounded-2xl font-bold shadow-sm hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 py-3.5 bg-sky-500 text-white rounded-2xl font-bold shadow-xl shadow-sky-200 hover:bg-sky-600 hover:scale-105 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
                {isSubmitting ? "Submitting..." : "Generate Gate Pass"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {toast.show && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl text-white ${toast.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}>
            {toast.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignTask;
