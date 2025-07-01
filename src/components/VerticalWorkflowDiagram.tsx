import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export default function VerticalWorkflowDiagram() {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [securityPulse, setSecurityPulse] = useState(0);
  const [dataFlowPulse, setDataFlowPulse] = useState(0);
  
  // Animation for flow progression
  useEffect(() => {
    const duration = 16000; // 16 seconds for full animation cycle
    const interval = 20; // Update every 20ms for smooth animation
    
    const timer = setInterval(() => {
      setAnimationProgress(prev => {
        const newProgress = prev + (interval / duration);
        return newProgress > 1 ? 0 : newProgress;
      });
    }, interval);
    
    return () => clearInterval(timer);
  }, []);
  
  // Effect for glow pulsing
  useEffect(() => {
    const glowTimer = setInterval(() => {
      setGlowIntensity(prev => Math.abs(Math.sin(Date.now() / 1000)));
    }, 50);
    
    return () => clearInterval(glowTimer);
  }, []);
  
  // Security shield pulse effect
  useEffect(() => {
    const pulseTimer = setInterval(() => {
      setSecurityPulse(prev => Math.abs(Math.sin(Date.now() / 800) * 0.7));
    }, 50);
    
    return () => clearInterval(pulseTimer);
  }, []);
  
  // Data flow pulse effect
  useEffect(() => {
    const dataFlowTimer = setInterval(() => {
      setDataFlowPulse(prev => Math.abs(Math.sin(Date.now() / 600) * 0.8));
    }, 40);
    
    return () => clearInterval(dataFlowTimer);
  }, []);
  
  // Calculate dash offset for path animation
  const calculateDashOffset = (
    totalLength: number, 
    progress: number, 
    startPercentage?: number, 
    endPercentage?: number
  ) => {
    const effectiveStart = startPercentage || 0;
    const effectiveEnd = endPercentage || 1;
    const animatableRange = effectiveEnd - effectiveStart;
    
    if (progress < effectiveStart) return totalLength;
    if (progress >= effectiveEnd) return 0;
    
    const effectiveProgress = (progress - effectiveStart) / animatableRange;
    return totalLength * (1 - effectiveProgress);
  };
  
  // Path lengths
  const pathLengths = {
    mainVertical: 500,
    clientToServer: 150,
    serverToDb: 120,
    dbToCrn: 140,
    crnToTransaction: 130,
    transactionTo2fa: 120,
    twoFaToVerify: 120,
    verifyToReceipt: 100
  };

  // Colors matching the website's color scheme from the image
  const colors = {
    background: "#050b15",
    cardBg: "#111827",
    glow: "#A7A8CD", // Light blue/lavender from the image
    text: "#FFFFFF",
    border: "#A7A8CD", // Light blue/lavender border
    connectors: "#1e2028",
    darkAccent: "#454555" // Darker navy/purple from the image
  };
  
  // Custom SVG patterns for technical backgrounds
  const CircuitPattern = () => (
    <pattern id="circuitPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M0,10 H20 M10,0 V20 M15,5 H20 M5,15 H0" stroke={colors.glow} strokeWidth="0.5" opacity="0.3" />
    </pattern>
  );
  
  const GridPattern = () => (
    <pattern id="gridPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M10,0 V10 M0,10 H10" stroke={colors.glow} strokeWidth="0.5" opacity="0.05" />
    </pattern>
  );
  
  const DataPattern = () => (
    <pattern id="dataPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M0,15 H30 M15,0 V30" stroke={colors.glow} strokeWidth="0.5" opacity="0.2" />
      <path d="M0,0 L30,30 M30,0 L0,30" stroke={colors.glow} strokeWidth="0.5" opacity="0.1" />
    </pattern>
  );
  
  const CryptoPattern = () => (
    <pattern id="cryptoPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="15" r="5" fill="none" stroke={colors.glow} strokeWidth="0.5" opacity="0.3" />
      <path d="M7,15 H23 M15,7 V23" stroke={colors.glow} strokeWidth="0.5" opacity="0.3" />
    </pattern>
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#050b15]">
      <div className="relative w-full max-w-3xl"> 
        {/* Security indicator */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <Lock size={12} className="text-[#A7A8CD]" />
          <span className="text-[#A7A8CD] text-xs font-medium">SECURE NETWORK</span>
        </div>
        
        <svg viewBox="0 0 800 600" className="w-full">
          <defs>
            <CircuitPattern />
            <GridPattern />
            <DataPattern />
            <CryptoPattern />
            
            {/* Gradients */}
            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.glow} stopOpacity="0.1" />
              <stop offset="100%" stopColor={colors.glow} stopOpacity="0.3" />
            </linearGradient>
            
            {/* Glow filter updated to match website colors */}
            <filter id="blueGlow" height="180%" width="180%" x="-40%" y="-40%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feFlood floodColor={colors.glow} floodOpacity="1" result="glow" />
              <feComposite in="glow" in2="blur" operator="in" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Background technical grid */}
          <rect x="0" y="0" width="800" height="600" fill="url(#gridPattern)" />
          
          {/* Crypto security perimeter */}
          <circle cx="400" cy="300" r="260" fill="none" stroke={colors.glow} strokeWidth="1" strokeDasharray="5,5" opacity={0.2 + securityPulse * 0.1} />
          
          {/* Blockchain visualization in background */}
          <g opacity={0.1 + dataFlowPulse * 0.05}>
            {[1, 2, 3, 4, 5].map((i) => (
              <rect 
                key={`block-${i}`} 
                x={280 + (i-1) * 50} 
                y={560}
                width="40" 
                height="20" 
                rx="2" 
                fill="none" 
                stroke={colors.glow} 
                strokeWidth="1"
              />
            ))}
            {[1, 2, 3, 4].map((i) => (
              <line 
                key={`chain-${i}`} 
                x1={320 + (i-1) * 50} 
                y1={570} 
                x2={330 + (i-1) * 50} 
                y2={570} 
                stroke={colors.glow} 
                strokeWidth="1"
              />
            ))}
          </g>
          
          {/* Main vertical line with animation */}
          <path 
            d="M400,80 L400,520" 
            stroke={colors.connectors} 
            strokeWidth="2.5"
            strokeDasharray={pathLengths.mainVertical}
            strokeDashoffset={calculateDashOffset(pathLengths.mainVertical, animationProgress, 0, 0.1)}
            fill="none"
          />
          
          {/* Client Node */}
          <g 
            className="cursor-pointer" 
            style={{ 
              opacity: animationProgress > 0.01 ? 1 : 0, 
              transition: 'opacity 0.5s',
              filter: `url(#blueGlow)`
            }}
          >
            <rect 
              x="300" 
              y="40" 
              width="200" 
              height="50" 
              rx="25" 
              ry="25" 
              fill={colors.cardBg} 
              stroke={colors.border} 
              strokeWidth="2.5"
            />
            <text x="400" y="70" fill={colors.text} fontFamily="sans-serif" fontSize="20" fontWeight="600" textAnchor="middle">CLIENT</text>
          </g>
          
          {/* Line to Secure API Server */}
          <path 
            d="M500,65 C560,65 590,95 590,115" 
            stroke={colors.connectors} 
            strokeWidth="2" 
            fill="none"
            strokeDasharray={pathLengths.clientToServer}
            strokeDashoffset={calculateDashOffset(pathLengths.clientToServer, animationProgress, 0.1, 0.18)}
          />
          
          {/* Secure API Server Node */}
          <g 
            className="cursor-pointer" 
            style={{ 
              opacity: animationProgress > 0.18 ? 1 : 0, 
              transition: 'opacity 0.5s',
              filter: `url(#blueGlow)`
            }}
          >
            <rect 
              x="490" 
              y="115" 
              width="220" 
              height="60" 
              rx="20" 
              ry="20" 
              fill={colors.cardBg} 
              stroke={colors.border}
              strokeWidth="2.5" 
            />
            <rect x="500" y="125" width="200" height="40" rx="15" ry="15" fill="url(#circuitPattern)" stroke={colors.border} strokeWidth="0.5" />
            <text x="600" y="150" fill={colors.text} fontFamily="sans-serif" fontSize="18" fontWeight="600" textAnchor="middle">SECURE API SERVER</text>
          </g>
          
          {/* Line to Database */}
          <path 
            d="M490,145 C440,145 420,175 400,175" 
            stroke={colors.connectors} 
            strokeWidth="2" 
            fill="none"
            strokeDasharray={pathLengths.serverToDb}
            strokeDashoffset={calculateDashOffset(pathLengths.serverToDb, animationProgress, 0.18, 0.24)}
          />
          
          {/* Database Node */}
          <g 
            className="cursor-pointer" 
            style={{ 
              opacity: animationProgress > 0.24 ? 1 : 0, 
              transition: 'opacity 0.5s',
              filter: `url(#blueGlow)`
            }}
          >
            <rect 
              x="290" 
              y="175" 
              width="220" 
              height="60" 
              rx="20" 
              ry="20" 
              fill={colors.cardBg} 
              stroke={colors.border}
              strokeWidth="2.5"
            />
            <rect x="300" y="185" width="200" height="40" rx="15" ry="15" fill="url(#dataPattern)" stroke={colors.border} strokeWidth="0.5" />
            <text x="400" y="210" fill={colors.text} fontFamily="sans-serif" fontSize="18" fontWeight="600" textAnchor="middle">ENCRYPTED DATABASE</text>
          </g>
          
          {/* Line to Enter Address Node */}
          <path 
            d="M290,205 C240,205 220,235 220,255" 
            stroke={colors.connectors} 
            strokeWidth="2" 
            fill="none"
            strokeDasharray={pathLengths.dbToCrn}
            strokeDashoffset={calculateDashOffset(pathLengths.dbToCrn, animationProgress, 0.24, 0.3)}
          />
          
          {/* Enter Address Node */}
          <g 
            className="cursor-pointer" 
            style={{ 
              opacity: animationProgress > 0.3 ? 1 : 0, 
              transition: 'opacity 0.5s',
              filter: `url(#blueGlow)`
            }}
          >
            <rect 
              x="120" 
              y="255" 
              width="200" 
              height="50" 
              rx="25" 
              ry="25" 
              fill={colors.cardBg} 
              stroke={colors.border} 
              strokeWidth="2.5"
            />
            <text x="220" y="285" fill={colors.text} fontFamily="sans-serif" fontSize="18" fontWeight="500" textAnchor="middle">ENTER ADDRESS</text>
          </g>
          
          {/* CRN Verification Node */}
          <g 
            className="cursor-pointer" 
            style={{ 
              opacity: animationProgress > 0.36 ? 1 : 0, 
              transition: 'opacity 0.5s',
              filter: `url(#blueGlow)`
            }}
          >
            <rect 
              x="480" 
              y="255" 
              width="220" 
              height="60" 
              rx="25" 
              ry="25" 
              fill={colors.cardBg} 
              stroke={colors.border}
              strokeWidth="2.5" 
            />
            <rect x="490" y="265" width="200" height="40" rx="20" ry="20" fill="url(#cryptoPattern)" stroke={colors.border} strokeWidth="0.5" />
            <text x="590" y="290" fill={colors.text} fontFamily="sans-serif" fontSize="18" fontWeight="500" textAnchor="middle">CRN VERIFICATION</text>
          </g>
          
          {/* Line to CRN Verification */}
          <path 
            d="M320,280 C380,280 420,280 480,280" 
            stroke={colors.connectors} 
            strokeWidth="2" 
            fill="none"
            strokeDasharray={pathLengths.crnToTransaction}
            strokeDashoffset={calculateDashOffset(pathLengths.crnToTransaction, animationProgress, 0.3, 0.36)}
          />
          
          {/* Line from CRN to Transaction */}
          <path 
            d="M590,315 C590,345 500,355 400,355" 
            stroke={colors.connectors} 
            strokeWidth="2" 
            fill="none"
            strokeDasharray={200}
            strokeDashoffset={calculateDashOffset(200, animationProgress, 0.36, 0.44)}
          />
          
          {/* Transaction Node */}
          <g 
            className="cursor-pointer" 
            style={{ 
              opacity: animationProgress > 0.44 ? 1 : 0, 
              transition: 'opacity 0.5s',
              filter: `url(#blueGlow)`
            }}
          >
            <rect 
              x="260" 
              y="355" 
              width="280" 
              height="60" 
              rx="20" 
              ry="20" 
              fill={colors.cardBg} 
              stroke={colors.border}
              strokeWidth="2.5"
            />
            <rect x="270" y="365" width="260" height="40" rx="15" ry="15" fill="url(#circuitPattern)" stroke={colors.border} strokeWidth="0.5" />
            <text x="400" y="390" fill={colors.text} fontFamily="sans-serif" fontSize="20" fontWeight="600" textAnchor="middle">TRANSACTION</text>
          </g>
          
          {/* Line to 2FA Code */}
          <path 
            d="M260,385 C210,385 190,415 190,435" 
            stroke={colors.connectors} 
            strokeWidth="2" 
            fill="none"
            strokeDasharray={pathLengths.transactionTo2fa}
            strokeDashoffset={calculateDashOffset(pathLengths.transactionTo2fa, animationProgress, 0.44, 0.52)}
          />
          
          {/* 2FA / OTP Node */}
          <g 
            className="cursor-pointer" 
            style={{ 
              opacity: animationProgress > 0.52 ? 1 : 0, 
              transition: 'opacity 0.5s',
              filter: `url(#blueGlow)`
            }}
          >
            <rect 
              x="90" 
              y="435" 
              width="200" 
              height="60" 
              rx="25" 
              ry="25" 
              fill={colors.cardBg} 
              stroke={colors.border}
              strokeWidth="2.5"
            />
            <text x="190" y="472" fill={colors.text} fontFamily="sans-serif" fontSize="18" fontWeight="500" textAnchor="middle">ENTER 2FA CODE</text>
          </g>
          
          {/* Line from 2FA to Verification */}
          <path 
            d="M190,495 C190,515 280,515 350,475" 
            stroke={colors.connectors} 
            strokeWidth="2" 
            fill="none"
            strokeDasharray={pathLengths.twoFaToVerify}
            strokeDashoffset={calculateDashOffset(pathLengths.twoFaToVerify, animationProgress, 0.52, 0.6)}
          />
          
          {/* Final Verification Node */}
          <g 
            className="cursor-pointer" 
            style={{ 
              opacity: animationProgress > 0.6 ? 1 : 0, 
              transition: 'opacity 0.5s',
              filter: `url(#blueGlow)`
            }}
          >
            <circle 
              cx="400" 
              cy="475" 
              r="35" 
              fill={colors.cardBg} 
              stroke={colors.border}
              strokeWidth="2.5"
            />
            
            <text x="400" y="482" fill={colors.text} fontFamily="sans-serif" fontSize="16" fontWeight="500" textAnchor="middle">VERIFY</text>
          </g>
          
          {/* Dotted line from CRN to Verification */}
          <path 
            d="M590,315 C650,365 600,435 430,475" 
            stroke={colors.connectors} 
            strokeWidth="2" 
            fill="none"
            strokeDasharray="5,5"
            strokeDashoffset={calculateDashOffset(500, animationProgress, 0.6, 0.68)}
          />
          
          {/* Line to Transaction Receipt */}
          <path 
            d="M400,505 C400,515 400,525 400,535" 
            stroke={colors.connectors} 
            strokeWidth="2" 
            fill="none"
            strokeDasharray={pathLengths.verifyToReceipt}
            strokeDashoffset={calculateDashOffset(pathLengths.verifyToReceipt, animationProgress, 0.68, 0.75)}
          />
          
          {/* Transaction Receipt Node */}
          <g 
            className="cursor-pointer" 
            style={{ 
              opacity: animationProgress > 0.75 ? 1 : 0, 
              transition: 'opacity 0.5s',
              filter: `url(#blueGlow)`
            }}
          >
            <rect 
              x="300" 
              y="535" 
              width="200" 
              height="50" 
              rx="25" 
              ry="25" 
              fill={colors.cardBg} 
              stroke={colors.border}
              strokeWidth="2.5"
            />
            
            <text x="400" y="567" fill={colors.text} fontFamily="sans-serif" fontSize="16" fontWeight="500" textAnchor="middle">TRANSACTION RECEIPT</text>
          </g>
          
          {/* Moving particles along paths */}
          {/* Client to Server */}
          <circle
            cx={500 + (animationProgress - 0.1) * 10 * 9}
            cy={65 + (animationProgress - 0.1) * 10 * 5}
            r="3"
            fill={colors.glow}
            filter="url(#blueGlow)"
            style={{ opacity: animationProgress > 0.1 && animationProgress < 0.18 ? 1 : 0 }}
          />
          
          {/* Server to Database */}
          <circle
            cx={490 - (animationProgress - 0.18) * 10 * 9}
            cy={145 + (animationProgress - 0.18) * 10 * 3}
            r="3"
            fill={colors.glow}
            filter="url(#blueGlow)"
            style={{ opacity: animationProgress > 0.18 && animationProgress < 0.24 ? 1 : 0 }}
          />
          
          {/* Database to Enter Address */}
          <circle
            cx={290 - (animationProgress - 0.24) * 10 * 7}
            cy={205 + (animationProgress - 0.24) * 10 * 5}
            r="3"
            fill={colors.glow}
            filter="url(#blueGlow)"
            style={{ opacity: animationProgress > 0.24 && animationProgress < 0.3 ? 1 : 0 }}
          />
          
          {/* Enter Address to CRN */}
          <circle
            cx={320 + (animationProgress - 0.3) * 10 * 16}
            cy={280}
            r="3"
            fill={colors.glow}
            filter="url(#blueGlow)"
            style={{ opacity: animationProgress > 0.3 && animationProgress < 0.36 ? 1 : 0 }}
          />
          
          {/* CRN to Transaction */}
          <circle
            cx={590}
            cy={315 + (animationProgress - 0.36) * 10 * 4}
            r="3"
            fill={colors.glow}
            filter="url(#blueGlow)"
            style={{ opacity: animationProgress > 0.36 && animationProgress < 0.44 ? 1 : 0 }}
          />
          
          {/* Transaction to 2FA */}
          <circle
            cx={260 - (animationProgress - 0.44) * 10 * 7}
            cy={385 + (animationProgress - 0.44) * 10 * 5}
            r="3"
            fill={colors.glow}
            filter="url(#blueGlow)"
            style={{ opacity: animationProgress > 0.44 && animationProgress < 0.52 ? 1 : 0 }}
          />
          
          {/* 2FA to Verification */}
          <circle
            cx={190 + (animationProgress - 0.52) * 10 * 16}
            cy={495 + (animationProgress - 0.52) * 10 * -2}
            r="3"
            fill={colors.glow}
            filter="url(#blueGlow)"
            style={{ opacity: animationProgress > 0.52 && animationProgress < 0.6 ? 1 : 0 }}
          />
          
          {/* CRN to Verification (dotted) */}
          <circle
            cx={590 + (animationProgress - 0.6) * 6 * 10}
            cy={315 + (animationProgress - 0.6) * 16 * 10}
            r="3"
            fill={colors.glow}
            filter="url(#blueGlow)"
            style={{ opacity: animationProgress > 0.6 && animationProgress < 0.68 ? 1 : 0 }}
          />
          
          {/* Verification to Receipt */}
          <circle
            cx={400}
            cy={505 + (animationProgress - 0.68) * 10 * 3}
            r="3"
            fill={colors.glow}
            filter="url(#blueGlow)"
            style={{ opacity: animationProgress > 0.68 && animationProgress < 0.75 ? 1 : 0 }}
          />
          
          {/* Cryptocurrency symbols */}
          <g opacity={0.2 + dataFlowPulse * 0.2} style={{ opacity: animationProgress > 0.4 ? 0.2 + dataFlowPulse * 0.2 : 0 }}>
            {[1, 2, 3].map((i) => (
              <g key={`crypto-${i}`} transform={`translate(${400 + Math.sin(Date.now() / 1000 + i) * 100}, ${300 + Math.cos(Date.now() / 1200 + i) * 50})`}>
                <circle cx="0" cy="0" r="12" fill="none" stroke={colors.glow} strokeWidth="1" />
                <text x="0" y="4" fill={colors.glow} fontFamily="sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">₵</text>
              </g>
            ))}
          </g>
          
          {/* Data packets animated along the main vertical */}
          {[0.15, 0.35, 0.55, 0.75, 0.95].map((offset, i) => {
            const packetY = ((animationProgress + offset) % 1) * 400 + 80;
            return packetY < 520 ? (
              <g key={i} opacity={0.7}>
                <rect 
                  x="396" y={packetY} width="8" height="6" 
                  fill={colors.cardBg} stroke={colors.glow} strokeWidth="0.5"
                  rx="1" ry="1"
                />
                <line x1="398" y1={packetY + 3} x2="402" y2={packetY + 3} stroke={colors.glow} strokeWidth="0.5" />
              </g>
            ) : null;
          })}
          
          {/* Security indicators */}
          <g opacity={0.2 + securityPulse * 0.2}>
            <circle cx="400" cy="300" r={200 + securityPulse * 10} fill="none" stroke={colors.glow} strokeWidth="0.5" strokeDasharray="1,5" />
          </g>
        </svg>
        
        {/* Bottom section with information panels */}
        <div className="w-full grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-[#1e2028]/40">
          <div className="bg-[#111827]/70 rounded-lg p-3">
            <h4 className="text-white text-sm font-medium text-center uppercase tracking-wider">CRN Protection</h4>
          </div>
          
          <div className="bg-[#111827]/70 rounded-lg p-3">
            <h4 className="text-white text-sm font-medium text-center uppercase tracking-wider">Multi-Factor Auth</h4>
          </div>
          
          <div className="bg-[#111827]/70 rounded-lg p-3">
            <h4 className="text-white text-sm font-medium text-center uppercase tracking-wider">Immutable Records</h4>
          </div>
        </div>
      </div>
    </div>
  );
} 