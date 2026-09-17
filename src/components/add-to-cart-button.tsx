"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";

export function AddToCartButton({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button
        size="lg"
        className="flex-1"
        disabled={!product.inStock}
        onClick={() => {
          add(product);
          setAdded(true);
          toast.success("Добавлено в корзину");
        }}
      >
        {product.inStock ? (added ? "Ещё одну в корзину" : "В корзину") : "Нет в наличии"}
      </Button>
      <Button size="lg" variant="outline" onClick={() => router.push("/cart")}>
        К корзине
      </Button>
    </div>
  );
}
