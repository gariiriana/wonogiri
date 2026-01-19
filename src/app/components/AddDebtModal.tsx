import { useState, useRef } from "react";
import { X, Camera, Upload, Save, User as UserIcon, SwitchCamera } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddDebtModal({ isOpen, onClose, onSuccess }: AddDebtModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useCamera, setUseCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Resize and compress image
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize to max 400px width while maintaining aspect ratio
          const maxWidth = 400;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            
            // Start with quality 0.25 and reduce if needed
            let quality = 0.25;
            let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            
            // If still too large, reduce quality further
            while (compressedBase64.length > 900000 && quality > 0.1) {
              quality -= 0.05;
              compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            }
            
            // Final check - must be under 900KB to be safe
            if (compressedBase64.length > 900000) {
              reject(new Error('Foto terlalu besar setelah kompresi. Gunakan foto dengan resolusi lebih kecil.'));
            } else {
              resolve(compressedBase64);
            }
          } else {
            reject(new Error('Cannot get canvas context'));
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertToBase64(file);
        setPhotoBase64(base64);
        setPhotoPreview(base64);
        setError("");
      } catch (err) {
        console.error("Error converting to base64:", err);
        setError("Gagal memproses foto");
      }
    }
  };

  const startCamera = async () => {
    try {
      setError(""); // Clear previous errors
      setCameraReady(false); // Reset camera ready state
      
      console.log("🎥 Starting camera...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log("✅ Stream obtained:", stream);
      streamRef.current = stream;
      
      // IMPORTANT: Set useCamera first to render video element
      setUseCamera(true);
      
      // Wait for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!videoRef.current) {
        throw new Error("Video element not found after render");
      }
      
      console.log("📹 Video element found, setting srcObject...");
      videoRef.current.srcObject = stream;
      
      // Wait for metadata to load
      await new Promise<void>((resolve, reject) => {
        const video = videoRef.current;
        if (!video) {
          reject(new Error("Video element lost"));
          return;
        }
        
        const onLoadedMetadata = () => {
          console.log("✅ Metadata loaded:", video.videoWidth, "x", video.videoHeight);
          resolve();
        };
        
        const onError = (e: Event) => {
          console.error("❌ Video error:", e);
          reject(new Error("Video failed to load"));
        };
        
        video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
        video.addEventListener("error", onError, { once: true });
        
        // Fallback timeout
        setTimeout(() => {
          console.log("⏰ Fallback timeout - forcing resolution");
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
          video.removeEventListener("error", onError);
          resolve();
        }, 3000);
      });
      
      // Now play the video explicitly
      const video = videoRef.current;
      if (!video) {
        throw new Error("Video element lost before play");
      }
      
      console.log("▶️ Playing video...");
      try {
        await video.play();
        console.log("✅ Video playing!");
      } catch (playError) {
        console.error("❌ Play error:", playError);
        // Try one more time after a delay
        await new Promise(resolve => setTimeout(resolve, 500));
        await video.play();
      }
      
      // Final dimension check
      const width = video.videoWidth;
      const height = video.videoHeight;
      console.log("📐 Final video dimensions:", width, "x", height);
      
      if (width > 0 && height > 0) {
        console.log("✅ Camera ready!");
        setCameraReady(true);
      } else {
        console.warn("⚠️ Video dimensions are 0, but continuing anyway");
        // Still set ready after a delay
        setTimeout(() => {
          setCameraReady(true);
        }, 1000);
      }
    } catch (err: any) {
      console.error("❌ Camera error:", err);
      
      // Specific error messages based on error type
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("⛔ Izin kamera ditolak. Cara fix: Klik ikon 🔒 di address bar → Izinkan kamera → Refresh halaman. Atau gunakan tombol 'Upload Foto' di bawah sebagai gantinya.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera atau gunakan tombol 'Upload Foto'.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setError("Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut dan coba lagi, atau gunakan tombol 'Upload Foto'.");
      } else {
        setError("Tidak dapat mengakses kamera. Silakan gunakan tombol 'Upload Foto' sebagai gantinya.");
      }
      
      // Clean up on error
      setUseCamera(false);
      setCameraReady(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      // Check if video is ready and has valid dimensions
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      if (videoWidth === 0 || videoHeight === 0) {
        setError("Kamera belum siap. Tunggu sebentar dan coba lagi.");
        return;
      }
      
      const canvas = document.createElement("canvas");
      
      // Resize to max 400px width (same as upload) while maintaining aspect ratio
      let width = videoWidth;
      let height = videoHeight;
      const maxWidth = 400;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        
        // Start with quality 0.25 and reduce if needed (same as upload)
        let quality = 0.25;
        let base64 = canvas.toDataURL("image/jpeg", quality);
        
        // If still too large, reduce quality further
        while (base64.length > 900000 && quality > 0.1) {
          quality -= 0.05;
          base64 = canvas.toDataURL("image/jpeg", quality);
        }
        
        // Validate size before setting - must be under 900KB to be safe
        if (base64.length > 900000) {
          setError("Foto terlalu besar. Silakan coba lagi atau gunakan pencahayaan yang lebih sederhana.");
          stopCamera();
        } else {
          setPhotoBase64(base64);
          setPhotoPreview(base64);
          setError(""); // Clear any errors
          stopCamera();
        }
      } else {
        setError("Gagal memproses foto. Silakan coba lagi.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setUseCamera(false);
    setCameraReady(false);
  };

  const switchCamera = async () => {
    // Stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Toggle facing mode
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    
    // Small delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Restart camera with new facing mode
    await startCamera();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nama penghutang harus diisi");
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Jumlah utang tidak valid");
      return;
    }

    if (!photoBase64) {
      setError("Foto penghutang wajib diupload");
      return;
    }

    if (!user) {
      setError("User tidak terautentikasi");
      return;
    }

    setLoading(true);

    try {
      // Add debtor to Firestore (with base64 photo)
      const debtorDoc = await addDoc(collection(db, "debtors"), {
        userId: user.uid,
        name: name.trim(),
        nickname: nickname.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
        photoBase64: photoBase64, // Store base64 directly
        totalDebt: Number(amount),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add initial transaction
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        debtorId: debtorDoc.id,
        debtorName: name.trim(),
        amount: Number(amount),
        type: "debt",
        note: note.trim() || null,
        createdAt: serverTimestamp(),
      });

      // Reset form
      setName("");
      setNickname("");
      setPhoneNumber("");
      setAmount("");
      setNote("");
      setPhotoBase64(null);
      setPhotoPreview(null);
      setLoading(false);
      
      // Trigger callback to refresh data
      onSuccess();
      
      // Close modal
      onClose();
    } catch (err) {
      console.error("Error adding debt:", err);
      setError("Gagal menambahkan utang. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setName("");
    setNickname("");
    setPhoneNumber("");
    setAmount("");
    setNote("");
    setPhotoBase64(null);
    setPhotoPreview(null);
    setError("");
    onClose();
  };

  return (
    <>
      {/* Modal Tambah Pelanggan - Hanya render kalau isOpen */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Tambah Utang Baru</h2>
                <p className="text-orange-100 text-sm mt-1">Catat transaksi utang pelanggan</p>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Photo Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Foto Penghutang *
                </label>
                
                {!photoPreview && !useCamera && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all flex flex-col items-center gap-2"
                    >
                      <Camera className="w-8 h-8 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Ambil Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all flex flex-col items-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Upload Foto</span>
                    </button>
                  </div>
                )}

                {useCamera && (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 object-cover"
                      />
                      
                      {/* Switch Camera Button - floating on top right */}
                      {cameraReady && (
                        <button
                          type="button"
                          onClick={switchCamera}
                          className="absolute top-3 right-3 w-12 h-12 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
                          title={facingMode === "user" ? "Ganti ke Kamera Belakang" : "Ganti ke Kamera Depan"}
                        >
                          <SwitchCamera className="w-6 h-6" />
                        </button>
                      )}
                      
                      {!cameraReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="text-center">
                            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-white font-semibold text-sm">Memuat kamera...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        disabled={!cameraReady}
                        className="py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Ambil Foto
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                    {cameraReady && (
                      <p className="text-xs text-green-600 font-medium text-center">
                        ✓ Kamera {facingMode === "user" ? "depan" : "belakang"} siap. Klik \"Ambil Foto\" untuk capture!
                      </p>
                    )}
                  </div>
                )}

                {photoPreview && (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                      <img src={photoPreview} alt="Preview" className="w-full h-64 object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoBase64(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-sm text-green-600 font-medium">✓ Foto berhasil dipilih</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">Foto wajib sebagai bukti identitas penghutang</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Ibu Siti Rahayu"
                    className="w-full pl-12 pr-4 py-3 text-base rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Nama Panggilan (Opsional)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Contoh: Bu Siti"
                  className="w-full p-3 text-base rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Nomor Telepon (Opsional)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full p-3 text-base rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Jumlah Utang *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-gray-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-14 pr-4 py-3 text-xl font-semibold rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Keterangan (Opsional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: Beli sembako untuk acara keluarga"
                  rows={3}
                  className="w-full p-3 text-base rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none resize-none transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl py-3 px-6 shadow-lg hover:shadow-xl transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}