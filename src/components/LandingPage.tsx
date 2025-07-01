import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Shield,
  MessageSquare,
  Bell,
  Calendar,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Star,
  Rocket,
  Target,
  Zap,
  Coins,
  Wallet,
  Bot,
  PanelLeft,
  Code2,
} from 'lucide-react';
import { TracingBeam } from './ui/tracing-beam';
import { TypewriterEffectSmooth } from './ui/typewriter-effect';
import GlowingEffectDemoSecond from './glowing-effect-demo-2';
import { 
  Navbar, 
  NavBody, 
  NavItems, 
  MobileNav, 
  MobileNavHeader, 
  MobileNavMenu, 
  MobileNavToggle, 
  NavbarLogo, 
  NavbarButton 
} from './ui/resizable-navbar';
import DiscordIcon from './DiscordIcon';
import { BackgroundBeams } from './ui/background-beams';
import VerticalWorkflowDiagram from './VerticalWorkflowDiagram';
import Footer from './Footer';

// Add animations to tailwind
const AppStyles = () => (
  <style>{`
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }
    
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
    
    @keyframes fadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    
    @keyframes borderGlow {
      0% { box-shadow: 0 0 0 rgba(212, 213, 244, 0); }
      50% { box-shadow: 0 0 15px rgba(212, 213, 244, 0.2); }
      100% { box-shadow: 0 0 0 rgba(212, 213, 244, 0); }
    }
    
    @keyframes rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes tilt {
      0% { transform: rotate(0deg); }
      25% { transform: rotate(1deg); }
      75% { transform: rotate(-1deg); }
      100% { transform: rotate(0deg); }
    }
    
    .animate-float {
      animation: float 6s ease-in-out infinite;
    }
    
    .animate-pulse-slow {
      animation: pulse 3s ease-in-out infinite;
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-in-out;
    }
    
    .animate-border-glow {
      animation: borderGlow 4s ease-in-out infinite;
    }
    
    .animate-rotate-slow {
      animation: rotate 15s linear infinite;
    }
    
    .animate-tilt {
      animation: tilt 10s ease-in-out infinite;
    }
  `}</style>
);

// Dynamic Island component - more visually appealing
function DynamicIsland({ children, className = '', onClick = undefined }: { 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const islandRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={islandRef}
      className={`relative overflow-hidden bg-[#0d1117]/80 backdrop-blur-lg rounded-full px-6 py-3 
        shadow-lg border border-[#D4D5F4]/20 
        transition-all duration-300 ease-out
        ${isHovered ? 'bg-[#0d1117]/90 scale-[1.02]' : ''} 
        ${onClick ? 'cursor-pointer' : ''} 
        hover:border-[#D4D5F4]/40 hover:shadow-lg hover:shadow-[#D4D5F4]/10
        ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#D4D5F4]/10 to-transparent rounded-full"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group relative bg-[#0d1117]/70 backdrop-blur-sm p-8 rounded-xl border border-[#D4D5F4]/20 
        transition-all duration-300 hover:bg-[#0d1117]/90 hover:border-[#D4D5F4]/40 
        hover:shadow-lg hover:shadow-[#D4D5F4]/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <Icon className={`w-10 h-10 text-[#D4D5F4] mb-4 transition-all duration-300 
          ${isHovered ? 'scale-110' : ''}`} />
      </div>
      <h3 className="text-2xl font-semibold mb-3 text-white">{title}</h3>
      <p className="text-[#F3F3FF]/80">{description}</p>
    </div>
  );
}

interface LandingPageProps {
  onLoginClick: () => void;
}

function LandingPage({ onLoginClick }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Background with dark theme and purple accents
  const Background = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#000000]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#050b15] to-[#0a192f]/40"></div>
      
      {/* Purple glow effect top right */}
      <div className="absolute -top-5 right-0 w-[500px] h-[300px] rounded-full bg-[#D4D5F4]/10 blur-[120px]"></div>
      
      {/* Grid pattern overlay - very subtle */}
      <div 
        className="absolute inset-0 opacity-5" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(212, 213, 244, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(212, 213, 244, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      ></div>
    </div>
  );

  // Navigation links
  const navItems = [
    { name: "About", link: "#about" },
    { name: "Features", link: "#features" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Background />
      
      {/* New Navigation with Resizable Navbar */}
      <Navbar className="fixed">
        <NavBody>
          <NavbarLogo>
            <div 
              className="flex items-center space-x-2 cursor-pointer shadow-[0_0_15px_rgba(212,213,244,0.2)] hover:shadow-[0_0_20px_rgba(212,213,244,0.3)] hover:border-[#D4D5F4]/40 px-4 py-2 rounded-full border border-[#D4D5F4]/20" 
              onClick={onLoginClick}
            >
              <div className="w-5 h-5 text-[#D4D5F4] font-bold flex items-center justify-center">C</div>
              <span className="text-white font-medium">Team Space</span>
            </div>
          </NavbarLogo>
          
          <NavItems items={navItems} />
          
          <div className="relative z-20">
            <NavbarButton 
              href="https://discord.gg/3cVdBNQmGh" 
              variant="secondary"
              as="a"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex items-center space-x-2">
                <DiscordIcon className="w-4 h-4" />
                <span>Discord</span>
              </div>
            </NavbarButton>
          </div>
        </NavBody>
        
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo>
              <div 
                className="flex items-center space-x-2 cursor-pointer shadow-[0_0_15px_rgba(212,213,244,0.2)] hover:shadow-[0_0_20px_rgba(212,213,244,0.3)] hover:border-[#D4D5F4]/40 px-4 py-2 rounded-full border border-[#D4D5F4]/20" 
                onClick={onLoginClick}
              >
                <div className="w-5 h-5 text-[#D4D5F4] font-bold flex items-center justify-center">C</div>
                <span className="text-white font-medium">Team Space</span>
              </div>
            </NavbarLogo>
            
            <MobileNavToggle 
              isOpen={isMenuOpen} 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
            />
          </MobileNavHeader>
          
          <MobileNavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
            {navItems.map((item, idx) => (
              <a 
                key={idx} 
                href={item.link}
                className="text-[#F3F3FF]/80 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <a 
              href="https://discord.gg/3cVdBNQmGh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-[#F3F3FF]/80 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <DiscordIcon className="w-4 h-4" />
              <span>Discord</span>
            </a>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <BackgroundBeams className="opacity-40" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <DynamicIsland className="inline-block mb-8">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-[#D4D5F4]" />
              <span className="text-[#D4D5F4]">Official Clyne Portal</span>
            </div>
          </DynamicIsland>
          
          <div className="mt-6">
            <TypewriterEffectSmooth
              words={[
                { text: "Operations", className: "text-[#D4D5F4]" },
                { text: "&", className: "text-[#D4D5F4]" },
                { text: "Development", className: "text-[#D4D5F4]" },
                { text: "Space", className: "text-[#D4D5F4]" },
              ]}
              className="text-white"
              cursorClassName="bg-[#D4D5F4]"
            />
          </div>
          
          <p className="mt-6 text-xl text-[#F3F3FF]/80 max-w-3xl mx-auto">
            Welcome to Clyne Operations & Development Space
            <br />
            An elite environment for managing strategies, executing tasks, and building the future together
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <DynamicIsland className="px-8">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-[#D4D5F4]" />
                <span className="text-[#F3F3FF]/80">Comprehensive Security</span>
              </div>
            </DynamicIsland>
            <DynamicIsland className="px-8">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-[#D4D5F4]" />
                <span className="text-[#F3F3FF]/80">Advanced Management</span>
              </div>
            </DynamicIsland>
          </div>
        </div>
      </section>

      {/* GlowingEffect Demo Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-[#1e2028]/60 px-4 py-2 rounded-full border border-[#D4D5F4]/10 mb-4">
              <Sparkles className="w-4 h-4 text-[#D4D5F4] animate-pulse-slow mr-2" />
              <span className="text-[#D4D5F4] text-sm font-medium">Advanced Solutions</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Strategic Management Suite</h2>
            <p className="text-[#F3F3FF]/80 max-w-2xl mx-auto">
              Advanced platform for team and project management with intuitive interface and enterprise-grade security
            </p>
          </div>
          <GlowingEffectDemoSecond />
        </div>
      </section>
      
      {/* CRN Token Transaction Flow Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-[#050b15] to-[#0a192f]/40 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-20 right-10 w-[300px] h-[300px] rounded-full bg-[#6344F5]/5 blur-[120px] -z-10"></div>
        <div className="absolute bottom-20 left-10 w-[300px] h-[300px] rounded-full bg-[#6344F5]/5 blur-[120px] -z-10"></div>
        
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center bg-[#1e2028]/60 px-4 py-2 rounded-full border border-[#D4D5F4]/10 mb-4">
              <Zap className="w-4 h-4 text-[#D4D5F4] animate-pulse-slow mr-2" />
              <span className="text-[#D4D5F4] text-sm font-medium">CRN Transaction</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Secure Token Transfer Process</h2>
            <p className="text-[#F3F3FF]/80 max-w-2xl mx-auto">
              Complete visualization of our secure CRN token transfer with multi-step verification and receipt generation
            </p>
          </div>
          
          <div className="bg-[#0d1117]/70 backdrop-blur-sm rounded-xl border border-[#D4D5F4]/10 overflow-hidden shadow-lg shadow-[#D4D5F4]/5">
            <div className="p-6 border-b border-[#D4D5F4]/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#1e2028] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#D4D5F4]" />
                </div>
                <h3 className="text-xl font-semibold text-white">CRN Token Transaction Flow</h3>
              </div>
            </div>
            
            <div className="h-[800px]">
              <VerticalWorkflowDiagram />
            </div>
            
            <div className="p-6 border-t border-[#D4D5F4]/10 bg-[#0d1117]/80">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1e2028]/60 rounded-lg p-4">
                  <h3 className="text-[#D4D5F4] font-medium mb-2 text-sm">Advanced Verification</h3>
                  <p className="text-[#F3F3FF]/70 text-sm">
                    Multiple verification steps ensure complete security for all CRN token transfers.
                  </p>
                </div>
                
                <div className="bg-[#1e2028]/60 rounded-lg p-4">
                  <h3 className="text-[#D4D5F4] font-medium mb-2 text-sm">Two-Factor Authentication</h3>
                  <p className="text-[#F3F3FF]/70 text-sm">
                    OTP verification provides an additional layer of security before finalizing transactions.
                  </p>
                </div>
                
                <div className="bg-[#1e2028]/60 rounded-lg p-4">
                  <h3 className="text-[#D4D5F4] font-medium mb-2 text-sm">Transaction Receipts</h3>
                  <p className="text-[#F3F3FF]/70 text-sm">
                    Digital receipts are automatically sent to both parties upon successful completion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-[#0d1117]/40 relative overflow-hidden">
        <AppStyles />
        
        {/* Subtle glowing effects in background */}
        <div className="absolute top-20 right-10 w-[300px] h-[300px] rounded-full bg-[#D4D5F4]/5 blur-[120px] -z-10"></div>
        <div className="absolute bottom-20 left-10 w-[300px] h-[300px] rounded-full bg-[#D4D5F4]/5 blur-[120px] -z-10"></div>
        
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-[#1e2028]/60 px-4 py-2 rounded-full border border-[#D4D5F4]/10 mb-4">
              <Sparkles className="w-4 h-4 text-[#D4D5F4] animate-pulse-slow mr-2" />
              <span className="text-[#D4D5F4] text-sm font-medium">Team Ecosystem</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Key Platform Features</h2>
            <p className="text-[#F3F3FF]/80 max-w-2xl mx-auto mb-16">
              Our ecosystem offers essential tools to support your digital community and blockchain integration
            </p>
          </div>
          
          {/* Main Feature Card - Governance Structure */}
          <div className="mb-16 bg-gradient-to-br from-[#0f111a]/80 to-[#0f111a] p-8 rounded-2xl border border-[#1e2028] relative overflow-hidden">
            <div className="absolute top-8 right-8 opacity-10">
              <div className="w-32 h-32 text-[#D4D5F4]">
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" strokeWidth="1.5" />
                  <path d="M12 22V12" strokeWidth="1.5" />
                  <path d="M4 7L12 12L20 7" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-start">
              <div className="md:w-1/6 mb-6 md:mb-0">
                <div className="bg-[#1e2028] w-16 h-16 rounded-lg flex items-center justify-center">
                  <div className="w-8 h-8 text-[#D4D5F4]">
                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" strokeWidth="1.5" />
                      <path d="M12 22V12" strokeWidth="1.5" />
                      <path d="M4 7L12 12L20 7" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="md:w-5/6 md:pl-6">
                <h2 className="text-3xl font-bold text-white mb-4">Management Structure</h2>
                <p className="text-[#F3F3FF]/80 text-lg max-w-3xl">
                  Establishing a clear internal system for decision-making and role distribution within the team to ensure transparency and efficiency in project development.
                </p>
                
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="inline-flex items-center bg-[#1e2028] px-4 py-2 rounded-full">
                    <span className="text-[#D4D5F4] text-sm">Policy Development</span>
                  </div>
                  <div className="inline-flex items-center bg-[#1e2028] px-4 py-2 rounded-full">
                    <span className="text-[#D4D5F4] text-sm">Creating professional and ethical standards to guide team operations and maintain trust and quality across all services</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Two-Column Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1 - Organizational Structure */}
            <div className="bg-gradient-to-br from-[#0f111a]/80 to-[#0f111a] p-8 rounded-2xl border border-[#1e2028] relative">
              <div className="flex items-start">
                <div className="bg-[#1e2028] w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-7 h-7 text-[#D4D5F4]">
                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 19C20 16.7909 16.4183 15 12 15C7.58172 15 4 16.7909 4 19" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <div className="ml-6">
                  <h3 className="text-2xl font-bold text-white mb-3">Organizational Structure</h3>
                  <p className="text-[#F3F3FF]/80">
                    Establishing a well-defined hierarchical framework with clear role definitions to facilitate effective communication and workflow management across all operational levels.
                  </p>
                </div>
              </div>
              
              <div className="absolute bottom-8 right-8 opacity-10">
                <div className="w-24 h-24 text-[#D4D5F4]">
                  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 19C20 16.7909 16.4183 15 12 15C7.58172 15 4 16.7909 4 19" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Card 2 - Strategic Communication */}
            <div className="bg-gradient-to-br from-[#0f111a]/80 to-[#0f111a] p-8 rounded-2xl border border-[#1e2028] relative">
              <div className="flex items-start">
                <div className="bg-[#1e2028] w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-7 h-7 text-[#D4D5F4]">
                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 11.5C21 16.1944 16.9706 20 12 20C11.3166 20 10.6506 19.9351 10.0059 19.8113C9.85852 19.7853 9.78483 19.7724 9.72398 19.7631C9.65389 19.7525 9.59292 19.7474 9.53471 19.7545C9.48475 19.7607 9.43617 19.7763 9.34082 19.8081L6.79916 20.8318C6.50061 20.9372 6.35134 20.9899 6.21986 20.9817C6.10513 20.9745 5.99536 20.9307 5.90808 20.8567C5.8069 20.7723 5.75 20.6347 5.75 20.361V17.7679C5.75 17.6654 5.75 17.6142 5.73978 17.5677C5.73129 17.5278 5.7174 17.4896 5.69865 17.454C5.67713 17.4133 5.64415 17.3803 5.57819 17.3143C4.5835 16.3184 4 14.979 4 13.5C4 10.7058 6.01916 8.36624 8.85 7.33466" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                
                <div className="ml-6">
                  <h3 className="text-2xl font-bold text-white mb-3">Strategic Communication</h3>
                  <p className="text-[#F3F3FF]/80">
                    Implementing comprehensive communication channels that ensure transparent information exchange and foster collaborative decision-making processes across organizational departments.
                  </p>
                </div>
              </div>
              
              <div className="absolute bottom-8 right-8 opacity-10">
                <div className="w-24 h-24 text-[#D4D5F4]">
                  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 11.5C21 16.1944 16.9706 20 12 20C11.3166 20 10.6506 19.9351 10.0059 19.8113C9.85852 19.7853 9.78483 19.7724 9.72398 19.7631C9.65389 19.7525 9.59292 19.7474 9.53471 19.7545C9.48475 19.7607 9.43617 19.7763 9.34082 19.8081L6.79916 20.8318C6.50061 20.9372 6.35134 20.9899 6.21986 20.9817C6.10513 20.9745 5.99536 20.9307 5.90808 20.8567C5.8069 20.7723 5.75 20.6347 5.75 20.361V17.7679C5.75 17.6654 5.75 17.6142 5.73978 17.5677C5.73129 17.5278 5.7174 17.4896 5.69865 17.454C5.67713 17.4133 5.64415 17.3803 5.57819 17.3143C4.5835 16.3184 4 14.979 4 13.5C4 10.7058 6.01916 8.36624 8.85 7.33466" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Three Card Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {/* Card 3 - Native Token */}
            <div className="bg-gradient-to-br from-[#0f111a]/80 to-[#0f111a] p-8 rounded-2xl border border-[#1e2028] relative">
              <div className="flex items-start">
                <div className="bg-[#1e2028] w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-7 h-7 text-[#D4D5F4]">
                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="12" r="6" strokeWidth="1.5"/>
                      <circle cx="16" cy="12" r="6" strokeWidth="1.5"/>
                    </svg>
                  </div>
                </div>
                
                <div className="ml-6">
                  <h3 className="text-xl font-bold text-white mb-3">Native Token</h3>
                  <p className="text-[#F3F3FF]/80 text-sm">
                    Our exclusive digital currency designed for community engagement and governance
                  </p>
                </div>
              </div>
            </div>
            
            {/* Card 4 - Developer API */}
            <div className="bg-gradient-to-br from-[#0f111a]/80 to-[#0f111a] p-8 rounded-2xl border border-[#1e2028] relative">
              <div className="flex items-start">
                <div className="bg-[#1e2028] w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-7 h-7 text-[#D4D5F4]">
                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 8L3 12L7 16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 8L21 12L17 16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 4L10 20" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                
                <div className="ml-6">
                  <h3 className="text-xl font-bold text-white mb-3">Integration Gateway</h3>
                  <p className="text-[#F3F3FF]/80 text-sm">
                    A streamlined interface that enables developers to extend our ecosystem, connect external tools, and build innovative solutions tailored to their needs
                  </p>
                </div>
              </div>
            </div>
            
            {/* Card 5 - Team Collaboration */}
            <div className="bg-gradient-to-br from-[#0f111a]/80 to-[#0f111a] p-8 rounded-2xl border border-[#1e2028] relative">
              <div className="flex items-start">
                <div className="bg-[#1e2028] w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-7 h-7 text-[#D4D5F4]">
                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1.5" />
                      <path d="M8 4V2M16 4V2M4 9H20M8 15H10M14 15H16M8 19H10M14 19H16" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                
                <div className="ml-6">
                  <h3 className="text-xl font-bold text-white mb-3">Team Collaboration</h3>
                  <p className="text-[#F3F3FF]/80 text-sm">
                    Tools for teams to work efficiently with task management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* About Section with TracingBeam - Starting here */}
      <TracingBeam className="w-full">
        <section id="about" className="py-24 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full bg-[#3b82f6]/5 blur-[150px] -z-10"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-[#3b82f6]/5 blur-[120px] -z-10"></div>
          
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <DynamicIsland className="inline-block mb-8">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-[#D4D5F4]" />
                  <span className="text-[#D4D5F4]">About Our Platform</span>
                </div>
              </DynamicIsland>
              <h2 className="text-5xl font-bold text-white mb-6 bg-clip-text">Community-Driven Digital Platform</h2>
              <p className="text-[#F3F3FF]/80 max-w-2xl mx-auto text-lg">
                A modern ecosystem focused on community engagement, secure digital assets, and seamless management tools
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Main Feature Column - 8 columns on md screens */}
              <div className="md:col-span-8 bg-gradient-to-br from-[#0d1117]/90 to-[#0a192f]/80 backdrop-blur-md rounded-2xl border border-[#D4D5F4]/20 shadow-xl hover:shadow-[#D4D5F4]/5 transition-all duration-300 overflow-hidden">
                {/* Header with gradient overlay */}
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117] to-[#0a192f]/50"></div>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgc3Ryb2tlPSIjRDRENUY0IiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjEiIGN4PSIzMDAiIGN5PSIzMDAiIHI9IjI5OSIvPjxjaXJjbGUgc3Ryb2tlPSIjRDRENUY0IiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjEiIGN4PSIzMDAiIGN5PSIzMDAiIHI9IjE5OSIvPjxjaXJjbGUgc3Ryb2tlPSIjRDRENUY0IiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjEiIGN4PSIzMDAiIGN5PSIzMDAiIHI9Ijk5Ii8+PC9nPjwvc3ZnPg==')] bg-no-repeat bg-center opacity-30"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h3 className="text-3xl font-bold text-white">Digital Ecosystem</h3>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="bg-[#D4D5F4]/10 p-3 rounded-full">
                      <Shield className="w-6 h-6 text-[#D4D5F4]" />
                    </div>
                    <h4 className="text-xl font-semibold text-white">Secure & Transparent</h4>
                  </div>
                  
                  <p className="text-[#F3F3FF]/80 mb-6">
                    Our platform ensures top-tier security through advanced encryption and transparent transactions visible to users, giving complete confidence in their digital assets and interactions
                  </p>
                  
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="bg-[#D4D5F4]/10 p-3 rounded-full">
                      <Coins className="w-6 h-6 text-[#D4D5F4]" />
                    </div>
                    <h4 className="text-xl font-semibold text-white">Native Token Economy</h4>
                  </div>
                  
                  <p className="text-[#F3F3FF]/80 mb-6">
                    Our system is powered by a native token that facilitates community engagement, rewards participation, and grants access to exclusive features within our platform
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-[#D4D5F4]/10 rounded-xl p-4 border border-[#D4D5F4]/10">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-white font-medium">Community Decision Making</h5>
                        <PanelLeft className="w-4 h-4 text-[#D4D5F4]" />
                      </div>
                      <p className="text-[#F3F3FF]/70 text-sm">Decisions are driven by the community through active participation and input</p>
                    </div>
                    
                    <div className="bg-[#D4D5F4]/10 rounded-xl p-4 border border-[#D4D5F4]/10">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-white font-medium">Reward System</h5>
                        <Target className="w-4 h-4 text-[#D4D5F4]" />
                      </div>
                      <p className="text-[#F3F3FF]/70 text-sm">Earn tokens through active involvement and valuable contributions</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Side Column - 4 columns on md screens */}
              <div className="md:col-span-4 flex flex-col gap-8">
                {/* Card 1 */}
                <div className="bg-gradient-to-br from-[#0d1117]/90 to-[#0a192f]/80 backdrop-blur-md p-6 rounded-2xl border border-[#D4D5F4]/20 shadow-xl hover:shadow-[#D4D5F4]/5 transition-all duration-300 relative">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-[#0d1117] border border-[#D4D5F4]/30 rounded-full p-3 shadow-lg shadow-[#D4D5F4]/10">
                    <Wallet className="w-6 h-6 text-[#D4D5F4]" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-4 mt-2">Secure Wallet</h3>
                  <p className="text-[#F3F3FF]/80 text-sm mb-4">
                    Our wallet provides military-grade security for your digital assets while maintaining a user-friendly interface
                  </p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-block px-3 py-1 bg-[#D4D5F4]/10 text-[#D4D5F4] text-xs rounded-full border border-[#D4D5F4]/20">Multi-Signature</span>
                    <span className="inline-block px-3 py-1 bg-[#D4D5F4]/10 text-[#D4D5F4] text-xs rounded-full border border-[#D4D5F4]/20">Discord Support</span>
                  </div>
                </div>
                
                {/* Card 2 */}
                <div className="bg-gradient-to-br from-[#0d1117]/90 to-[#0a192f]/80 backdrop-blur-md p-6 rounded-2xl border border-[#D4D5F4]/20 shadow-xl hover:shadow-[#D4D5F4]/5 transition-all duration-300 relative">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-[#0d1117] border border-[#D4D5F4]/30 rounded-full p-3 shadow-lg shadow-[#D4D5F4]/10">
                    <Bot className="w-6 h-6 text-[#D4D5F4]" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-4 mt-2">Discord Integration</h3>
                  <p className="text-[#F3F3FF]/80 text-sm mb-4">
                    Seamlessly connect your Discord community with our blockchain platform through our advanced bot
                  </p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-block px-3 py-1 bg-[#D4D5F4]/10 text-[#D4D5F4] text-xs rounded-full border border-[#D4D5F4]/20">Role Management</span>
                    <span className="inline-block px-3 py-1 bg-[#D4D5F4]/10 text-[#D4D5F4] text-xs rounded-full border border-[#D4D5F4]/20">Token Verification</span>
                  </div>
                </div>
                
                {/* Stats Card */}
                <div className="bg-gradient-to-br from-[#0d1117]/90 to-[#0a192f]/80 backdrop-blur-md p-6 rounded-2xl border border-[#D4D5F4]/20 shadow-xl hover:shadow-[#D4D5F4]/5 transition-all duration-300">
                  <h3 className="text-lg font-semibold text-white mb-4">Platform Stats</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#F3F3FF]/70 text-sm">Token Users</span>
                        <span className="text-white font-medium">5,000+</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#D4D5F4]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#D4D5F4]/50 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#F3F3FF]/70 text-sm">Daily Transactions</span>
                        <span className="text-white font-medium">10k+</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#D4D5F4]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#D4D5F4]/50 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#F3F3FF]/70 text-sm">Completed Transactions</span>
                        <span className="text-white font-medium">5,000+</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#D4D5F4]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#D4D5F4]/50 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Section - Technology Highlights */}
            <div className="mt-12 bg-gradient-to-br from-[#0d1117]/90 to-[#0a192f]/80 backdrop-blur-md p-8 rounded-2xl border border-[#D4D5F4]/20 shadow-xl hover:shadow-[#D4D5F4]/5 transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-6">Technology Stack</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex items-start">
                  <div className="bg-[#D4D5F4]/10 p-3 rounded-lg mr-4 flex-shrink-0">
                    <Code2 className="w-5 h-5 text-[#D4D5F4]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Smart Contracts</h4>
                    <p className="text-[#F3F3FF]/70 text-sm">
                      Our platform utilizes cutting-edge smart contract technology for secure, transparent, and automated transactions
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-[#D4D5F4]/10 p-3 rounded-lg mr-4 flex-shrink-0">
                    <Shield className="w-5 h-5 text-[#D4D5F4]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Advanced Security</h4>
                    <p className="text-[#F3F3FF]/70 text-sm">
                      Multi-layer encryption and security protocols protect user data and digital assets from threats
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-[#D4D5F4]/10 p-3 rounded-lg mr-4 flex-shrink-0">
                    <Zap className="w-5 h-5 text-[#D4D5F4]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Lightning Network</h4>
                    <p className="text-[#F3F3FF]/70 text-sm">
                      Our scaling solution enables instant transactions with minimal fees for a seamless user experience
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Completely Redesigned */}
        <section className="py-24 px-4 bg-gradient-to-b from-[#050b15] to-[#0a192f]/40 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute top-0 left-0 w-full h-full animate-rotate-slow opacity-50">
              <div className="absolute top-0 left-1/2 w-full h-full border-t border-[#D4D5F4]/20 rounded-full"></div>
              <div className="absolute top-0 left-1/2 w-full h-full border-t border-[#D4D5F4]/20 rounded-full" style={{ transform: 'rotate(60deg)' }}></div>
              <div className="absolute top-0 left-1/2 w-full h-full border-t border-[#D4D5F4]/20 rounded-full" style={{ transform: 'rotate(120deg)' }}></div>
            </div>
          </div>
          
          {/* Blue glow effects */}
          <div className="absolute top-0 left-1/4 w-[300px] h-[300px] rounded-full bg-[#D4D5F4]/10 blur-[100px] -z-10"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full bg-[#D4D5F4]/5 blur-[120px] -z-10"></div>
          
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-[#0d1117]/90 via-[#0a192f]/80 to-[#0d1117]/90 backdrop-blur-lg p-12 rounded-3xl border border-[#D4D5F4]/20 shadow-2xl relative overflow-hidden">
              
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-5" 
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(212, 213, 244, 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(212, 213, 244, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '30px 30px'
                }}
              ></div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col md:flex-row items-center">
                <div className="md:w-2/3 mb-10 md:mb-0 md:pr-10">
                  <div className="inline-flex items-center bg-[#D4D5F4]/10 px-4 py-2 rounded-full border border-[#D4D5F4]/20 mb-6">
                    <Rocket className="w-4 h-4 text-[#D4D5F4] mr-2" />
                    <span className="text-[#D4D5F4] text-sm font-medium">Join Our Ecosystem</span>
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    Experience the Future of <span className="text-[#D4D5F4]">Digital Finance</span>
                  </h2>
                  
                  <p className="text-[#F3F3FF]/80 text-lg mb-8">
                    Get exclusive access to our platform, secure wallet, and token ecosystem. Join thousands of community members already benefiting from our advanced digital asset solutions.
                  </p>
                </div>
                
                <div className="md:w-1/3 flex justify-center">
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4D5F4]/40 to-transparent rounded-full animate-pulse-slow"></div>
                    <div className="absolute inset-2 bg-[#0d1117] rounded-full"></div>
                    <div className="absolute inset-6 flex items-center justify-center">
                      <Zap className="w-24 h-24 text-[#D4D5F4]/80" />
                    </div>
                    
                    {/* Animated rings */}
                    <div className="absolute inset-0 border border-[#D4D5F4]/20 rounded-full animate-pulse-slow"></div>
                    <div className="absolute inset-4 border border-[#D4D5F4]/10 rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute inset-8 border border-[#D4D5F4]/5 rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </TracingBeam>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default LandingPage; 