<template>
  <div class="page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" size="small">
        <el-form-item label="月份">
          <el-date-picker
            v-model="query.month"
            type="month"
            placeholder="选择月份"
            value-format="yyyy-MM"
            style="width: 160px;"
          />
        </el-form-item>
        <el-form-item label="业务单元">
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 140px;">
            <el-option label="车队 1" value="fleet1" />
            <el-option label="车队 2" value="fleet2" />
          </el-select>
        </el-form-item>
        <el-form-item label="司机">
          <el-input v-model="query.driver" placeholder="姓名 / 工号" clearable style="width: 160px;" />
        </el-form-item>
        <el-form-item label="绩效等级">
          <el-select v-model="query.grade" placeholder="全部" clearable style="width: 120px;">
            <el-option label="A 优秀" value="A" />
            <el-option label="B 合格" value="B" />
            <el-option label="C 需改进" value="C" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="kpi-row">
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">司机数（在岗）</div>
        <div class="kpi-value">112</div>
        <div class="kpi-meta">本月在岗</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">平均气耗（母车）</div>
        <div class="kpi-value">35.4 kg</div>
        <div class="kpi-meta">目标 ≤34</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">视频录入合规率</div>
        <div class="kpi-value">97.8%</div>
        <div class="kpi-meta">目标 100%</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">超阈值司机</div>
        <div class="kpi-value warning">8</div>
        <div class="kpi-meta">需关注</div>
      </el-card>
    </div>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>司机绩效评分 — 2026-04</span>
        <div>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="tableData" border size="small" stripe>
        <el-table-column prop="name" label="司机姓名" width="100" />
        <el-table-column prop="driverNo" label="工号" width="90" align="center" />
        <el-table-column prop="unit" label="业务单元" width="100" align="center" />
        <el-table-column prop="gasMatch" label="气耗达标" width="100" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" :type="scope.row.gasMatch ? 'success' : 'danger'">
              {{ scope.row.gasMatch ? '达标' : '超标' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timeMatch" label="时效达标" width="100" align="center">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.timeMatch < 90 }">{{ scope.row.timeMatch }} 分</span>
          </template>
        </el-table-column>
        <el-table-column prop="violationPoints" label="违规扣分" width="100" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.violationPoints > 0 }">{{ scope.row.violationPoints }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="safetyPoints" label="安全积分" width="100" align="right">
          <template slot-scope="scope">{{ scope.row.safetyPoints }}</template>
        </el-table-column>
        <el-table-column prop="videoCompliance" label="视频录入合规率" width="140" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.videoCompliance < 95 }">{{ scope.row.videoCompliance }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalScore" label="综合得分" width="100" align="right">
          <template slot-scope="scope">
            <strong>{{ scope.row.totalScore }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="等级" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="gradeType(scope.row.grade)" size="mini">{{ scope.row.grade }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="viewDriverDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" @click="viewDriverHistory(scope.row)">历史</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="tableData.length" :page-size="20" />
      </div>
    </el-card>

    <el-card class="indicators-card" shadow="never">
      <div slot="header"><span>本模块指标定义（基于《指标方案 v2-0424 修订版》）</span></div>
      <el-table :data="indicators" border size="small">
        <el-table-column prop="code" label="编号" width="160" />
        <el-table-column prop="name" label="指标名称" min-width="180" />
        <el-table-column prop="level" label="层级" width="80" align="center" />
        <el-table-column prop="source" label="数据源" min-width="200" />
        <el-table-column prop="target" label="目标" width="140" align="center" />
        <el-table-column prop="note" label="说明" min-width="180" />
      </el-table>
    </el-card>

    <el-dialog :title="`${currentDriver.name} - 绩效详情`" :visible.sync="showDriverDetail" width="720px">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="姓名">{{ currentDriver.name }}</el-descriptions-item>
        <el-descriptions-item label="工号">{{ currentDriver.driverNo }}</el-descriptions-item>
        <el-descriptions-item label="业务单元">{{ currentDriver.unit }}</el-descriptions-item>
        <el-descriptions-item label="本月趟次">{{ currentDriver.tripCount }}</el-descriptions-item>
        <el-descriptions-item label="气耗（kg/100km）">{{ currentDriver.gas }}</el-descriptions-item>
        <el-descriptions-item label="平均时效得分">{{ currentDriver.timeMatch }} 分</el-descriptions-item>
        <el-descriptions-item label="违规扣分">{{ currentDriver.violationPoints }}</el-descriptions-item>
        <el-descriptions-item label="安全积分">{{ currentDriver.safetyPoints }}</el-descriptions-item>
        <el-descriptions-item label="视频录入合规率">{{ currentDriver.videoCompliance }}%</el-descriptions-item>
        <el-descriptions-item label="综合得分"><strong>{{ currentDriver.totalScore }}</strong></el-descriptions-item>
        <el-descriptions-item label="等级">
          <el-tag :type="gradeType(currentDriver.grade)" size="mini">{{ currentDriver.grade }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">违规与扣分明细</el-divider>
      <el-table :data="driverViolations" border size="small">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="type" label="违规类型" min-width="120" />
        <el-table-column prop="points" label="扣分" width="80" align="right" />
        <el-table-column prop="note" label="说明" min-width="160" />
      </el-table>
    </el-dialog>

    <el-dialog :title="`${currentDriver.name} - 绩效历史`" :visible.sync="showDriverHistory" width="640px">
      <el-table :data="driverHistory" border size="small">
        <el-table-column prop="month" label="月份" width="100" align="center" />
        <el-table-column prop="totalScore" label="综合得分" width="100" align="right" />
        <el-table-column prop="grade" label="等级" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="gradeType(scope.row.grade)" size="mini">{{ scope.row.grade }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="violationPoints" label="违规扣分" width="100" align="right" />
        <el-table-column prop="note" label="备注" min-width="160" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'DriverPerf',
  data() {
    return {
      query: { month: '2026-04', unit: '', driver: '', grade: '' },
      showDriverDetail: false,
      showDriverHistory: false,
      currentDriver: { name: '' },
      driverViolations: [
        { date: '2026-04-08', type: '气耗超阈值', points: -2, note: '本月百公里气耗 36.8，超母车阈值 36' },
        { date: '2026-04-18', type: '运损超标', points: -3, note: '哈密-淖毛湖单趟运损 1.4%' }
      ],
      driverHistory: [
        { month: '2025-11', totalScore: 92, grade: 'A', violationPoints: 0, note: '全月零违规' },
        { month: '2025-12', totalScore: 88, grade: 'A', violationPoints: -1, note: '冬季气耗略偏高' },
        { month: '2026-01', totalScore: 85, grade: 'B', violationPoints: -2, note: '春节运量大，时效压力大' },
        { month: '2026-02', totalScore: 89, grade: 'A', violationPoints: 0, note: '正常' },
        { month: '2026-03', totalScore: 86, grade: 'B', violationPoints: -3, note: '运损一次超标' },
        { month: '2026-04', totalScore: 82, grade: 'B', violationPoints: -5, note: '气耗超标 + 运损超标' }
      ],
      tableData: [
        { name: '张永刚', driverNo: 'D0023', unit: '车队 1', tripCount: 28, gas: '36.8', gasMatch: false, timeMatch: 92, violationPoints: -5, safetyPoints: 96, videoCompliance: 98, totalScore: 82, grade: 'B' },
        { name: '李建华', driverNo: 'D0041', unit: '车队 1', tripCount: 32, gas: '33.6', gasMatch: true, timeMatch: 96, violationPoints: 0, safetyPoints: 100, videoCompliance: 100, totalScore: 95, grade: 'A' },
        { name: '王志远', driverNo: 'D0058', unit: '车队 2', tripCount: 26, gas: '37.8', gasMatch: false, timeMatch: 88, violationPoints: -3, safetyPoints: 92, videoCompliance: 94, totalScore: 78, grade: 'B' },
        { name: '陈志国', driverNo: 'D0067', unit: '车队 1', tripCount: 30, gas: '34.2', gasMatch: true, timeMatch: 95, violationPoints: 0, safetyPoints: 100, videoCompliance: 100, totalScore: 94, grade: 'A' },
        { name: '刘海滨', driverNo: 'D0072', unit: '车队 2', tripCount: 29, gas: '38.4', gasMatch: false, timeMatch: 80, violationPoints: -8, safetyPoints: 85, videoCompliance: 89, totalScore: 68, grade: 'C' },
        { name: '赵明远', driverNo: 'D0085', unit: '车队 1', tripCount: 27, gas: '34.6', gasMatch: true, timeMatch: 93, violationPoints: -1, safetyPoints: 98, videoCompliance: 97, totalScore: 90, grade: 'A' },
        { name: '孙国锋', driverNo: 'D0091', unit: '车队 2', tripCount: 31, gas: '37.2', gasMatch: true, timeMatch: 89, violationPoints: -2, safetyPoints: 95, videoCompliance: 96, totalScore: 86, grade: 'B' }
      ],
      indicators: [
        { code: 'P1-L3-R06-K1', name: '气耗达标', level: 'L3', source: '车辆运营总表.百公里用气', target: '母 ≤34 / 子 ≤37', note: '沿用既有规则' },
        { code: 'P1-L3-R06-K2', name: '时效达标', level: 'L3', source: '2026 年明细.本单耗时 vs 路线均值', target: '100 分', note: '沿用既有规则' },
        { code: 'P1-L3-R06-K3', name: '违规扣分', level: 'L3', source: '杂费 2026.罚款扣分 + 运损', target: '零违规', note: '沿用既有规则' },
        { code: 'P1-L3-R06-K4', name: '安全积分', level: 'L3', source: '事故/违章记录（待采集）', target: '100 分', note: '沿用既有规则 / 待采集' },
        { code: 'P2-L3-R06-K5', name: '视频录入合规率（新增）', level: 'L3', source: '司机录入双重录入达标 / 总录入', target: '100%', note: '0424 喻总要求' },
        { code: 'P1-L3-R05-K1', name: '派单公平性', level: 'L3', source: '司机派单总表', target: 'Max/Min ≤1.5', note: '建议值' },
        { code: 'P1-L3-R05-K2', name: '母子车配对率（重定位）', level: 'L3', source: '车辆登记 + 派单交叉', target: '异常 ≤2%', note: '道亨主理 / 看板复用' },
        { code: 'P1-L3-R05-K3', name: '派单异常人工干预率（重定位）', level: 'L3', source: '本平台调度模块异常情况', target: '≤2%', note: '道亨主理 / 看板复用' },
        { code: 'P1-L3-R05-K4', name: '计划完成率', level: 'L3', source: '计划管理 + 实际卸货', target: '≥95%', note: '建议值 / 待采集' },
        { code: 'P1-L2-D1-004', name: '司机派单次数分布', level: 'L2', source: '司机派单总表.计数', target: 'Max/Min ≤1.5', note: '管理层关注' }
      ]
    }
  },
  methods: {
    search() { this.$message.info('查询逻辑由后端实现（演示）') },
    reset() { this.query = { month: '2026-04', unit: '', driver: '', grade: '' } },
    viewDriverDetail(row) {
      this.currentDriver = row
      this.showDriverDetail = true
    },
    viewDriverHistory(row) {
      this.currentDriver = row
      this.showDriverHistory = true
    },
    gradeType(g) {
      if (g === 'A') return 'success'
      if (g === 'B') return ''
      if (g === 'C') return 'danger'
      return 'info'
    }
  }
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-card,
.kpi-card,
.table-card,
.indicators-card {
  border: 1px solid #DCDFE6;
}

.kpi-row {
  display: flex;
  gap: 12px;
}

.kpi-card {
  flex: 1;
}

.kpi-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 24px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.kpi-value.warning {
  color: #F56C6C;
}

.kpi-meta {
  font-size: 12px;
  color: #C0C4CC;
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.warning-text {
  color: #F56C6C;
  font-weight: 500;
}

.pagination {
  margin-top: 12px;
  text-align: right;
}
</style>
