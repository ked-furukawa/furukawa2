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

export const CompleteState = {
  PENDING: 'PENDING',
  DONE: 'DONE',
  REWORK_PENDING: 'REWORK_PENDING',
  REWORK_DONE: 'REWORK_DONE',
}
