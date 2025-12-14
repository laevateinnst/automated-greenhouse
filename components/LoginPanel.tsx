"use client";

import React, { useState, useEffect } from "react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Droplets,
  Leaf as LeafIcon,
  Thermometer,
  Zap,
} from "lucide-react";

interface LeafProps {
  left?: number;
  delay?: number;
  duration?: number;
  size?: number;
  rotate?: number;
  type?: number;
}

const FALLING_TYPES = [
  { emoji: "🍃", color: "text-green-400" },
  { emoji: "🍂", color: "text-amber-500" },
  { emoji: "🌸", color: "text-pink-300" },
  { emoji: "🌿", color: "text-emerald-500" },
  { emoji: "🌱", color: "text-lime-400" },
  { emoji: "☘️", color: "text-green-300" },
];

const FallingElement: React.FC<LeafProps> = ({
  left = 0,
  delay = 0,
  duration = 5,
  size = 24,
  rotate = 0,
  type = 0,
}) => {
  const elementType = FALLING_TYPES[type % FALLING_TYPES.length];

  return (
    <div
      className={`absolute ${elementType.color} opacity-80 hidden sm:block`}
      style={{
        top: "-50px",
        left: `${left}%`,
        fontSize: `${size}px`,
        transform: `rotate(${rotate}deg)`,
        animation: `fall ${duration}s ease-in-out ${delay}s infinite`,
        zIndex: 0,
        pointerEvents: "none",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
      }}
    >
      {elementType.emoji}
    </div>
  );
};

const TimeGreeting: React.FC<{ greeting: string }> = ({ greeting }) => {
  return (
    <div className="relative group w-full">
      <div className="absolute -inset-2 sm:-inset-4 bg-linear-to-r from-green-100/40 to-emerald-100/40 rounded-xl sm:rounded-3xl blur-lg sm:blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative bg-white/95 backdrop-blur-lg px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl border border-white/30 shadow-lg sm:shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
          {/* Greeting icon */}
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-linear-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner">
              <div className="text-green-600 text-lg sm:text-xl md:text-2xl">
                🌤️
              </div>
            </div>
            <div className="absolute -inset-1 sm:-inset-2 bg-linear-to-r from-green-200 to-emerald-200 rounded-lg sm:rounded-2xl blur-sm sm:blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
          </div>

          {/* Greeting text */}
          <div className="space-y-1 flex-1">
            <div className="text-lg sm:text-xl md:text-2xl font-light text-gray-800 tracking-wide italic text-center sm:text-left">
              <span className="font-medium not-italic bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {greeting}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">
                Welcome to your smart greenhouse
              </span>
            </div>
          </div>

          {/* Animated leaves decoration - hide on very small screens */}
          <div className="hidden sm:flex gap-2 ml-auto">
            <div
              className="text-green-400 text-lg md:text-xl animate-float"
              style={{ animationDelay: "0s" }}
            >
              🍃
            </div>
            <div
              className="text-emerald-500 text-lg md:text-xl animate-float"
              style={{ animationDelay: "0.5s" }}
            >
              🍂
            </div>
          </div>
        </div>

        {/* Subtle bottom gradient border */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-linear-to-r from-transparent via-green-300/50 to-transparent rounded-full"></div>
      </div>
    </div>
  );
};

const LoginPanel: React.FC = () => {
  const [greeting, setGreeting] = useState<string>("Good day!");

  // Generate random elements for the background - fewer on mobile
  const fallingElements = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 5 + Math.random() * 8,
    size: 20 + Math.random() * 25,
    rotate: Math.random() * 360,
    type: Math.floor(Math.random() * FALLING_TYPES.length),
  }));

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hours = now.getHours();

      if (hours < 5) setGreeting("Starry night wishes!");
      else if (hours < 8) setGreeting("Dawn's first light!");
      else if (hours < 12) setGreeting("Radiant morning!");
      else if (hours < 14) setGreeting("Perfect noon!");
      else if (hours < 18) setGreeting("Golden afternoon!");
      else if (hours < 22) setGreeting("Peaceful evening!");
      else setGreeting("Moonlit night!");
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 overflow-hidden">
      {/* Enhanced background gradient */}
      <div
        className="absolute inset-0 transition-all duration-5000"
        style={{
          background:
            "radial-gradient(circle at 20% 80%, #B8E6B3 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8CD790 0%, transparent 50%), radial-gradient(circle at 40% 40%, #C6F7C9 0%, transparent 50%), linear-gradient(135deg, #D9F0D9 0%, #A2E8A2 30%, #7DD77D 70%, #5DC75D 100%)",
        }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent animate-gradient-shift"></div>
      </div>

      {/* Enhanced background effects container */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs - smaller on mobile */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-green-300/10 rounded-full blur-xl sm:blur-2xl md:blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-emerald-400/10 rounded-full blur-xl sm:blur-2xl md:blur-3xl animate-float-slower"></div>

        {/* Sun effect - smaller on mobile */}
        <div className="absolute top-5 right-5 w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 bg-yellow-200/20 rounded-full blur-lg sm:blur-xl md:blur-2xl animate-pulse-sun"></div>

        {/* Falling elements */}
        {fallingElements.map((element) => (
          <FallingElement
            key={element.id}
            left={element.left}
            delay={element.delay}
            duration={element.duration}
            size={element.size}
            rotate={element.rotate}
            type={element.type}
          />
        ))}
      </div>

      {/* Main Content - Centered Login Panel */}
      <div className="w-full max-w-6xl relative z-10">
        {/* Header - Stack on mobile */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 sm:gap-6 mb-6 sm:mb-8 md:mb-12 px-2 sm:px-4">
          <div className="flex items-center gap-3 w-full lg:w-auto justify-center lg:justify-start">
            <div className="text-green-600 text-3xl sm:text-4xl animate-plant-grow">
              🌿
            </div>
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
                Greenhouse Login
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Smart Greenhouse Monitoring System
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto max-w-md lg:max-w-none">
            <TimeGreeting greeting={greeting} />
          </div>
        </div>

        {/* Main Login Card - Stack on mobile, side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
          {/* Left Side - Welcome Text */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 leading-tight text-center lg:text-left">
              Welcome to Our
              <span className="block text-green-600 mt-1 sm:mt-2">
                Automated Herb Greenhouse
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 text-center lg:text-left leading-relaxed">
              Monitor and control your greenhouse ecosystem with our advanced
              dashboard. Get real-time insights and automated management.
            </p>

            {/* Stats - Responsive grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
              <div className="text-center p-3 sm:p-4 bg-white/50 backdrop-blur-sm rounded-lg sm:rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  1
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Active Users
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white/50 backdrop-blur-sm rounded-lg sm:rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  1
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Plants Managed
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white/50 backdrop-blur-sm rounded-lg sm:rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  99%
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Success Rate
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="bg-linear-to-r from-white/95 to-white/90 backdrop-blur-xl shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-white/50 order-1 lg:order-2">
            <div className="text-center mb-6 sm:mb-8">
              <div className="relative inline-block">
                <div className="text-green-600 text-4xl sm:text-5xl mb-3 sm:mb-4 animate-plant-grow">
                  🌱
                </div>
                <div className="absolute -inset-3 sm:-inset-4 bg-green-400/10 rounded-full blur-lg sm:blur-xl animate-pulse"></div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                Access Your Dashboard
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Sign in to manage your greenhouse
              </p>
            </div>

            {/* Buttons Section */}
            <div className="space-y-3 sm:space-y-4">
              <SignInButton mode="modal">
                <Button className="w-full group relative overflow-hidden bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-5 sm:py-6 md:py-7 rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]">
                  <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg">
                    <Sun className="w-5 h-5 sm:w-6 sm:h-6" />
                    Sign In to Dashboard
                  </span>
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </Button>
              </SignInButton>

              <SignUpButton mode="modal">
                <Button className="w-full group relative overflow-hidden bg-white hover:bg-green-50 text-green-700 font-semibold py-5 sm:py-6 md:py-7 rounded-lg sm:rounded-xl border-2 border-green-200 hover:border-green-300 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02]">
                  <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg">
                    <LeafIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    Create New Account
                  </span>
                </Button>
              </SignUpButton>
            </div>

            {/* Quick Info */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-green-100">
              <p className="text-xs sm:text-sm text-gray-500 text-center">
                Secure login powered by Clerk
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Features Section */}
        <div className="mt-8 sm:mt-12 md:mt-16">
          <div className="bg-linear-to-r from-white/90 to-white/80 backdrop-blur-xl shadow-lg sm:shadow-xl rounded-2xl sm:rounded-3xl w-full p-4 sm:p-6 md:p-8 border border-white/50">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                Complete Greenhouse Management
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Everything you need for optimal monitoring of your plant is here
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {/* Temperature */}
              <div className="text-center group">
                <div className="bg-linear-to-r from-orange-50 to-orange-100 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Thermometer className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-orange-500" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">
                  Temperature
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Precise climate control
                </p>
                <div className="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-gray-800">
                  24°C
                </div>
              </div>

              {/* Soil Moisture */}
              <div className="text-center group">
                <div className="bg-linear-to-r from-blue-50 to-blue-100 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Droplets className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-500" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">
                  Soil Moisture
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Smart hydration system
                </p>
                <div className="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-gray-800">
                  65%
                </div>
              </div>

              {/* Light Control */}
              <div className="text-center group">
                <div className="bg-linear-to-r from-yellow-50 to-yellow-100 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Sun className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-500" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">
                  Light Control
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Automated lighting
                </p>
                <div className="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-gray-800">
                  850 lux
                </div>
              </div>

              {/* Smart Irrigation */}
              <div className="text-center group">
                <div className="bg-linear-to-r from-purple-50 to-purple-100 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-500" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">
                  Smart Irrigation
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  AI-powered watering
                </p>
                <div className="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-gray-800">
                  Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-6 sm:mt-8 text-center px-4">
        <p className="text-xs sm:text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Greenhouse Dashboard. All rights
          reserved.
        </p>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes fall {
            0% { 
              transform: translateY(0px) rotate(0deg) translateX(0px); 
              opacity: 0; 
            }
            10% { 
              opacity: 0.8; 
            }
            50% { 
              transform: translateY(50vh) rotate(180deg) translateX(${
                Math.random() > 0.5 ? 20 : -20
              }px); 
              opacity: 0.6; 
            }
            100% { 
              transform: translateY(100vh) rotate(360deg) translateX(${
                Math.random() > 0.5 ? 10 : -10
              }px); 
              opacity: 0; 
            }
          }

          @keyframes float {
            0%, 100% { 
              transform: translateY(0px) rotate(0deg); 
            }
            33% { 
              transform: translateY(-3px) rotate(-3deg); 
            }
            66% { 
              transform: translateY(3px) rotate(3deg); 
            }
          }

          @keyframes float-slow {
            0%, 100% { 
              transform: translateY(0px) scale(1); 
            }
            50% { 
              transform: translateY(-10px) scale(1.05); 
            }
          }

          @keyframes float-slower {
            0%, 100% { 
              transform: translateY(0px) scale(1); 
            }
            50% { 
              transform: translateY(-15px) scale(1.08); 
            }
          }

          @keyframes pulse-sun {
            0%, 100% { 
              opacity: 0.2; 
              transform: scale(1); 
            }
            50% { 
              opacity: 0.3; 
              transform: scale(1.1); 
            }
          }

          @keyframes plant-grow {
            0%, 100% { 
              transform: scale(1) rotate(0deg); 
            }
            25% { 
              transform: scale(1.05) rotate(-2deg); 
            }
            75% { 
              transform: scale(1.05) rotate(2deg); 
            }
          }

          @keyframes gradient-shift {
            0%, 100% { 
              background-position: 0% 50%; 
            }
            50% { 
              background-position: 100% 50%; 
            }
          }

          .animate-float { animation: float 3s ease-in-out infinite; }
          .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
          .animate-float-slower { animation: float-slower 12s ease-in-out infinite; }
          .animate-pulse-sun { animation: pulse-sun 8s ease-in-out infinite; }
          .animate-plant-grow { animation: plant-grow 4s ease-in-out infinite; }
          .animate-gradient-shift { 
            animation: gradient-shift 15s ease infinite; 
            background-size: 200% 200%;
          }
        `}
      </style>
    </div>
  );
};

export default LoginPanel;
