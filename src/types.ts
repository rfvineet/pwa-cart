export interface Book {
  id: any;
  name: string;
  author: string;
  price: number;
}

export interface CartItem extends Book {
  quantity: number;
}

export interface Bill {
  id: string;
  username: string;
  items: CartItem[];
  total: number;
  date: number;
  synced: boolean;
}
