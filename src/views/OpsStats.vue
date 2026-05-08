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
  name: 'OpsStats',
  computed: {
    pageTitle() { return this.$route.meta?.title },
    moduleCode() { return this.$route.meta?.module }
  },
  data() {
    return {
      status: '设计中 — 基于指标方案 v2 修订版',
      todos: ["已有指标：14 项（含 BF 业财穿透 7 项）", "业财健康度指数为综合指标", "本期排除廊道、加氢站"]
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
