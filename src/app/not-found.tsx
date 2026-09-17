import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <AppShell>
      <div className="rounded-xl border border-dashed bg-card p-10 text-center">
        <p className="text-lg font-semibold">Страница или товар не найдены</p>
        <p className="mt-1 text-sm text-muted-foreground">Проверьте артикул или вернитесь в каталог.</p>
        <Link href="/" className={cn(buttonVariants(), "mt-4")}>
          В каталог
        </Link>
      </div>
    </AppShell>
  );
}
