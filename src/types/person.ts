export interface Person {
  id: string;
  name: string;
  nickname?: string;
  phoneNumber?: string;
  photo?: string;
  totalDebt: number;
  lastTransactionDate: string;
  updatedAtTimestamp?: number; // Optional for sorting
}