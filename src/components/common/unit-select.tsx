"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNIT_OPTIONS } from "@/lib/units/conversions";

interface UnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  weight: "무게",
  volume: "부피",
  count: "수량",
};

export function UnitSelect({ value, onChange, disabled, placeholder = "단위 선택" }: UnitSelectProps) {
  const grouped = UNIT_OPTIONS.reduce<Record<string, typeof UNIT_OPTIONS>>((acc, opt) => {
    (acc[opt.category] ??= []).push(opt);
    return acc;
  }, {});

  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(grouped).map(([category, options]) => (
          <SelectGroup key={category}>
            <SelectLabel>{CATEGORY_LABEL[category] ?? category}</SelectLabel>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
