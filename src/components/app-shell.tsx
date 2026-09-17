"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardList, Layers3, Menu, ShoppingCart, Sparkles, Warehouse } from "lucide-react";
import { CartProvider, useCart } from "@/components/cart-provider";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Каталог", icon: Warehouse },
  { href: "/workbench", label: "Верстак", icon: Sparkles },
  { href: "/rules", label: "Правила", icon: Layers3 },
  { href: "/coverage", label: "Покрытие", icon: ClipboardList },
  { href: "/docs", label: "API", icon: BookOpen },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
              active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function CartLink() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className={cn(
        buttonVariants({ variant: "secondary", size: "sm" }),
        "relative bg-white text-primary hover:bg-white/90",
      )}
    >
      <ShoppingCart className="size-4" />
      Корзина
      {count > 0 ? (
        <span className="ml-1 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">{count}</span>
      ) : null}
    </Link>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-red-900/20 bg-primary text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Sheet>
            <SheetTrigger className="inline-flex size-8 items-center justify-center rounded-lg md:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Меню</span>
            </SheetTrigger>
            <SheetContent side="left" className="bg-primary text-white">
              <SheetHeader>
                <SheetTitle className="text-white">Сопут</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-white text-sm font-black text-primary">С</span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight">Сопут</span>
              <span className="hidden text-[11px] text-white/70 sm:block">сопутствующие для Комус</span>
            </span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            <NavLinks />
          </nav>
          <div className="ml-auto">
            <CartLink />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Сервис подбора сопутствующих товаров для каталога komus.ru</p>
          <p>Полный каталог по sitemap Комус. API готов к виджету на карточке товара.</p>
        </div>
      </footer>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <CartProvider>
        <ShellInner>{children}</ShellInner>
      </CartProvider>
    </TooltipProvider>
  );
}
