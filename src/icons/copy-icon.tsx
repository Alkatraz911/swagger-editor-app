import { useState, type MouseEvent } from "react";
export function CopyIcon({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
    navigator.clipboard.writeText(text);
  };
  return (
    <div
      className="cursor-pointer ml-auto mr-0 hover:scale-120 transition-all duration-200 relative"
      onClick={handleCopy}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.995 5.006L7 0h5.005v13.996H2V5.011l4.995-.005zM5.998 3.99V.98L2.996 3.989h3.002zM13.002 2H14v14H4v-1.001h9.002V2z"
          fill="#000000cc"
        ></path>
      </svg>
      {isCopied && (
        <span className="z-50 text-[10px] bg-black text-white dark:text-gray-400 absolute top-[-3px] left-[-55px] bg-black dark:bg-white rounded-md px-2 py-1 shadow-md z-10">
          Copied
        </span>
      )}
    </div>
  );
}
