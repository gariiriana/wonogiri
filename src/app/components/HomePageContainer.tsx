import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { HomePage } from "./HomePage";
import { AddDebtModal } from "./AddDebtModal";
import { ConfirmModal } from "./ConfirmModal";
import { NotificationModal } from "./NotificationModal";

export function HomePageContainer() {
  const { user, logout } = useAuth();
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Listen to all debtors to get total unpaid debt
    const q = query(
      collection(db, "debtors"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalUnpaidDebt = 0;
      let unpaidCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const debt = data.totalDebt || 0;
        
        if (debt > 0) {
          totalUnpaidDebt += debt;
          unpaidCount++;
        }
      });

      setTodayTotal(totalUnpaidDebt);
      setTodayCount(unpaidCount);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="relative">
      <HomePage todayTotal={todayTotal} todayCount={todayCount} />
      
      <AddDebtModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Data will update automatically via onSnapshot
          setShowSuccessNotification(true);
        }}
      />

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar?"
      />

      <NotificationModal
        isOpen={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        title="Berhasil!"
        message="Data berhasil ditambahkan, silakan cek di Daftar Utang"
        type="success"
      />
    </div>
  );
}