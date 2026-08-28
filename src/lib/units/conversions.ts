/**
 * Central unit system for FoodCost Lab.
 *
 * All unit conversion must go through this module (TRD §16-19, §37, §51).
 * Never duplicate conversion math anywhere else in the codebase.
 *
 * Base units per category (TRD §15):
 *   weight -> g
 *   volume -> ml
 *   count  -> ea (never auto-converted between count units)
 */

export type WeightUnit = "mg" | "g" | "kg";
export type VolumeUnit = "ml" | "l";
export type CountUnit = "ea" | "piece" | "pack" | "bottle" | "can";
export type Unit = WeightUnit | VolumeUnit | CountUnit;

export type UnitCategory = "weight" | "volume" | "count";

const WEIGHT_UNITS: readonly WeightUnit[] = ["mg", "g", "kg"];
const VOLUME_UNITS: readonly VolumeUnit[] = ["ml", "l"];
const COUNT_UNITS: readonly CountUnit[] = ["ea", "piece", "pack", "bottle", "can"];

/** Grams per unit of weight. */
const WEIGHT_TO_GRAM: Record<WeightUnit, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
};

/** Millilitres per unit of volume. */
const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  ml: 1,
  l: 1000,
};

export class UnsupportedUnitError extends Error {
  constructor(unit: string) {
    super(`지원되지 않는 단위입니다: "${unit}"`);
    this.name = "UnsupportedUnitError";
  }
}

export class IncompatibleUnitError extends Error {
  constructor(from: string, to: string) {
    super(`"${from}"와(과) "${to}"는(은) 서로 변환할 수 없습니다.`);
    this.name = "IncompatibleUnitError";
  }
}

/** Returns the category (weight/volume/count) a unit belongs to, or throws if unknown. */
export function getUnitCategory(unit: string): UnitCategory {
  const normalized = unit.toLowerCase().trim() as Unit;
  if ((WEIGHT_UNITS as readonly string[]).includes(normalized)) return "weight";
  if ((VOLUME_UNITS as readonly string[]).includes(normalized)) return "volume";
  if ((COUNT_UNITS as readonly string[]).includes(normalized)) return "count";
  throw new UnsupportedUnitError(unit);
}

export function isSupportedUnit(unit: string): unit is Unit {
  try {
    getUnitCategory(unit);
    return true;
  } catch {
    return false;
  }
}

/** The base unit every value in a category is normalized to before math is done. */
export function getBaseUnit(category: UnitCategory): Unit {
  switch (category) {
    case "weight":
      return "g";
    case "volume":
      return "ml";
    case "count":
      return "ea";
  }
}

/**
 * Converts `value` from `fromUnit` to `toUnit`.
 *
 * Weight <-> weight and volume <-> volume conversions are supported
 * (kg <-> g <-> mg, l <-> ml). Count units are never auto-converted — a
 * mismatched pair of count units (e.g. "ea" -> "pack") throws, since there is
 * no universal ratio between them (TRD §16, §19).
 */
export function convertUnit(value: number, fromUnit: string, toUnit: string): number {
  if (!Number.isFinite(value)) {
    throw new Error("변환할 수량이 올바르지 않습니다.");
  }

  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();

  const fromCategory = getUnitCategory(from);
  const toCategory = getUnitCategory(to);

  if (fromCategory !== toCategory) {
    throw new IncompatibleUnitError(fromUnit, toUnit);
  }

  if (from === to) return value;

  switch (fromCategory) {
    case "weight": {
      const grams = value * WEIGHT_TO_GRAM[from as WeightUnit];
      return grams / WEIGHT_TO_GRAM[to as WeightUnit];
    }
    case "volume": {
      const ml = value * VOLUME_TO_ML[from as VolumeUnit];
      return ml / VOLUME_TO_ML[to as VolumeUnit];
    }
    case "count": {
      // Count units are only "convertible" when identical; anything else is
      // ambiguous (a "pack" has no fixed number of "ea") and must be handled
      // by the user entering matching purchase/usage units.
      throw new IncompatibleUnitError(fromUnit, toUnit);
    }
  }
}

/** Converts a value to its category's base unit (g / ml / ea). */
export function toBaseUnit(value: number, unit: string): number {
  const category = getUnitCategory(unit);
  return convertUnit(value, unit, getBaseUnit(category));
}

export const UNIT_OPTIONS: { value: Unit; label: string; category: UnitCategory }[] = [
  { value: "kg", label: "kg", category: "weight" },
  { value: "g", label: "g", category: "weight" },
  { value: "mg", label: "mg", category: "weight" },
  { value: "l", label: "L", category: "volume" },
  { value: "ml", label: "ml", category: "volume" },
  { value: "ea", label: "개", category: "count" },
  { value: "piece", label: "EA", category: "count" },
  { value: "pack", label: "팩", category: "count" },
  { value: "bottle", label: "병", category: "count" },
  { value: "can", label: "캔", category: "count" },
];
