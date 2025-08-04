export const CustomTooltip = ({ active, payload, label }) => {
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
