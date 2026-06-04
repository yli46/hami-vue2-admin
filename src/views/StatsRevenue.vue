<template>
  <stats-bi
    name="收入预实分析"
    desc="量 × 价驱动：运量超计划带动收入超预算，吨公里收入稳定贴着测算单价，不是涨价"
    icon="el-icon-trend-charts"
    :metrics="[
      { label: '本年累计营业收入', value: '1.27亿', color: '#1677FF' },
      { label: '预算完成率', value: '120%', color: '#389E0D' },
      { label: '吨公里收入', value: '0.182', color: '#722ED1' }
    ]"
  />
</template>
<script>
import StatsBi from '@/components/StatsBi.vue'
export default { name: 'StatsRevenue', components: { StatsBi } }
</script>
