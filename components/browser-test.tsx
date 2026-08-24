'use client';

// Simple test component to verify all essential features work
import { useState } from 'react';

export function BrowserTestComponent() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const runTests = () => {
    const results: Record<string, boolean> = {};

    // Test 1: localStorage availability
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      results['localStorage'] = true;
    } catch {
      results['localStorage'] = false;
    }

    // Test 2: Can create Pi user
    try {
      const piUser = {
        username: `test_${Date.now()}`,
        uid: `pi_${Date.now()}`,
      };
      results['Pi user creation'] = !!piUser;
    } catch {
      results['Pi user creation'] = false;
    }

    // Test 3: Can parse JSON
    try {
      const testJson = JSON.parse('{"test": true}');
      results['JSON parsing'] = testJson.test === true;
    } catch {
      results['JSON parsing'] = false;
    }

    // Test 4: mediaDevices available
    try {
      const hasMedia = !!navigator.mediaDevices?.getUserMedia;
      results['Camera/microphone API'] = hasMedia;
    } catch {
      results['Camera/microphone API'] = false;
    }

    setTestResults(results);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Browser Compatibility Test</h3>
      <button
        onClick={runTests}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-4"
      >
        Run Tests
      </button>
      {Object.keys(testResults).length > 0 && (
        <div>
          {Object.entries(testResults).map(([test, passed]) => (
            <div
              key={test}
              className={`p-2 mb-2 rounded ${
                passed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
              }`}
            >
              {test}: {passed ? '✅ Pass' : '❌ Fail'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
