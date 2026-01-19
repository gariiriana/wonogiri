import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDocs, getDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { DetailOrang, Transaction } from "./DetailOrang";
import { Person } from "@/types/person";
import { NotificationModal } from "./NotificationModal";
import { useNavigate, useParams } from "react-router-dom";

export function DetailOrangContainer() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [transactions, setTransactions] = useState<Record<string, Transaction[]>>({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  useEffect(() => {
    if (!user || !id) return;

    // Fetch debtor details
    const fetchDebtor = async () => {
      const debtorDoc = await getDoc(doc(db, "debtors", id));
      if (debtorDoc.exists()) {
        const data = debtorDoc.data();
        const createdAt = data.createdAt?.toDate();
        
        setPerson({
          id: debtorDoc.id,
          name: data.name,
          nickname: data.nickname || undefined,
          phoneNumber: data.phoneNumber || undefined,
          photo: data.photoBase64 || undefined, // Use photoBase64
          totalDebt: data.totalDebt || 0,
          lastTransactionDate: createdAt
            ? createdAt.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "N/A",
        });
      }
      setLoading(false);
    };

    fetchDebtor();

    // Listen to transactions for this debtor
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      where("debtorId", "==", id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData: Transaction[] = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const createdAt = data.createdAt?.toDate();
        
        transactionsData.push({
          id: docSnap.id,
          date: createdAt
            ? createdAt.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "N/A",
          amount: data.amount || 0,
          type: data.type as "debt" | "payment",
          note: data.note || undefined, // ✅ Include note field
          createdAtTimestamp: createdAt?.getTime() || 0, // Add timestamp for sorting
        });
      });

      // Sort by date descending on client-side
      transactionsData.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);

      if (id) {
        setTransactions({ [id]: transactionsData });
      }
    });

    return () => unsubscribe();
  }, [user, id]);

  const handleAddDebt = async (personId: string, amount: number) => {
    if (!user || !person) return;

    try {
      // Add transaction
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        debtorId: personId,
        debtorName: person.name,
        amount,
        type: "debt",
        createdAt: serverTimestamp(),
      });

      // Update debtor total
      await updateDoc(doc(db, "debtors", personId), {
        totalDebt: increment(amount),
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setPerson({
        ...person,
        totalDebt: person.totalDebt + amount,
      });

      setNotification({
        isOpen: true,
        title: "Berhasil!",
        message: "Utang berhasil ditambahkan!",
        type: "success",
      });
    } catch (error) {
      console.error("Error adding debt:", error);
      setNotification({
        isOpen: true,
        title: "Gagal!",
        message: "Gagal menambahkan utang. Silakan coba lagi.",
        type: "error",
      });
    }
  };

  const handleMarkPaid = async (personId: string) => {
    if (!user || !person) return;

    try {
      const totalDebt = person.totalDebt;

      // Add payment transaction
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        debtorId: personId,
        debtorName: person.name,
        amount: totalDebt,
        type: "payment",
        createdAt: serverTimestamp(),
      });

      // Update debtor total to 0
      await updateDoc(doc(db, "debtors", personId), {
        totalDebt: 0,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setPerson({
        ...person,
        totalDebt: 0,
      });

      setNotification({
        isOpen: true,
        title: "Berhasil!",
        message: "Utang berhasil dilunasi!",
        type: "success",
      });
    } catch (error) {
      console.error("Error marking paid:", error);
      setNotification({
        isOpen: true,
        title: "Gagal!",
        message: "Gagal melunasi utang. Silakan coba lagi.",
        type: "error",
      });
    }
  };

  const handlePartialPayment = async (personId: string, amount: number) => {
    if (!user || !person) return;

    try {
      // Add payment transaction
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        debtorId: personId,
        debtorName: person.name,
        amount: amount,
        type: "payment",
        createdAt: serverTimestamp(),
      });

      // Update debtor total (reduce by payment amount)
      const newTotal = Math.max(0, person.totalDebt - amount);
      await updateDoc(doc(db, "debtors", personId), {
        totalDebt: newTotal,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setPerson({
        ...person,
        totalDebt: newTotal,
      });

      setNotification({
        isOpen: true,
        title: "Berhasil!",
        message: `Pembayaran Rp ${amount.toLocaleString("id-ID")} berhasil dicatat!`,
        type: "success",
      });
    } catch (error) {
      console.error("Error recording payment:", error);
      setNotification({
        isOpen: true,
        title: "Gagal!",
        message: "Gagal mencatat pembayaran. Silakan coba lagi.",
        type: "error",
      });
    }
  };

  const handleDeletePerson = async (personId: string) => {
    if (!user || !person) return;

    try {
      // Delete all transactions for this debtor
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        where("debtorId", "==", personId)
      );
      
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "transactions", docSnap.id))
      );
      await Promise.all(deletePromises);

      // Delete the debtor
      await deleteDoc(doc(db, "debtors", personId));

      // Show success and navigate back
      setNotification({
        isOpen: true,
        title: "Berhasil!",
        message: "Data pelanggan berhasil dihapus!",
        type: "success",
      });

      // Navigate back to Daftar Utang tab after a short delay
      setTimeout(() => {
        navigate("/?tab=daftar");
      }, 1500);
    } catch (error) {
      console.error("Error deleting person:", error);
      setNotification({
        isOpen: true,
        title: "Gagal!",
        message: "Gagal menghapus data. Silakan coba lagi.",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!person) {
    return null;
  }

  return (
    <>
      <DetailOrang
        people={[person]}
        transactions={transactions}
        onAddDebt={handleAddDebt}
        onMarkPaid={handleMarkPaid}
        onPartialPayment={handlePartialPayment}
        onDeletePerson={handleDeletePerson}
      />
      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ isOpen: false, title: "", message: "", type: "success" })}
      />
    </>
  );
}