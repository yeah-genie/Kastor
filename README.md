# Kastor v2 MVP

**AI-Native Data Workflow Builder**

Kastor allows users to build complex data pipelines using natural language, visualizing the logic as a stack of interactive blocks.

## Key Features

- **Flow-First, Chat-Assisted UX**: Build workflows by chatting with AI, then refine with GUI controls.
- **Block Stack Interface**: Visualize data logic with Load, Transform, Visualize, Insight, and Action blocks.
- **AI Assistant**:
    - **Chat-Only Onboarding**: Start with a focused chat interface.
    - **Actionable Responses**: AI generates blocks directly from conversation.
    - **Context Aware**: Reference blocks using `@Mentions`.
    - **File Upload**: Analyze CSV, Excel, and JSON files directly.
- **Advanced Canvas**:
    - **Infinite Canvas**: Zoom and Pan support.
    - **Minimap**: Overview of large workflows.
    - **Multi-Select**: Shift+Click to manage multiple blocks.
    - **Undo/Redo**: Full history support.
    - **Auto Layout**: Automatically organize blocks by type.
- **Robust Block Management**:
    - **Context Menu**: Right-click to Duplicate, Disable, or Delete.
    - **Grouping**: Organize blocks into collapsible groups (Scratch-style).
    - **Data Preview**: Hover over blocks/connections to see data samples.
    - **Error Handling**: Visual error states with "Fix with AI" suggestions.
- **Analyst Tools**:
    - **Code View**: Toggle `< >` mode to see the underlying Python/SQL logic for each block.
    - **Template Gallery**: Load pre-built workflows for Marketing, Finance, and Retention analysis.
    - **Execution Flow**: "Run Flow" button to simulate step-by-step data processing.

## Tech Stack

- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Framer Motion
- **State Management**: Zustand + Zundo (Undo/Redo)
- **Drag & Drop**: dnd-kit
- **Data Processing**: PapaParse (CSV), XLSX (Excel)
- **Testing**: Playwright

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Run E2E Tests**
    ```bash
    npx playwright test
    ```
