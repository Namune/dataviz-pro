import { create } from 'zustand';

export interface Dataset {
  id: string;
  name: string;
  columns: string[];
  rows: Record<string, any>[];
  uploadedAt: Date;
}

interface DataStore {
  dataset: Dataset | null;
  setDataset: (dataset: Dataset | null) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  chartType: string;
  setChartType: (type: string) => void;
  chartOptions: any;
  setChartOptions: (options: any) => void;
}

export const useDataStore = create<DataStore>((set) => ({
  dataset: null,
  setDataset: (dataset) => set({ dataset }),
  currentStep: 0,
  setCurrentStep: (step) => set({ currentStep: step }),
  chartType: 'bar',
  setChartType: (type) => set({ chartType: type }),
  chartOptions: {},
  setChartOptions: (options) => set({ chartOptions: options }),
}));
