export const MANUAL_CONTENT = `
# ARO User Manual
## Automated Research Orchestrator

ARO decomposes complex research topics into focused sub-tasks, assigns each to the most appropriate AI model, and helps you synthesize the results into a comprehensive knowledge base.

---

## Getting Started

### 1. Enter Your Research Topic
Use the **Research Topic** field on the home page to describe what you want to research. This is a multi-line text area — feel free to provide detailed context, scope, and specific areas of focus.

**Example:**
> Compare the effectiveness of transformer-based vs. diffusion-based architectures for image generation, focusing on quality metrics, training efficiency, and real-world deployment considerations.

### 2. Set a Research Objective (Optional)
The **Research Objective** field lets you specify what you want to achieve with the research output. This guides how the AI decomposes your topic.

**Examples:**
- "Write a comparison report for enterprise decision-makers"
- "Create a technical brief for the engineering team"
- "Produce a literature review for academic publication"

### 3. Select Target Models
Use the **Target Models** checkboxes to choose which AI models participate in the research. All four are selected by default:

- **Claude** — Best for deep analysis, reasoning, and synthesis tasks
- **ChatGPT** — Best for broad knowledge, creative framing, and alternative perspectives
- **Gemini** — Best for technical analysis, multimodal reasoning, and search-augmented tasks
- **Perplexity** — Best for fact-finding, citation-heavy, and current-events tasks

You must keep at least one model selected. Deselecting models you don't want allows the planner to focus task distribution on the remaining models.

### 4. Upload Context Files (Optional)
You can upload up to **5 files** (max 50KB each) as additional context. Supported formats: .txt, .md, .markdown, .csv.

Uploaded file contents are included in the prompt sent to the planner AI, helping it create a more targeted research plan based on your existing materials.

**How to upload:**
- Click the upload zone or drag files into it
- Files are read in your browser — nothing is uploaded to a server for storage
- Click "x" next to any file to remove it

### 5. Choose Export Format
Select how you want to export your research plan:
- **Markdown** — Downloads a .md file with the full plan
- **PDF** — Downloads a professionally formatted PDF document with task summary table and detailed task pages
- **Both** — Downloads both Markdown and PDF files

### 6. Generate the Plan
Click **Decompose** to send your topic to Claude Opus 4.6, which will analyze it and create a structured research plan with 5-20 sub-tasks.

---

## Understanding the Plan

### Strategy
A brief description of the overall research approach chosen by the planner.

### Model Distribution
Colored badges showing how many tasks are assigned to each AI model.

### Task List
Each task shows:
- **ID** — Unique identifier (task-1, task-2, etc.)
- **Model** — The assigned AI model (color-coded)
- **Title** — Brief description of the task
- **Dependencies** — Tasks that must complete before this one
- **Model Count** — A dropdown (1-4) controlling how many models run this task. Default is 2. Higher counts provide diverse perspectives but cost more.

Click any task row to expand it and see the full prompt that would be sent to the model.

### Synthesis Strategy
Describes how the results from all tasks should be combined into a final output.

---

## Viewing Previous Plans

Click **History** in the navigation bar to see all previously generated plans. Plans are saved automatically to your browser's local storage.

On the history page you can:
- Click any plan to expand and view its full details
- Delete individual plans
- Clear all saved plans

**Note:** Plans are stored in your browser only. They don't sync across devices or browsers, and clearing browser data will remove them.

---

## Exporting Results

After generating a plan, use the export buttons at the bottom:

- **Export [format]** — Downloads in your chosen format (Markdown, PDF, or both)
- **Export JSON** — Downloads the raw plan data as a JSON file (always available)

The PDF export includes:
- Title page with topic, objective, and generation date
- Task summary table
- Individual pages for each task with full prompts
- Synthesis strategy page

---

## Tips

- **Be specific** in your research topic. Instead of "AI trends", try "Emerging AI trends in healthcare diagnostics for 2025-2026, focusing on FDA-approved tools."
- **Use the objective** to control output style. A "technical report" objective produces different task decomposition than a "executive summary" objective.
- **Upload relevant files** like literature reviews, data dictionaries, or prior research to give the planner more context.
- **Adjust model counts** per task: set critical tasks to 3-4 models for diverse perspectives, and routine tasks to 1 model to save resources.
- **Deselect models** you don't have access to, so the planner won't assign tasks to them.

---

## FAQ

**Q: How much does it cost to generate a plan?**
A: Each plan generation uses Claude Opus 4.6. Typical cost is $0.25-$0.40 per plan depending on topic complexity.

**Q: Are my research topics stored on the server?**
A: No. Topics are sent to the Claude API for processing but are not stored on the server. Generated plans are saved only in your browser's local storage.

**Q: Can I edit a generated plan?**
A: Currently, you can adjust the model count per task. Full plan editing (reordering tasks, changing models, editing prompts) is planned for a future update.

**Q: What happens if plan generation times out?**
A: Complex topics may take up to 30 seconds to decompose. If it times out, try simplifying your topic or breaking it into smaller sub-topics.
`;
