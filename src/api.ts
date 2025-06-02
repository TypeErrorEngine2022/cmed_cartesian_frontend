import axios from "axios";
import { TableData } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Configure axios to include credentials with requests
axios.defaults.withCredentials = true;

// Check if we have a token in local storage and set it in axios headers
const token = localStorage.getItem("authToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export const api = {
  getTableData: async (): Promise<TableData> => {
    const response = await axios.get(`${API_URL}/table`);
    return response.data;
  },

  addColumn: async (column_name: string): Promise<void> => {
    await axios.post(`${API_URL}/column`, { column_name });
  },

  addRow: async (name: string): Promise<void> => {
    await axios.post(`${API_URL}/row`, { name });
  },

  updateRowName: async (old_name: string, new_name: string): Promise<void> => {
    await axios.put(`${API_URL}/row/${old_name}/name`, { new_name });
  },

  updateCell: async (
    row_id: string,
    column_name: string,
    value: string
  ): Promise<void> => {
    await axios.put(`${API_URL}/cell`, { row_id, column_name, value });
  },

  updateAnnotation: async (
    row_id: string,
    annotation: string
  ): Promise<void> => {
    await axios.put(`${API_URL}/annotation`, { row_id, annotation });
  },

  deleteColumn: async (column_name: string): Promise<void> => {
    await axios.delete(`${API_URL}/column/${column_name}`);
  },

  deleteRow: async (row_name: string): Promise<void> => {
    await axios.delete(`${API_URL}/row/${row_name}`);
  },

  exportTable: async (): Promise<{
    data: TableData;
    timestamp: string;
    version: string;
  }> => {
    const response = await axios.get(`${API_URL}/export`);
    return response.data;
  },

  importTable: async (data: TableData): Promise<void> => {
    await axios.post(`${API_URL}/import`, { data });
  },
};
