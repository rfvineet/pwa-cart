import { useState, useEffect, useCallback } from "react";
import {
  getLocalBooks,
  saveBooksToLocalDB,
  saveBillToLocalDB,
  getUnsyncedBills,
  markBillAsSynced,
} from "./utils/db";
import { generateBillPDF } from "./utils/pdfGenerator";
import { Book, CartItem } from "./types";
import BookList from "./components/BookList";
import Cart from "./components/Cart";
import CheckoutModal from "./components/CheckoutModal";

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem("shoppingCart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Could not load cart from localStorage", error);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [username, setUsername] = useState("");
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);

  // --- DATA SYNC LOGIC ---

  // Fetches the latest book list from the server
  const syncBooks = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/books");
      if (!response.ok) throw new Error("Failed to fetch books");
      const data = await response.json();
      const formattedData = data.map((book: any) => ({
        ...book,
        id: book._id,
      }));
      await saveBooksToLocalDB(formattedData);
      setBooks(formattedData);
    } catch (error) {
      console.error("Failed to fetch books:", error);
    }
    setIsLoading(false);
  }, []);

  // Sends any unsynced bills to the server
  const syncBills = useCallback(async () => {
    if (!navigator.onLine) {
      console.log("Offline: Bill sync paused.");
      return;
    }
    console.log("Checking for unsynced bills...");
    const unsyncedBills = await getUnsyncedBills();
    console.log(`Found ${unsyncedBills.length} unsynced bills`);
    if (unsyncedBills.length > 0) {
      console.log(`Syncing ${unsyncedBills.length} bills...`);
      for (const bill of unsyncedBills) {
        try {
          console.log("Sending bill to server:", bill);
          const response = await fetch("http://localhost:3001/api/bills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bill),
          });
          if (response.ok) {
            await markBillAsSynced(bill.id);
            console.log(`Bill ${bill.id} synced successfully.`);
          } else {
            console.error(
              "Server responded with error:",
              response.status,
              response.statusText
            );
          }
        } catch (error) {
          console.error("Bill sync failed, will retry later.", error);
          break; // Stop on a network error to retry the batch next time
        }
      }
    }
  }, []);

  // --- LIFECYCLE & EVENT HANDLERS ---

  // Main effect for initialization and setting up timers/listeners
  useEffect(() => {
    async function loadInitialData() {
      const localBooks = await getLocalBooks();
      setBooks(localBooks);
      setIsLoading(false);
    }
    loadInitialData();
    syncBooks(); // Fetch books on first load

    const handleOnline = () => {
      setIsOnline(true);
      syncBooks();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const billSyncInterval = setInterval(syncBills, 10 * 60 * 1000); // 10 minutes

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(billSyncInterval);
    };
  }, [syncBooks, syncBills]);

  // Effect to save the cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("shoppingCart", JSON.stringify(cart));
  }, [cart]);

  // --- USER ACTION FUNCTIONS ---

  // Final step in the checkout process
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || username.trim() === "") return;

    const newBill = {
      id: `bill_${Date.now()}`,
      username: username,
      items: cart,
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      date: Date.now(),
      synced: false,
    };

    console.log("Creating new bill:", newBill);
    await saveBillToLocalDB(newBill);
    console.log("Bill saved to IndexedDB");

    // Immediately check if the bill was saved
    const allUnsyncedBills = await getUnsyncedBills();
    console.log("Unsynced bills after saving:", allUnsyncedBills);

    generateBillPDF(cart, username);

    clearCart();
    setUsername("");
    setIsCheckoutVisible(false);
  };

  const addToCart = (bookToAdd: Book) => {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === bookToAdd.id);
      if (existing) {
        return currentCart.map((item) =>
          item.id === bookToAdd.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...bookToAdd, quantity: 1 }];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  // --- JSX RENDER ---
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Offline Bookstore PWA</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={syncBills}
              className="px-3 py-1 text-sm font-semibold rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              Sync Bills
            </button>
            <div
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
                isOnline
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isOnline ? "Online 🟢" : "Offline 🔴"}
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold mb-4">Available Books</h2>
          <BookList books={books} addToCart={addToCart} isLoading={isLoading} />
        </div>
        <div>
          <Cart
            cartItems={cart}
            clearCart={clearCart}
            openCheckout={() => setIsCheckoutVisible(true)}
            username={username}
            setUsername={setUsername}
          />
        </div>
      </main>
      <CheckoutModal
        isOpen={isCheckoutVisible}
        onClose={() => setIsCheckoutVisible(false)}
        onConfirm={handlePlaceOrder}
        cartItems={cart}
        username={username}
      />
    </div>
  );
}

export default App;
