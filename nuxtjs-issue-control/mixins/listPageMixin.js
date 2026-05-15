export default {
  // เก็บ state กลางสำหรับหน้ารายการที่มีการค้นหา กรอง แบ่งหน้า และเลือกหลายรายการ
  data() {
    return {
      searchQuery: "",
      itemsPerPage: 20,
      currentPage: 1,
      selectedUserDisplay: null,
      selectedStatusDisplay: [],
      selectedJobTypeDisplay: [],
      selectedProjectDisplay: [],
      selectedIds: [],
      filterStartDate: null,
      filterDueDate: null,
      startDateMenu: false,
      dueDateMenu: false,
      stateFilter: "opened",
      isBulkMode: false,
      pageReady: false,
    };
  },

  computed: {
    // คำนวณจำนวนหน้าทั้งหมดจากจำนวนรายการที่ผ่านตัวกรองและขนาดหน้า
    totalPages() {
      return Math.ceil((this.filteredItems?.length || 0) / this.itemsPerPage) || 1;
    },

    // สร้างตัวเลือก items per page ตามจำนวนข้อมูลที่มีจริง
    itemsPerPageOptions() {
      const options = [20, 60, 100];
      const total = this.filteredItems?.length || 0;
      if (total > 100) {
        const maxOption = Math.ceil(total / 100) * 100;
        for (let size = 200; size <= maxOption; size += 100) {
          options.push(size);
        }
      }
      return options;
    },

    // ตัดรายการที่ผ่านตัวกรองให้เหลือเฉพาะหน้าปัจจุบัน
    pagedItems() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return (this.filteredItems || []).slice(start, end);
    },

    // เลือกไอคอนของตัวกรองผู้ใช้ตามสถานะการเลือกปัจจุบัน
    userSelectAllIcon() {
      return this.selectedUserDisplay ? "mdi-close-box" : "mdi-checkbox-blank-outline";
    },

    // เลือกไอคอนของตัวกรอง job type ตามจำนวนค่าที่ถูกเลือก
    jobTypeSelectAllIcon() {
      if (this.selectedJobTypeDisplay.length === (this.jobTypeFilterOptions?.length || 0) && (this.jobTypeFilterOptions?.length || 0) > 0)
        return "mdi-close-box";
      if (this.selectedJobTypeDisplay.length > 0) return "mdi-minus-box";
      return "mdi-checkbox-blank-outline";
    },

    // เลือกไอคอนของตัวกรองสถานะตามจำนวนค่าที่ถูกเลือก
    statusSelectAllIcon() {
      if (this.selectedStatusDisplay.length === (this.statusFilterOptions?.length || 0) && (this.statusFilterOptions?.length || 0) > 0)
        return "mdi-close-box";
      if (this.selectedStatusDisplay.length > 0) return "mdi-minus-box";
      return "mdi-checkbox-blank-outline";
    },

    // เลือกไอคอนของตัวกรอง project ตามจำนวนค่าที่ถูกเลือก
    projectSelectAllIcon() {
      if (this.selectedProjectDisplay.length === (this.projectFilterOptions?.length || 0) && (this.projectFilterOptions?.length || 0) > 0)
        return "mdi-close-box";
      if (this.selectedProjectDisplay.length > 0) return "mdi-minus-box";
      return "mdi-checkbox-blank-outline";
    },

    // กำหนดวันที่ต่ำสุดของ Due Date ต้องไม่น้อยกว่า Start Date
    filterDueDateMin() {
      return this.filterStartDate || undefined;
    },
  },

  watch: {
    // รีเซ็ตกลับไปหน้าแรกเมื่อผู้ใช้เปลี่ยนจำนวนรายการต่อหน้า
    itemsPerPage() {
      this.currentPage = 1;
    },

    // ซิงก์ selectedIds ให้เหลือเฉพาะรายการที่ยังอยู่ในชุดข้อมูลที่กรองแล้ว
    filteredItems() {
      this.selectedIds = (this.selectedIds || []).filter((id) =>
        (this.filteredItems || []).some((item) => Number(item.id) === Number(id))
      );
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages || 1;
      }
    },

    // ล้างรายการที่เลือกไว้เมื่อปิดโหมด bulk action
    isBulkMode(val) {
      if (!val) {
        this.clearSelection();
      }
    },

    // ถ้าเปลี่ยน Start Date แล้ว Due Date น้อยกว่า Start Date ให้ clear Due Date
    filterStartDate(newVal) {
      if (newVal && this.filterDueDate && this.filterDueDate < newVal) {
        this.filterDueDate = null;
      }
    },
  },

  methods: {
    // แปลงข้อมูล labels ให้เป็น array ของชื่อ label ในรูปแบบเดียวกัน
    parseLabels(labels) {
      if (!labels) return [];
      if (typeof labels === "string" && labels.includes(",")) {
        return labels.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (Array.isArray(labels)) {
        return labels.map((l) => typeof l === "object" ? (l.name || "").trim() : (l || "").trim()).filter(Boolean);
      }
      if (typeof labels === "string") return [labels.trim()].filter(Boolean);
      return [];
    },

    // รีเซ็ตตัวกรองผู้ใช้ให้กลับเป็นไม่เลือกใครเลย
    toggleSelectAllUsers() {
      this.selectedUserDisplay = null;
    },

    // เลือกหรือยกเลิกการเลือก job type ทั้งหมดในครั้งเดียว
    toggleSelectAllJobTypes() {
      this.$nextTick(() => {
        this.selectedJobTypeDisplay = this.selectedJobTypeDisplay.length === (this.jobTypeFilterOptions?.length || 0) ? [] : [...(this.jobTypeFilterOptions || [])];
      });
    },

    // เลือกหรือยกเลิกการเลือกสถานะทั้งหมดในครั้งเดียว
    toggleSelectAllStatus() {
      this.$nextTick(() => {
        this.selectedStatusDisplay = this.selectedStatusDisplay.length === (this.statusFilterOptions?.length || 0) ? [] : [...(this.statusFilterOptions || [])];
      });
    },

    // เลือกหรือยกเลิกการเลือก project ทั้งหมดในครั้งเดียว
    toggleSelectAllProjects() {
      this.$nextTick(() => {
        this.selectedProjectDisplay = this.selectedProjectDisplay.length === (this.projectFilterOptions?.length || 0) ? [] : [...(this.projectFilterOptions || [])];
      });
    },

    // ล้างรายการ id ที่ถูกเลือกทั้งหมด
    clearSelection() {
      this.selectedIds = [];
    },

    // ตรวจว่ารายการที่ส่งเข้ามาถูกเลือกอยู่หรือไม่
    isItemSelected(id) {
      return (this.selectedIds || []).includes(Number(id));
    },

    // สลับสถานะเลือกหรือยกเลิกเลือกรายการตาม id
    toggleItemSelection(id) {
      const nid = Number(id);
      if (Number.isNaN(nid)) return;
      const index = this.selectedIds.indexOf(nid);
      if (index === -1) this.selectedIds.push(nid);
      else this.selectedIds.splice(index, 1);
    },

    // แปลงค่าวันที่ให้เป็น YYYY-MM-DD string
    normalizeDate(value) {
      if (!value) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },

    // ตรวจว่า item มี start_date หรือ due_date ที่ overlap กับช่วง filterStartDate ~ filterDueDate
    isDateOverlapping(item, dateFrom, dateTo) {
      if (!dateFrom && !dateTo) return true;
      const start = this.normalizeDate(item.startDate || item.start_date);
      const due = this.normalizeDate(item.dueDate || item.due_date);
      // ถ้า item ไม่มีทั้ง start และ due ให้ไม่ผ่าน filter
      if (!start && !due) return false;
      // ตรวจ overlap: item.start <= filterTo AND item.due >= filterFrom
      const itemStart = start || due;
      const itemEnd = due || start;
      if (dateFrom && itemEnd < dateFrom) return false;
      if (dateTo && itemStart > dateTo) return false;
      return true;
    },
  },
};
