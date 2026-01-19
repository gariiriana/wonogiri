import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
}

export function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
}: NotificationModalProps) {
  if (!isOpen) return null;

  const iconMap = {
    success: <CheckCircle className="w-16 h-16 text-green-500" />,
    error: <XCircle className="w-16 h-16 text-red-500" />,
    warning: <AlertCircle className="w-16 h-16 text-orange-500" />,
    info: <Info className="w-16 h-16 text-blue-500" />,
  };

  const buttonMap = {
    success: "bg-green-600 hover:bg-green-700",
    error: "bg-red-600 hover:bg-red-700",
    warning: "bg-orange-600 hover:bg-orange-700",
    info: "bg-blue-600 hover:bg-blue-700",
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">{iconMap[type]}</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{message}</p>
          </div>

          <button
            onClick={onClose}
            className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-colors ${buttonMap[type]}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
