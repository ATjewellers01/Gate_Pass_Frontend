import { QRCodeCanvas } from "qrcode.react";
import { X, Download, QrCode, ExternalLink } from "lucide-react";
import { useRef } from "react";

const QRCodeModal = ({ isOpen, onClose }) => {
    const qrRef = useRef();

    if (!isOpen) return null;

    const downloadQRCode = () => {
        const canvas = qrRef.current.querySelector("canvas");
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = "visitor-gate-pass-qr.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const visitorUrl = `${window.location.origin}/public/request-gate-pass`;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[100] p-4"
            style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.4)] relative"
                style={{
                    background: "rgba(255,255,255,0.97)",
                    border: "1px solid rgba(254,215,170,0.6)",
                }}
            >
                {/* Top gradient bar */}
                <div
                    className="h-1 w-full"
                    style={{ background: "linear-gradient(90deg, #fb923c, #f97316, #ea580c)" }}
                />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
                        >
                            <QrCode size={15} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm leading-tight">Visitor QR Code</h3>
                            <p className="text-[10px] text-gray-400 font-medium">Scan to request gate pass</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-orange-50 transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* QR Code */}
                <div className="px-6 py-2 flex flex-col items-center gap-5">
                    <div
                        ref={qrRef}
                        className="p-4 rounded-2xl"
                        style={{
                            background: "#fff",
                            border: "2px solid #ffedd5",
                            boxShadow: "0 8px 30px rgba(249,115,22,0.12)",
                        }}
                    >
                        <QRCodeCanvas
                            value={visitorUrl}
                            size={200}
                            level="H"
                            includeMargin={true}
                            fgColor="#0f172a"
                            imageSettings={{
                                src: "/favicon.ico",
                                x: undefined,
                                y: undefined,
                                height: 40,
                                width: 40,
                                excavate: true,
                            }}
                        />
                    </div>

                    {/* URL */}
                    <div
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}
                    >
                        <ExternalLink size={12} className="text-orange-500 shrink-0" />
                        <span className="text-[10px] text-orange-700 font-semibold break-all leading-relaxed">
                            {visitorUrl}
                        </span>
                    </div>

                    {/* Download button */}
                    <button
                        onClick={downloadQRCode}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{
                            background: "linear-gradient(135deg, #f97316, #ea580c)",
                            boxShadow: "0 8px 24px rgba(249,115,22,0.35)",
                        }}
                    >
                        <Download size={16} />
                        Download QR Code
                    </button>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 mt-1 text-center">
                    <p className="text-[10px] text-gray-400 font-medium">
                        Powered by{" "}
                        <a
                            href="https://www.botivate.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold"
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
        </div>
    );
};

export default QRCodeModal;
