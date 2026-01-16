"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Calculator,
  TrendingUp,
  Wallet,
  PieChart,
  Github, // Tambahan icon Github
} from "lucide-react";

// --- SHADCN IMPORTS ---
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// --- Tipe Data ---
type CompoundingFrequency = 1 | 4 | 12;

interface CalculationResult {
  year: number;
  invested: number;
  interest: number;
  total: number;
}

// --- Helper Formatters ---
const formatCurrency = (value: number | string | undefined) => {
  if (value === undefined || value === null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const formatCompactNumber = (number: number | string | undefined) => {
  const value = Number(number);
  if (!value) return "";

  const formatter = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  });

  if (value >= 1_000_000_000_000) {
    return formatter.format(value / 1_000_000_000_000) + " Triliun";
  }
  if (value >= 1_000_000_000) {
    return formatter.format(value / 1_000_000_000) + " Miliar";
  }
  if (value >= 1_000_000) {
    return formatter.format(value / 1_000_000) + " Juta";
  }
  if (value >= 1_000) {
    return formatter.format(value / 1_000) + " Ribu";
  }
  return "";
};

const formatNumberInput = (value: number | "") => {
  if (value === "") return "";
  return new Intl.NumberFormat("id-ID").format(value);
};

export default function CompoundingCalculator() {
  // --- State Input ---
  const [initialInvestment, setInitialInvestment] = useState<number | "">(
    10000000
  );
  const [monthlyContribution, setMonthlyContribution] = useState<number | "">(
    1000000
  );
  const [years, setYears] = useState<number | "">(10);
  const [interestRate, setInterestRate] = useState<number | "">(7);
  const [frequency, setFrequency] = useState<CompoundingFrequency>(12);

  // State Theme
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // --- Efek Deteksi Tema System ---
  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // --- Handlers ---
  const handleMoneyChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number | "") => void
  ) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setter(rawValue === "" ? "" : Number(rawValue));
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number | "") => void,
    isDecimal: boolean = false
  ) => {
    let value = e.target.value;
    if (isDecimal) value = value.replace(",", ".");
    if (value === "" || (isDecimal ? /^\d*\.?\d*$/ : /^\d*$/).test(value)) {
      setter(value === "" ? "" : Number(value));
    }
  };

  // --- Logika Kalkulasi ---
  const { data, summary } = useMemo(() => {
    const results: CalculationResult[] = [];
    const startAmount = initialInvestment === "" ? 0 : initialInvestment;
    const monthly = monthlyContribution === "" ? 0 : monthlyContribution;
    const durationYears = years === "" ? 0 : years;
    const rate = interestRate === "" ? 0 : interestRate;

    let currentBalance = startAmount;
    let totalInvested = startAmount;
    const r = rate / 100;
    const totalMonths = durationYears * 12;

    for (let m = 1; m <= totalMonths; m++) {
      currentBalance += monthly;
      totalInvested += monthly;
      const monthsPerCompound = 12 / frequency;

      if (m % monthsPerCompound === 0) {
        const ratePerPeriod = r / frequency;
        const interestEarned = (currentBalance - monthly) * ratePerPeriod;
        currentBalance += interestEarned;
      }

      if (m % 12 === 0) {
        results.push({
          year: m / 12,
          invested: totalInvested,
          interest: currentBalance - totalInvested,
          total: currentBalance,
        });
      }
    }

    const finalData = [
      { year: 0, invested: startAmount, interest: 0, total: startAmount },
      ...results,
    ];

    return {
      data: finalData,
      summary: {
        totalValue: currentBalance,
        totalInvested: totalInvested,
        totalInterest: currentBalance - totalInvested,
      },
    };
  }, [initialInvestment, monthlyContribution, years, interestRate, frequency]);

  // --- Chart Colors ---
  const chartColors = {
    grid: isDarkMode ? "#262626" : "#e2e8f0",
    text: isDarkMode ? "#a3a3a3" : "#64748b",
    tooltipBg: isDarkMode ? "#171717" : "#ffffff",
    tooltipBorder: isDarkMode ? "#404040" : "#e2e8f0",
    tooltipText: isDarkMode ? "#f5f5f5" : "#1e293b",
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-neutral-950 p-4 md:p-8 font-sans text-slate-900 dark:text-slate-200 flex flex-col">
      <div className="max-w-6xl mx-auto w-full grow">
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-3 text-slate-900 dark:text-white">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl border border-violet-200 dark:border-violet-500/20">
              <Calculator className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-violet-600 dark:text-violet-400">
              Kalkulator Bunga Majemuk
            </span>
          </h1>
          <p className="text-slate-500 dark:text-neutral-400 mt-2 text-lg">
            Simulasikan pertumbuhan aset Anda dengan desain adaptif.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* KOLOM KIRI: Input Form */}
          <div className="lg:col-span-4 space-y-6">
            {/* Menggunakan SHADCN Card */}
            <Card className="border-slate-200 dark:border-neutral-800 shadow-sm dark:shadow-xl bg-white dark:bg-neutral-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-800 dark:text-white">
                  <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-500" />
                  Parameter Investasi
                </CardTitle>
                <CardDescription>Sesuaikan angka di bawah ini.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Input: Investasi Awal */}
                <div className="space-y-2">
                  <Label
                    htmlFor="initial-investment"
                    className="text-slate-600 dark:text-neutral-400"
                  >
                    Investasi Awal
                  </Label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-slate-400 dark:text-neutral-500 sm:text-sm">
                        Rp
                      </span>
                    </div>
                    {/* Shadcn Input */}
                    <Input
                      id="initial-investment"
                      type="text"
                      inputMode="numeric"
                      value={formatNumberInput(initialInvestment)}
                      onChange={(e) =>
                        handleMoneyChange(e, setInitialInvestment)
                      }
                      className="pl-10 text-slate-900 dark:text-white bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 focus-visible:ring-violet-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Input: Kontribusi Bulanan */}
                <div className="space-y-2">
                  <Label
                    htmlFor="monthly-contribution"
                    className="text-slate-600 dark:text-neutral-400"
                  >
                    Kontribusi Bulanan
                  </Label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-slate-400 dark:text-neutral-500 sm:text-sm">
                        Rp
                      </span>
                    </div>
                    <Input
                      id="monthly-contribution"
                      type="text"
                      inputMode="numeric"
                      value={formatNumberInput(monthlyContribution)}
                      onChange={(e) =>
                        handleMoneyChange(e, setMonthlyContribution)
                      }
                      className="pl-10 text-slate-900 dark:text-white bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 focus-visible:ring-violet-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Input: Lama (Tahun) */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="years"
                      className="text-slate-600 dark:text-neutral-400"
                    >
                      Lama (Tahun)
                    </Label>
                    <div className="relative group">
                      <Input
                        id="years"
                        type="text"
                        inputMode="numeric"
                        value={years}
                        onChange={(e) => handleNumberChange(e, setYears)}
                        className="pr-10 text-center text-slate-900 dark:text-white bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 focus-visible:ring-violet-500"
                        placeholder="0"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-slate-400 dark:text-neutral-500 text-xs">
                          Thn
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Input: Bunga/Tahun */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="rate"
                      className="text-slate-600 dark:text-neutral-400"
                    >
                      Bunga/Tahun
                    </Label>
                    <div className="relative group">
                      <Input
                        id="rate"
                        type="text"
                        inputMode="decimal"
                        value={interestRate}
                        onChange={(e) =>
                          handleNumberChange(e, setInterestRate, true)
                        }
                        className="pr-10 text-center text-slate-900 dark:text-white bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 focus-visible:ring-violet-500"
                        placeholder="0"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-slate-400 dark:text-neutral-500 text-sm">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SHADCN Slider */}
                <div className="pt-2 pb-2">
                  <Slider
                    defaultValue={[typeof years === "number" ? years : 0]}
                    value={[typeof years === "number" ? years : 0]}
                    max={50}
                    min={1}
                    step={1}
                    onValueChange={(val) => setYears(val[0])}
                    className="cursor-pointer"
                  />
                </div>

                <Separator className="bg-slate-100 dark:bg-neutral-800" />

                {/* SHADCN Select (Dropdown) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="frequency"
                    className="text-slate-600 dark:text-neutral-400"
                  >
                    Frekuensi Compounding
                  </Label>
                  <Select
                    value={String(frequency)}
                    onValueChange={(val) =>
                      setFrequency(Number(val) as CompoundingFrequency)
                    }
                  >
                    <SelectTrigger
                      id="frequency"
                      className="w-full bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 focus:ring-violet-500"
                    >
                      <SelectValue placeholder="Pilih frekuensi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tahunan (1x/Tahun)</SelectItem>
                      <SelectItem value="4">Kuartalan (4x/Tahun)</SelectItem>
                      <SelectItem value="12">Bulanan (12x/Tahun)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Info Box */}
            <div className="bg-violet-50 dark:bg-violet-900/10 p-4 rounded-xl border border-violet-100 dark:border-violet-500/20">
              <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
                <strong>Catatan:</strong> Perhitungan ini adalah proyeksi. Hasil
                nyata dapat bervariasi tergantung pada kondisi pasar.
              </p>
            </div>
          </div>

          {/* KOLOM KANAN: Hasil & Grafik */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card Summary 1 */}
              <Card className="border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-slate-100 dark:bg-neutral-800 rounded-lg">
                      <Wallet className="w-5 h-5 text-slate-600 dark:text-neutral-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-500 dark:text-neutral-400">
                      Total Pokok
                    </span>
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                      {formatCurrency(summary.totalInvested)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1 font-medium">
                      ≈ {formatCompactNumber(summary.totalInvested)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card Summary 2 */}
              <Card className="border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-500 dark:text-neutral-400">
                      Total Bunga
                    </span>
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
                      +{formatCurrency(summary.totalInterest)}
                    </p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1 font-medium">
                      ≈ {formatCompactNumber(summary.totalInterest)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card Summary 3 (Highlight) */}
              <Card className="border-violet-500/30 bg-linear-to-br from-violet-600 to-indigo-700 dark:from-violet-700 dark:to-indigo-800 shadow-lg shadow-violet-200 dark:shadow-violet-900/20">
                <CardContent className="p-6 flex flex-col justify-between h-full text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <PieChart className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-violet-100">
                      Nilai Akhir
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold truncate">
                      {formatCurrency(summary.totalValue)}
                    </p>
                    <p className="text-xs text-violet-200/80 mt-1 font-medium">
                      ≈ {formatCompactNumber(summary.totalValue)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart Section */}
            <Card className="border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 h-125">
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-white">
                  Proyeksi Pertumbuhan
                </CardTitle>
              </CardHeader>
              <CardContent className="h-105">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorTotal"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8b5cf6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorInvested"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={isDarkMode ? "#737373" : "#94a3b8"}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={isDarkMode ? "#737373" : "#94a3b8"}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={chartColors.grid}
                    />
                    <XAxis
                      dataKey="year"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      tickFormatter={(value) => `Thn ${value}`}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (value >= 1000000000)
                          return `${(value / 1000000000).toFixed(1)}M`;
                        if (value >= 1000000)
                          return `${(value / 1000000).toFixed(0)}jt`;
                        return String(value);
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        borderRadius: "12px",
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        color: chartColors.tooltipText,
                      }}
                      itemStyle={{ color: isDarkMode ? "#e5e5e5" : "#334155" }}
                      formatter={(
                        value:
                          | number
                          | string
                          | Array<number | string>
                          | undefined
                      ) => {
                        return formatCurrency(
                          value as number | string | undefined
                        );
                      }}
                      labelFormatter={(label) => `Tahun ke-${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Total Saldo"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                    />
                    <Area
                      type="monotone"
                      dataKey="invested"
                      name="Uang Pokok"
                      stroke={isDarkMode ? "#737373" : "#94a3b8"}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={1}
                      fill="url(#colorInvested)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* --- FOOTER: DEVELOPED BY --- */}
        <div className="mt-16 mb-8 flex justify-center">
          <a
            href="https://github.com/Satria-Kurniawan"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-violet-500/50 dark:hover:border-violet-500/50 transition-all duration-300"
          >
            <span className="text-xs font-medium text-slate-500 dark:text-neutral-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              Developed by
            </span>
            <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-neutral-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                Satria Kurniawan
              </span>
              <Github className="w-4 h-4 text-slate-400 dark:text-neutral-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
            </div>
          </a>
        </div>
        {/* --- END FOOTER --- */}
      </div>
    </div>
  );
}
