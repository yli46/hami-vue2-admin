<template>
  <div class="page">
    <!-- 项目信息卡 -->
    <el-card class="info-card" shadow="never">
      <div slot="header" class="card-header">
        <span>项目信息</span>
      </div>
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="平台名称">哈密煤运廊道一体管控平台</el-descriptions-item>
        <el-descriptions-item label="本期范围">汽运业务详细设计</el-descriptions-item>
        <el-descriptions-item label="交付窗口">2026-05-16</el-descriptions-item>
        <el-descriptions-item label="主负责">李扬</el-descriptions-item>
        <el-descriptions-item label="基线">互联网事业部 v2 + 增强版</el-descriptions-item>
        <el-descriptions-item label="集成口数">5 路（陇能 / 民太安 / 柳汽 / ETC / 中石化加气站）</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 模块清单 -->
    <el-card class="module-card" shadow="never">
      <div slot="header" class="card-header">
        <span>模块清单</span>
        <span class="muted">共 {{ modules.length }} 项 / 全面预算覆盖业主官方 4 板块（车队 / 廊道 / 加气站 / 制氢工厂）</span>
      </div>
      <el-table :data="modules" size="small" border :row-class-name="rowClass">
        <el-table-column prop="domain" label="所属域" width="120" />
        <el-table-column prop="name" label="模块名称" width="180" />
        <el-table-column prop="desc" label="说明" min-width="320" />
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTagType(scope.row.status)" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="$router.push(scope.row.path)">进入</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {
      modules: [
        { domain: '全面预算', name: '概算管理', desc: '业主官方 4 板块年度资源池：车队（红树林+新鹏运双主体）/ 廊道（建设期）/ 加气站 / 制氢工厂', path: '/budget/overview', status: '原型就绪' },
        { domain: '全面预算', name: '预算编制', desc: '年度 / 季度收支预算编制 + 多级审批 + Excel 导入', path: '/budget/edit', status: '原型就绪' },
        { domain: '全面预算', name: '核算处理', desc: '主营业务直接成本归集 + 预算前控 + 预警（含趟结归口 / 备用金 / 手动录入）', path: '/cost-accounting', status: '原型就绪' },
        { domain: '全面预算', name: '决算分析', desc: '期末汇总 / 利润核算 / 决算报告 + 关账', path: '/decision-analysis', status: '原型就绪' },
        { domain: '全面预算', name: '预算目标协同', desc: '预算分解到业务单元 + 实际归集 + 双维度切分', path: '/budget/coordination', status: '原型就绪' },
        { domain: '统计分析', name: '车辆运营统计', desc: '单车指标 + 在营率 / 月度毛利 / 气耗 / 杂费监控 / OCR 识别率', path: '/stats/fleet', status: '原型就绪' },
        { domain: '统计分析', name: '运营统计', desc: '路线运营 + 业财穿透六分量 + 业财健康度指数', path: '/stats/ops', status: '原型就绪' },
        { domain: '统计分析', name: '司机绩效统计', desc: '司机评分 / 气耗 / 时效 / 违规 / 视频录入合规率', path: '/stats/driver', status: '原型就绪' }
      ]
    }
  },
  methods: {
    statusTagType(s) {
      if (s === '设计中') return ''
      if (s === '原型就绪') return 'success'
      if (s === '待业主回填') return 'warning'
      if (s === '已完成') return 'success'
      return 'info'
    },
    rowClass({ row }) {
      return ''
    }
  }
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-card,
.module-card {
  border: 1px solid #DCDFE6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: #303133;
}

.muted {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}
</style>
