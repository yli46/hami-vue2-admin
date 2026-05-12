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
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 120px;">
            <el-option label="车队" value="fleet" />
          </el-select>
        </el-form-item>
        <el-form-item label="主体">
          <el-select v-model="query.subject" placeholder="全部" clearable style="width: 120px;">
            <el-option label="红树林" value="hsl" />
            <el-option label="新鹏运" value="xpy" />
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
        <el-table-column prop="name" label="司机姓名" width="90" fixed="left" />
        <el-table-column prop="driverNo" label="工号" width="80" align="center" fixed="left" />
        <el-table-column prop="unit" label="业务单元" width="80" align="center" />
        <el-table-column prop="subject" label="主体" width="80" align="center" />
        <el-table-column label="基础工资 (30%)" width="110" align="right">
          <template slot-scope="scope">¥ {{ scope.row.k01 }}</template>
        </el-table-column>
        <el-table-column label="气耗 (17%)" width="100" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.k02 < 250 }">¥ {{ scope.row.k02 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="时效 (15%)" width="100" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.k03 < 160 }">¥ {{ scope.row.k03 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="安全 (10%)" width="100" align="right">
          <template slot-scope="scope">¥ {{ scope.row.k04 }}</template>
        </el-table-column>
        <el-table-column label="煤损 (10%)" width="100" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.k05 < 160 }">¥ {{ scope.row.k05 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="随车工具 (5%)" width="110" align="right">
          <template slot-scope="scope">¥ {{ scope.row.k06 }}</template>
        </el-table-column>
        <el-table-column label="路线偏离 (3%)" width="110" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.k07 < 40 }">¥ {{ scope.row.k07 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单趟杂费 (3%)" width="110" align="right">
          <template slot-scope="scope">¥ {{ scope.row.k08 }}</template>
        </el-table-column>
        <el-table-column label="应急维修 (3%)" width="110" align="right">
          <template slot-scope="scope">¥ {{ scope.row.k09 }}</template>
        </el-table-column>
        <el-table-column label="低值易耗 (3%)" width="110" align="right">
          <template slot-scope="scope">¥ {{ scope.row.k10 }}</template>
        </el-table-column>
        <el-table-column label="放空 (1%)" width="90" align="right">
          <template slot-scope="scope">¥ {{ scope.row.k11 }}</template>
        </el-table-column>
        <el-table-column label="实发合计" width="100" align="right">
          <template slot-scope="scope">
            <strong>¥ {{ rowTotal(scope.row) }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="等级" width="70" align="center">
          <template slot-scope="scope">
            <el-tag :type="gradeType(scope.row.grade)" size="mini">{{ scope.row.grade }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center" fixed="right">
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
      <div slot="header"><span>本模块指标定义（基于《指标方案 v2.1-0512 调研修订版》— 业主官方 11 项细则）</span></div>
      <el-table :data="indicators" border size="small">
        <el-table-column prop="code" label="编号" width="160" />
        <el-table-column prop="name" label="指标名称" min-width="180" />
        <el-table-column prop="level" label="层级" width="80" align="center" />
        <el-table-column prop="source" label="数据源" min-width="200" />
        <el-table-column prop="target" label="目标" width="140" align="center" />
        <el-table-column prop="note" label="说明" min-width="180" />
      </el-table>
    </el-card>

    <el-dialog :title="`${currentDriver.name} - 绩效详情（业主官方 11 项）`" :visible.sync="showDriverDetail" width="760px">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="姓名">{{ currentDriver.name }}</el-descriptions-item>
        <el-descriptions-item label="工号">{{ currentDriver.driverNo }}</el-descriptions-item>
        <el-descriptions-item label="业务单元">{{ currentDriver.unit }}</el-descriptions-item>
        <el-descriptions-item label="等级">
          <el-tag :type="gradeType(currentDriver.grade)" size="mini">{{ currentDriver.grade }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">11 项考核明细（业主官方 / 月总额 1,700 元）</el-divider>
      <el-table :data="kpi11Rows(currentDriver)" border size="small">
        <el-table-column prop="serial" label="序" width="50" align="center" />
        <el-table-column prop="name" label="考核项" min-width="160" />
        <el-table-column prop="weight" label="权重" width="80" align="center" />
        <el-table-column prop="cap" label="满分（元）" width="100" align="right" />
        <el-table-column prop="actual" label="实发（元）" width="100" align="right">
          <template slot-scope="scope">
            <strong :class="{ 'warning-text': scope.row.actual < scope.row.cap * 0.85 }">¥ {{ scope.row.actual }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="rate" label="达成率" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.rate }}%</template>
        </el-table-column>
      </el-table>
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
      query: { month: '2026-04', unit: '', subject: '', driver: '', grade: '' },
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
        { name: '张永刚', driverNo: 'D0023', unit: '车队', subject: '红树林', k01: 500, k02: 250, k03: 200, k04: 180, k05: 160, k06: 80, k07: 50, k08: 50, k09: 50, k10: 50, k11: 20, grade: 'B' },
        { name: '李建华', driverNo: 'D0041', unit: '车队', subject: '红树林', k01: 500, k02: 300, k03: 200, k04: 200, k05: 200, k06: 80, k07: 50, k08: 50, k09: 50, k10: 50, k11: 20, grade: 'A' },
        { name: '王志远', driverNo: 'D0058', unit: '车队', subject: '新鹏运', k01: 500, k02: 220, k03: 170, k04: 200, k05: 180, k06: 70, k07: 40, k08: 50, k09: 50, k10: 50, k11: 20, grade: 'B' },
        { name: '陈志国', driverNo: 'D0067', unit: '车队', subject: '红树林', k01: 500, k02: 290, k03: 195, k04: 200, k05: 195, k06: 80, k07: 50, k08: 50, k09: 50, k10: 50, k11: 20, grade: 'A' },
        { name: '刘海滨', driverNo: 'D0072', unit: '车队', subject: '新鹏运', k01: 500, k02: 180, k03: 140, k04: 150, k05: 130, k06: 60, k07: 30, k08: 45, k09: 50, k10: 45, k11: 15, grade: 'C' },
        { name: '赵明远', driverNo: 'D0085', unit: '车队', subject: '红树林', k01: 500, k02: 280, k03: 190, k04: 200, k05: 200, k06: 80, k07: 50, k08: 50, k09: 50, k10: 50, k11: 20, grade: 'A' },
        { name: '孙国锋', driverNo: 'D0091', unit: '车队', subject: '新鹏运', k01: 500, k02: 270, k03: 175, k04: 195, k05: 190, k06: 80, k07: 45, k08: 50, k09: 50, k10: 50, k11: 20, grade: 'B' }
      ],
      indicators: [
        { code: 'P3-L3-R06-K01', name: '基础工资 (30%)', level: 'L3', source: '业主官方', target: '500 元', note: '业主官方·5/12 调研' },
        { code: 'P3-L3-R06-K02', name: '气耗 (17%)', level: 'L3', source: '车辆运营总表.百公里用气', target: '300 元（母≤34/子≤37 满分）', note: '沿用既有规则' },
        { code: 'P3-L3-R06-K03', name: '时效 (15%)', level: 'L3', source: '2026 年明细.本单耗时', target: '200 元（100% 时效满分）', note: '业主官方·5/12 调研' },
        { code: 'P3-L3-R06-K04', name: '安全 (10%)', level: 'L3', source: '事故/违章记录', target: '200 元（零违规满分）', note: '沿用既有规则' },
        { code: 'P3-L3-R06-K05', name: '煤损 (10%)', level: 'L3', source: '2026 年明细.超出亏损范围', target: '200 元（零超标满分）', note: '业主官方·5/12 新增独立项' },
        { code: 'P3-L3-R06-K06', name: '随车工具及资料 (5%)', level: 'L3', source: '车队内勤检查', target: '80 元', note: '业主官方·5/12 新增' },
        { code: 'P3-L3-R06-K07', name: '路线偏离 (3%)', level: 'L3', source: '民太安 GPS', target: '50 元（无偏离满分）', note: '业主官方·5/12 独立项（v2 旧版埋在违规中）' },
        { code: 'P3-L3-R06-K08', name: '单趟杂费 (3%)', level: 'L3', source: '内部杂费台账', target: '50 元', note: '业主官方·5/12 新增' },
        { code: 'P3-L3-R06-K09', name: '应急维修费 (3%)', level: 'L3', source: '维保单据', target: '50 元', note: '业主官方·5/12 新增' },
        { code: 'P3-L3-R06-K10', name: '低值易耗品 (3%)', level: 'L3', source: '内部物料台账', target: '50 元', note: '业主官方·5/12 新增' },
        { code: 'P3-L3-R06-K11', name: '放空 (1%)', level: 'L3', source: '调度模块', target: '20 元', note: '业主官方·5/12 独立项（v2 旧版在 L2 调度类）' },
        { code: 'P1-L3-R05-K1', name: '派单公平性', level: 'L3', source: '司机派单总表', target: 'Max/Min ≤1.5', note: '建议值' },
        { code: 'P1-L3-R05-K2', name: '母子车配对率（重定位）', level: 'L3', source: '车辆登记 + 派单交叉', target: '异常 ≤2%', note: '道亨主理 / 看板复用' },
        { code: 'P1-L3-R05-K3', name: '派单异常人工干预率（重定位）', level: 'L3', source: '本平台调度模块异常情况', target: '≤2%', note: '道亨主理 / 看板复用' }
      ]
    }
  },
  methods: {
    search() { this.$message.info('查询逻辑由后端实现（演示）') },
    reset() { this.query = { month: '2026-04', unit: '', subject: '', driver: '', grade: '' } },
    rowTotal(row) {
      return ['k01','k02','k03','k04','k05','k06','k07','k08','k09','k10','k11']
        .reduce((sum, k) => sum + (row[k] || 0), 0)
    },
    kpi11Rows(row) {
      const items = [
        { serial: 1, name: '基础工资', weight: '30%', cap: 500, actual: row.k01 || 0 },
        { serial: 2, name: '气耗', weight: '17%', cap: 300, actual: row.k02 || 0 },
        { serial: 3, name: '时效', weight: '15%', cap: 200, actual: row.k03 || 0 },
        { serial: 4, name: '安全', weight: '10%', cap: 200, actual: row.k04 || 0 },
        { serial: 5, name: '煤损', weight: '10%', cap: 200, actual: row.k05 || 0 },
        { serial: 6, name: '随车工具及资料', weight: '5%', cap: 80, actual: row.k06 || 0 },
        { serial: 7, name: '路线偏离', weight: '3%', cap: 50, actual: row.k07 || 0 },
        { serial: 8, name: '单趟杂费', weight: '3%', cap: 50, actual: row.k08 || 0 },
        { serial: 9, name: '应急维修费', weight: '3%', cap: 50, actual: row.k09 || 0 },
        { serial: 10, name: '低值易耗品', weight: '3%', cap: 50, actual: row.k10 || 0 },
        { serial: 11, name: '放空', weight: '1%', cap: 20, actual: row.k11 || 0 }
      ]
      return items.map(item => ({
        ...item,
        rate: item.cap > 0 ? Math.round(item.actual / item.cap * 100) : 0
      }))
    },
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
