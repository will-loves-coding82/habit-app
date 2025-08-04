import { LineChart, XAxis, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { CustomTooltip } from "./ui/chart-tooltip";
import { CompletionHistory, Habit } from "@/app/types";
import React, { memo } from 'react';

type CompletionHistoryLineChartProps = {
    completionHistory: CompletionHistory,
    todayHabits: Habit[],
    weekHabits:  Map<string, Habit[]>
}

// Memo will prevent the chart from redrawing unless the provided props change
export const CompletionHistoryLineChart = memo(({completionHistory, todayHabits, weekHabits}: CompletionHistoryLineChartProps) => {
    
    return (
        <ResponsiveContainer width="100%" height="60%" className="py-4">
            <LineChart width={300} height={100} data={completionHistory}>
                <XAxis dataKey="day" hide />
                <Tooltip cursor={false} content={<CustomTooltip active={false} payload={[]} label={""} />} />
                <Line type="monotone" dataKey="count" strokeWidth={2} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    )

})