<template>
  <div class="home-view">
    <el-card class="welcome-card">
      <div class="welcome">
        <h2>哈密煤运廊道一体管控平台 · 汽运详设</h2>
        <p class="meta">交付窗口：2026-05-16 / 主负责：李扬 / 基线：互联网事业部 v2 + 增强版</p>
      </div>
    </el-card>

    <div class="grid">
      <el-card v-for="item in modules" :key="item.path" class="module-card" shadow="hover" @click.native="$router.push(item.path)">
        <div class="module-header">
          <span class="module-code">{{ item.code }}</span>
          <span class="module-status" :class="`status-${item.status}`">{{ item.statusLabel }}</span>
        </div>
        <div class="module-name">{{ item.name }}</div>
        <div class="module-desc">{{ item.desc }}</div>
      </el-card>
    </div>

    <el-card class="info-card">
      <div slot="header"><b>说明</b></div>
      <ul class="notes">
        <li>本仓库挂在主域名 <code>/freight/</code> 子路径下，老仓库 hami-vue-admin 保留所有历史汽运资料和密码门页面</li>
        <li>本期不含廊道、加氢站；7 路集成口已收敛为 5 路（陇能 / 民太安 / 柳汽 / 山东高速 / 中石化加气站）</li>
        <li>134/135/136 财务规则待《核算处理-财务信息收集表》业主回填后补全</li>
        <li>页面占位会按 PRD 草稿陆续填充</li>
      </ul>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {
      modules: [
        { code: '132', name: '概算管理', desc: '业务单元年度资源池切分', path: '/budget/overview', status: 'in-progress', statusLabel: '设计中' },
        { code: '133', name: '预算编制', desc: '年度/季度收支预算 + 多级审批', path: '/budget/edit', status: 'in-progress', statusLabel: '设计中' },
        { code: '134', name: '核算处理', desc: '成本归集 / 预算前控 / 预警', path: '/cost-accounting', status: 'pending', statusLabel: '待业主回填' },
        { code: '135', name: '决算分析', desc: '期末汇总 / 利润核算 / 报告', path: '/decision-analysis', status: 'pending', statusLabel: '待业主回填' },
        { code: '136', name: '预算目标协同', desc: '预算分解 + 实际归集 + 联动', path: '/budget/coordination', status: 'pending', statusLabel: '待业主回填' },
        { code: '140', name: '车辆运营统计', desc: '出勤 / 空驶 / 周转 / 单车利润', path: '/stats/fleet', status: 'in-progress', statusLabel: '设计中' },
        { code: '141', name: '运营统计', desc: '线路利润 / 货运总量 / 货损率', path: '/stats/ops', status: 'in-progress', statusLabel: '设计中' },
        { code: '142', name: '司机绩效统计', desc: '出勤 / 气耗 / 运损 / 绩效', path: '/stats/driver', status: 'in-progress', statusLabel: '设计中' }
      ]
    }
  }
}
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-card {
  border: 1px solid #DCDFE6;
}

.welcome h2 {
  margin: 0 0 8px 0;
  color: #24558A;
  font-size: 18px;
}

.welcome .meta {
  color: #606266;
  font-size: 13px;
  margin: 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.module-card {
  cursor: pointer;
  transition: transform 0.15s;
}

.module-card:hover {
  transform: translateY(-2px);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.module-code {
  font-weight: 600;
  color: #409EFF;
  font-size: 13px;
  letter-spacing: 0.5px;
}

.module-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 2px;
}

.status-in-progress {
  background: #E1F3D8;
  color: #67C23A;
}

.status-pending {
  background: #FAECD8;
  color: #E6A23C;
}

.module-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}

.module-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.info-card {
  border: 1px solid #DCDFE6;
}

.notes {
  margin: 0;
  padding-left: 20px;
  line-height: 2;
  color: #606266;
  font-size: 13px;
}

.notes code {
  background: #F0F2F5;
  padding: 1px 6px;
  border-radius: 2px;
  font-family: monospace;
}
</style>
