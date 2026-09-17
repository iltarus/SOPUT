export type DepartmentId =
  | "stationery"
  | "paper"
  | "print"
  | "computers"
  | "furniture"
  | "cleaning"
  | "packaging"
  | "workwear"
  | "food"
  | "safety"
  | "trade"
  | "school"
  | "kitchen"
  | "appliances"
  | "electronics"
  | "tools"
  | "gifts"
  | "sport"
  | "home"
  | "seasonal"
  | "beauty"
  | "other";

export type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  department: DepartmentId;
  category: string;
  path?: string;
  image?: string;
  price: number;
  unit: string;
  pack?: string;
  inStock: boolean;
  stockQty: number;
  attributes: Record<string, string>;
  tags: string[];
  description: string;
};

export type Compatibility = {
  productId: string;
  relatedId: string;
  kind: "consumable" | "accessory" | "spare";
  label: string;
  strength: number;
};

export type ComplementRule = {
  id: string;
  fromCategory: string;
  toCategory: string;
  weight: number;
  reason: string;
  kind: "consumable" | "accessory" | "workflow";
};

export type ReasonType = "pin" | "compat" | "rule" | "affinity" | "brand" | "attr" | "stock";

export type Reason = {
  type: ReasonType;
  label: string;
  weight: number;
};

export type Recommendation = {
  product: Product;
  score: number;
  reasons: Reason[];
  group: "pinned" | "consumables" | "equipment" | "together";
};

export type RecommendationGroup = {
  id: Recommendation["group"];
  title: string;
  items: Recommendation[];
};

export type RelatedResponse = {
  productId: string;
  context: "pdp" | "cart";
  groups: RecommendationGroup[];
  items: Recommendation[];
  coverage: {
    score: number;
    label: string;
  };
};

export type Overrides = {
  pins: Record<string, string[]>;
  hidden: Record<string, string[]>;
};

export type RecommendOptions = {
  limit?: number;
  excludeIds?: string[];
  context?: "pdp" | "cart";
  diversify?: boolean;
};
