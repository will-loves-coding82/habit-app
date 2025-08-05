import { CompletionHistory, Habit } from "@/app/types";
import React, { memo } from 'react';
import { calculateBaseWeekDays } from "@/lib/functions";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

type CompletionHistoryLineChartProps = {
    completionHistory: CompletionHistory,
    todayHabits: Habit[],
    weekHabits: Map<string, Habit[]>
}


export const CompletionHistoryLineChart = memo(({ completionHistory, todayHabits, weekHabits }: CompletionHistoryLineChartProps) => {

    const labels = calculateBaseWeekDays();

    const data = {
        labels,
        datasets: [{
            data: completionHistory,
            borderColor: 'rgba(46, 136, 172, 1)',
            tension: 0.3,
            pointBackgroundColor: 'rgba(46, 136, 172, 1)'
        }],
    }

    const options = {
        type: "line",
        plgins: {
            title: {
                display: false
            },
            tooltip: {
                title: (items: any) => {
                    return items[0].day
                }
            }
        },
        scales: {
            x: {
                ticks: { display: false },
                grid: { display: false },
                border: { display: false }
            },
            y: {
                ticks: { display: false },
                grid: { display: false },
                border: { display: false }
            }
        },
        parsing: {
            xAxisKey: 'day',
            yAxisKey: 'count'
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: { display: false },
            legend: { display: false },
        }
    }
    return (
        <div className="chart-container h-[60%] py-4">
            <Line
                data={data}
                options={options}
            />
        </div>
    )
})