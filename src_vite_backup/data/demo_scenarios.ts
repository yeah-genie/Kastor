
// Curated Reality: High-Quality Demo Scenarios
// Inspired by real-world metrics (Open Startups & Kaggle Datasets) but anonymized/synthesized.

export type DemoCategory = 'SaaS' | 'Marketing' | 'Commerce' | 'Finance' | 'HR' | 'Operations';

export type DemoScenario = 'saas_churn' | 'marketing_roas' | 'commerce_stock' | 'finance_burn' | 'hr_turnover' | 'ops_delivery';

interface DataPoint {
  name: string;
  value: number;
  value2?: number;
  insight?: string;
}

interface ScenarioConfig {
    title: string;
    category: DemoCategory;
    description: string; // For the card UI
    primaryLabel: string;
    secondaryLabel: string;
    chartType: 'bar' | 'line' | 'pie' | 'composed';
    color1: string;
    color2: string;
    aiComment: string;
}

// --- DATA GENERATORS ---

// 1. SaaS: Churn Crisis
const genSaaSData = (): DataPoint[] => [
    { name: 'Jan', value: 12500, value2: 1.8, insight: 'Seed funding' },
    { name: 'Feb', value: 14200, value2: 1.9, insight: 'New pricing' },
    { name: 'Mar', value: 16800, value2: 2.1, insight: 'TechCrunch feature' },
    { name: 'Apr', value: 19500, value2: 2.5, insight: 'Server outage' },
    { name: 'May', value: 22100, value2: 4.8, insight: '⚠️ Churn Spike' },
    { name: 'Jun', value: 23400, value2: 7.2, insight: '🚨 Critical Risk' },
];

// 2. Marketing: Channel Flip
const genMarketingData = (): DataPoint[] => [
    { name: 'W1', value: 3.8, value2: 0.5, insight: 'FB Stable' },
    { name: 'W2', value: 3.6, value2: 1.2, insight: 'FB cost up' },
    { name: 'W3', value: 3.2, value2: 2.8, insight: 'TikTok viral' },
    { name: 'W4', value: 2.5, value2: 4.5, insight: 'FB Fatigue' },
    { name: 'W5', value: 2.1, value2: 5.8, insight: '⚠️ ROAS Drop' },
    { name: 'W6', value: 1.8, value2: 6.2, insight: 'TikTok Wins' },
];

// 3. Commerce: Stockout
const genCommerceData = (): DataPoint[] => [
    { name: 'D-5', value: 1500, value2: 4200, insight: 'Surge start' },
    { name: 'D-4', value: 2200, value2: 3100, insight: 'Weekend Peak' },
    { name: 'D-3', value: 2800, value2: 1800, insight: '⚠️ Low Stock' },
    { name: 'D-2', value: 3500, value2: 600, insight: '🚨 Stockout Risk' },
    { name: 'D-1', value: 800, value2: 0, insight: '📉 Revenue Lost' },
];

// 4. Finance: Burn Rate Runway (New)
// Story: Expenses (value2) overtake Cash (value), shortening runway.
const genFinanceData = (): DataPoint[] => [
    { name: 'Q1', value: 500000, value2: 45000, insight: 'Runway: 11mo' },
    { name: 'Q2', value: 455000, value2: 52000, insight: 'Hiring started' },
    { name: 'Q3', value: 403000, value2: 68000, insight: 'Marketing push' },
    { name: 'Q4', value: 335000, value2: 85000, insight: '⚠️ Burn increased' },
    { name: 'Q1+', value: 250000, value2: 92000, insight: '🚨 Runway < 3mo' },
];

// 5. HR: Turnover & eNPS (New)
// Story: eNPS (value) drops, Turnover (value2) rises.
const genHRData = (): DataPoint[] => [
    { name: 'Jan', value: 45, value2: 2, insight: 'Healthy Culture' },
    { name: 'Feb', value: 42, value2: 3, insight: 'Reorg rumored' },
    { name: 'Mar', value: 35, value2: 3, insight: 'Reorg announced' },
    { name: 'Apr', value: 15, value2: 8, insight: '⚠️ Morale drop' },
    { name: 'May', value: -5, value2: 12, insight: '🚨 Mass Resignation' },
];

// 6. Ops: Delivery Bottleneck (New)
// Story: Delivery Time (value) spikes, CS Tickets (value2) follow.
const genOpsData = (): DataPoint[] => [
    { name: 'Mon', value: 1.2, value2: 15, insight: 'Normal Ops' },
    { name: 'Tue', value: 1.3, value2: 18, insight: 'Heavy rain' },
    { name: 'Wed', value: 2.8, value2: 45, insight: '⚠️ Delay start' },
    { name: 'Thu', value: 3.5, value2: 88, insight: 'Hub congestion' },
    { name: 'Fri', value: 4.2, value2: 120, insight: '🚨 CS Overload' },
];


export const DEMO_DATA: Record<DemoScenario, DataPoint[]> = {
  saas_churn: genSaaSData(),
  marketing_roas: genMarketingData(),
  commerce_stock: genCommerceData(),
  finance_burn: genFinanceData(),
  hr_turnover: genHRData(),
  ops_delivery: genOpsData(),
};

export const SCENARIO_CONFIG: Record<DemoScenario, ScenarioConfig> = {
    saas_churn: {
        title: 'Churn Crisis Defense',
        category: 'SaaS',
        description: 'Analyze silent churn risks in Enterprise accounts.',
        primaryLabel: 'MRR ($)',
        secondaryLabel: 'Churn Rate (%)',
        chartType: 'composed',
        color1: '#3B82F6', // Blue
        color2: '#EF4444', // Red
        aiComment: "Revenue is up, but churn doubled in May. High-value accounts are leaving."
    },
    marketing_roas: {
        title: 'ROAS Channel Flip',
        category: 'Marketing',
        description: 'Optimize ad spend across FB, Google & TikTok.',
        primaryLabel: 'Facebook ROAS',
        secondaryLabel: 'TikTok ROAS',
        chartType: 'line',
        color1: '#94A3B8', // Slate
        color2: '#10B981', // Emerald
        aiComment: "Facebook efficiency collapsed. TikTok is now your primary growth driver."
    },
    commerce_stock: {
        title: 'Black Friday Stockout',
        category: 'Commerce',
        description: 'Predict inventory depletion before sales peak.',
        primaryLabel: 'Revenue ($)',
        secondaryLabel: 'Inventory (Units)',
        chartType: 'composed',
        color1: '#F59E0B', // Amber
        color2: '#6366F1', // Indigo
        aiComment: "You lost revenue on D-1 due to stockout. Reorder point needs adjustment."
    },
    finance_burn: {
        title: 'Burn Rate Runway',
        category: 'Finance',
        description: 'Track cashflow and predict runway end date.',
        primaryLabel: 'Cash Balance ($)',
        secondaryLabel: 'Monthly Burn ($)',
        chartType: 'composed',
        color1: '#10B981', // Emerald (Cash)
        color2: '#EF4444', // Red (Burn)
        aiComment: "Burn rate increased by 40% in Q4. Runway is now critical (<3 months)."
    },
    hr_turnover: {
        title: 'Talent Drain Alert',
        category: 'HR',
        description: 'Correlate eNPS scores with employee turnover.',
        primaryLabel: 'eNPS Score',
        secondaryLabel: 'Turnover (%)',
        chartType: 'composed',
        color1: '#8B5CF6', // Purple (eNPS)
        color2: '#F43F5E', // Rose (Turnover)
        aiComment: "eNPS dropped below zero in May, triggering a spike in resignations."
    },
    ops_delivery: {
        title: 'Delivery Bottleneck',
        category: 'Operations',
        description: 'Identify logistics delays affecting CS volume.',
        primaryLabel: 'Avg Delivery (Days)',
        secondaryLabel: 'CS Tickets',
        chartType: 'bar',
        color1: '#F97316', // Orange (Delay)
        color2: '#64748B', // Slate (Tickets)
        aiComment: "Delivery delays on Wed-Thu caused a 300% spike in CS tickets."
    }
};
