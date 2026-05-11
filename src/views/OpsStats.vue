<template>
  <div class="page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" size="small">
        <el-form-item label="期间">
          <el-date-picker
            v-model="query.dateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            value-format="yyyy-MM"
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item label="维度">
          <el-radio-group v-model="query.dim" size="small">
            <el-radio-button label="route">按路线</el-radio-button>
            <el-radio-button label="customer">按客户</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="kpi-row">
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">本月运煤量</div>
        <div class="kpi-value">12.84 万吨</div>
        <div class="kpi-meta">同比 +8.2%</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">平均装载率</div>
        <div class="kpi-value">37.2 吨</div>
        <div class="kpi-meta">目标 ≥37</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">业财健康度指数</div>
        <div class="kpi-value">87</div>
        <div class="kpi-meta">≥85 正常 / &lt;80 预警</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">滞留超 30 天单数</div>
        <div class="kpi-value warning">3</div>
        <div class="kpi-meta">需关注</div>
      </el-card>
    </div>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>路线运营指标 — 2026-04</span>
        <div>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="routeData" border size="small" stripe>
        <el-table-column prop="route" label="路线" min-width="160" />
        <el-table-column prop="cargoVolume" label="货运总量（吨）" width="140" align="right">
          <template slot-scope="scope">{{ formatMoney(scope.row.cargoVolume) }}</template>
        </el-table-column>
        <el-table-column prop="loadRate" label="装载率" width="100" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.loadRate < 36 }">{{ scope.row.loadRate }} 吨</span>
          </template>
        </el-table-column>
        <el-table-column prop="lossRate" label="货损率" width="100" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.lossRate > 1 }">{{ scope.row.lossRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="netCashFlow" label="净现金流（万元）" width="150" align="right">
          <template slot-scope="scope">
            <strong :class="{ 'warning-text': scope.row.netCashFlow < 0 }">{{ scope.row.netCashFlow }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="profitShare" label="占应结比例" width="110" align="right">
          <template slot-scope="scope">{{ scope.row.profitShare }}%</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.statusType" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="viewRouteDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="bf-card" shadow="never">
      <div slot="header"><span>业财穿透看板 — 业财健康度六个分量</span></div>
      <el-table :data="bfData" border size="small">
        <el-table-column prop="code" label="编号" width="100" />
        <el-table-column prop="name" label="指标名称" min-width="200" />
        <el-table-column prop="value" label="当期值" width="120" align="right">
          <template slot-scope="scope"><strong>{{ scope.row.value }}</strong></template>
        </el-table-column>
        <el-table-column prop="target" label="目标" width="120" align="center" />
        <el-table-column prop="threshold" label="预警" width="140" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.statusType" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="viewBfDetail(scope.row)">下钻</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="bf-note">
        业财健康度指数 = 综合上述 6 个分量计算，当前值 <strong>87</strong>（≥85 正常）。具体权重待业主回填财务规则后定。
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
        <el-table-column prop="threshold" label="预警阈值" width="140" align="center" />
        <el-table-column prop="freq" label="频次" width="80" align="center" />
      </el-table>
    </el-card>

    <el-dialog :title="`${currentRoute.route} - 路线运营详情`" :visible.sync="showRouteDetail" width="720px">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="路线">{{ currentRoute.route }}</el-descriptions-item>
        <el-descriptions-item label="货运总量">{{ formatMoney(currentRoute.cargoVolume) }} 吨</el-descriptions-item>
        <el-descriptions-item label="装载率">{{ currentRoute.loadRate }} 吨</el-descriptions-item>
        <el-descriptions-item label="货损率">{{ currentRoute.lossRate }}%</el-descriptions-item>
        <el-descriptions-item label="净现金流">¥ {{ currentRoute.netCashFlow }} 万元</el-descriptions-item>
        <el-descriptions-item label="占应结比例">{{ currentRoute.profitShare }}%</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">分客户拆解</el-divider>
      <el-table :data="routeCustomerData" border size="small">
        <el-table-column prop="customer" label="客户" min-width="120" />
        <el-table-column prop="volume" label="货运量（吨）" width="120" align="right" />
        <el-table-column prop="amount" label="结算金额（万元）" width="140" align="right" />
        <el-table-column prop="payStatus" label="回款状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" :type="scope.row.payStatus === '已结清' ? 'success' : 'warning'">{{ scope.row.payStatus }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog :title="`${currentBf.name} - 下钻明细`" :visible.sync="showBfDetail" width="640px">
      <el-descriptions :column="1" size="small" border>
        <el-descriptions-item label="指标编号">{{ currentBf.code }}</el-descriptions-item>
        <el-descriptions-item label="指标名称">{{ currentBf.name }}</el-descriptions-item>
        <el-descriptions-item label="当期值"><strong>{{ currentBf.value }}</strong></el-descriptions-item>
        <el-descriptions-item label="目标">{{ currentBf.target }}</el-descriptions-item>
        <el-descriptions-item label="预警阈值">{{ currentBf.threshold }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">最近 6 期趋势</el-divider>
      <el-table :data="bfTrendData" border size="small">
        <el-table-column prop="period" label="期间" width="120" align="center" />
        <el-table-column prop="value" label="数值" width="120" align="right" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" :type="scope.row.status === '达标' ? 'success' : 'warning'">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="160" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'OpsStats',
  data() {
    return {
      query: { dateRange: ['2026-01', '2026-04'], dim: 'route' },
      showRouteDetail: false,
      showBfDetail: false,
      currentRoute: { route: '' },
      currentBf: {},
      routeCustomerData: [
        { customer: '陇能宁夏A线', volume: 18420, amount: 1280, payStatus: '已结清' },
        { customer: '陇能淖毛湖B线', volume: 12340, amount: 856, payStatus: '部分回款' },
        { customer: '陇能甘肃C线', volume: 8920, amount: 624, payStatus: '挂账' }
      ],
      bfTrendData: [
        { period: '2025-11', value: '99.2%', status: '达标', note: '正常' },
        { period: '2025-12', value: '98.7%', status: '达标', note: '正常' },
        { period: '2026-01', value: '98.4%', status: '达标', note: '春节运量增加' },
        { period: '2026-02', value: '97.6%', status: '预警', note: '低于 98%' },
        { period: '2026-03', value: '98.9%', status: '达标', note: '正常' },
        { period: '2026-04', value: '99.1%', status: '达标', note: '正常' }
      ],
      routeData: [
        { route: '哈密-淖毛湖', cargoVolume: 38420, loadRate: 38.2, lossRate: 0.7, netCashFlow: 482, profitShare: 24.8, status: '正常', statusType: 'success' },
        { route: '哈密-甘肃酒泉', cargoVolume: 31280, loadRate: 37.5, lossRate: 1.2, netCashFlow: 326, profitShare: 18.3, status: '正常', statusType: 'success' },
        { route: '哈密-宁夏中卫', cargoVolume: 28640, loadRate: 36.8, lossRate: 0.9, netCashFlow: 245, profitShare: 15.6, status: '正常', statusType: 'success' },
        { route: '哈密-内蒙古鄂尔多斯', cargoVolume: 18420, loadRate: 35.4, lossRate: 1.5, netCashFlow: 86, profitShare: 9.2, status: '毛利偏低', statusType: 'warning' },
        { route: '哈密-陕西榆林', cargoVolume: 11760, loadRate: 34.2, lossRate: 1.8, netCashFlow: -42, profitShare: -4.5, status: '亏损', statusType: 'danger' }
      ],
      bfData: [
        { code: 'BF-001', name: '派单→装货→卸货→结算 三段转化率', value: '99.1%', target: '每段 ≥99%', threshold: '任一段 <98%', status: '达标', statusType: 'success' },
        { code: 'BF-002', name: '应结→开票 转化率', value: '94.2%', target: '≥95%', threshold: '<90%', status: '接近阈值', statusType: 'warning' },
        { code: 'BF-003', name: '开票→回款 转化率', value: '88.5%', target: '≥95%', threshold: '<85% 持续', status: '需关注', statusType: 'warning' },
        { code: 'BF-004', name: '各节点滞留天数中位数', value: '5.2 天', target: '路线均值 ×1', threshold: '>路线均值 ×1.5', status: '达标', statusType: 'success' },
        { code: 'BF-005', name: 'P90 滞留天数', value: '14.3 天', target: '≤中位数 ×2', threshold: '>中位数 ×3', status: '达标', statusType: 'success' },
        { code: 'BF-006', name: '滞留超 30 天运单数', value: '3 单', target: '0 单', threshold: '>5 单持续上升', status: '可控', statusType: 'warning' }
      ],
      indicators: [
        { code: 'P1-L1-D1-001', name: '当日运煤量', level: 'L1', source: '运营日报表.卸货吨位', target: '待甲方给目标', threshold: '环比 ↓>10%', freq: '日' },
        { code: 'P1-L1-D1-002', name: '平均卸货吨位趋势', level: 'L1', source: '运营日报表（7 日均值）', target: '持平或上升', threshold: '环比 -2%', freq: '日' },
        { code: 'P1-L2-D4-001', name: '路线净现金流排名', level: 'L2', source: '线路累计总表', target: '所有路线 ≥20%', threshold: '<10% 持续 2 月', freq: '月' },
        { code: 'P1-L2-D1-001', name: '分路线装载率', level: 'L2', source: '线路累计总表', target: '≥37', threshold: '<36 持续 1 周', freq: '周' },
        { code: 'P1-L2-D1-006', name: '空驶公里占比', level: 'L2', source: '车辆运营总表', target: '≤25%', threshold: '>35%', freq: '月' },
        { code: 'P1-L2-D1-005', name: '派单→接单异常率（修订）', level: 'L2', source: '本平台调度模块异常情况', target: '≤2%', threshold: '>5%', freq: '日' },
        { code: 'BF-001 ~ BF-006', name: '业财穿透 6 个分量', level: 'BF', source: '运单 / 结算 / 开票 / 回款', target: '各分量目标', threshold: '各分量阈值', freq: '周/月' },
        { code: 'BF-007', name: '业财健康度指数', level: 'BF', source: '综合 BF-001~006（权重待业主）', target: '≥85', threshold: '<80', freq: '月' }
      ]
    }
  },
  methods: {
    search() { this.$message.info('查询逻辑由后端实现（演示）') },
    reset() { this.query = { dateRange: ['2026-01', '2026-04'], dim: 'route' } },
    viewRouteDetail(row) {
      this.currentRoute = row
      this.showRouteDetail = true
    },
    viewBfDetail(row) {
      this.currentBf = row
      this.showBfDetail = true
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
.bf-card,
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

.bf-note {
  margin-top: 12px;
  font-size: 12px;
  color: #606266;
  background: #FAFBFC;
  padding: 8px 12px;
  border-radius: 2px;
  border: 1px solid #E4E7ED;
}

.bf-note strong {
  color: #303133;
}
</style>
