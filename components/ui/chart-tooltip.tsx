import { TooltipProps } from 'recharts';
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";


export const CustomTooltip = ({ active, payload, label }: {active: any, payload: any, label: any}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-accent shadow-md rounded-md p-2 text-primary">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p>count: {payload[0].value}</p>

      </div>
    );
  }

  return null;
};
