
import React from 'react';

interface URLInputFormProps {
  url: string;
  setUrl: (url: string) => void;
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const URLInputForm: React.FC<URLInputFormProps> = ({ url, setUrl, onSubmit, isLoading }) => {

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(url);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 bg-gray-800/50 p-3 rounded-xl border border-gray-700 shadow-lg backdrop-blur-sm">
      <div className="flex-grow w-full flex items-center bg-gray-800 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 transition-shadow duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          disabled={isLoading}
          className="w-full p-3 pl-2 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? 'Analyzing...' : 'Check Safety'}
      </button>
    </form>
  );
};
