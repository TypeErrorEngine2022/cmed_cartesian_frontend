import { useState, useEffect } from "react";
import { DataTable } from "./DataTable";
import { CartesianPlot } from "./CartesianPlot";
import { AxisSelector } from "./AxisSelector";
import { api } from "./api";
import { TableData, CartesianSettings } from "./types";
import { useAuth } from "./AuthContext";

function App() {
  const { logout } = useAuth();
  const [tableData, setTableData] = useState<TableData>({
    columns: [],
    rows: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plotSettings, setPlotSettings] = useState<CartesianSettings>({
    xPositive: "",
    xNegative: "",
    yPositive: "",
    yNegative: "",
  });
  // Add state for the full-screen drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load table data from the backend
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getTableData();
      setTableData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data from the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Handle plot settings change
  const handlePlotSettingsChange = (settings: CartesianSettings) => {
    setPlotSettings(settings);
    // Store settings in localStorage for persistence
    localStorage.setItem("cartesianPlotSettings", JSON.stringify(settings));
  };

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("cartesianPlotSettings");
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setPlotSettings(parsedSettings);
      } catch (err) {
        console.error("Error parsing saved plot settings:", err);
      }
    }
  }, []);

  // Toggle full-screen drawer
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);

    if (isDrawerOpen) {
      // prevent scrolling when the drawer is open
      document.body.style.overflow = "auto";
    } else {
      document.body.style.overflow = "hidden";
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        setIsDrawerOpen(false);
        document.body.style.overflow = "auto";
      }
    };

    // Add event listener when the drawer is open
    if (isDrawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">CMED Cartesian Plot</h1>
        <div className="flex items-center gap-4">
          <span>
            Welcome,{" "}
            {window.RUNTIME_CONFIG?.nickname ||
              import.meta.env.VITE_NICKNAME ||
              "admin"}
          </span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-500 rounded text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <DataTable data={tableData} onDataChange={fetchData} />
          </div>

          <div>
            <AxisSelector
              columns={tableData.columns}
              onSettingsChange={handlePlotSettingsChange}
            />

            {tableData.columns.length >= 4 && (
              <div className="mb-24 relative">
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={toggleDrawer}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none"
                    title="Magnify Plot"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5 8a1 1 0 011-1h1V6a1 1 0 012 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9H6a1 1 0 01-1-1z" />
                      <path
                        fillRule="evenodd"
                        d="M2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm6-4a4 4 0 100 8 4 4 0 000-8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <CartesianPlot data={tableData} settings={plotSettings} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full-screen drawer for the magnified plot */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-white bg-opacity-100 z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              Magnified Cartesian Plot
            </h2>
            <button
              onClick={toggleDrawer}
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
            >
              Close
            </button>
          </div>
          <div className="flex-1 p-4">
            <div className="w-full h-full">
              <CartesianPlot
                data={tableData}
                settings={plotSettings}
                fullScreen={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
