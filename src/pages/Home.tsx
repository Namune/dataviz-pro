import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import {
  Upload,
  Table,
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  Settings,
  Download,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import { useDataStore } from '@/store/useDataStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CHART_COLORS = [
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#3B82F6',
  '#14B8A6',
];

const CHART_TYPES = [
  { id: 'bar', label: '柱状图', icon: BarChart3 },
  { id: 'line', label: '折线图', icon: LineChart },
  { id: 'pie', label: '饼图', icon: PieChart },
  { id: 'scatter', label: '散点图', icon: ScatterChart },
];

const SAMPLE_DATA = `Product,Q1 2023,Q2 2023,Q3 2023,Q4 2023
Laptops,45000,52000,61000,75000
Phones,85000,92000,88000,95000
Tablets,32000,38000,42000,48000
Accessories,15000,18000,22000,25000
Software,40000,45000,52000,60000`;

export default function Home() {
  const { dataset, setDataset, currentStep, setCurrentStep, chartType, setChartType, chartOptions, setChartOptions } = useDataStore();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<any>(null);

  const [chartConfig, setChartConfig] = useState({
    title: '数据可视化',
    xAxis: '',
    yAxis: '',
    selectedColumns: [] as string[],
  });

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('请上传 CSV 文件！');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const columns = Object.keys(results.data[0] as Record<string, any>);
          setDataset({
            id: Date.now().toString(),
            name: file.name,
            columns,
            rows: results.data as Record<string, any>[],
            uploadedAt: new Date(),
          });
          setChartConfig((prev) => ({
            ...prev,
            xAxis: columns[0],
            yAxis: columns[1] || columns[0],
            selectedColumns: columns.slice(1, 3),
          }));
          setCurrentStep(1);
        }
      },
    });
  }, [setDataset, setCurrentStep]);

  const loadSampleData = () => {
    const blob = new Blob([SAMPLE_DATA], { type: 'text/csv' });
    const file = new File([blob], 'sample-sales-data.csv', { type: 'text/csv' });
    handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => {
    setDragOver(false);
  };

  const removeDataset = () => {
    setDataset(null);
    setCurrentStep(0);
  };

  const cleanData = () => {
    if (!dataset) return;
    const cleanedRows = dataset.rows.filter((row) => {
      return Object.values(row).some((val) => val !== '' && val !== null && val !== undefined);
    });
    setDataset({ ...dataset, rows: cleanedRows });
  };

  const getChartData = () => {
    if (!dataset) return null;

    const labels = dataset.rows.map((row) => row[chartConfig.xAxis] || '');
    
    const datasets = chartConfig.selectedColumns.map((col, index) => ({
      label: col,
      data: dataset.rows.map((row) => {
        const val = row[col];
        return typeof val === 'number' ? val : parseFloat(val) || 0;
      }),
      backgroundColor: CHART_COLORS[index % CHART_COLORS.length] + '80',
      borderColor: CHART_COLORS[index % CHART_COLORS.length],
      borderWidth: 2,
      fill: chartType === 'line',
      tension: 0.4,
    }));

    return { labels, datasets };
  };

  const renderChart = () => {
    const data = getChartData();
    if (!data) return null;

    const options = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            font: { family: 'Inter', size: 12 },
            color: '#0F172A',
          },
        },
        title: {
          display: true,
          text: chartConfig.title,
          font: { family: 'Inter', size: 18, weight: 'bold' as const },
          color: '#0F172A',
        },
        tooltip: {
          backgroundColor: '#0F172A',
          titleFont: { family: 'Inter' },
          bodyFont: { family: 'Inter' },
        },
      },
      scales: chartType !== 'pie' ? {
        y: {
          beginAtZero: true,
          grid: { color: '#E2E8F0' },
        },
        x: {
          grid: { display: false },
        },
      } : undefined,
    };

    switch (chartType) {
      case 'bar':
        return <Bar data={data} options={options} ref={chartRef} />;
      case 'line':
        return <Line data={data} options={options} ref={chartRef} />;
      case 'pie':
        return <Pie data={data} options={options} ref={chartRef} />;
      case 'scatter':
        return <Scatter data={data} options={options} ref={chartRef} />;
      default:
        return <Bar data={data} options={options} ref={chartRef} />;
    }
  };

  const downloadChart = () => {
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = chartRef.current?.toBase64Image() || '';
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-cyan-600 bg-clip-text text-transparent">
                DataViz Pro
              </h1>
              <p className="text-xs text-slate-500">零代码数据可视化工具</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                  currentStep + 1 >= step
                    ? "bg-cyan-100 text-cyan-700"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    currentStep + 1 >= step ? "bg-cyan-500 text-white" : "bg-slate-300 text-slate-500"
                  )}
                >
                  {currentStep + 1 > step ? <CheckCircle2 size={14} /> : step}
                </div>
                <span className="text-sm font-medium hidden md:block">
                  {step === 1 ? "上传数据" : step === 2 ? "处理数据" : "生成图表"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {currentStep === 0 && !dataset && (
          <div className="max-w-3xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                将数据变成洞察
              </h2>
              <p className="text-xl text-slate-600">
                上传 CSV 文件，通过简单点击生成专业级数据图表。
              </p>
            </div>

            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden",
                dragOver
                  ? "border-cyan-500 bg-cyan-50 scale-[1.02]"
                  : "border-slate-300 bg-white hover:border-cyan-400 hover:bg-slate-50"
              )}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent opacity-50" />
              
              <div className="relative p-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Upload size={40} className="text-cyan-500 group-hover:text-cyan-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  {dragOver ? "松开文件开始上传" : "拖拽 CSV 文件到此处"}
                </h3>
                <p className="text-slate-500 mb-6">
                  或者点击浏览选择文件
                </p>
                
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />

                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 transition-all duration-300"
                  >
                    选择文件
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadSampleData();
                    }}
                    className="px-8 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
                  >
                    加载示例数据
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && dataset && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet size={18} className="text-cyan-500" />
                    数据集信息
                  </h3>
                  <button
                    onClick={removeDataset}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">文件名称</span>
                    <span className="text-slate-800 font-mono truncate max-w-[150px]">{dataset.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">行数</span>
                    <span className="text-slate-800 font-medium">{dataset.rows.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">列数</span>
                    <span className="text-slate-800 font-medium">{dataset.columns.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Filter size={18} className="text-cyan-500" />
                  数据清洗
                </h3>
                <button
                  onClick={cleanData}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium text-sm transition-colors border border-slate-200"
                >
                  清理空值行
                </button>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all hover:shadow-xl hover:shadow-cyan-500/30 flex items-center justify-center gap-2"
              >
                继续生成图表
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Table size={18} />
                    数据预览
                  </h3>
                  <span className="text-xs text-slate-500">
                    显示前 10 行
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {dataset.columns.map((col) => (
                          <th key={col} className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataset.rows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className={cn("border-b border-slate-100 hover:bg-slate-50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                          {dataset.columns.map((col) => (
                            <td key={col} className="px-6 py-4 text-slate-600 font-mono text-xs">
                              {String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && dataset && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-cyan-500" />
                  图表类型
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {CHART_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isActive = chartType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setChartType(type.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all duration-200",
                          isActive
                            ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        )}
                      >
                        <Icon size={24} />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Settings size={18} className="text-cyan-500" />
                  图表配置
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">图表标题</label>
                    <input
                      type="text"
                      value={chartConfig.title}
                      onChange={(e) => setChartConfig({ ...chartConfig, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">X 轴 / 标签列</label>
                    <select
                      value={chartConfig.xAxis}
                      onChange={(e) => setChartConfig({ ...chartConfig, xAxis: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 outline-none bg-white"
                    >
                      {dataset.columns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">数据列 (多选)</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
                      {dataset.columns.map((col) => (
                        <label key={col} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={chartConfig.selectedColumns.includes(col)}
                            onChange={(e) => {
                              const current = chartConfig.selectedColumns;
                              const next = e.target.checked
                                ? [...current, col]
                                : current.filter((c) => c !== col);
                              setChartConfig({ ...chartConfig, selectedColumns: next });
                            }}
                            className="rounded text-cyan-500 focus:ring-cyan-500"
                          />
                          <span className="text-sm text-slate-700">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  返回
                </button>
                <button
                  onClick={downloadChart}
                  className="flex-1 py-3 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600 shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  导出
                </button>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[600px] flex flex-col items-center justify-center">
                {renderChart()}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
