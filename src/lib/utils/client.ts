export const formatClientId = (indexNo: number | undefined | null) => {
  if (!indexNo) return "C-0000";
  return `C-${indexNo.toString().padStart(4, '0')}`;
};
