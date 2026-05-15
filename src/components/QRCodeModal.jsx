import { QRCodeCanvas } from "qrcode.react";
import { X, Download, QrCode } from "lucide-react";
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

    const visitorUrl = `${window.location.origin}/dashboard/assign-task`;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-sky-600" />
                        <h3 className="font-semibold text-gray-800">Visitor QR Code</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center gap-6">
                    <div ref={qrRef} className="p-4 bg-white border-2 border-sky-100 rounded-2xl shadow-inner">
                        <QRCodeCanvas
                            value={visitorUrl}
                            size={200}
                            level="H"
                            includeMargin={true}
                            imageSettings={{
                                src: "/favicon.ico", // Or logo.png if available
                                x: undefined,
                                y: undefined,
                                height: 40,
                                width: 40,
                                excavate: true,
                            }}
                        />
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-800 mb-1">Scan for Gate Pass</p>
                        <p className="text-xs text-gray-500 break-all">{visitorUrl}</p>
                    </div>

                    <button
                        onClick={downloadQRCode}
                        className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Download className="w-5 h-5" />
                        Download QR Code
                    </button>
                </div>

                <div className="bg-gray-50 p-4 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Botivate Technology</p>
                </div>
            </div>
        </div>
    );
};

export default QRCodeModal;
