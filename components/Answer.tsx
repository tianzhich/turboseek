import Image from "next/image";
import { Toaster, toast } from "react-hot-toast";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeExternalLinks from "rehype-external-links";

export default function Answer({ answer }: { answer: string }) {
  return (
    <div className="container flex h-auto w-full shrink-0 gap-4 rounded-lg border border-solid border-[#C2C2C2] bg-white p-5 lg:p-10">
      <div className="hidden lg:block">
        <Image
          unoptimized
          src="/img/Info.svg"
          alt="footer"
          width={24}
          height={24}
        />
      </div>
      <div className="w-full">
        <div className="flex items-center justify-between pb-3">
          <div className="flex gap-4">
            <Image
              unoptimized
              src="/img/Info.svg"
              alt="footer"
              width={24}
              height={24}
              className="block lg:hidden"
            />
            <h3 className="text-base font-bold uppercase text-black">
              Answer:{" "}
            </h3>
          </div>
          {answer && (
            <div className="flex items-center gap-3">
              {/* <Image unoptimized
                src="/img/link.svg"
                alt="footer"
                width={20}
                height={20}
                className="cursor-pointer"
              /> */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(answer.trim());
                  toast("Answer copied to clipboard", {
                    icon: "✂️",
                  });
                }}
              >
                <Image
                  unoptimized
                  src="/img/copy.svg"
                  alt="footer"
                  width={20}
                  height={20}
                  className="cursor-pointer"
                />
              </button>
              {/* <Image unoptimized
                src="/img/share.svg"
                alt="footer"
                width={20}
                height={20}
                className="cursor-pointer"
              /> */}
            </div>
          )}
        </div>
        <div className="flex flex-wrap content-center items-center gap-[15px]">
          <div className="markdown-container prose w-full text-base font-light leading-[152.5%] text-black">
            {answer ? (
              <Markdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[
                  rehypeKatex,
                  rehypeRaw,
                  [
                    rehypeExternalLinks,
                    { target: "_blank", rel: "noopener noreferrer" },
                  ],
                ]}
              >
                {answer.trim()}
              </Markdown>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{ duration: 2000 }}
      />
    </div>
  );
}
