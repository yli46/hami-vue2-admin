import Vue from 'vue'
import VueRouter from 'vue-router'
import PrototypeFrame from '../components/PrototypeFrame.vue'

Vue.use(VueRouter)

// 通用 iframe 页面工厂
function protoPage(src, title) {
  return {
    name: `proto-${title}`,
    render(h) {
      return h(PrototypeFrame, { props: { src } })
    },
    meta: { title }
  }
}

const routes = [
  { path: '/', redirect: '/home' },
  {
    path: '/home',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: '首页' }
  },
  // 全面预算
  {
    path: '/budget/overview',
    name: 'budget-overview',
    component: protoPage('/freight/prototypes/132-概算管理.html', '概算管理'),
    meta: { title: '概算管理', module: '132' }
  },
  {
    path: '/budget/edit',
    name: 'budget-edit',
    component: protoPage('/freight/prototypes/133-预算编制.html', '预算编制'),
    meta: { title: '预算编制', module: '133' }
  },
  {
    path: '/cost/manual',
    name: 'cost-manual',
    component: protoPage('/freight/prototypes/134-费用补录.html', '费用补录'),
    meta: { title: '费用手动补录', module: '134' }
  },
  {
    path: '/cost/reserve',
    name: 'cost-reserve',
    component: protoPage('/freight/prototypes/134-备用金管理.html', '备用金管理'),
    meta: { title: '备用金管理', module: '134' }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: '/freight/',
  routes
})

export default router
