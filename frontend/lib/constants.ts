export interface Option {
  value: number;
  label: string;
  className: string; // badge colors
}

export const PROJECT_STATUS: Option[] = [
  { value: 0, label: "Not Started", className: "bg-slate-100 text-slate-700 ring-slate-500/20" },
  { value: 1, label: "In Progress", className: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  { value: 2, label: "Completed", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  { value: 3, label: "On Hold", className: "bg-amber-50 text-amber-800 ring-amber-600/20" },
];

export const TASK_STATUS: Option[] = [
  { value: 0, label: "To Do", className: "bg-slate-100 text-slate-700 ring-slate-500/20" },
  { value: 1, label: "In Progress", className: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  { value: 2, label: "Done", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  { value: 3, label: "Cancelled", className: "bg-red-50 text-red-700 ring-red-600/20" },
];

export const TASK_PRIORITY: Option[] = [
  { value: 0, label: "Low", className: "bg-slate-100 text-slate-600 ring-slate-500/20" },
  { value: 1, label: "Medium", className: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  { value: 2, label: "High", className: "bg-orange-50 text-orange-700 ring-orange-600/20" },
  { value: 3, label: "Critical", className: "bg-red-100 text-red-800 ring-red-600/30" },
];

export const findOption = (options: Option[], value: number): Option =>
  options.find((o) => o.value === value) ?? { value, label: `Unknown (${value})`, className: "bg-slate-100 text-slate-500 ring-slate-400/20" };
