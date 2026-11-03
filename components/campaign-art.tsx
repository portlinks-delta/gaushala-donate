import { cn } from "@/lib/utils";

export function CampaignArt({
  variant = "meadow",
  image,
  className,
}: {
  variant?: string;
  image?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("relative isolate overflow-hidden bg-[#e8eee0]", className)}
    >
      {image ? (
        <img
          src={image}
          alt="Campaign banner"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 800 460"
          className="absolute inset-0 size-full object-cover"
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label="Illustration of a cow resting in a peaceful green meadow"
        >
          <defs>
            <linearGradient id={`sky-${variant}`} x2="0" y2="1">
              <stop
                stopColor={
                  variant === "sunrise"
                    ? "#f4d9ad"
                    : variant === "shelter"
                      ? "#dae1cf"
                      : "#e5e9d7"
                }
              />
              <stop offset="1" stopColor="#f4efd9" />
            </linearGradient>
          </defs>
          <path fill={`url(#sky-${variant})`} d="M0 0h800v460H0z" />
          <circle cx="610" cy="112" r="52" fill="#f2c879" opacity=".7" />
          <path d="M0 253Q150 170 330 252T800 217V460H0" fill="#a8b994" />
          <path d="M0 312Q230 216 440 312T800 289V460H0" fill="#728e6b" />
          <path d="M0 388Q200 325 400 375T800 340V460H0" fill="#526f52" />
          <g fill="#365942">
            <path d="M70 285V95h12v190z" />
            <path d="M76 52C-20 74-15 215 77 222c104-4 103-141-1-170" />
            <path d="M750 284V105h10v179z" />
            <path d="M755 72c-72 7-81 130 0 142 83-3 75-126 0-142" />
          </g>
          <g transform="translate(280 176)">
            <ellipse
              cx="129"
              cy="210"
              rx="150"
              ry="19"
              fill="#36513d"
              opacity=".22"
            />
            <path
              d="M40 100Q34 62 86 55l104 4q44 4 40 48l-5 73h-22l-7-60H83l-10 60H49z"
              fill="#f6f1df"
            />
            <path d="m188 67 18-44 51 5 16 47-19 42-43-5z" fill="#f9f5e9" />
            <path
              d="m209 34-22-8-13 11 29 17m48-19 28-9 15 11-31 17"
              fill="#e8dbbe"
            />
            <path
              d="M211 26q-18-21-7-34l15 25m27 11q21-18 14-34l-19 22"
              fill="#77624b"
            />
            <ellipse cx="238" cy="90" rx="26" ry="16" fill="#d1b995" />
            <circle cx="221" cy="60" r="3.5" fill="#403c2d" />
            <circle cx="255" cy="60" r="3.5" fill="#403c2d" />
            <path d="M238 37v35" stroke="#d5ad61" strokeWidth="4" />
            <path d="m207 103 45 6" stroke="#bf7b32" strokeWidth="5" />
            <circle cx="228" cy="122" r="7" fill="#c5933e" />
            <path
              d="M43 77Q8 66 17 121"
              fill="none"
              stroke="#f6f1df"
              strokeWidth="7"
            />
            <path d="m17 117-7 20h14z" fill="#796e53" />
            <path d="M91 60q15 40 50 19t47-18" fill="#ded8c3" opacity=".55" />
            <path d="M51 178h21m131 0h22" stroke="#7c735b" strokeWidth="7" />
          </g>
          <g stroke="#bdc89f" strokeWidth="3" strokeLinecap="round">
            <path d="m100 403 5-18m0 18 10-12m555 16 5-20m0 20 10-12M208 349l-5-17m5 17 8-12" />
          </g>
        </svg>
      )}
    </div>
  );
}
