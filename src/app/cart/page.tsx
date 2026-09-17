import { AppShell } from "@/components/app-shell";
import { CartView } from "@/components/cart-view";

export default function CartPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Корзина</h1>
      <p className="mt-1 mb-6 max-w-2xl text-sm text-muted-foreground">
        Рекомендации считаются ко всему набору, а не к одному SKU: если в корзине принтер и бумага, сервис не
        предложит вторую пачку бумаги — предложит картридж и степлер.
      </p>
      <CartView />
    </AppShell>
  );
}
