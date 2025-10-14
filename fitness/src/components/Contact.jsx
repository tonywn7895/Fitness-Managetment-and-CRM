import React from "react";
import Navbar from "./Navbar";

const Contact = () => {
  return (
    <div className="bg-black text-white">
        <Navbar />

      {/* Hero Section */}
      <div className="relative h-[50vh] flex items-center justify-center bg-cover bg-center" 
        style={{ backgroundImage: "url('/images/contact-hero.jpg')" }}>
        <h1 className="text-4xl md:text-6xl font-bold text-yellow-400">
          Contact Us
        </h1>
      </div>

      {/* Contact Info + Form */}
      <div className="max-w-6xl mx-auto py-16 px-6 grid md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div>
          <h2 className="text-3xl font-bold text-yellow-400 mb-6">Get in Touch</h2>
          <p className="text-gray-300 mb-4">📍 123 Fitness Street, Bangkok, Thailand</p>
          <p className="text-gray-300 mb-4">📞 +66 1234 5678</p>
          <p className="text-gray-300 mb-4">📧 info@factfit.com</p>
          <div className="flex gap-4 mt-6">
            <a href="#" className="text-yellow-400 hover:text-yellow-300">Facebook</a>
            <a href="#" className="text-yellow-400 hover:text-yellow-300">Instagram</a>
            <a href="#" className="text-yellow-400 hover:text-yellow-300">Line</a>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-6">
          <input type="text" placeholder="Your Name" className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none"/>
          <input type="email" placeholder="Your Email" className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none"/>
          <input type="text" placeholder="Subject" className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none"/>
          <textarea placeholder="Message" rows="5" className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none"></textarea>
          <button className="bg-yellow-400 text-black font-bold py-3 px-6 rounded-lg hover:bg-yellow-500">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
