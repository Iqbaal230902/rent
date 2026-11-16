import { useId } from "react";
import { CATEGORIES, type Category } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Ilustrasi sepeda berwarna per kategori (dipakai bila model belum punya foto). */
export function BikeArt({
  category,
  className,
  withBackdrop = true,
}: {
  category: Category;
  className?: string;
  withBackdrop?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const c = CATEGORIES[category];
  const small = category === "FOLDING";
  const r = small ? 27 : 36;
  const wy = small ? 120 : 112;
  const rear = { x: small ? 72 : 62, y: wy };
  const front = { x: small ? 170 : 180, y: wy };
  const bb = { x: 118, y: small ? 116 : 112 };
  const seat = { x: 104, y: small ? 74 : 64 };
  const head = { x: small ? 158 : 164, y: small ? 70 : 64 };
  const tire = category === "MTB" ? 7 : category === "ROAD" ? 3.5 : 5;

  return (
    <svg viewBox="0 0 240 160" className={cn("h-full w-full", className)} role="img" aria-label={`Ilustrasi ${c.label}`}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.from} />
          <stop offset="1" stopColor={c.to} />
        </linearGradient>
        <radialGradient id={`b${id}`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={c.to} stopOpacity=".35" />
          <stop offset="1" stopColor={c.from} stopOpacity="0" />
        </radialGradient>
      </defs>
      {withBackdrop && (
        <>
          <circle cx="120" cy="86" r="78" fill={`url(#b${id})`} />
          <circle cx="36" cy="34" r="5" fill={c.from} opacity=".7" />
          <circle cx="208" cy="28" r="3.5" fill={c.to} />
          <rect x="196" y="128" width="9" height="9" rx="2" fill="#b8f94a" transform="rotate(18 200 132)" />
          <path d="M24 120 l8 -8" stroke="#160f2e" strokeWidth="2.5" strokeLinecap="round" opacity=".25" />
        </>
      )}
      {/* roda */}
      {[rear, front].map((w, i) => (
        <g key={i}>
          <circle cx={w.x} cy={w.y} r={r} fill="none" stroke="#160f2e" strokeWidth={tire} />
          <circle cx={w.x} cy={w.y} r={r - tire - 2} fill="none" stroke="#160f2e" strokeOpacity=".15" strokeWidth="1.5" />
          <circle cx={w.x} cy={w.y} r="3.5" fill="#160f2e" />
        </g>
      ))}
      {/* rangka */}
      <g stroke={`url(#g${id})`} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={`M${rear.x} ${rear.y} L${bb.x} ${bb.y} L${seat.x} ${seat.y} Z`} />
        <path d={`M${seat.x} ${seat.y} L${head.x} ${head.y} L${bb.x} ${bb.y}`} />
        {category === "MTB" ? (
          <path d={`M${head.x} ${head.y} L${front.x - 4} ${front.y - 22}`} />
        ) : (
          <path d={`M${head.x} ${head.y} L${front.x} ${front.y}`} />
        )}
      </g>
      {category === "MTB" && (
        <path
          d={`M${front.x - 4} ${front.y - 24} L${front.x} ${front.y}`}
          stroke="#160f2e"
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}
      {category === "EBIKE" && (
        <g>
          <rect
            x={bb.x + 8}
            y={bb.y - 34}
            width="30"
            height="12"
            rx="4"
            fill="#160f2e"
            transform={`rotate(-50 ${bb.x + 8} ${bb.y - 22})`}
          />
          <path d="M138 70 l-6 10 h6 l-5 10" stroke="#b8f94a" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {/* sadel & stang */}
      <path d={`M${seat.x} ${seat.y} L${seat.x - 4} ${seat.y - 12}`} stroke="#160f2e" strokeWidth="4" strokeLinecap="round" />
      <path d={`M${seat.x - 16} ${seat.y - 14} h22`} stroke="#160f2e" strokeWidth="6" strokeLinecap="round" />
      <path d={`M${head.x} ${head.y} L${head.x - 3} ${head.y - 14}`} stroke="#160f2e" strokeWidth="4" strokeLinecap="round" />
      {category === "ROAD" ? (
        <path
          d={`M${head.x - 3} ${head.y - 14} h12 q8 0 8 9 q0 7 -7 7`}
          stroke="#160f2e"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <path d={`M${head.x - 12} ${head.y - 16} h20`} stroke="#160f2e" strokeWidth="5" strokeLinecap="round" />
      )}
      {/* crank */}
      <circle cx={bb.x} cy={bb.y} r="7" fill="white" stroke="#160f2e" strokeWidth="3" />
      <path d={`M${bb.x} ${bb.y} l9 9`} stroke="#160f2e" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function BikeVisual({
  category,
  photos,
  name,
  className,
}: {
  category: Category;
  photos: unknown;
  name: string;
  className?: string;
}) {
  const first = Array.isArray(photos) && typeof photos[0] === "string" ? (photos[0] as string) : null;
  if (first) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={first} alt={name} className={cn("h-full w-full object-cover", className)} />;
  }
  return <BikeArt category={category} className={className} />;
}
