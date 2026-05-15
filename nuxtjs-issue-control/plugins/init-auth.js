// เรียกกู้ session และ project ปัจจุบันตอน Nuxt เริ่มทำงานครั้งแรก
export default async function ({ store }) {
  store.dispatch("auth/checkAuth");
  store.dispatch("project/initCurrentProject");
}
