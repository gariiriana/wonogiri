import { X, CreditCard, CheckCircle } from "lucide-react";

interface PaymentOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPartialPayment: () => void;
  onFullPayment: () => void;
  personName: string;
  totalDebt: number;
}

export function PaymentOptionModal({
  isOpen,
  onClose,
  onPartialPayment,
  onFullPayment,
  personName,
  totalDebt,
}: PaymentOptionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-2xl font-bold mb-2">Pilih Metode Pembayaran</h3>
          <p className="text-white/90 text-sm">
            {personName} - Total Utang: <span className="font-bold">Rp {totalDebt.toLocaleString("id-ID")}</span>
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Bayar Sebagian */}
          <button
            onClick={onPartialPayment}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-7 h-7" />
              </div>
              <div className="text-left flex-1">
                <p className="text-xl font-bold mb-1">Bayar Sebagian</p>
                <p className="text-sm text-white/80">Cicilan / Pembayaran parsial</p>
              </div>
            </div>
          </button>

          {/* Lunas Semua */}
          <button
            onClick={onFullPayment}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="text-left flex-1">
                <p className="text-xl font-bold mb-1">Lunas Semua</p>
                <p className="text-sm text-white/80">Bayar seluruh utang</p>
              </div>
            </div>
          </button>

          {/* Cancel */}
          <button
            onClick={onClose}
            className="w-full text-gray-600 font-medium py-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
