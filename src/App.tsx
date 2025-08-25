import { useState, useEffect, useCallback } from "react";
import {
  getLocalBooks,
  saveBooksToLocalDB,
  saveBillToLocalDB,
  getUnsyncedBills,
  deleteBillFromLocalDB,
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
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    items: CartItem[];
    username: string;
    total: number;
    billId: string;
  } | null>(null);

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
            console.log(`Bill ${bill.id} synced successfully.`);
            await deleteBillFromLocalDB(bill.id);
            console.log(
              `Bill ${bill.id} synced and deleted from local storage.`
            );
          } else {
            console.error(
              "Server responded with error:",
              response.status,
              response.statusText
            );
          }
        } catch (error) {
          console.error("Bill sync failed, will retry later.", error);
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      const localBooks = await getLocalBooks();
      setBooks(localBooks);
      setIsLoading(false);
    }
    loadInitialData();
    syncBooks();

    const handleOnline = () => {
      setIsOnline(true);
      syncBooks();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const billSyncInterval = setInterval(syncBills, 10 * 60 * 1000);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(billSyncInterval);
    };
  }, [syncBooks, syncBills]);

  useEffect(() => {
    localStorage.setItem("shoppingCart", JSON.stringify(cart));
  }, [cart]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || username.trim() === "") return;

    const billId = `bill_${Date.now()}`;
    const newBill = {
      id: billId,
      username: username,
      items: cart,
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      date: Date.now(),
      synced: false,
    };

    console.log("Creating new bill:", newBill);
    await saveBillToLocalDB(newBill);
    console.log("Bill saved to IndexedDB");

    const allUnsyncedBills = await getUnsyncedBills();
    console.log("Unsynced bills after saving:", allUnsyncedBills);

    setLastOrder({
      items: [...cart],
      username: username,
      total: newBill.total,
      billId: billId,
    });

    clearCart();
    setUsername("");
    setIsCheckoutVisible(false);
    setShowSuccessScreen(true);
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

  const handleDownloadPDF = () => {
    if (lastOrder) {
      generateBillPDF(lastOrder.items, lastOrder.username);
    }
  };

  const handleBackToShopping = () => {
    setShowSuccessScreen(false);
    setLastOrder(null);
  };

  if (showSuccessScreen && lastOrder) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <header className="bg-white shadow-md p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Offline Bookstore PWA</h1>
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
        </header>

        <main className="container mx-auto p-6 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Order Placed Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you, {lastOrder.username}! Your order has been placed and
              saved locally.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2">
                {lastOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <hr className="my-4" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{lastOrder.total.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Order ID: {lastOrder.billId}
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleDownloadPDF}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                📄 Download PDF Receipt
              </button>
              <button
                onClick={handleBackToShopping}
                className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>

            {isOnline ? (
              <p className="text-sm text-green-600 mt-4">
                Your order will be synced to the server automatically
              </p>
            ) : (
              <p className="text-sm text-orange-600 mt-4">
                Order saved locally. Will sync when connection is restored.
              </p>
            )}
          </div>
        </main>
      </div>
    );
  }

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
