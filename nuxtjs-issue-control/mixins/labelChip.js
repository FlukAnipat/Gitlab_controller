const DEFAULT_LABEL_COLOR = "#9E9E9E";

export default {
  methods: {
    // คืนค่าสีพื้นหลังของ label chip โดยรองรับทั้ง object label และชื่อ label แบบ string
    getLabelChipColor(label) {
      if (label && typeof label === "object") {
        const labelName = label.name || label.title || "";
        return (
          label.color ||
          this.labelColorMap?.[labelName] ||
          DEFAULT_LABEL_COLOR
        );
      }

      return this.labelColorMap?.[label] || DEFAULT_LABEL_COLOR;
    },

    // คำนวณสีตัวอักษรของ chip จากสีพื้นหลังเพื่อให้อ่านง่าย
    getLabelChipTextColor(label) {
      const color = this.getLabelChipColor(label);
      const hex = (color || "").replace("#", "");

      if (hex.length !== 6) return "white";

      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;

      return yiq >= 160 ? "#111827" : "white";
    },
  },
};
