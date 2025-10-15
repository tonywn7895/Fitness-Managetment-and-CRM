import React from 'react';
import { FaRunning, FaDumbbell, FaUserFriends, FaPeopleCarry } from 'react-icons/fa';
import Navbar from "./Navbar";
import { motion } from "framer-motion";

const Home = () => {
  return (
    <div className="bg-black text-white min-h-screen">
      
      <Navbar />

      {/* Hero Section */}
      <section 
          className="relative bg-cover bg-center h-[500px] opacity-80" 
          style={{ backgroundImage: "url('/BG.jpg')" }}
      >
          <div className="absolute bottom-6 left-6">
            <h2 className="text-[#F4FF01] text-4xl font-bold mb-2">" I WANT BEST FITNESS "</h2>
            <p className="text-center text-white text-3xl mb-4">So Let's Try Our Fitness</p>
          </div>
      </section>

      {/* Goals Section */}
      <section className="py-12 text-center">
          <h3 className="text-2xl font-bold mb-4">Let Us Help You Complete Your Goals</h3>
          <p className="max-w-3xl mx-auto text-gray-300 leading-relaxed">
              Factfit เป็นฟิตเนสที่ตอบสนองต่อความต้องการของคุณ มีอุปกรณ์ที่หลากหลาย 
              มีเทรนเนอร์ที่มากประสบการณ์และการฝึกที่สนุกสนาน...
          </p>
      </section>

      {/* Features Section */}
      <section className="py-10 bg-black grid grid-cols-1 md:grid-cols-4 gap-8 px-6 md:px-20">
        <motion.div
            className="flex flex-col items-center text-center bg-black p-6 rounded-lg shadow-lg"
            whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(250, 255, 1, 0.5)" }}
            transition={{ duration: 0.3 }}
        >
          <FaRunning size={50} className="text-yellow-400 mb-4" />
          <p className="font-bold">เหมาะกับทุกไลฟ์สไตล์</p>
        </motion.div>

        <motion.div
            className="flex flex-col items-center text-center bg-black p-6 rounded-lg shadow-lg"
            whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(250, 255, 1, 0.5)" }}
            transition={{ duration: 0.3 }}
        >
          <FaDumbbell size={50} className="text-yellow-400 mb-4" />
          <p className="font-bold">มีอุปกรณ์ที่หลากหลาย</p>
        </motion.div>
          
        <motion.div
            className="flex flex-col items-center text-center bg-black p-6 rounded-lg shadow-lg"
            whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(250, 255, 1, 0.5)" }}
            transition={{ duration: 0.3 }}
        >
          <FaUserFriends size={50} className="text-yellow-400 mb-4" />
          <p className="font-bold">มีเทรนเนอร์ที่มากประสบการณ์</p>
        </motion.div>

        <motion.div
            className="flex flex-col items-center text-center bg-black p-6 rounded-lg shadow-lg"
            whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(250, 255, 1, 0.5)" }}
            transition={{ duration: 0.3 }}
        >
          <FaPeopleCarry size={50} className="text-yellow-400 mb-4" />
          <p className="font-bold">มีกิจกรรมสนุกและหลากหลาย</p>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;