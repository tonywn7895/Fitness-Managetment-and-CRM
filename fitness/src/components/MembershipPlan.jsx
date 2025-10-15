import React, { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaHotjar,
  FaLock,
  FaDumbbell,
  FaBullseye,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { GiKeyCard } from "react-icons/gi";
import { QRCodeCanvas } from "qrcode.react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MembershipPlan = () => {
  const [hoveredCol, setHoveredCol] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentQrCodeUrl, setPaymentQrCodeUrl] = useState(null);
  const [entryQrCodeUrl, setEntryQrCodeUrl] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [orderId, setOrderId] = useState(null);
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();

  // ✅ ดึงแผนจากฐานข้อมูล
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/plans");
        const data = await res.json();
        if (data.success) setPlans(data.plans);
      } catch (err) {
        console.error("Error fetching plans:", err);
      }
    };
    fetchPlans();
  }, []);

  const featuresList = [
    { icon: <GiKeyCard className="inline text-yellow-400 mr-2 w-7 h-7" />, text: "Keycard Included" },
    { icon: <FaHotjar className="inline text-red-400 mr-2 w-7 h-7" />, text: "Free Sauna Access" },
    { icon: <FaLock className="inline text-gray-400 mr-2 w-7 h-7" />, text: "Personal Locker Available" },
    { icon: <FaDumbbell className="inline text-blue-400 mr-2 w-7 h-7" />, text: "Unlimited Facility Access" },
    { icon: <FaBullseye className="inline text-green-400 mr-2 w-7 h-7" />, text: "Join Fitness Courses for Free" },
  ];

  // ✅ Polling เพื่อตรวจสอบสถานะการชำระเงิน
  const pollPaymentStatus = (orderId) => {
    let pollInterval = setInterval(async () => {
      try {
        const statusRes = await fetch(
          `http://localhost:5001/api/payment/status/${orderId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        const statusData = await statusRes.json();
        if (statusData.success && statusData.status === "PAID") {
          setPaymentResult({ success: true, message: "ชำระเงินสำเร็จ!" });
          toast.success("ชำระเงินสำเร็จ! กรุณาตรวจสอบ QR เข้าใช้งานได้ที่หน้า My Plan");
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  };

  // ✅ เลือกแผน
  const handleChoosePlan = async (planName) => {
    setSelectedPlan(planName);
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    try {
      const response = await fetch("http://localhost:5001/api/auth/check-auth", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        const selectedPlanData = plans.find((plan) => plan.name === planName);
        const price = selectedPlanData ? selectedPlanData.price : "N/A";
        setUserData({ ...data.data, selectedPlan: planName, price });
        setModalOpen(true);
        setShowLoginPrompt(false);
        setError("");
      } else {
        setError(data.message || "Authentication failed, please log in again.");
        setIsLoggedIn(false);
        setShowLoginPrompt(true);
      }
    } catch (err) {
      setError("Server error, please try again later");
      setShowLoginPrompt(true);
    }
  };

  // ✅ สร้าง QR Payment
  const handleConfirmAndPay = async () => {
    setPaymentProcessing(true);
    try {
      const numericPrice = Number(userData.price);
      if (!startDate) {
        setError("Please select a start date before confirming.");
        return;
      }
      const res = await fetch("http://localhost:5001/api/payment/qrcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          amount: numericPrice,
          email: userData.email,
          customerId: userData.id,
          planName: selectedPlan,
          startDate: startDate,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setPaymentResult({ success: false, message: data.message || "Failed to create payment" });
        setPaymentProcessing(false);
        return;
      }
      setPaymentQrCodeUrl(data.qrImageUrl);
      setPaymentResult({
        success: true,
        message: "📲 โปรดสแกน QR เพื่อชำระเงิน หลังชำระ ระบบจะส่ง QR เข้าใช้งานให้ในหน้า My Plan",
      });
      if (data.orderId) setOrderId(data.orderId);
      else setPaymentResult({ success: false, message: "Error: Missing orderId from payment creation" });
    } catch (err) {
      console.error(err);
      setPaymentResult({ success: false, message: "Something went wrong" });
    } finally {
      setPaymentProcessing(false);
    }
  };

  // ✅ เริ่ม Polling หลังมี orderId
  useEffect(() => {
    let cleanup;
    if (orderId) cleanup = pollPaymentStatus(orderId);
    return () => {
      if (cleanup) cleanup();
    };
  }, [orderId]);

  return (
    <div className="bg-black text-white min-h-screen p-6">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
      <Navbar />
      <div className="max-w-6xl mx-auto bg-[#111] rounded-2xl p-8 shadow-lg mt-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Choose the plan that’s right for you</h2>
            <p className="text-gray-400 text-sm">
              <span className="text-yellow-400 text-lg">&#10003;</span> Train anytime. Cancel anytime. <br />
              <span className="text-yellow-400 text-lg">&#10003;</span> No limits. No contracts. Just results.
            </p>
          </div>
        </div>

        {/* ✅ ตารางแสดงแผน */}
        {plans.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No membership plans available at the moment.</p>
        ) : (
          <div>
            <table className="min-w-full text-left">
              <thead>
                <tr>
                  <Link to="/">
                    <img className="h-[90px] w-auto transition-transform duration-200 hover:scale-105"
                      src="/Factfit_Logo.png" alt="Factfit Logo" />
                  </Link>
                  {plans.map((plan, index) => (
                    <th key={index} className={`text-lg font-bold cursor-pointer transition-all duration-300
                      ${hoveredCol === index ? "bg-[#222] scale-105 shadow-lg" : "bg-[#1a1a1a]"}`}
                      onMouseEnter={() => setHoveredCol(index)}
                      onMouseLeave={() => setHoveredCol(null)}>
                      <div className="text-center">
                        <span>{plan.name}</span>
                        <br />
                        <span className="text-yellow-400 font-semibold">฿ {plan.price.toLocaleString()}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featuresList.map((feature, fIndex) => (
                  <tr key={fIndex}>
                    <td className="py-4">{feature.icon} {feature.text}</td>
                    {plans.map((plan, pIndex) => {
                      let featuresArray = [];
                      try {
                        if (typeof plan.features === "string") {
                          const parsed = JSON.parse(plan.features);
                          featuresArray = Array.isArray(parsed)
                            ? parsed
                            : JSON.parse(parsed || "[]");
                        } else {
                          featuresArray = plan.features || [];
                        }
                      } catch (err) {
                        console.warn("⚠️ Error parsing features:", plan.features, err);
                        featuresArray = [];
                      }
                      return (
                        <td key={pIndex} className="py-4 text-center">
                          {featuresArray[fIndex]
                            ? <FaCheckCircle className="text-yellow-500 mx-auto" />
                            : <FaTimesCircle className="text-gray-500 mx-auto" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td></td>
                  {plans.map((plan, index) => (
                    <td key={index} className="py-6 text-center relative"
                      onMouseEnter={() => setHoveredCol(index)}
                      onMouseLeave={() => setHoveredCol(null)}>
                      {hoveredCol === index && (
                        <button
                          onClick={() => handleChoosePlan(plan.name)}
                          className="px-4 py-2 rounded-lg font-semibold 
                          bg-yellow-400 text-black shadow-md hover:bg-yellow-500
                          transition-all duration-300 ease-out animate-fadeSlideUp"
                        >
                          Choose Plan
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipPlan;