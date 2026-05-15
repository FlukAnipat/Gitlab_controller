// ป้องกันเส้นทางที่ต้องล็อกอิน โดยยอมให้เฉพาะหน้า public ผ่านได้
export default function ({ redirect, route }) {
  const publicPages = ["/login", "/login/callback"];
  if (publicPages.includes(route.path)) return;

  // ตรวจ token จาก localStorage ฝั่ง client ถ้าไม่มีให้เด้งกลับหน้า login
  if (process.client) {
    const token = localStorage.getItem("token");
    if (!token) {
      return redirect("/login");
    }
  }

  // ฝั่ง server ยังอ่าน token จาก localStorage ไม่ได้ จึงปล่อยให้ client เป็นคน redirect หลัง hydrate
  if (process.server) {
    return;
  }
}
