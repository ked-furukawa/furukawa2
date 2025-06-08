// src/types/index.ts
export interface Store {
  id: string;
  storeName: string;
  storeNumber: string;
  storeTc?: string;
  isChecked?: boolean;
}

export interface BoxData {
  date: string;
  storeId: string;
  storeName?: string;
  storeTc?: string;
  color: string;
  boxCount: number;
  boxCreatedBy?: string;
  isChecked?: boolean;
}

export interface OrderData {
  date: string;
  storeId: string;
  storeName: string;
  storeTc: string;
  itemId: string;
  itemName: string;
  itemFormalName: string;
  resDeptId?: string;
  resDeptName?: string;
  orderCount: number;
}

export const StatusTemplate = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',

  CONFIRMED: 'CONFIRMED',
  DOUBLE_CHECKED: 'DOUBLE_CHECKED'
}
