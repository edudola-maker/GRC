/** Icônes nav monochromes (stroke) — même style que InfoIcon. */

type IconProps = { className?: string; size?: number };

function Svg({
  size = 18,
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      {children}
    </svg>
  );
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconHome(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" {...stroke} />
    </Svg>
  );
}

export function IconUnit(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 20V8l8-4 8 4v12" {...stroke} />
      <path d="M9 20v-6h6v6" {...stroke} />
    </Svg>
  );
}

export function IconDashboard(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" {...stroke} />
      <rect x="13" y="4" width="7" height="4" rx="1.5" {...stroke} />
      <rect x="13" y="10" width="7" height="10" rx="1.5" {...stroke} />
      <rect x="4" y="13" width="7" height="7" rx="1.5" {...stroke} />
    </Svg>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="4" width="16" height="16" rx="2" {...stroke} />
      <path d="m8 12 2.5 2.5L16 9" {...stroke} />
    </Svg>
  );
}

export function IconProject(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="5" width="16" height="14" rx="2" {...stroke} />
      <path d="M4 9h16M9 5v14" {...stroke} />
    </Svg>
  );
}

export function IconMission(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8" {...stroke} />
      <circle cx="12" cy="12" r="3" {...stroke} />
    </Svg>
  );
}

export function IconConseil(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4H7.5A2.5 2.5 0 0 1 5 12.5v-6Z"
        {...stroke}
      />
    </Svg>
  );
}

export function IconProcessus(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 7h10v4H7V7ZM7 13h6v4H7v-4Z" {...stroke} />
      <path d="M17 15h3M4 9h3M13 15h2" {...stroke} />
    </Svg>
  );
}

export function IconAsset(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="5" y="4" width="14" height="16" rx="2" {...stroke} />
      <path d="M9 8h6M9 12h6M9 16h4" {...stroke} />
    </Svg>
  );
}

export function IconList(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" {...stroke} />
    </Svg>
  );
}

export function IconRisk(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 4 21 19H3L12 4Z" {...stroke} />
      <path d="M12 10v4M12 16.5v.5" {...stroke} />
    </Svg>
  );
}

export function IconDocument(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" {...stroke} />
      <path d="M14 3.5V9h5.5" {...stroke} />
    </Svg>
  );
}

export function IconUsers(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="8" r="3" {...stroke} />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" {...stroke} />
      <circle cx="17" cy="9" r="2.5" {...stroke} />
      <path d="M15 19a4.5 4.5 0 0 1 5.5-4.2" {...stroke} />
    </Svg>
  );
}

export function IconRoles(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3 19 7v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4Z" {...stroke} />
    </Svg>
  );
}

export function IconMenu(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" {...stroke} />
    </Svg>
  );
}

export function IconClose(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6 6 18" {...stroke} />
    </Svg>
  );
}

export function IconChevronLeft(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M14.5 6 9 12l5.5 6" {...stroke} />
    </Svg>
  );
}

export function IconChevronRight(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9.5 6 15 12l-5.5 6" {...stroke} />
    </Svg>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="6.5" {...stroke} />
      <path d="M16 16l4 4" {...stroke} />
    </Svg>
  );
}

export function IconGuide(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5V5.5Z" {...stroke} />
      <path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H19" {...stroke} />
    </Svg>
  );
}

export type NavIconName =
  | "home"
  | "unit"
  | "dashboard"
  | "check"
  | "project"
  | "mission"
  | "conseil"
  | "processus"
  | "asset"
  | "list"
  | "risk"
  | "document"
  | "users"
  | "roles"
  | "search"
  | "guide";

export function NavIcon({
  name,
  ...props
}: IconProps & { name: NavIconName }) {
  switch (name) {
    case "home":
      return <IconHome {...props} />;
    case "unit":
      return <IconUnit {...props} />;
    case "dashboard":
      return <IconDashboard {...props} />;
    case "check":
      return <IconCheck {...props} />;
    case "project":
      return <IconProject {...props} />;
    case "mission":
      return <IconMission {...props} />;
    case "conseil":
      return <IconConseil {...props} />;
    case "processus":
      return <IconProcessus {...props} />;
    case "asset":
      return <IconAsset {...props} />;
    case "list":
      return <IconList {...props} />;
    case "risk":
      return <IconRisk {...props} />;
    case "document":
      return <IconDocument {...props} />;
    case "users":
      return <IconUsers {...props} />;
    case "roles":
      return <IconRoles {...props} />;
    case "search":
      return <IconSearch {...props} />;
    case "guide":
      return <IconGuide {...props} />;
    default:
      return null;
  }
}
