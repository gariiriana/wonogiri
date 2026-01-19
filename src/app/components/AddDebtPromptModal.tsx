import { X, Plus } from "lucide-react";
import { useState } from "react";

interface AddDebtPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  personName: string;
}

export function AddDebtPromptModal({
  isOpen,
  onClose,
  onConfirm,
  personName,
}: AddDebtPromptModalProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Masukkan jumlah yang valid");
      return;
    }
    onConfirm(numAmount);
    setAmount("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setAmount("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Tambah Utang</h3>
            <p className="text-orange-100 text-sm mt-1">{personName}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Jumlah Utang
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-gray-500">
              Rp
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              placeholder="0"
              autoFocus
              className="w-full pl-14 pr-4 py-3 text-xl font-semibold rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium mt-2">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={handleClose}
              className="py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              className="py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Tambah
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
