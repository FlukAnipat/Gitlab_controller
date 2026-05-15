import { api } from "~/plugins/axios";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

// เก็บ token ข้อมูลผู้ใช้ และสถานะการเข้าสู่ระบบของแอป
export const state = () => ({
  token: null,
  user: null,
  isAuthenticated: false,
});

export const mutations = {
  // บันทึก token และอัปเดตสถานะว่าเข้าสู่ระบบแล้วหรือไม่
  SET_TOKEN(state, token) {
    state.token = token;
    state.isAuthenticated = !!token;
  },

  // เก็บข้อมูลผู้ใช้ปัจจุบันลงใน state
  SET_USER(state, user) {
    state.user = user;
  },

  // ล้างข้อมูลการเข้าสู่ระบบทั้งหมดออกจาก state
  CLEAR_AUTH(state) {
    state.token = null;
    state.user = null;
    state.isAuthenticated = false;
  },
};

export const actions = {
  // พาผู้ใช้ไปหน้า GitLab login ผ่าน backend
  login() {
    if (process.client) {
      window.location.href = `${API_BASE_URL}/auth/gitlab/login`;
    }
  },

  // รับ token และข้อมูลผู้ใช้จาก callback แล้วเก็บไว้ทั้งใน state และ localStorage
  handleCallback({ commit }, { token, user }) {
    commit("SET_TOKEN", token);
    commit("SET_USER", user);

    if (process.client) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
  },

  // ล็อกอินด้วย username/password และบันทึก session ที่ได้กลับมา
  password({ commit }, { username, password }) {
    return new Promise(async (resolve) => {
      try {
        const response = await api.post("/auth/gitlab/login/password", {
          username,
          password,
        });

        const { token, data: user } = response.data;

        commit("SET_TOKEN", token);
        commit("SET_USER", user);

        if (process.client) {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
        }

        resolve({ success: true });
      } catch (error) {
        const message =
          error.response?.data?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
        resolve({ success: false, message });
      }
    });
  },

  // ลงทะเบียนข้อมูลเชื่อม GitLab ผ่าน backend ก่อนนำไปใช้งานจริง
  registerGitlab(_, { username, password, clientId, clientSecret }) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.post("/auth/gitlab/register", {
          username,
          password,
          clientId,
          clientSecret,
        });
        resolve({ success: true, data: res.data });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },

  // ออกจากระบบทั้งฝั่ง backend, state และ localStorage
  logout({ commit, state }) {
    return new Promise(async (resolve) => {
      try {
        const userId = state.user?.id;
        if (userId) {
          await api.get(`/auth/gitlab/logout/${userId}`);
        }
      } catch (error) {
        console.error("Logout error:", error);
      }

      commit("CLEAR_AUTH");

      if (process.client) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      resolve();
    });
  },

  // ดึงรายชื่อผู้ใช้จาก API เพื่อใช้ในตัวเลือก assignee และงานที่เกี่ยวกับสมาชิก
  async getUsers(_, params) {
    try {
      const res = await api.get("/users", { params });
      return { success: true, data: res.data?.data || res.data || [] };
    } catch (error) {
      console.error("getUsers error:", error);
      return { success: false, data: [] };
    }
  },

  // ตรวจ token และข้อมูลผู้ใช้จาก localStorage เพื่อกู้ session หลังรีเฟรชหน้า
  checkAuth({ commit }) {
    if (process.client) {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (token) {
        commit("SET_TOKEN", token);

        if (user) {
          try {
            commit("SET_USER", JSON.parse(user));
          } catch (error) {
            console.error("Parse user from localStorage failed:", error);
          }
        }
      }
    }
  },
};

export const getters = {
  // คืนค่าสถานะว่าผู้ใช้ล็อกอินอยู่หรือไม่
  isAuthenticated: (state) => state.isAuthenticated,

  // คืนข้อมูลผู้ใช้ปัจจุบัน
  currentUser: (state) => state.user,

  // คืน token ปัจจุบันที่ใช้เรียก API
  token: (state) => state.token,
};
