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
    upgrade(db, oldVersion) {
      if (oldVersion < 1) db.createObjectStore("books", { keyPath: "id" });
      if (oldVersion < 2) {
        const store = db.createObjectStore("bills", { keyPath: "id" });
        store.createIndex("by-synced", "synced");
      }
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

export async function saveBillToLocalDB(bill: Bill) {
  console.log("Saving bill to IndexedDB:", bill);
  const result = await (await dbPromise).put("bills", bill);
  console.log("Bill saved with result:", result);
  return result;
}
export async function getUnsyncedBills(): Promise<Bill[]> {
  const db = await dbPromise;
  console.log("Getting unsynced bills...");

  // First, let's get ALL bills to see what's in the database
  const allBills = await db.getAll("bills");
  console.log("All bills in database:", allBills);

  // Then try to get unsynced bills using the index
  const bills = await db.getAllFromIndex("bills", "by-synced", 0);
  console.log("Found unsynced bills:", bills);

  // Also try getting bills with synced: false directly
  const unsyncedBillsManual = allBills.filter((bill) => bill.synced === false);
  console.log("Manual filter for unsynced bills:", unsyncedBillsManual);

  return bills;
}
export async function markBillAsSynced(billId: string): Promise<void> {
  const db = await dbPromise;
  const bill = await db.get("bills", billId);
  if (bill) {
    bill.synced = true;
    await db.put("bills", bill);
  }
}
