<template>
  <div class="page">
    <el-card class="rule-banner" shadow="never">
      <div class="banner-content">
        <strong>133 预算编制 · 周期口径（5/15 用户裁决）</strong>：以月为编制周期 · 当月末编制下个月预算（例如 4 月底编制 5 月预算）。系统默认新增 / 重置时选中 <code>M{{ String(autoNextMonth).padStart(2, '0') }}</code>。
      </div>
    </el-card>

    <!-- A 查询条件 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" size="small">
        <el-form-item label="业务单元">
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 180px;" @change="onQueryUnitChange">
            <el-option label="车队" value="fleet" />
            <el-option label="廊道（建设期）" value="corridor" />
            <el-option label="加气站（天山乡等）" value="gas-tsx" />
            <el-option label="制氢工厂" value="h2-plant" />
          </el-select>
        </el-form-item>
        <el-form-item label="主体" v-if="query.unit === 'fleet'">
          <el-select v-model="query.subject" placeholder="全部" clearable style="width: 140px;">
            <el-option label="红树林" value="hsl" />
            <el-option label="新鹏运" value="xpy" />
          </el-select>
        </el-form-item>
        <el-form-item label="年度">
          <el-select v-model="query.year" style="width: 110px;">
            <el-option label="2026" value="2026" />
            <el-option label="2027" value="2027" />
          </el-select>
        </el-form-item>
        <el-form-item label="周期粒度">
          <el-select v-model="query.periodType" clearable placeholder="全部" style="width: 130px;">
            <el-option label="年度" value="year" />
            <el-option label="季度" value="quarter" />
            <el-option label="月度" value="month" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px;">
            <el-option label="草稿" value="draft" />
            <el-option label="审批中" value="reviewing" />
            <el-option label="已生效" value="effective" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- B 操作 + 表格 -->
    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>预算编制 — {{ query.year }} 年度（4 板块 · 月为周期 · 当月末编下月预算）</span>
        <div>
          <el-button type="primary" icon="el-icon-plus" size="small" @click="openCreate">新增预算</el-button>
          <el-button icon="el-icon-upload2" size="small" plain @click="openImport">Excel 导入</el-button>
          <el-button icon="el-icon-download" size="small" plain @click="onExport">导出</el-button>
        </div>
      </div>

      <el-table :data="filteredTable" border stripe size="small">
        <el-table-column prop="unitName" label="业务单元" width="150" align="center" />
        <el-table-column prop="subject" label="主体" width="100" align="center">
          <template slot-scope="scope">{{ scope.row.subject || '—' }}</template>
        </el-table-column>
        <el-table-column prop="period" label="周期" width="130" align="center" />
        <el-table-column prop="totalBudget" label="预算总额（万元）" width="160" align="right">
          <template slot-scope="scope">{{ formatMoney(scope.row.totalBudget) }}</template>
        </el-table-column>
        <el-table-column prop="version" label="当前版本" width="110" align="center" />
        <el-table-column prop="status" label="审批状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewLabel" label="审批进度" width="160" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.status === 'reviewing'">{{ scope.row.reviewLabel }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="editor" label="编制人" width="110" align="center" />
        <el-table-column prop="updatedAt" label="最近更新" width="150" />
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="viewDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" v-if="scope.row.status === 'draft'" @click="edit(scope.row)">编辑</el-button>
            <el-button type="text" size="mini" @click="viewVersion(scope.row)">版本对比</el-button>
            <el-button type="text" size="mini" v-if="scope.row.status === 'draft'" @click="submitReview(scope.row)">提交审批</el-button>
            <el-button type="text" size="mini" v-if="scope.row.status === 'reviewing'" @click="openApproval(scope.row)">审批</el-button>
            <el-button type="text" size="mini" v-if="scope.row.status === 'rejected'" @click="reedit(scope.row)">重新编辑</el-button>
            <el-button type="text" size="mini" class="danger-text" v-if="scope.row.status === 'draft'" @click="confirmDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="filteredTable.length" :page-size="20" />
      </div>
    </el-card>

    <!-- D P002 新建/编辑/详情 弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="showForm" width="1080px" :close-on-click-modal="false">
      <el-form :model="form" label-width="110px" size="small">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="业务单元" required>
              <el-select v-model="form.unit" placeholder="请选择" style="width: 100%;" :disabled="isViewOnly || isEdit" @change="onFormUnitChange">
                <el-option label="车队" value="fleet" />
                <el-option label="廊道（建设期）" value="corridor" />
                <el-option label="加气站（天山乡等）" value="gas-tsx" />
                <el-option label="制氢工厂" value="h2-plant" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="主体" :required="form.unit === 'fleet'" v-if="form.unit === 'fleet'">
              <el-select v-model="form.subject" placeholder="车队需选主体" style="width: 100%;" :disabled="isViewOnly || isEdit" @change="onFormSubjectChange">
                <el-option label="红树林" value="hsl" />
                <el-option label="新鹏运" value="xpy" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="年度" required>
              <el-select v-model="form.year" style="width: 100%;" :disabled="isViewOnly || isEdit">
                <el-option label="2026" value="2026" />
                <el-option label="2027" value="2027" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="周期" required>
              <el-select v-model="form.period" placeholder="请选择" style="width: 100%;" :disabled="isViewOnly || isEdit">
                <el-option label="全年" value="YEAR" />
                <el-option label="Q1（1-3 月）" value="Q1" />
                <el-option label="Q2（4-6 月）" value="Q2" />
                <el-option label="Q3（7-9 月）" value="Q3" />
                <el-option label="Q4（10-12 月）" value="Q4" />
                <el-option v-for="m in 12" :key="'M' + m" :label="'M' + (m < 10 ? '0' + m : m)" :value="'M' + (m < 10 ? '0' + m : m)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="版本" required>
              <el-input v-model="form.version" placeholder="如 v1.0 草案" :disabled="isViewOnly" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="拉取上年实际">
              <el-switch v-model="form.useLastYearBaseline" :disabled="isViewOnly || form.year === '2026'" />
              <span class="form-hint" v-if="form.year === '2026'">首年无上年实际数</span>
            </el-form-item>
          </el-col>
          <el-col :span="6" v-if="form.useLastYearBaseline">
            <el-form-item label="集团下达增长率">
              <el-input-number v-model="form.growthRate" :min="-0.5" :max="1" :step="0.01" :precision="2" :disabled="isViewOnly" style="width: 100%;" />
              <span class="form-hint">范围 -50% ~ +100%</span>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="编制人">
              <el-input v-model="form.editor" :disabled="isViewOnly" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 业主官方预填提示卡 -->
        <div class="prefill-card" v-if="prefillBox.length > 0">
          <div class="prefill-title">
            <i class="el-icon-info"></i>
            <strong>业主官方测算预填提示</strong>
            <span class="prefill-source">来源：inputs/ 经营计划测算.xlsx + 办公会议纪要（深红办字〔2026〕1 号）260206</span>
          </div>
          <div class="prefill-grid">
            <div class="prefill-item" v-for="(it, idx) in prefillBox" :key="idx">
              <div class="prefill-label">{{ it.label }}</div>
              <div class="prefill-value">{{ it.value }}</div>
            </div>
          </div>
          <div class="prefill-note">提示卡仅作业主官方数字回顾，编制人需在下方矩阵中确认或修订金额；矩阵保存值为最终预算数据。</div>
        </div>

        <el-divider content-position="left">月度预算明细矩阵 — 10 项费用科目 × 12 月（趟结工资 / 杂费已按 5/12 业主硬要求拆开）</el-divider>

        <div class="matrix-wrap">
          <el-table :data="form.details" border size="mini" :max-height="380">
            <el-table-column prop="account" label="费用科目" width="160" fixed="left" />
            <el-table-column prop="accountCode" label="ERP 编码" width="200" fixed="left" />
            <el-table-column prop="ratio" label="官方占比" width="90" align="center">
              <template slot-scope="scope"><span class="muted">{{ scope.row.ratio }}</span></template>
            </el-table-column>
            <el-table-column v-for="(m, idx) in months" :key="m" :label="m" width="88" align="right">
              <template slot-scope="scope">
                <el-input-number
                  v-model="scope.row.values[idx]"
                  size="mini"
                  :controls="false"
                  :min="0"
                  :step="1000"
                  :disabled="isViewOnly"
                  style="width: 80px;"
                />
              </template>
            </el-table-column>
            <el-table-column label="科目合计" width="120" align="right" fixed="right">
              <template slot-scope="scope">
                <strong>{{ formatMoney(rowSum(scope.row)) }}</strong>
              </template>
            </el-table-column>
          </el-table>
          <div class="matrix-footer">
            <span>金额单位：元（步长 1,000）</span>
            <span>预算总额：<strong>{{ formatMoney(totalBudget) }}</strong> 元 ≈ <strong>{{ formatMoney(totalBudget / 10000) }}</strong> 万元</span>
          </div>
        </div>
      </el-form>

      <span slot="footer">
        <el-button @click="showForm = false">{{ isViewOnly ? '关闭' : '取消' }}</el-button>
        <el-button v-if="!isViewOnly" @click="saveDraft">保存草稿</el-button>
        <el-button v-if="!isViewOnly" type="primary" @click="submitDirect">保存并提交审批</el-button>
      </span>
    </el-dialog>

    <!-- E P004 多级审批弹窗 -->
    <el-dialog title="预算审批" :visible.sync="showApproval" width="720px" :close-on-click-modal="false">
      <el-descriptions :column="2" size="small" border v-if="approvalRow">
        <el-descriptions-item label="业务单元">{{ approvalRow.unitName }}</el-descriptions-item>
        <el-descriptions-item label="主体">{{ approvalRow.subject || '—' }}</el-descriptions-item>
        <el-descriptions-item label="周期">{{ approvalRow.period }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ approvalRow.version }}</el-descriptions-item>
        <el-descriptions-item label="预算总额">{{ formatMoney(approvalRow.totalBudget) }} 万元</el-descriptions-item>
        <el-descriptions-item label="编制人">{{ approvalRow.editor }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ approvalRow.updatedAt }}</el-descriptions-item>
        <el-descriptions-item label="当前审批层级">
          <el-tag size="mini" type="warning">{{ approvalRow.reviewLabel }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div class="approval-trail" v-if="approvalRow">
        <div class="approval-trail-title">审批流转记录</div>
        <el-timeline>
          <el-timeline-item
            v-for="(log, idx) in approvalRow.approvalLogs"
            :key="idx"
            :type="log.action === 'approve' ? 'success' : (log.action === 'reject' ? 'danger' : 'primary')"
            :timestamp="log.time"
          >
            <strong>{{ log.role }}</strong> {{ log.actionLabel }}
            <div class="approval-comment" v-if="log.comment">意见：{{ log.comment }}</div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <el-form :model="approvalForm" label-width="100px" size="small" style="margin-top: 16px;">
        <el-form-item label="审批意见">
          <el-input v-model="approvalForm.comment" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="通过可不填；驳回必填" />
        </el-form-item>
      </el-form>

      <span slot="footer">
        <el-button @click="showApproval = false">取消</el-button>
        <el-button type="danger" @click="doReject">驳回</el-button>
        <el-button type="primary" @click="doApprove">通过</el-button>
      </span>
    </el-dialog>

    <!-- F P005 版本对比/历史 弹窗 -->
    <el-dialog
      :title="versionDialogTitle"
      :visible.sync="showVersion"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-table :data="versionHistory" border size="small">
        <el-table-column prop="version" label="版本号" width="110" align="center" />
        <el-table-column prop="totalBudget" label="预算总额（万元）" width="140" align="right">
          <template slot-scope="scope">{{ formatMoney(scope.row.totalBudget) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="editor" label="编制人" width="100" align="center" />
        <el-table-column prop="reviewedBy" label="审批人" width="120" align="center">
          <template slot-scope="scope">{{ scope.row.reviewedBy || '—' }}</template>
        </el-table-column>
        <el-table-column prop="changeLog" label="变更说明" min-width="220" />
        <el-table-column prop="updatedAt" label="时间" width="140" />
        <el-table-column label="操作" width="90" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="diffVersion(scope.row)">对比</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left" v-if="diffActive">月度差异对比 — {{ diffActive.version }} vs 当前版本</el-divider>
      <el-table v-if="diffActive" :data="diffActive.diffRows" border size="mini" :max-height="280">
        <el-table-column prop="account" label="费用科目" width="160" fixed="left" />
        <el-table-column label="旧合计（元）" align="right" width="140">
          <template slot-scope="scope">{{ formatMoney(scope.row.oldSum) }}</template>
        </el-table-column>
        <el-table-column label="新合计（元）" align="right" width="140">
          <template slot-scope="scope">{{ formatMoney(scope.row.newSum) }}</template>
        </el-table-column>
        <el-table-column label="差额（元）" align="right" width="140">
          <template slot-scope="scope">
            <span :class="scope.row.delta > 0 ? 'up' : (scope.row.delta < 0 ? 'down' : '')">
              {{ scope.row.delta > 0 ? '+' : '' }}{{ formatMoney(scope.row.delta) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="comment" label="说明" min-width="200" />
      </el-table>
    </el-dialog>

    <!-- G P006 Excel 导入弹窗 -->
    <el-dialog title="Excel 导入预算矩阵" :visible.sync="showImport" width="520px">
      <div class="import-area">
        <el-upload
          drag
          action=""
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.xls"
          :on-change="onImportFile"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <div slot="tip" class="el-upload__tip">仅支持 xlsx 格式 / 单个文件不超过 5 MB</div>
        </el-upload>
        <div class="template-tip">
          <a href="#" @click.prevent="downloadTemplate">下载预算导入模板（10 项费用科目 × 12 月 · 首列 ERP 编码）</a>
        </div>
      </div>
      <span slot="footer">
        <el-button @click="showImport = false">取消</el-button>
        <el-button type="primary" @click="doImport">导入并预览</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

// 10 项费用科目固定值 — V1.2 与 V1.1 一致，趟结工资 / 杂费已拆开
function defaultAccounts() {
  return [
    { account: 'LNG 加气费',    accountCode: '660214 车辆使用费·LNG',  ratio: '34.6%', values: Array(12).fill(0) },
    { account: '司机趟结工资',   accountCode: '660209 工资总额·趟结',   ratio: '约 10%', values: Array(12).fill(0) },
    { account: '司机基本工资',   accountCode: '660209 工资总额·基本',   ratio: '约 7%',  values: Array(12).fill(0) },
    { account: 'ETC 路桥费',    accountCode: '660214 车辆使用费·ETC',  ratio: '16.1%', values: Array(12).fill(0) },
    { account: '车辆折旧费',    accountCode: '660225 折旧费',          ratio: '14.2%', values: Array(12).fill(0) },
    { account: '车辆保险费',    accountCode: '660219 保险费',          ratio: '4.0%',  values: Array(12).fill(0) },
    { account: '车辆杂费',      accountCode: '660214 车辆使用费·杂费', ratio: '3.1%',  values: Array(12).fill(0) },
    { account: '车辆维修费',    accountCode: '660214 车辆使用费·维修', ratio: '1.9%',  values: Array(12).fill(0) },
    { account: '管理人员工资',   accountCode: '660209 工资总额·管理',   ratio: '1.2%',  values: Array(12).fill(0) },
    { account: '低值易耗品',    accountCode: '660228 / 660299（待业主）', ratio: '0.2%',  values: Array(12).fill(0) }
  ]
}

// 业主官方数字（5/12 调研 + 经营计划测算 + 办公会议纪要 260206）
const OWNER_OFFICIAL = {
  fleet: {
    // 车队板块业主官方：运输板块年度营收 24,700 万 / 利润总额 450 万 / 利润率 7.6%
    // 红树林 / 新鹏运 分摊（mock 拆分参考：红树林 13,500 万、新鹏运 11,200 万，与 132 BudgetOverview 已展示数字一致）
    hsl: {
      totalCostByMonth: distribute(124700000, 12),  // 单位元，约 1.247 亿
      prefill: [
        { label: '运输板块年度营收', value: '24,700 万元（业主官方）' },
        { label: '利润总额', value: '450 万元（业主官方）' },
        { label: 'LNG 车吨公里收入', value: '0.19508 元（业主测算）' },
        { label: '利润率', value: '7.6%（业主官方）' },
        { label: '红树林主体配比', value: '约 1.35 亿元（mock）' },
        { label: '出车率', value: '92%（业主官方）' }
      ]
    },
    xpy: {
      totalCostByMonth: distribute(103500000, 12),  // 约 1.035 亿
      prefill: [
        { label: '运输板块年度营收', value: '24,700 万元（业主官方）' },
        { label: '利润总额', value: '450 万元（业主官方）' },
        { label: 'LNG 车吨公里收入', value: '0.19508 元（业主测算）' },
        { label: '利润率', value: '7.6%（业主官方）' },
        { label: '新鹏运主体配比', value: '约 1.04 亿元（mock）' },
        { label: '单车月营收', value: '6 万元（业主官方）' }
      ]
    }
  },
  corridor: {
    totalCostByMonth: distribute(4800000000, 12),   // 廊道 48 亿元
    prefill: [
      { label: '廊道总投资', value: '48 亿元（业主官方）' },
      { label: '本年完成度要求', value: '≥80%（业主官方）' },
      { label: '廊道未来移交', value: '移交政府 + 新鹏运系统（M006）' }
    ]
  },
  'gas-tsx': {
    totalCostByMonth: distribute(74000000, 12),     // 天山乡站投资 7,400 万
    prefill: [
      { label: '天山乡站投资', value: '0.74 亿元 = 7,400 万元（业主官方）' },
      { label: '加气站板块', value: '本期不含广汇 / 桥湾（第三方）' }
    ]
  },
  'h2-plant': {
    totalCostByMonth: distribute(120000000, 12),    // mock，业主未明示
    prefill: [
      { label: '制氢工厂投资', value: '业主原话"另行提报"，金额待业主回填' }
    ]
  }
}

// 把总额按月平均分布（mock 用）
function distribute(total, n) {
  const per = Math.floor(total / n / 1000) * 1000
  const arr = Array(n).fill(per)
  arr[n - 1] = total - per * (n - 1)
  return arr
}

// 把 mock 总成本按 10 项费用科目占比拆分到月度
function fillByRatio(totalByMonth) {
  // 占比来源：5/12 业主吨公里成本拆解；趟结工资/基本工资拆为 10/7
  const ratios = [0.346, 0.10, 0.07, 0.161, 0.142, 0.04, 0.031, 0.019, 0.012, 0.002]
  const accs = defaultAccounts()
  accs.forEach((acc, i) => {
    acc.values = totalByMonth.map(v => Math.round(v * ratios[i] / 1000) * 1000)
  })
  return accs
}

const UNIT_NAME = { fleet: '车队', corridor: '廊道（建设期）', 'gas-tsx': '加气站（天山乡等）', 'h2-plant': '制氢工厂' }
const SUBJ_NAME = { hsl: '红树林', xpy: '新鹏运' }
const UNIT_CODE = { '车队': 'fleet', '廊道（建设期）': 'corridor', '加气站（天山乡等）': 'gas-tsx', '制氢工厂': 'h2-plant' }
const SUBJ_CODE = { '红树林': 'hsl', '新鹏运': 'xpy' }

export default {
  name: 'BudgetEdit',
  data() {
    return {
      query: { unit: '', subject: '', year: '2026', periodType: '', status: '' },
      months: MONTHS,
      showForm: false,
      showImport: false,
      showVersion: false,
      showApproval: false,
      isEdit: false,
      isViewOnly: false,
      dialogTitle: '新增预算',
      currentRow: null,
      approvalRow: null,
      approvalForm: { comment: '' },
      diffActive: null,
      form: this.emptyForm(),

      // mock 列表数据 — 按 5/12 业主官方数字 + 5/15 用户裁决
      tableData: [
        {
          id: 1, unit: 'fleet', subject: 'hsl', period: '2026 全年',
          unitName: '车队', subjectName: '红树林',
          totalBudget: 13500, version: 'v2.0 终版',
          status: 'effective', reviewLabel: '已终审',
          editor: '红树林财务',
          updatedAt: '2026-05-12 16:00',
          approvalLogs: [
            { role: '红树林财务', actionLabel: '提交审批', action: 'submit', comment: '初稿', time: '2026-04-15 17:20' },
            { role: '车队负责人', actionLabel: '驳回', action: 'reject', comment: '燃料预算需上调 3%', time: '2026-04-22 11:30' },
            { role: '红树林财务', actionLabel: '重新编辑提交', action: 'submit', comment: '已上调 LNG 加气费', time: '2026-04-25 09:15' },
            { role: '车队负责人', actionLabel: '一级通过', action: 'approve', comment: '同意', time: '2026-04-26 14:20' },
            { role: '公司财务（马伶俐分管）', actionLabel: '终审通过', action: 'approve', comment: '回写 132 已分配额', time: '2026-04-28 16:00' }
          ]
        },
        {
          id: 2, unit: 'fleet', subject: 'xpy', period: '2026 全年',
          unitName: '车队', subjectName: '新鹏运',
          totalBudget: 11200, version: 'v1.2',
          status: 'reviewing', reviewLabel: '2/2 公司财务终审',
          editor: '新鹏运财务',
          updatedAt: '2026-05-12 09:30',
          approvalLogs: [
            { role: '新鹏运财务', actionLabel: '提交审批', action: 'submit', comment: '按 5/12 业主口径', time: '2026-05-10 10:00' },
            { role: '车队负责人', actionLabel: '一级通过', action: 'approve', comment: '同意', time: '2026-05-11 15:00' }
          ]
        },
        {
          id: 3, unit: 'corridor', subject: '', period: '2026 全年',
          unitName: '廊道（建设期）', subjectName: '',
          totalBudget: 480000, version: 'v1.0',
          status: 'reviewing', reviewLabel: '1/2 廊道项目部负责人',
          editor: '廊道财务',
          updatedAt: '2026-05-12 13:45',
          approvalLogs: [
            { role: '廊道财务', actionLabel: '提交审批', action: 'submit', comment: '48 亿建设期总盘，按 ≥80% 完成度切分', time: '2026-05-12 13:45' }
          ]
        },
        {
          id: 4, unit: 'gas-tsx', subject: '', period: '2026-M09 月度',
          unitName: '加气站（天山乡等）', subjectName: '',
          totalBudget: 620, version: 'v1.0 草案',
          status: 'draft', reviewLabel: '',
          editor: '加气站财务',
          updatedAt: '2026-05-12 14:20',
          approvalLogs: []
        },
        {
          id: 5, unit: 'h2-plant', subject: '', period: '2026 全年',
          unitName: '制氢工厂', subjectName: '',
          totalBudget: 12000, version: 'v1.0 草案',
          status: 'draft', reviewLabel: '',
          editor: '制氢工厂财务',
          updatedAt: '2026-05-12 15:00',
          approvalLogs: []
        },
        {
          id: 6, unit: 'fleet', subject: 'hsl', period: '2026 Q3',
          unitName: '车队', subjectName: '红树林',
          totalBudget: 3375, version: 'v1.1',
          status: 'rejected', reviewLabel: '',
          editor: '红树林财务',
          updatedAt: '2026-05-09 11:15',
          approvalLogs: [
            { role: '红树林财务', actionLabel: '提交审批', action: 'submit', comment: 'Q3 滚动预算', time: '2026-05-08 16:00' },
            { role: '车队负责人', actionLabel: '驳回', action: 'reject', comment: '8 月气耗预算偏低，请按 5/12 业主考核口径上调', time: '2026-05-09 11:15' }
          ]
        },
        {
          id: 7, unit: 'fleet', subject: 'xpy', period: '2026-M05 月度',
          unitName: '车队', subjectName: '新鹏运',
          totalBudget: 935, version: 'v1.0 草案',
          status: 'draft', reviewLabel: '',
          editor: '新鹏运财务',
          updatedAt: '2026-05-13 09:30',
          approvalLogs: []
        }
      ],

      // 单条记录的版本历史（mock：表中第一条 id=1 的多版本记录）
      versionHistory: [
        { version: 'v2.0 终版', totalBudget: 13500, status: 'effective', editor: '红树林财务', reviewedBy: '公司财务', changeLog: '终审通过，回写 132 已分配额', updatedAt: '2026-04-28 16:00' },
        { version: 'v1.2', totalBudget: 13245, status: 'rejected', editor: '红树林财务', reviewedBy: '车队负责人', changeLog: '燃料预算需上调 3%', updatedAt: '2026-04-22 11:30' },
        { version: 'v1.1', totalBudget: 13120, status: 'rejected', editor: '红树林财务', reviewedBy: '车队负责人', changeLog: '趟结工资基准请重新评估', updatedAt: '2026-04-18 09:45' },
        { version: 'v1.0 草案', totalBudget: 13050, status: 'rejected', editor: '红树林财务', reviewedBy: '—', changeLog: '初稿', updatedAt: '2026-04-15 17:20' }
      ]
    }
  },
  computed: {
    autoNextMonth() {
      const now = new Date()
      let m = now.getMonth() + 2
      if (m > 12) m = 1
      return m
    },
    filteredTable() {
      return this.tableData.filter(r => {
        if (this.query.unit && r.unit !== this.query.unit) return false
        if (this.query.unit === 'fleet' && this.query.subject && r.subject !== this.query.subject) return false
        if (this.query.status && r.status !== this.query.status) return false
        if (this.query.periodType === 'year' && !r.period.includes('全年')) return false
        if (this.query.periodType === 'quarter' && !/Q[1-4]/.test(r.period)) return false
        if (this.query.periodType === 'month' && !/M\d{2}/.test(r.period)) return false
        return true
      })
    },
    totalBudget() {
      return this.form.details.reduce((sum, row) => sum + this.rowSum(row), 0)
    },
    prefillBox() {
      if (!this.form.unit) return []
      if (this.form.unit === 'fleet') {
        if (!this.form.subject) return []
        return OWNER_OFFICIAL.fleet[this.form.subject]?.prefill || []
      }
      return OWNER_OFFICIAL[this.form.unit]?.prefill || []
    },
    versionDialogTitle() {
      if (!this.currentRow) return '版本对比'
      return `${this.currentRow.unitName}${this.currentRow.subjectName ? ' · ' + this.currentRow.subjectName : ''} ${this.currentRow.period} - 版本对比`
    }
  },
  methods: {
    nextMonthCode() {
      let m = this.autoNextMonth
      return 'M' + (m < 10 ? '0' + m : m)
    },
    emptyForm() {
      return {
        unit: '', subject: '', year: '2026', period: this.nextMonthCode(),
        version: 'v1.0 草案', editor: '马伶俐',
        useLastYearBaseline: false, growthRate: 0.08,
        details: defaultAccounts()
      }
    },
    rowSum(row) {
      return row.values.reduce((s, v) => s + (Number(v) || 0), 0)
    },
    formatMoney(v) {
      if (v == null || isNaN(Number(v))) return '0'
      return Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 0 })
    },
    statusLabel(s) {
      return { draft: '草稿', reviewing: '审批中', effective: '已生效', rejected: '已驳回' }[s] || s
    },
    statusTag(s) {
      return { draft: 'info', reviewing: 'warning', effective: 'success', rejected: 'danger' }[s] || ''
    },
    onQueryUnitChange(v) {
      if (v !== 'fleet') this.query.subject = ''
    },
    onFormUnitChange(v) {
      if (v !== 'fleet') {
        this.form.subject = ''
      }
      this.maybePrefillMatrix()
    },
    onFormSubjectChange() {
      this.maybePrefillMatrix()
    },
    maybePrefillMatrix() {
      // 新增态且业务单元/主体齐全时，按 ratio 拆分官方总成本作初值
      if (this.isEdit || this.isViewOnly) return
      if (!this.form.unit) return
      let totalByMonth = null
      if (this.form.unit === 'fleet') {
        if (!this.form.subject) return
        totalByMonth = OWNER_OFFICIAL.fleet[this.form.subject]?.totalCostByMonth
      } else {
        totalByMonth = OWNER_OFFICIAL[this.form.unit]?.totalCostByMonth
      }
      if (totalByMonth) {
        this.form.details = fillByRatio(totalByMonth)
      }
    },
    search() {
      this.$message.info('查询条件已应用')
    },
    reset() {
      this.query = { unit: '', subject: '', year: '2026', periodType: '', status: '' }
    },
    onExport() {
      this.$message.info('导出当前筛选结果（演示）')
    },
    openCreate() {
      this.isEdit = false
      this.isViewOnly = false
      this.dialogTitle = '新增预算编制'
      this.form = this.emptyForm()
      this.showForm = true
    },
    edit(row) {
      this.isEdit = true
      this.isViewOnly = false
      this.dialogTitle = '编辑预算编制'
      this.currentRow = row
      this.fillFormFromRow(row)
      this.showForm = true
    },
    viewDetail(row) {
      this.isEdit = false
      this.isViewOnly = true
      this.dialogTitle = '预算编制详情'
      this.currentRow = row
      this.fillFormFromRow(row)
      this.showForm = true
    },
    fillFormFromRow(row) {
      // 把 row 还原到 form 上（mock：按 ratio 拆分 row.totalBudget*10000 得到月度矩阵）
      let totalByMonth = null
      if (row.unit === 'fleet') {
        totalByMonth = OWNER_OFFICIAL.fleet[row.subject]?.totalCostByMonth
      } else {
        totalByMonth = OWNER_OFFICIAL[row.unit]?.totalCostByMonth
      }
      const details = totalByMonth ? fillByRatio(totalByMonth) : defaultAccounts()
      this.form = {
        unit: row.unit, subject: row.subject, year: '2026',
        period: row.period.includes('全年') ? 'YEAR' : (row.period.match(/M\d{2}/)?.[0] || row.period.match(/Q[1-4]/)?.[0] || 'YEAR'),
        version: row.version, editor: row.editor,
        useLastYearBaseline: false, growthRate: 0.08,
        details
      }
    },
    saveDraft() {
      if (!this.form.unit) { this.$message.error('请选择业务单元'); return }
      if (this.form.unit === 'fleet' && !this.form.subject) { this.$message.error('车队板块请选择主体（红树林 / 新鹏运）'); return }
      this.$message.success(`已保存草稿（演示）— 总额 ${this.formatMoney(this.totalBudget / 10000)} 万元`)
      this.showForm = false
    },
    submitDirect() {
      if (!this.form.unit) { this.$message.error('请选择业务单元'); return }
      if (this.form.unit === 'fleet' && !this.form.subject) { this.$message.error('车队板块请选择主体'); return }
      if (this.totalBudget <= 0) { this.$message.error('请填写月度金额（至少一格 > 0）'); return }
      this.$confirm(
        `确认将本预算（${this.formatMoney(this.totalBudget / 10000)} 万元）提交审批？提交后流转到一级（板块负责人）审批环节。`,
        '提交确认',
        { confirmButtonText: '提交', cancelButtonText: '取消', type: 'info' }
      ).then(() => {
        this.$message.success('已提交，进入一级审批环节')
        this.showForm = false
      }).catch(() => {})
    },
    submitReview(row) {
      this.$confirm(
        `确认将「${row.unitName}${row.subject ? ' · ' + row.subjectName : ''} ${row.period} ${row.version}」提交审批？`,
        '提交确认',
        { confirmButtonText: '提交', cancelButtonText: '取消' }
      ).then(() => {
        row.status = 'reviewing'
        row.reviewLabel = '1/2 ' + this.firstLevelName(row.unit)
        row.approvalLogs.push({ role: row.editor, actionLabel: '提交审批', action: 'submit', comment: '', time: this.now() })
        this.$message.success('已提交审批')
      }).catch(() => {})
    },
    firstLevelName(unit) {
      return { fleet: '车队负责人', corridor: '廊道项目部负责人', 'gas-tsx': '加气站负责人', 'h2-plant': '制氢工厂负责人' }[unit] || '板块负责人'
    },
    openApproval(row) {
      this.approvalRow = row
      this.approvalForm = { comment: '' }
      this.showApproval = true
    },
    doApprove() {
      if (!this.approvalRow) return
      const row = this.approvalRow
      const isFirst = row.reviewLabel.startsWith('1/2')
      if (isFirst) {
        row.reviewLabel = '2/2 公司财务终审'
        row.approvalLogs.push({ role: this.firstLevelName(row.unit), actionLabel: '一级通过', action: 'approve', comment: this.approvalForm.comment, time: this.now() })
        this.$message.success('一级通过，已推送公司财务终审')
      } else {
        row.status = 'effective'
        row.reviewLabel = '已终审'
        row.approvalLogs.push({ role: '公司财务（马伶俐分管）', actionLabel: '终审通过', action: 'approve', comment: this.approvalForm.comment || '回写 132 已分配额', time: this.now() })
        this.$message.success(`终审通过 — 已回写 132 已分配额（演示，${this.formatMoney(row.totalBudget)} 万元）`)
      }
      this.showApproval = false
    },
    doReject() {
      if (!this.approvalRow) return
      if (!this.approvalForm.comment) {
        this.$message.error('驳回原因必填')
        return
      }
      const row = this.approvalRow
      const isFirst = row.reviewLabel.startsWith('1/2')
      const role = isFirst ? this.firstLevelName(row.unit) : '公司财务（马伶俐分管）'
      row.status = 'rejected'
      row.reviewLabel = ''
      row.approvalLogs.push({ role, actionLabel: '驳回', action: 'reject', comment: this.approvalForm.comment, time: this.now() })
      this.$message.success('已驳回，已推送编制人')
      this.showApproval = false
    },
    reedit(row) {
      this.$confirm(
        `「${row.unitName}${row.subject ? ' · ' + row.subjectName : ''} ${row.period} ${row.version}」已驳回。重新编辑将基于当前版本创建新草稿，版本号自动递增。`,
        '重新编辑',
        { confirmButtonText: '继续', cancelButtonText: '取消' }
      ).then(() => {
        // mock：复制为新草稿
        const newVersion = this.bumpVersion(row.version)
        this.$message.success(`已创建新草稿 ${newVersion}（原驳回版本保留为历史）`)
        this.tableData.unshift({
          ...row,
          id: this.tableData.length + 1,
          version: newVersion,
          status: 'draft',
          reviewLabel: '',
          updatedAt: this.now(),
          approvalLogs: []
        })
      }).catch(() => {})
    },
    bumpVersion(v) {
      const m = v.match(/v(\d+)\.(\d+)/)
      if (!m) return 'v1.1'
      return `v${m[1]}.${parseInt(m[2]) + 1}`
    },
    confirmDelete(row) {
      this.$confirm(
        `确认删除「${row.unitName}${row.subject ? ' · ' + row.subjectName : ''} ${row.period}」预算草稿（${row.version}）？删除后无法恢复。`,
        '删除确认',
        { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
      ).then(() => {
        this.tableData = this.tableData.filter(r => r.id !== row.id)
        this.$message.success('已删除')
      }).catch(() => {})
    },
    viewVersion(row) {
      this.currentRow = row
      this.diffActive = null
      this.showVersion = true
    },
    diffVersion(versionRow) {
      // mock：当前版本 vs 选中版本，按 ratio 拆分两个 totalBudget 形成差异
      const currentTotalCny = (this.currentRow?.totalBudget || 0) * 10000
      const oldTotalCny = versionRow.totalBudget * 10000
      const ratios = [0.346, 0.10, 0.07, 0.161, 0.142, 0.04, 0.031, 0.019, 0.012, 0.002]
      const accs = defaultAccounts()
      const rows = accs.map((acc, i) => {
        const oldSum = Math.round(oldTotalCny * ratios[i])
        const newSum = Math.round(currentTotalCny * ratios[i])
        const delta = newSum - oldSum
        const comment = Math.abs(delta) > 50000 ? '变动较大' : (Math.abs(delta) > 10000 ? '小幅调整' : '基本持平')
        return { account: acc.account, oldSum, newSum, delta, comment }
      })
      this.diffActive = { version: versionRow.version, diffRows: rows }
    },
    openImport() {
      this.showImport = true
    },
    onImportFile() {
      this.$message.info('文件已选择，点"导入并预览"开始解析')
    },
    doImport() {
      this.$message.success('已解析 10 × 12 矩阵 + ERP 编码校验通过 — 已创建草稿（演示）')
      this.showImport = false
    },
    downloadTemplate() {
      this.$message.info('模板下载（演示，待后端接口实现）')
    },
    now() {
      const d = new Date()
      const pad = n => n < 10 ? '0' + n : n
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
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
.table-card {
  border: 1px solid #DCDFE6;
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.muted {
  font-size: 12px;
  color: #909399;
}

.danger-text {
  color: #F56C6C;
}

.pagination {
  margin-top: 12px;
  text-align: right;
}

.form-hint {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.prefill-card {
  margin: 12px 0 4px;
  padding: 12px 16px;
  background: #F0F9EB;
  border: 1px solid #E1F3D8;
  border-radius: 2px;
}

.prefill-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: #67C23A;
  font-size: 13px;
}

.prefill-title strong {
  color: #303133;
}

.prefill-source {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
  font-weight: normal;
}

.prefill-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 16px;
  font-size: 12px;
}

.prefill-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  background: #FFFFFF;
  border-radius: 2px;
}

.prefill-label {
  color: #606266;
}

.prefill-value {
  color: #303133;
  font-weight: 500;
}

.prefill-note {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #E1F3D8;
  color: #606266;
  font-size: 12px;
}

.matrix-wrap {
  border: 1px solid #EBEEF5;
  border-radius: 2px;
}

.matrix-footer {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  background: #FAFBFC;
  border-top: 1px solid #EBEEF5;
  font-size: 12px;
  color: #606266;
}

.matrix-footer strong {
  color: #303133;
  font-size: 13px;
}

.import-area {
  text-align: center;
}

.template-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #606266;
}

.template-tip a {
  color: #409EFF;
}

.approval-trail {
  margin-top: 16px;
  padding: 12px 16px;
  background: #FAFBFC;
  border-radius: 2px;
  border: 1px solid #EBEEF5;
}

.approval-trail-title {
  margin-bottom: 8px;
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.approval-comment {
  margin-top: 4px;
  color: #606266;
  font-size: 12px;
}

.up {
  color: #F56C6C;
  font-weight: 600;
}

.down {
  color: #67C23A;
  font-weight: 600;
}
</style>
