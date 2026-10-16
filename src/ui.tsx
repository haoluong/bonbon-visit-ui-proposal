import type { CSSProperties, ReactNode } from "react";
import { theme as t } from "./theme";

type Align = "start" | "center" | "end" | "stretch";

const flexAlign = (a?: Align) => (a === "start" ? "flex-start" : a === "end" ? "flex-end" : a);

export function Stack({ children, gap = 0, style }: { children?: ReactNode; gap?: number; style?: CSSProperties }) {
  return <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>{children}</div>;
}

export function Row({
  children,
  gap = 0,
  align,
  justify,
  wrap,
  style,
}: {
  children?: ReactNode;
  gap?: number;
  align?: Align;
  justify?: "start" | "center" | "end" | "space-between";
  wrap?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap,
        alignItems: flexAlign(align),
        justifyContent: justify === "start" ? "flex-start" : justify === "end" ? "flex-end" : justify,
        flexWrap: wrap ? "wrap" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Grid({
  children,
  columns,
  gap = 0,
  align,
  className,
  style,
}: {
  children?: ReactNode;
  columns: number | string;
  gap?: number;
  align?: Align;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: typeof columns === "number" ? `repeat(${columns}, minmax(0, 1fr))` : columns,
        gap,
        alignItems: align,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Text({
  children,
  tone = "primary",
  size = "body",
  weight = "normal",
  italic,
  style,
}: {
  children?: ReactNode;
  tone?: "primary" | "secondary" | "tertiary" | "quaternary";
  size?: "body" | "small";
  weight?: "normal" | "medium" | "semibold" | "bold";
  italic?: boolean;
  style?: CSSProperties;
}) {
  const fontWeight = { normal: 400, medium: 500, semibold: 600, bold: 700 }[weight];
  return (
    <p
      style={{
        margin: 0,
        color: t.text[tone],
        fontSize: size === "small" ? 13 : 15,
        lineHeight: size === "small" ? "19px" : "23px",
        fontWeight,
        fontStyle: italic ? "italic" : undefined,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function H1({ children }: { children?: ReactNode }) {
  return <h1 style={{ margin: 0, fontSize: 26, lineHeight: "32px", fontWeight: 650, color: t.text.primary }}>{children}</h1>;
}

export function H2({ children }: { children?: ReactNode }) {
  return <h2 style={{ margin: 0, fontSize: 19, lineHeight: "26px", fontWeight: 650, color: t.text.primary }}>{children}</h2>;
}

export function Divider() {
  return <hr style={{ border: 0, borderTop: `1px solid ${t.stroke.tertiary}`, margin: 0 }} />;
}

export function Pill({
  children,
  active,
  disabled,
  onClick,
}: {
  children?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        font: "inherit",
        fontSize: 13,
        lineHeight: "18px",
        padding: "5px 12px",
        borderRadius: 9999,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        color: active ? t.text.onAccent : t.text.primary,
        background: active ? t.text.primary : "transparent",
        border: `1px solid ${active ? t.text.primary : t.stroke.secondary}`,
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}

export function Callout({ title, children }: { title?: ReactNode; children?: ReactNode }) {
  return (
    <div style={{ background: t.callout.neutral, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
      {title && <div style={{ fontSize: 13, fontWeight: 650, color: t.text.primary }}>{title}</div>}
      {children}
    </div>
  );
}

export function Table({ headers, rows }: { headers: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div style={{ border: `1px solid ${t.stroke.secondary}`, borderRadius: 10, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: "left",
                  padding: "9px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: t.text.tertiary,
                  borderBottom: `1px solid ${t.stroke.secondary}`,
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 12px",
                    verticalAlign: "top",
                    borderTop: i === 0 ? "none" : `1px solid ${t.stroke.tertiary}`,
                  }}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
