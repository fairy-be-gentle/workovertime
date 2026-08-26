<!-- 图表页 -->
<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  import type { OvertimeRecord, StatisticsData } from '$lib/types';
  import { formatDuration } from '$lib/storage';

  interface Props {
    records: OvertimeRecord[];
  }

  let { records }: Props = $props();

  let barChartContainer = $state<HTMLDivElement | null>(null);
  let pieChartContainer = $state<HTMLDivElement | null>(null);
  let barChart: echarts.ECharts | null = null;
  let pieChart: echarts.ECharts | null = null;
  let isMounted = $state(false);

  // ECharts tooltip 参数类型
  interface TooltipParams {
    name: string;
    value: number;
  }

  // 计算统计数据
  let statistics = $derived.by<StatisticsData>(() => {
    const total = records.length;
    const pending = records.filter((r) => r.status === 'pending').length;
    const approved = records.filter((r) => r.status === 'approved').length;
    const rejected = records.filter((r) => r.status === 'rejected').length;
    const totalHours = records.reduce((sum, r) => sum + r.duration, 0);
    const avgHours = total > 0 ? totalHours / total : 0;

    // 按月份统计
    const monthMap = new Map<string, { count: number; hours: number }>();
    records.forEach((r) => {
      const date = new Date(r.submitTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(monthKey) || { count: 0, hours: 0 };
      monthMap.set(monthKey, {
        count: existing.count + 1,
        hours: existing.hours + r.duration,
      });
    });
    const byMonth = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 按状态分布
    const byStatus = [
      {
        status: 'pending' as const,
        count: pending,
        percentage: total > 0 ? (pending / total) * 100 : 0,
      },
      {
        status: 'approved' as const,
        count: approved,
        percentage: total > 0 ? (approved / total) * 100 : 0,
      },
      {
        status: 'rejected' as const,
        count: rejected,
        percentage: total > 0 ? (rejected / total) * 100 : 0,
      },
    ];

    return {
      total,
      pending,
      approved,
      rejected,
      totalHours,
      avgHours,
      byMonth,
      byStatus,
    };
  });

  function initCharts(): void {
    if (!barChartContainer || !pieChartContainer || typeof window === 'undefined') {
      return;
    }

    // 柱状图配置
    barChart = echarts.init(barChartContainer);
    const barOption: echarts.EChartsOption = {
      title: {
        text: '月度加班统计',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: TooltipParams[]) => {
          const month = params[0].name;
          const count = params[0].value;
          const hours = params[1]?.value || 0;
          return `${month}<br/>申请次数: ${count} 次<br/>加班时长: ${formatDuration(hours)}`;
        },
      },
      legend: {
        data: ['申请次数', '加班时长'],
        bottom: 0,
      },
      xAxis: {
        type: 'category',
        data: statistics.byMonth.map((m) => m.month),
      },
      yAxis: [
        {
          type: 'value',
          name: '次数',
          position: 'left',
        },
        {
          type: 'value',
          name: '时长(小时)',
          position: 'right',
        },
      ],
      series: [
        {
          name: '申请次数',
          type: 'bar',
          data: statistics.byMonth.map((m) => m.count),
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: '加班时长',
          type: 'line',
          yAxisIndex: 1,
          data: statistics.byMonth.map((m) => m.hours),
          itemStyle: { color: '#10b981' },
          smooth: true,
        },
      ],
    };
    barChart.setOption(barOption);

    // 饼图配置
    pieChart = echarts.init(pieChartContainer);
    const pieOption: echarts.EChartsOption = {
      title: {
        text: '申请状态分布',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          label: {
            formatter: '{b}\n{d}%',
          },
          data: [
            {
              value: statistics.pending,
              name: '待审批',
              itemStyle: { color: '#facc15' },
            },
            {
              value: statistics.approved,
              name: '已通过',
              itemStyle: { color: '#22c55e' },
            },
            {
              value: statistics.rejected,
              name: '已驳回',
              itemStyle: { color: '#ef4444' },
            },
          ],
        },
      ],
    };
    pieChart.setOption(pieOption);

    // 响应式调整
    const handleResize = (): void => {
      barChart?.resize();
      pieChart?.resize();
    };
    window.addEventListener('resize', handleResize);
  }

  onMount(() => {
    isMounted = true;
    initCharts();
  });

  $effect(() => {
    if (isMounted && records && barChartContainer && pieChartContainer) {
      initCharts();
    }
  });
</script>

<div class="space-y-6">
  <!-- 统计卡片 -->
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    <div class="bg-white rounded-xl shadow p-4">
      <p class="text-sm text-gray-500">总申请数</p>
      <p class="text-2xl font-bold text-blue-600">{statistics.total}</p>
    </div>
    <div class="bg-white rounded-xl shadow p-4">
      <p class="text-sm text-gray-500">待审批</p>
      <p class="text-2xl font-bold text-yellow-500">{statistics.pending}</p>
    </div>
    <div class="bg-white rounded-xl shadow p-4">
      <p class="text-sm text-gray-500">已通过</p>
      <p class="text-2xl font-bold text-green-500">{statistics.approved}</p>
    </div>
    <div class="bg-white rounded-xl shadow p-4">
      <p class="text-sm text-gray-500">已驳回</p>
      <p class="text-2xl font-bold text-red-500">{statistics.rejected}</p>
    </div>
    <div class="bg-white rounded-xl shadow p-4">
      <p class="text-sm text-gray-500">总加班时长</p>
      <p class="text-2xl font-bold text-indigo-600">{formatDuration(statistics.totalHours)}</p>
    </div>
    <div class="bg-white rounded-xl shadow p-4">
      <p class="text-sm text-gray-500">平均时长</p>
      <p class="text-2xl font-bold text-purple-600">{formatDuration(statistics.avgHours)}</p>
    </div>
  </div>

  <!-- 图表 -->
  {#if records.length > 0}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow p-4">
        <div bind:this={barChartContainer} class="w-full h-80"></div>
      </div>
      <div class="bg-white rounded-xl shadow p-4">
        <div bind:this={pieChartContainer} class="w-full h-80"></div>
      </div>
    </div>
  {:else}
    <div class="bg-white rounded-xl shadow p-12 text-center">
      <p class="text-gray-500 text-lg">暂无数据</p>
      <p class="text-gray-400 text-sm mt-2">提交加班申请后即可查看统计报表</p>
    </div>
  {/if}
</div>
