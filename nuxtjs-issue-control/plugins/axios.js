import axios from "axios";

const instance = axios.create({
  baseURL: process.env.API_BASE_URL || "http://localhost:3000",
  timeout: 60000, //60 seconds
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  // เติม token จาก localStorage ลงใน header ก่อนทุก request ที่ยิงจากฝั่ง client
  (config) => {
    if (process.client) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  // ส่งต่อ error จากขั้นตอนเตรียม request ให้ผู้เรียกจัดการต่อ
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  // คืน response ปกติกลับไปโดยไม่แก้ไข
  (response) => response,

  // ดัก 401 เพื่อบังคับล้าง token และพากลับไปหน้า login
  (error) => {
    if (error.response?.status === 401) {
      if (process.client) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// inject axios instance เข้า Nuxt context เพื่อให้เรียกผ่าน this.$axios ได้
export default ({ app }, inject) => {
  inject("axios", instance);
};

export { instance as api };
