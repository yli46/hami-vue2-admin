<template>
  <div>
    <el-card class="rule-note" shadow="never">
      <div class="rule-content">
        <strong>预警触发规则（[134财务规则V1.0.md] 表二 · WA-001 至 WA-011）</strong>：吨公里 9 项以百分点（pp）衡量偏差；利润率（业主目标 7.6%）/ 出车率（92%）/ 单车月营收（6 万元）为绝对值阈值。红色预警自动抄送红树林集团管理层。
      </div>
    </el-card>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true" size="small">
        <el-form-item label="预警级别">
          <el-select v-model="query.level" placeholder="全部" clearable style="width: 120px;">
            <el-option label="红色" value="red" />
            <el-option label="黄色" value="yellow" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务单元">
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 200px;" @change="onUnitChange">
            <el-option label="车队" value="fleet" />
            <el-option label="廊道（建设期）" value="corridor" />
            <el-option label="加气站（业主自有 · 天山乡站等）" value="gas-tsx" />
            <el-option label="制氢工厂" value="h2-plant" />
          </el-select>
        </el-form-item>
        <el-form-item label="主体">
          <el-select
            v-model="query.subject"
            placeholder="仅车队适用"
            clearable
            :disabled="query.unit !== 'fleet' && query.unit !== ''"
            style="width: 140px;"
          >
            <el-option label="红树林" value="hsl" />
            <el-option label="新鹏运" value="xpy" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px;">
            <el-option label="待处置" value="pending" />
            <el-option label="处置中" value="handling" />
            <el-option label="已闭环" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="query.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="yyyy-MM-dd"
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>超阈值预警 — 共 {{ tableData.length }} 条 · 待处置 {{ pendingCount }} 条</span>
        <div>
          <el-button size="small" plain @click="batchAck">批量标记已读</el-button>
          <el-button size="small" icon="el-icon-download" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="tableData" border size="small" @selection-change="onSelect">
        <el-table-column type="selection" width="44" />
        <el-table-column prop="triggerTime" label="预警时间" width="150" />
        <el-table-column prop="ruleCode" label="规则" width="80" align="center">
          <template slot-scope="scope">
            <span class="muted">{{ scope.row.ruleCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="item" label="预警项" min-width="200" />
        <el-table-column prop="unit" label="业务单元" width="100" align="center" />
        <el-table-column prop="subject" label="主体" width="90" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.subject === '红树林'" size="mini" type="danger" effect="plain">红树林</el-tag>
            <el-tag v-else-if="scope.row.subject === '新鹏运'" size="mini" type="primary" effect="plain">新鹏运</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="actualValue" label="实际值" width="100" align="right" />
        <el-table-column prop="benchValue" label="基线值" width="100" align="right" />
        <el-table-column label="偏差" width="100" align="right">
          <template slot-scope="scope">
            <span class="warning-text">{{ scope.row.variance }}</span>
          </template>
        </el-table-column>
        <el-table-column label="级别" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.level === 'red' ? 'danger' : 'warning'" size="mini">
              {{ scope.row.level === 'red' ? '红色' : '黄色' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="处置人" width="110" align="center">
          <template slot-scope="scope">{{ scope.row.owner || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="viewDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" @click="handle(scope.row)" v-if="scope.row.status !== 'closed'">
              {{ scope.row.status === 'pending' ? '接手' : '继续处置' }}
            </el-button>
            <el-button type="text" size="mini" @click="addNote(scope.row)">说明</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="tableData.length" :page-size="20" />
      </div>
    </el-card>

    <el-dialog :title="`预警详情 - ${currentRow.item}`" :visible.sync="showDetail" width="720px">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="规则编号">{{ currentRow.ruleCode }}</el-descriptions-item>
        <el-descriptions-item label="级别">
          <el-tag size="mini" :type="currentRow.level === 'red' ? 'danger' : 'warning'">
            {{ currentRow.level === 'red' ? '红色' : '黄色' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预警项">{{ currentRow.item }}</el-descriptions-item>
        <el-descriptions-item label="业务单元">{{ currentRow.unit }}{{ currentRow.subject ? ' · ' + currentRow.subject : '' }}</el-descriptions-item>
        <el-descriptions-item label="预警时间">{{ currentRow.triggerTime }}</el-descriptions-item>
        <el-descriptions-item label="处置状态">
          <el-tag :type="statusTag(currentRow.status)" size="mini">{{ statusLabel(currentRow.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="实际值">{{ currentRow.actualValue }}</el-descriptions-item>
        <el-descriptions-item label="基线值">{{ currentRow.benchValue }}</el-descriptions-item>
        <el-descriptions-item label="偏差"><span class="warning-text">{{ currentRow.variance }}</span></el-descriptions-item>
        <el-descriptions-item label="阈值">{{ currentRow.threshold || '—' }}</el-descriptions-item>
        <el-descriptions-item label="处置人">{{ currentRow.owner || '—' }}</el-descriptions-item>
        <el-descriptions-item label="通知人">{{ currentRow.notifyList || '—' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">处置历史</el-divider>
      <el-table :data="actionHistory" border size="small">
        <el-table-column prop="time" label="时间" width="150" />
        <el-table-column prop="actor" label="操作人" width="120" align="center" />
        <el-table-column prop="action" label="动作" width="120" align="center" />
        <el-table-column prop="note" label="说明" min-width="220" />
      </el-table>
    </el-dialog>

    <el-dialog title="添加预警说明" :visible.sync="showNote" width="520px">
      <el-form :model="noteForm" label-width="90px" size="small">
        <el-form-item label="预警项">
          <span>{{ noteForm.item }}</span>
        </el-form-item>
        <el-form-item label="说明类型">
          <el-radio-group v-model="noteForm.type">
            <el-radio label="cause">偏差原因</el-radio>
            <el-radio label="ack">已知悉</el-radio>
            <el-radio label="external">外部因素</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="详细说明">
          <el-input v-model="noteForm.content" type="textarea" :rows="4" placeholder="如：4 月气价上涨 8%，编制预算时未考虑" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showNote = false">取消</el-button>
        <el-button type="primary" @click="submitNote">提交说明</el-button>
      </span>
    </el-dialog>

    <el-dialog title="预警处置" :visible.sync="showHandle" width="560px">
      <el-form :model="handleForm" label-width="100px" size="small">
        <el-form-item label="预警项">
          <span>{{ handleForm.item }}</span>
        </el-form-item>
        <el-form-item label="当前状态">
          <el-tag :type="statusTag(handleForm.status)" size="mini">{{ statusLabel(handleForm.status) }}</el-tag>
        </el-form-item>
        <el-form-item label="偏差原因">
          <el-input
            v-model="handleForm.reason"
            type="textarea"
            :rows="3"
            placeholder="必填，如：4 月气价上涨 8%，编制预算时未考虑"
          />
        </el-form-item>
        <el-form-item label="处置动作">
          <el-radio-group v-model="handleForm.action">
            <el-radio label="continue">继续监控</el-radio>
            <el-radio label="adjust">申请调整预算</el-radio>
            <el-radio label="escalate">上报领导（红树林集团管理层终审）</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div class="dialog-note">
        状态机：待处置 → 处置中 → 已闭环。选择"上报领导"将推送至红树林集团管理层终审节点（红色预警建议走此路径）。超 24h 未处置自动催办（默认 24h，🔴 待业主回填）。
      </div>
      <span slot="footer">
        <el-button @click="showHandle = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">提交</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CostAlerts',
  data() {
    return {
      query: { level: '', unit: '', subject: '', status: '', dateRange: [] },
      selected: [],
      showHandle: false,
      showDetail: false,
      showNote: false,
      currentRow: {},
      handleForm: { item: '', status: '', reason: '', action: 'continue' },
      noteForm: { item: '', type: 'cause', content: '' },
      actionHistory: [
        { time: '2026-04-30 23:30', actor: '系统', action: '触发预警', note: '日终跑批检测加气占比偏差超 ±3 pp' },
        { time: '2026-04-30 23:35', actor: '系统', action: '推送通知', note: '已通知调度主管 + 公司财务（马伶俐）+ 红树林集团管理层（红色）' },
        { time: '2026-05-02 10:15', actor: '马伶俐', action: '接手处置', note: '初步判断与气价上涨相关，已申请调整预算' }
      ],
      tableData: [
        { triggerTime: '2026-04-30 23:30', ruleCode: 'WA-001', item: '吨公里加气占收入比超阈值', unit: '车队', subject: '红树林', actualValue: '37.6%', benchValue: '34.6%', variance: '+3.0 pp', threshold: '黄 ±3 pp / 红 ±5 pp', level: 'yellow', status: 'handling', owner: '马伶俐', notifyList: '调度主管 / 公司财务 / 红树林集团管理层' },
        { triggerTime: '2026-04-30 23:30', ruleCode: 'WA-007', item: '吨公里维修占收入比超阈值', unit: '车队', subject: '新鹏运', actualValue: '2.5%', benchValue: '1.9%', variance: '+0.6 pp', threshold: '黄 ±0.5 pp / 红 ±1 pp', level: 'yellow', status: 'pending', owner: '', notifyList: '安全主管 / 公司财务' },
        { triggerTime: '2026-04-30 23:30', ruleCode: 'WA-008', item: '吨公里成本合计超阈值', unit: '车队', subject: '新鹏运', actualValue: '95.5%', benchValue: '92.4%', variance: '+3.1 pp', threshold: '黄 ±2 pp / 红 ±3 pp', level: 'red', status: 'handling', owner: '马伶俐', notifyList: '公司财务 / 运营总监 / 红树林集团管理层' },
        { triggerTime: '2026-04-15 23:30', ruleCode: 'WA-009', item: '吨公里利润率低于目标', unit: '车队', subject: '红树林', actualValue: '6.3%', benchValue: '7.6%', variance: '低于黄线 7.0%', threshold: '黄 <7.0% / 红 <4.0%', level: 'yellow', status: 'closed', owner: '马伶俐', notifyList: '公司财务 / 运营总监' },
        { triggerTime: '2026-04-12 23:30', ruleCode: 'WA-010', item: '出车率低于业主底线', unit: '车队', subject: '', actualValue: '90%', benchValue: '92%', variance: '-2 pp', threshold: '黄 <92% / 红 <88%', level: 'yellow', status: 'closed', owner: '党帅', notifyList: '调度主管 / 生产队长 / 运营部部长' },
        { triggerTime: '2026-04-03 23:30', ruleCode: 'WA-001', item: '吨公里加气占比偏低（成本红利）', unit: '车队', subject: '新鹏运', actualValue: '31.0%', benchValue: '34.6%', variance: '-3.6 pp', threshold: '黄 ±3 pp / 红 ±5 pp', level: 'yellow', status: 'closed', owner: '王江江', notifyList: '调度主管 / 公司财务' }
      ]
    }
  },
  computed: {
    pendingCount() {
      return this.tableData.filter(r => r.status === 'pending').length
    }
  },
  methods: {
    search() { this.$message.info('查询逻辑由后端实现（演示）') },
    reset() { this.query = { level: '', unit: '', subject: '', status: '', dateRange: [] } },
    onUnitChange(v) {
      if (v !== 'fleet' && v !== '') {
        this.query.subject = ''
      }
    },
    onSelect(v) { this.selected = v },
    batchAck() {
      if (!this.selected.length) {
        this.$message.warning('请先勾选记录')
        return
      }
      this.$message.success(`已标记 ${this.selected.length} 条为已读`)
    },
    viewDetail(row) {
      this.currentRow = row
      this.showDetail = true
    },
    handle(row) {
      this.handleForm = { item: row.item, status: row.status, reason: '', action: 'continue' }
      this.showHandle = true
    },
    addNote(row) {
      this.noteForm = { item: row.item, type: 'cause', content: '' }
      this.showNote = true
    },
    submitHandle() {
      if (!this.handleForm.reason) {
        this.$message.warning('偏差原因必填（VR-134-006）')
        return
      }
      const msg = this.handleForm.action === 'escalate' ? '已上报红树林集团管理层终审节点' : '处置已提交，状态机已流转'
      this.$message.success(msg + '（演示）')
      this.showHandle = false
    },
    submitNote() {
      if (!this.noteForm.content) {
        this.$message.warning('请填写说明内容')
        return
      }
      this.$message.success('说明已添加（演示）')
      this.showNote = false
    },
    statusLabel(s) {
      return s === 'pending' ? '待处置' : s === 'handling' ? '处置中' : '已闭环'
    },
    statusTag(s) {
      return s === 'pending' ? 'danger' : s === 'handling' ? 'warning' : 'success'
    }
  }
}
</script>

<style scoped>
.search-card,
.rule-note,
.table-card {
  border: 1px solid #DCDFE6;
}

.rule-note {
  background: #FAFBFC;
  margin-bottom: 12px;
}

.rule-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.7;
}

.rule-content strong {
  color: #303133;
  margin-right: 6px;
}

.search-card {
  margin-bottom: 12px;
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

.muted {
  font-size: 12px;
  color: #909399;
}

.pagination {
  margin-top: 12px;
  text-align: right;
}

.dialog-note {
  margin: 8px 0;
  font-size: 12px;
  color: #909399;
  background: #FAFBFC;
  padding: 8px 12px;
  border-radius: 2px;
  border: 1px solid #E4E7ED;
}
</style>
