"use client";

import { Users, Shield, MessageSquare, Bell, Calendar, ChevronRight, Menu, X, ArrowRight, Sparkles, Star, Rocket, Target, Zap, Coins, Wallet, Bot, PanelLeft, Code2, BarChart4, Settings, LineChart, Headphones } from "lucide-react";
import { GlowingEffect } from "./ui/glowing-effect";

export default function GlowingEffectDemoSecond() {
  return (
    <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
        icon={<BarChart4 className="h-4 w-4 text-[#a7a8cd]" />}
        title="Performance Analytics"
        description="Advanced analytical insights to measure team performance and optimize productivity based on real-time data"
      />

      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
        icon={<Rocket className="h-4 w-4 text-[#a7a8cd]" />}
        title="Skill Development"
        description="Specialized training programs to develop team members' skills and enhance their professional efficiency"
      />

      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
        icon={<Settings className="h-4 w-4 text-[#a7a8cd]" />}
        title="Custom Configuration"
        description="Complete system customization based on team requirements with various integration options for workplace tools"
      />

      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
        icon={<LineChart className="h-4 w-4 text-[#a7a8cd]" />}
        title="Regular Reporting"
        description="Detailed progress reports and achievements with multiple export formats for comprehensive documentation"
      />

      <GridItem
        area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
        icon={<Headphones className="h-4 w-4 text-[#a7a8cd]" />}
        title="Premium Support"
        description="24/7 dedicated technical support team available to solve any issues users might encounter"
      />
    </ul>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border border-[#121217]/50 bg-[#121217] p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          blur={0}
          borderWidth={3}
          spread={80}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6 bg-[#121217] shadow-[0px_0px_15px_0px_rgba(18,18,23,0.4)]">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-[#a7a8cd]/20 bg-[#a7a8cd]/10 p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-balance text-white md:text-2xl/[1.875rem]">
                {title}
              </h3>
              <h2 className="font-sans text-sm/[1.125rem] text-[#e0e0f0]/70 md:text-base/[1.375rem]">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}; 