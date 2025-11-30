import { Block, BlockType } from '../types';

export const generateMockCode = (block: Block): string => {
  switch (block.type) {
    case BlockType.LOAD:
       return `# Load Data
import pandas as pd

# Load CSV file
df = pd.read_csv("${block.config.fileName || 'sales_data.csv'}")

# Preview
print(f"Loaded {len(df)} rows")
print(df.head())`;

    case BlockType.TRANSFORM:
       return `# Transformation Logic
def clean_data(df):
    # Convert date column
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
    
    # Fill missing values
    df = df.fillna(0)
    
    return df

df = clean_data(df)`;

    case BlockType.VISUALIZE:
       return `# Visualization
import plotly.express as px

# Create Bar Chart
fig = px.bar(df, 
    x="${block.config.xAxis || 'date'}", 
    y="${block.config.yAxis || 'revenue'}",
    title="${block.config.title || 'Sales Overview'}"
)

fig.show()`;

    case BlockType.INSIGHT:
       return `# Generate Insights
from kastor.ai import analyze_metrics

# Analyze trends
insights = analyze_metrics(df, metrics=['growth', 'churn'])

for insight in insights:
    print(f"- {insight.description} (Confidence: {insight.confidence})")`;

    case BlockType.ACTION:
       return `# Action Item
def execute_action(action_id):
    print(f"Executing action: {action_id}")
    # Integration logic here...

execute_action("${block.id}")`;

    default:
       return `# Generic Block Logic
# Config: ${JSON.stringify(block.config, null, 2)}`;
  }
};

