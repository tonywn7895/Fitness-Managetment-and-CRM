import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./Profile-Sidebar";

export default function MyPlan() {
  const [planData, setPlanData] = useState(null);
  const [entryQrUrl, setEntryQrUrl] = useState(null); // ✅ เก็บ QR เข้าใช้งาน
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchMyPlan = async () => {
      if (!token) {
        toast.error("No token found, please log in");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:5001/api/membership/myplan", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.success && data.plan) {
          setPlanData(data.plan);

          // ✅ ถ้ามี order_id → ดึง QR เข้าใช้งาน
          if (data.plan.order_id) {
            try {
              const qrRes = await fetch(`http://localhost:5001/api/payment/entry-qr/${data.plan.order_id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const qrData = await qrRes.json();
              if (qrData.success && qrData.qrDataUrl) {
                setEntryQrUrl(qrData.qrDataUrl);
              }
            } catch (qrErr) {
              console.error("Error fetching entry QR:", qrErr);
            }
          }
        } else {
          toast.info("You don't have an active membership plan yet");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load your plan information");
      }
    };

    fetchMyPlan();
  }, [navigate, token]);

  const handleGoToPlans = () => {
    navigate("/MembershipPlan");
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
      <Sidebar />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">My Plan</h1>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl shadow-lg">
          {!planData ? (
            <div className="text-center">
              <p className="text-gray-400 mb-4">You currently don’t have an active plan.</p>
              <button
                onClick={handleGoToPlans}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-3 rounded-lg transition"
              >
                View Available Plans
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-lg">
              <p>
                <span className="font-semibold text-gray-300">Plan Name:</span>{" "}
                <span className="text-yellow-400">{planData.plan_name || "N/A"}</span>
              </p>
              <p>
                <span className="font-semibold text-gray-300">Status:</span>{" "}
                <span
                  className={`font-bold ${
                    planData.status === "Active"
                      ? "text-green-400"
                      : planData.status === "Pending"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {planData.status || "Inactive"}
                </span>
              </p>
              <p>
                <span className="font-semibold text-gray-300">Start Date:</span>{" "}
                {planData.start_date
                  ? new Date(planData.start_date).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                <span className="font-semibold text-gray-300">End Date:</span>{" "}
                {planData.end_date
                  ? new Date(planData.end_date).toLocaleDateString()
                  : "N/A"}
              </p>

              {/* ✅ แสดง QR เข้าใช้งาน */}
              {entryQrUrl && (
                <div className="mt-8 text-center">
                  <p className="text-yellow-400 font-semibold mb-2">
                    QR Code สำหรับเข้าใช้งานฟิตเนส
                  </p>
                  <img
                    src={entryQrUrl}
                    alt="Entry QR"
                    className="mx-auto w-48 h-48 border-4 border-yellow-400 rounded-xl shadow-lg"
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    แสดง QR นี้ที่หน้าเคาน์เตอร์เพื่อเข้าใช้บริการ
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
