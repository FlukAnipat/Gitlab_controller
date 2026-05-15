import { api } from "~/plugins/axios";

// เก็บรายการ label และสถานะ loading สำหรับหน้าจัดการ label
export const state = () => ({
  labels: [],
  loading: false,
});

export const mutations = {
  // กำหนดรายการ label ทั้งหมดใหม่ลงใน state
  SET_LABELS(state, labels) {
    state.labels = labels;
  },

  // เพิ่ม label ใหม่ไว้ด้านบนของรายการ
  ADD_LABEL(state, label) {
    state.labels.unshift(label);
  },

  // ลบ label ออกจาก state ตาม id
  REMOVE_LABEL(state, id) {
    state.labels = state.labels.filter((l) => l.id !== id);
  },

  // อัปเดตข้อมูล label เดิมใน state ตาม id
  UPDATE_LABEL(state, updatedLabel) {
    const index = state.labels.findIndex((l) => l.id === updatedLabel.id);
    if (index !== -1) {
      state.labels.splice(index, 1, updatedLabel);
    }
  },

  // สลับสถานะ loading ของโมดูล label
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
};

// ดึง label ทั้งหมดตาม filter และ params ที่กำหนดจาก API
const getAllLabels = async (filter, customParams = {}) => {
  const params = { ...customParams };
  if (filter) params.filter = filter;
  const res = await api.get("/labels", { params });

  return res.data?.data || res.data || [];
};

export const actions = {
  // โหลดรายการ label ทั้งหมดหรือเฉพาะที่ตรงกับ filter แล้วบันทึกลง state
  getLabels({ commit }, { filter, params } = {}) {
    return new Promise(async (resolve) => {
      try {
        commit("SET_LOADING", true);

        const data = await getAllLabels(filter, params);

        commit("SET_LABELS", Array.isArray(data) ? data : []);

        resolve({ success: true, data: Array.isArray(data) ? data : [] });
      } catch (error) {
        console.error("Fetch labels error:", error);
        commit("SET_LABELS", []);
        resolve({ success: false, message: error.message, data: [] });
      } finally {
        commit("SET_LOADING", false);
      }
    });
  },

  // ดึง label ตาม type หรือ filter สำหรับใช้เติมตัวเลือกในฟอร์มต่าง ๆ
  async getLabelsStatus(_, { type = 4, filter } = {}) {
    try {
      const data = await getAllLabels(filter || `type||$eq||${type}`);

      return { success: true, data };
    } catch (error) {
      console.error("Fetch label status error:", error);

      return {
        success: false,
        message: error?.message || "Unknown error",
      };
    }
  },

  // ดึงชื่อ label ตาม type หรือ filter เพื่อใช้กับ dropdown และการจัดกลุ่ม label
  async getLabelsName(_, { type, filter } = {}) {
    try {
      console.log(`labels/getLabelsName: type=${type}, filter=${filter}`);
      const data = await getAllLabels(
        filter ||
          (type !== undefined && type !== null
            ? `type||$eq||${type}`
            : undefined)
      );
      console.log(
        `labels/getLabelsName: fetched ${
          Array.isArray(data) ? data.length : 0
        } labels for type ${type}`
      );

      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("Fetch label names error:", error);

      return {
        success: false,
        message: error?.message || "Unknown error",
        data: [],
      };
    }
  },

  // สร้าง label ใหม่และเพิ่มเข้า state
  createLabel({ commit }, labelData) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.post("/labels", labelData);
        commit("ADD_LABEL", res.data);
        resolve({ success: true, data: res.data });
      } catch (error) {
        console.error("Create label error:", error);
        const message = error.response?.data?.message || error.message;
        resolve({ success: false, message });
      }
    });
  },

  // ลบ label ตาม id แล้วลบออกจาก state
  deleteLabel({ commit }, id) {
    return new Promise(async (resolve) => {
      try {
        await api.delete(`/labels/${id}`);
        commit("REMOVE_LABEL", id);
        resolve({ success: true });
      } catch (error) {
        console.error("Delete label error:", error);
        resolve({ success: false, message: error.message });
      }
    });
  },

  // แก้ไขข้อมูล label แล้วแทนค่ารายการเดิมใน state
  updateLabel({ commit }, { id, labelData }) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.patch(`/labels/${id}`, labelData);
        commit("UPDATE_LABEL", res.data);
        resolve({ success: true, data: res.data });
      } catch (error) {
        console.error("Update label error:", error);
        resolve({ success: false, message: error.message });
      }
    });
  },
};

export const getters = {
  // คืนรายการ label ปัจจุบันจาก state
  labels: (state) => state.labels,

  // คืนค่าสถานะ loading ของโมดูล label
  loading: (state) => state.loading,

  // alias สำหรับคืนรายการ label ทั้งหมด
  allLabels: (state) => state.labels,

  // สร้าง map ชื่อ label ไปยังสี เพื่อใช้กำหนดสีของ chip หรือ badge
  labelColorMap: (state) => {
    const map = {};
    state.labels.forEach((l) => {
      if (l.name && l.color) {
        map[l.name] = l.color;
      }
    });
    return map;
  },
};
