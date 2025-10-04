import React, { useState } from "react";
import Navbar from "./Navbar";
import { motion } from "framer-motion";

const teamCards = [
  {
    id: 1,
    title: "Our Mission",
    icon: "💪",
    description: "เรามุ่งมั่นที่จะช่วยให้ทุกคนมีสุขภาพที่ดีขึ้น ผ่านการออกกำลังกายและการโภชนาที่ถูกต้อง",
  },
  {
    id: 2,
    title: "Our Trainers",
    icon: "🏋️",
    description: "ทีมเทรนเนอร์ของเรามีประสบการณ์สูง พร้อมแนะนำทุกระดับตั้งแต่มือใหม่จนถึงนักกีฬา",
  },
  {
    id: 3,
    title: "Our Community",
    icon: "🤝",
    description: "Factfit คือชุมชนที่ทุกคนสามารถแบ่งปันแรงบันดาลใจ และเติบโตไปพร้อมกัน",
  },
];

function FlipCard({ title, icon, description }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      className="relative w-72 h-48 cursor-pointer perspective-1000"
      onClick={() => setFlipped(!flipped)}
    >
      <motion.div
        className="absolute w-full h-full rounded-2xl shadow-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-xl"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ backfaceVisibility: "hidden" }}
      >
        <div className="flex flex-col items-center">
          <span className="text-5xl">{icon}</span>
          <p className="mt-3">{title}</p>
        </div>
      </motion.div>

      <motion.div
        className="absolute w-full h-full rounded-2xl shadow-xl bg-gray-800 text-white p-6 flex items-center justify-center text-center"
        animate={{ rotateY: flipped ? 0 : -180 }}
        transition={{ duration: 0.6 }}
        style={{ backfaceVisibility: "hidden" }}
      >
        <p>{description}</p>
      </motion.div>
    </motion.div>
  );
}

function AboutUs() {
  return (
    <div className="bg-black text-white">
      <Navbar />

      {/* Hero Section */}
      <div
        className="relative h-[60vh] flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('https://www.pexels.com/download/video/1543760/')" }}
      >
        <h1 className="text-4xl md:text-6xl font-bold text-yellow-400">
          About Us
        </h1>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto py-16 px-6 md:flex items-center gap-12">
        <div className="md:w-1/2">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">Who We Are</h2>
          <p className="text-gray-300 leading-relaxed">
            FactFit ก่อตั้งขึ้นเพื่อมอบประสบการณ์ฟิตเนสที่ครบวงจร
            ทั้งด้านการออกกำลังกาย โภชนาการ และการดูแลสุขภาพ
            เรามีทีมเทรนเนอร์ที่มากด้วยประสบการณ์และอุปกรณ์ที่ทันสมัย
            เพื่อช่วยให้คุณบรรลุเป้าหมายได้อย่างมั่นใจ
          </p>
        </div>
        <div className="md:w-1/2 mt-8 md:mt-0">
          <img
            src="https://www.pexels.com/download/video/3195530/"
            alt="About Gym"
            className="rounded-2xl shadow-lg"
          />
        </div>
      </div>

      {/* Flip Cards Section */}
      <div className="max-w-6xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-bold text-yellow-400 mb-8 text-center">
          Why Choose FactFit?
        </h2>
        <div className="grid md:grid-cols-3 gap-10 justify-items-center">
          {teamCards.map((card) => (
            <FlipCard key={card.id} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AboutUs;