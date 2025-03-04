"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Mock ETF data
const mockETFData = {
  "SWDA": { name: "SWDA - World Stocks", returns: [0.08, 0.09, 0.07, 0.10, 0.06], volatility: 0.15, maxDrawdown: 0.35, crisis2008: -0.45 },
  "SPY": { name: "SPY - US Stocks", returns: [0.10, 0.12, 0.09, 0.11, 0.08], volatility: 0.18, maxDrawdown: 0.40, crisis2008: -0.50 },
  "SHY": { name: "SHY - Short-Term Bonds", returns: [0.02, 0.03, 0.02, 0.02, 0.03], volatility: 0.03, maxDrawdown: 0.05, crisis2008: -0.02 },
  "TLT": { name: "TLT - Long-Term Bonds", returns: [0.04, 0.05, 0.03, 0.04, 0.05], volatility: 0.10, maxDrawdown: 0.15, crisis2008: 0.20 },
  "CASH": { name: "Cash", returns: [0.01, 0.01, 0.01, 0.01, 0.01], volatility: 0.01, maxDrawdown: 0.00, crisis2008: 0.00 },
  "CRYPTO": { name: "Cryptocurrency", returns: [0.25, -0.15, 0.40, -0.20, 0.30], volatility: 0.60, maxDrawdown: 0.70, crisis2008: null }
};

// Form schema
const formSchema = z.object({
  salaryAllocation: z.coerce.number().min(1, "Must be at least $1"),
  targetType: z.enum(["multiplier", "value"]),
  targetMultiplier: z.coerce.number().optional(),
  targetValue: z.coerce.number().optional(),
  investmentPeriod: z.coerce.number().min(1, "Must be at least 1 year").max(50, "Must be less than 50 years"),
  currentAllocation: z.object({
    stocks: z.coerce.number().min(0).max(100),
    bonds: z.coerce.number().min(0).max(100),
    cash: z.coerce.number().min(0).max(100),
    crypto: z.coerce.number().min(0).max(100),
  }).refine(data => {
    const sum = data.stocks + data.bonds + data.cash + data.crypto;
    return sum === 100;
  }, {
    message: "Allocation must sum to 100%",
    path: ["currentAllocation"],
  }),
  riskTolerance: z.enum(["low", "medium", "high"]),
});

const formStyles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  error: {
    color: 'red',
    fontSize: '14px',
    marginTop: '5px',
  },
  button: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  radioGroup: {
    display: 'flex',
    gap: '10px',
  },
  allocationGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  results: {
    marginTop: '30px',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  resultTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  resultItem: {
    marginBottom: '10px',
  },
};

export default function PortfolioOptimizer() {
  const [optimizedAllocation, setOptimizedAllocation] = useState(null);
  const [projections, setProjections] = useState(null);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [stressTest, setStressTest] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salaryAllocation: 1000,
      targetType: "multiplier",
      targetMultiplier: 10,
      targetValue: 1000000,
      investmentPeriod: 30,
      currentAllocation: {
        stocks: 60,
        bonds: 30,
        cash: 10,
        crypto: 0,
      },
      riskTolerance: "medium",
    },
  });

  const optimizePortfolio = (data) => {
    setIsCalculating(true);
    
    setTimeout(() => {
      // Map current allocation to ETFs
      const currentMappedAllocation = {
        "SWDA": data.currentAllocation.stocks * 0.4,
        "SPY": data.currentAllocation.stocks * 0.6,
        "SHY": data.currentAllocation.bonds * 0.5,
        "TLT": data.currentAllocation.bonds * 0.5,
        "CASH": data.currentAllocation.cash,
        "CRYPTO": data.currentAllocation.crypto,
      };

      // Calculate optimized allocation based on risk tolerance
      let optimizedAllocation = data.riskTolerance === "low" 
        ? { "SWDA": 30, "SPY": 20, "SHY": 30, "TLT": 15, "CASH": 5, "CRYPTO": 0 }
        : data.riskTolerance === "medium"
        ? { "SWDA": 40, "SPY": 30, "SHY": 15, "TLT": 10, "CASH": 3, "CRYPTO": 2 }
        : { "SWDA": 45, "SPY": 35, "SHY": 5, "TLT": 5, "CASH": 0, "CRYPTO": 10 };

      // Calculate metrics (simplified for this example)
      const calculateMetrics = (allocation) => ({
        expectedReturn: Object.entries(allocation).reduce((sum, [etf, weight]) => 
          sum + (mockETFData[etf].returns.reduce((a, b) => a + b, 0) / mockETFData[etf].returns.length) * weight / 100, 0),
        volatility: Object.entries(allocation).reduce((sum, [etf, weight]) => 
          sum + mockETFData[etf].volatility * weight / 100, 0),
        maxDrawdown: Math.max(...Object.entries(allocation).map(([etf, weight]) => 
          mockETFData[etf].maxDrawdown * weight / 100)),
        crisis2008Impact: Object.entries(allocation).reduce((sum, [etf, weight]) => 
          sum + (mockETFData[etf].crisis2008 || 0) * weight / 100, 0)
      });

      const currentMetrics = calculateMetrics(currentMappedAllocation);
      const optimizedMetrics = calculateMetrics(optimizedAllocation);

      // Generate projections
      const generateProjections = (metrics, years, monthlyContribution) => {
        let projections = [];
        let currentValue = 0;
        for (let year = 0; year <= years; year++) {
          if (year > 0) {
            currentValue += monthlyContribution * 12;
            currentValue *= (1 + metrics.expectedReturn);
          }
          projections.push({ year, value: Math.round(currentValue) });
        }
        return projections;
      };

      const currentProjections = generateProjections(currentMetrics, data.investmentPeriod, data.salaryAllocation);
      const optimizedProjections = generateProjections(optimizedMetrics, data.investmentPeriod, data.salaryAllocation);

      // Calculate target value
      let targetValue = data.targetType === "multiplier" 
        ? data.salaryAllocation * 12 * data.targetMultiplier
        : data.targetValue;

      // Set results
      setOptimizedAllocation(optimizedAllocation);
      setRiskMetrics({ current: currentMetrics, optimized: optimizedMetrics });
      setProjections({ current: currentProjections, optimized: optimizedProjections, targetValue });
      setStressTest({
        current: {
          crisis2008: currentMetrics.crisis2008Impact,
          recovery: Math.ceil(Math.abs(currentMetrics.crisis2008Impact) / currentMetrics.expectedReturn)
        },
        optimized: {
          crisis2008: optimizedMetrics.crisis2008Impact,
          recovery: Math.ceil(Math.abs(optimizedMetrics.crisis2008Impact) / optimizedMetrics.expectedReturn)
        }
      });
      
      setIsCalculating(false);
    }, 1500);
  };

  return (
    <div style={formStyles.container}>
      <h2 style={formStyles.title}>Portfolio Optimizer</h2>
      <form onSubmit={form.handleSubmit(optimizePortfolio)} style={formStyles.form}>
        <div>
          <label style={formStyles.label}>
            Monthly Salary Allocation ($)
            <input
              type="number"
              {...form.register("salaryAllocation")}
              style={formStyles.input}
            />
          </label>
          {form.formState.errors.salaryAllocation && (
            <p style={formStyles.error}>{form.formState.errors.salaryAllocation.message}</p>
          )}
        </div>

        <div>
          <label style={formStyles.label}>
            Investment Period (Years)
            <input
              type="number"
              {...form.register("investmentPeriod")}
              style={formStyles.input}
            />
          </label>
          {form.formState.errors.investmentPeriod && (
            <p style={formStyles.error}>{form.formState.errors.investmentPeriod.message}</p>
          )}
        </div>

        <div>
          <p style={formStyles.label}>Target Type</p>
          <div style={formStyles.radioGroup}>
            <label>
              <input
                type="radio"
                value="multiplier"
                {...form.register("targetType")}
              />
              Target Retirement Size (Multiplier)
            </label>
            <label>
              <input
                type="radio"
                value="value"
                {...form.register("targetType")}
              />
              Target Portfolio Value ($)
            </label>
          </div>
        </div>

        {form.watch("targetType") === "multiplier" && (
          <div>
            <label style={formStyles.label}>
              Target Retirement Size (x Annual Salary)
              <input
                type="number"
                {...form.register("targetMultiplier")}
                style={formStyles.input}
              />
            </label>
          </div>
        )}

        {form.watch("targetType") === "value" && (
          <div>
            <label style={formStyles.label}>
              Target Portfolio Value ($)
              <input
                type="number"
                {...form.register("targetValue")}
                style={formStyles.input}
              />
            </label>
          </div>
        )}

        <div>
          <p style={formStyles.label}>Current Portfolio Allocation (%)</p>
          <div style={formStyles.allocationGrid}>
            <label>
              Stocks
              <input
                type="number"
                {...form.register("currentAllocation.stocks")}
                style={formStyles.input}
              />
            </label>
            <label>
              Bonds
              <input
                type="number"
                {...form.register("currentAllocation.bonds")}
                style={formStyles.input}
              />
            </label>
            <label>
              Cash
              <input
                type="number"
                {...form.register("currentAllocation.cash")}
                style={formStyles.input}
              />
            </label>
            <label>
              Crypto
              <input
                type="number"
                {...form.register("currentAllocation.crypto")}
                style={formStyles.input}
              />
            </label>
          </div>
          {form.formState.errors.currentAllocation && (
            <p style={formStyles.error}>{form.formState.errors.currentAllocation.message}</p>
          )}
        </div>

        <div>
          <label style={formStyles.label}>
            Risk Tolerance
            <select
              {...form.register("riskTolerance")}
              style={formStyles.input}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          style={formStyles.button}
          disabled={isCalculating}
        >
          {isCalculating ? "Optimizing..." : "Optimize Portfolio"}
        </button>
      </form>

      {optimizedAllocation && (
        <div style={formStyles.results}>
          <h3 style={formStyles.resultTitle}>Optimized Portfolio</h3>
          <div style={formStyles.resultItem}>
            <strong>Optimized Allocation:</strong>
            <ul>
              {Object.entries(optimizedAllocation).map(([etf, allocation]) => (
                <li key={etf}>{mockETFData[etf].name}: {allocation}%</li>
              ))}
            </ul>
          </div>
          <div style={formStyles.resultItem}>
            <strong>Risk Metrics:</strong>
            <p>Expected Return: {(riskMetrics.optimized.expectedReturn * 100).toFixed(2)}%</p>
            <p>Volatility: {(riskMetrics.optimized.volatility * 100).toFixed(2)}%</p>
            <p>Max Drawdown: {(riskMetrics.optimized.maxDrawdown * 100).toFixed(2)}%</p>
          </div>
          <div style={formStyles.resultItem}>
            <strong>Stress Test:</strong>
            <p>2008 Crisis Impact: {(stressTest.optimized.crisis2008 * 100).toFixed(2)}%</p>
            <p>Recovery Time: {stressTest.optimized.recovery} years</p>
          </div>
          <div style={formStyles.resultItem}>
            <strong>Projections:</strong>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={projections.optimized}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" name="Portfolio Value" />
                <Line type="monotone" dataKey="targetValue" stroke="#82ca9d" name="Target Value" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}