import React, { useEffect, useState } from "react";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";

interface TestPaneProps {
  yTestCases: Y.Text;
  awareness: Awareness;
}

const defaultTestInput = `1 2 3`;

const TestPane: React.FC<TestPaneProps> = ({ yTestCases }) => {
  const [value, setValue] = useState(yTestCases.toString());

  useEffect(() => {
    const observer = () => setValue(yTestCases.toString());
    yTestCases.observe(observer);

    if (yTestCases.length === 0) {
      yTestCases.insert(0, defaultTestInput);
    }

    return () => yTestCases.unobserve(observer);
  }, [yTestCases]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    yTestCases.delete(0, yTestCases.length);
    yTestCases.insert(0, e.target.value);
  };

  return (
    <div
      className="
        p-4 h-full overflow-y-auto
        bg-white dark:bg-[#101010]
        text-gray-800 dark:text-gray-200
      "
    >
      <h2 className="text-lg font-semibold mb-3">Custom Input</h2>

      <textarea
        value={value}
        onChange={handleChange}
        className="
          w-full 
          min-h-[200px]
          p-3 
          rounded-md 
          resize-y
          bg-white dark:bg-[#181818]
          text-gray-800 dark:text-gray-200
          border border-gray-300 dark:border-gray-700
          focus:outline-none 
          focus:ring-2 focus:ring-yellow-400
        "
      />

      <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
        Provide custom input for testing your solution.
      </p>
    </div>
  );
};

export default TestPane;
