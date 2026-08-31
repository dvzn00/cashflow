"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function YearSelect({ year, years }: { year: number; years: number[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();

  return (
    <Select
      value={String(year)}
      disabled={pending}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams);
        params.set("ano", value);
        start(() => router.push(`${pathname}?${params}`, { scroll: false }));
      }}
    >
      <SelectTrigger className="h-8 w-[7.5rem]" aria-label="Ano do gráfico">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((option) => (
          <SelectItem key={option} value={String(option)}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
