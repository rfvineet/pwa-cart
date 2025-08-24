import React from "react";
import { CartItem } from "../types";

interface CartProps {
  cartItems: CartItem[];
  clearCart: () => void;
  openCheckout: () => void;
  username: string;
  setUsername: (name: string) => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  clearCart,
  openCheckout,
  username,
  setUsername,
}) => {
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const isCheckoutDisabled = cartItems.length === 0 || username.trim() === "";

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold">Shopping Cart 🛒</h2>
        <button
          onClick={clearCart}
          disabled={cartItems.length === 0}
          className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:text-gray-400"
        >
          Empty Cart
        </button>
      </div>

      <div className="mb-4">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700"
        >
          Customer Name
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter name to proceed"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {cartItems.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-3 max-h-60 overflow-y-auto">
            {cartItems.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center pr-2"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-gray-800">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="text-xl font-bold flex justify-between mt-4 border-t pt-4">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </>
      )}

      <button
        onClick={openCheckout}
        disabled={isCheckoutDisabled}
        className="mt-6 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        Checkout
      </button>
    </div>
  );
};
export default Cart;
