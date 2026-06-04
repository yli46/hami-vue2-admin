<template>
  <stats-bi
    name="运营统计（业财贯穿）"
    desc="业务怎么变成钱：运量 → 收入 → 成本 → 毛利 → 经营现金流。配套利润表/资产负债表/现金流量表三张报表"
    icon="el-icon-data-line"
    bi-url="https://bi.aliyuncs.com/token3rd/dashboard/view/pc.htm?pageId=6d8a03f5-43c7-4555-8116-5517ffeec565&accessTicket=ea6d42df-6210-4ee3-a35c-edb679167272&dd_orientation=auto"
    :metrics="[
      { label: '营业毛利率', value: '10.2%', color: '#389E0D' },
      { label: '吨公里毛利', value: '0.0191', color: '#1677FF' },
      { label: '经营净现金流', value: '2,209万', color: '#722ED1' }
    ]"
  />
</template>
<script>
import StatsBi from '@/components/StatsBi.vue'
export default { name: 'StatsOps', components: { StatsBi } }
</script>
