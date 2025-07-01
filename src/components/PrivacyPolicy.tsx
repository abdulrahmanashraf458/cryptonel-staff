import React from 'react';
import { ArrowLeft, Mail, Shield, Bell, Lock, Globe, FileText, AlertCircle, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white">
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-center"
        >
          <Link to="/" className="flex items-center text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            <span>Back to Home</span>
          </Link>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#1e293b] rounded-xl p-8 shadow-lg border border-[#3e4c6a]"
        >
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4"
            >
              <Shield size={40} className="text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-3 text-center">Privacy Policy - Clyne Bot</h1>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-3"></div>
            <p className="text-gray-400 text-center">Last Updated: June 07, 2025</p>
          </div>
          
          <div className="space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <p className="text-lg text-gray-300 leading-relaxed">
                Welcome to the Privacy Policy for Clyne, a Discord bot designed to enhance server engagement by welcoming users and providing interactive features. This policy outlines how we collect, use, and protect your data, ensuring transparency and compliance with Discord's guidelines.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="bg-[#111827]/50 p-6 rounded-lg border border-[#2d3748]"
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-500/20 p-2 rounded-lg mr-4">
                  <Lock className="text-blue-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">1. Introduction</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">
                At Clyne, we value your privacy and are committed to protecting any information you share while using our bot. This policy applies to all interactions with Clyne on Discord servers where it is active. By using Clyne, you agree to the terms outlined herein.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="bg-[#111827]/50 p-6 rounded-lg border border-[#2d3748]"
            >
              <div className="flex items-center mb-4">
                <div className="bg-purple-500/20 p-2 rounded-lg mr-4">
                  <FileText className="text-purple-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">2. Data We Collect</h2>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Clyne uses the following intents to operate:
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-indigo-500/20 p-2 rounded-lg mr-3 mt-1">
                    <Bell className="text-indigo-400" size={16} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-1">Presence Intent</h3>
                    <p className="text-gray-300">To detect when users go online or offline, enabling welcome messages and status tracking.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-teal-500/20 p-2 rounded-lg mr-3 mt-1">
                    <Globe className="text-teal-400" size={16} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-1">Message Content Intent</h3>
                    <p className="text-gray-300">To read and respond to specific keywords (e.g., 'help') for interactive features.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-gray-300">
                  We do not store any personal data, including user messages or presence information, outside of Discord's platform. All processing occurs in real-time within Discord servers, and no data is saved to external databases or third-party services.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="bg-[#111827]/50 p-6 rounded-lg border border-[#2d3748]"
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-500/20 p-2 rounded-lg mr-4">
                  <Check className="text-green-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">3. How We Use Your Data</h2>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                The data collected by Clyne is used solely for the following purposes:
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Sending automated welcome messages when users go online
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Responding to user commands or keywords to enhance server interaction
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Providing a real-time overview of server status (e.g., online/offline counts), with plans to add a dashboard feature
                </li>
              </ul>
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-gray-300">
                  We do not use your data for advertising, selling, or sharing with third parties.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="bg-[#111827]/50 p-6 rounded-lg border border-[#2d3748]"
            >
              <div className="flex items-center mb-4">
                <div className="bg-yellow-500/20 p-2 rounded-lg mr-4">
                  <Shield className="text-yellow-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">4. User Rights and Opt-Out</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">
                We respect your control over your data. Users can opt-out of having their presence or message content tracked by using the /optout command. Once opted out, Clyne will cease monitoring that user's activity or messages.
              </p>
              <p className="text-gray-300 mt-3 leading-relaxed">
                If you have concerns, you can also contact us directly to request further action regarding your data.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="bg-[#111827]/50 p-6 rounded-lg border border-[#2d3748]"
            >
              <div className="flex items-center mb-4">
                <div className="bg-red-500/20 p-2 rounded-lg mr-4">
                  <Lock className="text-red-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">5. Data Security</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Since Clyne does not store data off-platform, we rely on Discord's security measures to protect your information during real-time processing. We implement best practices to ensure the bot operates securely, but we encourage users to report any issues immediately.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="bg-[#111827]/50 p-6 rounded-lg border border-[#2d3748]"
            >
              <div className="flex items-center mb-4">
                <div className="bg-orange-500/20 p-2 rounded-lg mr-4">
                  <AlertCircle className="text-orange-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">6. Changes to This Policy</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">
                We may update this Privacy Policy to reflect changes in our practices or legal requirements. Any updates will be posted here with a revised 'Last Updated' date. We recommend checking this page periodically for changes.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              className="bg-[#111827]/50 p-6 rounded-lg border border-[#2d3748]"
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-500/20 p-2 rounded-lg mr-4">
                  <Mail className="text-blue-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">7. Contact Us</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">
                If you have any questions, concerns, or suggestions about this Privacy Policy or Clyne's data practices, please reach out to us at <a href="mailto:support@clyne.cc" className="text-blue-400 hover:text-blue-300 transition-colors">support@clyne.cc</a>. We are happy to assist and address your inquiries promptly.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="bg-[#111827]/50 p-6 rounded-lg border border-[#2d3748]"
            >
              <div className="flex items-center mb-4">
                <div className="bg-purple-500/20 p-2 rounded-lg mr-4">
                  <Check className="text-purple-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">8. Acknowledgment</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">
                By using Clyne, you acknowledge that you have read and understood this Privacy Policy. Thank you for trusting us to enhance your Discord experience!
              </p>
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
          className="mt-10 text-center"
        >
          <div className="flex items-center justify-center space-x-6 mb-4">
            <a href="https://discord.gg/clyne" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
              <div className="flex flex-col items-center">
                <div className="p-2 bg-[#1e293b] rounded-lg mb-2">
                  <ExternalLink size={20} />
                </div>
                <span className="text-xs">Discord</span>
              </div>
            </a>
            <a href="mailto:support@clyne.cc" className="text-gray-400 hover:text-blue-400 transition-colors">
              <div className="flex flex-col items-center">
                <div className="p-2 bg-[#1e293b] rounded-lg mb-2">
                  <Mail size={20} />
                </div>
                <span className="text-xs">Email Us</span>
              </div>
            </a>
            <a href="/terms" className="text-gray-400 hover:text-blue-400 transition-colors">
              <div className="flex flex-col items-center">
                <div className="p-2 bg-[#1e293b] rounded-lg mb-2">
                  <FileText size={20} />
                </div>
                <span className="text-xs">Terms</span>
              </div>
            </a>
          </div>
          <div className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Clyne Bot. All rights reserved.
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 