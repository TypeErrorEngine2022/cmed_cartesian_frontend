import { useEffect, useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
  LabelList,
  ReferenceLine,
} from "recharts";
import { TableData, CartesianSettings, Row, CartesianPoint } from "./types";

interface CartesianPlotProps {
  data: TableData;
  settings: CartesianSettings;
  fullScreen?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="tooltip">
        <p className="font-bold">{data.name}</p>
        <p>
          Coordinates: ({data.x.toFixed(2)}, {data.y.toFixed(2)})
        </p>
        {data.annotation && (
          <p>
            <span className="font-semibold">Annotation:</span> {data.annotation}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const isValidNumber = (value: string): boolean => {
  return value !== "NA";
};

export const CartesianPlot: React.FC<CartesianPlotProps> = ({
  data,
  settings,
  fullScreen = false,
}) => {
  const [invalidPoints, setInvalidPoints] = useState<Row[]>([]);
  const { xPositive, xNegative, yPositive, yNegative } = settings;
  const [chartData, setChartData] = useState<CartesianPoint[]>([]);

  // Convert table data to plot points
  const prepareChartData = () => {
    const validRows: Row[] = [];
    const invalidRows: Row[] = [];
    for (const row of data.rows) {
      if (
        !isValidNumber(row.attributes[xPositive]) ||
        !isValidNumber(row.attributes[xNegative]) ||
        !isValidNumber(row.attributes[yPositive]) ||
        !isValidNumber(row.attributes[yNegative])
      ) {
        invalidRows.push(row);
      } else {
        validRows.push(row);
      }
    }

    setChartData(
      validRows.map((row) => {
        // Calculate X coordinate based on xPositive and xNegative values
        const xPosValue = parseFloat(row.attributes[xPositive] || "0");
        const xNegValue = parseFloat(row.attributes[xNegative] || "0");
        const xCoord = xPosValue - xNegValue;

        // Calculate Y coordinate based on yPositive and yNegative values
        const yPosValue = parseFloat(row.attributes[yPositive] || "0");
        const yNegValue = parseFloat(row.attributes[yNegative] || "0");
        const yCoord = yPosValue - yNegValue;

        return {
          x: xCoord,
          y: yCoord,
          name: row.name,
          annotation: row.annotation,
        };
      })
    );

    setInvalidPoints(invalidRows);
  };

  // Calculate dynamic domains based on data points
  const domains = useMemo(() => {
    if (chartData.length === 0) {
      return { x: [-10, 10], y: [-10, 10] }; // Default domain if no data
    }

    // Find min and max for x and y coordinates
    const xValues = chartData.map((point) => point.x);
    const yValues = chartData.map((point) => point.y);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    // for symmetry, we want to ensure the domain is centered around zero
    const maxX = Math.max(Math.abs(xMin), Math.abs(xMax));
    const maxY = Math.max(Math.abs(yMin), Math.abs(yMax));

    // Add some padding (20%) to the domain for better visualization
    const xPadding = Math.max(1, maxX * 2 * 0.2);
    const yPadding = Math.max(1, maxY * 2 * 0.2);

    return {
      x: [Math.floor(-maxX - xPadding), Math.ceil(maxX + xPadding)],
      y: [Math.floor(-maxY - yPadding), Math.ceil(maxY + yPadding)],
    };
  }, [chartData]);

  useEffect(() => {
    prepareChartData();
  }, [data, settings]);

  return (
    <div
      className={`cartesian-plot-container ${fullScreen ? "h-full" : "m-6"}`}
    >
      <ResponsiveContainer width="100%" height={fullScreen ? "90%" : 500}>
        <ScatterChart margin={{ top: 40, right: 50, bottom: 40, left: 50 }}>
          <CartesianGrid strokeDasharray="3 3" />

          {/* Reference lines for axes with labels at tips */}
          <ReferenceLine x={0} stroke="#000" strokeWidth={1.5}>
            <Label
              value={`${yPositive}`}
              position="top"
              offset={20}
              style={{ textAnchor: "middle" }}
            />
            <Label
              value={`${yNegative}`}
              position="bottom"
              offset={20}
              style={{ textAnchor: "middle" }}
            />
          </ReferenceLine>
          <ReferenceLine y={0} stroke="#000" strokeWidth={1.5}>
            <Label
              value={`${xNegative}`}
              position="left"
              offset={20}
              style={{ textAnchor: "end" }}
            />
            <Label
              value={`${xPositive}`}
              position="right"
              offset={20}
              style={{ textAnchor: "start" }}
            />
          </ReferenceLine>

          <XAxis
            type="number"
            dataKey="x"
            name="X"
            domain={domains.x}
            tickCount={11}
            axisLine={false}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Y"
            domain={domains.y}
            tickCount={11}
            axisLine={false}
          />

          <Tooltip content={<CustomTooltip />} />
          <Scatter
            name="Data Points"
            data={chartData}
            fill="#8884d8"
            shape="circle"
            isAnimationActive={false}
          >
            <LabelList
              dataKey="annotation"
              content={(props) => {
                const { name, value, cx, cy } = props;
                const annotation = value || "";
                return (
                  <text
                    x={typeof cx === "number" ? cx + 5 : 5}
                    y={cy}
                    textAnchor="start"
                    fill="#333"
                    fontSize={10}
                  >
                    {name}:{" "}
                    {annotation.toString().length <= 5 ? annotation : ""}
                  </text>
                );
              }}
            />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <ul>
        {invalidPoints.length > 0 && (
          <li className="text-red-600">
            <strong>無效的點：</strong> 部分點由於缺少或無效的數據而無法繪製。
          </li>
        )}
        {invalidPoints.map((row, index) => (
          <li key={index}>
            <span className="font-semibold">{row.name}</span>:{" "}
            {Object.values([xNegative, xPositive, yNegative, yPositive]).map(
              (axis) => (
                <span key={axis}>
                  {axis}={row.attributes[axis]}{" "}
                </span>
              )
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
