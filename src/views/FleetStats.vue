<template>
  <div class="page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" size="small">
        <el-form-item label="期间">
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
        <el-form-item label="车型">
          <el-select v-model="query.vehicleType" placeholder="全部" clearable style="width: 140px;">
            <el-option label="母车" value="mother" />
            <el-option label="子车" value="child" />
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
        <div class="kpi-label">运力车辆在营率</div>
        <div class="kpi-value">96.4%</div>
        <div class="kpi-meta">目标 ≥95%</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">当日在途车辆</div>
        <div class="kpi-value">82 台</div>
        <div class="kpi-meta">目标 ≥80</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">本月超阈值车数</div>
        <div class="kpi-value warning">5</div>
        <div class="kpi-meta">需关注</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">OCR 识别准确率</div>
        <div class="kpi-value">96.2%</div>
        <div class="kpi-meta">目标 ≥95%</div>
      </el-card>
    </div>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>单车指标明细 — 2026-04</span>
        <div>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="tableData" border size="small" stripe>
        <el-table-column prop="plate" label="车牌号" width="120" align="center" />
        <el-table-column prop="vehicleType" label="车型" width="80" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" :type="scope.row.vehicleType === '母车' ? '' : 'info'">{{ scope.row.vehicleType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="业务单元" width="80" align="center" />
        <el-table-column prop="subject" label="主体" width="80" align="center" />
        <el-table-column prop="onDutyDays" label="在营天数" width="90" align="right" />
        <el-table-column prop="onDutyRate" label="在营率" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.onDutyRate }}%</template>
        </el-table-column>
        <el-table-column prop="tripCount" label="趟次" width="80" align="right" />
        <el-table-column prop="monthlyProfit" label="月度毛利（元）" width="130" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.monthlyProfit < 0 }">{{ formatMoney(scope.row.monthlyProfit) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="gasPer100" label="百公里气耗" width="120" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': gasOver(scope.row) }">{{ scope.row.gasPer100 }} kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="lossRate" label="途损率" width="90" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.lossRate > 1 }">{{ scope.row.lossRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="miscAnomaly" label="杂费异常" width="100" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" :type="scope.row.miscAnomaly === '正常' ? 'success' : 'danger'">
              {{ scope.row.miscAnomaly }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="viewVehicleDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" @click="viewHistory(scope.row)">趋势</el-button>
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
        <el-table-column prop="name" label="指标名称" min-width="160" />
        <el-table-column prop="level" label="层级" width="80" align="center" />
        <el-table-column prop="source" label="数据源" min-width="180" />
        <el-table-column prop="target" label="目标" width="120" align="center" />
        <el-table-column prop="threshold" label="预警阈值" width="120" align="center" />
        <el-table-column prop="freq" label="频次" width="80" align="center" />
      </el-table>
    </el-card>

    <el-dialog :title="`${currentVehicle.plate} - 车辆运营详情`" :visible.sync="showVehicleDetail" width="720px">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="车牌号">{{ currentVehicle.plate }}</el-descriptions-item>
        <el-descriptions-item label="车型">{{ currentVehicle.vehicleType }}</el-descriptions-item>
        <el-descriptions-item label="业务单元">{{ currentVehicle.unit }}</el-descriptions-item>
        <el-descriptions-item label="本月在营率">{{ currentVehicle.onDutyRate }}%</el-descriptions-item>
        <el-descriptions-item label="完成趟次">{{ currentVehicle.tripCount }}</el-descriptions-item>
        <el-descriptions-item label="月度毛利">¥ {{ formatMoney(currentVehicle.monthlyProfit) }}</el-descriptions-item>
        <el-descriptions-item label="百公里气耗">{{ currentVehicle.gasPer100 }} kg</el-descriptions-item>
        <el-descriptions-item label="途损率">{{ currentVehicle.lossRate }}%</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">异常项</el-divider>
      <ul class="anomaly-list">
        <li v-for="item in vehicleAnomalies(currentVehicle)" :key="item">{{ item }}</li>
        <li v-if="!vehicleAnomalies(currentVehicle).length" class="muted">无异常</li>
      </ul>
    </el-dialog>

    <el-dialog :title="`${currentVehicle.plate} - 最近 6 月趋势`" :visible.sync="showHistory" width="640px">
      <el-table :data="historyData" border size="small">
        <el-table-column prop="month" label="月份" width="100" align="center" />
        <el-table-column prop="trips" label="趟次" width="80" align="right" />
        <el-table-column prop="profit" label="毛利（元）" width="120" align="right">
          <template slot-scope="scope">{{ formatMoney(scope.row.profit) }}</template>
        </el-table-column>
        <el-table-column prop="gas" label="气耗 (kg/100km)" width="140" align="right" />
        <el-table-column prop="lossRate" label="途损率" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.lossRate }}%</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'FleetStats',
  data() {
    return {
      query: { month: '2026-04', unit: '', subject: '', vehicleType: '' },
      showVehicleDetail: false,
      showHistory: false,
      currentVehicle: { plate: '' },
      historyData: [
        { month: '2025-11', trips: 26, profit: 8200, gas: '33.8', lossRate: '0.6' },
        { month: '2025-12', trips: 28, profit: 8500, gas: '34.5', lossRate: '0.7' },
        { month: '2026-01', trips: 25, profit: 7900, gas: '35.2', lossRate: '0.9' },
        { month: '2026-02', trips: 22, profit: 6800, gas: '34.0', lossRate: '0.5' },
        { month: '2026-03', trips: 27, profit: 8400, gas: '34.8', lossRate: '0.8' },
        { month: '2026-04', trips: 28, profit: 8600, gas: '36.2', lossRate: '1.1' }
      ],
      tableData: [
        { plate: '新A·12345', vehicleType: '母车', unit: '车队', subject: '红树林', onDutyDays: 28, onDutyRate: 96.6, tripCount: 28, monthlyProfit: 8600, gasPer100: 36.2, lossRate: 1.1, miscAnomaly: '正常' },
        { plate: '新A·12346', vehicleType: '子车', unit: '车队', subject: '红树林', onDutyDays: 29, onDutyRate: 100.0, tripCount: 30, monthlyProfit: 9200, gasPer100: 37.8, lossRate: 0.8, miscAnomaly: '正常' },
        { plate: '新A·12347', vehicleType: '母车', unit: '车队', subject: '红树林', onDutyDays: 25, onDutyRate: 86.2, tripCount: 22, monthlyProfit: 6400, gasPer100: 35.1, lossRate: 0.6, miscAnomaly: '正常' },
        { plate: '新A·12348', vehicleType: '母车', unit: '车队', subject: '新鹏运', onDutyDays: 27, onDutyRate: 93.1, tripCount: 26, monthlyProfit: -1200, gasPer100: 38.4, lossRate: 1.5, miscAnomaly: '突增' },
        { plate: '新A·12349', vehicleType: '子车', unit: '车队', subject: '新鹏运', onDutyDays: 28, onDutyRate: 96.6, tripCount: 27, monthlyProfit: 7800, gasPer100: 38.2, lossRate: 0.9, miscAnomaly: '正常' },
        { plate: '新A·12350', vehicleType: '母车', unit: '车队', subject: '新鹏运', onDutyDays: 24, onDutyRate: 82.8, tripCount: 20, monthlyProfit: 5200, gasPer100: 36.8, lossRate: 0.7, miscAnomaly: '正常' },
        { plate: '新A·12351', vehicleType: '子车', unit: '车队', subject: '红树林', onDutyDays: 30, onDutyRate: 100.0, tripCount: 32, monthlyProfit: 10100, gasPer100: 37.2, lossRate: 0.5, miscAnomaly: '正常' },
        { plate: '新A·12352', vehicleType: '母车', unit: '车队', subject: '红树林', onDutyDays: 19, onDutyRate: 65.5, tripCount: 14, monthlyProfit: 3200, gasPer100: 35.8, lossRate: 1.2, miscAnomaly: '突增' }
      ],
      indicators: [
        { code: 'P1-L1-D2-001', name: '运力车辆在营率', level: 'L1', source: '车辆运营总表.派车次数', target: '≥95%', threshold: '<90%', freq: '日' },
        { code: 'P1-L1-D2-002', name: '当日在途车辆', level: 'L1', source: '运营日报表.在途车辆', target: '≥80 台', threshold: '<70 台', freq: '日' },
        { code: 'P1-L1-D1-003', name: '途损超标运单数', level: 'L1', source: '2026 年明细.超出亏损范围', target: '0 单', threshold: '>5 单/月', freq: '月' },
        { code: 'P1-L2-D2-001', name: '在营车分布 Top/Bottom', level: 'L2', source: '车辆运营查询表.派车次数', target: '≥15 次/月', threshold: 'Bottom <5', freq: '月' },
        { code: 'P1-L2-D4-003', name: '车辆月度毛利榜', level: 'L2', source: '车辆运营查询表.毛利', target: '所有车 >0', threshold: '任一车 <0', freq: '月' },
        { code: 'P1-L2-D1-002', name: '途损超标率（按路线）', level: 'L2', source: '2026 年明细 按路线', target: '≤1%', threshold: '>5%', freq: '月' },
        { code: 'P1-L2-D3-001', name: '百公里用气分布', level: 'L2', source: '车辆运营总表.百公里用气', target: '母 ≤34/子 ≤37', threshold: '母 >36/子 >39', freq: '半月' },
        { code: 'P1-L2-D3-002', name: '车辆杂费异常监控', level: 'L2', source: '车辆杂费总表', target: '均值 ±30%', threshold: '>均值 ×1.5', freq: '月' },
        { code: 'P1-L2-D1-007', name: '当日在途过长预警', level: 'L2', source: '2026 年明细.本单耗时', target: '0 单', threshold: '≥1 单', freq: '日' },
        { code: 'P2-L2-D5-001', name: 'OCR 识别准确率（新增）', level: 'L2', source: '系统识别成功 / 总次数', target: '≥95%', threshold: '<90%', freq: '月' }
      ]
    }
  },
  methods: {
    search() { this.$message.info('查询逻辑由后端实现（演示）') },
    reset() { this.query = { month: '2026-04', unit: '', subject: '', vehicleType: '' } },
    viewVehicleDetail(row) {
      this.currentVehicle = row
      this.showVehicleDetail = true
    },
    viewHistory(row) {
      this.currentVehicle = row
      this.showHistory = true
    },
    vehicleAnomalies(v) {
      const arr = []
      if (v.onDutyRate < 90) arr.push(`在营率 ${v.onDutyRate}% 低于目标 95%`)
      if (v.monthlyProfit < 0) arr.push(`月度毛利为负 ¥${this.formatMoney(v.monthlyProfit)}`)
      if (this.gasOver(v)) arr.push(`百公里气耗 ${v.gasPer100} kg 超出 ${v.vehicleType === '母车' ? '母车阈值 36' : '子车阈值 39'}`)
      if (v.lossRate > 1) arr.push(`途损率 ${v.lossRate}% 超出 1%`)
      if (v.miscAnomaly !== '正常') arr.push(`杂费异常：${v.miscAnomaly}`)
      return arr
    },
    gasOver(v) {
      return (v.vehicleType === '母车' && v.gasPer100 > 36) || (v.vehicleType === '子车' && v.gasPer100 > 39)
    },
    formatMoney(v) { return Number(v).toLocaleString('zh-CN') }
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

.anomaly-list {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  line-height: 2;
  font-size: 13px;
}

.muted {
  color: #909399;
}
</style>
