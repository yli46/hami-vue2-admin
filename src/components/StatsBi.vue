<template>
  <div class="bi-root">
    <!-- 有嵌入 URL → 直接 iframe -->
    <iframe
      v-if="biUrl"
      :src="biUrl"
      class="bi-frame"
      frameborder="0"
      allowfullscreen
    />
    <!-- 无 URL → 展示核心指标 + 跳转按钮 -->
    <div v-else class="bi-placeholder">
      <div class="bi-card">
        <div class="bi-icon"><i :class="icon"></i></div>
        <div class="bi-name">{{ name }}</div>
        <div class="bi-desc">{{ desc }}</div>
        <div class="bi-metrics">
          <div v-for="m in metrics" :key="m.label" class="bi-metric">
            <div class="metric-value" :style="{ color: m.color }">{{ m.value }}</div>
            <div class="metric-label">{{ m.label }}</div>
          </div>
        </div>
        <el-button type="primary" @click="openBI">在 QuickBI 中查看</el-button>
        <div class="bi-hint">数据已跑通 · 2026 年 1–5 月真实数据</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatsBi',
  props: {
    name:    { type: String, required: true },
    desc:    { type: String, default: '' },
    icon:    { type: String, default: 'el-icon-data-analysis' },
    metrics: { type: Array, default: () => [] },
    biUrl:   { type: String, default: '' }
  },
  methods: {
    openBI() {
      if (this.biUrl) window.open(this.biUrl, '_blank')
      else this.$message.info('请配置 QuickBI 看板地址')
    }
  }
}
</script>

<style scoped>
.bi-root { width: 100%; height: calc(100vh - 50px); }
.bi-frame { display: block; width: 100%; height: 100%; border: none; }

.bi-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 82px);
}
.bi-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,.08);
  padding: 40px 48px;
  text-align: center;
  max-width: 520px;
  width: 100%;
}
.bi-icon {
  width: 56px; height: 56px;
  background: linear-gradient(135deg, #1677FF, #36D1C4);
  border-radius: 12px;
  margin: 0 auto 16px;
  display: flex; align-items: center; justify-content: center;
}
.bi-icon i { font-size: 28px; color: #fff; }
.bi-name { font-size: 20px; font-weight: 600; color: #1A2233; margin-bottom: 8px; }
.bi-desc { font-size: 13px; color: #8C8C8C; margin-bottom: 24px; line-height: 1.6; }
.bi-metrics {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 28px;
  padding: 16px 0;
  border-top: 1px solid #F0F0F0;
  border-bottom: 1px solid #F0F0F0;
}
.bi-metric { text-align: center; }
.metric-value { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.metric-label { font-size: 11px; color: #8C8C8C; }
.bi-hint { margin-top: 12px; font-size: 12px; color: #B8B8B8; }
</style>
