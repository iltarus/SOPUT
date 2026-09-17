import {
  Armchair,
  Coffee,
  Cpu,
  Flame,
  FolderOpen,
  Gift,
  Hammer,
  Heart,
  Home,
  Package,
  Printer,
  Shirt,
  Snowflake,
  SprayCan,
  Store,
  Tv,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DepartmentId } from "@/lib/types";

const ICONS: Record<DepartmentId, LucideIcon> = {
  stationery: FolderOpen,
  paper: Package,
  print: Printer,
  computers: Cpu,
  furniture: Armchair,
  cleaning: SprayCan,
  packaging: Package,
  workwear: Shirt,
  food: Coffee,
  safety: Flame,
  trade: Store,
  school: FolderOpen,
  kitchen: Coffee,
  appliances: Home,
  electronics: Tv,
  tools: Wrench,
  gifts: Gift,
  sport: Heart,
  home: Home,
  seasonal: Snowflake,
  beauty: Heart,
  other: Hammer,
};

const TONES: Record<DepartmentId, string> = {
  stationery: "from-sky-700 to-sky-500",
  paper: "from-stone-600 to-amber-500",
  print: "from-red-800 to-rose-500",
  computers: "from-slate-800 to-cyan-600",
  furniture: "from-amber-800 to-orange-500",
  cleaning: "from-teal-800 to-emerald-500",
  packaging: "from-yellow-700 to-amber-400",
  workwear: "from-indigo-800 to-blue-500",
  food: "from-orange-800 to-red-500",
  safety: "from-red-900 to-orange-600",
  trade: "from-violet-800 to-fuchsia-500",
  school: "from-lime-800 to-green-500",
  kitchen: "from-rose-800 to-pink-500",
  appliances: "from-cyan-900 to-sky-500",
  electronics: "from-blue-900 to-indigo-500",
  tools: "from-neutral-800 to-stone-500",
  gifts: "from-fuchsia-800 to-pink-400",
  sport: "from-emerald-800 to-lime-500",
  home: "from-amber-900 to-yellow-600",
  seasonal: "from-red-800 to-green-600",
  beauty: "from-pink-800 to-rose-400",
  other: "from-zinc-700 to-zinc-500",
};

export function ProductVisual({
  department,
  brand,
  image,
  className,
}: {
  department: DepartmentId;
  brand: string;
  image?: string;
  className?: string;
}) {
  const Icon = ICONS[department] ?? Hammer;
  if (image) {
    return (
      <div className={cn("relative flex aspect-[4/3] w-full items-end overflow-hidden bg-white", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="absolute inset-0 size-full object-contain p-2" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] w-full items-end overflow-hidden bg-linear-to-br p-3 text-white",
        TONES[department],
        className,
      )}
    >
      <Icon className="absolute -right-3 -top-2 size-24 opacity-20" />
      <div className="relative">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">Комус</p>
        <p className="text-sm font-semibold leading-tight">{brand}</p>
      </div>
    </div>
  );
}
