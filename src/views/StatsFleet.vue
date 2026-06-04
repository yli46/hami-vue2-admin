<template>
  <stats-bi
    name="车辆运营统计"
    desc="运力投了多少、每台车产出多少、用得够不够、货损控得住不住。下钻到单车明细"
    icon="el-icon-truck"
    :metrics="[
      { label: '在营车辆数', value: '300台', color: '#1677FF' },
      { label: '单车月营收', value: '8.3万', color: '#389E0D' },
      { label: '煤损率', value: '6.99‰', color: '#CF1322' }
    ]"
  />
</template>
<script>
import StatsBi from '@/components/StatsBi.vue'
export default { name: 'StatsFleet', components: { StatsBi } }
</script>
