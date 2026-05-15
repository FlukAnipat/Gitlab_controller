/**
 * detailFunction mixin
 *
 * รวม logic ที่ใช้ร่วมกันระหว่าง ProductdetailFunction และ IssuedetailFunction
 * ครอบคลุม:
 *  - Labels (load / change / remove / clear / colors)
 *  - Milestones
 *  - Project Members
 *  - Time Tracking (display ↔ minutes)
 *  - Date display (พ.ศ.)
 *  - Dirty-field tracking + payload builder
 *  - Quill editor (toggle, text-change, image upload, paste)
 *  - Description renderer (markdown → HTML)
 *
 * การใช้งาน:
 *   mixins: [detailFunctionMixin]
 *
 * Component ที่ใช้ mixin นี้ต้อง:
 *   - มี data: { issue/product, labelsByType, labelByType, labelColorMap,
 *               dirtyFields, originalValues, milestones, projectMembers,
 *               membersLoading, timeEstimateDisplay, timeSpentDisplay,
 *               descEditMode, editableHtml, saving }
 *   - มี computed: parsedLabels  (ดึง array labels จาก issue/product)
 *   - มี ref: issueEditor หรือ productEditor  (vue-editor ref)
 *   - ส่ง entityKey ('issue' | 'product') ผ่าน data หรือ computed
 *     เพื่อให้ mixin รู้ว่า ref ชื่ออะไร และ snapshot method ไหน
 */

const LABEL_TYPE_DEFS = Object.freeze([
  { type: 0, label: "Job type", icon: "mdi-briefcase-outline", color: "#009688" },
  { type: 1, label: "Project",  icon: "mdi-folder-outline",    color: "#E65100" },
  { type: 2, label: "Status",   icon: "mdi-check-circle-outline", color: "#1867C5" },
  { type: 3, label: "Role",     icon: "mdi-account-outline",   color: "#7B1FA2" },
]);

const EDITOR_TOOLBAR = Object.freeze([
  ["undo", "redo"],
  [{ header: [false, 1, 2, 3, 4, 5, 6] }],
  ["bold", "italic", "underline", "strike"],
  [{ align: "" }, { align: "center" }, { align: "right" }, { align: "justify" }],
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
  [{ indent: "-1" }, { indent: "+1" }],
  ["link", "image", "video"],
  ["blockquote", "code-block"],
  [{ color: [] }, { background: [] }],
  ["clean"],
]);

export { LABEL_TYPE_DEFS, EDITOR_TOOLBAR };

export default {
  data() {
    return {
      labelTypeDefs: LABEL_TYPE_DEFS,
      EDITOR_TOOLBAR,

      // Labels
      labelsByType:  { 0: [], 1: [], 2: [], 3: [] },
      labelByType:   { 0: [], 1: [], 2: null, 3: null },
      labelColorMap: {},

      // Milestones
      milestones: [],

      // Members
      projectMembers: [],
      membersLoading: false,

      // Time Tracking
      timeEstimateDisplay: "",
      timeSpentDisplay:    "",

      // Editor
      descEditMode: false,
      editableHtml: "",

      // Dirty tracking
      dirtyFields:    {},
      originalValues: {},

      // Original dates (for Thai display)
      originalStartDate: "",
      originalDueDate:   "",

      saving: false,

      // UI Menus
      startDateMenu: false,
      dueDateMenu:   false,
    };
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Computed
  // ─────────────────────────────────────────────────────────────────────────────
  computed: {
    milestoneOptions() {
      return this.sortMilestonesByCurrentMonth(this.milestones).map((m) => m.title);
    },
    isDirty() {
      return Object.keys(this.dirtyFields).length > 0;
    },
    dirtyCount() {
      return Object.keys(this.dirtyFields).length;
    },
    /** ref name ของ vue-editor — override ใน component หากต้องการ */
    _editorRef() {
      return this.$refs.issueEditor?.quill
        ? this.$refs.issueEditor
        : this.$refs.productEditor;
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Methods
  // ─────────────────────────────────────────────────────────────────────────────
  methods: {

    // ══════════════════════════════════════════════════════════════════════════
    // Time Tracking
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * แปลง minutes → string แสดงผล
     * @param {number}  minutes
     * @param {boolean} isEstimate  true = แสดงแค่ Xh, false = Xh Ym
     */
    minutesToTimeString(minutes, isEstimate = true) {
      if (!minutes) return "";
      const h = Math.floor(Number(minutes) / 60);
      const m = Number(minutes) % 60;
      if (isEstimate) return `${h}h`;
      if (h === 0) return `${m}m`;
      if (m === 0) return `${h}h`;
      return `${h}h${m}m`;
    },

    /**
     * แปลง string (เช่น "2h", "1h30m", "45m") → minutes
     * @param {string}  str
     * @param {boolean} isEstimate
     */
    timeStringToMinutes(str, isEstimate = true) {
      if (!str) return 0;
      const s = String(str).trim().toLowerCase();
      if (/^\d+$/.test(s)) return Number(s);
      if (isEstimate) {
        const m = s.match(/^(\d+)h$/);
        return m ? Number(m[1]) * 60 : 0;
      }
      let total = 0;
      const hm = s.match(/(\d+)h/);
      if (hm) total += Number(hm[1]) * 60;
      const mm = s.match(/(\d+)m/);
      if (mm) total += Number(mm[1]);
      return total;
    },

    handleTimeEstimateInput(v) {
      this.timeEstimateDisplay = v;
      this.updateField("timeEstimate", this.timeStringToMinutes(v, true));
    },

    handleTimeSpentInput(v) {
      this.timeSpentDisplay = v;
      this.updateField("timeSpent", this.timeStringToMinutes(v, false));
    },

    // ══════════════════════════════════════════════════════════════════════════
    // Date helpers
    // ══════════════════════════════════════════════════════════════════════════


    // ══════════════════════════════════════════════════════════════════════════
    // Labels
    // ══════════════════════════════════════════════════════════════════════════

    async loadLabelsByType() {
      const [t0, t1, t2, t3] = await Promise.all([
        this.$store.dispatch("labels/getLabelsName", { type: 0 }),
        this.$store.dispatch("labels/getLabelsName", { type: 1 }),
        this.$store.dispatch("labels/getLabelsName", { type: 2 }),
        this.$store.dispatch("labels/getLabelsName", { type: 3 }),
      ]);
      this.labelsByType = {
        0: t0.data || [],
        1: t1.data || [],
        2: t2.data || [],
        3: t3.data || [],
      };

      const current = this.parsedLabels; // ต้อง implement ใน component
      const byType  = { 0: [], 1: [], 2: null, 3: null };

      for (let t = 0; t <= 3; t++) {
        const names   = (this.labelsByType[t] || []).map((l) => l.name);
        const matched = current.filter((l) => names.includes(l));
        byType[t] = t < 2 ? matched : matched[0] || null;
      }
      this.labelByType = byType;
    },

    onLabelTypeChange() {
      const merged = [];
      for (let t = 0; t <= 3; t++) {
        const val = this.labelByType[t];
        if (Array.isArray(val)) merged.push(...val);
        else if (val) merged.push(val);
      }
      this.updateField("labels", merged);
    },

    removeLabelFromType(type, labelName) {
      const current = this.labelByType[type];
      if (!Array.isArray(current)) return;
      const idx = current.indexOf(labelName);
      if (idx !== -1) {
        current.splice(idx, 1);
        this.onLabelTypeChange();
      }
    },

    clearAllLabels() {
      this.labelByType = { 0: [], 1: [], 2: null, 3: null };
      this.onLabelTypeChange();
    },

    async getLabelColors() {
      try {
        const res = await this.$store.dispatch("labels/getLabels", {
          params: { limit: 1000 },
        });
        const all = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const map = {};
        all.forEach((l) => { if (l.name && l.color) map[l.name] = l.color; });
        this.labelColorMap = map;
      } catch {
        /* silent */
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // Milestones
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @param {string|null} projectId  — ถ้าไม่ส่งจะ fallback ไป store
     */
    async getMilestones(projectId = null) {
      try {
        let pid = projectId || null;
        if (!pid) {
          await this.$store.dispatch("project/getProjects");
          const projects = this.$store.getters["project/projects"];
          const current  = this.$store.getters["project/currentProject"];
          const matched  = current?.id
            ? projects.find((p) => p.id === current.id)
            : projects[0];
          pid = matched?.id || null;
        }
        if (!pid) return;
        const res = await this.$store.dispatch("project/getProjectMilestones", pid);
        this.milestones = Array.isArray(res.data) ? res.data : [];
      } catch {
        this.milestones = [];
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // Project Members
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @param {string|null} currentUsername  — username ที่ assign อยู่แล้ว (ใส่ไว้ต้น list ถ้าไม่อยู่ใน list)
     */
    async getProjectMembers(currentUsername = null) {
      try {
        this.membersLoading = true;
        const res  = await this.$store.dispatch("auth/getUsers", { limit: 500, page: 1 });
        const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];
        this.projectMembers = rows.map((u) => u.username).filter(Boolean).sort();
        const cur = currentUsername;
        if (cur && !this.projectMembers.includes(cur)) this.projectMembers.unshift(cur);
      } catch {
        this.projectMembers = [];
      } finally {
        this.membersLoading = false;
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // Dirty-field tracking
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * สร้าง API payload object สำหรับ field ที่เปลี่ยน
     */
    buildFieldUpdatePayload(field, value) {
      switch (field) {
        case "name":
          return { name: String(value || "").trim() };
        case "description":
          return { description: value || "" };
        case "assigneeUsername":
          return { assigneeUsername: String(value || "").trim() || null };
        case "labels":
          return { labels: Array.isArray(value) ? value.filter(Boolean) : [] };
        case "milestone":
          return { milestone: String(value || "").trim() || null };
        case "timeEstimate":
          return { timeEstimate: value === "" || value == null ? 0 : Number(value) || 0 };
        case "timeSpent":
          return { timeSpent: value === "" || value == null ? 0 : Number(value) || 0 };
        case "startDate":
          return { startDate: value || null };
        case "dueDate":
          return { dueDate: value || null };
        default:
          return {};
      }
    },

    /**
     * เปรียบเทียบค่ากับ originalValues แล้วเพิ่ม/ลบจาก dirtyFields
     */
    updateField(field, value) {
      const entityId = this.issue?.id || this.product?.id;
      if (!entityId) return;

      const payload  = this.buildFieldUpdatePayload(field, value);
      const original = this.originalValues[field];

      if (field === "labels") {
        const arr     = Array.isArray(value) ? value : [];
        const current = JSON.stringify([...arr].sort());
        let origArr   = [];
        try { origArr = JSON.parse(original || "[]"); } catch { origArr = []; }
        if (!Array.isArray(origArr)) origArr = [];

        if (current === JSON.stringify([...origArr].sort())) {
          const u = { ...this.dirtyFields };
          delete u[field];
          this.dirtyFields = u;
        } else {
          this.$set(this.dirtyFields, field, payload);
        }
        return;
      }

      const isNumericField = field === "timeEstimate" || field === "timeSpent";
      const current = isNumericField
        ? (value === "" || value == null ? 0 : Number(value) || 0)
        : value || "";

      if (String(current) === String(original ?? "")) {
        const u = { ...this.dirtyFields };
        delete u[field];
        this.dirtyFields = u;
      } else {
        this.$set(this.dirtyFields, field, payload);
      }

      if (field === "startDate") this.originalStartDate = value;
      if (field === "dueDate")   this.originalDueDate   = value;
    },

    /**
     * สร้าง snapshot ของ entity สำหรับเปรียบเทียบ dirty
     * @param {Object} entity  — issue หรือ product object
     */
    _snapshotEntity(entity) {
      let labels = entity.labels || [];
      if (typeof labels === "string") {
        labels = labels.split(",").map((s) => s.trim()).filter(Boolean);
      }
      return {
        name:             entity.name             || "",
        description:      entity.description      || "",
        assigneeUsername: entity.assigneeUsername || "",
        labels:           JSON.stringify([...labels].sort()),
        milestone:        entity.milestone        || "",
        timeEstimate:     entity.timeEstimate      ?? 0,
        timeSpent:        entity.timeSpent         ?? 0,
        startDate:        entity.startDate         || "",
        dueDate:          entity.dueDate           || "",
      };
    },

    // ══════════════════════════════════════════════════════════════════════════
    // Quill / vue-editor
    // ══════════════════════════════════════════════════════════════════════════

    /** toggle view ↔ edit mode ของ description */
    toggleDescMode() {
      const entity = this.issue || this.product;
      if (!this.descEditMode && entity) {
        this.editableHtml = entity.description || "";
      }
      this.descEditMode = !this.descEditMode;
      if (this.descEditMode) {
        this.$nextTick(() => this._registerQuillPaste());
      }
    },

    /** รับ text-change event จาก vue-editor */
    onEditorTextChange(delta, oldDelta, source) {
      if (source !== "user") return;
      const entity = this.issue || this.product;
      if (!entity) return;
      const quill = this._editorRef?.quill;
      if (!quill) return;
      const markdown = this._quillHtmlToMarkdown(quill.root.innerHTML);
      entity.description = markdown;
      this.updateField("description", markdown);
    },

    /** แปลง Quill innerHTML → Markdown (เก็บเฉพาะ img + text พื้นฐาน) */
    _quillHtmlToMarkdown(innerHTML) {
      if (!innerHTML) return "";
      return innerHTML
        .replace(/<img[^>]*?\ssrc=["']([^"']+)["'][^>]*?\/?>/gi, (_, src) => `![image](${src})`)
        .replace(/<\/p>/gi,    "\n")
        .replace(/<p[^>]*>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g,   "")
        .replace(/&nbsp;/g,    " ")
        .replace(/&amp;/g,     "&")
        .replace(/&lt;/g,      "<")
        .replace(/&gt;/g,      ">")
        .replace(/&quot;/g,    '"')
        .replace(/\n+$/, "")
        .trim();
    },

    /**
     * render description (view mode)
     * รองรับ markdown image (absolute + relative /uploads/...)
     */
    renderDescription(content, webUrl) {
      if (!content) return "";
      const base = this._gitlabProjectBase(webUrl);
      let html = content;

      // absolute URL: ![alt](https://...)
      html = html.replace(
        /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,
        (_, alt, src) => `<img src="${src}" alt="${alt || "image"}" />`
      );
      // relative URL: ![alt](/uploads/...)
      html = html.replace(
        /!\[([^\]]*)\]\((\/uploads\/[^)\s]+)\)/g,
        (_, alt, src) => `<img src="${base}${src}" alt="${alt || "image"}" />`
      );
      // newline → <br>
      html = html.replace(/\n/g, "<br>");
      return html;
    },

    /** ดึง GitLab project base URL จาก webUrl */
    _gitlabProjectBase(webUrl) {
      if (!webUrl) return "https://gitlab.com";
      try {
        const u = new URL(webUrl);
        return `${u.origin}${u.pathname
          .replace(/\/-\/.*$/, "")
          .replace(/\/issues\/.*$/, "")
          .replace(/\/+$/, "")}`;
      } catch {
        return "https://gitlab.com";
      }
    },

    /**
     * image upload handler สำหรับ vue-editor (@image-added)
     * ใช้ได้ทั้ง issue และ product (อ่าน projectId จาก entity อัตโนมัติ)
     */
    async onEditorImageAdded(file, Editor, cursorLocation, resetUploader) {
      try {
        const index = typeof cursorLocation === "number"
          ? cursorLocation
          : Editor.getSelection(true)?.index ?? Editor.getLength();

        const PLACEHOLDER = "[กำลังอัปโหลดรูปภาพ...]";
        Editor.insertText(index, PLACEHOLDER, "user");
        Editor.setSelection(index + PLACEHOLDER.length, 0);

        const removePlaceholder = () => {
          try {
            const pi = Editor.getText().indexOf(PLACEHOLDER);
            if (pi !== -1) Editor.deleteText(pi, PLACEHOLDER.length);
          } catch (_) {}
        };

        const entity = this.issue || this.product;
        let projectId = entity?.projectId || entity?.product?.projectId || null;

        if (!projectId) {
          await this.$store.dispatch("project/getProjects");
          const projects = this.$store.getters["project/projects"];
          const current  = this.$store.getters["project/currentProject"];
          const matched  = current?.id
            ? projects.find((p) => p.id === current.id)
            : projects[0];
          projectId = matched?.id || null;
        }

        if (!projectId) {
          removePlaceholder();
          resetUploader?.();
          return;
        }

        const formData = new FormData();
        formData.append("file", file, file.name || `paste-${Date.now()}.png`);
        const res = await this.$store.dispatch("project/uploadFile", { projectId, formData });

        const imgUrl = res.data?.url;
        removePlaceholder();

        if (imgUrl) {
          const insertAt = Editor.getSelection(true)?.index ?? index;
          const mdText   = `![image](${imgUrl})`;
          Editor.insertText(insertAt, mdText, "user");
          Editor.setSelection(insertAt + mdText.length, 0);

          await this.$nextTick();
          const markdown = this._quillHtmlToMarkdown(Editor.root.innerHTML);
          if (entity) entity.description = markdown;
          this.updateField("description", markdown);
        }

        resetUploader?.();
      } catch (err) {
        console.error("onEditorImageAdded error:", err);
        resetUploader?.();
      }
    },

    /** ดักรับ paste รูปภาพใน Quill แล้วส่งต่อให้ onEditorImageAdded */
    _registerQuillPaste() {
      if (!process.client) return;
      const quill = this._editorRef?.quill;
      if (!quill) {
        setTimeout(() => this._registerQuillPaste(), 300);
        return;
      }
      if (this._quillPasteHandler) {
        quill.root.removeEventListener("paste", this._quillPasteHandler, true);
      }
      this._quillPasteHandler = async (evt) => {
        const items     = Array.from(evt.clipboardData?.items || []);
        const imageItem = items.find((i) => i.type.startsWith("image/"));
        if (!imageItem) return;
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation();
        const file = imageItem.getAsFile();
        if (!file) return;
        const index = quill.getSelection(true)?.index ?? quill.getLength();
        await this.onEditorImageAdded(file, quill, index, () => {});
      };
      quill.root.addEventListener("paste", this._quillPasteHandler, true);
    },

    // ══════════════════════════════════════════════════════════════════════════
    // Shared reset helper (เรียกตอน dialog ปิด)
    // ══════════════════════════════════════════════════════════════════════════

    _resetDialogState() {
      this.dirtyFields         = {};
      this.originalValues      = {};
      this.labelsByType        = { 0: [], 1: [], 2: [], 3: [] };
      this.labelByType         = { 0: [], 1: [], 2: null, 3: null };
      this.labelColorMap       = {};
      this.milestones          = [];
      this.projectMembers      = [];
      this.membersLoading      = false;
      this.timeEstimateDisplay = "";
      this.timeSpentDisplay    = "";
      this.descEditMode        = false;
      this.editableHtml        = "";
      this.originalStartDate   = "";
      this.originalDueDate     = "";
      this.startDateMenu       = false;
      this.dueDateMenu         = false;
    },

    /**
     * ตั้งค่า time display fields จาก entity
     * @param {Object} entity
     */
    _initTimeDisplay(entity) {
      this.timeEstimateDisplay = this.minutesToTimeString(entity.timeEstimate, true);
      this.timeSpentDisplay    = this.minutesToTimeString(entity.timeSpent,    false);
      this.originalStartDate   = entity.startDate || "";
      this.originalDueDate     = entity.dueDate   || "";
    },
  },
};