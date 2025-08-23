import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Bill, Book } from "../types";

interface BookStoreDB extends DBSchema {
  books: { key: any; value: Book };
  bills: {
    key: string;
    value: Bill;
    indexes: { "by-synced": number };
  };
}

async function initDB(): Promise<IDBPDatabase<BookStoreDB>> {
  return await openDB<BookStoreDB>("book-store-db", 2, {
    upgrade(db) {
      db.createObjectStore("books", { keyPath: "id" });
    },
  });
}
export const dbPromise = initDB();
export async function getLocalBooks(): Promise<Book[]> {
  return (await dbPromise).getAll("books");
}
export async function saveBooksToLocalDB(books: Book[]): Promise<void> {
  const db = await dbPromise;
  const tx = db.transaction("books", "readwrite");
  await Promise.all(books.map((book) => tx.store.put(book)));
  await tx.done;
}
