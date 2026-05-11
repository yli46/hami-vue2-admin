<template>
  <div>
    <el-card class="hint-card" shadow="never">
      <div class="hint-text">
        <strong>边缘场景手动录入</strong>——主流程不依赖此处。仅在以下情况使用：
        <ul>
          <li>主营业务范围外的零星费用调整（如年中科目重分类）</li>
          <li>系统未自动归集的特殊费用（如跨年度费用重新匹配）</li>
          <li>历史数据补录（系统上线前的数据迁移）</li>
        </ul>
        日常运营不应依赖手动录入。所有手动录入均留痕，并由财务复核。
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
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 140px;">
            <el-option label="车队 1" value="fleet1" />
            <el-option label="车队 2" value="fleet2" />
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
        <span>手动录入记录</span>
        <div>
          <el-button size="small" plain icon="el-icon-edit" @click="openCreate">新增手动录入</el-button>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="tableData" border size="small">
        <el-table-column prop="entryTime" label="录入时间" width="150" />
        <el-table-column prop="unit" label="业务单元" width="100" align="center" />
        <el-table-column prop="account" label="科目" min-width="180" />
        <el-table-column prop="amount" label="金额" width="110" align="right">
          <template slot-scope="scope">¥ {{ formatMoney(scope.row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="录入事由" min-width="220" />
        <el-table-column prop="entrant" label="录入人" width="100" align="center" />
        <el-table-column prop="reviewer" label="复核人" width="100" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="viewDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" class="danger-text" @click="rollback(scope.row)" v-if="scope.row.status === 'reviewed'">冲销</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="新增手动录入" :visible.sync="showCreate" width="560px">
      <el-form :model="form" label-width="100px" size="small">
        <el-form-item label="业务单元">
          <el-select v-model="form.unit" placeholder="请选择" style="width: 100%;">
            <el-option label="车队 1" value="fleet1" />
            <el-option label="车队 2" value="fleet2" />
          </el-select>
        </el-form-item>
        <el-form-item label="科目">
          <el-input v-model="form.account" placeholder="如：主营业务成本-燃料费-LNG 燃料费" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amount" :step="100" />
          <span style="margin-left: 8px; color: #606266;">元（正数=收入 / 负数=费用）</span>
        </el-form-item>
        <el-form-item label="录入事由">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="必填，详细说明为什么需要手动录入而非自动归集" />
        </el-form-item>
        <el-form-item label="复核人">
          <el-select v-model="form.reviewer" placeholder="请选择" style="width: 100%;">
            <el-option label="马伶俐（财务总监）" value="马伶俐" />
            <el-option label="车队 1 财务" value="车队1财务" />
            <el-option label="车队 2 财务" value="车队2财务" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="dialog-note">
        提交后进入复核流程，复核人确认前不计入预算执行数据。
      </div>
      <span slot="footer">
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">提交复核</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CostManual',
  data() {
    return {
      query: { month: '2026-04', unit: '' },
      showCreate: false,
      form: { unit: '', account: '', amount: 0, reason: '', reviewer: '' },
      tableData: [
        { entryTime: '2026-04-22 14:15', unit: '车队 1', account: '主营业务成本 / 维保费', amount: -3500, reason: '2026-03 维保单据延迟到账', entrant: '车队 1 财务', reviewer: '马伶俐', status: 'reviewed' },
        { entryTime: '2026-04-28 10:30', unit: '车队 2', account: '主营业务收入 / 磅单收入调整', amount: 12000, reason: '陇能补传 2026-03 末几笔磅单', entrant: '马伶俐', reviewer: '车队 2 财务', status: 'pending' }
      ]
    }
  },
  methods: {
    search() { this.$message.info('查询逻辑由后端实现（演示）') },
    reset() { this.query = { month: '2026-04', unit: '' } },
    openCreate() { this.showCreate = true },
    submitCreate() {
      if (!this.form.reason) {
        this.$message.warning('录入事由必填')
        return
      }
      this.$message.success('已提交复核（演示）')
      this.showCreate = false
    },
    viewDetail(row) { this.$message.info(`查看 ${row.account} 详情`) },
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
