import { api } from "../api";
import { TableData } from "../types";
import useSWR from "swr";

export default function useTableData() {
  const {
    data: tableData,
    isLoading: isTableDataLoading,
    isValidating: isTableDataRefreshing,
    mutate: refreshTableData,
    error: tableDataError,
  } = useSWR<TableData>("table-data", async () => {
    return await api.getTableData();
  });

  return {
    tableData: tableData ?? {
      columns: [],
      rows: [],
    },
    isTableDataLoading,
    isTableDataRefreshing,
    refreshTableData,
    tableDataError,
  };
}
