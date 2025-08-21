import { useState, useEffect, useCallback } from "react";
import { getLocalBooks, saveBooksToLocalDB } from "./utils/db";
import { Book, CartItem } from "./types";
import BookList from "./components/BookList";
import Cart from "./components/Cart";

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

  const syncData = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/books");
      const data = await response.json();
      const formattedData = data.map((book: any) => ({
        ...book,
        id: book._id,
      }));
      await saveBooksToLocalDB(formattedData);
      setBooks(formattedData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      const localBooks = await getLocalBooks();
      setBooks(localBooks);
      setIsLoading(false);
    }
    loadInitialData();
    syncData();

    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const intervalId = setInterval(syncData, 10 * 60 * 1000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, [syncData]);

  useEffect(() => {
    localStorage.setItem("shoppingCart", JSON.stringify(cart));
  }, [cart]);

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
      <main className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold mb-4">Available Books</h2>
          <BookList books={books} addToCart={addToCart} isLoading={isLoading} />
        </div>
        <div>
          <Cart cartItems={cart} clearCart={clearCart} />
        </div>
      </main>
    </div>
  );
}
export default App;
