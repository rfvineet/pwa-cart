import React from "react";
import { CartItem } from "../types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cartItems: CartItem[];
  username: string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  cartItems,
  username,
}) => {
  // If the 'isOpen' prop is false, the component renders nothing.
  if (!isOpen) {
    return null;
  }

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    // Modal Overlay: A fixed-position div that covers the entire screen.
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {/* Modal Content: The white box in the middle. */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Confirm Order</h2>
        <p className="mb-2">
          <strong>Customer:</strong> {username}
        </p>

        {/* Order Summary: A scrollable list of items. */}
        <div className="max-h-60 overflow-y-auto border-t border-b py-2 my-2">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center py-1"
            >
              <span>
                {item.name}{" "}
                <span className="text-gray-500">x{item.quantity}</span>
              </span>
              <span className="font-semibold">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Total Price */}
        <div className="text-xl font-bold flex justify-between mt-4">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
