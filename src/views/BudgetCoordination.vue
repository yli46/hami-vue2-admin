<template>
  <div class="placeholder">
    <el-card>
      <div class="empty">
        <i class="el-icon-document"></i>
        <h3>{{ pageTitle }}</h3>
        <p class="meta">模块编号：{{ moduleCode }}</p>
        <p class="status">{{ status }}</p>
        <ul class="todo">
          <li v-for="item in todos" :key="item">{{ item }}</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'BudgetCoordination',
  computed: {
    pageTitle() { return this.$route.meta?.title },
    moduleCode() { return this.$route.meta?.module }
  },
  data() {
    return {
      status: '待业主回填预算分解规则',
      todos: ["业务单元拆分维度（车队/线路/客户）需业主拍板", "联动规则等核算口径定后补"]
    }
  }
}
</script>

<style scoped>
.placeholder {
  max-width: 720px;
  margin: 0 auto;
}
.empty {
  text-align: center;
  padding: 40px 20px;
  color: #606266;
}
.empty i {
  font-size: 48px;
  color: #C0C4CC;
}
.empty h3 {
  margin: 16px 0 8px;
  color: #303133;
}
.meta {
  color: #909399;
  font-size: 13px;
  margin: 0;
}
.status {
  color: #E6A23C;
  font-size: 13px;
  margin-top: 12px;
}
.todo {
  text-align: left;
  max-width: 480px;
  margin: 16px auto 0;
  color: #606266;
  font-size: 13px;
  line-height: 2;
}
</style>
