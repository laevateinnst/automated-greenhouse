"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import ModeToggle from "./ModeToggle";
import { Badge } from "./ui/badge";
import { Leaf } from "lucide-react";

interface HeaderProps {
  espOnline: boolean;
}

export default function Header({ espOnline }: HeaderProps) {
  const { user } = useUser();

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 px-4 sm:px-6 py-4 rounded-xl shadow-sm relative overflow-hidden bg-background">
      {/* Animated leaves moving infinitely left to right */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Leaf 1 */}
        <div className="absolute -left-10 top-1/4 animate-[leafFloat1_20s_linear_infinite]">
          <Leaf className="h-6 w-6 text-green-400/30 dark:text-emerald-400/40" />
        </div>
        
        {/* Leaf 2 */}
        <div className="absolute -left-20 top-2/3 animate-[leafFloat2_25s_linear_infinite]">
          <Leaf className="h-8 w-8 text-green-500/40 dark:text-emerald-500/50" />
        </div>
        
        {/* Leaf 3 */}
        <div className="absolute -left-16 top-1/3 animate-[leafFloat3_30s_linear_infinite]">
          <Leaf className="h-5 w-5 text-green-300/25 dark:text-emerald-300/35" />
        </div>
        
        {/* Leaf 4 */}
        <div className="absolute -left-24 top-3/4 animate-[leafFloat4_22s_linear_infinite]">
          <Leaf className="h-7 w-7 text-green-400/35 dark:text-emerald-400/45" />
        </div>
        
        {/* Leaf 5 - Extra for more coverage */}
        <div className="absolute -left-30 top-1/6 animate-[leafFloat5_28s_linear_infinite]">
          <Leaf className="h-4 w-4 text-green-600/25 dark:text-emerald-600/35" />
        </div>
        
        {/* Leaf 6 - Extra for more coverage */}
        <div className="absolute -left-15 top-5/6 animate-[leafFloat6_35s_linear_infinite]">
          <Leaf className="h-6 w-6 text-green-700/30 dark:text-emerald-700/40" />
        </div>
      </div>

      {/* Title */}
      <div className="relative z-10">
        <h1 className="text-xl sm:text-2xl font-bold">
          Automated Herb Greenhouse
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Temp · Humidity · Soil · Light
        </p>
      </div>

      {/* Status + User */}
      <div className="flex flex-wrap items-center gap-3 relative z-10">
        {/* ESP-01 status */}
        <div className="flex items-center gap-2 rounded-full bg-slate-100 text-sm">
          {!espOnline ? (
            <Badge
              variant="destructive"
              className="text-center justify-center"
            >
              ESP-01 Disconnected
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-center justify-center bg-green-500 dark:bg-emerald-600"
            >
              ESP-01 Connected
            </Badge>
          )}
        </div>

        {/* User */}
        {user && (
          <div className="flex items-center gap-2 rounded-full px-3 py-1">
            <span className="text-sm font-medium truncate max-w-30">
              Hi, {user.firstName}!
            </span>
            <UserButton />
          </div>
        )}

        <ModeToggle />
      </div>

      {/* Add the infinite animation keyframes */}
      <style jsx global>{`
        @keyframes leafFloat1 {
          0% {
            transform: translateX(-100px) translateY(0) rotate(0deg);
            opacity: 0;
          }
          5% {
            opacity: 0.7;
          }
          15% {
            opacity: 0.9;
          }
          50% {
            transform: translateX(calc(100vw + 100px)) translateY(-20px) rotate(180deg);
            opacity: 0.8;
          }
          85% {
            opacity: 0.6;
          }
          100% {
            transform: translateX(calc(200vw + 100px)) translateY(0) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes leafFloat2 {
          0% {
            transform: translateX(-150px) translateY(10px) rotate(30deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          25% {
            opacity: 0.85;
          }
          60% {
            transform: translateX(calc(100vw + 150px)) translateY(-15px) rotate(210deg);
            opacity: 0.75;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateX(calc(200vw + 150px)) translateY(10px) rotate(390deg);
            opacity: 0;
          }
        }
        
        @keyframes leafFloat3 {
          0% {
            transform: translateX(-200px) translateY(-5px) rotate(60deg);
            opacity: 0;
          }
          8% {
            opacity: 0.5;
          }
          20% {
            opacity: 0.8;
          }
          55% {
            transform: translateX(calc(100vw + 200px)) translateY(15px) rotate(240deg);
            opacity: 0.7;
          }
          95% {
            opacity: 0.4;
          }
          100% {
            transform: translateX(calc(200vw + 200px)) translateY(-5px) rotate(420deg);
            opacity: 0;
          }
        }
        
        @keyframes leafFloat4 {
          0% {
            transform: translateX(-250px) translateY(15px) rotate(90deg);
            opacity: 0;
          }
          12% {
            opacity: 0.6;
          }
          30% {
            opacity: 0.9;
          }
          65% {
            transform: translateX(calc(100vw + 250px)) translateY(-10px) rotate(270deg);
            opacity: 0.8;
          }
          85% {
            opacity: 0.5;
          }
          100% {
            transform: translateX(calc(200vw + 250px)) translateY(15px) rotate(450deg);
            opacity: 0;
          }
        }
        
        @keyframes leafFloat5 {
          0% {
            transform: translateX(-300px) translateY(-10px) rotate(120deg);
            opacity: 0;
          }
          7% {
            opacity: 0.5;
          }
          22% {
            opacity: 0.8;
          }
          70% {
            transform: translateX(calc(100vw + 300px)) translateY(20px) rotate(300deg);
            opacity: 0.7;
          }
          92% {
            opacity: 0.4;
          }
          100% {
            transform: translateX(calc(200vw + 300px)) translateY(-10px) rotate(480deg);
            opacity: 0;
          }
        }
        
        @keyframes leafFloat6 {
          0% {
            transform: translateX(-350px) translateY(5px) rotate(150deg);
            opacity: 0;
          }
          15% {
            opacity: 0.7;
          }
          35% {
            opacity: 0.95;
          }
          75% {
            transform: translateX(calc(100vw + 350px)) translateY(-5px) rotate(330deg);
            opacity: 0.85;
          }
          88% {
            opacity: 0.6;
          }
          100% {
            transform: translateX(calc(200vw + 350px)) translateY(5px) rotate(510deg);
            opacity: 0;
          }
        }
        
        @keyframes pulseGently {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
        
        .dark .animate-\[leafFloat1_20s_linear_infinite\] .lucide-leaf,
        .dark .animate-\[leafFloat2_25s_linear_infinite\] .lucide-leaf,
        .dark .animate-\[leafFloat3_30s_linear_infinite\] .lucide-leaf,
        .dark .animate-\[leafFloat4_22s_linear_infinite\] .lucide-leaf,
        .dark .animate-\[leafFloat5_28s_linear_infinite\] .lucide-leaf,
        .dark .animate-\[leafFloat6_35s_linear_infinite\] .lucide-leaf {
          filter: drop-shadow(0 0 2px rgba(110, 231, 183, 0.4));
        }
      `}</style>
    </header>
  );
}