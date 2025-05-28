// src/types/index.ts
export interface Store {
  id: string;
  storeName: string;
  storeNumber: string;
  storeTc: string;
  isCompleted: boolean;
}

export interface BoxData {
  date: string;
  storeId: string;
  storeName: string;
  storeTc: string;
  color: string;
  boxCount: number;
  boxCreatedBy?: string;
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