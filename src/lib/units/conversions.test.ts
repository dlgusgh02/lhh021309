import { describe, expect, it } from "vitest";
import {
  convertUnit,
  getBaseUnit,
  getUnitCategory,
  IncompatibleUnitError,
  isSupportedUnit,
  toBaseUnit,
  UnsupportedUnitError,
} from "@/lib/units/conversions";

describe("getUnitCategory", () => {
  it("categorizes weight units", () => {
    expect(getUnitCategory("kg")).toBe("weight");
    expect(getUnitCategory("g")).toBe("weight");
    expect(getUnitCategory("mg")).toBe("weight");
  });

  it("categorizes volume units", () => {
    expect(getUnitCategory("l")).toBe("volume");
    expect(getUnitCategory("ml")).toBe("volume");
  });

  it("categorizes count units", () => {
    expect(getUnitCategory("ea")).toBe("count");
    expect(getUnitCategory("pack")).toBe("count");
  });

  it("is case-insensitive", () => {
    expect(getUnitCategory("KG")).toBe("weight");
  });

  it("throws for unknown units", () => {
    expect(() => getUnitCategory("stone")).toThrow(UnsupportedUnitError);
  });
});

describe("isSupportedUnit", () => {
  it("returns true for known units and false for unknown ones", () => {
    expect(isSupportedUnit("kg")).toBe(true);
    expect(isSupportedUnit("stone")).toBe(false);
  });
});

describe("convertUnit", () => {
  it("converts kg to g", () => {
    expect(convertUnit(1, "kg", "g")).toBe(1000);
  });

  it("converts g to kg", () => {
    expect(convertUnit(500, "g", "kg")).toBe(0.5);
  });

  it("converts L to ml", () => {
    expect(convertUnit(1, "l", "ml")).toBe(1000);
  });

  it("converts ml to L", () => {
    expect(convertUnit(250, "ml", "l")).toBe(0.25);
  });

  it("returns the same value when units are identical", () => {
    expect(convertUnit(42, "g", "g")).toBe(42);
  });

  it("throws when converting between incompatible categories (kg -> ml)", () => {
    expect(() => convertUnit(1, "kg", "ml")).toThrow(IncompatibleUnitError);
  });

  it("throws when converting between incompatible categories (l -> kg)", () => {
    expect(() => convertUnit(1, "l", "kg")).toThrow(IncompatibleUnitError);
  });

  it("throws when converting between different count units", () => {
    expect(() => convertUnit(1, "ea", "pack")).toThrow(IncompatibleUnitError);
  });

  it("throws for unsupported units", () => {
    expect(() => convertUnit(1, "stone", "g")).toThrow(UnsupportedUnitError);
  });
});

describe("getBaseUnit / toBaseUnit", () => {
  it("returns g / ml / ea as base units", () => {
    expect(getBaseUnit("weight")).toBe("g");
    expect(getBaseUnit("volume")).toBe("ml");
    expect(getBaseUnit("count")).toBe("ea");
  });

  it("normalizes a value to its base unit", () => {
    expect(toBaseUnit(1.5, "kg")).toBe(1500);
    expect(toBaseUnit(0.03, "l")).toBeCloseTo(30);
  });
});
