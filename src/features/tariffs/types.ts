export interface Tariff {
  id: string;
  itemCode: string;
  itemDescription: string;
  price: number;
  description: string | null;
  createdAt: string;
}

export interface TariffListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTariffInput {
  itemCode: string;
  itemDescription: string;
  price: number;
  description?: string;
}

export interface UpdateTariffInput extends Partial<CreateTariffInput> {}
