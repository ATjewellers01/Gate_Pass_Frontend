import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const isPublic = location.pathname === "/public/request-gate-pass";

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
      const res = await fetchPersonsApi();
      const persons = res.data || [];
      setPersonToMeetOptions(persons);
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
      // Reset form and stay on the same page
      const now = new Date();
      setFormData({
        visitorName: "",
        mobileNumber: "",
        email: "",
        visitorAddress: "",
        purposeOfVisit: "",
        personToMeet: "",
        personToMeetContact: "",
        dateOfVisit: now.toISOString().split("T")[0],
        timeOfEntry: now.toTimeString().slice(0, 5),
      });
      setCapturedPhoto(null);
      setPhotoFile(null);
      openCamera(currentFacingMode);
      
      if (isPublic) {
        showToast("Gate pass requested! You can close this window.", "success");
      }
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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserPlus className="text-orange-500" size={28} />
            Visitor Entry
          </h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">Register a new visitor for gate entry</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Top Section: Photo & Basic Info */}
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Photo Capture */}
              <div className="w-full lg:w-1/4 xl:w-1/5 space-y-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Camera size={14} /> Visitor Photo
                </h2>
                <div className="relative aspect-video sm:aspect-[4/3] lg:aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 group">
                  {!capturedPhoto ? (
                    <>
                      <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute top-3 right-3">
                        <button
                          type="button"
                          onClick={switchCamera}
                          className="bg-white/80 backdrop-blur-sm text-gray-700 p-2 rounded-full hover:bg-white transition-colors shadow-sm"
                        >
                          <SwitchCamera size={18} />
                        </button>
                      </div>
                      <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-full font-medium shadow-lg hover:bg-orange-600 transition-colors text-sm"
                        >
                          <Camera size={16} />
                          Capture
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={retakePhoto}
                          className="flex items-center gap-2 px-6 py-2.5 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full font-medium shadow-lg hover:bg-white transition-colors text-sm"
                        >
                          <RefreshCw size={16} />
                          Retake
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Personal Details */}
              <div className="w-full lg:w-3/4 xl:w-4/5 space-y-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <User size={14} /> Personal Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-600">Visitor Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        name="visitorName"
                        value={formData.visitorName}
                        onChange={handleChange}
                        placeholder="e.g. John Doe"
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        placeholder="10-digit number"
                        maxLength="10"
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Optional"
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Visit Details Section */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} /> Visit Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Person to Meet *</label>
                    <div className="relative">
                      <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <select
                        name="personToMeet"
                        value={formData.personToMeet}
                        onChange={handleChange}
                        className="w-full pl-10 pr-10 py-2.5 bg-transparent border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none text-sm appearance-none cursor-pointer"
                      >
                        <option value="">Select Person</option>
                        {personToMeetOptions.map((person, index) => (
                          <option key={index} value={person.person_to_meet}>{person.person_to_meet}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Their Contact</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        name="personToMeetContact"
                        value={formData.personToMeetContact}
                        readOnly
                        placeholder="Auto-filled"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Purpose of Visit</label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        name="purposeOfVisit"
                        value={formData.purposeOfVisit}
                        onChange={handleChange}
                        placeholder="e.g. Meeting, Delivery"
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Date *</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="date"
                          name="dateOfVisit"
                          value={formData.dateOfVisit}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Time *</label>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="time"
                          name="timeOfEntry"
                          value={formData.timeOfEntry}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Visitor Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 text-gray-400" size={16} />
                      <textarea
                        name="visitorAddress"
                        value={formData.visitorAddress}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Enter full address or use location..."
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 sm:p-5 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-end">
            <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-orange-600 text-white rounded-xl font-medium shadow-sm hover:bg-orange-700 transition-colors disabled:opacity-70 text-sm"
              >
                {isSubmitting ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
                {isSubmitting ? "Submitting..." : "Generate Pass"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 sm:bottom-auto sm:top-6 z-50 animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}>
            {toast.type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignTask;
