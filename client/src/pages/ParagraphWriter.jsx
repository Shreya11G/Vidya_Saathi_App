import React, { useState } from 'react';
import { FileText, Copy, RotateCcw } from 'lucide-react';

// Paragraph Writer Component
//Independent component that analyzes text input and provides statistics
//Features: Line count, word count, character count with real-time updates
 

const ParagraphWriter = () => {
  // State to store the user's input text
  const [text, setText] = useState('');
  
  // State to store calculated text statistics
  const [stats, setStats] = useState({
    lines: 0,
    words: 0,
    characters: 0,
    charactersWithSpaces: 0
  });

  
    // Calculate text statistics from input
    // Counts lines, words, characters (with and without spaces)
    // @param inputText - The text to analyze
    // @returns Object with all counts
   
  const calculateStats = (inputText) => {
    // Count lines by splitting on line breaks and filtering empty lines
    const lines = inputText.split('\n').filter(line => line.trim() !== '').length;
    
    // Count words by splitting on whitespace and filtering empty strings
    const words = inputText.trim() === '' ? 0 : inputText.trim().split(/\s+/).length;
    
    // Count characters without spaces
    const characters = inputText.replace(/\s/g, '').length;
    
    // Count characters including spaces
    const charactersWithSpaces = inputText.length;

    return {
      lines,
      words,
      characters,
      charactersWithSpaces
    };
  };

  /**
   * Handle text input changes
   * Updates both the text state and recalculates statistics
   */
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    // Recalculate statistics whenever text changes
    const newStats = calculateStats(newText);
    setStats(newStats);
  };

  /**
   * Clear all text and reset statistics
   */
  const handleClear = () => {
    setText('');
    setStats({
      lines: 0,
      words: 0,
      characters: 0,
      charactersWithSpaces: 0
    });
  };

  /**
   * Copy text to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Text copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy text:', error);
      alert('Failed to copy text to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Paragraph Writer
          </h1>
          <p className="text-[var(--text-secondary)]">
            Analyze your text with real-time statistics
          </p>
        </div>
        
        {/* Header Icon */}
        <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Text Input Section */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Text Input
              </h2>
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                {text && (
                  <button
                    onClick={handleCopy}
                    className="p-2  text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Copy text"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
                
                {text && (
                  <button
                    onClick={handleClear}
                    className="p-2 text-[var(--text-secondary)]  hover:text-red-400 transition-colors"
                    title="Clear text"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Text Area Input */}
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Paste or type your paragraph here..."
              className="w-full h-96 p-4 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-secondary)] placeholder-gray-400 resize-none"
              style={{ fontFamily: 'monospace' }}
            />
            
            <div className="mt-2 text-right">
              <span className="text-xs text-[var(--text-secondary)]">
                {stats.charactersWithSpaces} characters
              </span>
            </div>
          </div>
        </div>

        {/* Statistics Panel */}
        <div className="space-y-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Text Statistics
            </h2>

            <div className="space-y-4">
              <div className="bg-blue-50  rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700 ">
                    Lines
                  </span>
                  <span className="text-2xl font-bold text-blue-600 ">
                    {stats.lines}
                  </span>
                </div>
                <p className="text-xs text-blue-600  mt-1">
                  Non-empty lines
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700 ">
                    Words
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {stats.words}
                  </span>
                </div>
                <p className="text-xs text-green-600  mt-1">
                  Space-separated words
                </p>
              </div>

              <div className="bg-purple-50  rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-700 ">
                    Characters
                  </span>
                  <span className="text-2xl font-bold text-purple-600 ">
                    {stats.characters}
                  </span>
                </div>
                <p className="text-xs text-purple-600 ">
                  Excluding spaces
                </p>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-700 ">
                    With Spaces
                  </span>
                  <span className="text-2xl font-bold text-orange-600 ">
                    {stats.charactersWithSpaces}
                  </span>
                </div>
                <p className="text-xs text-orange-600  mt-1">
                  Including spaces
                </p>
              </div>
            </div>

            {text && (
              <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Quick Analysis
                </h3>
                <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <div className="flex justify-between">
                    <span>Avg words/line:</span>
                    <span>{stats.lines > 0 ? Math.round((stats.words / stats.lines) * 10) / 10 : 0}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Avg chars/word:</span>
                    <span>{stats.words > 0 ? Math.round((stats.characters / stats.words) * 10) / 10 : 0}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Reading time:</span>
                    <span>{Math.ceil(stats.words / 200)} min</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
              💡 Tips
            </h3>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1">
              <li>• Paste text from any source</li>
              <li>• Statistics update in real-time</li>
              <li>• Use copy button to save your work</li>
              <li>• Empty lines are not counted</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParagraphWriter;
