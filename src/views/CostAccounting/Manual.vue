<template>
  <div>
    <el-card class="hint-card" shadow="never">
      <div class="hint-text">
        <strong>边缘场景手动录入 · 兜底入口</strong>——5/15 用户裁决：手动录入兜底但不进主流程。仅在以下情况使用：
        <ul>
          <li>主营业务范围外的零星费用调整（如年中科目重分类）</li>
          <li>系统未自动归集的特殊费用（如跨年度费用重新匹配）</li>
          <li>历史数据补录（系统上线前的数据迁移）</li>
        </ul>
        日常运营不依赖手动录入。所有手动录入均留痕，必填录入事由 + ERP 科目编码（[M003] 6602 / 6603 33 项），由公司财务或子公司新鹏运财务复核。
      </div>
    </el-card>

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
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px;">
            <el-option label="待复核" value="pending" />
            <el-option label="已复核" value="reviewed" />
            <el-option label="已冲销" value="writeoff" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>手动录入记录 — 共 {{ tableData.length }} 条 · 待复核 {{ pendingCount }} 条</span>
        <div>
          <el-button size="small" plain icon="el-icon-edit" @click="openCreate">新增手动录入</el-button>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="tableData" border size="small">
        <el-table-column prop="entryTime" label="录入时间" width="150" />
        <el-table-column prop="unit" label="业务单元" width="100" align="center" />
        <el-table-column prop="subject" label="主体" width="90" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.subject === '红树林'" size="mini" type="danger" effect="plain">红树林</el-tag>
            <el-tag v-else-if="scope.row.subject === '新鹏运'" size="mini" type="primary" effect="plain">新鹏运</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="accountCode" label="ERP 科目" width="100" align="center">
          <template slot-scope="scope"><span class="muted">{{ scope.row.accountCode }}</span></template>
        </el-table-column>
        <el-table-column prop="account" label="科目名称" min-width="200" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.amount < 0 }">¥ {{ formatMoney(scope.row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="录入事由" min-width="240" />
        <el-table-column prop="entrant" label="录入人" width="110" align="center" />
        <el-table-column prop="reviewer" label="复核人" width="130" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="viewDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" class="danger-text" @click="rollback(scope.row)" v-if="scope.row.status === 'reviewed'">冲销</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="新增手动录入" :visible.sync="showCreate" width="600px">
      <el-form :model="form" :rules="rules" ref="form" label-width="120px" size="small">
        <el-form-item label="业务单元" prop="unit">
          <el-select v-model="form.unit" placeholder="请选择" style="width: 100%;" @change="onFormUnitChange">
            <el-option label="车队" value="fleet" />
            <el-option label="廊道（建设期）" value="corridor" />
            <el-option label="加气站（业主自有 · 天山乡站等）" value="gas-tsx" />
            <el-option label="制氢工厂" value="h2-plant" />
          </el-select>
        </el-form-item>
        <el-form-item label="主体" prop="subject" v-if="form.unit === 'fleet'">
          <el-select v-model="form.subject" placeholder="车队板块需选主体" style="width: 100%;">
            <el-option label="红树林" value="hsl" />
            <el-option label="新鹏运" value="xpy" />
          </el-select>
        </el-form-item>
        <el-form-item label="ERP 科目" prop="accountCode">
          <el-select v-model="form.accountCode" placeholder="请选择 [M003] 标准编码" style="width: 100%;" @change="onAccountCodeChange" filterable>
            <el-option-group label="6602 管理费用（节选）">
              <el-option label="660209 工资总额" value="660209" />
              <el-option label="660214 车辆使用费" value="660214" />
              <el-option label="660219 保险费" value="660219" />
              <el-option label="660225 折旧费" value="660225" />
              <el-option label="660299 其他" value="660299" />
            </el-option-group>
            <el-option-group label="6603 财务费用（节选）">
              <el-option label="660301 利息支出" value="660301" />
              <el-option label="660302 利息收入" value="660302" />
              <el-option label="660303 汇兑损益" value="660303" />
              <el-option label="660304 手续费" value="660304" />
              <el-option label="660305 其他" value="660305" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="科目名称">
          <el-input v-model="form.account" placeholder="按 ERP 编码自动带出，可补充末级名称" />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :step="100" />
          <span style="margin-left: 8px; color: #606266;">元（正数=收入 / 负数=费用）</span>
        </el-form-item>
        <el-form-item label="录入事由" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="必填，详细说明为什么需要手动录入而非自动归集" />
        </el-form-item>
        <el-form-item label="复核人" prop="reviewer">
          <el-select v-model="form.reviewer" placeholder="按业务单元自动派定，可调" style="width: 100%;">
            <el-option label="公司财务 - 马伶俐（哈密普发）" value="马伶俐" />
            <el-option label="子公司新鹏运财务" value="新鹏运财务" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="dialog-note">
        提交后进入复核流程（状态：待复核）。复核派定规则：车队 + 红树林 → 公司财务（哈密普发，马伶俐）；车队 + 新鹏运 → 子公司新鹏运财务；其他业务单元 → 公司财务。复核通过后计入预算执行。
      </div>
      <span slot="footer">
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">提交复核</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="`手动录入详情 - ${currentRow.account}`" :visible.sync="showDetail" width="680px">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="录入时间">{{ currentRow.entryTime }}</el-descriptions-item>
        <el-descriptions-item label="业务单元">{{ currentRow.unit }}{{ currentRow.subject ? ' · ' + currentRow.subject : '' }}</el-descriptions-item>
        <el-descriptions-item label="ERP 科目">{{ currentRow.accountCode }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTag(currentRow.status)" size="mini">{{ statusLabel(currentRow.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="科目名称" :span="2">{{ currentRow.account }}</el-descriptions-item>
        <el-descriptions-item label="金额">
          <strong :class="{ 'warning-text': currentRow.amount < 0 }">¥ {{ formatMoney(currentRow.amount) }}</strong>
        </el-descriptions-item>
        <el-descriptions-item label="录入人">{{ currentRow.entrant }}</el-descriptions-item>
        <el-descriptions-item label="复核人" :span="2">{{ currentRow.reviewer }}</el-descriptions-item>
        <el-descriptions-item label="录入事由" :span="2">{{ currentRow.reason }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">复核记录</el-divider>
      <el-table :data="reviewHistory" border size="small">
        <el-table-column prop="time" label="时间" width="150" />
        <el-table-column prop="actor" label="操作人" width="130" align="center" />
        <el-table-column prop="action" label="动作" width="100" align="center" />
        <el-table-column prop="note" label="意见" min-width="240" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CostManual',
  data() {
    return {
      query: { month: '2026-04', unit: '', subject: '', status: '' },
      showCreate: false,
      showDetail: false,
      currentRow: {},
      form: { unit: '', subject: '', accountCode: '', account: '', amount: 0, reason: '', reviewer: '' },
      rules: {
        unit: [{ required: true, message: '业务单元必选', trigger: 'change' }],
        subject: [{ required: true, message: '车队板块需选主体（VR-134-008）', trigger: 'change' }],
        accountCode: [{ required: true, message: 'ERP 科目必选（VR-134-009）', trigger: 'change' }],
        amount: [{ required: true, message: '金额必填', trigger: 'blur' }],
        reason: [{ required: true, message: '录入事由必填（VR-134-003）', trigger: 'blur' }],
        reviewer: [{ required: true, message: '复核人必选（VR-134-004）', trigger: 'change' }]
      },
      accountMap: {
        660209: '工资总额',
        660214: '车辆使用费',
        660219: '保险费',
        660225: '折旧费',
        660299: '其他',
        660301: '利息支出',
        660302: '利息收入',
        660303: '汇兑损益',
        660304: '手续费',
        660305: '其他'
      },
      reviewHistory: [
        { time: '2026-04-22 14:15', actor: '红树林财务', action: '提交', note: '2026-03 维保单据延迟到账' },
        { time: '2026-04-22 16:30', actor: '马伶俐', action: '复核通过', note: '凭据齐全，金额一致' }
      ],
      tableData: [
        { entryTime: '2026-04-22 14:15', unit: '车队', subject: '红树林', accountCode: '660214', account: '车辆使用费 / 维修分项', amount: -3500, reason: '2026-03 维保单据延迟到账', entrant: '红树林财务', reviewer: '马伶俐', status: 'reviewed' },
        { entryTime: '2026-04-28 10:30', unit: '车队', subject: '新鹏运', accountCode: '660209', account: '工资总额 / 司机趟结调整', amount: 12000, reason: '陇能补传 2026-03 末几笔磅单触发趟结补发', entrant: '马伶俐', reviewer: '新鹏运财务', status: 'pending' },
        { entryTime: '2026-04-30 16:50', unit: '加气站（业主自有 · 天山乡站等）', subject: '', accountCode: '660299', account: '其他 / 低值易耗补登', amount: -1200, reason: '天山乡站 4 月维护耗材补录', entrant: '基地统计员', reviewer: '马伶俐', status: 'pending' }
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
    reset() { this.query = { month: '2026-04', unit: '', subject: '', status: '' } },
    onUnitChange(v) {
      if (v !== 'fleet' && v !== '') {
        this.query.subject = ''
      }
    },
    onFormUnitChange(v) {
      if (v !== 'fleet') {
        this.form.subject = ''
        this.form.reviewer = '马伶俐'
      } else {
        this.form.reviewer = ''
      }
    },
    onAccountCodeChange(v) {
      if (v && this.accountMap[v]) {
        this.form.account = this.accountMap[v]
      }
    },
    openCreate() {
      this.form = { unit: '', subject: '', accountCode: '', account: '', amount: 0, reason: '', reviewer: '' }
      this.showCreate = true
    },
    submitCreate() {
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.$message.success('已提交复核（演示）—— 进入待复核状态')
        this.showCreate = false
      })
    },
    viewDetail(row) {
      this.currentRow = row
      this.showDetail = true
    },
    rollback(row) {
      this.$confirm(
        `确认冲销该笔手动录入（${row.account}，¥${this.formatMoney(row.amount)}）？冲销后预算执行数据将回退，操作不可恢复。`,
        '冲销确认',
        { confirmButtonText: '确认冲销', cancelButtonText: '取消', type: 'warning' }
      ).then(() => {
        this.$message.success('已冲销（演示）')
      }).catch(() => {})
    },
    formatMoney(v) { return Number(v).toLocaleString('zh-CN') },
    statusLabel(s) { return s === 'pending' ? '待复核' : s === 'reviewed' ? '已复核' : '已冲销' },
    statusTag(s) { return s === 'pending' ? 'warning' : s === 'reviewed' ? 'success' : 'info' }
  }
}
</script>

<style scoped>
.hint-card {
  border: 1px solid #DCDFE6;
  background: #FAFBFC;
  margin-bottom: 12px;
}

.hint-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.8;
}

.hint-text strong {
  color: #303133;
  margin-right: 6px;
}

.hint-text ul {
  margin: 6px 0 0 0;
  padding-left: 20px;
}

.search-card,
.table-card {
  border: 1px solid #DCDFE6;
}

.search-card {
  margin-bottom: 12px;
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.danger-text {
  color: #F56C6C;
}

.warning-text {
  color: #F56C6C;
  font-weight: 500;
}

.muted {
  font-size: 12px;
  color: #909399;
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
