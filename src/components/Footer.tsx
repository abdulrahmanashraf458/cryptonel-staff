import React from 'react';
import { ChevronRight, Zap, Shield, Mail } from 'lucide-react';

// Advanced animated footer component
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  // Color palette matching the website
  const colors = {
    background: "#050b15",
    cardBg: "#111827",
    accent: "#A7A8CD", // Light blue/lavender
    text: "#FFFFFF",
    textMuted: "#F3F3FF",
    darkAccent: "#454555" // Darker navy/purple
  };

  const contactMethods = [
    {
      icon:
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      ,
      title: "Join our community",
      desc: "Be part of our growing community and connect with like-minded individuals.",
      link: {
        name: "Join our Discord",
        href: "https://discord.gg/3cVdBNQmGh"
      },
    },
    {
      icon:
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.5 0H11.75L7.875 4.5L12.5 12H8.25L5.375 7.5L2 12H0L5.25 5.25L0 0H4.375L6.75 3.875L8.5 0ZM9 10.125H10L3.875 1.75H2.75L9 10.125Z" fill="currentColor"/>
        </svg>
      ,
      title: "Follow us on X",
      desc: "Stay updated with our latest announcements and connect with us on X.",
      link: {
        name: "Send us DMs",
        href: "https://x.com/ClyneBot"
      },
    },
  ];

  return (
    <footer className="relative mt-10 overflow-hidden border-t border-[#A7A8CD]/10 bg-gradient-to-b from-[#050b15] to-[#020306]">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Animated glow effects */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#A7A8CD] rounded-full blur-[150px] opacity-10 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#454555] rounded-full blur-[150px] opacity-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(167, 168, 205, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(167, 168, 205, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }}
        ></div>
        
        {/* Animated rings */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0 border border-[#A7A8CD] rounded-full animate-pulse-slow"></div>
          <div className="absolute inset-[100px] border border-[#A7A8CD] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-[200px] border border-[#A7A8CD] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          <div className="absolute inset-[300px] border border-[#A7A8CD] rounded-full animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="container relative z-10 max-w-6xl mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Logo and about section (spans 2 columns on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#454555] to-[#A7A8CD]">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <h2 className="text-white text-xl font-semibold">Clyne Operations</h2>
            </div>
            
            <p className="text-[#F3F3FF]/70 max-w-md">
              Advanced platform designed for excellent management with high standards of security and efficiency. Our cutting-edge solutions provide seamless experience for teams of all sizes.
            </p>
            
            {/* Social media links with hover effects */}
            <div className="flex space-x-3 pt-4">
              {/* Discord */}
              <a 
                href="https://discord.gg/3cVdBNQmGh" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#111827] border border-[#A7A8CD]/20 flex items-center justify-center
                           transition-all duration-300 hover:scale-110 hover:border-[#A7A8CD]/50 hover:shadow-[0_0_15px_rgba(167,168,205,0.3)]"
              >
                <svg 
                  className="w-5 h-5 text-[#A7A8CD]" 
                  fill="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
              
              {/* Twitter/X */}
              <a 
                href="https://x.com/ClyneBot" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#111827] border border-[#A7A8CD]/20 flex items-center justify-center
                           transition-all duration-300 hover:scale-110 hover:border-[#A7A8CD]/50 hover:shadow-[0_0_15px_rgba(167,168,205,0.3)]"
              >
                <svg 
                  className="w-4 h-4 text-[#A7A8CD]" 
                  fill="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M16.99 0H20.298L13.071 8.26L21.573 19.5H14.916L9.702 12.683L3.736 19.5H0.426L8.156 10.665L0 0H6.826L11.539 6.231L16.99 0ZM15.829 17.52H17.662L5.83 1.876H3.863L15.829 17.52Z" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Quick links section with animated arrows */}
          <div className="lg:col-span-1">
            <h3 className="text-[#A7A8CD] font-semibold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <a href="#" className="text-[#F3F3FF]/70 hover:text-white transition-colors duration-300 flex items-center group">
                  <ChevronRight className="w-4 h-4 mr-2 text-[#A7A8CD] transform group-hover:translate-x-1 transition-transform duration-300" />
                  <span>Home</span>
                </a>
              </li>
              <li>
                <a href="#about" className="text-[#F3F3FF]/70 hover:text-white transition-colors duration-300 flex items-center group">
                  <ChevronRight className="w-4 h-4 mr-2 text-[#A7A8CD] transform group-hover:translate-x-1 transition-transform duration-300" />
                  <span>About</span>
                </a>
              </li>
              <li>
                <a href="#features" className="text-[#F3F3FF]/70 hover:text-white transition-colors duration-300 flex items-center group">
                  <ChevronRight className="w-4 h-4 mr-2 text-[#A7A8CD] transform group-hover:translate-x-1 transition-transform duration-300" />
                  <span>Features</span>
                </a>
              </li>
            </ul>
          </div>
          
          {/* Newsletter section with animated subscription box */}
          <div className="lg:col-span-2">
            <h3 className="text-[#A7A8CD] font-semibold text-lg mb-6">Subscribe</h3>
            <p className="text-[#F3F3FF]/70 text-sm mb-5">
              Stay updated with our latest features and releases
            </p>
            
            {/* Animated subscription form */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#A7A8CD] to-[#454555] rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <div className="relative flex">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-[#111827] border border-[#A7A8CD]/20 rounded-l-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#A7A8CD]/50 transition-all duration-300"
                />
                <button className="relative overflow-hidden px-4 py-3 rounded-r-lg bg-gradient-to-r from-[#454555] to-[#A7A8CD] text-white text-sm font-medium transition-all duration-300 hover:opacity-90">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Info text */}
            <p className="text-[#F3F3FF]/50 text-xs mt-3">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
        
        {/* Contact section */}
        <section className="py-14 mt-8">
          <div className="max-w-screen-xl mx-auto px-4 text-[#F3F3FF] gap-12 md:px-8 lg:flex">
            <div className="max-w-md">
              <h3 className="text-[#A7A8CD] text-3xl font-semibold sm:text-4xl">
                Let's connect
              </h3>
              <p className="mt-3 text-[#F3F3FF]/70">
                We're here to help and answer any question you might have. We look forward to hearing from you.
              </p>
            </div>
            <div>
              <ul className="mt-12 gap-y-6 gap-x-12 items-center md:flex lg:gap-x-0 lg:mt-0">
                {
                  contactMethods.map((item, idx) => (
                    <li key={idx} className="space-y-3 border-t border-[#A7A8CD]/10 py-6 md:max-w-sm md:py-0 md:border-t-0 lg:border-l lg:border-[#A7A8CD]/10 lg:px-12 lg:max-w-none">
                      <div className="w-12 h-12 rounded-full border border-[#A7A8CD]/20 flex items-center justify-center text-[#A7A8CD]">
                        {item.icon}
                      </div>
                      <h4 className="text-[#FFFFFF] text-lg font-medium xl:text-xl">
                        {item.title}
                      </h4>
                      <p className="text-[#F3F3FF]/70">
                        {item.desc}
                      </p>
                      <a href={item.link.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-[#A7A8CD] duration-150 hover:text-[#FFFFFF] font-medium">
                        {item.link.name}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
        </section>
        
        {/* Animated divider */}
        <div className="w-full h-px my-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#A7A8CD]/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#A7A8CD]/20 to-transparent animate-pulse-slow"></div>
        </div>
        
        {/* Bottom section - simplified with only copyright */}
        <div className="flex justify-center">
          {/* Copyright */}
          <div className="text-[#F3F3FF]/60 text-sm">
            © {currentYear} Management System. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 