import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaHotjar, FaLock, FaDumbbell, FaBullseye } from "react-icons/fa";
import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { GiKeyCard } from "react-icons/gi";
import { QRCodeCanvas } from "qrcode.react";

const MembershipPlan = () => {
  const [hoveredCol, setHoveredCol] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentQrCodeUrl, setPaymentQrCodeUrl] = useState(null);
  const [entryQrCodeUrl, setEntryQrCodeUrl] = useState(null);

  const navigate = useNavigate();

  const plans = [
    { name: "1 Day", price: "฿ 150", features: [false, false, false, true, false] },
    { name: "1 Month", price: "฿ 1,500", features: [true, true, false, true, false] },
    { name: "6 Month", price: "฿ 8,000", features: [true, true, true, true, false] },
    { name: "12 Month", price: "฿ 15,000", features: [true, true, true, true, true] },
  ];

  const featuresList = [
    { icon: <GiKeyCard className="inline text-yellow-400 mr-2 w-7 h-7" />, text: "Keycard Included" },
    { icon: <FaHotjar className="inline text-red-400 mr-2 w-7 h-7" />, text: "Free Sauna Access" },
    { icon: <FaLock className="inline text-gray-400 mr-2 w-7 h-7" />, text: "Personal Locker Available" },
    { icon: <FaDumbbell className="inline text-blue-400 mr-2 w-7 h-7" />, text: "Unlimited Facility Access" },
    { icon: <FaBullseye className="inline text-green-400 mr-2 w-7 h-7" />, text: "Join Fitness Courses for Free" },
  ];

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
        const selectedPlanData = plans.find(plan => plan.name === planName);
        const price = selectedPlanData ? selectedPlanData.price : 'N/A';
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

  const handleConfirmAndPay = async () => {
    setPaymentProcessing(true);
    try {
      // สร้าง mock payment URL สำหรับ QR code
      const mockPaymentUrl = `https://mock-payment.com/pay?plan=${selectedPlan}&price=${userData.price.replace('฿ ', '')}&userId=${userData.id}`;

      // Gen QR code สำหรับ payment (ใช้ QRCodeCanvas)
      setPaymentQrCodeUrl(mockPaymentUrl);

      // จำลองการชำระเงินสำเร็จหลัง 2 วินาที
      await new Promise(resolve => setTimeout(resolve, 2000));

      // สร้าง QR code สำหรับเข้าฟิตเนส
      const entryQrData = `factfit-entry:userId=${userData.id}&plan=${selectedPlan}&date=${new Date().toISOString()}`;
      setEntryQrCodeUrl(entryQrData);

      // ส่งอีเมลจาก backend (เรียก API)
      const emailResponse = await fetch('http://localhost:5001/api/auth/send-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userData.email,
          subject: 'Your FactFit Payment Confirmation',
          html: `<p>Dear ${userData.username},</p><p>Your payment for ${selectedPlan} (${userData.price}) is successful.</p><p>Scan the QR code below to enter the gym:</p><img src="${entryQrData}" alt="Entry QR Code" /><p>Check your documents and enjoy!</p>`,
        }),
      });
      const emailData = await emailResponse.json();
      if (emailData.success) {
        setPaymentResult({ success: true, message: 'Payment successful! QR sent to email.' });
      } else {
        setPaymentResult({ success: false, message: 'Email sending failed.' });
      }
    } catch (err) {
      setPaymentResult({ success: false, message: 'Payment error' });
      console.error('Payment error:', err);
    } finally {
      setPaymentProcessing(false);
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      console.log('isLoggedIn updated:', !!token);
    };
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="bg-black text-white min-h-screen p-6">
      <Navbar />
      <div className="max-w-6xl mx-auto bg-[#111] rounded-2xl p-8 shadow-lg mt-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Choose the plan that’s right for you</h2>
            <p className="text-gray-400 text-sm">
              <span className="text-yellow-400 text-lg">&#10003;</span> Train anytime. Cancel anytime. Total freedom to get fit.
              <br />
              <span className="text-yellow-400 text-lg">&#10003;</span> No limits. No contracts. Just results.
            </p>
          </div>
          <button className="mt-4 md:mt-0 flex items-center bg-yellow-400 text-black font-bold py-2 px-4 rounded-full hover:bg-yellow-300 transition">
            <span className="mr-2">💪</span> Start your free trial
          </button>
        </div>

        {/* Pricing Table */}
        <div>
          <table className="min-w-full text-left">
            <thead>
              <tr>
                <Link to="/">
                  <img
                    className="h-[90px] w-auto transition-transform duration-200 hover:scale-105"
                    src="/Factfit_Logo.png"
                    alt="Factfit Logo"
                  />
                </Link>

                {plans.map((plan, index) => (
                  <th
                    key={index}
                    className={`text-lg font-bold cursor-pointer transition-all duration-300
                      ${hoveredCol === index ? "bg-[#222] scale-105 shadow-lg" : "bg-[#1a1a1a]"}`}
                    onMouseEnter={() => setHoveredCol(index)}
                    onMouseLeave={() => setHoveredCol(null)}
                  >
                    <div className="text-center">
                      <span>{plan.name}</span>
                      <br />
                      <span className="text-yellow-400 font-semibold">{plan.price}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {featuresList.map((feature, fIndex) => (
                <tr key={fIndex}>
                  <td className="py-4">
                    {feature.icon} {feature.text}
                  </td>

                  {plans.map((plan, pIndex) => (
                    <td
                      key={pIndex}
                      className={`py-4 text-center transition-all duration-300
                        ${hoveredCol === pIndex ? "bg-[#222]" : ""}`}
                      onMouseEnter={() => setHoveredCol(pIndex)}
                      onMouseLeave={() => setHoveredCol(null)}
                    >
                      {plan.features[fIndex] ? (
                        <FaCheckCircle
                          className={`text-xl ${hoveredCol === pIndex ? "text-yellow-400" : "text-yellow-500"} mx-auto`}
                        />
                      ) : (
                        <FaTimesCircle
                          className={`text-xl ${hoveredCol === pIndex ? "text-gray-400" : "text-gray-500"} mx-auto`}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Choose Plan Button */}
              <tr>
                <td></td>
                {plans.map((plan, index) => (
                  <td
                    key={index}
                    className="py-6 text-center relative"
                    onMouseEnter={() => setHoveredCol(index)}
                    onMouseLeave={() => setHoveredCol(null)}
                  >
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
      </div>

      {/* Modal for User Details */}
      {modalOpen && userData && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300">
          <div className="bg-[#1a1a1a] text-white p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 animate-fadeSlideUp">
            <h3 className="text-2xl font-bold mb-6 text-yellow-400">Customer Details</h3>
            <div className="space-y-3">
              <p className="text-lg"><span className="font-semibold">Username:</span> {userData.username || 'N/A'}</p>
              <p className="text-lg"><span className="font-semibold">Email:</span> {userData.email || 'N/A'}</p>
              <p className="text-lg"><span className="font-semibold">Selected Plan:</span> {userData.selectedPlan}</p>
              <p className="text-lg"><span className="font-semibold">Price:</span> {userData.price || 'Not available'}</p>
            </div>

            {paymentQrCodeUrl && (
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <QRCodeCanvas value={paymentQrCodeUrl} size={200} />
                <p>Scan this QR to pay</p>
              </div>
            )}

            {entryQrCodeUrl && (
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <QRCodeCanvas value={entryQrCodeUrl} size={200} />
                <p>Scan this QR to enter the gym</p>
              </div>
            )}

            {paymentResult && (
              <p className={`text-center mt-4 ${paymentResult.success ? 'text-green-400' : 'text-red-400'}`}>{paymentResult.message}</p>
            )}

            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setPaymentResult(null);
                  setPaymentQrCodeUrl(null);
                  setEntryQrCodeUrl(null);
                }}
                className="px-4 py-2 bg-gray-100 text-black font-semibold rounded-lg hover:bg-yellow-400 transition duration-200"
              >
                Close
              </button>
              <button
                onClick={handleConfirmAndPay}
                disabled={paymentProcessing}
                className={`ml-2 px-4 py-2 rounded-lg font-semibold transition duration-200 ${paymentProcessing ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-400 text-black hover:bg-yellow-500'}`}
              >
                {paymentProcessing ? 'Processing...' : 'Confirm and Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Login Prompt */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300">
          <div className="bg-[#1a1a1a] text-white p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 animate-fadeSlideUp">
            <h3 className="text-2xl font-bold mb-6 text-yellow-400">Please Log In</h3>
            <p className="text-lg mb-4">You need to log in to select a plan. Don’t have an account? Login now!</p>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition duration-200"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MembershipPlan;