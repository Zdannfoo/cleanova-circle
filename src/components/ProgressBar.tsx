interface ProgressBarProps {
  percent: number;
  completed?: boolean;
}

export default function ProgressBar({ percent, completed }: ProgressBarProps) {
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
      <div
        className={`h-full rounded-full ${completed ? "bg-green-500" : "bg-blue-500"}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
} 