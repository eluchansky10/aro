import type { Plan } from './types';

export async function planToPdfBlob(plan: Plan, objective?: string, taskModelCounts?: Record<string, number>): Promise<Blob> {
  // Dynamic import for code-splitting — jsPDF only loaded when PDF export is triggered
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text('Research Plan', 14, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  const topicLines = doc.splitTextToSize(plan.topic, 180);
  doc.text(topicLines, 14, y);
  y += topicLines.length * 6 + 4;

  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date(plan.created_at).toLocaleString()}`, 14, y);
  y += 6;
  if (objective) {
    const objLines = doc.splitTextToSize(`Objective: ${objective}`, 180);
    doc.text(objLines, 14, y);
    y += objLines.length * 5 + 4;
  }
  y += 6;

  // Strategy
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('Strategy', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const stratLines = doc.splitTextToSize(plan.strategy, 180);
  doc.text(stratLines, 14, y);
  y += stratLines.length * 5 + 10;

  // Task summary table
  autoTable(doc, {
    startY: y,
    head: [['ID', 'Title', 'Model', 'Models #', 'Priority', 'Dependencies']],
    body: plan.tasks.map(t => [
      t.id,
      t.title,
      t.target_model,
      String(taskModelCounts?.[t.id] ?? 2),
      String(t.priority),
      t.dependencies.join(', ') || 'None',
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [40, 40, 40], textColor: [230, 230, 230] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Task details — one section per task
  for (const task of plan.tasks) {
    doc.addPage();
    let ty = 20;

    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(`${task.id}: ${task.title}`, 14, ty);
    ty += 8;

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Model: ${task.target_model}  |  Priority: ${task.priority}  |  Models: ${taskModelCounts?.[task.id] ?? 2}`, 14, ty);
    ty += 6;
    if (task.dependencies.length > 0) {
      doc.text(`Dependencies: ${task.dependencies.join(', ')}`, 14, ty);
      ty += 6;
    }
    ty += 4;

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const promptLines = doc.splitTextToSize(task.prompt, 180);
    doc.text(promptLines, 14, ty);
  }

  // Synthesis strategy page
  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('Synthesis Strategy', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const synthLines = doc.splitTextToSize(plan.synthesis_strategy, 180);
  doc.text(synthLines, 14, 30);

  return doc.output('blob');
}
