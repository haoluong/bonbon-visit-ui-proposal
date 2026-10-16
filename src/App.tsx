import { useState, type CSSProperties, type ReactNode } from "react";
import { theme as t } from "./theme";
import { Callout, Divider, Grid, H1, H2, Pill, Row, Stack, Table, Text } from "./ui";

type StateId = "requested" | "confirmed" | "late" | "in_progress" | "ready" | "completed" | "no_show";
type Tab = "active" | "past";
type Tone = "wait" | "info" | "late" | "ready" | "done" | "closed";

interface VisitState {
  label: string;
  chip: string;
  tone: Tone;
  tab: Tab;
  when: string;
  step: number;
  walkIn: boolean;
  today: string;
}

interface Detail {
  headline: string;
  sub: string;
  qr: boolean;
  actions: { label: string; primary?: boolean }[];
  note?: string;
}

interface VisitRow {
  key: string;
  garage: string;
  plate: string;
  service: string;
  when: string;
  chip: string;
  tone: Tone;
  code: string;
  tab: Tab;
  focus?: boolean;
  action?: string;
  quick?: string[];
  steps?: { total: number; at: number; label: string };
}

const shot = (file: string) => `${import.meta.env.BASE_URL}screenshots/${file}`;

const GALLERY: { file: string; caption: string }[] = [
  { file: "1-home.png", caption: "1. Home: two history shortcuts; the carousel shows orders only" },
  { file: "2-my-bookings-upcoming.png", caption: "2. Lịch của tôi › Sắp tới" },
  { file: "3-my-bookings-past.png", caption: "3. Lịch của tôi › Đã qua: “Hoàn thành” while the car is still at the garage" },
  { file: "4-booking-detail-fulfilled.png", caption: "4. Checked-in booking: QR still shown, no link to the order" },
  { file: "5-booking-detail-late.png", caption: "5. 15 minutes late: “Đã xác nhận” and “Lịch đã kết thúc” together" },
  { file: "6-orders.png", caption: "6. Lịch sử đơn hàng: a second list with different words" },
  { file: "7-order-detail.png", caption: "7. Order detail: a second code (“Mã yêu cầu”)" },
];

const STATE_ORDER: StateId[] = ["requested", "confirmed", "late", "in_progress", "ready", "completed", "no_show"];

const STATES: Record<StateId, VisitState> = {
  requested: {
    label: "Chờ xác nhận",
    chip: "Chờ xác nhận",
    tone: "wait",
    tab: "active",
    when: "Hôm nay 09:00 · gara phản hồi trong 12 phút",
    step: 0,
    walkIn: false,
    today: "The request is only visible inside “Lịch của tôi”. Home stays empty until the garage has the car.",
  },
  confirmed: {
    label: "Đã xác nhận",
    chip: "Đã xác nhận",
    tone: "info",
    tab: "active",
    when: "Hôm nay 09:00",
    step: 1,
    walkIn: false,
    today: "The QR is three taps away: Home, then “Lịch của tôi”, then the booking. The proposed Home card has a “Mã QR” button.",
  },
  late: {
    label: "Đến trễ",
    chip: "Gara đang chờ bạn",
    tone: "late",
    tab: "active",
    when: "Trễ 15 phút · giữ chỗ đến 12:00",
    step: 1,
    walkIn: false,
    today:
      "Today the booking jumps to “Đã qua” and says “Lịch đã kết thúc, không còn hành động nào.” with directions hidden (screenshot 5). The garage can still check the car in for 3 more hours.",
  },
  in_progress: {
    label: "Đang thực hiện",
    chip: "Đang thực hiện",
    tone: "info",
    tab: "active",
    when: "Gara nhận xe lúc 09:20",
    step: 2,
    walkIn: true,
    today:
      "Today the booking says “Hoàn thành” in green (screenshots 3 and 4) while the Home card for the same car says “Đã tiếp nhận” (screenshot 1). Proposed: one word, “Đang thực hiện”, on every screen.",
  },
  ready: {
    label: "Xe đã xong",
    chip: "Xe đã xong",
    tone: "ready",
    tab: "active",
    when: "Mời bạn tới nhận xe · 150.000đ",
    step: 3,
    walkIn: true,
    today: "Today the booking still says “Hoàn thành” and the order says “Đã xong”. Proposed: “Xe đã xong” in green with directions, because the owner has to act.",
  },
  completed: {
    label: "Hoàn thành",
    chip: "Hoàn thành",
    tone: "done",
    tab: "past",
    when: "Hôm nay 10:30 · 150.000đ",
    step: 4,
    walkIn: true,
    today: "Today the same visit is listed twice: in “Lịch của tôi › Đã qua” and in “Lịch sử đơn hàng”. Proposed: one row in “Đã qua” with the review action.",
  },
  no_show: {
    label: "Không đến",
    chip: "Không đến",
    tone: "closed",
    tab: "past",
    when: "Hết giờ giữ chỗ lúc 12:00",
    step: -1,
    walkIn: false,
    today:
      "If staff scanned the plate instead of the booking code, this row sits next to a separate walk-in order for the same car. Screens alone can't fix that: the garage app must offer the booking after a plate scan.",
  },
};

const DETAIL: Record<StateId, Detail> = {
  requested: {
    headline: "Chờ gara xác nhận",
    sub: "Gara sẽ phản hồi trong 12 phút. Bạn chưa cần làm gì thêm.",
    qr: false,
    actions: [{ label: "Huỷ yêu cầu" }],
  },
  confirmed: {
    headline: "Hẹn bạn 09:00 hôm nay",
    sub: "Đưa mã này cho nhân viên khi tới gara.",
    qr: true,
    actions: [{ label: "Gọi gara" }, { label: "Chỉ đường", primary: true }],
    note: "Có thể huỷ lịch trước 08:00",
  },
  late: {
    headline: "Gara vẫn đang chờ bạn",
    sub: "Bạn trễ 15 phút. Gara giữ chỗ đến 12:00.",
    qr: true,
    actions: [{ label: "Gọi gara" }, { label: "Chỉ đường", primary: true }],
  },
  in_progress: {
    headline: "Xe đang được làm",
    sub: "Gara nhận xe lúc 09:20. Bạn sẽ nhận thông báo khi xe xong.",
    qr: false,
    actions: [{ label: "Gọi gara", primary: true }],
  },
  ready: {
    headline: "Xe đã xong, mời bạn tới nhận",
    sub: "Thanh toán tại gara: 150.000đ.",
    qr: false,
    actions: [{ label: "Gọi gara" }, { label: "Chỉ đường", primary: true }],
  },
  completed: {
    headline: "Cảm ơn bạn đã ghé Garage 1",
    sub: "Bạn nhận xe lúc 10:30.",
    qr: false,
    actions: [{ label: "Đánh giá dịch vụ", primary: true }],
  },
  no_show: {
    headline: "Lịch đã hết hạn",
    sub: "Gara không ghi nhận xe tới trước 12:00 nên lịch đã đóng.",
    qr: false,
    actions: [{ label: "Đặt lại", primary: true }],
  },
};

const BOOKED_STEPS = ["Đặt lịch", "Gara xác nhận", "Nhận xe", "Xe đã xong", "Hoàn thành"];
const WALKIN_STEPS = BOOKED_STEPS.slice(2);
const BOOKING_CODE = "K7Q-2M9-XPLA";
const ORDER_CODE = "#4F2A9C";

const OTHER_ROWS: VisitRow[] = [
  {
    key: "tomorrow",
    garage: "Garage Bến Thành",
    plate: "51K-123.45",
    service: "Rửa xe",
    when: "Ngày mai 09:00",
    chip: "Đã xác nhận",
    tone: "info",
    code: "Đặt lịch · H2X-7KC-9MWE",
    tab: "active",
    quick: ["Mã QR", "Chỉ đường"],
    steps: { total: 5, at: 1, label: "Gara xác nhận" },
  },
  {
    key: "walkin-past",
    garage: "Garage 2",
    plate: "51K-100.00",
    service: "Rửa xe cơ bản",
    when: "13/10 · 160.000đ",
    chip: "Hoàn thành",
    tone: "done",
    code: "Tại gara · #9F3A1C",
    tab: "past",
    action: "Đánh giá",
  },
  {
    key: "noshow-past",
    garage: "Garage 2",
    plate: "51K-123.45",
    service: "Rửa xe",
    when: "11/10 16:00",
    chip: "Không đến",
    tone: "closed",
    code: "Đặt lịch · R8T-3QZ-6YBN",
    tab: "past",
    action: "Đặt lại",
  },
];

const TODAY_VS_PROPOSED: { screen: string; today: string; proposed: string; shot: string }[] = [
  {
    screen: "Home",
    today:
      "Four shortcuts, two of which open lists (“Lịch sử”, “Lịch của tôi”). The floating “Đặt lịch rửa xe” button repeats “Giữ chỗ”. The carousel only shows orders.",
    proposed: "Three shortcuts: Đặt lịch, Hoạt động, Tìm gara. “Đang diễn ra” lists every live visit, bookings included, one card per visit.",
    shot: "1-home.png",
  },
  {
    screen: "Lịch của tôi › Đã qua",
    today: "A checked-in booking says “Hoàn thành” while the car is being washed. A booking 15 minutes late sits in “Đã qua” with the chip “Đã xác nhận”.",
    proposed: "The checked-in visit says “Đang thực hiện”. A late booking stays in “Đang diễn ra” as “Gara đang chờ bạn” until the hold ends.",
    shot: "3-my-bookings-past.png",
  },
  {
    screen: "Booking detail, checked in",
    today: "“Hoàn thành”, a QR that says “Đưa mã này cho nhân viên khi tới gara”, and “Lịch đã kết thúc”. No way to reach the order.",
    proposed: "The QR disappears after check-in, the progress stepper takes over, and the booking folds into one “Thông tin lịch hẹn” row.",
    shot: "4-booking-detail-fulfilled.png",
  },
  {
    screen: "Booking detail, late",
    today: "“Đã xác nhận” and “Lịch đã kết thúc, không còn hành động nào.” on the same screen. No directions.",
    proposed: "Hold time in the headline, QR still visible, Chỉ đường and Gọi gara.",
    shot: "5-booking-detail-late.png",
  },
  {
    screen: "Lịch sử đơn hàng",
    today: "A second list with its own tabs and words (Đã tiếp nhận / Đã xong / Hoàn thành). Dates are dd/MM/yyyy here and YYYY-MM-DD in bookings.",
    proposed: "Merged into Hoạt động. One date style: Hôm nay, Ngày mai, 13/10. Spending stats can move to the profile.",
    shot: "6-orders.png",
  },
  {
    screen: "Order detail",
    today: "“Mã yêu cầu: #xxxxxx”, a second code for a visit that already has a booking code.",
    proposed: "One code per visit: the booking code for booked visits, the order code only for walk-ins.",
    shot: "7-order-detail.png",
  },
];

const RULES: { title: string; body: string }[] = [
  { title: "One visit, one card", body: "A booked visit is never listed twice. After check-in the same card moves through the steps." },
  { title: "“Hoàn thành” means the car is back", body: "Check-in reads “Đang thực hiện”. Nothing turns green before the owner can drive away." },
  {
    title: "Colour means “you need to act”",
    body: "Orange: the garage is waiting for you. Green: your car is ready. Red: closed with a problem. Finished visits stay neutral, so “Đã qua” is calm.",
  },
  { title: "One code", body: "Booking code for booked visits, order code only for walk-ins. It is the same string on Home, in the list and on the detail." },
  { title: "One date style", body: "Hôm nay, Ngày mai, then dd/MM. No YYYY-MM-DD anywhere the owner looks." },
  { title: "Old links keep working", body: "Bookmarks, pushes and old builds that open /my-booking, /orders or /booking?step=detail redirect to the new screens." },
];

const ROUTES: [string, string][] = [
  ["/my-booking, /my-booking?tab=past", "/activity, /activity?tab=past"],
  ["/orders", "/activity?tab=past"],
  ["/booking?step=detail&bk={id}", "/visit?bk={id}"],
  ["/orders?id={id}", "/visit?order={id} (walk-ins), or redirect to ?bk= when the order has a booking"],
  ["Push links for booking_* and order_*", "/visit for the same visit. The public /status?token= page stays for ZNS outside the mini app"],
  ["Giữ chỗ shortcut and the floating Đặt lịch rửa xe button", "One Đặt lịch shortcut"],
];

const API_NEEDS: [string, string][] = [
  ["state, plus a reason for closed visits (declined, cancelled, expired, no_show)", "Chip and headline"],
  ["checkin_until (slot start + 180-minute grace)", "“Gara giữ chỗ đến 12:00” and keeping the visit in Đang diễn ra"],
  ["cancel_until", "“Có thể huỷ lịch trước 08:00” and whether Huỷ shows at all"],
  ["code and code_kind (booking or order)", "The single code"],
  ["order status with received_at, done_at, delivered_at", "Stepper position and “Gara nhận xe lúc 09:20”"],
  ["can_review", "Đánh giá on the card and the detail"],
];

function toneColor(tone: Tone): string {
  switch (tone) {
    case "wait":
      return t.category.yellow;
    case "info":
      return t.category.blue;
    case "late":
      return t.category.orange;
    case "ready":
      return t.category.green;
    case "closed":
      return t.category.red;
    default:
      return t.text.secondary;
  }
}

function focusRow(id: StateId, walkIn: boolean): VisitRow {
  const s = STATES[id];
  const steps = walkIn ? WALKIN_STEPS : BOOKED_STEPS;
  const at = walkIn ? s.step - 2 : s.step;
  return {
    key: "focus",
    garage: "Garage 1",
    plate: "51K-100.00",
    service: "Rửa xe",
    when: s.when,
    chip: s.chip,
    tone: s.tone,
    code: walkIn ? `Tại gara · ${ORDER_CODE}` : `Đặt lịch · ${BOOKING_CODE}`,
    tab: s.tab,
    focus: true,
    action: id === "completed" ? "Đánh giá" : id === "no_show" ? "Đặt lại" : undefined,
    quick: id === "confirmed" || id === "late" ? ["Mã QR", "Chỉ đường"] : id === "ready" ? ["Chỉ đường"] : undefined,
    steps: s.step >= 0 && s.tab === "active" ? { total: steps.length, at, label: steps[at] } : undefined,
  };
}

function PText({
  children,
  size = 13,
  weight = 400,
  tone = "primary",
  style,
}: {
  children?: ReactNode;
  size?: number;
  weight?: number;
  tone?: "primary" | "secondary" | "tertiary" | "link";
  style?: CSSProperties;
}) {
  const color = tone === "link" ? t.text.link : t.text[tone];
  return (
    <span style={{ display: "block", fontSize: size, lineHeight: `${Math.round(size * 1.35)}px`, fontWeight: weight, color, ...style }}>
      {children}
    </span>
  );
}

function Chip({ tone, children }: { tone: Tone; children?: ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11,
        lineHeight: "16px",
        padding: "2px 8px",
        borderRadius: 9999,
        color: toneColor(tone),
        background: t.fill.tertiary,
        whiteSpace: "nowrap",
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

function PhoneButton({ label, primary, small }: { label: string; primary?: boolean; small?: boolean }) {
  return (
    <div
      style={{
        flex: small ? undefined : 1,
        textAlign: "center",
        fontSize: small ? 12 : 13,
        fontWeight: 600,
        padding: small ? "4px 10px" : "10px 12px",
        borderRadius: small ? 8 : 12,
        color: primary ? t.text.onAccent : t.text.primary,
        background: primary ? t.accent.button : "transparent",
        border: `1px solid ${primary ? t.accent.button : t.stroke.secondary}`,
      }}
    >
      {label}
    </div>
  );
}

function Phone({ title, back, footer, children }: { title: string; back?: boolean; footer?: ReactNode; children?: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 320,
        height: 640,
        border: `1px solid ${t.stroke.primary}`,
        borderRadius: 30,
        background: t.bg.phone,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${t.stroke.tertiary}`, display: "flex", alignItems: "center", gap: 10 }}>
        {back && <span style={{ fontSize: 18, lineHeight: "18px", color: t.text.secondary }}>‹</span>}
        <PText size={16} weight={700}>
          {title}
        </PText>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
      {footer && <div style={{ padding: 12, borderTop: `1px solid ${t.stroke.tertiary}` }}>{footer}</div>}
    </div>
  );
}

function Segments({ total, at }: { total: number; at: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= at ? t.accent.primary : t.fill.secondary }} />
      ))}
    </div>
  );
}

function VisitCard({ row, variant }: { row: VisitRow; variant: "home" | "list" }) {
  return (
    <div
      style={{
        border: `1px solid ${t.stroke.tertiary}`,
        borderRadius: 14,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        background: row.focus ? t.fill.quaternary : "transparent",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <PText weight={600}>{row.garage}</PText>
        <Chip tone={row.tone}>{row.chip}</Chip>
      </div>
      {variant === "home" ? (
        <PText size={16} weight={700}>
          {row.plate}
        </PText>
      ) : (
        <PText size={12} tone="secondary">
          {`${row.plate} · ${row.service}`}
        </PText>
      )}
      <PText size={12} tone="secondary">
        {row.when}
      </PText>
      {variant === "home" && row.steps && (
        <Stack gap={4}>
          <Segments total={row.steps.total} at={row.steps.at} />
          <PText size={11} tone="tertiary">{`Bước ${row.steps.at + 1}/${row.steps.total} · ${row.steps.label}`}</PText>
        </Stack>
      )}
      {variant === "home" && row.quick && (
        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
          {row.quick.map((q, i) => (
            <PhoneButton key={q} label={q} small primary={i === 0} />
          ))}
        </div>
      )}
      {variant === "list" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <PText size={11} tone="tertiary">
            {row.code}
          </PText>
          {row.action && (
            <PText size={12} weight={600} tone="link">
              {row.action}
            </PText>
          )}
        </div>
      )}
    </div>
  );
}

function Icon({ kind }: { kind: "calendar" | "list" | "pin" }) {
  const common = { fill: "none", stroke: t.text.secondary, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={22} height={22} viewBox="0 0 20 20">
      {kind === "calendar" && (
        <g {...common}>
          <rect x={3} y={4} width={14} height={13} rx={2} />
          <path d="M3 8h14M7 2.5v3M13 2.5v3M10 10.5v4M8 12.5h4" />
        </g>
      )}
      {kind === "list" && (
        <g {...common}>
          <path d="M8 5h9M8 10h9M8 15h9" />
          <circle cx={4} cy={5} r={0.8} />
          <circle cx={4} cy={10} r={0.8} />
          <circle cx={4} cy={15} r={0.8} />
        </g>
      )}
      {kind === "pin" && (
        <g {...common}>
          <path d="M10 18s-5.5-5.4-5.5-9.5a5.5 5.5 0 0 1 11 0C15.5 12.6 10 18 10 18z" />
          <circle cx={10} cy={8.5} r={2} />
        </g>
      )}
    </svg>
  );
}

function HomeScreen({ rows, reviewFor }: { rows: VisitRow[]; reviewFor?: string }) {
  const shortcuts: { label: string; icon: "calendar" | "list" | "pin" }[] = [
    { label: "Đặt lịch", icon: "calendar" },
    { label: "Hoạt động", icon: "list" },
    { label: "Tìm gara", icon: "pin" },
  ];
  return (
    <Phone title="Rửa xe">
      <div>
        <PText size={12} tone="secondary">
          Chào buổi sáng
        </PText>
        <PText size={17} weight={700}>
          Nguyễn Văn An
        </PText>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {shortcuts.map((s) => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                border: `1px solid ${t.stroke.tertiary}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon kind={s.icon} />
            </div>
            <PText size={12} weight={500}>
              {s.label}
            </PText>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
        <PText size={15} weight={700}>
          Đang diễn ra
        </PText>
        <PText size={12} tone="link">
          Xem tất cả
        </PText>
      </div>
      {rows.map((r) => (
        <VisitCard key={r.key} row={r} variant="home" />
      ))}
      {reviewFor && (
        <div
          style={{
            border: `1px solid ${t.stroke.tertiary}`,
            borderRadius: 14,
            padding: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <PText size={12} tone="secondary">{`${reviewFor} vừa hoàn thành. Bạn thấy thế nào?`}</PText>
          <PhoneButton label="Đánh giá" small primary />
        </div>
      )}
    </Phone>
  );
}

function ListScreen({
  rows,
  tab,
  onTab,
  plate,
  onPlate,
}: {
  rows: VisitRow[];
  tab: Tab;
  onTab: (t: Tab) => void;
  plate: string;
  onPlate: (p: string) => void;
}) {
  const activeCount = rows.filter((r) => r.tab === "active").length;
  const visible = rows.filter((r) => r.tab === tab && (plate === "all" || r.plate === plate));
  const tabs: { id: Tab; label: string }[] = [
    { id: "active", label: activeCount > 0 ? `Đang diễn ra · ${activeCount}` : "Đang diễn ra" },
    { id: "past", label: "Đã qua" },
  ];
  const plates = ["all", "51K-100.00", "51K-123.45"];
  return (
    <Phone title="Hoạt động" back footer={<PhoneButton label="Đặt lịch mới" primary />}>
      <div style={{ display: "flex", margin: "-12px -12px 0", borderBottom: `1px solid ${t.stroke.tertiary}` }}>
        {tabs.map((x) => (
          <div
            key={x.id}
            onClick={() => onTab(x.id)}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "10px 0 8px",
              cursor: "pointer",
              borderBottom: `2px solid ${x.id === tab ? t.accent.primary : "transparent"}`,
            }}
          >
            <PText size={13} weight={x.id === tab ? 700 : 500} tone={x.id === tab ? "primary" : "tertiary"}>
              {x.label}
            </PText>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {plates.map((p) => (
          <span
            key={p}
            onClick={() => onPlate(p)}
            style={{
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 9999,
              cursor: "pointer",
              border: `1px solid ${p === plate ? t.text.primary : t.stroke.secondary}`,
              color: p === plate ? t.text.primary : t.text.secondary,
              fontWeight: p === plate ? 600 : 400,
            }}
          >
            {p === "all" ? "Tất cả xe" : p}
          </span>
        ))}
      </div>
      {visible.map((r) => (
        <VisitCard key={r.key} row={r} variant="list" />
      ))}
      {visible.length === 0 && (
        <PText size={12} tone="tertiary" style={{ textAlign: "center", marginTop: 24 }}>
          Không có lượt nào cho xe này
        </PText>
      )}
    </Phone>
  );
}

function qrCells(seed: string): boolean[][] {
  const n = 21;
  let h = 0;
  for (const ch of seed) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  const grid: boolean[][] = [];
  for (let y = 0; y < n; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < n; x++) {
      h = (Math.imul(h, 1103515245) + 12345) >>> 0;
      row.push(((h >>> 16) & 1) === 1);
    }
    grid.push(row);
  }
  const finder = (ox: number, oy: number) => {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const gx = ox + x;
        const gy = oy + y;
        if (gx < 0 || gy < 0 || gx >= n || gy >= n) continue;
        const inside = x >= 0 && x <= 6 && y >= 0 && y <= 6;
        const ring = inside && (x === 0 || y === 0 || x === 6 || y === 6);
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[gy][gx] = ring || core;
      }
    }
  };
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);
  return grid;
}

function Qr({ code }: { code: string }) {
  const cells = qrCells(code);
  return (
    <div
      style={{
        border: `1px solid ${t.stroke.tertiary}`,
        borderRadius: 14,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <svg width={112} height={112} viewBox="0 0 21 21" shapeRendering="crispEdges">
        {cells.flatMap((row, y) => row.map((on, x) => (on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={t.text.primary} /> : null)))}
      </svg>
      <PText size={14} weight={700} style={{ letterSpacing: 1, fontFamily: "ui-monospace, Menlo, monospace" }}>
        {code}
      </PText>
    </div>
  );
}

function MiniStepper({ steps, at }: { steps: string[]; at: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      {steps.map((label, i) => {
        const reached = i <= at;
        const dot = reached ? t.accent.primary : t.stroke.primary;
        const line = (from: number) => (from < at ? t.accent.primary : t.stroke.tertiary);
        return (
          <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              <div style={{ flex: 1, height: 2, background: i === 0 ? "transparent" : line(i - 1) }} />
              <div
                style={{
                  width: i === at ? 12 : 10,
                  height: i === at ? 12 : 10,
                  borderRadius: 6,
                  background: reached ? dot : "transparent",
                  border: `2px solid ${dot}`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, height: 2, background: i === steps.length - 1 ? "transparent" : line(i) }} />
            </div>
            <PText size={10} weight={i === at ? 700 : 400} tone={reached ? "primary" : "tertiary"} style={{ textAlign: "center" }}>
              {label}
            </PText>
          </div>
        );
      })}
    </div>
  );
}

function InfoRows({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ border: `1px solid ${t.stroke.tertiary}`, borderRadius: 14, padding: "4px 12px" }}>
      {rows.map(([k, v], i) => (
        <div
          key={k}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            padding: "8px 0",
            borderTop: i === 0 ? "none" : `1px solid ${t.stroke.tertiary}`,
          }}
        >
          <PText size={12} tone="secondary">
            {k}
          </PText>
          <PText size={12} weight={500} style={{ textAlign: "right" }}>
            {v}
          </PText>
        </div>
      ))}
    </div>
  );
}

function DetailScreen({ id, walkIn }: { id: StateId; walkIn: boolean }) {
  const s = STATES[id];
  const d = DETAIL[id];
  const steps = walkIn ? WALKIN_STEPS : BOOKED_STEPS;
  const at = walkIn ? s.step - 2 : s.step;
  const checkedIn = s.step >= 2;
  const address = "1 Nguyễn Huệ, Phường Sài Gòn";

  const info: [string, string][] = [];
  if (!checkedIn) info.push(["Thời gian", "Hôm nay 09:00"]);
  if (!checkedIn || id === "ready") info.push(["Địa chỉ", address]);
  info.push(["Xe", "51K-100.00"], ["Dịch vụ", "Rửa xe"], [checkedIn ? "Tổng" : "Tạm tính", "150.000đ"]);
  if (walkIn) info.push(["Mã đơn", ORDER_CODE]);
  else if (!checkedIn && !d.qr) info.push(["Mã đặt lịch", BOOKING_CODE]);

  const footer = (
    <Stack gap={8}>
      {d.note && (
        <PText size={11} tone="tertiary" style={{ textAlign: "center" }}>
          {d.note}
          <span style={{ color: t.text.link, fontWeight: 600 }}> · Huỷ lịch</span>
        </PText>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        {d.actions.map((a) => (
          <PhoneButton key={a.label} label={a.label} primary={a.primary} />
        ))}
      </div>
    </Stack>
  );

  return (
    <Phone title="Garage 1" back footer={footer}>
      <Stack gap={6}>
        <div>
          <Chip tone={s.tone}>{s.chip}</Chip>
        </div>
        <PText size={18} weight={700}>
          {d.headline}
        </PText>
        <PText size={12} tone="secondary">
          {d.sub}
        </PText>
      </Stack>
      {s.step >= 0 && (
        <div style={{ padding: "4px 0" }}>
          <MiniStepper steps={steps} at={at} />
        </div>
      )}
      {d.qr && <Qr code={BOOKING_CODE} />}
      {id === "completed" && (
        <div style={{ border: `1px solid ${t.stroke.tertiary}`, borderRadius: 14, padding: 12 }}>
          <PText size={12} tone="secondary">
            Bạn thấy dịch vụ thế nào?
          </PText>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <svg key={i} width={22} height={22} viewBox="0 0 20 20">
                <path
                  d="M10 2.5l2.3 4.8 5.2.7-3.8 3.6.9 5.2L10 14.3l-4.6 2.5.9-5.2L2.5 8l5.2-.7z"
                  fill="none"
                  stroke={t.text.tertiary}
                  strokeWidth={1.3}
                  strokeLinejoin="round"
                />
              </svg>
            ))}
          </div>
        </div>
      )}
      <InfoRows rows={info} />
      {id === "in_progress" && (
        <div style={{ border: `1px solid ${t.stroke.tertiary}`, borderRadius: 14, padding: 12 }}>
          <PText size={13} weight={600}>
            Lời dặn cho thợ
          </PText>
          <div style={{ marginTop: 8, border: `1px solid ${t.stroke.secondary}`, borderRadius: 10, padding: "8px 10px", minHeight: 44 }}>
            <PText size={12} tone="tertiary">
              Ví dụ: đừng thay nhớt loại 120k…
            </PText>
          </div>
        </div>
      )}
      {checkedIn && !walkIn && (
        <div
          style={{
            border: `1px solid ${t.stroke.tertiary}`,
            borderRadius: 14,
            padding: "10px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div>
            <PText size={12} weight={600}>
              Thông tin lịch hẹn
            </PText>
            <PText size={11} tone="tertiary">{`Hôm nay 09:00 · ${BOOKING_CODE}`}</PText>
          </div>
          <span style={{ color: t.text.tertiary, fontSize: 16 }}>›</span>
        </div>
      )}
    </Phone>
  );
}

export default function App() {
  const [stateId, setStateId] = useState<StateId>("in_progress");
  const [walkIn, setWalkIn] = useState(false);
  const [listTab, setListTab] = useState<Tab>("active");
  const [plate, setPlate] = useState("all");

  const s = STATES[stateId];
  const focus = focusRow(stateId, walkIn);
  const allRows = [focus, ...OTHER_ROWS];
  const homeRows = allRows.filter((r) => r.tab === "active");

  const pick = (id: StateId) => {
    setStateId(id);
    setListTab(STATES[id].tab);
  };
  const toggleWalkIn = () => {
    const next = !walkIn;
    setWalkIn(next);
    if (next && !STATES[stateId].walkIn) pick("in_progress");
  };

  return (
    <Stack gap={36} style={{ padding: "32px 24px 56px", maxWidth: 1100, margin: "0 auto" }}>
      <Stack gap={10}>
        <Text size="small" tone="tertiary">
          BonBon · VETC mini app · design proposal (draft for discussion)
        </Text>
        <H1>One visit instead of booking + order</H1>
        <Text tone="secondary" style={{ maxWidth: 820 }}>
          Today a car owner who books a wash sees two objects with two statuses: the booking (Lịch của tôi) and the order (Lịch sử). A booking can say
          “Hoàn thành” while the car is still being washed. This proposal shows the owner one visit (lượt rửa) with one status, one list, one code and
          one detail screen. The backend keeps bookings and orders as separate records.
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>Today's screens</H2>
        <Text size="small" tone="secondary">
          Captured from the real VETC build with mocked data. One owner has a booking already checked in (car still being washed), a booking 15
          minutes late, and one for tomorrow. Click an image to open it full size.
        </Text>
        <div className="gallery">
          {GALLERY.map((g) => (
            <figure key={g.file}>
              <a href={shot(g.file)} target="_blank" rel="noreferrer">
                <img src={shot(g.file)} alt={g.caption} loading="lazy" />
              </a>
              <figcaption style={{ marginTop: 6, fontSize: 12, lineHeight: "16px", color: t.text.secondary }}>{g.caption}</figcaption>
            </figure>
          ))}
        </div>
      </Stack>

      <Stack gap={12}>
        <H2>Prototype: follow one visit</H2>
        <Text size="small" tone="secondary">
          Pick a moment in the visit for Garage 1, plate 51K-100.00. All three screens update together and show the same status word. The shaded card is
          the visit you are following. The list tabs and plate filters can be clicked.
        </Text>
        <Row gap={8} wrap align="center">
          {STATE_ORDER.map((id) => (
            <Pill key={id} active={id === stateId} disabled={walkIn && !STATES[id].walkIn} onClick={() => pick(id)}>
              {STATES[id].label}
            </Pill>
          ))}
          <span style={{ width: 12 }} />
          <Pill active={walkIn} onClick={toggleWalkIn}>
            Khách vãng lai (không đặt lịch)
          </Pill>
        </Row>

        <Grid columns={3} gap={20} align="start" className="phones">
          <Stack gap={6} style={{ width: "100%", maxWidth: 320 }}>
            <Text size="small" weight="semibold" tone="secondary">
              Home
            </Text>
            <HomeScreen rows={homeRows} reviewFor={stateId === "completed" ? "Garage 1" : undefined} />
          </Stack>
          <Stack gap={6} style={{ width: "100%", maxWidth: 320 }}>
            <Text size="small" weight="semibold" tone="secondary">
              Hoạt động (replaces Lịch của tôi + Lịch sử)
            </Text>
            <ListScreen rows={allRows} tab={listTab} onTab={setListTab} plate={plate} onPlate={setPlate} />
          </Stack>
          <Stack gap={6} style={{ width: "100%", maxWidth: 320 }}>
            <Text size="small" weight="semibold" tone="secondary">
              Visit detail (replaces booking + order detail)
            </Text>
            <DetailScreen id={stateId} walkIn={walkIn} />
          </Stack>
        </Grid>

        <Callout title={`What “${s.label}” replaces`}>
          <Text size="small">{walkIn ? "Walk-ins look the same, minus the two booking steps and with the order code instead of a booking code." : s.today}</Text>
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>Today vs proposed, screen by screen</H2>
        <Table
          headers={["Screen", "Today", "Proposed", ""]}
          rows={TODAY_VS_PROPOSED.map((r) => [
            <Text size="small" weight="semibold">
              {r.screen}
            </Text>,
            <Text size="small" tone="secondary">
              {r.today}
            </Text>,
            <Text size="small">{r.proposed}</Text>,
            <a href={shot(r.shot)} target="_blank" rel="noreferrer" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
              Screenshot
            </a>,
          ])}
        />
      </Stack>

      <Stack gap={14}>
        <H2>Design rules</H2>
        <Grid columns={3} gap={24} className="rules">
          {RULES.map((r) => (
            <Stack key={r.title} gap={4}>
              <Text weight="semibold">{r.title}</Text>
              <Text size="small" tone="secondary">
                {r.body}
              </Text>
            </Stack>
          ))}
        </Grid>
      </Stack>

      <Divider />

      <Grid columns={2} gap={28} align="start" className="two-col">
        <Stack gap={12}>
          <H2>Navigation</H2>
          <Table
            headers={["Today", "Proposed"]}
            rows={ROUTES.map(([a, b]) => [
              <Text size="small">{a}</Text>,
              <Text size="small">{b}</Text>,
            ])}
          />
        </Stack>
        <Stack gap={12}>
          <H2>What the screens need from the API</H2>
          <Table
            headers={["Field per visit", "Used for"]}
            rows={API_NEEDS.map(([a, b]) => [
              <Text size="small">{a}</Text>,
              <Text size="small" tone="secondary">
                {b}
              </Text>,
            ])}
          />
        </Stack>
      </Grid>
    </Stack>
  );
}
