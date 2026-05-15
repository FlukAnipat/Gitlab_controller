import { api } from "~/plugins/axios";

// เก็บสถานะหลักของโมดูล issue สำหรับใช้ร่วมกันทั้งหน้ารายการและหน้ารายละเอียด
export const state = () => ({
  issues: [],
  loading: false,
  userFilter: null,
  labelFilter: null,
});

export const mutations = {
  // กำหนดรายการ issue ทั้งหมดใหม่ลงใน state
  SET_ISSUES(state, issues) {
    state.issues = issues;
  },

  // เพิ่ม issue ใหม่ไว้ด้านบนสุดของรายการ
  ADD_ISSUE(state, issue) {
    state.issues.unshift(issue);
  },

  // อัปเดตข้อมูล issue เดิมใน state ตาม id ที่ตรงกัน
  UPDATE_ISSUE(state, updatedIssue) {
    const index = state.issues.findIndex(
      (issue) => issue.id === updatedIssue.id
    );
    if (index !== -1) {
      state.issues.splice(index, 1, {
        ...state.issues[index],
        ...updatedIssue,
      });
    }
  },

  // ลบ issue ออกจาก state ตาม issueId ที่ระบุ
  REMOVE_ISSUE(state, issueId) {
    state.issues = state.issues.filter((issue) => issue.id !== issueId);
  },

  // สลับสถานะ loading สำหรับหน้ารายการ issue
  SET_LOADING(state, loading) {
    state.loading = loading;
  },

  // เก็บค่าตัวกรองผู้ใช้ที่เลือกไว้ใน state
  SET_USER_FILTER(state, userFilter) {
    state.userFilter = userFilter;
  },

  // เก็บค่าตัวกรอง label ที่เลือกไว้ใน state
  SET_LABEL_FILTER(state, labelFilter) {
    state.labelFilter = labelFilter;
  },
};

// ดึงรายการ issue ทั้งหมด หรือเฉพาะของ project ที่ระบุจาก API
const getAllIssues = async (projectId) => {
  const res = await api.get(
    projectId ? `/issue/project/${projectId}` : "/issue"
  );
  return res.data?.data || res.data || [];
};

export const actions = {
  // ดึง milestone ของ issue เพื่อนำไปแสดงรายละเอียดหรือประวัติการทำงาน
  async getIssueMilestones(_, issueId) {
    try {
      const res = await api.get(`/issue/${issueId}/milestones`);
      return { success: true, data: Array.isArray(res.data) ? res.data : [] };
    } catch (error) {
      console.error("Fetch milestones error:", error);
      return { success: false, data: [] };
    }
  },

  // ดึง issue ที่เชื่อมกับ product ตาม productId โดยไม่แก้ state หลัก
  async getIssuesByProduct(_, productId) {
    try {
      const res = await api.get(`/issue/product/${productId}`);
      const data = res.data?.data || res.data || [];
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("getIssuesByProduct error:", error);
      return { success: false, data: [] };
    }
  },

  // โหลดรายการ issue ทั้งหมดหรือของ project ที่เลือก แล้วบันทึกลง state
  getIssues({ commit }, projectId) {
    return new Promise(async (resolve) => {
      try {
        commit("SET_LOADING", true);
        // ไม่ล้างข้อมูลเดิมก่อน fetch เพื่อกันหน้ากระพริบ
        const data = await getAllIssues(projectId);
        commit("SET_ISSUES", Array.isArray(data) ? data : []);
        resolve({ success: true, data: Array.isArray(data) ? data : [] });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
          data: [],
        });
      } finally {
        commit("SET_LOADING", false);
      }
    });
  },

  // สร้าง issue ใหม่ผ่าน API แล้วเพิ่มผลลัพธ์กลับเข้า state
  createIssue({ commit }, issueData) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.post("/issue", issueData);
        if (Array.isArray(res.data)) {
          res.data.reverse().forEach((item) => commit("ADD_ISSUE", item));
        } else {
          commit("ADD_ISSUE", res.data);
        }
        resolve({ success: true, data: res.data });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },

  // แก้ไข issue ที่ระบุ และซิงก์ข้อมูลล่าสุดกลับเข้า state
  updateIssue({ commit }, { issueId, issueData }) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.patch(`/issue/${issueId}`, issueData);
        commit("UPDATE_ISSUE", res.data);
        resolve({ success: true, data: res.data });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },

  // ลบ issue จากระบบและลบรายการนั้นออกจาก state
  deleteIssue({ commit }, issueId) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.delete(`/issue/${issueId}`);
        commit("REMOVE_ISSUE", issueId);
        resolve({ success: true, data: res.data });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },

  // โคลน issue หลายรายการ โดยตัด status label และ due date ออกจากสำเนา
  cloneIssues({ commit, dispatch }, { items, count }) {
    return new Promise(async (resolve) => {
      try {
        // โหลดชื่อ status label เพื่อใช้กรองไม่ให้ติดไปกับข้อมูลที่ clone
        let statusLabelNames = new Set();
        try {
          const res = await dispatch(
            "labels/getLabelsName",
            { type: 2 },
            { root: true }
          );
          const statusLabels = res?.data || [];
          statusLabelNames = new Set(
            statusLabels.map((l) => l.name || l).filter(Boolean)
          );
        } catch {
          /* ถ้าโหลด label ไม่ได้จะข้ามขั้นตอนกรอง label */
        }

        // แปลงรูปแบบ labels ให้กลายเป็น array สำหรับนำไปกรองและส่งต่อ API
        const parseLabels = (labels) => {
          if (!labels) return [];
          if (Array.isArray(labels)) return labels.map(String).filter(Boolean);
          if (typeof labels === "string") {
            return labels
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
          return [];
        };

        const created = [];
        for (const item of items) {
          // กรองเฉพาะ label ที่ยังต้องเก็บไว้ในสำเนาใหม่
          const filteredLabels = parseLabels(item.labels).filter(
            (name) => !statusLabelNames.has(name)
          );

          for (let i = 0; i < count; i++) {
            const cloneData = {
              name: item.title || item.name,
              description: item.description || "",
              labels: filteredLabels,
              assigneeUsername: item.assigneeUsername || null,
              milestone: item.milestone || null,
              startDate: null,
              dueDate: null,
              projectId: item.projectId,
              productId: item.productId || null,
            };
            const res = await api.post("/issue", cloneData);
            const newItem = Array.isArray(res.data) ? res.data[0] : res.data;
            commit("ADD_ISSUE", newItem);
            created.push(newItem);
          }
        }
        resolve({ success: true, data: created });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },

  // เปิด issue ที่ถูกปิดไปแล้วให้กลับมาเป็นสถานะใช้งานอีกครั้ง
  restoreIssue({ commit }, issueId) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.get(`/issue/${issueId}/restore`);
        commit("UPDATE_ISSUE", res.data);
        resolve({ success: true, data: res.data });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },

  // ดึง issue ที่ยังสามารถเชื่อมกับ product ที่เลือกได้
  getLinkableIssuesByProduct(_, productId) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.get(`/issue/linkable/product/${productId}`);
        resolve({
          success: true,
          data: Array.isArray(res.data) ? res.data : [],
        });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
          data: [],
        });
      }
    });
  },

  // เชื่อม issue เข้ากับ product แล้วอัปเดตผลลัพธ์กลับเข้า state
  linkIssueToProduct({ commit }, { issueId, productId }) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.post("/issue/link-product", {
          issueId,
          productId,
        });
        commit("UPDATE_ISSUE", res.data);
        resolve({ success: true, data: res.data });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },

  // ยกเลิกการเชื่อม issue ออกจาก product แล้วอัปเดต state
  unlinkIssueFromProduct({ commit }, { issueId }) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.post("/issue/unlink-product", { issueId });
        commit("UPDATE_ISSUE", res.data);
        resolve({ success: true, data: res.data });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },
};

export const getters = {
  // คืนรายการ issue ปัจจุบันจาก state
  issues: (state) => state.issues,

  // คืนค่าสถานะ loading ของโมดูล issue
  loading: (state) => state.loading,

  // คืนค่าตัวกรองผู้ใช้ที่กำลังใช้งาน
  userFilter: (state) => state.userFilter,

  // คืนค่าตัวกรอง label ที่กำลังใช้งาน
  labelFilter: (state) => state.labelFilter,

  // รวมรายชื่อผู้สร้างและผู้รับผิดชอบ issue สำหรับใช้เป็นตัวเลือกกรอง
  uniqueUsers: (state) => {
    const users = new Set();
    if (state.issues && Array.isArray(state.issues)) {
      state.issues.forEach((issue) => {
        if (issue.authorUsername) users.add(issue.authorUsername);
        if (issue.assigneeUsername) users.add(issue.assigneeUsername);
      });
    }
    return Array.from(users).sort();
  },

  // รวม label จากทุก issue เพื่อใช้ทำตัวเลือกกรองบนหน้า list
  uniqueLabels: (state) => {
    const labels = new Set();
    if (state.issues && Array.isArray(state.issues)) {
      state.issues.forEach((issue) => {
        let issueLabels = issue.labels;
        if (!issueLabels) return;

        if (typeof issueLabels === "string") {
          issueLabels = issueLabels
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }

        if (Array.isArray(issueLabels)) {
          issueLabels.forEach((label) => {
            if (label && label.trim()) labels.add(label.trim());
          });
        }
      });
    }
    return Array.from(labels).sort();
  },

  // คืนรายการ issue หลังกรองตามผู้ใช้และ label ที่เลือกไว้
  filteredIssues: (state) => {
    let issues = state.issues || [];

    if (state.userFilter && state.userFilter.length > 0) {
      issues = issues.filter(
        (issue) =>
          (issue.authorUsername &&
            state.userFilter.includes(issue.authorUsername)) ||
          (issue.assigneeUsername &&
            state.userFilter.includes(issue.assigneeUsername))
      );
    }

    if (state.labelFilter && state.labelFilter.length > 0) {
      issues = issues.filter((issue) =>
        (() => {
          let issueLabels = issue.labels;
          if (!issueLabels) return false;
          if (typeof issueLabels === "string") {
            issueLabels = issueLabels
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
          if (!Array.isArray(issueLabels)) return false;
          return issueLabels.some((label) => state.labelFilter.includes(label));
        })()
      );
    }

    return issues;
  },
};
