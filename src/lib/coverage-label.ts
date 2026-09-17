import type { Recommendation } from "./types";

export const COVERAGE_LABELS = ["Нет рекомендаций", "Слабое", "Достаточное", "Полное"] as const;
export type CoverageLabel = (typeof COVERAGE_LABELS)[number];

export type CoverageRelated = {
  id: string;
  score: number;
  group: Recommendation["group"];
};

export type CoverageRow = {
  id: string;
  name: string;
  category: string;
  department: string;
  count: number;
  score: number;
  label: CoverageLabel;
  related: CoverageRelated[];
};

export type CoverageSummary = {
  total: number;
  featured: number;
  full: number;
  ok: number;
  weak: number;
  empty: number;
  coveragePct: number;
  builtAt?: string;
};

export function coverageLabel(count: number): CoverageLabel {
  if (count >= 6) return "Полное";
  if (count >= 3) return "Достаточное";
  if (count >= 1) return "Слабое";
  return "Нет рекомендаций";
}
