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


export type OrderStatus = 'PENDING' | 'DONE';
export interface OrderData { //Orderテーブル用interface
  importId: string; //20250609_1300

  date: string; //20250609

  storeId: string; //019
  storeName: string; //内野店
  storeTc: string; //中之島

  itemId: string; //210014
  itemName: string; //あさり
  itemFormalName?: string; //あさりと生姜の炊き込みご飯
  itemCount: number; //5

  departmentId: string; //souzai2
  departmentName?: string; //惣菜2

  status: OrderStatus; //'PENDING' or 'DONE'
}

export const StatusTemplate = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',

  CONFIRMED: 'CONFIRMED',
  DOUBLE_CHECKED: 'DOUBLE_CHECKED'
}
