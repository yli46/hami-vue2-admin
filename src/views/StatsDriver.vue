<template>
  <stats-bi
    name="司机绩效统计"
    desc="队伍多大、收入多少、质量结构、哪项扣得最狠、谁该激励谁该帮扶。含安全奖/节气奖/稳定从业奖三项奖励维度"
    icon="el-icon-user"
    :metrics="[
      { label: '在册司机', value: '300人', color: '#1677FF' },
      { label: 'A级占比', value: '54%', color: '#389E0D' },
      { label: '人均应发（含奖励）', value: '1,573元', color: '#722ED1' }
    ]"
  />
</template>
<script>
import StatsBi from '@/components/StatsBi.vue'
export default { name: 'StatsDriver', components: { StatsBi } }
</script>
