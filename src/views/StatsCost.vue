<template>
  <stats-bi
    name="成本预实分析"
    desc="汽运这一年的钱：花了多少 → 相对预算超没超 → 每吨公里贵不贵 → 吃掉多少收入 → 风险压在哪个科目"
    icon="el-icon-coin"
    :metrics="[
      { label: '本年累计营业成本', value: '1.14亿', color: '#FA8C16' },
      { label: '吨公里成本', value: '0.168', color: '#389E0D' },
      { label: '成本占收入比', value: '89.8%', color: '#1677FF' }
    ]"
  />
</template>
<script>
import StatsBi from '@/components/StatsBi.vue'
export default { name: 'StatsCost', components: { StatsBi } }
</script>
