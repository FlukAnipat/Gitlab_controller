const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

// ดึงชื่อ title ของ milestone ออกมาให้เป็น string ไม่ว่าจะรับ object หรือ string ตรง ๆ
function getTitleValue(milestone) {
  if (typeof milestone === "string") return milestone;
  return milestone?.title || "";
}

// แปลงชื่อ milestone ให้เป็นลำดับเดือน ถ้าหาเดือนไม่เจอจะคืน -1
function getMonthIndex(title) {
  const normalized = String(title || "")
    .trim()
    .toLowerCase();
  if (!normalized) return -1;

  return MONTH_NAMES.findIndex((month) => {
    const pattern = new RegExp(`\\b${month}\\b`, "i");
    return pattern.test(normalized);
  });
}

export default {
  methods: {
    // เรียง milestone โดยให้เดือนปัจจุบันขึ้นก่อน และเก็บรายการที่ไม่ใช่เดือนต่อท้าย
    sortMilestonesByCurrentMonth(milestones) {
      const currentMonth = new Date().getMonth();

      return [...(Array.isArray(milestones) ? milestones : [])].sort(
        (left, right) => {
          const leftTitle = getTitleValue(left);
          const rightTitle = getTitleValue(right);
          const leftIndex = getMonthIndex(leftTitle);
          const rightIndex = getMonthIndex(rightTitle);
          const leftIsMonth = leftIndex !== -1;
          const rightIsMonth = rightIndex !== -1;

          if (leftIsMonth && rightIsMonth) {
            const leftRank = (leftIndex - currentMonth + 12) % 12;
            const rightRank = (rightIndex - currentMonth + 12) % 12;

            if (leftRank !== rightRank) return leftRank - rightRank;
            return leftTitle.localeCompare(rightTitle);
          }

          if (leftIsMonth !== rightIsMonth) {
            return leftIsMonth ? -1 : 1;
          }

          return leftTitle.localeCompare(rightTitle);
        }
      );
    },
  },
};
