import React from "react";
import { Book } from "../types";

interface BookListProps {
  books: Book[];
  addToCart: (book: Book) => void;
  isLoading: boolean;
}

const BookList: React.FC<BookListProps> = ({ books, addToCart, isLoading }) => {
  if (isLoading && books.length === 0)
    return <p className="text-center text-gray-500">Loading books...</p>;
  if (books.length === 0)
    return <p className="text-center text-gray-500">No books found.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {books.map((book) => (
        <div
          key={book.id}
          className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between"
        >
          <div>
            <h3 className="text-xl font-bold">{book.name}</h3>
            <p className="text-gray-600 mb-2">by {book.author}</p>
            <p className="text-2xl font-light text-gray-800">
              ${book.price.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => addToCart(book)}
            className="mt-4 w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {" "}
            Add to Cart{" "}
          </button>
        </div>
      ))}
    </div>
  );
};
export default BookList;
