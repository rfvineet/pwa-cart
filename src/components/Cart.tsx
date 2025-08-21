import React from "react";
import { CartItem } from "../types";
import { generateBillPDF } from "../utils/pdfGenerator";

interface CartProps {
  cartItems: CartItem[];
  clearCart: () => void;
}

const Cart: React.FC<CartProps> = ({ cartItems, clearCart }) => {
  const handleGenerateBill = () => {
    if (cartItems.length === 0) return alert("Your cart is empty!");
    generateBillPDF(cartItems);
  };
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-4">Shopping Cart 🛒</h2>
      <button
        onClick={clearCart}
        disabled={cartItems.length === 0}
        className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors border-2 rounded-2xl p-1"
      >
        CLEAR THE CART
      </button>
      {cartItems.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {cartItems.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center border-b pb-2"
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
          <div className="text-xl font-bold flex justify-between mt-4">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </>
      )}
      <button
        onClick={handleGenerateBill}
        className="mt-6 w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400"
        disabled={cartItems.length === 0}
      >
        {" "}
        Generate PDF Bill{" "}
      </button>
    </div>
  );
};
export default Cart;
