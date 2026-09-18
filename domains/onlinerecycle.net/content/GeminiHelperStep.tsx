
import React, { useState, useCallback } from 'react';
import { getGeminiAssistance } from '../services/geminiService';
import { GroundingChunk } from '../types';

const GeminiHelperStep: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [response, setResponse] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingChunk[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      setError("Please enter a question.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setSources(undefined);

    try {
      const result = await getGeminiAssistance(query);
      setResponse(result.text);
      setSources(result.sources);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  return (
    <div>
      <p className="mb-4 text-lg">
        Have specific questions about setting up your NAS or web server for <strong>OnlineRecycle.Net</strong>? Or encountered an issue not covered? Ask our AI assistant for guidance!
      </p>
      <p className="mb-6 text-sm text-slate-600">
        This tool uses Google's Gemini model to provide helpful information. Please be specific with your questions for the best results. For example: "How do I check Apache error logs on Ubuntu?" or "What are common reasons for a 500 internal server error?"
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="geminiQuery" className="block text-sm font-medium text-slate-700 mb-1">
            Your Question:
          </label>
          <input
            type="text"
            id="geminiQuery"
            value={query}
            onChange={handleInputChange}
            placeholder="e.g., How to increase PHP upload limit?"
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Asking AI...
            </>
          ) : (
            'Get AI Assistance'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {response && (
        <div className="mt-8 p-6 bg-slate-50 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-emerald-700 mb-3">AI Assistant's Response:</h3>
          <div 
            className="prose prose-emerald max-w-none prose-sm" 
            dangerouslySetInnerHTML={{ __html: response.replace(/\n/g, '<br />') }} // Basic formatting for newlines
          />
          {sources && sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200">
              <h4 className="text-md font-semibold text-slate-600 mb-2">Sources:</h4>
              <ul className="list-disc list-inside space-y-1">
                {sources.map((source, index) => (
                  <li key={index} className="text-sm">
                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 hover:underline">
                      {source.web.title || source.web.uri}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
       {!process.env.API_KEY && (
         <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-md">
           <p><strong>Note:</strong> The Gemini API key is not configured in this environment. AI assistance is currently unavailable. Please ensure the <code>API_KEY</code> environment variable is set.</p>
         </div>
       )}
    </div>
  );
};

export default GeminiHelperStep;