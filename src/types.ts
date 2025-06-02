export interface TableData {
  columns: string[];
  rows: Row[];
}

export interface Row {
  name: string;
  annotation: string;
  attributes: Record<string, string>;
}

export interface CartesianSettings {
  xPositive: string;
  xNegative: string;
  yPositive: string;
  yNegative: string;
}

export interface CartesianPoint {
  x: number;
  y: number;
  name: string;
  annotation: string;
}
