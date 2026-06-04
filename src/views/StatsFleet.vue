<template>
  <stats-bi
    name="车辆运营统计"
    desc="运力投了多少、每台车产出多少、用得够不够、货损控得住不住。下钻到单车明细"
    icon="el-icon-truck"
    bi-url="https://bi.aliyuncs.com/token3rd/dashboard/view/pc.htm?pageId=58b0095a-464d-4798-8b97-ed28aa9a60c7&accessTicket=a5a8b8e0-72ba-4e2e-bdb1-92f80217e2d7&dd_orientation=auto"
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
