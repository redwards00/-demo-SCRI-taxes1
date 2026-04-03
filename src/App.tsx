/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  DollarSign, 
  MapPin, 
  TrendingDown, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Info,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from './lib/utils';
import { calculateFederalTax, calculateFICA } from './lib/tax-math';
import { getTaxRatesForLocation, TaxRates } from './services/taxService';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';

interface TaxResult {
  federal: number;
  fica: number;
  state: number;
  local: number;
  totalTax: number;
  takeHome: number;
  rates: TaxRates;
}

export default function App() {
  const [income1, setIncome1] = useState<string>('');
  const [income2, setIncome2] = useState<string>('');
  const [location1, setLocation1] = useState<string>('');
  const [location2, setLocation2] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    loc1: TaxResult;
    loc2?: TaxResult;
  } | null>(null);

  const calculateForLocation = async (loc: string, incomeNum: number): Promise<TaxResult> => {
    const rates = await getTaxRatesForLocation(loc);
    const federal = calculateFederalTax(incomeNum);
    const fica = calculateFICA(incomeNum);
    const state = incomeNum * rates.stateTaxRate;
    const local = incomeNum * rates.localTaxRate;
    const totalTax = federal + fica + state + local;
    const takeHome = incomeNum - totalTax;

    return {
      federal,
      fica,
      state,
      local,
      totalTax,
      takeHome,
      rates
    };
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const incomeNum1 = parseFloat(income1.replace(/,/g, ''));
    const incomeNum2 = parseFloat(income2.replace(/,/g, ''));

    if (isNaN(incomeNum1) || incomeNum1 <= 0) {
      setError('Please enter a valid annual income for Location 1.');
      return;
    }
    if (!location1.trim()) {
      setError('Please enter at least one location (City, State).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loc1Result = await calculateForLocation(location1, incomeNum1);
      let loc2Result: TaxResult | undefined;
      
      if (location2.trim()) {
        const finalIncome2 = isNaN(incomeNum2) || incomeNum2 <= 0 ? incomeNum1 : incomeNum2;
        loc2Result = await calculateForLocation(location2, finalIncome2);
      }

      setResults({
        loc1: loc1Result,
        loc2: loc2Result
      });
    } catch (err) {
      setError('Failed to fetch tax data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getChartData = (res: TaxResult) => [
    { name: 'Federal Tax', value: res.federal, color: '#BF5700' },
    { name: 'FICA', value: res.fica, color: '#E67E22' },
    { name: 'State Tax', value: res.state, color: '#D35400' },
    { name: 'Local Tax', value: res.local, color: '#A04000' },
    { name: 'Take-Home Pay', value: res.takeHome, color: '#10b981' },
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-burnt-orange/10">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-burnt-orange rounded-xl flex items-center justify-center shadow-lg shadow-burnt-orange/20">
              <Calculator className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Randy's TaxWise - Tax Comparison Tool</h1>
          </div>
          <div className="hidden sm:block text-sm text-slate-500 font-medium">
            2024-2025 Tax Estimator
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="space-y-8">
          {/* Input Section */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                Your Details
              </h2>
              <div className="flex items-center gap-4">
                <section className="bg-burnt-orange/5 rounded-2xl px-4 py-2 border border-burnt-orange/10 hidden sm:flex items-center gap-3">
                  <Info className="text-burnt-orange w-4 h-4" />
                  <p className="text-xs text-burnt-orange-dark font-medium">
                    2024 tax brackets used
                  </p>
                </section>
                <button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="px-8 py-3 bg-burnt-orange hover:bg-burnt-orange-dark disabled:bg-burnt-orange/30 text-white rounded-xl font-bold shadow-lg shadow-burnt-orange/20 transition-all flex items-center justify-center gap-2 group"
                >
                  {loading ? <Loader2 className="animate-spin size-5" /> : (
                    <>
                      Calculate
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>

            <form onSubmit={handleCalculate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Location 1 Column */}
              <div className="space-y-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-burnt-orange/10 rounded-lg flex items-center justify-center text-burnt-orange font-bold">1</div>
                  <h3 className="font-bold text-slate-700">Primary Location</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 ml-1">Annual Gross Income</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-burnt-orange transition-colors">
                      <DollarSign size={20} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 75,000"
                      value={income1}
                      onChange={(e) => setIncome1(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-burnt-orange/10 focus:border-burnt-orange outline-none transition-all text-lg font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 ml-1">City, State</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-burnt-orange transition-colors">
                      <MapPin size={20} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Austin, TX"
                      value={location1}
                      onChange={(e) => setLocation1(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-burnt-orange/10 focus:border-burnt-orange outline-none transition-all text-lg font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Location 2 Column */}
              <div className="space-y-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 font-bold">2</div>
                  <h3 className="font-bold text-slate-700">Comparison Location</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 ml-1">Annual Gross Income (Optional)</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-burnt-orange transition-colors">
                      <DollarSign size={20} />
                    </div>
                    <input
                      type="text"
                      placeholder="Same as primary if empty"
                      value={income2}
                      onChange={(e) => setIncome2(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-burnt-orange/10 focus:border-burnt-orange outline-none transition-all text-lg font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 ml-1">City, State</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-burnt-orange transition-colors">
                      <MapPin size={20} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Seattle, WA"
                      value={location2}
                      onChange={(e) => setLocation2(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-burnt-orange/10 focus:border-burnt-orange outline-none transition-all text-lg font-medium"
                    />
                  </div>
                </div>
              </div>
            </form>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}
          </section>

          {/* Results Section */}
          <div className="w-full">
            <AnimatePresence mode="wait">
              {!results ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <PieChartIcon className="text-slate-300 w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-400">Ready to compare?</h3>
                  <p className="text-slate-400 mt-2 max-w-xs">
                    Enter your income and at least one location to see your estimated tax breakdown.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className={cn("grid gap-8", results.loc2 ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1")}>
                    <ResultColumn 
                      title={results.loc1.rates.stateName} 
                      result={results.loc1} 
                      income={parseFloat(income1.replace(/,/g, ''))} 
                      formatCurrency={formatCurrency}
                      chartData={getChartData(results.loc1)}
                    />
                    {results.loc2 && (
                      <ResultColumn 
                        title={results.loc2.rates.stateName} 
                        result={results.loc2} 
                        income={parseFloat(income2.replace(/,/g, '')) || parseFloat(income1.replace(/,/g, ''))} 
                        formatCurrency={formatCurrency}
                        chartData={getChartData(results.loc2)}
                        isComparison
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-slate-400 text-sm">
        <p>© 2024 TaxWise. For estimation purposes only. Consult a tax professional for actual filings.</p>
      </footer>
    </div>
  );
}

function ResultColumn({ title, result, income, formatCurrency, chartData, isComparison }: { 
  title: string; 
  result: TaxResult; 
  income: number; 
  formatCurrency: (v: number) => string;
  chartData: any[];
  isComparison?: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Take Home Summary */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <TrendingUp size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-burnt-orange uppercase tracking-widest">{title} Take-Home</span>
            {isComparison && <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase">Comparison</span>}
          </div>
          <div className="text-4xl font-black text-slate-900 mb-6">
            {formatCurrency(result.takeHome)}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-2xl p-4">
              <span className="text-xs font-bold text-slate-500 uppercase">Monthly</span>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {formatCurrency(result.takeHome / 12)}
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <span className="text-xs font-bold text-slate-500 uppercase">Weekly</span>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {formatCurrency(result.takeHome / 52)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Breakdown */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
          <PieChartIcon className="text-burnt-orange" size={20} />
          Tax Breakdown
        </h3>
        
        <div className="space-y-8">
          {/* Chart Side */}
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tax</span>
              <span className="text-sm font-black text-slate-800">{formatCurrency(result.totalTax)}</span>
            </div>
          </div>

          {/* List Side */}
          <div className="space-y-3">
            <TaxRow label="Federal" amount={result.federal} color="#BF5700" />
            <TaxRow label="FICA" amount={result.fica} color="#E67E22" />
            <TaxRow label="State" amount={result.state} color="#D35400" />
            <TaxRow label="Local" amount={result.local} color="#A04000" />
            <TaxRow label="Take-Home" amount={result.takeHome} color="#10b981" />
            
            <div className="pt-4 mt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Effective Rate</span>
                <span className="text-md font-bold text-burnt-orange">
                  {((result.totalTax / income) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-burnt-orange h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${(result.totalTax / income) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 flex items-start gap-4">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
          <CheckCircle2 className="text-emerald-500 w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-emerald-900 text-sm">Verified: {result.rates.stateName}</h4>
          <p className="text-xs text-emerald-700 mt-1">
            {result.rates.isStateIncomeTaxFree 
              ? "No state income tax."
              : `Estimated ${ (result.rates.stateTaxRate * 100).toFixed(2) }% state rate.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function TaxRow({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{label}</span>
      </div>
      <span className="font-bold text-slate-800">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)}</span>
    </div>
  );
}
