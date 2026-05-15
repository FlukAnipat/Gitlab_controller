import { api } from "~/plugins/axios";

// เก็บข้อมูล project ที่โหลดมา รายการ repository และ project ที่ผู้ใช้เลือกอยู่
export const state = () => ({
  projects: [],
  repositories: [],
  loading: false,
  loadingRepositories: false,
  currentProject: null,
});

export const mutations = {
  // กำหนดรายการ project ทั้งหมดใหม่ลงใน state
  SET_PROJECTS(state, projects) {
    state.projects = projects;
  },

  // เพิ่ม project ใหม่ไว้ด้านบนสุดของรายการ
  ADD_PROJECT(state, project) {
    state.projects.unshift(project);
  },

  // ลบ project ออกจาก state ตาม id
  REMOVE_PROJECT(state, id) {
    state.projects = state.projects.filter((p) => p.id !== id);
  },

  // สลับสถานะ loading สำหรับงานที่เกี่ยวกับ project
  SET_LOADING(state, loading) {
    state.loading = loading;
  },

  // กำหนดรายการ repository ที่ดึงจาก GitLab
  SET_REPOSITORIES(state, repositories) {
    state.repositories = repositories;
  },

  // สลับสถานะ loading ของการโหลด repository
  SET_LOADING_REPOSITORIES(state, loading) {
    state.loadingRepositories = loading;
  },

  // เก็บ project ที่ผู้ใช้กำลังเลือกใช้งานอยู่
  SET_CURRENT_PROJECT(state, project) {
    state.currentProject = project;
  },
};

// ดึงรายการ project ทั้งหมดจาก API กลาง
const getAllProjects = async () => {
  const res = await api.get("/project");
  return res.data?.data || res.data || [];
};

export const actions = {
  // อัปโหลดไฟล์เข้า project ที่กำหนด เช่น รูปภาพหรือไฟล์แนบจาก editor
  async uploadFile(_, { projectId, formData }) {
    try {
      const res = await api.post(`/project/${projectId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Upload error:", error);
      return { success: false, message: error.message };
    }
  },

  // โหลดรายการ project ทั้งหมดแล้วบันทึกลง state
  getProjects({ commit }) {
    return new Promise(async (resolve) => {
      try {
        commit("SET_LOADING", true);

        const data = await getAllProjects();
        commit("SET_PROJECTS", Array.isArray(data) ? data : []);

        resolve({ success: true, data: Array.isArray(data) ? data : [] });
      } catch (error) {
        console.error("get projects error:", error);
        commit("SET_PROJECTS", []);
        resolve({ success: false, message: error.message, data: [] });
      } finally {
        commit("SET_LOADING", false);
      }
    });
  },

  // สร้าง project ใหม่และเพิ่มเข้า state ทันที
  createProject({ commit }, projectData) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.post("/project", projectData);
        commit("ADD_PROJECT", res.data);
        resolve({ success: true, data: res.data });
      } catch (error) {
        console.error("Create project error:", error);
        resolve({ success: false, message: error.message });
      }
    });
  },

  // ลบ project ตาม id แล้วลบออกจาก state
  deleteProject({ commit }, id) {
    return new Promise(async (resolve) => {
      try {
        await api.delete(`/project/${id}`);
        commit("REMOVE_PROJECT", id);
        resolve({ success: true });
      } catch (error) {
        console.error("Delete project error:", error);
        resolve({ success: false, message: error.message });
      }
    });
  },

  // ดึงรายการ repository ที่ผู้ใช้เข้าถึงได้จาก GitLab API
  getRepositories({ commit }) {
    return new Promise(async (resolve) => {
      try {
        commit("SET_LOADING_REPOSITORIES", true);
        const res = await api.get("/users/repositories");
        commit("SET_REPOSITORIES", res.data || []);
        resolve({ success: true });
      } catch (error) {
        console.error("get repositories error:", error);
        commit("SET_REPOSITORIES", []);
        resolve({ success: false, message: error.message });
      } finally {
        commit("SET_LOADING_REPOSITORIES", false);
      }
    });
  },

  // ดึงสมาชิกของ GitLab project เพื่อใช้ทำตัวเลือก assignee หรือ member list
  getProjectMembers(_, gitlabProjectId) {
    return new Promise(async (resolve) => {
      try {
        if (!gitlabProjectId) {
          resolve({ success: true, data: [] });
          return;
        }

        const res = await api.get(`/users/projects/${gitlabProjectId}/members`);
        resolve({
          success: true,
          data: Array.isArray(res.data) ? res.data : [],
        });
      } catch (error) {
        console.error("get project members error:", error);
        resolve({ success: false, message: error.message, data: [] });
      }
    });
  },

  // ดึง milestone ของ project โดยใช้ project id ในระบบแล้วให้ backend ไป map ต่อกับ GitLab
  getProjectMilestones(_, projectId) {
    return new Promise(async (resolve) => {
      try {
        if (!projectId) {
          resolve({ success: true, data: [] });
          return;
        }
        const res = await api.get(`/project/${projectId}/milestones`);
        resolve({
          success: true,
          data: Array.isArray(res.data) ? res.data : [],
        });
      } catch (error) {
        console.error("get project milestones error:", error);
        resolve({ success: false, message: error.message, data: [] });
      }
    });
  },

  // บันทึก project ปัจจุบันลง state และ localStorage เพื่อให้หน้าอื่นใช้งานต่อได้
  setCurrentProject({ commit }, project) {
    commit("SET_CURRENT_PROJECT", project);
    if (process.client) {
      if (project) {
        localStorage.setItem("currentProject", JSON.stringify(project));
      } else {
        localStorage.removeItem("currentProject");
      }
    }
  },

  // โหลด project ปัจจุบันจาก localStorage ตอนเริ่มแอป แล้วตรวจสอบความถูกต้องก่อนใช้งาน
  initCurrentProject({ commit }) {
    if (process.client) {
      const raw = localStorage.getItem("currentProject");
      if (raw) {
        try {
          const project = JSON.parse(raw);
          if (project && (project.gitlabProjectId || project.type === 1)) {
            commit("SET_CURRENT_PROJECT", project);
          } else {
            localStorage.removeItem("currentProject");
          }
        } catch (error) {
          localStorage.removeItem("currentProject");
        }
      }
    }
  },
};

export const getters = {
  // คืนรายการ project ทั้งหมดจาก state
  projects: (state) => state.projects,

  // คืนค่าสถานะ loading ของงาน project
  loading: (state) => state.loading,

  // คืนรายการ repository ที่โหลดจาก GitLab
  repositories: (state) => state.repositories,

  // คืนค่าสถานะ loading ของการโหลด repository
  loadingRepositories: (state) => state.loadingRepositories,

  // คืน project ปัจจุบันที่ผู้ใช้เลือกอยู่
  currentProject: (state) => state.currentProject,
};
